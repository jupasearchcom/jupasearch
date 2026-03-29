import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import {
  Settings, Plus, Pencil, Trash2, Upload, Search,
  Loader2, AlertCircle, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Course } from "../../../drizzle/schema";
import { Link } from "wouter";

const INSTITUTIONS = [
  "香港城市大學", "香港浸會大學", "嶺南大學", "香港中文大學",
  "香港教育大學", "香港理工大學", "香港科技大學", "香港大學",
  "香港都會大學", "港珠海學院", "香港樹仁大學", "聖方濟各大學",
  "香港高等教育科技學院", "香港恒生大學", "東華學院", "香港伍倫貢學院",
];

const DEGREE_TYPES = ["BA", "BSc", "BEng", "BEd", "BLaw", "BBA", "BNurs", "BPharm", "BArch", "BSW", "BSSc", "BFA", "BMus", "LLB"];

interface CourseFormData {
  jupasCode: string;
  nameZhTw: string;
  nameZhCn: string;
  nameEn: string;
  degreeType: string;
  institution: string;
  duration: string;
  qualification: string;
  scoringMethod: string;
  minRequirement: string;
  interviewArrangement: string;
  quota: string;
  lastYearMedian: string;
  lastYearQ1: string;
  lastYearAdmitted: string;
  lastYearGroupAAdmitted: string;
  lastYearGroupAApplicants: string;
  lastYearTotalApplicants: string;
  groupAOnly: boolean;
  scoreGap: string;
  fundingType: string;
  tuitionFee: string;
  scoringMethodChanged: boolean;
  isNew: boolean;
  descriptionZhTw: string;
  careerProspectsZhTw: string;
  websiteUrl: string;
  jupasOfficialUrl: string;
  acceptMultipleSittings: string;
  flexibleAdmission: boolean;
  scoreFormulaJson: string; // JSON string for scoreFormula
}

const emptyForm: CourseFormData = {
  jupasCode: "", nameZhTw: "", nameZhCn: "", nameEn: "",
  degreeType: "", institution: "", duration: "", qualification: "",
  scoringMethod: "", minRequirement: "", interviewArrangement: "",
  quota: "", lastYearMedian: "", lastYearQ1: "", lastYearAdmitted: "",
  lastYearGroupAAdmitted: "", lastYearGroupAApplicants: "", lastYearTotalApplicants: "",
  groupAOnly: false, scoreGap: "", fundingType: "", tuitionFee: "",
  scoringMethodChanged: false, isNew: false,
  descriptionZhTw: "", careerProspectsZhTw: "", websiteUrl: "",
  jupasOfficialUrl: "", acceptMultipleSittings: "", flexibleAdmission: false,
  scoreFormulaJson: "",
};

function courseToForm(course: Course): CourseFormData {
  return {
    jupasCode: course.jupasCode ?? "",
    nameZhTw: course.nameZhTw,
    nameZhCn: course.nameZhCn ?? "",
    nameEn: course.nameEn ?? "",
    degreeType: course.degreeType ?? "",
    institution: course.institution,
    duration: course.duration?.toString() ?? "",
    qualification: course.qualification ?? "",
    scoringMethod: course.scoringMethod ?? "",
    minRequirement: course.minRequirement ?? "",
    interviewArrangement: course.interviewArrangement ?? "",
    quota: course.quota?.toString() ?? "",
    lastYearMedian: course.lastYearMedian?.toString() ?? "",
    lastYearQ1: course.lastYearQ1?.toString() ?? "",
    lastYearAdmitted: course.lastYearAdmitted?.toString() ?? "",
    lastYearGroupAAdmitted: course.lastYearGroupAAdmitted?.toString() ?? "",
    lastYearGroupAApplicants: course.lastYearGroupAApplicants?.toString() ?? "",
    lastYearTotalApplicants: course.lastYearTotalApplicants?.toString() ?? "",
    groupAOnly: course.groupAOnly ?? false,
    scoreGap: course.scoreGap ?? "",
    fundingType: course.fundingType ?? "",
    tuitionFee: course.tuitionFee?.toString() ?? "",
    scoringMethodChanged: course.scoringMethodChanged ?? false,
    isNew: course.isNew ?? false,
    descriptionZhTw: course.descriptionZhTw ?? "",
    careerProspectsZhTw: course.careerProspectsZhTw ?? "",
    websiteUrl: course.websiteUrl ?? "",
    jupasOfficialUrl: course.jupasOfficialUrl ?? "",
    acceptMultipleSittings: (course as any).acceptMultipleSittings ?? "",
    flexibleAdmission: (course as any).flexibleAdmission ?? false,
    scoreFormulaJson: course.scoreFormula ? JSON.stringify(course.scoreFormula, null, 2) : "",
  };
}

function formToInput(form: CourseFormData) {
  return {
    jupasCode: form.jupasCode || undefined,
    nameZhTw: form.nameZhTw,
    nameZhCn: form.nameZhCn || undefined,
    nameEn: form.nameEn || undefined,
    degreeType: form.degreeType || undefined,
    institution: form.institution,
    duration: form.duration ? parseInt(form.duration) : undefined,
    qualification: (form.qualification || undefined) as any,
    scoringMethod: form.scoringMethod || undefined,
    minRequirement: form.minRequirement || undefined,
    interviewArrangement: form.interviewArrangement || undefined,
    quota: form.quota ? parseInt(form.quota) : undefined,
    lastYearMedian: form.lastYearMedian ? parseFloat(form.lastYearMedian) : undefined,
    lastYearQ1: form.lastYearQ1 ? parseFloat(form.lastYearQ1) : undefined,
    lastYearAdmitted: form.lastYearAdmitted ? parseInt(form.lastYearAdmitted) : undefined,
    lastYearGroupAAdmitted: form.lastYearGroupAAdmitted ? parseInt(form.lastYearGroupAAdmitted) : undefined,
    lastYearGroupAApplicants: form.lastYearGroupAApplicants ? parseInt(form.lastYearGroupAApplicants) : undefined,
    lastYearTotalApplicants: form.lastYearTotalApplicants ? parseInt(form.lastYearTotalApplicants) : undefined,
    groupAOnly: form.groupAOnly,
    scoreGap: (form.scoreGap || undefined) as any,
    fundingType: (form.fundingType || undefined) as any,
    tuitionFee: form.tuitionFee ? parseInt(form.tuitionFee) : undefined,
    scoringMethodChanged: form.scoringMethodChanged,
    isNew: form.isNew,
    descriptionZhTw: form.descriptionZhTw || undefined,
    careerProspectsZhTw: form.careerProspectsZhTw || undefined,
    websiteUrl: form.websiteUrl || undefined,
    jupasOfficialUrl: form.jupasOfficialUrl || undefined,
    acceptMultipleSittings: (form.acceptMultipleSittings as ("yes_no_penalty" | "yes_with_penalty" | "no")) || undefined,
    flexibleAdmission: form.flexibleAdmission,
    scoreFormula: (() => {
      if (!form.scoreFormulaJson.trim()) return undefined;
      try { return JSON.parse(form.scoreFormulaJson); } catch { return undefined; }
    })(),
    moduleType: "jupas" as const,
  };
}

// ─── Course Form Dialog ───────────────────────────────────────────────────────
function CourseFormDialog({
  open,
  onClose,
  editCourse,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  editCourse?: Course | null;
  onSuccess: () => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<CourseFormData>(editCourse ? courseToForm(editCourse) : emptyForm);

  const createMutation = trpc.courses.create.useMutation({ onSuccess: () => { onSuccess(); onClose(); toast.success("課程已新增"); } });
  const updateMutation = trpc.courses.update.useMutation({ onSuccess: () => { onSuccess(); onClose(); toast.success("課程已更新"); } });

  const handleSubmit = () => {
    if (!form.nameZhTw || !form.institution) {
      toast.error("請填寫課程名稱和院校");
      return;
    }
    const input = formToInput(form);
    if (editCourse) {
      updateMutation.mutate({ id: editCourse.id, data: input });
    } else {
      createMutation.mutate(input);
    }
  };

  const set = (key: keyof CourseFormData, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editCourse ? t("admin.editCourse") : t("admin.addCourse")}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          {/* Basic */}
          <div className="col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">基本資料</h4>
          </div>
          <FormField label="JUPAS 課程代號">
            <Input value={form.jupasCode} onChange={(e) => set("jupasCode", e.target.value)} placeholder="e.g. JS1001" />
          </FormField>
          <FormField label="學位類型">
            <Select value={form.degreeType} onValueChange={(v) => set("degreeType", v)}>
              <SelectTrigger><SelectValue placeholder="選擇學位類型" /></SelectTrigger>
              <SelectContent>
                {DEGREE_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <div className="col-span-2">
            <FormField label="課程名稱（繁體中文）*">
              <Input value={form.nameZhTw} onChange={(e) => set("nameZhTw", e.target.value)} placeholder="例：工商管理學（榮譽）學士" />
            </FormField>
          </div>
          <FormField label="課程名稱（簡體中文）">
            <Input value={form.nameZhCn} onChange={(e) => set("nameZhCn", e.target.value)} />
          </FormField>
          <FormField label="Course Name (English)">
            <Input value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} />
          </FormField>
          <FormField label="院校 *">
            <Select value={form.institution} onValueChange={(v) => set("institution", v)}>
              <SelectTrigger><SelectValue placeholder="選擇院校" /></SelectTrigger>
              <SelectContent>
                {INSTITUTIONS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="修讀年期">
            <Select value={form.duration} onValueChange={(v) => set("duration", v)}>
              <SelectTrigger><SelectValue placeholder="選擇年期" /></SelectTrigger>
              <SelectContent>
                {[2, 4, 5, 6].map((d) => <SelectItem key={d} value={String(d)}>{d} 年</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="資歷架構">
            <Select value={form.qualification} onValueChange={(v) => set("qualification", v)}>
              <SelectTrigger><SelectValue placeholder="選擇資歷" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bachelor">學士學位</SelectItem>
                <SelectItem value="higher_diploma">高級文憑</SelectItem>
                <SelectItem value="associate_degree">副學士</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="資助類型">
            <Select value={form.fundingType} onValueChange={(v) => set("fundingType", v)}>
              <SelectTrigger><SelectValue placeholder="選擇資助" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ugc">教資會</SelectItem>
                <SelectItem value="nmtss">NMTSS</SelectItem>
                <SelectItem value="sssdp">SSSDP</SelectItem>
                <SelectItem value="self_financed">自資</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="學費（港幣/年）">
            <Input type="number" value={form.tuitionFee} onChange={(e) => set("tuitionFee", e.target.value)} placeholder="e.g. 42100" />
          </FormField>

          {/* Admission */}
          <div className="col-span-2 mt-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">收生資料</h4>
          </div>
          <FormField label="計分方式">
            <Select value={form.scoringMethod} onValueChange={(v) => set("scoringMethod", v)}>
              <SelectTrigger><SelectValue placeholder="選擇計分方式" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="best5">Best 5</SelectItem>
                <SelectItem value="best6">Best 6</SelectItem>
                <SelectItem value="best4">Best 4</SelectItem>
                <SelectItem value="2c3x">2C+3X</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="最低入學要求">
            <Input value={form.minRequirement} onChange={(e) => set("minRequirement", e.target.value)} placeholder="e.g. 332A33" />
          </FormField>
          <FormField label="收生人數（學額）">
            <Input type="number" value={form.quota} onChange={(e) => set("quota", e.target.value)} />
          </FormField>
          <FormField label="去年中位數/平均數">
            <Input type="number" value={form.lastYearMedian} onChange={(e) => set("lastYearMedian", e.target.value)} step="0.01" />
          </FormField>
          <FormField label="去年下四分位數">
            <Input type="number" value={form.lastYearQ1} onChange={(e) => set("lastYearQ1", e.target.value)} step="0.01" />
          </FormField>
          <FormField label="去年取錄人數">
            <Input type="number" value={form.lastYearAdmitted} onChange={(e) => set("lastYearAdmitted", e.target.value)} />
          </FormField>
          <FormField label="去年組別A取錄人數">
            <Input type="number" value={form.lastYearGroupAAdmitted} onChange={(e) => set("lastYearGroupAAdmitted", e.target.value)} />
          </FormField>
          <FormField label="去年組別A申請人數">
            <Input type="number" value={form.lastYearGroupAApplicants} onChange={(e) => set("lastYearGroupAApplicants", e.target.value)} />
          </FormField>
          <FormField label="去年總申請人數">
            <Input type="number" value={form.lastYearTotalApplicants} onChange={(e) => set("lastYearTotalApplicants", e.target.value)} />
          </FormField>
          <FormField label="分差">
            <Select value={form.scoreGap} onValueChange={(v) => set("scoreGap", v)}>
              <SelectTrigger><SelectValue placeholder="選擇分差" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="above_median">高於中位數/平均數</SelectItem>
                <SelectItem value="above_q1">高於下四分位數</SelectItem>
                <SelectItem value="below_q1">低於下四分位數</SelectItem>
                <SelectItem value="between_median_q1">介乎中位數/平均數和下四分位數</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="面試安排">
            <Select value={form.interviewArrangement} onValueChange={(v) => set("interviewArrangement", v)}>
              <SelectTrigger><SelectValue placeholder="選擇面試安排" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all_applicants">所有申請者均需面試 (Yes for all)</SelectItem>
                <SelectItem value="selective_basis">選擇性面試 (Yes selective)</SelectItem>
                <SelectItem value="may_require">可能需要面試 (May require)</SelectItem>
                <SelectItem value="special_cases">特殊情況才面試 (Special cases)</SelectItem>
                <SelectItem value="no_interview">不設面試 (No)</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="重考政策">
            <Select value={form.acceptMultipleSittings} onValueChange={(v) => set("acceptMultipleSittings", v)}>
              <SelectTrigger><SelectValue placeholder="選擇重考政策" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes_no_penalty">接受重考（不扣分）</SelectItem>
                <SelectItem value="yes_with_penalty">接受重考（扣分）</SelectItem>
                <SelectItem value="no">不接受重考</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          {/* Flags */}
          <div className="col-span-2 mt-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">標記</h4>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.groupAOnly} onCheckedChange={(v) => set("groupAOnly", v)} />
            <Label className="text-sm">去年只錄取組別A</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.scoringMethodChanged} onCheckedChange={(v) => set("scoringMethodChanged", v)} />
            <Label className="text-sm">計分方式已改變</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.isNew} onCheckedChange={(v) => set("isNew", v)} />
            <Label className="text-sm">新課程</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.flexibleAdmission} onCheckedChange={(v) => set("flexibleAdmission", v)} />
            <Label className="text-sm">彈性收生</Label>
          </div>

          {/* Description */}
          <div className="col-span-2 mt-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">課程資料</h4>
          </div>
          <div className="col-span-2">
            <FormField label="課程簡介（繁體中文）">
              <Textarea value={form.descriptionZhTw} onChange={(e) => set("descriptionZhTw", e.target.value)} rows={3} />
            </FormField>
          </div>
          <div className="col-span-2">
            <FormField label="就業前景（繁體中文）">
              <Textarea value={form.careerProspectsZhTw} onChange={(e) => set("careerProspectsZhTw", e.target.value)} rows={3} />
            </FormField>
          </div>
          <div className="col-span-2">
            <FormField label="院校官方課程網站 URL">
              <Input value={form.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)} placeholder="https://...（院校官網課程頁面）" />
            </FormField>
          </div>
          <div className="col-span-2">
            <FormField label="JUPAS 官方課程網站 URL">
              <Input value={form.jupasOfficialUrl} onChange={(e) => set("jupasOfficialUrl", e.target.value)} placeholder="https://www.jupas.edu.hk/..." />
            </FormField>
          </div>

          {/* My Score Formula */}
          <div className="col-span-2 mt-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">「我的分數」計算公式</h4>
            <p className="text-[10px] text-muted-foreground mb-2">輸入 JSON 格式的計分公式。必須包含 method、required、excluded、weighted、coreSubjects 五個欄位。</p>
            <Textarea
              value={form.scoreFormulaJson}
              onChange={(e) => set("scoreFormulaJson", e.target.value)}
              rows={5}
              placeholder='{"method":"best5","required":["chinese","english"],"excluded":[],"weighted":[],"coreSubjects":[]}'
              className="font-mono text-xs"
            />
            {form.scoreFormulaJson && (() => {
              try { JSON.parse(form.scoreFormulaJson); return <p className="text-[10px] text-green-500 mt-1">✓ JSON 格式正確</p>; }
              catch { return <p className="text-[10px] text-red-500 mt-1">✗ JSON 格式錯誤</p>; }
            })()}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("admin.cancel")}</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {t("admin.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

// ─── Bulk Import Dialog ───────────────────────────────────────────────────────
function BulkImportDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const { t } = useLanguage();
  const [jsonText, setJsonText] = useState("");
  const bulkImport = trpc.courses.bulkImport.useMutation({
    onSuccess: (data) => {
      toast.success(t("admin.import.success").replace("{count}", String(data.count)));
      onSuccess();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleImport = () => {
    try {
      const data = JSON.parse(jsonText);
      if (!Array.isArray(data)) throw new Error("JSON must be an array");
      bulkImport.mutate(data);
    } catch (e: any) {
      toast.error("JSON 格式錯誤: " + e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("admin.bulkImport")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("admin.import.instructions")}</p>
          <Textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={12}
            placeholder='[{"nameZhTw": "課程名稱", "institution": "院校", ...}]'
            className="font-mono text-xs"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("admin.cancel")}</Button>
          <Button onClick={handleImport} disabled={bulkImport.isPending}>
            {bulkImport.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {t("admin.bulkImport")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function Admin() {
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showImport, setShowImport] = useState(false);
  const PAGE_SIZE = 20;

  const { data, isLoading } = trpc.courses.list.useQuery({
    search: search || undefined,
    moduleType: "jupas",
    page,
    pageSize: PAGE_SIZE,
  });

  const deleteMutation = trpc.courses.delete.useMutation({
    onSuccess: () => {
      utils.courses.list.invalidate();
      toast.success("課程已刪除");
      setDeleteId(null);
    },
  });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="container py-20 text-center">
        <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">需要管理員權限</p>
        <Link href="/">
          <Button variant="ghost" size="sm" className="mt-3">返回首頁</Button>
        </Link>
      </div>
    );
  }

  const courses = data?.courses ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"
            style={{ fontFamily: "'Playfair Display', 'Noto Serif TC', serif" }}>
            <Settings className="w-6 h-6" />
            {t("admin.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("admin.courses")} · {total} 個課程
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowImport(true)}>
            <Upload className="w-4 h-4" />
            {t("admin.bulkImport")}
          </Button>
          <Button size="sm" className="gap-2" onClick={() => { setEditCourse(null); setShowForm(true); }}>
            <Plus className="w-4 h-4" />
            {t("admin.addCourse")}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="搜尋課程..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9 h-9"
        />
      </div>

      {/* Table */}
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">代號</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">課程名稱</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">院校</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">學額</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">學費</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" />
                  </td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    暫無課程資料
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {course.jupasCode ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium line-clamp-1">{course.nameZhTw}</div>
                      {course.degreeType && (
                        <span className="text-xs bg-foreground text-background px-1.5 py-0.5 rounded mt-0.5 inline-block">
                          {course.degreeType}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{course.institution}</td>
                    <td className="px-4 py-3 text-sm">{course.quota ?? "—"}</td>
                    <td className="px-4 py-3 text-sm">
                      {course.tuitionFee ? `$${course.tuitionFee.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 text-muted-foreground hover:text-foreground"
                          onClick={() => { setEditCourse(course); setShowForm(true); }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteId(course.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button variant="outline" size="icon" className="w-8 h-8" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="icon" className="w-8 h-8" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Form Dialog */}
      <CourseFormDialog
        open={showForm}
        onClose={() => { setShowForm(false); setEditCourse(null); }}
        editCourse={editCourse}
        onSuccess={() => utils.courses.list.invalidate()}
      />

      {/* Bulk Import Dialog */}
      <BulkImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        onSuccess={() => utils.courses.list.invalidate()}
      />

      {/* Delete Confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.confirm.delete")}</AlertDialogTitle>
            <AlertDialogDescription>此操作無法撤銷。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
