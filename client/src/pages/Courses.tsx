import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import { TapTooltip } from "@/components/TapTooltip";
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
  AlertTriangle,
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
  chinese: "—", english: "—", math: "—", m1: "—", m2: "—", civics: "達標",
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

function dseGradeToScore(grade: string, scale?: string): number {
  if (scale === "8.5") {
    const map: Record<string, number> = { "5**": 8.5, "5*": 7, "5": 5.5, "4": 4, "3": 3, "2": 2, "1": 1, "U": 0, "—": 0 };
    return map[grade] ?? 0;
  }
  // Default / "7" scale
  const map: Record<string, number> = { "5**": 7, "5*": 6, "5": 5, "4": 4, "3": 3, "2": 2, "1": 1, "U": 0, "—": 0 };
  return map[grade] ?? 0;
}

// Institutions where Lv2 subjects are excluded from scoring
const LV2_EXCLUDE_INSTITUTIONS = ["香港大學", "香港科技大學", "香港理工大學"];

function computeMyScore(course: Course, dse: DSEScoreData): number | null {
  const formula = (course as any).scoreFormula;
  if (!formula) return null;
  const scale = (course as any).scoringScale as string | undefined;

  // ── Step 1: Build raw score map ──────────────────────────────────────────────
  const rawMap: Record<string, number> = {};
  rawMap["chinese"] = dseGradeToScore(dse.chinese, scale);
  rawMap["english"] = dseGradeToScore(dse.english, scale);
  rawMap["math"] = dseGradeToScore(dse.math, scale);
  if (dse.m1 && dse.m1 !== "—") rawMap["m1"] = dseGradeToScore(dse.m1, scale);
  if (dse.m2 && dse.m2 !== "—") rawMap["m2"] = dseGradeToScore(dse.m2, scale);
  [[dse.elective1Subject, dse.elective1Grade],[dse.elective2Subject, dse.elective2Grade],
   [dse.elective3Subject, dse.elective3Grade],[(dse as any).elective4Subject, (dse as any).elective4Grade]]
    .forEach(([subj, grade]) => { if (subj) rawMap[subj] = dseGradeToScore(grade, scale); });
  if (dse.appliedLearningSubject) {
    const alMap: Record<string, number> = { "達標並表現優異（I）": 3, "達標並表現優異（II）": 4, "達標": 2, "未達標": 0 };
    rawMap[dse.appliedLearningSubject] = alMap[dse.appliedLearningGrade] ?? 0;
  }
  if (dse.otherLanguage) {
    const olMap: Record<string, number> = { C2: 5, C1: 4, B2: 3, B1: 2, A2: 1, N1: 5, N2: 4, N3: 3, "第 6 級": 5, "第 5 級": 4, "第 4 級": 3, "第 3 級": 2, "A++": 5, "A+": 5, "A": 4, "B++": 4, "B+": 3, "B": 3, "C": 2, "D": 1, "E": 1 };
    rawMap[dse.otherLanguage] = olMap[dse.otherLanguageGrade] ?? 0;
  }

  // ── Step 2: HKU / UST / PolyU — exclude Lv2 subjects (score ≤ 2 = 0) ────────
  // Triggered by formula.excludeLv2 OR if course institution is in LV2_EXCLUDE_INSTITUTIONS
  const shouldExcludeLv2 = formula.excludeLv2 === true ||
    LV2_EXCLUDE_INSTITUTIONS.includes((course as any).institution ?? "");
  const scoreMap: Record<string, number> = {};
  for (const [k, v] of Object.entries(rawMap)) {
    // For Lv2-exclude schools, subjects with raw DSE score ≤ 2 (i.e., grade 2 or below) count as 0
    // We check the raw (pre-scale) grade to determine this
    const rawGrade = (() => {
      if (k === "chinese") return dse.chinese;
      if (k === "english") return dse.english;
      if (k === "math") return dse.math;
      if (k === "m1") return dse.m1;
      if (k === "m2") return dse.m2;
      const pairs = [[dse.elective1Subject, dse.elective1Grade],[dse.elective2Subject, dse.elective2Grade],
        [dse.elective3Subject, dse.elective3Grade],[(dse as any).elective4Subject, (dse as any).elective4Grade]];
      const found = pairs.find(([s]) => s === k);
      return found ? found[1] : null;
    })();
    const isLv2OrBelow = rawGrade && ["1", "2", "U"].includes(rawGrade);
    scoreMap[k] = (shouldExcludeLv2 && isLv2OrBelow) ? 0 : v;
  }

  // ── Step 3: Apply weightings ─────────────────────────────────────────────────
  // formula.weighted: [{ subject, multiplier }]
  // Note: some courses only allow the better of two subjects to have weighting
  // formula.weightedBestOf: [{ subjects: string[], multiplier: number }] — only best subject gets multiplier
  const weightedMap: Record<string, number> = { ...scoreMap };
  for (const w of (formula.weighted ?? [])) {
    if (weightedMap[w.subject] !== undefined) weightedMap[w.subject] = weightedMap[w.subject] * w.multiplier;
  }
  // Best-of weighting: only the highest-scoring subject in the group gets the multiplier
  for (const w of (formula.weightedBestOf ?? [])) {
    const candidates = (w.subjects as string[]).filter(s => weightedMap[s] !== undefined);
    if (candidates.length === 0) continue;
    const best = candidates.reduce((a, b) => (weightedMap[a] >= weightedMap[b] ? a : b));
    // Apply multiplier only to best; others keep original score
    weightedMap[best] = weightedMap[best] * w.multiplier;
  }

  // ── Step 4: Build available pool (excluded subjects removed) ─────────────────
  const excluded = new Set(formula.excluded ?? []);
  // JS4501/JS4502 special: M1/M2 excluded from main pool by default
  const js4501Special = formula.js4501Special === true;
  if (js4501Special) {
    excluded.add("m1");
    excluded.add("m2");
  }
  const available = Object.entries(weightedMap)
    .filter(([k]) => !excluded.has(k))
    .map(([k, v]) => ({ subject: k, score: v }));

  const required = new Set(formula.required ?? []);
  const requiredEntries = available.filter(e => required.has(e.subject));
  const optionalEntries = available.filter(e => !required.has(e.subject));
  optionalEntries.sort((a, b) => b.score - a.score);

  // ── Step 5: Best N / 3C+2X selection ─────────────────────────────────────────
  const method = formula.method ?? "best5";
  let selectedEntries: Array<{ subject: string; score: number }> = [];

  if (method === "best5" || method === "best6" || method === "best7" || method === "best4") {
    const n = method === "best4" ? 4 : method === "best6" ? 6 : method === "best7" ? 7 : 5;
    // Required subjects are ALWAYS included; fill remaining slots with best optional subjects
    const remainingSlots = Math.max(0, n - requiredEntries.length);
    const topOptional = optionalEntries.slice(0, remainingSlots);
    selectedEntries = [...requiredEntries, ...topOptional];

    // JS4501/JS4502 special: if Best-N slot is worse than M1/M2, replace with 0.5×slot + 0.5×M1M2
    if (js4501Special && selectedEntries.length === n) {
      const m1Score = weightedMap["m1"] ?? 0;
      const m2Score = weightedMap["m2"] ?? 0;
      const bestMathExt = Math.max(m1Score, m2Score);
      if (bestMathExt > 0) {
        const lastEntry = selectedEntries[n - 1];
        if (bestMathExt > lastEntry.score) {
          // Replace last slot with 0.5×last + 0.5×mathExt
          selectedEntries[n - 1] = { subject: "m1m2_blend", score: lastEntry.score * 0.5 + bestMathExt * 0.5 };
        }
      }
    }
  } else if (method === "3c2x") {
    // 3C+2X: Chinese + English + Math (3 core) + best 2 electives/M1/M2
    const coreSubjects = new Set(formula.coreSubjects ?? ["chinese", "english", "math"]);
    const coreEntries = available.filter(e => coreSubjects.has(e.subject));
    const electiveEntries = available.filter(e => !coreSubjects.has(e.subject)).sort((a, b) => b.score - a.score).slice(0, 2);
    selectedEntries = [...coreEntries, ...electiveEntries];
  }

  let total = selectedEntries.reduce((s, e) => s + e.score, 0);

  // ── Step 6: Bonus subject (extra weighting for N+1 subject) ──────────────────
  // formula.bonusSubject: { multiplier: number, subject?: string }
  // If subject specified: that subject × multiplier added as bonus
  // If no subject: the next best subject after selected pool × multiplier added
  if (formula.bonusSubject) {
    const bonus = formula.bonusSubject;
    const selectedSubjects = new Set(selectedEntries.map(e => e.subject));
    let bonusScore = 0;
    if (bonus.subject) {
      // Specific subject as bonus
      bonusScore = (weightedMap[bonus.subject] ?? 0) * bonus.multiplier;
    } else {
      // Next best subject not already in selected pool
      const remaining = available
        .filter(e => !selectedSubjects.has(e.subject))
        .sort((a, b) => b.score - a.score);
      if (remaining.length > 0) bonusScore = remaining[0].score * bonus.multiplier;
    }
    total += bonusScore;
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

  // Build user subject map for requirement checks
  const userSubjects: Record<string, string> = {
    chinese: dse.chinese, english: dse.english, math: dse.math,
    [dse.elective1Subject]: dse.elective1Grade,
    [dse.elective2Subject]: dse.elective2Grade,
    [dse.elective3Subject]: dse.elective3Grade,
    [(dse as any).elective4Subject ?? ""]: (dse as any).elective4Grade ?? "—",
  };

  // Check legacy scoreFormula.minSubjectRequirements
  const formula = (course as any).scoreFormula;
  if (formula?.minSubjectRequirements) {
    for (const subReq of formula.minSubjectRequirements) {
      const userGrade = userSubjects[subReq.subject];
      if (!userGrade || !gradeAtLeast(userGrade, subReq.minGrade)) return false;
    }
  }

  // Check electiveMinReq in scoreFormula (33 or 22)
  if (formula?.electiveMinReq) {
    const minGrade = formula.electiveMinReq === "33" ? "3" : "2";
    const excludeM = formula.excludeM1M2FromElectiveMin === true;
    // Collect all elective and M1/M2 grades
    const electiveCandidates: string[] = [];
    if (!excludeM) {
      if (dse.m1 && dse.m1 !== "—") electiveCandidates.push(dse.m1);
      if (dse.m2 && dse.m2 !== "—") electiveCandidates.push(dse.m2);
    }
    if (dse.elective1Subject && dse.elective1Grade && dse.elective1Grade !== "—") electiveCandidates.push(dse.elective1Grade);
    if (dse.elective2Subject && dse.elective2Grade && dse.elective2Grade !== "—") electiveCandidates.push(dse.elective2Grade);
    if (dse.elective3Subject && dse.elective3Grade && dse.elective3Grade !== "—") electiveCandidates.push(dse.elective3Grade);
    if ((dse as any).elective4Subject && (dse as any).elective4Grade && (dse as any).elective4Grade !== "—") electiveCandidates.push((dse as any).elective4Grade);
    const meetingCount = electiveCandidates.filter(g => gradeAtLeast(g, minGrade)).length;
    if (meetingCount < 2) return false;
  }

  // Check new specificSubjectRequirements (groups with OR within group, AND between groups)
  const specificReqs = (course as any).specificSubjectRequirements;
  if (specificReqs?.groups && Array.isArray(specificReqs.groups)) {
    for (const group of specificReqs.groups) {
      const minGradeStr = String(group.minGrade);
      const anyMeets = (group.subjects as string[]).some((subj) => {
        const userGrade = userSubjects[subj];
        return userGrade && gradeAtLeast(userGrade, minGradeStr);
      });
      if (!anyMeets) return false;
    }
  }

  return true;
}

/** Get list of reasons why DSE scores do not meet minimum requirements */
function getMinReqFailReasons(course: Course, dse: DSEScoreData): string[] {
  const reasons: string[] = [];
  const req = course.minRequirement;
  const reqMap: Record<string, string> = { "2": "2", "3": "3", "4": "4", "5": "5", "A": "達標" };
  const subjectLabel: Record<string, string> = {
    chinese: "中文", english: "英文", math: "數學",
    m1: "M1", m2: "M2",
  };
  if (req && req.length >= 3) {
    const chineseReq = reqMap[req[0]] ?? req[0];
    const englishReq = reqMap[req[1]] ?? req[1];
    const mathReq = reqMap[req[2]] ?? req[2];
    if (!gradeAtLeast(dse.chinese, chineseReq)) reasons.push(`中文：需要 ${chineseReq} 級，您為 ${dse.chinese}`);
    if (!gradeAtLeast(dse.english, englishReq)) reasons.push(`英文：需要 ${englishReq} 級，您為 ${dse.english}`);
    if (!gradeAtLeast(dse.math, mathReq)) reasons.push(`數學：需要 ${mathReq} 級，您為 ${dse.math}`);
  }
  const userSubjects: Record<string, string> = {
    chinese: dse.chinese, english: dse.english, math: dse.math,
    [dse.elective1Subject]: dse.elective1Grade,
    [dse.elective2Subject]: dse.elective2Grade,
    [dse.elective3Subject]: dse.elective3Grade,
    [(dse as any).elective4Subject ?? ""]: (dse as any).elective4Grade ?? "—",
  };
  const formula = (course as any).scoreFormula;
  if (formula?.minSubjectRequirements) {
    for (const subReq of formula.minSubjectRequirements) {
      const userGrade = userSubjects[subReq.subject];
      if (!userGrade || !gradeAtLeast(userGrade, subReq.minGrade)) {
        const label = subjectLabel[subReq.subject] ?? subReq.subject;
        reasons.push(`${label}：需要 ${subReq.minGrade} 級，您為 ${userGrade ?? "未填寫"}`);
      }
    }
  }
  if (formula?.electiveMinReq) {
    const minGrade = formula.electiveMinReq === "33" ? "3" : "2";
    const excludeM = formula.excludeM1M2FromElectiveMin === true;
    const electiveCandidates: string[] = [];
    if (!excludeM) {
      if (dse.m1 && dse.m1 !== "—") electiveCandidates.push(dse.m1);
      if (dse.m2 && dse.m2 !== "—") electiveCandidates.push(dse.m2);
    }
    if (dse.elective1Subject && dse.elective1Grade && dse.elective1Grade !== "—") electiveCandidates.push(dse.elective1Grade);
    if (dse.elective2Subject && dse.elective2Grade && dse.elective2Grade !== "—") electiveCandidates.push(dse.elective2Grade);
    if (dse.elective3Subject && dse.elective3Grade && dse.elective3Grade !== "—") electiveCandidates.push(dse.elective3Grade);
    if ((dse as any).elective4Subject && (dse as any).elective4Grade && (dse as any).elective4Grade !== "—") electiveCandidates.push((dse as any).elective4Grade);
    const meetingCount = electiveCandidates.filter(g => gradeAtLeast(g, minGrade)).length;
    if (meetingCount < 2) reasons.push(`選修科：需要至少 2 科達 ${minGrade} 級，您目前只有 ${meetingCount} 科符合`);
  }
  const specificReqs = (course as any).specificSubjectRequirements;
  if (specificReqs?.groups && Array.isArray(specificReqs.groups)) {
    for (const group of specificReqs.groups) {
      const minGradeStr = String(group.minGrade);
      const anyMeets = (group.subjects as string[]).some((subj) => {
        const userGrade = userSubjects[subj];
        return userGrade && gradeAtLeast(userGrade, minGradeStr);
      });
      if (!anyMeets) {
        const labels = (group.subjects as string[]).map((s: string) => subjectLabel[s] ?? s).join("/");
        reasons.push(`${labels}：需要其中一科達 ${minGradeStr} 級`);
      }
    }
  }
  return reasons;
}

function getScoreColor(score: number, q1: number | null | undefined, median: number | null | undefined): "red" | "yellow" | "green" | "gray" {
  if (!q1 && !median) return "gray";
  const q1Val = q1 ? Number(q1) : 0;
  const medianVal = median ? Number(median) : 0;
  if (score < q1Val) return "red";
  if (score < medianVal) return "yellow";
  return "green";
}

/** Compute percentage deviation from last year median: (myScore - median) / median * 100 */
function computeScorePct(myScore: number, median: number | null | undefined): number | null {
  if (!median || Number(median) === 0) return null;
  return (myScore - Number(median)) / Number(median) * 100;
}

/** Format percentage deviation for display, e.g. +8.70% or -3.45% */
function formatPct(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

/** Return Tailwind color class for percentage deviation */
function pctColorClass(pct: number | null): string {
  if (pct === null) return "text-muted-foreground";
  if (pct > 0) return "text-green-600 dark:text-green-400";
  if (pct < 0) return "text-red-600 dark:text-red-400";
  return "text-muted-foreground";
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

const SCORING_METHODS = ["best5", "best6", "best4", "3c2x"];
const SCORE_GAPS = ["above_median", "between_median_q1", "below_q1"];
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
  showFavorite,
}: {
  course: Course;
  isFavorite: boolean;
  onToggleFavorite: (course: Course) => void;
  onAddToChoices: (course: Course) => void;
  dseScores: DSEScoreData | null;
  showFavorite?: boolean;
}) {
  const { t, language } = useLanguage();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const inCompare = isInCompare(course.id);
  const [showDetails, setShowDetails] = useState(false);

  // Check if meets minimum requirement (only when DSE scores are entered)
  const meetsMinReq = dseScores ? checkMeetsMinRequirement(course, dseScores) : null;

  // My Score calculation (only if meets min requirement)
  const myScore = (dseScores && meetsMinReq !== false) ? computeMyScore(course, dseScores) : null;
  const scoreColor = myScore !== null ? getScoreColor(myScore, course.lastYearQ1 ? Number(course.lastYearQ1) : null, course.lastYearMedian ? Number(course.lastYearMedian) : null) : null;
  // Use expectedScore as reference if scoringMethodChanged and expectedScore exists, else use lastYearMedian
  const referenceScore = (course.scoringMethodChanged && course.expectedScore)
    ? Number(course.expectedScore)
    : (course.lastYearMedian ? Number(course.lastYearMedian) : null);
  const scorePct = myScore !== null ? computeScorePct(myScore, referenceScore) : null;

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
    <div className={cn(
      "group relative bg-card border border-border rounded-xl p-4 hover:border-foreground/20 hover:shadow-md transition-all duration-200",
      meetsMinReq === false && "border-red-300/50 dark:border-red-800/50"
    )}>
      {/* Does not meet min requirement badge (top-right corner) */}
           {meetsMinReq === false && dseScores && (() => {
        const failReasons = getMinReqFailReasons(course, dseScores);
        return (
          <div className="absolute top-2 right-2 z-10">
            <TapTooltip
              contentClassName="max-w-[260px] text-xs"
              trigger={
                <div className="flex items-center gap-1 bg-red-500/15 text-red-600 dark:text-red-400 text-xs px-1.5 py-0.5 rounded-full cursor-pointer select-none">
                  <AlertTriangle className="w-3 h-3" />
                  <span className="hidden sm:inline">
                    {language === "en" ? "Below min. req." : language === "zh-CN" ? "不符合最低要求" : "不符合最低要求"}
                  </span>
                </div>
              }
            >
              <div className="font-medium mb-1">
                {language === "en" ? "Requirements not met:" : language === "zh-CN" ? "不符合项目：" : "不符合項目："}
              </div>
              {failReasons.length > 0 ? (
                <ul className="space-y-0.5 list-disc list-inside">
                  {failReasons.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              ) : (
                <span>{language === "en" ? "Does not meet minimum requirements" : "不符合最低入學要求"}</span>
              )}
            </TapTooltip>
          </div>
        );
      })()}
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

      {/* Stats grid — 3 rows x 3 cols */}
      {/* Row 1: 收生人數 / 去年加成後中位數 / 去年加成後下四分位數 */}
      {course.scoringMethodChanged && course.expectedScore ? (
        <div className="grid grid-cols-2 gap-2 mb-1">
          <StatCell label={t("courses.col.quota")} value={course.quota?.toString() ?? "—"} />
          <StatCell
            label={language === "en" ? "Expected Score" : language === "zh-CN" ? "预期分数" : "預期分數"}
            value={formatScore(course.expectedScore)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 mb-1">
          <StatCell label={t("courses.col.quota")} value={course.quota?.toString() ?? "—"} />
          <StatCell label={t("courses.col.median")} value={formatScore(course.lastYearMedian)} />
          <StatCell label={t("courses.col.q1")} value={formatScore(course.lastYearQ1)} />
        </div>
      )}
      {/* Toggle button */}
      <button
        onClick={() => setShowDetails(prev => !prev)}
        className="w-full flex items-center justify-center gap-1 py-0.5 mb-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors rounded"
      >
        {showDetails
          ? (language === "en" ? "▲ Less" : "▲ 收起")
          : (language === "en" ? "▼ More" : "▼ 更多資料")}
      </button>
      {/* Rows 2 & 3: collapsible */}
      {showDetails && (
        <>
          {/* Row 2: 去年總申請人數 / 去年組別A申請人數 / 去年取錄人數 */}
          <div className="grid grid-cols-3 gap-2 mb-1">
            <StatCell label={t("courses.col.totalApplicants")} value={course.lastYearTotalApplicants?.toString() ?? "—"} />
            <StatCell label={t("courses.col.groupAApplicants")} value={course.lastYearGroupAApplicants?.toString() ?? "—"} />
            <StatCell
              label={t("courses.col.admitted")}
              value={course.lastYearAdmitted
                ? `${course.lastYearAdmitted}${course.lastYearGroupAAdmitted ? ` (${course.lastYearGroupAAdmitted}A)` : ""}`
                : "—"}
            />
          </div>
          {/* Row 3: 最低要求 / 學費 / 修讀年期 */}
          <div className="grid grid-cols-3 gap-2 mb-1">
            <StatCell label={t("courses.col.minReq")} value={course.minRequirement ?? "—"} />
            <StatCell label={t("courses.col.tuition")} value={formatTuition(course.tuitionFee)} />
            <StatCell label={t("courses.col.duration")} value={course.duration ? `${course.duration}${language === "en" ? "yr" : "年"}` : "—"} />
          </div>
        </>
      )}

      {/* My Score row */}
      {dseScores && meetsMinReq !== false && (
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
          <span className="font-bold flex items-center gap-1">
            {myScore === null
              ? (language === "en" ? "No formula" : "未設定公式")
              : (
                <>
                  {myScore.toFixed(2)}
                  {scorePct !== null && (
                    <span className={cn("text-[10px] font-normal", pctColorClass(scorePct))}>
                      ({formatPct(scorePct)})
                    </span>
                  )}
                  <TapTooltip
                    contentClassName="max-w-[260px] text-xs space-y-1"
                    trigger={<span className="cursor-pointer select-none text-[10px] text-muted-foreground ml-0.5">*</span>}
                  >
                    <div className="font-medium">
                      {language === "en" ? "Score % Deviation" : language === "zh-CN" ? "分数偏差百分比" : "分數偏差百分比"}
                    </div>
                    <div>
                      {language === "en"
                        ? "Formula: (My Score − Reference) ÷ Reference × 100%"
                        : language === "zh-CN"
                        ? "公式：（我的分数 − 参考分数）÷ 参考分数 × 100%"
                        : "公式：（我的分數 − 參考分數）÷ 參考分數 × 100%"}
                    </div>
                    <div className="text-muted-foreground">
                      {language === "en"
                        ? `Reference: ${course.scoringMethodChanged && course.expectedScore ? `Expected Score (${course.expectedScore})` : `Last Year Median (${course.lastYearMedian ?? "N/A"})`}`
                        : language === "zh-CN"
                        ? `参考分数：${course.scoringMethodChanged && course.expectedScore ? `预期分数（${course.expectedScore}）` : `去年中位数（${course.lastYearMedian ?? "N/A"}）`}`
                        : `參考分數：${course.scoringMethodChanged && course.expectedScore ? `預期分數（${course.expectedScore}）` : `去年中位數（${course.lastYearMedian ?? "N/A"}）`}`}
                    </div>
                    <div className="text-muted-foreground">
                      {language === "en" ? "+ = above reference, − = below reference" : language === "zh-CN" ? "+ = 高于参考分数，− = 低于参考分数" : "+ = 高於參考分數，− = 低於參考分數"}
                    </div>
                  </TapTooltip>
                </>
              )}
          </span>
        </div>
      )}
      {dseScores && meetsMinReq === false && (() => {
        const failReasons = getMinReqFailReasons(course, dseScores);
        return (
          <div className="flex items-center justify-between px-2 py-1 rounded-md mb-2 text-xs bg-red-500/10 text-red-600 dark:text-red-400">
            <span className="font-medium">
              {language === "en" ? "My Score" : language === "zh-CN" ? "我的分数" : "我的分數"}
            </span>
            <TapTooltip
              contentClassName="max-w-[280px] text-xs space-y-1"
              trigger={
                <span className="text-[10px] cursor-pointer select-none underline decoration-dotted">
                  {language === "en" ? "Does not meet min. req." : language === "zh-CN" ? "不符合最低要求" : "不符合最低要求"}
                </span>
              }
            >
              <div className="font-medium mb-1">
                {language === "en" ? "Reasons:" : language === "zh-CN" ? "不符合原因：" : "不符合原因："}
              </div>
              {failReasons.length > 0
                ? failReasons.map((r, i) => <div key={i}>• {r}</div>)
                : <div>{language === "en" ? "Minimum requirement not met" : "不符合最低入學要求"}</div>
              }
            </TapTooltip>
          </div>
        );
      })()}
      {!dseScores && (course as any).scoreFormula && (
        <div className="flex items-center justify-between px-2 py-1 rounded-md mb-2 text-xs bg-muted/30 text-muted-foreground">
          <span>{language === "en" ? "My Score" : language === "zh-CN" ? "我的分数" : "我的分數"}</span>
          <span>
            <Link href="/dse" className="underline hover:text-foreground">
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
        {showFavorite && (
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
        )}
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
    <div className="space-y-1.5 pl-1">
      {options.map((opt) => (
        <div key={opt} className="flex items-center gap-2.5">
          <Checkbox
            id={`chk-${opt}`}
            checked={selected.includes(opt)}
            onCheckedChange={() => toggle(opt)}
            className="w-3.5 h-3.5 flex-shrink-0"
          />
          <Label htmlFor={`chk-${opt}`} className="text-xs cursor-pointer leading-none select-none">
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
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === "admin";
  // Use ref to always read the latest isAuthenticated value inside callbacks (avoids stale closure)
  const isAuthenticatedRef = useRef(isAuthenticated);
  useEffect(() => { isAuthenticatedRef.current = isAuthenticated; }, [isAuthenticated]);
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
    }, 600);
    return () => clearTimeout(timer);
  }, [tuitionMin]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTuitionMax(tuitionMax);
    }, 600);
    return () => clearTimeout(timer);
  }, [tuitionMax]);

  // Reset page when debounced tuition values change
  useEffect(() => { setPage(1); }, [debouncedTuitionMin, debouncedTuitionMax]);

  const parsedTuitionMin = debouncedTuitionMin ? parseInt(debouncedTuitionMin.replace(/\D/g, "")) : undefined;
  const parsedTuitionMax = debouncedTuitionMax ? parseInt(debouncedTuitionMax.replace(/\D/g, "")) : undefined;

  const queryInput = useMemo(() => ({
    search: debouncedSearch || undefined,
    degreeTypes: degreeTypes.length ? degreeTypes : undefined,
    institutions: institutions.length ? institutions : undefined,
    durations: durations.length ? durations : undefined,
    qualifications: qualifications.length ? qualifications : undefined,
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
  }), [debouncedSearch, degreeTypes, institutions, durations, qualifications, fundingTypes, interviewArrangements, groupAOnly, flexibleAdmission, retakePolicies, parsedTuitionMin, parsedTuitionMax, sortBy, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data, isLoading } = trpc.courses.list.useQuery(queryInput);
  const rawCourses = data?.courses ?? [];
  // Client-side filter and sort
  const courses = useMemo(() => {
    let result = rawCourses;
    // Filter: only show courses that meet minimum requirements
    if (onlyMeetMinReq && dseScores) {
      result = result.filter((c) => checkMeetsMinRequirement(c, dseScores));
    }
    // Filter: My Score filter (client-side, requires DSE scores)
    if (scoreGaps.length > 0 && dseScores) {
      result = result.filter((c) => {
        const myScore = computeMyScore(c, dseScores);
        if (myScore === null) return false;
        const median = c.lastYearMedian ? Number(c.lastYearMedian) : null;
        const q1 = c.lastYearQ1 ? Number(c.lastYearQ1) : null;
        // Use expectedScore as reference if scoringMethodChanged, else use median
        const ref = (c.scoringMethodChanged && c.expectedScore) ? Number(c.expectedScore) : median;
        return scoreGaps.some((gap) => {
          if (gap === "above_median") return ref !== null && myScore > ref;
          if (gap === "between_median_q1") return ref !== null && q1 !== null && myScore >= q1 && myScore <= ref;
          if (gap === "below_q1") return q1 !== null && myScore < q1;
          return false;
        });
      });
    }
    // Client-side sort by probability (percentage deviation) when DSE scores are available
    if (dseScores && (sortBy === "probability_desc" || sortBy === "probability_asc")) {
      result = [...result].sort((a, b) => {
        const scoreA = checkMeetsMinRequirement(a, dseScores) ? computeMyScore(a, dseScores) : null;
        const scoreB = checkMeetsMinRequirement(b, dseScores) ? computeMyScore(b, dseScores) : null;
        const refA = (a.scoringMethodChanged && a.expectedScore) ? Number(a.expectedScore) : (a.lastYearMedian ? Number(a.lastYearMedian) : null);
        const refB = (b.scoringMethodChanged && b.expectedScore) ? Number(b.expectedScore) : (b.lastYearMedian ? Number(b.lastYearMedian) : null);
        const pctA = scoreA !== null ? computeScorePct(scoreA, refA) : null;
        const pctB = scoreB !== null ? computeScorePct(scoreB, refB) : null;
        // Courses with no pct go to the end
        if (pctA === null && pctB === null) return 0;
        if (pctA === null) return 1;
        if (pctB === null) return -1;
        return sortBy === "probability_desc" ? pctB - pctA : pctA - pctB;
      });
    }
    return result;
  }, [rawCourses, onlyMeetMinReq, dseScores, sortBy, scoreGaps]);
  const isClientSideFiltered = onlyMeetMinReq || (scoreGaps.length > 0 && !!dseScores) || (dseScores && (sortBy === "probability_desc" || sortBy === "probability_asc"));
  const total = isClientSideFiltered ? courses.length : (data?.total ?? 0);
  const totalPages = isClientSideFiltered ? 1 : Math.ceil((data?.total ?? 0) / PAGE_SIZE);

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
    if (isAuthenticatedRef.current) {
      // Logged-in: use server API
      if (favoriteIds.includes(course.id)) {
        removeFav.mutate({ courseId: course.id });
        toast.success(t("courses.removeFromFavorites"));
      } else {
        addFav.mutate({ courseId: course.id });
        toast.success(t("courses.addToFavorites"));
      }
    } else {
      // Guest mode: use localStorage directly (no server call)
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
  }, [favoriteIds, addFav, removeFav, t]);

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
    setQualifications([]); setScoreGaps([]);
    setFundingTypes([]); setInterviewArrangements([]);
    setGroupAOnly(undefined); setFlexibleAdmission(undefined); setRetakePolicies([]);
    setTuitionMin(""); setTuitionMax("");
    setOnlyMeetMinReq(false);
    setSortBy("id"); setPage(1);
  };

  const hasActiveFilters = degreeTypes.length > 0 || institutions.length > 0 || durations.length > 0 ||
    qualifications.length > 0 || scoreGaps.length > 0 ||
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
      <FilterSection title={t("courses.filter.scoreGap")}>
        {!dseScores && (
          <p className="text-xs text-muted-foreground">
            {language === "en" ? "Enter DSE scores to use this filter" : language === "zh-CN" ? "请先输入文凭试成绩" : "請先輸入文憑試成績"}
          </p>
        )}
        {dseScores && (
          <CheckboxGroup
            options={SCORE_GAPS}
            selected={scoreGaps}
            onChange={(v) => { setScoreGaps(v); setPage(1); }}
            labelFn={(v) => t(`scoreGap.${v}`)}
          />
        )}
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
        <div className="flex items-center gap-2.5 pl-1">
          <Checkbox
            id="chk-groupA"
            checked={groupAOnly === true}
            onCheckedChange={(checked) => { setGroupAOnly(checked ? true : undefined); setPage(1); }}
            className="w-3.5 h-3.5 flex-shrink-0"
          />
          <Label htmlFor="chk-groupA" className="text-xs cursor-pointer select-none">
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
        <div className="flex items-center gap-2.5 pl-1">
          <Checkbox
            id="chk-flexible"
            checked={flexibleAdmission === true}
            onCheckedChange={(checked) => { setFlexibleAdmission(checked ? true : undefined); setPage(1); }}
            className="w-3.5 h-3.5 flex-shrink-0"
          />
          <Label htmlFor="chk-flexible" className="text-xs cursor-pointer select-none">
            {language === "en" ? "Flexible Admission Only" : language === "zh-CN" ? "只显示弹性收生" : "只顯示彈性收生"}
          </Label>
        </div>
      </FilterSection>
      <Separator />
      <FilterSection title={language === "en" ? "Minimum Requirements" : language === "zh-CN" ? "最低要求" : "最低要求"}>
        <div className="flex items-center gap-2.5 pl-1">
          <Checkbox
            id="chk-minreq"
            checked={onlyMeetMinReq}
            onCheckedChange={(checked) => { setOnlyMeetMinReq(!!checked); setPage(1); }}
            className="w-3.5 h-3.5 flex-shrink-0"
          />
          <Label htmlFor="chk-minreq" className="text-xs cursor-pointer leading-snug select-none">
            {language === "en" ? "Only show courses I meet min. requirements" : language === "zh-CN" ? "僅列出符合最低要求的课程" : "僅列出符合最低要求的課程"}
          </Label>
        </div>
        {onlyMeetMinReq && !dseScores && (
          <p className="text-[10px] text-amber-500 mt-1">
            {language === "en" ? "Please enter DSE scores first" : language === "zh-CN" ? "请先输入文憑试成绩" : "請先輸入文憑試成績"}
          </p>
        )}
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

        <Select value={sortBy} onValueChange={(v) => { setSortBy(v === "default" ? "id" : v); setPage(1); }}>
          <SelectTrigger className="w-[200px] h-9">
            <SelectValue>
              {sortBy === "id"
                ? (language === "en" ? "Default Sort" : language === "zh-CN" ? "默认排序" : "預設排序")
                : t(`courses.sort.${sortBy}`)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">
              {language === "en" ? "Default Sort" : language === "zh-CN" ? "默认排序" : "預設排序"}
            </SelectItem>
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
                    showFavorite={isAdmin}
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
