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
function computeMyScoreCmp(course: Course, dse: DSEScoreData): number | null {
  const formula = (course as any).scoreFormula;
  if (!formula) return null;
  const scale = (course as any).scoringScale as string | undefined;
  const scoreMap: Record<string, number> = {};
  scoreMap["chinese"] = dseGradeToScoreCmp(dse.chinese, scale);
  scoreMap["english"] = dseGradeToScoreCmp(dse.english, scale);
  scoreMap["math"] = dseGradeToScoreCmp(dse.math, scale);
  if (dse.m1 && dse.m1 !== "—") scoreMap["m1"] = dseGradeToScoreCmp(dse.m1, scale);
  if (dse.m2 && dse.m2 !== "—") scoreMap["m2"] = dseGradeToScoreCmp(dse.m2, scale);
  [[dse.elective1Subject, dse.elective1Grade],[dse.elective2Subject, dse.elective2Grade],[dse.elective3Subject, dse.elective3Grade],[(dse as any).elective4Subject, (dse as any).elective4Grade]]
    .forEach(([subj, grade]) => { if (subj) scoreMap[subj] = dseGradeToScoreCmp(grade, scale); });
  const weightedMap: Record<string, number> = { ...scoreMap };
  for (const w of (formula.weighted ?? [])) {
    if (weightedMap[w.subject] !== undefined) weightedMap[w.subject] = weightedMap[w.subject] * w.multiplier;
  }
  const excluded = new Set(formula.excluded ?? []);
  const available = Object.entries(weightedMap).filter(([k]) => !excluded.has(k)).map(([k, v]) => ({ subject: k, score: v }));
  const required = new Set(formula.required ?? []);
  const requiredEntries = available.filter(e => required.has(e.subject));
  const optionalEntries = available.filter(e => !required.has(e.subject));
  const method = formula.method ?? "best5";
  let total = 0;
  if (method === "best5" || method === "best6" || method === "best7" || method === "best4") {
    const n = method === "best4" ? 4 : method === "best6" ? 6 : method === "best7" ? 7 : 5;
    const pool = [...requiredEntries, ...optionalEntries];
    pool.sort((a, b) => b.score - a.score);
    total = pool.slice(0, n).reduce((s, e) => s + e.score, 0);
  } else if (method === "2c3x") {
    const coreSubjects = new Set(formula.coreSubjects ?? ["chinese","english","math"]);
    const coreEntries = available.filter(e => coreSubjects.has(e.subject)).sort((a, b) => b.score - a.score).slice(0, 2);
    const electiveEntries = available.filter(e => !coreSubjects.has(e.subject)).sort((a, b) => b.score - a.score).slice(0, 3);
    total = [...coreEntries, ...electiveEntries].reduce((s, e) => s + e.score, 0);
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
                    const pct = myScore !== null ? computeScorePctCmp(myScore, course.lastYearMedian ? Number(course.lastYearMedian) : null) : null;
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
