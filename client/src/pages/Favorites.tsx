import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Heart, Search, Loader2, Trash2, ExternalLink, LogIn, Cloud } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import type { Course } from "../../../drizzle/schema";

const LS_KEY = "jupasearch_favorites";

export function getLocalFavoriteIds(): number[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setLocalFavoriteIds(ids: number[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(ids));
}

export default function Favorites() {
  const { t, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  // Local (guest) favorites
  const [localIds, setLocalIds] = useState<number[]>(() => getLocalFavoriteIds());

  // Server favorites (when logged in)
  const { data: serverFavorites = [], isLoading: serverLoading } = trpc.favorites.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const removeFav = trpc.favorites.remove.useMutation({
    onSuccess: () => {
      utils.favorites.list.invalidate();
      utils.favorites.ids.invalidate();
    },
  });

  // Sync local IDs to localStorage whenever they change
  useEffect(() => {
    setLocalFavoriteIds(localIds);
  }, [localIds]);

  // Fetch course details for local favorites
  const { data: localCoursesData, isLoading: localLoading } = trpc.courses.list.useQuery(
    { pageSize: 200 },
    { enabled: !isAuthenticated && localIds.length > 0 }
  );

  const localFavorites = (localCoursesData?.courses ?? []).filter((c) => localIds.includes(c.id));

  const removeLocalFav = useCallback((courseId: number) => {
    setLocalIds((prev) => prev.filter((id) => id !== courseId));
    toast.success(t("courses.removeFromFavorites"));
  }, [t]);

  const isLoading = isAuthenticated ? serverLoading : localLoading;
  const favorites: Course[] = isAuthenticated ? serverFavorites : localFavorites;

  const getInstitutionName = (course: Course) => {
    if (language === "zh-CN") return course.institutionZhCn || course.institution;
    if (language === "en") return course.institutionEn || course.institution;
    return course.institution;
  };

  return (
    <div className="container py-6 max-w-4xl">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2"
            style={{ fontFamily: "'Playfair Display', 'Noto Serif TC', serif" }}>
            <Heart className="w-6 h-6" />
            {t("favorites.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {language === "en"
              ? `${favorites.length} saved courses`
              : language === "zh-CN"
              ? `已收藏 ${favorites.length} 个课程`
              : `已收藏 ${favorites.length} 個課程`}
          </p>
        </div>

        {/* Login prompt for guests */}
        {!isAuthenticated && localIds.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary px-3 py-2 rounded-lg">
            <Cloud className="w-3.5 h-3.5 shrink-0" />
            <span>
              {language === "en"
                ? "Login to sync favorites across devices"
                : language === "zh-CN"
                ? "登录以跨设备同步收藏"
                : "登入以跨裝置同步收藏"}
            </span>
            <a href={getLoginUrl()} className="font-medium underline underline-offset-2 hover:text-foreground">
              {t("nav.login")}
            </a>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{t("favorites.empty")}</p>
          <Link href="/courses">
            <Button variant="outline" className="gap-2">
              <Search className="w-4 h-4" />
              {t("favorites.empty.cta")}
            </Button>
          </Link>
          {!isAuthenticated && (
            <p className="text-xs text-muted-foreground mt-4">
              {language === "en"
                ? "You can save courses without logging in. Login to sync across devices."
                : language === "zh-CN"
                ? "无需登录即可收藏课程，登录后可跨设备同步。"
                : "無需登入即可收藏課程，登入後可跨裝置同步。"}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {favorites.map((course) => {
            const name = language === "zh-CN" ? (course.nameZhCn || course.nameZhTw) :
              language === "en" ? (course.nameEn || course.nameZhTw) : course.nameZhTw;

            return (
              <div key={course.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-foreground/20 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                  </div>
                  <Link href={`/courses/${course.id}`}>
                    <h3 className="font-semibold text-sm hover:underline cursor-pointer truncate">{name}</h3>
                  </Link>
                  <p className="text-xs text-muted-foreground">{getInstitutionName(course)}</p>
                </div>

                <div className="hidden sm:flex items-center gap-6 text-center shrink-0">
                  <div>
                    <div className="text-sm font-medium">{course.quota ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{t("courses.col.quota")}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{course.lastYearMedian ? String(course.lastYearMedian) : "—"}</div>
                    <div className="text-xs text-muted-foreground">{t("courses.col.median")}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{course.tuitionFee ? `$${course.tuitionFee.toLocaleString()}` : "—"}</div>
                    <div className="text-xs text-muted-foreground">{t("courses.col.tuition")}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Link href={`/courses/${course.id}`}>
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      if (isAuthenticated) {
                        removeFav.mutate({ courseId: course.id });
                        toast.success(t("courses.removeFromFavorites"));
                      } else {
                        removeLocalFav(course.id);
                      }
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
