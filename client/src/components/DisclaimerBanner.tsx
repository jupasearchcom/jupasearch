import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "jupasearch_disclaimer_accepted";

export default function DisclaimerBanner() {
  const { language } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (!accepted) {
      // Small delay so it doesn't flash on first render
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  const texts = {
    "zh-TW": {
      message: "本平台所有課程資料均為第三方整理之參考資料，並非官方資訊。作出升學決定前，請向相關院校或 JUPAS 官方網站核實最新資料。",
      learnMore: "了解更多",
      accept: "我明白",
    },
    "zh-CN": {
      message: "本平台所有课程资料均为第三方整理之参考资料，并非官方信息。作出升学决定前，请向相关院校或 JUPAS 官方网站核实最新资料。",
      learnMore: "了解更多",
      accept: "我明白",
    },
    en: {
      message: "All course information on this platform is compiled by a third party for reference only and is not official data. Please verify with the relevant institution or the official JUPAS website before making any academic decisions.",
      learnMore: "Learn more",
      accept: "I understand",
    },
  };

  const lang = language === "zh-CN" ? "zh-CN" : language === "en" ? "en" : "zh-TW";
  const t = texts[lang];

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm shadow-lg",
        "transition-transform duration-300",
        visible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="container py-3">
        <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed flex-1">
            {t.message}{" "}
            <Link href="/disclaimer" className="underline underline-offset-2 hover:text-foreground transition-colors">
              {t.learnMore}
            </Link>
            {" · "}
            <Link href="/terms" className="underline underline-offset-2 hover:text-foreground transition-colors">
              {language === "en" ? "Terms" : language === "zh-CN" ? "使用条款" : "使用條款"}
            </Link>
            {" · "}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">
              {language === "en" ? "Privacy" : language === "zh-CN" ? "隐私政策" : "私隱政策"}
            </Link>
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" onClick={handleAccept} className="h-7 text-xs px-3">
              {t.accept}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 text-muted-foreground hover:text-foreground"
              onClick={handleAccept}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
