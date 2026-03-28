import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2, GraduationCap, BookOpen, Target, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";

const DSE_SUBJECTS = [
  "中國語文", "英國語文", "數學（必修）", "通識教育/公民與社會發展科",
  "數學（延伸部分M1）", "數學（延伸部分M2）",
  "中國文學", "英國文學", "中國歷史", "歷史", "地理",
  "經濟", "倫理與宗教", "資訊及通訊科技", "視覺藝術",
  "音樂", "體育", "旅遊與款待", "設計與應用科技",
  "健康管理與社會關懷", "企業、會計與財務概論",
  "物理", "化學", "生物", "組合科學", "科學（組合）",
];

const GRADE_OPTIONS = ["5**", "5*", "5", "4", "3", "2", "1", "U"];

interface SubjectGrade {
  subject: string;
  grade: string;
}

export default function AIAdvisor() {
  const { t, language } = useLanguage();
  const { isAuthenticated } = useAuth();

  const [grades, setGrades] = useState<SubjectGrade[]>([
    { subject: "中國語文", grade: "" },
    { subject: "英國語文", grade: "" },
    { subject: "數學（必修）", grade: "" },
    { subject: "通識教育/公民與社會發展科", grade: "" },
  ]);
  const [interests, setInterests] = useState("");
  const [targetInstitutions, setTargetInstitutions] = useState("");
  const [preferences, setPreferences] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const aiAdvise = trpc.ai.recommend.useMutation({
    onSuccess: (data: { recommendation: string | any[] }) => {
      const content = typeof data.recommendation === 'string' ? data.recommendation : JSON.stringify(data.recommendation);
      setResult(content);
      setIsLoading(false);
    },
    onError: (e: { message: string }) => {
      toast.error(e.message);
      setIsLoading(false);
    },
  });

  const addSubject = () => {
    if (grades.length >= 10) return;
    setGrades([...grades, { subject: "", grade: "" }]);
  };

  const updateGrade = (index: number, field: "subject" | "grade", value: string) => {
    const newGrades = [...grades];
    newGrades[index] = { ...newGrades[index], [field]: value };
    setGrades(newGrades);
  };

  const removeSubject = (index: number) => {
    if (index < 4) return; // keep core subjects
    setGrades(grades.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const filledGrades = grades.filter((g) => g.subject && g.grade);
    if (filledGrades.length < 4) {
      toast.error(language === "en" ? "Please fill in at least 4 subjects" : "請填寫至少4科成績");
      return;
    }
    setIsLoading(true);
    setResult("");
    // Map grades to DSE score format
    const gradeToNum = (g: string) => {
      const map: Record<string, number> = { "5**": 5, "5*": 5, "5": 5, "4": 4, "3": 3, "2": 2, "1": 1, "U": 1 };
      return map[g] ?? 3;
    };
    const chinese = gradeToNum(filledGrades.find((g) => g.subject === "中國語文")?.grade ?? "");
    const english = gradeToNum(filledGrades.find((g) => g.subject === "英國語文")?.grade ?? "");
    const math = gradeToNum(filledGrades.find((g) => g.subject.includes("數學（必修）"))?.grade ?? "");
    const ls = gradeToNum(filledGrades.find((g) => g.subject.includes("通識") || g.subject.includes("公民"))?.grade ?? "");
    const electives = filledGrades.filter((g) =>
      !g.subject.includes("中國語文") && !g.subject.includes("英國語文") &&
      !g.subject.includes("數學（必修）") && !g.subject.includes("通識") && !g.subject.includes("公民")
    ).slice(0, 3);

    aiAdvise.mutate({
      dseScores: {
        chinese, english, math, ls,
        elective1: electives[0] ? gradeToNum(electives[0].grade) : undefined,
        elective2: electives[1] ? gradeToNum(electives[1].grade) : undefined,
        elective3: electives[2] ? gradeToNum(electives[2].grade) : undefined,
        elective1Name: electives[0]?.subject,
        elective2Name: electives[1]?.subject,
        elective3Name: electives[2]?.subject,
      },
      interests: interests.split(/[,，\n]/).map((s) => s.trim()).filter(Boolean),
      targetInstitutions: targetInstitutions.split(/[,，\n]/).map((s) => s.trim()).filter(Boolean),
      language: language as "zh-TW" | "zh-CN" | "en",
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center">
        <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">{t("ai.title")}</h2>
        <p className="text-muted-foreground mb-6">{t("ai.loginRequired")}</p>
        <Button onClick={() => window.location.href = getLoginUrl()} className="gap-2">
          {t("nav.login")}
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2"
          style={{ fontFamily: "'Playfair Display', 'Noto Serif TC', serif" }}>
          <Sparkles className="w-6 h-6" />
          {t("ai.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("ai.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-5">
          {/* DSE Grades */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {t("ai.grades")}
              </h2>
              <Button variant="ghost" size="sm" onClick={addSubject} disabled={grades.length >= 10} className="text-xs h-7">
                + {t("ai.addSubject")}
              </Button>
            </div>
            <div className="space-y-2">
              {grades.map((g, i) => (
                <div key={i} className="flex items-center gap-2">
                  {i < 4 ? (
                    <div className="flex-1 text-sm text-muted-foreground bg-secondary rounded-md px-3 py-2 border border-border">
                      {g.subject}
                    </div>
                  ) : (
                    <Select value={g.subject} onValueChange={(v) => updateGrade(i, "subject", v)}>
                      <SelectTrigger className="flex-1 h-9">
                        <SelectValue placeholder={t("ai.selectSubject")} />
                      </SelectTrigger>
                      <SelectContent>
                        {DSE_SUBJECTS.filter((s) => !grades.slice(0, i).find((g2) => g2.subject === s)).map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Select value={g.grade} onValueChange={(v) => updateGrade(i, "grade", v)}>
                    <SelectTrigger className="w-20 h-9">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_OPTIONS.map((gr) => (
                        <SelectItem key={gr} value={gr}>{gr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {i >= 4 && (
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeSubject(i)}>
                      ×
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* Interests */}
          <section>
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Target className="w-4 h-4" />
              {t("ai.interests")}
            </h2>
            <Textarea
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder={t("ai.interests.placeholder")}
              rows={3}
              className="text-sm"
            />
          </section>

          {/* Target Institutions */}
          <section>
            <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
              <GraduationCap className="w-4 h-4" />
              {t("ai.targetInstitutions")}
            </Label>
            <Input
              value={targetInstitutions}
              onChange={(e) => setTargetInstitutions(e.target.value)}
              placeholder={t("ai.targetInstitutions.placeholder")}
              className="text-sm"
            />
          </section>

          {/* Other Preferences */}
          <section>
            <Label className="text-sm font-semibold mb-2 block">{t("ai.preferences")}</Label>
            <Textarea
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder={t("ai.preferences.placeholder")}
              rows={2}
              className="text-sm"
            />
          </section>

          <Button
            className="w-full gap-2"
            onClick={handleSubmit}
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {t("ai.generate")}
          </Button>
        </div>

        {/* Result Panel */}
        <div>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {t("ai.result")}
          </h2>

          {!result && !isLoading && (
            <div className="border border-dashed border-border rounded-xl p-8 text-center">
              <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{t("ai.result.empty")}</p>
            </div>
          )}

          {isLoading && (
            <div className="border border-border rounded-xl p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{t("ai.analyzing")}</p>
            </div>
          )}

          {result && (
            <div className="border border-border rounded-xl p-5 bg-card prose prose-sm max-w-none dark:prose-invert">
              <Streamdown>{result}</Streamdown>
            </div>
          )}

          {result && (
            <div className="mt-4">
              <Link href="/courses">
                <Button variant="outline" size="sm" className="gap-2 w-full">
                  <ChevronRight className="w-4 h-4" />
                  {t("ai.browseCourses")}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
