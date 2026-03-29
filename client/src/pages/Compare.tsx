import { useCompare } from "@/contexts/CompareContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BarChart2, Search, CheckCircle2, XCircle, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Course } from "../../../drizzle/schema";

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
    { label: t("courses.col.median"), key: "lastYearMedian" },
    { label: t("courses.col.q1"), key: "lastYearQ1" },
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
