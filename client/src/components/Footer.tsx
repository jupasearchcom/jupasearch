import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Footer() {
  const { t, language } = useLanguage();

  const legalLinks = {
    "zh-TW": { disclaimer: "免責聲明", terms: "使用條款", privacy: "私隱政策" },
    "zh-CN": { disclaimer: "免责声明", terms: "使用条款", privacy: "隐私政策" },
    en: { disclaimer: "Disclaimer", terms: "Terms of Use", privacy: "Privacy Policy" },
  };
  const lang = language === "zh-CN" ? "zh-CN" : language === "en" ? "en" : "zh-TW";
  const legal = legalLinks[lang];

  const platformTitle = language === "en" ? "Platform" : "課程平台";
  const toolsTitle = language === "en" ? "Tools" : "升學工具";
  const legalTitle = language === "en" ? "Legal" : language === "zh-CN" ? "法律" : "法律資訊";

  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="container py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-foreground rounded-md flex items-center justify-center">
                <span className="text-background font-bold text-xs font-mono">JS</span>
              </div>
              <span className="font-bold text-base" style={{ fontFamily: "'Playfair Display', serif" }}>
                JupaSearch
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("footer.disclaimer")}
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-semibold text-sm mb-3">{platformTitle}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/courses" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {language === "en" ? "JUPAS Courses" : "JUPAS 課程搜尋"}
                </Link>
              </li>
              <li>
                <span className="text-sm text-muted-foreground/40 cursor-not-allowed">
                  {language === "en" ? "E-APP (Coming Soon)" : language === "zh-CN" ? "E-APP（即将推出）" : "E-APP（即將推出）"}
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground/40 cursor-not-allowed">
                  {language === "en" ? "Mainland (Coming Soon)" : language === "zh-CN" ? "内地升学（即将推出）" : "內地升學（即將推出）"}
                </span>
              </li>
            </ul>
          </div>

          {/* Tools */}
          <div>
            <h4 className="font-semibold text-sm mb-3">{toolsTitle}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/ai" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {language === "en" ? "AI Advisor" : "AI 課程推薦"}
                </Link>
              </li>
              <li>
                <Link href="/compare" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {language === "en" ? "Compare Courses" : "課程比較"}
                </Link>
              </li>
              <li>
                <Link href="/choices" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {language === "en" ? "Choice Simulator" : "志願模擬"}
                </Link>
              </li>
              <li>
                <Link href="/favorites" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {language === "en" ? "Saved Courses" : "收藏課程"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-sm mb-3">{legalTitle}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/disclaimer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {legal.disclaimer}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {legal.terms}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {legal.privacy}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">{t("footer.copyright")}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>jupasearch.com</span>
            <span>·</span>
            <span>
              {language === "en" ? "Third-party information platform" : language === "zh-CN" ? "第三方信息平台" : "第三方資訊平台"}
            </span>
            <span>·</span>
            <Link href="/disclaimer" className="hover:text-foreground transition-colors">
              {legal.disclaimer}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
