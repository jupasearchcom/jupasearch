import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Search,
  BarChart2,
  ListOrdered,
  ArrowRight,
  ChevronRight,
  Calculator,
} from "lucide-react";

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
    },
    {
      icon: Calculator,
      title: language === "en" ? "DSE Score Input" : language === "zh-CN" ? "文凭试成绩" : "文憑試成績",
      desc: language === "en"
        ? "Input your DSE scores to see personalised admission chances"
        : language === "zh-CN"
        ? "输入文凭试成绩，查看个人化录取机会"
        : "輸入文憑試成績，查看個人化錄取機會",
      href: "/dse",
    },
    {
      icon: BarChart2,
      title: t("home.features.compare"),
      desc: t("home.features.compare.desc"),
      href: "/compare",
    },
    {
      icon: ListOrdered,
      title: t("home.features.choices"),
      desc: t("home.features.choices.desc"),
      href: "/choices",
    },
  ];
  // Note: Favorites module temporarily removed from public navigation

  const institutionsByLang: Record<string, string[]> = {
    "zh-TW": [
      "香港大學", "香港中文大學", "香港科技大學", "香港理工大學",
      "香港城市大學", "香港浸會大學", "嶺南大學", "香港教育大學",
      "香港都會大學", "港珠海學院", "香港樹仁大學", "聖方濟各大學",
      "香港高等教育科技學院", "香港恒生大學", "東華學院", "香港伍倫貢學院",
    ],
    "zh-CN": [
      "香港大学", "香港中文大学", "香港科技大学", "香港理工大学",
      "香港城市大学", "香港浸会大学", "岭南大学", "香港教育大学",
      "香港都会大学", "港珠海学院", "香港树仁大学", "圣方济各大学",
      "香港高等教育科技学院", "香港恒生大学", "东华学院", "香港伍伦贡学院",
    ],
    "en": [
      "HKU", "CUHK", "HKUST", "PolyU",
      "CityU", "HKBU", "LU", "EdUHK",
      "HKMU", "CHC", "HSUHK", "SFU",
      "THEi", "HSUHK", "TWC", "UOWCHK",
    ],
  };

  const institutions = institutionsByLang[language] ?? institutionsByLang["zh-TW"];
  const institutionsZhTw = institutionsByLang["zh-TW"];

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
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6"
              style={{ fontFamily: "'Playfair Display', 'Noto Serif TC', serif" }}>
              {language === "en" ? (
                <>Hong Kong University<br /><span className="text-muted-foreground">Admissions Platform</span></>
              ) : language === "zh-CN" ? (
                <>香港升学课程<br /><span className="text-muted-foreground">资讯平台</span></>
              ) : (
                <>香港升學課程<br /><span className="text-muted-foreground">資訊平台</span></>
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
              <Link href="/dse">
                <Button size="lg" variant="outline" className="gap-2 rounded-full px-6">
                  <Calculator className="w-4 h-4" />
                  {language === "en" ? "Enter DSE Scores" : language === "zh-CN" ? "输入文凭试成绩" : "輸入文憑試成績"}
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-6 max-w-xs">
            {[
              { value: totalCourses > 0 ? totalCourses.toString() : "—", label: t("home.stats.courses") },
              { value: "16", label: language === "en" ? "Covered Institutions" : language === "zh-CN" ? "收录院校" : "收錄院校" },
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



      {/* Features */}
      <section className="container py-16 lg:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', 'Noto Serif TC', serif" }}>
            {language === "en" ? "Everything You Need" : language === "zh-CN" ? "一站式升学工具" : "一站式升學工具"}
          </h2>
          <p className="text-muted-foreground">
            {language === "en"
              ? "Comprehensive tools to help you make the best university choice"
              : language === "zh-CN"
              ? "全面的工具，助你作出最佳升学决定"
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
          <h2 className="text-xl font-semibold mb-2 text-center">
            {language === "en" ? "16 Covered Institutions" : language === "zh-CN" ? "16 收录院校" : "16 收錄院校"}
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            {language === "en"
              ? "Covering all JUPAS-participating institutions in Hong Kong"
              : language === "zh-CN"
              ? "涵盖所有参与 JUPAS 的香港院校"
              : "涵蓋所有參與 JUPAS 的香港院校"}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {institutions.map((inst, idx) => (
              <Link key={institutionsZhTw[idx]} href={`/courses?institution=${encodeURIComponent(institutionsZhTw[idx] ?? inst)}`}>
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
            {language === "en" ? "Ready to find your perfect course?" : language === "zh-CN" ? "准备好寻找最适合的课程了吗？" : "準備好尋找最適合的課程了嗎？"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {language === "en"
              ? "Browse all JUPAS courses with detailed admission statistics"
              : language === "zh-CN"
              ? "浏览所有 JUPAS 课程及详细收生统计数据"
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
