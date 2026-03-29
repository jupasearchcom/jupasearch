import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sun,
  Moon,
  Globe,
  Menu,
  X,
  BookOpen,
  Heart,
  ListOrdered,
  BarChart2,
  Settings,
  LogOut,
  User,
  ChevronDown,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => window.location.reload(),
  });

  // Update document title for SEO
  useEffect(() => {
    const titles: Record<string, string> = {
      "zh-TW": "JupaSearch — 香港升學課程第三方資訊平台 | JUPAS 課程搜尋",
      "zh-CN": "JupaSearch — 香港升学课程第三方资讯平台 | JUPAS 课程搜寻",
      "en": "JupaSearch — Hong Kong University Admissions Info Platform | JUPAS Course Search",
    };
    document.title = titles[language] ?? titles["zh-TW"];

    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    const descriptions: Record<string, string> = {
      "zh-TW": "JupaSearch 是香港升學課程第三方資訊平台，提供 JUPAS 課程搜尋、收生統計、文憑試成績計算、志願模擬等功能，助你作出最佳升學決定。",
      "zh-CN": "JupaSearch 是香港升学课程第三方资讯平台，提供 JUPAS 课程搜寻、收生统计、文凭试成绩计算、志愿模拟等功能，助你作出最佳升学决定。",
      "en": "JupaSearch is a third-party information platform for Hong Kong university admissions. Search JUPAS courses, view admission statistics, calculate DSE scores, and simulate your JUPAS choices.",
    };
    if (metaDesc) {
      metaDesc.setAttribute("content", descriptions[language] ?? descriptions["zh-TW"]);
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = descriptions[language] ?? descriptions["zh-TW"];
      document.head.appendChild(meta);
    }
  }, [language]);

  const navItems = [
    { href: "/courses", label: t("nav.courses"), icon: BookOpen },
    { href: "/dse", label: language === "en" ? "DSE Scores" : language === "zh-CN" ? "文凭试成绩" : "文憑試成績", icon: Calculator },
    { href: "/favorites", label: t("nav.favorites"), icon: Heart },
    { href: "/choices", label: t("nav.choices"), icon: ListOrdered },
    { href: "/compare", label: t("nav.compare"), icon: BarChart2 },
  ];

  const isActive = (href: string) => location === href || location.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
            <span className="text-background font-bold text-sm font-mono">JS</span>
          </div>
          {/* Desktop: show full name + subtitle */}
          <div className="hidden sm:block">
            <span className="font-bold text-lg tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              JupaSearch
            </span>
            <span className="text-xs text-muted-foreground block leading-none -mt-0.5">
              {language === "en" ? "HK University Admissions" : language === "zh-CN" ? "香港升学资讯平台" : "香港升學資訊平台"}
            </span>
          </div>
          {/* Mobile: show name + subtitle */}
          <div className="sm:hidden">
            <span className="font-bold text-base tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              JupaSearch
            </span>
            <span className="text-[10px] text-muted-foreground block leading-none -mt-0.5">
              {language === "en" ? "HK Admissions Platform" : language === "zh-CN" ? "香港升学资讯平台" : "香港升學資訊平台"}
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "gap-1.5 text-sm font-medium transition-colors",
                  isActive(href)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Button>
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link href="/admin">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "gap-1.5 text-sm font-medium",
                  isActive("/admin")
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Settings className="w-4 h-4" />
                {t("nav.admin")}
              </Button>
            </Link>
          )}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-1">
          {/* Language switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground px-2">
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-medium">
                  {language === "zh-TW" ? "繁中" : language === "zh-CN" ? "简中" : "EN"}
                </span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[120px]">
              <DropdownMenuItem onClick={() => setLanguage("zh-TW")} className={cn(language === "zh-TW" && "font-semibold")}>
                繁體中文
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("zh-CN")} className={cn(language === "zh-CN" && "font-semibold")}>
                简体中文
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("en")} className={cn(language === "en" && "font-semibold")}>
                English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 text-muted-foreground hover:text-foreground"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          {/* Auth */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 hidden sm:flex">
                  <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">
                    {user?.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="text-sm font-medium max-w-[100px] truncate">{user?.name}</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                {user?.role === "admin" && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                        <Settings className="w-4 h-4" />
                        {t("nav.admin")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={() => logout.mutate()}
                  className="text-destructive focus:text-destructive gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              className="hidden sm:flex gap-2"
              onClick={() => window.location.href = getLoginUrl()}
            >
              <User className="w-4 h-4" />
              {t("nav.login")}
            </Button>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden w-9 h-9"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-background animate-in slide-in-from-top-2 duration-200">
          <nav className="container py-3 flex flex-col gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3",
                    isActive(href) ? "bg-accent" : "text-muted-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Button>
              </Link>
            ))}
            {user?.role === "admin" && (
              <Link href="/admin" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground">
                  <Settings className="w-4 h-4" />
                  {t("nav.admin")}
                </Button>
              </Link>
            )}
            <div className="border-t border-border mt-2 pt-2">
              {isAuthenticated ? (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-destructive"
                  onClick={() => logout.mutate()}
                >
                  <LogOut className="w-4 h-4" />
                  {t("nav.logout")}
                </Button>
              ) : (
                <Button
                  className="w-full gap-2"
                  onClick={() => window.location.href = getLoginUrl()}
                >
                  <User className="w-4 h-4" />
                  {t("nav.login")}
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
