import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Mail } from "lucide-react";

export default function Footer() {
  const { t, language } = useLanguage();

  const legalLinks = {
    "zh-TW": { disclaimer: "免責聲明", terms: "使用條款", privacy: "私隱政策" },
    "zh-CN": { disclaimer: "免责声明", terms: "使用条款", privacy: "隐私政策" },
    en: { disclaimer: "Disclaimer", terms: "Terms of Use", privacy: "Privacy Policy" },
  };
  const lang = language === "zh-CN" ? "zh-CN" : language === "en" ? "en" : "zh-TW";
  const legal = legalLinks[lang];

  const platformTitle = language === "en" ? "Platform" : language === "zh-CN" ? "课程平台" : "課程平台";
  const toolsTitle = language === "en" ? "Tools" : language === "zh-CN" ? "升学工具" : "升學工具";
  const legalTitle = language === "en" ? "Legal" : language === "zh-CN" ? "法律" : "法律資訊";
  const contactTitle = language === "en" ? "Contact" : language === "zh-CN" ? "联系我们" : "聯絡我們";

  const copyrightNotice = {
    "zh-TW": "如您認為本網頁內容涉及侵犯版權，若需刪除請來信 jupasearch.com@gmail.com，我們將盡快處理。",
    "zh-CN": "如您认为本网页内容涉及侵犯版权，若需删除请来信 jupasearch.com@gmail.com，我们将尽快处理。",
    en: "If you believe any content on this site infringes your copyright and wish to have it removed, please contact jupasearch.com@gmail.com and we will respond promptly.",
  };

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
                  {language === "en" ? "JUPAS Courses" : language === "zh-CN" ? "JUPAS 课程搜寻" : "JUPAS 課程搜尋"}
                </Link>
              </li>

            </ul>
          </div>

          {/* Tools */}
          <div>
            <h4 className="font-semibold text-sm mb-3">{toolsTitle}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/dse" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {language === "en" ? "DSE Score Input" : language === "zh-CN" ? "文凭试成绩" : "文憑試成績"}
                </Link>
              </li>
              <li>
                <Link href="/compare" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {language === "en" ? "Compare Courses" : language === "zh-CN" ? "课程比较" : "課程比較"}
                </Link>
              </li>
              <li>
                <Link href="/choices" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {language === "en" ? "Choice Simulator" : language === "zh-CN" ? "志愿模拟" : "志願模擬"}
                </Link>
              </li>

            </ul>
          </div>

          {/* Legal & Contact */}
          <div>
            <h4 className="font-semibold text-sm mb-3">{legalTitle}</h4>
            <ul className="space-y-2 mb-4">
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
            <h4 className="font-semibold text-sm mb-2">{contactTitle}</h4>
            <a
              href="mailto:jupasearch.com@gmail.com"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              jupasearch.com@gmail.com
            </a>
          </div>
        </div>

        {/* Copyright infringement notice */}
        <div className="border-t border-border pt-4 mb-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {copyrightNotice[lang]}
          </p>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">{t("footer.copyright")}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>jupasearch.com</span>
            <span>·</span>
            <Link href="/disclaimer" className="hover:text-foreground transition-colors">
              {legal.disclaimer}
            </Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              {legal.terms}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
