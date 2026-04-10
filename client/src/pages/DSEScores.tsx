import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Calculator, Save, RotateCcw, Info } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

// DSE subject grades
// Chinese & English: minimum grade 3 (no 2, 1, U)
const CHINESE_ENGLISH_GRADES = ["5**", "5*", "5", "4", "3", "—"] as const;
// Math, M1, M2, Electives: minimum grade 2 (no 1, U)
const OTHER_GRADES = ["5**", "5*", "5", "4", "3", "2", "—"] as const;
// Keep legacy names as aliases for backward compat
const CORE_GRADES = OTHER_GRADES;
const CHINESE_GRADES = CHINESE_ENGLISH_GRADES;
const LIBERAL_STUDIES_GRADES = ["達標", "未達標"] as const;
const APPLIED_LEARNING_GRADES = ["達標並表現優異（I）", "達標並表現優異（II）", "達標", "未達標"] as const;

const FRENCH_GERMAN_SPANISH_GRADES = ["C2", "C1", "B2", "B1", "A2", "—"] as const;
const JAPANESE_GRADES = ["N1", "N2", "N3", "—"] as const;
const KOREAN_GRADES = ["第 6 級", "第 5 級", "第 4 級", "第 3 級", "—"] as const;
const URDU_GRADES = ["A++", "A+", "A", "B++", "B+", "B", "C", "D", "E", "—"] as const;

const ELECTIVE_SUBJECTS_ZH_TW = [
  "物理",
  "化學",
  "生物",
  "組合科學（物理、化學）",
  "組合科學（化學、生物）",
  "組合科學（物理、生物）",
  "綜合科學",
  "資訊及通訊科技",
  "設計與應用科技",
  "健康管理與社會關懷",
  "科技與生活（服裝、成衣與紡織）",
  "科技與生活（食物科學與科技）",
  "企業、會計與財務概論（會計選修部分）",
  "企業、會計與財務概論（商業管理選修部分）",
  "企業、會計與財務概論",
  "經濟",
  "地理",
  "歷史",
  "中國歷史",
  "倫理與宗教",
  "中國文學",
  "英國文學",
  "旅遊與款待",
  "視覺藝術",
  "音樂",
  "體育",
];

const ELECTIVE_SUBJECTS_ZH_CN = [
  "物理",
  "化学",
  "生物",
  "组合科学（物理、化学）",
  "组合科学（化学、生物）",
  "组合科学（物理、生物）",
  "综合科学",
  "资讯及通讯科技",
  "设计与应用科技",
  "健康管理与社会关顾",
  "科技与生活（服装、成衣与纵织）",
  "科技与生活（食物科学与科技）",
  "企业、会计与财务概论（会计选修部分）",
  "企业、会计与财务概论（商业管理选修部分）",
  "企业、会计与财务概论",
  "经济",
  "地理",
  "历史",
  "中国历史",
  "伦理与宗教",
  "中国文学",
  "英国文学",
  "旅游与款待",
  "视觉艺术",
  "音乐",
  "体育",
];

const ELECTIVE_SUBJECTS_EN = [
  "Physics",
  "Chemistry",
  "Biology",
  "Combined Science (Physics, Chemistry)",
  "Combined Science (Chemistry, Biology)",
  "Combined Science (Physics, Biology)",
  "Integrated Science",
  "Information and Communication Technology",
  "Design and Applied Technology",
  "Health Management and Social Care",
  "Technology and Living (Clothing, Textiles and Needlework)",
  "Technology and Living (Food Science and Technology)",
  "BAFS (Accounting Elective)",
  "BAFS (Business Management Elective)",
  "Business, Accounting and Financial Studies",
  "Economics",
  "Geography",
  "History",
  "Chinese History",
  "Ethics and Religious Studies",
  "Chinese Literature",
  "English Literature",
  "Tourism and Hospitality Studies",
  "Visual Arts",
  "Music",
  "Physical Education",
];

const COOKIE_KEY = "jupasearch_dse_scores";

export interface DSEScoreData {
  chinese: string;
  english: string;
  math: string;
  m1: string;
  m2: string;
  civics: string;
  elective1Subject: string;
  elective1Grade: string;
  elective2Subject: string;
  elective2Grade: string;
  elective3Subject: string;
  elective3Grade: string;
  elective4Subject: string;
  elective4Grade: string;
  appliedLearningSubject: string;
  appliedLearningGrade: string;
  otherLanguage: string;
  otherLanguageGrade: string;
}

const DEFAULT_SCORES: DSEScoreData = {
  chinese: "—",
  english: "—",
  math: "—",
  m1: "—",
  m2: "—",
  civics: "達標",
  elective1Subject: "",
  elective1Grade: "—",
  elective2Subject: "",
  elective2Grade: "—",
  elective3Subject: "",
  elective3Grade: "—",
  elective4Subject: "",
  elective4Grade: "—",
  appliedLearningSubject: "",
  appliedLearningGrade: "—",
  otherLanguage: "",
  otherLanguageGrade: "—",
};

function loadFromCookie(): DSEScoreData {
  try {
    const raw = document.cookie
      .split("; ")
      .find((row) => row.startsWith(COOKIE_KEY + "="));
    if (raw) {
      const val = decodeURIComponent(raw.split("=")[1] ?? "");
      return { ...DEFAULT_SCORES, ...JSON.parse(val) };
    }
  } catch {}
  return { ...DEFAULT_SCORES };
}

function saveToCookie(data: DSEScoreData) {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(JSON.stringify(data))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

function gradeToScore(grade: string): number {
  const map: Record<string, number> = {
    "5**": 7, "5*": 6, "5": 5, "4": 4, "3": 3, "2": 2, "1": 1, "U": 0, "—": 0,
  };
  return map[grade] ?? 0;
}

export default function DSEScores() {
  const { language } = useLanguage();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [scores, setScores] = useState<DSEScoreData>(loadFromCookie);
  const [saved, setSaved] = useState(false);

  const saveScoresMutation = trpc.dse.saveScores.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Scores saved to account!" : language === "zh-CN" ? "成绩已保存至账户！" : "成績已儲存至帳戶！");
    },
    onError: (e) => toast.error(e.message),
  });

  // Only query when auth is fully resolved AND user is authenticated
  // This prevents the global redirect triggered by protectedProcedure when called unauthenticated
  const { data: savedScores } = trpc.dse.getScores.useQuery(undefined, {
    enabled: !authLoading && isAuthenticated,
  });

  useEffect(() => {
    if (savedScores) {
      setScores({ ...DEFAULT_SCORES, ...savedScores });
    }
  }, [savedScores]);

  const handleChange = (key: keyof DSEScoreData, value: string) => {
    // "none" means clear the selection
    const next = { ...scores, [key]: value === "none" ? "" : value };
    setScores(next);
    saveToCookie(next);
    setSaved(false);
  };

  const handleReset = () => {
    setScores({ ...DEFAULT_SCORES });
    saveToCookie({ ...DEFAULT_SCORES });
    setSaved(false);
    toast.success(language === "en" ? "Scores cleared" : language === "zh-CN" ? "成绩已清除" : "成績已清除");
  };

  const handleSaveToAccount = () => {
    if (!isAuthenticated) {
      toast.error(language === "en" ? "Please login to save scores" : language === "zh-CN" ? "请登录以保存成绩" : "請登入以儲存成績", {
        action: {
          label: language === "en" ? "Login" : "登入",
          onClick: () => window.location.href = getLoginUrl(),
        },
      });
      return;
    }
    saveScoresMutation.mutate(scores);
    setSaved(true);
  };

  // Calculate best 5 score
  const coreScores = [
    gradeToScore(scores.chinese),
    gradeToScore(scores.english),
    gradeToScore(scores.math),
  ];
  const electiveScores = [
    gradeToScore(scores.elective1Grade),
    gradeToScore(scores.elective2Grade),
    gradeToScore(scores.elective3Grade),
  ].filter((s) => s > 0);
  const allScores = [...coreScores, ...electiveScores].sort((a, b) => b - a);
  const best5 = allScores.slice(0, 5).reduce((a, b) => a + b, 0);
  const best6 = allScores.slice(0, 6).reduce((a, b) => a + b, 0);

  // Fetch applied learning subjects from backend (set by admin)
  const { data: appliedLearningSubjects = [] } = trpc.settings.getAppliedLearningSubjects.useQuery();

  const electives = language === "zh-CN" ? ELECTIVE_SUBJECTS_ZH_CN : language === "en" ? ELECTIVE_SUBJECTS_EN : ELECTIVE_SUBJECTS_ZH_TW;

  // Use language codes as values (language-independent) to avoid mismatch when UI language changes
  const OTHER_LANG_CODES = ["french", "german", "japanese", "korean", "spanish", "urdu"] as const;
  const otherLanguageGrades: Record<string, readonly string[]> = {
    "french": FRENCH_GERMAN_SPANISH_GRADES,
    "german": FRENCH_GERMAN_SPANISH_GRADES,
    "spanish": FRENCH_GERMAN_SPANISH_GRADES,
    "japanese": JAPANESE_GRADES,
    "korean": KOREAN_GRADES,
    "urdu": URDU_GRADES,
  };

  const otherLanguageLabels: Record<string, Record<string, string>> = {
    "french":   { "zh-TW": "法語",     "zh-CN": "法语",     "en": "French" },
    "german":   { "zh-TW": "德語",     "zh-CN": "德语",     "en": "German" },
    "japanese": { "zh-TW": "日語",     "zh-CN": "日语",     "en": "Japanese" },
    "korean":   { "zh-TW": "韓語",     "zh-CN": "韩语",     "en": "Korean" },
    "spanish":  { "zh-TW": "西班牙語", "zh-CN": "西班牙语", "en": "Spanish" },
    "urdu":     { "zh-TW": "烏爾都語", "zh-CN": "乌尔都语", "en": "Urdu" },
  };

  const currentOtherLangGrades = scores.otherLanguage
    ? (otherLanguageGrades[scores.otherLanguage] ?? FRENCH_GERMAN_SPANISH_GRADES)
    : FRENCH_GERMAN_SPANISH_GRADES;

  const t = {
    title: { "zh-TW": "文憑試成績", "zh-CN": "文凭试成绩", en: "DSE Scores" },
    subtitle: {
      "zh-TW": "輸入您的文憑試成績，系統將自動儲存至本機，無需登入即可使用課程搜尋功能。",
      "zh-CN": "输入您的文凭试成绩，系统将自动保存至本机，无需登录即可使用课程搜尋功能。",
      en: "Enter your DSE scores. They are automatically saved locally without login, ready to use for course search.",
    },
    core: { "zh-TW": "核心科目", "zh-CN": "核心科目", en: "Core Subjects" },
    electives: { "zh-TW": "選修科目", "zh-CN": "选修科目", en: "Elective Subjects" },
    appliedLearning: { "zh-TW": "應用學習科目", "zh-CN": "应用学习科目", en: "Applied Learning" },
    appliedLearningNote: {
      "zh-TW": "只提供有課程計入的應用學習科目",
      "zh-CN": "只提供有课程计入的应用学习科目",
      en: "Only subjects counted by courses are listed",
    },
    otherLanguage: { "zh-TW": "其他語言科目", "zh-CN": "其他语言科目", en: "Other Languages" },
    subject: { "zh-TW": "科目", "zh-CN": "科目", en: "Subject" },
    grade: { "zh-TW": "等級", "zh-CN": "等级", en: "Grade" },
    chinese: { "zh-TW": "中國語文", "zh-CN": "中国语文", en: "Chinese Language" },
    english: { "zh-TW": "英國語文", "zh-CN": "英国语文", en: "English Language" },
    math: { "zh-TW": "數學（必修部分）", "zh-CN": "数学（必修部分）", en: "Mathematics (Compulsory)" },
    m1: { "zh-TW": "數學延伸部分 M1", "zh-CN": "数学延伸部分 M1", en: "Mathematics Extended M1" },
    m2: { "zh-TW": "數學延伸部分 M2", "zh-CN": "数学延伸部分 M2", en: "Mathematics Extended M2" },
    civics: { "zh-TW": "公民與社會發展科", "zh-CN": "公民与社会发展科", en: "Citizenship & Social Development" },
    civicsNote: { "zh-TW": "只提供「達標」選項", "zh-CN": "只提供「达标」选项", en: "Only \"Attained\" available" },
    selectSubject: { "zh-TW": "選擇科目", "zh-CN": "选择科目", en: "Select subject" },
    inputSubjectName: { "zh-TW": "輸入科目名稱", "zh-CN": "输入科目名称", en: "Enter subject name" },
    saveToAccount: { "zh-TW": "儲存至帳戶", "zh-CN": "保存至账户", en: "Save to Account" },
    reset: { "zh-TW": "重置", "zh-CN": "重置", en: "Reset" },
    best5: { "zh-TW": "最佳 5 科", "zh-CN": "最佳 5 科", en: "Best 5" },
    best6: { "zh-TW": "最佳 6 科", "zh-CN": "最佳 6 科", en: "Best 6" },
    scoreCalc: { "zh-TW": "成績估算（參考）", "zh-CN": "成绩估算（参考）", en: "Score Estimate (Reference)" },
    searchCourses: { "zh-TW": "搜尋課程", "zh-CN": "搜寻课程", en: "Search Courses" },
    localSaved: { "zh-TW": "✓ 已自動儲存至本機", "zh-CN": "✓ 已自动保存至本机", en: "✓ Auto-saved locally" },
  };

  const l = language as keyof typeof t.title;

  return (
    <div className="container py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2"
          style={{ fontFamily: "'Playfair Display', 'Noto Serif TC', serif" }}>
          <Calculator className="w-6 h-6" />
          {t.title[l]}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">{t.subtitle[l]}</p>
      </div>



      <div className="space-y-6">
        {/* Core Subjects */}
        <div className="border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">{t.core[l]}</h2>
          <div className="space-y-3">
            {/* Chinese */}
            <div className="flex items-center gap-3">
              <Label className="w-48 text-sm flex-shrink-0">{t.chinese[l]}</Label>
              <Select value={scores.chinese} onValueChange={(v) => handleChange("chinese", v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHINESE_GRADES.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* English */}
            <div className="flex items-center gap-3">
              <Label className="w-48 text-sm flex-shrink-0">{t.english[l]}</Label>
              <Select value={scores.english} onValueChange={(v) => handleChange("english", v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHINESE_ENGLISH_GRADES.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Math */}
            <div className="flex items-center gap-3">
              <Label className="w-48 text-sm flex-shrink-0">{t.math[l]}</Label>
              <Select value={scores.math} onValueChange={(v) => handleChange("math", v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CORE_GRADES.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Math Extended M1 */}
            <div className="flex items-center gap-3">
              <Label className="w-48 text-sm flex-shrink-0">{t.m1[l]}</Label>
              <Select value={scores.m1} onValueChange={(v) => handleChange("m1", v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CORE_GRADES.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Math Extended M2 */}
            <div className="flex items-center gap-3">
              <Label className="w-48 text-sm flex-shrink-0">{t.m2[l]}</Label>
              <Select value={scores.m2} onValueChange={(v) => handleChange("m2", v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CORE_GRADES.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Civics */}
            <div className="flex items-center gap-3">
              <div className="w-48 flex-shrink-0">
                <Label className="text-sm">{t.civics[l]}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">{t.civicsNote[l]}</p>
              </div>
              <Select value="達標" disabled>
                <SelectTrigger className="flex-1 opacity-60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="達標">達標</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Elective Subjects */}
        <div className="border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">{t.electives[l]}</h2>
          <div className="space-y-4">
            {([1, 2, 3, 4] as const).map((n) => {
              const subjectKey = `elective${n}Subject` as keyof DSEScoreData;
              const gradeKey = `elective${n}Grade` as keyof DSEScoreData;
              return (
                <div key={n} className="flex items-center gap-3">
                  <Label className="w-12 text-sm flex-shrink-0 text-muted-foreground">#{n}</Label>
                  <Select value={scores[subjectKey]} onValueChange={(v) => handleChange(subjectKey, v)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={t.selectSubject[l]} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {electives.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={scores[gradeKey]}
                    onValueChange={(v) => handleChange(gradeKey, v)}
                    disabled={!scores[subjectKey]}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CORE_GRADES.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        </div>

        {/* Applied Learning — admin only */}
        {isAdmin && <div className="border border-border rounded-xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">{t.appliedLearning[l]}</h2>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Info className="w-3 h-3" />
                {t.appliedLearningNote[l]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={scores.appliedLearningSubject || "none"}
              onValueChange={(v) => {
                handleChange("appliedLearningSubject", v === "none" ? "" : v);
                if (v === "none") handleChange("appliedLearningGrade", "—");
              }}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={t.selectSubject[l]} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {appliedLearningSubjects.map((s) => {
                  const name = language === "zh-CN" ? (s.nameZhCn || s.nameZhTw) : language === "en" ? (s.nameEn || s.nameZhTw) : s.nameZhTw;
                  return <SelectItem key={s.nameZhTw} value={s.nameZhTw}>{name}</SelectItem>;
                })}
              </SelectContent>
            </Select>
            <Select
              value={scores.appliedLearningGrade}
              onValueChange={(v) => handleChange("appliedLearningGrade", v)}
              disabled={!scores.appliedLearningSubject}
            >
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPLIED_LEARNING_GRADES.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>}

        {/* Other Language — admin only */}
        {isAdmin && <div className="border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">{t.otherLanguage[l]}</h2>
          <div className="flex items-center gap-3">
            <Select
              value={scores.otherLanguage || "none"}
              onValueChange={(v) => {
                const val = v === "none" ? "" : v;
                handleChange("otherLanguage", val);
                handleChange("otherLanguageGrade", "—");
              }}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={t.selectSubject[l]} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {OTHER_LANG_CODES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {otherLanguageLabels[code]?.[language] ?? otherLanguageLabels[code]?.["zh-TW"] ?? code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={scores.otherLanguageGrade || "—"}
              onValueChange={(v) => handleChange("otherLanguageGrade", v)}
              disabled={!scores.otherLanguage}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentOtherLangGrades.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>}
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{t.localSaved[l]}</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" />
            {t.reset[l]}
          </Button>
          <Link href="/courses">
            <Button size="sm" className="gap-2">
              <Calculator className="w-4 h-4" />
              {t.searchCourses[l]}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
