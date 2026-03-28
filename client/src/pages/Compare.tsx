import { useState } from "react";
import { useCompare } from "@/contexts/CompareContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  BarChart2, Search, Loader2, Sparkles, Download,
  CheckCircle2, XCircle, Minus, Save,
} from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { getLoginUrl } from "@/const";
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
  const { isAuthenticated } = useAuth();
  const { compareList, clearCompare } = useCompare();
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const aiCompare = trpc.ai.compareAnalysis.useMutation({
    onSuccess: (data: { analysis: string | any[] }) => {
      const content = typeof data.analysis === 'string' ? data.analysis : JSON.stringify(data.analysis);
      setAiAnalysis(content);
      setIsAnalyzing(false);
    },
    onError: (e: { message: string }) => {
      toast.error(e.message);
      setIsAnalyzing(false);
    },
  });

  const saveReport = trpc.reports.save.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Report saved!" : "報告已儲存");
      setIsSaving(false);
    },
    onError: (e: { message: string }) => {
      toast.error(e.message);
      setIsSaving(false);
    },
  });

  const handleAnalyze = () => {
    if (compareList.length < 2) {
      toast.error(language === "en" ? "Add at least 2 courses to compare" : "請至少選擇 2 個課程進行比較");
      return;
    }
    setIsAnalyzing(true);
    setAiAnalysis("");
    aiCompare.mutate({
      courseIds: compareList.map((c) => c.id),
      language: language as "zh-TW" | "zh-CN" | "en",
    });
  };

  const handleSaveReport = () => {
    if (!isAuthenticated) {
      toast.error(t("common.loginRequired"), {
        action: { label: t("nav.login"), onClick: () => window.location.href = getLoginUrl() },
      });
      return;
    }
    if (!aiAnalysis) {
      toast.error(language === "en" ? "Generate analysis first" : "請先生成分析報告");
      return;
    }
    setIsSaving(true);
    const title = `${compareList.map((c) => c.nameZhTw).join(" vs ")} 比較報告`;
    // Save text report as base64
    const reportData = btoa(unescape(encodeURIComponent(aiAnalysis)));
    saveReport.mutate({
      title,
      courseIds: compareList.map((c) => c.id),
      reportData,
    });
  };

  const handleDownload = () => {
    if (!aiAnalysis) return;
    const blob = new Blob([aiAnalysis], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jupasearch-compare-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
          <Button size="sm" className="gap-2" onClick={handleAnalyze} disabled={isAnalyzing}>
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {t("compare.analyze")}
          </Button>
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

      {/* AI Analysis */}
      <div className="border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {t("compare.aiAnalysis")}
          </h2>
          {aiAnalysis && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-2" onClick={handleDownload}>
                <Download className="w-4 h-4" />
                {language === "en" ? "Download" : "下載"}
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleSaveReport} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {language === "en" ? "Save Report" : "儲存報告"}
              </Button>
            </div>
          )}
        </div>

        {!aiAnalysis && !isAnalyzing && (
          <div className="text-center py-10">
            <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">{t("compare.aiAnalysis.empty")}</p>
            <Button size="sm" className="gap-2" onClick={handleAnalyze}>
              <Sparkles className="w-4 h-4" />
              {t("compare.analyze")}
            </Button>
          </div>
        )}

        {isAnalyzing && (
          <div className="text-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{t("ai.analyzing")}</p>
          </div>
        )}

        {aiAnalysis && (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <Streamdown>{aiAnalysis}</Streamdown>
          </div>
        )}
      </div>
    </div>
  );
}
