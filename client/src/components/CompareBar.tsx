import { useCompare } from "@/contexts/CompareContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { X, BarChart2 } from "lucide-react";
import { useLocation } from "wouter";

export default function CompareBar() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const { t } = useLanguage();
  const [, navigate] = useLocation();

  if (compareList.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur shadow-lg animate-in slide-in-from-bottom-2 duration-200">
      <div className="container py-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-medium">
          <BarChart2 className="w-4 h-4" />
          <span>{t("compare.subtitle")}</span>
          <span className="text-muted-foreground">({compareList.length}/6)</span>
        </div>

        <div className="flex items-center gap-2 flex-1 flex-wrap">
          {compareList.map((course) => (
            <div
              key={course.id}
              className="flex items-center gap-1.5 bg-secondary rounded-full px-3 py-1 text-xs font-medium"
            >
              <span className="max-w-[150px] truncate">{course.nameZhTw}</span>
              <button
                onClick={() => removeFromCompare(course.id)}
                className="text-muted-foreground hover:text-foreground transition-colors ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button variant="ghost" size="sm" onClick={clearCompare} className="text-muted-foreground">
            {t("common.reset")}
          </Button>
          <Button
            size="sm"
            onClick={() => navigate("/compare")}
            disabled={compareList.length < 2}
          >
            <BarChart2 className="w-4 h-4 mr-1.5" />
            {t("compare.generate")}
          </Button>
        </div>
      </div>
    </div>
  );
}
