import { useState } from "react";
import { useCompare } from "@/contexts/CompareContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BarChart2, Search, CheckCircle2, XCircle, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Course } from "../../../drizzle/schema";
import type { DSEScoreData } from "./DSEScores";

// ─── DSE helpers (duplicated from Courses.tsx for Compare page) ───────────────
const DSE_COOKIE_KEY_CMP = "jupasearch_dse_scores";
function loadDseForCompare(): DSEScoreData | null {
  try {
    const raw = document.cookie.split("; ").find((r) => r.startsWith(DSE_COOKIE_KEY_CMP + "="));
    if (!raw) return null;
    const val = decodeURIComponent(raw.split("=")[1] ?? "");
    const parsed = JSON.parse(val);
    const hasScore = ["chinese","english","math"].some(k => parsed[k] && parsed[k] !== "—");
    return hasScore ? parsed : null;
  } catch { return null; }
}
function dseGradeToScoreCmp(grade: string, scale?: string): number {
  if (scale === "8.5") {
    const map: Record<string, number> = { "5**": 8.5, "5*": 7, "5": 5.5, "4": 4, "3": 3, "2": 2, "1": 1, "U": 0, "—": 0 };
    return map[grade] ?? 0;
  }
  const map: Record<string, number> = { "5**": 7, "5*": 6, "5": 5, "4": 4, "3": 3, "2": 2, "1": 1, "U": 0, "—": 0 };
  return map[grade] ?? 0;
}
const LV2_EXCLUDE_INSTITUTIONS_CMP = ["香港大學", "香港科技大學", "香港理工大學"];
const ELECTIVE_ZH_TO_CODE_CMP: Record<string, string> = {
  "物理": "physics", "化學": "chemistry", "生物": "biology",
  "組合科學（物理、化學）": "combined_sci_phy_chem",
  "組合科學（化學、生物）": "combined_sci_chem_bio",
  "組合科學（物理、生物）": "combined_sci_phy_bio",
  "綜合科學": "integrated_science",
  "資訊及通訊科技": "ict", "設計與應用科技": "dat",
  "健康管理與社會關懷": "hmsc",
  "科技與生活（服裝、成衣與紡織）": "tal_clothing",
  "科技與生活（食物科學與科技）": "tal_food",
  "企業、會計與財務概論（會計選修部分）": "bafs_accounting",
  "企業、會計與財務概論（商業管理選修部分）": "bafs_business",
  "企業、會計與財務概論": "bafs",
  "經濟": "economics", "地理": "geography", "歷史": "history",
  "中國歷史": "chinese_history", "倫理與宗教": "ethics",
  "中國文學": "chinese_lit", "英語文學": "english_lit",
  "旅遊與款待": "tourism", "視覺藝術": "va", "音樂": "music", "體育": "pe",
  "化学": "chemistry", "组合科学（物理、化学）": "combined_sci_phy_chem",
  "组合科学（化学、生物）": "combined_sci_chem_bio",
  "组合科学（物理、生物）": "combined_sci_phy_bio",
  "综合科学": "integrated_science", "资讯及通讯科技": "ict",
  "设计与应用科技": "dat", "健康管理与社会关顾": "hmsc",
  "科技与生活（服装、成衣与纵织）": "tal_clothing",
  "科技与生活（食物科学与科技）": "tal_food",
  "企业、会计与财务概论（会计选修部分）": "bafs_accounting",
  "企业、会计与财务概论（商业管理选修部分）": "bafs_business",
  "企业、会计与财务概论": "bafs",
  "经济": "economics", "历史": "history",
  "中国历史": "chinese_history", "伦理与宗教": "ethics",
  "中国文学": "chinese_lit", "英语文学": "english_lit",
  "旅游与款待": "tourism", "视觉艺术": "va", "音乐": "music", "体育": "pe",
};
function normalizeElectiveCodeCmp(subj: string): string {
  return ELECTIVE_ZH_TO_CODE_CMP[subj] ?? subj;
}
function computeMyScoreCmp(course: Course, dse: DSEScoreData): number | null {
  const formula = (course as any).scoreFormula;
  if (!formula) return null;
  const scale = (course as any).scoringScale as string | undefined;

  // Step 1: Build raw score map
  const rawMap: Record<string, number> = {};
  rawMap["chinese"] = dseGradeToScoreCmp(dse.chinese, scale);
  rawMap["english"] = dseGradeToScoreCmp(dse.english, scale);
  rawMap["math"] = dseGradeToScoreCmp(dse.math, scale);
  if (dse.m1 && dse.m1 !== "—") rawMap["m1"] = dseGradeToScoreCmp(dse.m1, scale);
  if (dse.m2 && dse.m2 !== "—") rawMap["m2"] = dseGradeToScoreCmp(dse.m2, scale);
  [[dse.elective1Subject, dse.elective1Grade],[dse.elective2Subject, dse.elective2Grade],[dse.elective3Subject, dse.elective3Grade],[(dse as any).elective4Subject, (dse as any).elective4Grade]]
    .forEach(([subj, grade]) => { if (subj) rawMap[normalizeElectiveCodeCmp(subj)] = dseGradeToScoreCmp(grade, scale); });
  if (dse.appliedLearningSubject) {
    const alMap: Record<string, number> = { "達標並表現優異（I）": 3, "達標並表現優異（II）": 4, "達標": 2, "未達標": 0 };
    rawMap[dse.appliedLearningSubject] = alMap[dse.appliedLearningGrade] ?? 0;
  }
  if (dse.otherLanguage) {
    const olMap: Record<string, number> = { C2: 5, C1: 4, B2: 3, B1: 2, A2: 1, N1: 5, N2: 4, N3: 3, "第 6 級": 5, "第 5 級": 4, "第 4 級": 3, "第 3 級": 2, "A++": 5, "A+": 5, "A": 4, "B++": 4, "B+": 3, "B": 3, "C": 2, "D": 1, "E": 1 };
    rawMap[dse.otherLanguage] = olMap[dse.otherLanguageGrade] ?? 0;
  }

  // Step 2: HKU/UST/PolyU Lv2 exclusion
  const shouldExcludeLv2 = formula.excludeLv2 === true ||
    LV2_EXCLUDE_INSTITUTIONS_CMP.includes((course as any).institution ?? "");
  const scoreMap: Record<string, number> = {};
  for (const [k, v] of Object.entries(rawMap)) {
    const rawGrade = (() => {
      if (k === "chinese") return dse.chinese;
      if (k === "english") return dse.english;
      if (k === "math") return dse.math;
      if (k === "m1") return dse.m1;
      if (k === "m2") return dse.m2;
      const pairs = [[dse.elective1Subject, dse.elective1Grade],[dse.elective2Subject, dse.elective2Grade],
        [dse.elective3Subject, dse.elective3Grade],[(dse as any).elective4Subject, (dse as any).elective4Grade]];
      const found = pairs.find(([s]) => s && normalizeElectiveCodeCmp(s) === k);
      return found ? found[1] : null;
    })();
    const isLv2OrBelow = rawGrade && ["1", "2", "U"].includes(rawGrade);
    scoreMap[k] = (shouldExcludeLv2 && isLv2OrBelow) ? 0 : v;
  }

  // Step 3: Apply weightings
  const weightedMap: Record<string, number> = { ...scoreMap };
  for (const w of (formula.weighted ?? [])) {
    if (weightedMap[w.subject] !== undefined) weightedMap[w.subject] = weightedMap[w.subject] * w.multiplier;
  }
  for (const w of (formula.weightedBestOf ?? [])) {
    const candidates = (w.subjects as string[]).filter((s: string) => weightedMap[s] !== undefined);
    if (candidates.length === 0) continue;
    const best = candidates.reduce((a: string, b: string) => (weightedMap[a] >= weightedMap[b] ? a : b));
    weightedMap[best] = weightedMap[best] * w.multiplier;
  }

  // Step 4: Build available pool
  const excluded = new Set(formula.excluded ?? []);
  const js4501Special = formula.js4501Special === true;
  if (js4501Special) { excluded.add("m1"); excluded.add("m2"); }
  const available = Object.entries(weightedMap).filter(([k]) => !excluded.has(k)).map(([k, v]) => ({ subject: k, score: v }));
  const required = new Set(formula.required ?? []);
  const requiredBestOfGroupsCmp: string[][] = formula.requiredBestOf ?? [];
  const requiredBestOfSubjectsCmp = new Set(requiredBestOfGroupsCmp.flat());
  const requiredBestOfEntriesCmp: Array<{ subject: string; score: number }> = [];
  const requiredBestOfNonBestCmp = new Set<string>();
  for (const group of requiredBestOfGroupsCmp) {
    const groupEntries = available.filter(e => group.includes(e.subject));
    if (groupEntries.length > 0) {
      groupEntries.sort((a, b) => b.score - a.score);
      requiredBestOfEntriesCmp.push(groupEntries[0]);
      for (const e of groupEntries.slice(1)) requiredBestOfNonBestCmp.add(e.subject);
    }
  }
  const requiredEntries = available.filter(e => required.has(e.subject));
  const allRequiredEntriesCmp = [...requiredEntries, ...requiredBestOfEntriesCmp];
  const allRequiredSubjectsCmp = new Set(allRequiredEntriesCmp.map(e => e.subject));
  const optionalEntries = available.filter(e =>
    !required.has(e.subject) &&
    !allRequiredSubjectsCmp.has(e.subject) &&
    (!requiredBestOfSubjectsCmp.has(e.subject) || requiredBestOfNonBestCmp.has(e.subject))
  );
  optionalEntries.sort((a, b) => b.score - a.score);

  // Step 5: Best N / 3C+2X selection
  const method = formula.method ?? "best5";
  let selectedEntries: Array<{ subject: string; score: number }> = [];
  if (method === "best5" || method === "best6" || method === "best7" || method === "best4") {
    const n = method === "best4" ? 4 : method === "best6" ? 6 : method === "best7" ? 7 : 5;
    // Required subjects (incl. requiredBestOf) are ALWAYS included; fill remaining slots with best optional subjects
    const remainingSlots = Math.max(0, n - allRequiredEntriesCmp.length);
    const topOptional = optionalEntries.slice(0, remainingSlots);
    selectedEntries = [...allRequiredEntriesCmp, ...topOptional];
    // JS4501/JS4502 special
    if (js4501Special && selectedEntries.length === n) {
      const m1Score = weightedMap["m1"] ?? 0;
      const m2Score = weightedMap["m2"] ?? 0;
      const bestMathExt = Math.max(m1Score, m2Score);
      if (bestMathExt > 0) {
        const lastEntry = selectedEntries[n - 1];
        if (bestMathExt > lastEntry.score) {
          selectedEntries[n - 1] = { subject: "m1m2_blend", score: lastEntry.score * 0.5 + bestMathExt * 0.5 };
        }
      }
    }
  } else if (method === "3c2x") {
    // 3C+2X: 3 core subjects + best 2 electives
    const coreSubjects = new Set(formula.coreSubjects ?? ["chinese","english","math"]);
    const coreEntries = available.filter(e => coreSubjects.has(e.subject));
    const electiveEntries = available.filter(e => !coreSubjects.has(e.subject)).sort((a, b) => b.score - a.score).slice(0, 2);
    selectedEntries = [...coreEntries, ...electiveEntries];
  }

  let total = selectedEntries.reduce((s, e) => s + e.score, 0);

  // Step 6: Bonus subject
  if (formula.bonusSubject) {
    const bonus = formula.bonusSubject;
    const selectedSubjects = new Set(selectedEntries.map(e => e.subject));
    let bonusScore = 0;
    if (bonus.subject) {
      bonusScore = (weightedMap[bonus.subject] ?? 0) * bonus.multiplier;
    } else {
      const remaining = available.filter(e => !selectedSubjects.has(e.subject)).sort((a, b) => b.score - a.score);
      if (remaining.length > 0) bonusScore = remaining[0].score * bonus.multiplier;
    }
    total += bonusScore;
  }

  return Math.round(total * 100) / 100;
}
function computeScorePctCmp(myScore: number, median: number | null | undefined): number | null {
  if (!median || Number(median) === 0) return null;
  return (myScore - Number(median)) / Number(median) * 100;
}
function formatPctCmp(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

function CompareValue({ value }: { value: string | null | undefined }) {
  if (!value || value === "—") return <span className="text-muted-foreground">—</span>;
  return <span>{value}</span>;
}

function BoolCell({ value }: { value: boolean | null | undefined }) {
  if (value === null || value === undefined) return <Minus className="w-4 h-4 text-muted-foreground mx-auto" />;
  return value
    ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
    : <XCircle className="w-4 h-4 text-muted-foreground mx-auto" />;
}

export default function Compare() {
  const { t, language } = useLanguage();
  const { compareList, clearCompare } = useCompare();
  const [dseScores] = useState<DSEScoreData | null>(() => loadDseForCompare());

  if (compareList.length === 0) {
    return (
      <div className="container py-20 text-center">
        <BarChart2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">{t("compare.title")}</h2>
        <p className="text-muted-foreground mb-6">{t("compare.empty")}</p>
        <Link href="/courses">
          <Button variant="outline" className="gap-2">
            <Search className="w-4 h-4" />
            {language === "en" ? "Browse Courses" : "瀏覽課程"}
          </Button>
        </Link>
      </div>
    );
  }

  const getName = (course: Course) =>
    language === "zh-CN" ? (course.nameZhCn || course.nameZhTw) :
    language === "en" ? (course.nameEn || course.nameZhTw) : course.nameZhTw;

  const rows: { label: string; key: keyof Course; format?: (v: any) => string; bool?: boolean }[] = [
    { label: t("courses.col.quota"), key: "quota" },
    { label: t("courses.col.minReq"), key: "minRequirement" },
    { label: t("courses.col.tuition"), key: "tuitionFee", format: (v) => v ? `$${v.toLocaleString()}` : "—" },
    { label: t("courses.col.admitted"), key: "lastYearAdmitted" },
    { label: t("courses.col.groupA"), key: "lastYearGroupAAdmitted" },
    { label: language === "en" ? "Duration" : "修讀年期", key: "duration", format: (v) => v ? `${v} ${language === "en" ? "years" : "年"}` : "—" },
    { label: t("courses.filter.scoring"), key: "scoringMethod" },
    { label: t("courses.filter.funding"), key: "fundingType", format: (v) => v ? t(`funding.${v}`) : "—" },
    { label: t("courses.filter.groupA"), key: "groupAOnly", bool: true },
    { label: t("courses.new"), key: "isNew", bool: true },
  ];

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2"
            style={{ fontFamily: "'Playfair Display', 'Noto Serif TC', serif" }}>
            <BarChart2 className="w-6 h-6" />
            {t("compare.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {language === "en" ? `Comparing ${compareList.length} courses` : `比較 ${compareList.length} 個課程`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={clearCompare}>{t("common.reset")}</Button>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="border border-border rounded-xl overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground w-36">
                  {language === "en" ? "Field" : "項目"}
                </th>
                {compareList.map((course) => (
                  <th key={course.id} className="text-center px-4 py-3 min-w-[160px]">
                    <div className="text-xs font-semibold line-clamp-2">{getName(course)}</div>
                    <div className="text-xs text-muted-foreground font-normal mt-0.5">{course.institution}</div>
                    {course.jupasCode && (
                      <div className="text-xs font-mono text-muted-foreground/70 mt-0.5">{course.jupasCode}</div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Row 0: My Score % deviation (first row, only when DSE scores available) */}
              {dseScores && (
                <tr className="border-b border-border bg-primary/5 hover:bg-primary/10 transition-colors">
                  <td className="px-4 py-2.5 text-xs font-semibold">
                    {language === "en" ? "My Score vs Median" : language === "zh-CN" ? "我的分数偏差" : "我的分數偏差"}
                    <div className="text-[10px] font-normal text-muted-foreground">
                      {language === "en" ? "(vs last year median)" : "(與去年中位數比較)"}
                    </div>
                  </td>
                  {compareList.map((course) => {
                    const myScore = computeMyScoreCmp(course, dseScores);
                    const refScore = (course.scoringMethodChanged && course.expectedScore)
                      ? Number(course.expectedScore)
                      : (course.lastYearMedian ? Number(course.lastYearMedian) : null);
                    const pct = myScore !== null ? computeScorePctCmp(myScore, refScore) : null;
                    return (
                      <td key={course.id} className="px-4 py-2.5 text-center">
                        {myScore === null ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-sm font-bold">{myScore.toFixed(2)}</span>
                            {pct !== null && (
                              <span className={cn(
                                "text-xs font-medium",
                                pct > 0 ? "text-green-600 dark:text-green-400" :
                                pct < 0 ? "text-red-600 dark:text-red-400" :
                                "text-muted-foreground"
                              )}>
                                {formatPctCmp(pct)}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              )}
              {rows.map(({ label, key, format, bool }) => (
                <tr key={String(key)} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-muted-foreground font-medium">{label}</td>
                  {compareList.map((course) => {
                    const val = course[key];
                    return (
                      <td key={course.id} className="px-4 py-2.5 text-center text-sm">
                        {bool ? (
                          <BoolCell value={val as boolean | null | undefined} />
                        ) : (
                          <CompareValue value={format ? format(val) : val != null ? String(val) : "—"} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


    </div>
  );
}
