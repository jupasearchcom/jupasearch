import { Link, useParams } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCompare } from "@/contexts/CompareContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Heart, BarChart2, Plus, ExternalLink,
  GraduationCap, Calendar, DollarSign, Users, TrendingUp,
  BookOpen, Award, Loader2, AlertCircle, Globe,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getLoginUrl } from "@/const";
import { getLocalFavoriteIds, setLocalFavoriteIds } from "./Favorites";
import { useState, useEffect } from "react";

function InfoCard({ icon: Icon, label, value, highlight = false }: {
  icon: React.ElementType; label: string; value: string; highlight?: boolean;
}) {
  return (
    <div className={cn(
      "p-4 rounded-lg border border-border",
      highlight ? "bg-foreground text-background" : "bg-card"
    )}>
      <div className={cn("flex items-center gap-2 mb-1", highlight ? "text-background/70" : "text-muted-foreground")}>
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="font-semibold text-sm">{value}</div>
    </div>
  );
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();

  const { data: course, isLoading, error } = trpc.courses.detail.useQuery(
    { id: parseInt(id ?? "0") },
    { enabled: !!id }
  );

  // Favorites — server (logged in) or local (guest)
  const { data: serverFavoriteIds = [] } = trpc.favorites.ids.useQuery(undefined, { enabled: isAuthenticated });
  const [localFavIds, setLocalFavIds] = useState<number[]>(() => getLocalFavoriteIds());
  const utils = trpc.useUtils();
  const addFav = trpc.favorites.add.useMutation({ onSuccess: () => utils.favorites.ids.invalidate() });
  const removeFav = trpc.favorites.remove.useMutation({ onSuccess: () => utils.favorites.ids.invalidate() });

  // Choices — server (logged in) or local (guest)
  const { data: choicesData } = trpc.choices.get.useQuery(undefined, { enabled: isAuthenticated });
  const saveChoices = trpc.choices.save.useMutation({ onSuccess: () => utils.choices.get.invalidate() });

  const courseId = course?.id;
  const isFavorite = isAuthenticated
    ? serverFavoriteIds.includes(courseId ?? 0)
    : localFavIds.includes(courseId ?? 0);
  const inCompare = isInCompare(courseId ?? 0);

  const handleToggleFavorite = () => {
    if (!courseId) return;
    if (isAuthenticated) {
      if (isFavorite) {
        removeFav.mutate({ courseId });
      } else {
        addFav.mutate({ courseId });
      }
    } else {
      // Guest mode: use localStorage
      const current = getLocalFavoriteIds();
      let updated: number[];
      if (current.includes(courseId)) {
        updated = current.filter((id) => id !== courseId);
        toast.success(t("courses.removeFromFavorites"));
      } else {
        updated = [...current, courseId];
        toast.success(t("courses.addToFavorites"));
      }
      setLocalFavoriteIds(updated);
      setLocalFavIds(updated);
    }
  };

  const handleAddToChoices = () => {
    if (!courseId || !course) return;
    if (isAuthenticated) {
      const currentChoices = choicesData?.choices ?? [];
      if (currentChoices.length >= 20) { toast.error(t("choices.max")); return; }
      if (currentChoices.find((c) => c.courseId === courseId)) {
        toast.info(language === "en" ? "Already in your choices" : "已在志願列表中");
        return;
      }
      saveChoices.mutate({ choices: [...currentChoices, { courseId, rank: currentChoices.length + 1 }] });
    } else {
      // Guest mode: use localStorage
      const LS_KEY = "jupasearch_choices";
      try {
        const raw = localStorage.getItem(LS_KEY);
        const current: { courseId: number; rank: number }[] = raw ? JSON.parse(raw) : [];
        if (current.length >= 20) { toast.error(t("choices.max")); return; }
        if (current.find((c) => c.courseId === courseId)) {
          toast.info(language === "en" ? "Already in your choices" : "已在志願列表中");
          return;
        }
        const updated = [...current, { courseId, rank: current.length + 1 }];
        localStorage.setItem(LS_KEY, JSON.stringify(updated));
        toast.success(t("courses.addToChoices"));
      } catch { toast.error("Error"); }
    }
  };

  if (isLoading) {
    return (
      <div className="container py-20 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="container py-20 text-center">
        <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">{t("detail.notFound")}</p>
        <Link href="/courses">
          <Button variant="ghost" size="sm" className="mt-3 gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t("detail.back")}
          </Button>
        </Link>
      </div>
    );
  }

  const name = language === "zh-CN" ? (course.nameZhCn || course.nameZhTw) :
    language === "en" ? (course.nameEn || course.nameZhTw) : course.nameZhTw;

  const description = language === "zh-CN" ? (course.descriptionZhCn || course.descriptionZhTw) :
    language === "en" ? (course.descriptionEn || course.descriptionZhTw) : course.descriptionZhTw;

  const careers = language === "zh-CN" ? (course.careerProspectsZhCn || course.careerProspectsZhTw) :
    language === "en" ? (course.careerProspectsEn || course.careerProspectsZhTw) : course.careerProspectsZhTw;

  const institutionName = language === "zh-CN" ? (course.institutionZhCn || course.institution) :
    language === "en" ? (course.institutionEn || course.institution) : course.institution;

  const scoringLabel = course.scoringMethod === "best5" ? "Best 5" :
    course.scoringMethod === "best6" ? "Best 6" :
    course.scoringMethod === "best4" ? "Best 4" :
    course.scoringMethod === "2c3x" ? "2C+3X" : "—";

  return (
    <div className="container py-6 max-w-4xl">
      {/* Back */}
      <Link href="/courses">
        <Button variant="ghost" size="sm" className="gap-2 mb-4 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
          {t("detail.back")}
        </Button>
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
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
              {course.isNew && <span className="badge-new">{t("courses.new")}</span>}
              {course.scoringMethodChanged && <span className="badge-changed">{t("courses.scoringChanged")}</span>}
              {course.groupAOnly && <span className="badge-groupA">{t("courses.groupAOnly")}</span>}
            </div>
            <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', 'Noto Serif TC', serif" }}>
              {name}
            </h1>
            <p className="text-muted-foreground">{institutionName}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className={cn("gap-2", isFavorite && "text-red-500 border-red-200")}
              onClick={handleToggleFavorite}
            >
              <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
              {isFavorite ? t("courses.removeFromFavorites") : t("courses.addToFavorites")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn("gap-2", inCompare && "text-blue-500 border-blue-200")}
              onClick={() => inCompare ? removeFromCompare(course.id) : addToCompare(course)}
            >
              <BarChart2 className="w-4 h-4" />
              {t("courses.addToCompare")}
            </Button>
            <Button size="sm" className="gap-2" onClick={handleAddToChoices}>
              <Plus className="w-4 h-4" />
              {t("courses.addToChoices")}
            </Button>
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <InfoCard icon={Users} label={t("courses.col.quota")} value={course.quota?.toString() ?? "—"} highlight />
        <InfoCard icon={TrendingUp} label={t("courses.col.median")} value={course.lastYearMedian ? String(course.lastYearMedian) : "—"} />
        <InfoCard icon={TrendingUp} label={t("courses.col.q1")} value={course.lastYearQ1 ? String(course.lastYearQ1) : "—"} />
        <InfoCard icon={Award} label={t("courses.col.minReq")} value={course.minRequirement ?? "—"} />
        <InfoCard icon={DollarSign} label={t("courses.col.tuition")} value={course.tuitionFee ? `$${course.tuitionFee.toLocaleString()}` : "—"} />
        <InfoCard icon={Calendar} label={t("courses.col.duration")} value={course.duration ? t("duration.years").replace("{n}", String(course.duration)) : "—"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {description && (
            <section>
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {t("detail.description")}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </section>
          )}

          {/* Admission Stats */}
          <section>
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              {t("detail.admissionStats")}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: t("courses.col.admitted"), value: course.lastYearAdmitted?.toString() ?? "—" },
                { label: t("courses.col.groupA"), value: course.lastYearGroupAAdmitted?.toString() ?? "—" },
                { label: t("courses.col.groupAApplicants"), value: course.lastYearGroupAApplicants?.toString() ?? "—" },
                { label: t("courses.col.totalApplicants"), value: course.lastYearTotalApplicants?.toString() ?? "—" },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 bg-secondary rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">{label}</div>
                  <div className="font-semibold text-sm">{value}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Career Prospects */}
          {careers && (
            <section>
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                {t("detail.careers")}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{careers}</p>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Basic Info — no scoreGap */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-3">{t("detail.basicInfo")}</h3>
            <dl className="space-y-2">
              {[
                { label: t("courses.filter.qualification"), value: course.qualification ? t(`qual.${course.qualification}`) : "—" },
                { label: t("courses.filter.scoring"), value: scoringLabel },
                { label: t("courses.filter.funding"), value: course.fundingType ? t(`funding.${course.fundingType}`) : "—" },
                { label: t("courses.filter.groupA"), value: course.groupAOnly ? t("common.yes") : t("common.no") },
                { label: t("courses.filter.interview"), value: course.interviewArrangement ? t(`interview.${course.interviewArrangement}`) : "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start gap-2">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="text-xs font-medium text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Requirements */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-3">{t("detail.requirements")}</h3>
            {course.requiredSubjects && (course.requiredSubjects as string[]).length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-1.5">{t("detail.requiredSubjects")}</p>
                <div className="flex flex-wrap gap-1">
                  {(course.requiredSubjects as string[]).map((s) => (
                    <span key={s} className="text-xs bg-secondary px-2 py-0.5 rounded">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {course.weightedSubjects && (course.weightedSubjects as any[]).length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-1.5">{t("detail.weightedSubjects")}</p>
                <div className="space-y-1">
                  {(course.weightedSubjects as { subject: string; multiplier: number }[]).map((ws) => (
                    <div key={ws.subject} className="flex justify-between text-xs">
                      <span>{ws.subject}</span>
                      <span className="font-medium">×{ws.multiplier}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {course.interviewArrangement && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">{t("detail.interviewReq")}</p>
                <p className="text-xs">{t(`interview.${course.interviewArrangement}`)}</p>
              </div>
            )}
            {course.minRequirement && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-1.5">{t("courses.col.minReq")}</p>
                <p className="text-xs font-medium">{course.minRequirement}</p>
              </div>
            )}
          </div>

          {/* Websites — split into university and JUPAS */}
          <div className="space-y-2">
            {course.websiteUrl && (
              <a href={course.websiteUrl} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Globe className="w-4 h-4" />
                  {t("detail.website")}
                </Button>
              </a>
            )}
            {course.jupasUrl && (
              <a href={course.jupasUrl} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <ExternalLink className="w-4 h-4" />
                  {t("detail.jupasUrl")}
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
