import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Search,
  Sparkles,
  BarChart2,
  ListOrdered,
  Heart,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Building2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const { t, language } = useLanguage();
  const { data: coursesData } = trpc.courses.list.useQuery({ moduleType: "jupas", pageSize: 1 });
  const totalCourses = coursesData?.total ?? 0;

  const features = [
    {
      icon: Search,
      title: t("home.features.search"),
      desc: t("home.features.search.desc"),
      href: "/courses",
      color: "bg-foreground text-background",
    },
    {
      icon: BarChart2,
      title: t("home.features.compare"),
      desc: t("home.features.compare.desc"),
      href: "/compare",
      color: "bg-foreground text-background",
    },
    {
      icon: Sparkles,
      title: t("home.features.ai"),
      desc: t("home.features.ai.desc"),
      href: "/ai",
      color: "bg-foreground text-background",
    },
    {
      icon: ListOrdered,
      title: t("home.features.choices"),
      desc: t("home.features.choices.desc"),
      href: "/choices",
      color: "bg-foreground text-background",
    },
  ];

  const institutions = [
    "香港大學", "香港中文大學", "香港科技大學", "香港理工大學",
    "香港城市大學", "香港浸會大學", "嶺南大學", "香港教育大學",
    "香港都會大學", "港珠海學院", "香港樹仁大學", "聖方濟各大學",
    "香港高等教育科技學院", "香港恒生大學", "東華學院", "香港伍倫貢學院",
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }} />

        <div className="container relative py-20 lg:py-28">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-secondary border border-border rounded-full px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {language === "en" ? "Third-party Information Platform" : "第三方資訊平台 · jupasearch.com"}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6"
              style={{ fontFamily: "'Playfair Display', 'Noto Serif TC', serif" }}>
              {language === "en" ? (
                <>Hong Kong University<br /><span className="text-muted-foreground">Admissions Platform</span></>
              ) : (
                <>{t("home.hero.title").split("資訊平台")[0]}<br /><span className="text-muted-foreground">資訊平台</span></>
              )}
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-xl leading-relaxed">
              {t("home.hero.subtitle")}
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/courses">
                <Button size="lg" className="gap-2 rounded-full px-6">
                  <Search className="w-4 h-4" />
                  {t("home.hero.cta")}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/ai">
                <Button size="lg" variant="outline" className="gap-2 rounded-full px-6">
                  <Sparkles className="w-4 h-4" />
                  {t("home.hero.cta2")}
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg">
            {[
              { value: totalCourses > 0 ? totalCourses.toString() : "—", label: t("home.stats.courses") },
              { value: "16", label: t("home.stats.institutions") },
              { value: "∞", label: t("home.stats.users") },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {value}
                </div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module tabs */}
      <section className="border-b border-border bg-secondary/30">
        <div className="container py-4 flex items-center gap-4 overflow-x-auto">
          <Link href="/courses">
            <div className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-full text-sm font-medium whitespace-nowrap cursor-pointer">
              <GraduationCap className="w-4 h-4" />
              {t("home.modules.jupas")}
            </div>
          </Link>
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-full text-sm text-muted-foreground whitespace-nowrap cursor-not-allowed opacity-60">
            <BookOpen className="w-4 h-4" />
            {t("home.modules.eapp")}
            <span className="text-xs bg-border rounded-full px-2 py-0.5">{t("home.modules.eapp.soon")}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-full text-sm text-muted-foreground whitespace-nowrap cursor-not-allowed opacity-60">
            <Building2 className="w-4 h-4" />
            {t("home.modules.mainland")}
            <span className="text-xs bg-border rounded-full px-2 py-0.5">{t("home.modules.mainland.soon")}</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-16 lg:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', 'Noto Serif TC', serif" }}>
            {language === "en" ? "Everything You Need" : "一站式升學工具"}
          </h2>
          <p className="text-muted-foreground">
            {language === "en"
              ? "Comprehensive tools to help you make the best university choice"
              : "全面的工具，助你作出最佳升學決定"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(({ icon: Icon, title, desc, href }) => (
            <Link key={href} href={href}>
              <div className="group p-6 rounded-xl border border-border bg-card hover:border-foreground/20 hover:shadow-lg transition-all duration-200 cursor-pointer h-full">
                <div className="w-10 h-10 rounded-lg bg-foreground text-background flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                <div className="flex items-center gap-1 text-xs font-medium mt-4 text-muted-foreground group-hover:text-foreground transition-colors">
                  {language === "en" ? "Get started" : "立即使用"}
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Institutions */}
      <section className="border-t border-border bg-secondary/20 py-12">
        <div className="container">
          <h2 className="text-xl font-semibold mb-6 text-center">
            {language === "en" ? "Covered Institutions" : "收錄院校"}
          </h2>
          <div className="flex flex-wrap gap-2 justify-center">
            {institutions.map((inst) => (
              <Link key={inst} href={`/courses?institution=${encodeURIComponent(inst)}`}>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full border border-border bg-background text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors cursor-pointer">
                  {inst}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', 'Noto Serif TC', serif" }}>
            {language === "en" ? "Ready to find your perfect course?" : "準備好尋找最適合的課程了嗎？"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {language === "en"
              ? "Browse all JUPAS courses with detailed admission statistics"
              : "瀏覽所有 JUPAS 課程及詳細收生統計數據"}
          </p>
          <Link href="/courses">
            <Button size="lg" className="gap-2 rounded-full px-8">
              <Search className="w-4 h-4" />
              {t("home.hero.cta")}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
