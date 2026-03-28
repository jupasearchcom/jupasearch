import { useState, useCallback, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCompare } from "@/contexts/CompareContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
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
  HeartOff,
  BarChart2,
  Plus,
  ListOrdered,
  ChevronLeft,
  ChevronRight,
  X,
  Info,
  Loader2,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Course } from "../../../drizzle/schema";
import { getLoginUrl } from "@/const";

// ─── Constants ────────────────────────────────────────────────────────────────
const INSTITUTIONS = [
  "香港城市大學", "香港浸會大學", "嶺南大學", "香港中文大學",
  "香港教育大學", "香港理工大學", "香港科技大學", "香港大學",
  "香港都會大學", "港珠海學院", "香港樹仁大學", "聖方濟各大學",
  "香港高等教育科技學院", "香港恒生大學", "東華學院", "香港伍倫貢學院",
];

const DEGREE_TYPES = ["BA", "BSc", "BEng", "BEd", "BLaw", "BBA", "BNurs", "BPharm", "BArch", "BSW", "BSSc", "BFA", "BMus", "LLB"];
const SCORING_METHODS = ["best5", "best6", "best4", "2c3x"];
const SCORE_GAPS = ["above_median", "above_q1", "below_q1", "between_median_q1"];
const FUNDING_TYPES = ["ugc", "nmtss", "sssdp", "self_financed"];
const INTERVIEW_OPTIONS = ["required", "not_required", "by_invitation", "portfolio"];
const MIN_REQUIREMENTS = ["33322", "33222", "22222", "332A33", "332A22", "332A23"];
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
  isAuthenticated,
}: {
  course: Course;
  isFavorite: boolean;
  onToggleFavorite: (course: Course) => void;
  onAddToChoices: (course: Course) => void;
  isAuthenticated: boolean;
}) {
  const { t, language } = useLanguage();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const inCompare = isInCompare(course.id);

  const name = language === "zh-CN" ? (course.nameZhCn || course.nameZhTw) :
    language === "en" ? (course.nameEn || course.nameZhTw) : course.nameZhTw;

  const fundingLabel = course.fundingType ? t(`funding.${course.fundingType}`) : null;
  const qualLabel = course.qualification ? t(`qual.${course.qualification}`) : null;

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
      <p className="text-xs text-muted-foreground mb-3">{course.institution}</p>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <StatCell label={t("courses.col.quota")} value={course.quota?.toString() ?? "—"} />
        <StatCell label={t("courses.col.median")} value={formatScore(course.lastYearMedian)} />
        <StatCell label={t("courses.col.q1")} value={formatScore(course.lastYearQ1)} />
        <StatCell label={t("courses.col.minReq")} value={course.minRequirement ?? "—"} />
        <StatCell label={t("courses.col.tuition")} value={formatTuition(course.tuitionFee)} />
        <StatCell
          label={t("courses.col.admitted")}
          value={course.lastYearAdmitted ? `${course.lastYearAdmitted}${course.lastYearGroupAAdmitted ? ` (${course.lastYearGroupAAdmitted}A)` : ""}` : "—"}
        />
      </div>

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
            id={opt}
            checked={selected.includes(opt)}
            onCheckedChange={() => toggle(opt)}
            className="w-3.5 h-3.5"
          />
          <Label htmlFor={opt} className="text-xs cursor-pointer leading-none">
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
  const [minRequirements, setMinRequirements] = useState<string[]>([]);
  const [groupAOnly, setGroupAOnly] = useState<boolean | undefined>(undefined);
  const [tuitionRange, setTuitionRange] = useState<[number, number]>([0, 100000]);
  const [sortBy, setSortBy] = useState("id");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 24;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

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
    minRequirements: minRequirements.length ? minRequirements : undefined,
    groupAOnly,
    tuitionMin: tuitionRange[0] > 0 ? tuitionRange[0] : undefined,
    tuitionMax: tuitionRange[1] < 100000 ? tuitionRange[1] : undefined,
    moduleType: "jupas",
    sortBy,
    page,
    pageSize: PAGE_SIZE,
  }), [debouncedSearch, degreeTypes, institutions, durations, qualifications, scoringMethods, scoreGaps, fundingTypes, interviewArrangements, minRequirements, groupAOnly, tuitionRange, sortBy, page]);

  const { data, isLoading } = trpc.courses.list.useQuery(queryInput);
  const courses = data?.courses ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Favorites
  const { data: favoriteIds = [] } = trpc.favorites.ids.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();
  const addFav = trpc.favorites.add.useMutation({ onSuccess: () => utils.favorites.ids.invalidate() });
  const removeFav = trpc.favorites.remove.useMutation({ onSuccess: () => utils.favorites.ids.invalidate() });

  // JUPAS Choices
  const { data: choicesData } = trpc.choices.get.useQuery(undefined, { enabled: isAuthenticated });
  const saveChoices = trpc.choices.save.useMutation({ onSuccess: () => utils.choices.get.invalidate() });

  const handleToggleFavorite = useCallback((course: Course) => {
    if (!isAuthenticated) {
      toast.error(t("common.loginRequired"), {
        action: { label: t("nav.login"), onClick: () => window.location.href = getLoginUrl() },
      });
      return;
    }
    if (favoriteIds.includes(course.id)) {
      removeFav.mutate({ courseId: course.id });
      toast.success(t("courses.removeFromFavorites"));
    } else {
      addFav.mutate({ courseId: course.id });
      toast.success(t("courses.addToFavorites"));
    }
  }, [isAuthenticated, favoriteIds, addFav, removeFav, t]);

  const handleAddToChoices = useCallback((course: Course) => {
    if (!isAuthenticated) {
      toast.error(t("common.loginRequired"), {
        action: { label: t("nav.login"), onClick: () => window.location.href = getLoginUrl() },
      });
      return;
    }
    const currentChoices = choicesData?.choices ?? [];
    if (currentChoices.length >= 20) {
      toast.error(t("choices.max"));
      return;
    }
    if (currentChoices.find((c) => c.courseId === course.id)) {
      toast.info(language === "en" ? "Already in your choices" : "已在志願列表中");
      return;
    }
    const newChoices = [...currentChoices, { courseId: course.id, rank: currentChoices.length + 1 }];
    saveChoices.mutate({ choices: newChoices });
    toast.success(t("courses.addToChoices") + `: ${course.nameZhTw}`);
  }, [isAuthenticated, choicesData, saveChoices, t, language]);

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setDegreeTypes([]);
    setInstitutions([]);
    setDurations([]);
    setQualifications([]);
    setScoringMethods([]);
    setScoreGaps([]);
    setFundingTypes([]);
    setInterviewArrangements([]);
    setMinRequirements([]);
    setGroupAOnly(undefined);
    setTuitionRange([0, 100000]);
    setSortBy("id");
    setPage(1);
  };

  const hasActiveFilters = degreeTypes.length > 0 || institutions.length > 0 || durations.length > 0 ||
    qualifications.length > 0 || scoringMethods.length > 0 || scoreGaps.length > 0 ||
    fundingTypes.length > 0 || interviewArrangements.length > 0 || minRequirements.length > 0 ||
    groupAOnly !== undefined || tuitionRange[0] > 0 || tuitionRange[1] < 100000;

  const FilterContent = () => (
    <div className="space-y-1">
      <FilterSection title={t("courses.filter.degreeType")}>
        <CheckboxGroup options={DEGREE_TYPES} selected={degreeTypes} onChange={(v) => { setDegreeTypes(v); setPage(1); }} />
      </FilterSection>
      <Separator />
      <FilterSection title={t("courses.filter.institution")}>
        <CheckboxGroup
          options={INSTITUTIONS}
          selected={institutions}
          onChange={(v) => { setInstitutions(v); setPage(1); }}
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
      <FilterSection title={t("courses.filter.minReq")}>
        <CheckboxGroup
          options={MIN_REQUIREMENTS}
          selected={minRequirements}
          onChange={(v) => { setMinRequirements(v); setPage(1); }}
        />
      </FilterSection>
      <Separator />
      <FilterSection title={t("courses.filter.groupA")}>
        <div className="space-y-1.5">
          {[
            { val: undefined, label: t("common.all") },
            { val: true, label: t("common.yes") },
            { val: false, label: t("common.no") },
          ].map(({ val, label }) => (
            <div key={String(val)} className="flex items-center gap-2">
              <Checkbox
                checked={groupAOnly === val}
                onCheckedChange={() => { setGroupAOnly(val); setPage(1); }}
                className="w-3.5 h-3.5"
              />
              <Label className="text-xs cursor-pointer">{label}</Label>
            </div>
          ))}
        </div>
      </FilterSection>
      <Separator />
      <FilterSection title={`${t("courses.filter.tuition")} (${t("courses.filter.tuition.unit")})`}>
        <div className="px-1 pt-2">
          <Slider
            min={0}
            max={100000}
            step={1000}
            value={tuitionRange}
            onValueChange={(v) => { setTuitionRange(v as [number, number]); setPage(1); }}
            className="mb-3"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>${tuitionRange[0].toLocaleString()}</span>
            <span>${tuitionRange[1].toLocaleString()}</span>
          </div>
        </div>
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
        <aside className="hidden lg:block w-56 shrink-0">
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
                    isAuthenticated={isAuthenticated}
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
