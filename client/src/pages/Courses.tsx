import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCompare } from "@/contexts/CompareContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  SlidersHorizontal,
  Heart,
  BarChart2,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Course } from "../../../drizzle/schema";
import { getLoginUrl } from "@/const";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { getLocalFavoriteIds, setLocalFavoriteIds } from "./Favorites";
import type { DSEScoreData } from "./DSEScores";

// ─── DSE Score Helpers ────────────────────────────────────────────────────────
const DSE_COOKIE_KEY = "jupasearch_dse_scores";
const DEFAULT_DSE: DSEScoreData = {
  chinese: "—", english: "—", math: "—", mathExtended: "—", civics: "達標",
  elective1Subject: "", elective1Grade: "—",
  elective2Subject: "", elective2Grade: "—",
  elective3Subject: "", elective3Grade: "—",
  elective4Subject: "", elective4Grade: "—",
  appliedLearningSubject: "", appliedLearningGrade: "—",
  otherLanguage: "", otherLanguageGrade: "—",
};

function loadDseFromCookie(): DSEScoreData | null {
  try {
    const raw = document.cookie.split("; ").find((r) => r.startsWith(DSE_COOKIE_KEY + "="));
    if (!raw) return null;
    const val = decodeURIComponent(raw.split("=")[1] ?? "");
    const parsed = JSON.parse(val);
    // Check if any score is actually entered
    const hasScore = ["chinese","english","math"].some(k => parsed[k] && parsed[k] !== "—");
    return hasScore ? { ...DEFAULT_DSE, ...parsed } : null;
  } catch { return null; }
}

function dseGradeToScore(grade: string): number {
  const map: Record<string, number> = {
    "5**": 7, "5*": 6, "5": 5, "4": 4, "3": 3, "2": 2, "1": 1, "U": 0, "—": 0,
  };
  return map[grade] ?? 0;
}

function computeMyScore(course: Course, dse: DSEScoreData): number | null {
  const formula = (course as any).scoreFormula;
  if (!formula) return null;

  // Build score map
  const scoreMap: Record<string, number> = {};
  scoreMap["chinese"] = dseGradeToScore(dse.chinese);
  scoreMap["english"] = dseGradeToScore(dse.english);
  scoreMap["math"] = dseGradeToScore(dse.math);
  // mathExtended stores the subject key ("m1" or "m2"), not the grade
  // The grade is stored in elective slots if user selected M1/M2 as elective
  // For simplicity, we skip M1/M2 here as they are typically counted as electives
  // Electives
  [[dse.elective1Subject, dse.elective1Grade],[dse.elective2Subject, dse.elective2Grade],[dse.elective3Subject, dse.elective3Grade]]
    .forEach(([subj, grade]) => { if (subj) scoreMap[subj] = dseGradeToScore(grade); });
  // Applied Learning
  if (dse.appliedLearningSubject) {
    const alMap: Record<string, number> = { "達標並表現優異（I）": 3, "達標並表現優異（II）": 4, "達標": 2, "未達標": 0 };
    scoreMap[dse.appliedLearningSubject] = alMap[dse.appliedLearningGrade] ?? 0;
  }
  // Other language
  if (dse.otherLanguage) {
    const olMap: Record<string, number> = { C2: 5, C1: 4, B2: 3, B1: 2, A2: 1, N1: 5, N2: 4, N3: 3, "第 6 級": 5, "第 5 級": 4, "第 4 級": 3, "第 3 級": 2, "A++": 5, "A+": 5, "A": 4, "B++": 4, "B+": 3, "B": 3, "C": 2, "D": 1, "E": 1 };
    scoreMap[dse.otherLanguage] = olMap[dse.otherLanguageGrade] ?? 0;
  }

  // Apply weightings
  const weightedMap: Record<string, number> = { ...scoreMap };
  for (const w of (formula.weighted ?? [])) {
    if (weightedMap[w.subject] !== undefined) weightedMap[w.subject] = weightedMap[w.subject] * w.multiplier;
  }

  const excluded = new Set(formula.excluded ?? []);
  const available = Object.entries(weightedMap).filter(([k]) => !excluded.has(k)).map(([k, v]) => ({ subject: k, score: v }));
  const required = new Set(formula.required ?? []);
  const requiredEntries = available.filter(e => required.has(e.subject));
  const optionalEntries = available.filter(e => !required.has(e.subject));
  optionalEntries.sort((a, b) => b.score - a.score);

  const method = formula.method ?? "best5";
  let total = 0;
  if (method === "best5" || method === "best6" || method === "best4") {
    const n = method === "best4" ? 4 : method === "best6" ? 6 : 5;
    const pool = [...requiredEntries, ...optionalEntries];
    pool.sort((a, b) => b.score - a.score);
    total = pool.slice(0, n).reduce((s, e) => s + e.score, 0);
  } else if (method === "2c3x") {
    const coreSubjects = new Set(formula.coreSubjects ?? ["chinese", "english", "math"]);
    const coreEntries = available.filter(e => coreSubjects.has(e.subject)).sort((a, b) => b.score - a.score).slice(0, 2);
    const electiveEntries = available.filter(e => !coreSubjects.has(e.subject)).sort((a, b) => b.score - a.score).slice(0, 3);
    total = [...coreEntries, ...electiveEntries].reduce((s, e) => s + e.score, 0);
  }
  return Math.round(total * 100) / 100;
}

// DSE grade order for comparison
const DSE_GRADE_ORDER = ["U", "1", "2", "3", "4", "5", "5*", "5**", "—"];
const CHINESE_GRADE_ORDER = ["U", "1", "2", "3", "4", "5", "5*", "5**", "—"];

function gradeAtLeast(userGrade: string, minGrade: string): boolean {
  if (!userGrade || userGrade === "—") return false;
  const order = DSE_GRADE_ORDER;
  const userIdx = order.indexOf(userGrade);
  const minIdx = order.indexOf(minGrade);
  if (userIdx === -1 || minIdx === -1) return userGrade === minGrade;
  return userIdx >= minIdx;
}

function checkMeetsMinRequirement(course: Course, dse: DSEScoreData | null): boolean {
  if (!dse) return true; // if no DSE scores, don't filter
  const req = course.minRequirement;
  if (!req) return true; // no requirement set, assume meets

  // Parse minRequirement string like "332A33" or "332A22" or "222A22"
  // Format: Chinese(1) English(1) Math(1) Civics(A=達標) Elective1(1) Elective2(1)
  // Grade mapping: 2=level2, 3=level3, A=達標
  const reqMap: Record<string, string> = {
    "2": "2", "3": "3", "4": "4", "5": "5", "A": "達標",
  };

  if (req.length >= 3) {
    const chineseReq = reqMap[req[0]] ?? req[0];
    const englishReq = reqMap[req[1]] ?? req[1];
    const mathReq = reqMap[req[2]] ?? req[2];

    if (!gradeAtLeast(dse.chinese, chineseReq)) return false;
    if (!gradeAtLeast(dse.english, englishReq)) return false;
    if (!gradeAtLeast(dse.math, mathReq)) return false;
  }

  // Check specific subject requirements from scoreFormula.minSubjectRequirements
  const formula = (course as any).scoreFormula;
  if (formula?.minSubjectRequirements) {
    const userSubjects: Record<string, string> = {
      chinese: dse.chinese, english: dse.english, math: dse.math,
      [dse.elective1Subject]: dse.elective1Grade,
      [dse.elective2Subject]: dse.elective2Grade,
      [dse.elective3Subject]: dse.elective3Grade,
      [dse.elective4Subject ?? ""]: dse.elective4Grade ?? "—",
    };
    for (const subReq of formula.minSubjectRequirements) {
      const userGrade = userSubjects[subReq.subject];
      if (!userGrade || !gradeAtLeast(userGrade, subReq.minGrade)) return false;
    }
  }

  return true;
}

function getScoreColor(score: number, q1: number | null | undefined, median: number | null | undefined): "red" | "yellow" | "green" | "gray" {
  if (!q1 && !median) return "gray";
  const q1Val = q1 ? Number(q1) : 0;
  const medianVal = median ? Number(median) : 0;
  if (score < q1Val) return "red";
  if (score < medianVal) return "yellow";
  return "green";
}

// ─── Constants ────────────────────────────────────────────────────────────────
// Institution key → { zhTw, zhCn, en }
const INSTITUTION_MAP: Record<string, { zhTw: string; zhCn: string; en: string }> = {
  "香港城市大學":     { zhTw: "香港城市大學",     zhCn: "香港城市大学",     en: "City University of Hong Kong" },
  "香港浸會大學":     { zhTw: "香港浸會大學",     zhCn: "香港浸会大学",     en: "Hong Kong Baptist University" },
  "嶺南大學":         { zhTw: "嶺南大學",         zhCn: "岭南大学",         en: "Lingnan University" },
  "香港中文大學":     { zhTw: "香港中文大學",     zhCn: "香港中文大学",     en: "The Chinese University of Hong Kong" },
  "香港教育大學":     { zhTw: "香港教育大學",     zhCn: "香港教育大学",     en: "The Education University of Hong Kong" },
  "香港理工大學":     { zhTw: "香港理工大學",     zhCn: "香港理工大学",     en: "The Hong Kong Polytechnic University" },
  "香港科技大學":     { zhTw: "香港科技大學",     zhCn: "香港科技大学",     en: "The Hong Kong University of Science and Technology" },
  "香港大學":         { zhTw: "香港大學",         zhCn: "香港大学",         en: "The University of Hong Kong" },
  "香港都會大學":     { zhTw: "香港都會大學",     zhCn: "香港都会大学",     en: "Hong Kong Metropolitan University" },
  "港珠海學院":       { zhTw: "港珠海學院",       zhCn: "港珠海学院",       en: "Hang Seng University of Hong Kong" },
  "香港樹仁大學":     { zhTw: "香港樹仁大學",     zhCn: "香港树仁大学",     en: "Shue Yan University" },
  "聖方濟各大學":     { zhTw: "聖方濟各大學",     zhCn: "圣方济各大学",     en: "Saint Francis University" },
  "香港高等教育科技學院": { zhTw: "香港高等教育科技學院", zhCn: "香港高等教育科技学院", en: "THEi" },
  "香港恒生大學":     { zhTw: "香港恒生大學",     zhCn: "香港恒生大学",     en: "Hang Seng University of Hong Kong" },
  "東華學院":         { zhTw: "東華學院",         zhCn: "东华学院",         en: "Tung Wah College" },
  "香港伍倫貢學院":   { zhTw: "香港伍倫貢學院",   zhCn: "香港伍伦贡学院",   en: "UOWCHK" },
};

const INSTITUTIONS = Object.keys(INSTITUTION_MAP);

// Degree types with full names
const DEGREE_TYPES_MAP: Record<string, { zhTw: string; zhCn: string; en: string }> = {
  "BA":     { zhTw: "BA 文學士",      zhCn: "BA 文学士",      en: "BA Bachelor of Arts" },
  "BSc":    { zhTw: "BSc 理學士",     zhCn: "BSc 理学士",     en: "BSc Bachelor of Science" },
  "BEng":   { zhTw: "BEng 工程學士", zhCn: "BEng 工程学士", en: "BEng Bachelor of Engineering" },
  "BEd":    { zhTw: "BEd 教育學士",  zhCn: "BEd 教育学士",  en: "BEd Bachelor of Education" },
  "LLB":    { zhTw: "LLB 法學士",    zhCn: "LLB 法学士",    en: "LLB Bachelor of Laws" },
  "BBA":    { zhTw: "BBA 工商管理學士", zhCn: "BBA 工商管理学士", en: "BBA Bachelor of Business Administration" },
  "BNurs":  { zhTw: "BNurs 護理學士", zhCn: "BNurs 护理学士", en: "BNurs Bachelor of Nursing" },
  "BPharm": { zhTw: "BPharm 藥學士", zhCn: "BPharm 药学士", en: "BPharm Bachelor of Pharmacy" },
  "BArch":  { zhTw: "BArch 建築學士", zhCn: "BArch 建筑学士", en: "BArch Bachelor of Architecture" },
  "BSW":    { zhTw: "BSW 社工學士",  zhCn: "BSW 社工学士",  en: "BSW Bachelor of Social Work" },
  "BSSc":   { zhTw: "BSSc 社科學士", zhCn: "BSSc 社科学士", en: "BSSc Bachelor of Social Science" },
  "BFA":    { zhTw: "BFA 美術學士",  zhCn: "BFA 美术学士",  en: "BFA Bachelor of Fine Arts" },
  "BMus":   { zhTw: "BMus 音樂學士", zhCn: "BMus 音乐学士", en: "BMus Bachelor of Music" },
};
const DEGREE_TYPES = Object.keys(DEGREE_TYPES_MAP);

const SCORING_METHODS = ["best5", "best6", "best4", "2c3x"];
const SCORE_GAPS = ["above_median", "above_q1", "below_q1", "between_median_q1"];
// Removed self_financed per user request
const FUNDING_TYPES = ["ugc", "nmtss", "sssdp"];
const RETAKE_POLICIES = ["yes_no_penalty", "yes_with_penalty", "no"];
// Updated interview options per user request #29
const INTERVIEW_OPTIONS = [
  "yes_all",
  "yes_selective",
  "may_require",
  "special_cases",
  "no",
];
const DURATIONS = [2, 4, 5, 6];
const QUALIFICATIONS = ["bachelor", "higher_diploma", "associate_degree"];
const SORT_OPTIONS = [
  "quota_desc", "quota_asc", "tuition_desc", "tuition_asc",
  "probability_desc", "probability_asc", "groupA_desc", "groupA_asc",
  "applicants_desc", "applicants_asc",
];

function formatTuition(fee: number | null | undefined): string {
  if (!fee) return "—";
  return `$${fee.toLocaleString()}`;
}

function formatScore(score: string | number | null | undefined): string {
  if (!score) return "—";
  return String(score);
}

// ─── Course Card ──────────────────────────────────────────────────────────────
function CourseCard({
  course,
  isFavorite,
  onToggleFavorite,
  onAddToChoices,
  dseScores,
}: {
  course: Course;
  isFavorite: boolean;
  onToggleFavorite: (course: Course) => void;
  onAddToChoices: (course: Course) => void;
  dseScores: DSEScoreData | null;
}) {
  const { t, language } = useLanguage();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const inCompare = isInCompare(course.id);

  // My Score calculation
  const myScore = dseScores ? computeMyScore(course, dseScores) : null;
  const scoreColor = myScore !== null ? getScoreColor(myScore, course.lastYearQ1 ? Number(course.lastYearQ1) : null, course.lastYearMedian ? Number(course.lastYearMedian) : null) : null;

  const name = language === "zh-CN" ? (course.nameZhCn || course.nameZhTw) :
    language === "en" ? (course.nameEn || course.nameZhTw) : course.nameZhTw;

  const institutionName = (() => {
    const key = course.institution;
    const map = INSTITUTION_MAP[key];
    if (!map) return key;
    if (language === "zh-CN") return course.institutionZhCn || map.zhCn;
    if (language === "en") return course.institutionEn || map.en;
    return key;
  })();

  const fundingLabel = course.fundingType ? t(`funding.${course.fundingType}`) : null;

  return (
    <div className="group relative bg-card border border-border rounded-xl p-4 hover:border-foreground/20 hover:shadow-md transition-all duration-200">
      {/* Badges row */}
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        {course.jupasCode && (
          <span className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded">
            {course.jupasCode}
          </span>
        )}
        {course.degreeType && (
          <span className="text-xs font-medium bg-foreground text-background px-2 py-0.5 rounded">
            {course.degreeType}
          </span>
        )}
        {fundingLabel && (
          <span className="text-xs text-muted-foreground border border-border px-2 py-0.5 rounded">
            {fundingLabel}
          </span>
        )}
        {course.isNew && <span className="badge-new">{t("courses.new")}</span>}
        {course.scoringMethodChanged && <span className="badge-changed">{t("courses.scoringChanged")}</span>}
        {course.groupAOnly && <span className="badge-groupA">{t("courses.groupAOnly")}</span>}
      </div>

      {/* Course name */}
      <Link href={`/courses/${course.id}`}>
        <h3 className="font-semibold text-sm leading-snug mb-1 hover:underline cursor-pointer line-clamp-2">
          {name}
        </h3>
      </Link>
      <p className="text-xs text-muted-foreground mb-3">{institutionName}</p>

      {/* Stats grid — more data */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <StatCell label={t("courses.col.quota")} value={course.quota?.toString() ?? "—"} />
        <StatCell label={t("courses.col.median")} value={formatScore(course.lastYearMedian)} />
        <StatCell label={t("courses.col.q1")} value={formatScore(course.lastYearQ1)} />
        <StatCell label={t("courses.col.minReq")} value={course.minRequirement ?? "—"} />
        <StatCell label={t("courses.col.tuition")} value={formatTuition(course.tuitionFee)} />
        <StatCell
          label={t("courses.col.admitted")}
          value={course.lastYearAdmitted
            ? `${course.lastYearAdmitted}${course.lastYearGroupAAdmitted ? ` (${course.lastYearGroupAAdmitted}A)` : ""}`
            : "—"}
        />
      </div>
      {/* Second row of stats */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <StatCell label={t("courses.col.totalApplicants")} value={course.lastYearTotalApplicants?.toString() ?? "—"} />
        <StatCell label={t("courses.col.groupAApplicants")} value={course.lastYearGroupAApplicants?.toString() ?? "—"} />
        <StatCell label={t("courses.col.duration")} value={course.duration ? `${course.duration}${language === "en" ? "yr" : "年"}` : "—"} />
      </div>

      {/* My Score row */}
      {dseScores && (
        <div className={cn(
          "flex items-center justify-between px-2 py-1 rounded-md mb-2 text-xs",
          myScore === null ? "bg-muted/50 text-muted-foreground" :
          scoreColor === "red" ? "bg-red-500/15 text-red-600 dark:text-red-400" :
          scoreColor === "yellow" ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400" :
          scoreColor === "green" ? "bg-green-500/15 text-green-600 dark:text-green-400" :
          "bg-muted/50 text-muted-foreground"
        )}>
          <span className="font-medium">
            {language === "en" ? "My Score" : language === "zh-CN" ? "我的分数" : "我的分數"}
          </span>
          <span className="font-bold">
            {myScore === null
              ? (language === "en" ? "No formula" : "未設定公式")
              : myScore.toFixed(2)}
          </span>
        </div>
      )}
      {!dseScores && (course as any).scoreFormula && (
        <div className="flex items-center justify-between px-2 py-1 rounded-md mb-2 text-xs bg-muted/30 text-muted-foreground">
          <span>{language === "en" ? "My Score" : language === "zh-CN" ? "我的分数" : "我的分數"}</span>
          <span>
            <Link href="/dse-scores" className="underline hover:text-foreground">
              {language === "en" ? "Enter DSE scores" : language === "zh-CN" ? "输入DSE成绩" : "輸入DSE成績"}
            </Link>
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-border">
        <Link href={`/courses/${course.id}`} className="flex-1">
          <Button variant="ghost" size="sm" className="w-full text-xs h-7">
            {t("courses.viewDetail")}
          </Button>
        </Link>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-7 w-7", isFavorite && "text-red-500")}
              onClick={() => onToggleFavorite(course)}
            >
              <Heart className={cn("w-3.5 h-3.5", isFavorite && "fill-current")} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isFavorite ? t("courses.removeFromFavorites") : t("courses.addToFavorites")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-7 w-7", inCompare && "text-blue-500")}
              onClick={() => inCompare ? removeFromCompare(course.id) : addToCompare(course)}
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("courses.addToCompare")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onAddToChoices(course)}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("courses.addToChoices")}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-xs font-medium">{value}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{label}</div>
    </div>
  );
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────
function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{title}</h4>
      {children}
    </div>
  );
}

function CheckboxGroup({
  options,
  selected,
  onChange,
  labelFn,
}: {
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
  labelFn?: (v: string) => string;
}) {
  const toggle = (v: string) => {
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  };
  return (
    <div className="space-y-1.5">
      {options.map((opt) => (
        <div key={opt} className="flex items-center gap-2">
          <Checkbox
            id={`chk-${opt}`}
            checked={selected.includes(opt)}
            onCheckedChange={() => toggle(opt)}
            className="w-3.5 h-3.5"
          />
          <Label htmlFor={`chk-${opt}`} className="text-xs cursor-pointer leading-none">
            {labelFn ? labelFn(opt) : opt}
          </Label>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Courses() {
  const { t, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // Filters state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [degreeTypes, setDegreeTypes] = useState<string[]>([]);
  const [institutions, setInstitutions] = useState<string[]>([]);
  const [durations, setDurations] = useState<number[]>([]);
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [scoringMethods, setScoringMethods] = useState<string[]>([]);
  const [scoreGaps, setScoreGaps] = useState<string[]>([]);
  const [fundingTypes, setFundingTypes] = useState<string[]>([]);
  const [interviewArrangements, setInterviewArrangements] = useState<string[]>([]);
  const [groupAOnly, setGroupAOnly] = useState<boolean | undefined>(undefined);
  const [flexibleAdmission, setFlexibleAdmission] = useState<boolean | undefined>(undefined);
  const [retakePolicies, setRetakePolicies] = useState<string[]>([]);
  const [tuitionMin, setTuitionMin] = useState<string>("");
  const [tuitionMax, setTuitionMax] = useState<string>("");
  const [debouncedTuitionMin, setDebouncedTuitionMin] = useState<string>("");
  const [debouncedTuitionMax, setDebouncedTuitionMax] = useState<string>("");
  const [sortBy, setSortBy] = useState("id");
  const [onlyMeetMinReq, setOnlyMeetMinReq] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 24;

  // DSE scores from cookie (for "My Score" calculation)
  const [dseScores] = useState<DSEScoreData | null>(() => loadDseFromCookie());

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Debounce tuition inputs to avoid re-render on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTuitionMin(tuitionMin);
      setPage(1);
    }, 600);
    return () => clearTimeout(timer);
  }, [tuitionMin]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTuitionMax(tuitionMax);
      setPage(1);
    }, 600);
    return () => clearTimeout(timer);
  }, [tuitionMax]);

  const parsedTuitionMin = debouncedTuitionMin ? parseInt(debouncedTuitionMin.replace(/\D/g, "")) : undefined;
  const parsedTuitionMax = debouncedTuitionMax ? parseInt(debouncedTuitionMax.replace(/\D/g, "")) : undefined;

  const queryInput = useMemo(() => ({
    search: debouncedSearch || undefined,
    degreeTypes: degreeTypes.length ? degreeTypes : undefined,
    institutions: institutions.length ? institutions : undefined,
    durations: durations.length ? durations : undefined,
    qualifications: qualifications.length ? qualifications : undefined,
    scoringMethods: scoringMethods.length ? scoringMethods : undefined,
    scoreGaps: scoreGaps.length ? scoreGaps : undefined,
    fundingTypes: fundingTypes.length ? fundingTypes : undefined,
    interviewArrangements: interviewArrangements.length ? interviewArrangements : undefined,
    groupAOnly,
    flexibleAdmission,
    acceptMultipleSittings: retakePolicies.length ? retakePolicies : undefined,
    tuitionMin: parsedTuitionMin,
    tuitionMax: parsedTuitionMax,
    moduleType: "jupas" as const,
    sortBy,
    page,
    pageSize: PAGE_SIZE,
  }), [debouncedSearch, degreeTypes, institutions, durations, qualifications, scoringMethods, scoreGaps, fundingTypes, interviewArrangements, groupAOnly, flexibleAdmission, retakePolicies, parsedTuitionMin, parsedTuitionMax, sortBy, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data, isLoading } = trpc.courses.list.useQuery(queryInput);
  const rawCourses = data?.courses ?? [];
  // Client-side filter: only show courses that meet minimum requirements
  const courses = useMemo(() => {
    if (!onlyMeetMinReq || !dseScores) return rawCourses;
    return rawCourses.filter((c) => checkMeetsMinRequirement(c, dseScores));
  }, [rawCourses, onlyMeetMinReq, dseScores]);
  const total = onlyMeetMinReq ? courses.length : (data?.total ?? 0);
  const totalPages = onlyMeetMinReq ? 1 : Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  // Favorites — server or local
  const { data: serverFavoriteIds = [] } = trpc.favorites.ids.useQuery(undefined, { enabled: isAuthenticated });
  const [localFavIds, setLocalFavIds] = useState<number[]>(() => getLocalFavoriteIds());
  const favoriteIds = isAuthenticated ? serverFavoriteIds : localFavIds;

  const utils = trpc.useUtils();
  const addFav = trpc.favorites.add.useMutation({
    onSuccess: () => utils.favorites.ids.invalidate(),
    onError: (err) => {
      // Intercept UNAUTHORIZED so global redirect in main.tsx is not triggered for guest users
      if (err.message === UNAUTHED_ERR_MSG) {
        toast.error(language === "en" ? "Please login to save favorites" : language === "zh-CN" ? "请登录以保存收藏" : "請登入以儲存收藏", {
          action: { label: language === "en" ? "Login" : "登入", onClick: () => { window.location.href = getLoginUrl(); } },
        });
      } else {
        toast.error(err.message);
      }
    },
  });
  const removeFav = trpc.favorites.remove.useMutation({
    onSuccess: () => utils.favorites.ids.invalidate(),
    onError: (err) => {
      if (err.message === UNAUTHED_ERR_MSG) {
        toast.error(language === "en" ? "Please login to save favorites" : language === "zh-CN" ? "请登录以保存收藏" : "請登入以儲存收藏", {
          action: { label: language === "en" ? "Login" : "登入", onClick: () => { window.location.href = getLoginUrl(); } },
        });
      } else {
        toast.error(err.message);
      }
    },
  });

  const handleToggleFavorite = useCallback((course: Course) => {
    if (isAuthenticated) {
      if (favoriteIds.includes(course.id)) {
        removeFav.mutate({ courseId: course.id });
        toast.success(t("courses.removeFromFavorites"));
      } else {
        addFav.mutate({ courseId: course.id });
        toast.success(t("courses.addToFavorites"));
      }
    } else {
      const current = getLocalFavoriteIds();
      let updated: number[];
      if (current.includes(course.id)) {
        updated = current.filter((id) => id !== course.id);
        toast.success(t("courses.removeFromFavorites"));
      } else {
        updated = [...current, course.id];
        toast.success(t("courses.addToFavorites"));
      }
      setLocalFavoriteIds(updated);
      setLocalFavIds(updated);
    }
  }, [isAuthenticated, favoriteIds, addFav, removeFav, t]);

  const handleAddToChoices = useCallback((course: Course) => {
    // Add to pending staging area (jupasearch_choices_pending)
    const LS_PENDING = "jupasearch_choices_pending";
    const LS_CHOICES = "jupasearch_choices";
    try {
      const rawPending = localStorage.getItem(LS_PENDING);
      const pending: number[] = rawPending ? JSON.parse(rawPending) : [];
      const rawChoices = localStorage.getItem(LS_CHOICES);
      const choices: { courseId: number }[] = rawChoices ? JSON.parse(rawChoices) : [];
      if (pending.includes(course.id) || choices.find((c) => c.courseId === course.id)) {
        toast.info(language === "en" ? "Already in pending or choices" : language === "zh-CN" ? "已在待加入或志愿表中" : "已在待加入或志願表中");
        return;
      }
      localStorage.setItem(LS_PENDING, JSON.stringify([...pending, course.id]));
    } catch { /* ignore */ }
    const courseName = language === "zh-CN" ? (course.nameZhCn || course.nameZhTw) : language === "en" ? (course.nameEn || course.nameZhTw) : course.nameZhTw;
    toast.success(
      language === "en" ? `Added to pending: ${courseName}` :
      language === "zh-CN" ? `已加入待加入区：${courseName}` :
      `已加入待加入區：${courseName}`,
      { description: language === "en" ? "Go to Choices page to add to your list" : language === "zh-CN" ? "前往志愿页面将其加入志愿表" : "前往志願頁面將其加入志願表" }
    );
  }, [language]);

  const clearFilters = () => {
    setSearch(""); setDebouncedSearch("");
    setDegreeTypes([]); setInstitutions([]); setDurations([]);
    setQualifications([]); setScoringMethods([]); setScoreGaps([]);
    setFundingTypes([]); setInterviewArrangements([]);
    setGroupAOnly(undefined); setFlexibleAdmission(undefined); setRetakePolicies([]);
    setTuitionMin(""); setTuitionMax("");
    setOnlyMeetMinReq(false);
    setSortBy("id"); setPage(1);
  };

  const hasActiveFilters = degreeTypes.length > 0 || institutions.length > 0 || durations.length > 0 ||
    qualifications.length > 0 || scoringMethods.length > 0 || scoreGaps.length > 0 ||
    fundingTypes.length > 0 || interviewArrangements.length > 0 ||
    groupAOnly !== undefined || flexibleAdmission !== undefined || retakePolicies.length > 0 ||
    tuitionMin !== "" || tuitionMax !== "" || onlyMeetMinReq;

  // Institution display name based on language
  const getInstitutionLabel = (key: string) => {
    const map = INSTITUTION_MAP[key];
    if (!map) return key;
    if (language === "zh-CN") return map.zhCn;
    if (language === "en") return map.en;
    return map.zhTw;
  };

  // Degree type display name based on language
  const getDegreeLabel = (key: string) => {
    const map = DEGREE_TYPES_MAP[key];
    if (!map) return key;
    if (language === "zh-CN") return map.zhCn;
    if (language === "en") return map.en;
    return map.zhTw;
  };

  const FilterContent = () => (
    <div className="space-y-1">
      <FilterSection title={t("courses.filter.degreeType")}>
        <CheckboxGroup
          options={DEGREE_TYPES}
          selected={degreeTypes}
          onChange={(v) => { setDegreeTypes(v); setPage(1); }}
          labelFn={getDegreeLabel}
        />
      </FilterSection>
      <Separator />
      <FilterSection title={t("courses.filter.institution")}>
        <CheckboxGroup
          options={INSTITUTIONS}
          selected={institutions}
          onChange={(v) => { setInstitutions(v); setPage(1); }}
          labelFn={getInstitutionLabel}
        />
      </FilterSection>
      <Separator />
      <FilterSection title={t("courses.filter.duration")}>
        <CheckboxGroup
          options={DURATIONS.map(String)}
          selected={durations.map(String)}
          onChange={(v) => { setDurations(v.map(Number)); setPage(1); }}
          labelFn={(v) => t("duration.years").replace("{n}", v)}
        />
      </FilterSection>
      <Separator />
      <FilterSection title={t("courses.filter.qualification")}>
        <CheckboxGroup
          options={QUALIFICATIONS}
          selected={qualifications}
          onChange={(v) => { setQualifications(v); setPage(1); }}
          labelFn={(v) => t(`qual.${v}`)}
        />
      </FilterSection>
      <Separator />
      <FilterSection title={t("courses.filter.scoring")}>
        <CheckboxGroup
          options={SCORING_METHODS}
          selected={scoringMethods}
          onChange={(v) => { setScoringMethods(v); setPage(1); }}
          labelFn={(v) => v === "best5" ? "Best 5" : v === "best6" ? "Best 6" : v === "best4" ? "Best 4" : "2C+3X"}
        />
      </FilterSection>
      <Separator />
      <FilterSection title={t("courses.filter.scoreGap")}>
        <CheckboxGroup
          options={SCORE_GAPS}
          selected={scoreGaps}
          onChange={(v) => { setScoreGaps(v); setPage(1); }}
          labelFn={(v) => t(`scoreGap.${v}`)}
        />
      </FilterSection>
      <Separator />
      <FilterSection title={t("courses.filter.funding")}>
        <CheckboxGroup
          options={FUNDING_TYPES}
          selected={fundingTypes}
          onChange={(v) => { setFundingTypes(v); setPage(1); }}
          labelFn={(v) => t(`funding.${v}`)}
        />
      </FilterSection>
      <Separator />
      <FilterSection title={t("courses.filter.interview")}>
        <CheckboxGroup
          options={INTERVIEW_OPTIONS}
          selected={interviewArrangements}
          onChange={(v) => { setInterviewArrangements(v); setPage(1); }}
          labelFn={(v) => t(`interview.${v}`)}
        />
      </FilterSection>
      <Separator />
      <FilterSection title={t("courses.filter.groupA")}>
        <div className="flex items-center gap-2">
          <Checkbox
            id="chk-groupA"
            checked={groupAOnly === true}
            onCheckedChange={(checked) => { setGroupAOnly(checked ? true : undefined); setPage(1); }}
            className="w-3.5 h-3.5"
          />
          <Label htmlFor="chk-groupA" className="text-xs cursor-pointer">
            {t("courses.groupAOnly")}
          </Label>
        </div>
      </FilterSection>
      <Separator />
      <FilterSection title={language === "en" ? "Retake Policy" : language === "zh-CN" ? "重考政策" : "重考政策"}>
        <CheckboxGroup
          options={RETAKE_POLICIES}
          selected={retakePolicies}
          onChange={(v) => { setRetakePolicies(v); setPage(1); }}
          labelFn={(v) => v === "yes_no_penalty" ? (language === "en" ? "Yes (no penalty)" : language === "zh-CN" ? "接受（不扣分）" : "接受（不扣分）") :
            v === "yes_with_penalty" ? (language === "en" ? "Yes (with penalty)" : language === "zh-CN" ? "接受（扣分）" : "接受（扣分）") :
            (language === "en" ? "No" : "不接受")}
        />
      </FilterSection>
      <Separator />
      <FilterSection title={language === "en" ? "Flexible Admission" : language === "zh-CN" ? "弹性收生" : "彈性收生"}>
        <div className="flex items-center gap-2">
          <Checkbox
            id="chk-flexible"
            checked={flexibleAdmission === true}
            onCheckedChange={(checked) => { setFlexibleAdmission(checked ? true : undefined); setPage(1); }}
            className="w-3.5 h-3.5"
          />
          <Label htmlFor="chk-flexible" className="text-xs cursor-pointer">
            {language === "en" ? "Flexible Admission Only" : language === "zh-CN" ? "只顯示彈性收生" : "只顯示彈性收生"}
          </Label>
        </div>
      </FilterSection>
      <Separator />
      <FilterSection title={language === "en" ? "Minimum Requirements" : language === "zh-CN" ? "最低要求" : "最低要求"}>
        <div className="flex items-center gap-2">
          <Checkbox
            id="chk-minreq"
            checked={onlyMeetMinReq}
            onCheckedChange={(checked) => { setOnlyMeetMinReq(!!checked); setPage(1); }}
            className="w-3.5 h-3.5"
          />
          <Label htmlFor="chk-minreq" className="text-xs cursor-pointer leading-snug">
            {language === "en" ? "Only show courses I meet min. requirements" : language === "zh-CN" ? "僅列出符合最低要求的课程" : "僅列出符合最低要求的課程"}
          </Label>
        </div>
        {onlyMeetMinReq && !dseScores && (
          <p className="text-[10px] text-amber-500 mt-1">
            {language === "en" ? "Please enter DSE scores first" : language === "zh-CN" ? "请先输入文憑试成绩" : "請先輸入文憑試成績"}
          </p>
        )}
      </FilterSection>
      <Separator />
      {/* Tuition: free text input instead of slider */}
      <FilterSection title={`${t("courses.filter.tuition")} (${t("courses.filter.tuition.unit")})`}>
        <div className="flex items-center gap-2">
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder={language === "en" ? "Min" : "最低"}
            value={tuitionMin}
            onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ""); setTuitionMin(v); }}
            className="h-7 text-xs"
          />
          <span className="text-xs text-muted-foreground">—</span>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder={language === "en" ? "Max" : "最高"}
            value={tuitionMax}
            onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ""); setTuitionMax(v); }}
            className="h-7 text-xs"
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          {language === "en" ? "Annual tuition in HKD" : language === "zh-CN" ? "每年学费（港元）" : "每年學費（港元）"}
        </p>
      </FilterSection>
    </div>
  );

  return (
    <div className="container py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', 'Noto Serif TC', serif" }}>
          {t("courses.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isLoading ? t("courses.loading") : t("courses.total").replace("{count}", total.toString())}
        </p>
      </div>

      {/* Search + Sort bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("courses.search.placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1); }}>
          <SelectTrigger className="w-[200px] h-9">
            <SelectValue placeholder={t("courses.sort.label")} />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>{t(`courses.sort.${opt}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Mobile filter sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 lg:hidden">
              <SlidersHorizontal className="w-4 h-4" />
              {t("common.filter")}
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-foreground" />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{t("common.filter")}</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground">
            <X className="w-3.5 h-3.5" />
            {t("courses.clearFilters")}
          </Button>
        )}
      </div>

      <div className="flex gap-6">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block w-60 shrink-0">
          <div className="sticky top-20 bg-card border border-border rounded-xl p-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                {t("common.filter")}
              </h3>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground">
                  {t("common.reset")}
                </button>
              )}
            </div>
            <FilterContent />
          </div>
        </aside>

        {/* Course Grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-20">
              <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{t("courses.noResults")}</p>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-3">
                {t("courses.clearFilters")}
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                {courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    isFavorite={favoriteIds.includes(course.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onAddToChoices={handleAddToChoices}
                    dseScores={dseScores}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-8 h-8"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-8 h-8"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
