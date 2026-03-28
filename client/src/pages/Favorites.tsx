import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Heart, Search, Loader2, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";

export default function Favorites() {
  const { t, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: favorites = [], isLoading } = trpc.favorites.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const removeFav = trpc.favorites.remove.useMutation({
    onSuccess: () => {
      utils.favorites.list.invalidate();
      utils.favorites.ids.invalidate();
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center">
        <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">{t("favorites.title")}</h2>
        <p className="text-muted-foreground mb-6">{t("favorites.loginRequired")}</p>
        <Button onClick={() => window.location.href = getLoginUrl()} className="gap-2">
          {t("nav.login")}
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-20 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2"
          style={{ fontFamily: "'Playfair Display', 'Noto Serif TC', serif" }}>
          <Heart className="w-6 h-6" />
          {t("favorites.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {language === "en" ? `${favorites.length} saved courses` : `已收藏 ${favorites.length} 個課程`}
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{t("favorites.empty")}</p>
          <Link href="/courses">
            <Button variant="outline" className="gap-2">
              <Search className="w-4 h-4" />
              {t("favorites.empty.cta")}
            </Button>
          </Link>
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
                  <p className="text-xs text-muted-foreground">{course.institution}</p>
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
                      removeFav.mutate({ courseId: course.id });
                      toast.success(t("courses.removeFromFavorites"));
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
