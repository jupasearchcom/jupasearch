import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Shield } from "lucide-react";

const content = {
  "zh-TW": {
    title: "私隱政策",
    lastUpdated: "最後更新：2026年3月",
    intro: "JupaSearch 重視您的私隱。本私隱政策說明我們如何收集、使用及保護您的個人資料。",
    sections: [
      {
        heading: "收集之資料",
        body: `當您使用本平台時，我們可能收集以下資料：（1）帳戶資料：您透過 Manus OAuth 登入時提供之姓名及電郵地址；（2）使用資料：您在本平台之操作記錄，包括搜尋記錄、收藏課程、志願選擇及文憑試成績；（3）技術資料：瀏覽器類型、IP 地址及訪問時間等技術資訊。`,
      },
      {
        heading: "資料用途",
        body: `我們收集之資料用於：（1）提供及改善本平台之服務；（2）儲存您的收藏課程及志願選擇；（3）分析平台使用情況以改善用戶體驗；（3）防止欺詐及確保平台安全。`,
      },
      {
        heading: "資料儲存",
        body: `您的個人資料儲存於安全的伺服器。我們採取合理的技術及組織措施保護您的資料，防止未經授權之存取、披露或損毀。`,
      },
      {
        heading: "資料分享",
        body: `我們不會將您的個人資料出售予第三方。在以下情況下，我們可能分享您的資料：（1）獲得您的明確同意；（2）法律要求；（3）保護本平台或用戶之合法權益。`,
      },
      {
        heading: "Cookies",
        body: `本平台使用 Cookies 及類似技術以維持您的登入狀態及記錄語言偏好。您可透過瀏覽器設定管理 Cookies，惟停用 Cookies 可能影響部分功能之正常使用。`,
      },
      {
        heading: "用戶權利",
        body: `您有權：（1）查閱本平台持有之您的個人資料；（2）要求更正不準確之資料；（3）要求刪除您的帳戶及相關資料；（4）反對處理您的個人資料。如欲行使上述權利，請透過本平台之聯絡方式與我們聯繫。`,
      },
      {
        heading: "未成年人",
        body: `本平台並非專為18歲以下人士設計。如發現未成年人在未獲家長同意下提供個人資料，請聯絡我們，我們將採取適當措施。`,
      },
      {
        heading: "政策更新",
        body: `本私隱政策可能不時更新。重大變更將在本平台公告，繼續使用本平台即表示您接受更新後之政策。`,
      },
    ],
  },
  "zh-CN": {
    title: "隐私政策",
    lastUpdated: "最后更新：2026年3月",
    intro: "JupaSearch 重视您的隐私。本隐私政策说明我们如何收集、使用及保护您的个人资料。",
    sections: [
      {
        heading: "收集之资料",
        body: `当您使用本平台时，我们可能收集以下资料：（1）账户资料：您通过 Manus OAuth 登录时提供之姓名及电邮地址；（2）使用资料：您在本平台之操作记录，包括搜索记录、收藏课程、志愿选择及文凭试成绩；（3）技术资料：浏览器类型、IP 地址及访问时间等技术信息。`,
      },
      {
        heading: "资料用途",
        body: `我们收集之资料用于：（1）提供及改善本平台之服务；（2）储存您的收藏课程及志愿选择；（3）分析平台使用情况以改善用户体验；（3）防止欺诈及确保平台安全。`,
      },
      {
        heading: "资料储存",
        body: `您的个人资料储存于安全的服务器。我们采取合理的技术及组织措施保护您的资料，防止未经授权之访问、披露或损毁。`,
      },
      {
        heading: "资料分享",
        body: `我们不会将您的个人资料出售予第三方。在以下情况下，我们可能分享您的资料：（1）获得您的明确同意；（2）法律要求；（3）保护本平台或用户之合法权益。`,
      },
      {
        heading: "Cookies",
        body: `本平台使用 Cookies 及类似技术以维持您的登录状态及记录语言偏好。您可通过浏览器设置管理 Cookies，惟停用 Cookies 可能影响部分功能之正常使用。`,
      },
      {
        heading: "用户权利",
        body: `您有权：（1）查阅本平台持有之您的个人资料；（2）要求更正不准确之资料；（3）要求删除您的账户及相关资料；（4）反对处理您的个人资料。如欲行使上述权利，请通过本平台之联系方式与我们联系。`,
      },
      {
        heading: "未成年人",
        body: `本平台并非专为18岁以下人士设计。如发现未成年人在未获家长同意下提供个人资料，请联系我们，我们将采取适当措施。`,
      },
      {
        heading: "政策更新",
        body: `本隐私政策可能不时更新。重大变更将在本平台公告，继续使用本平台即表示您接受更新后之政策。`,
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    lastUpdated: "Last updated: March 2026",
    intro: "JupaSearch values your privacy. This Privacy Policy explains how we collect, use, and protect your personal data.",
    sections: [
      {
        heading: "Data We Collect",
        body: `When you use this Platform, we may collect the following data: (1) Account data: your name and email address provided when you log in via Manus OAuth; (2) Usage data: your activity on this Platform, including search history, saved courses, JUPAS choice simulations, and AI query history; (3) Technical data: technical information such as browser type, IP address, and access times.`,
      },
      {
        heading: "How We Use Your Data",
        body: `Data we collect is used to: (1) provide and improve this Platform's services; (2) save your favourite courses and JUPAS choice simulations; (3) provide personalised AI course recommendations; (4) analyse Platform usage to improve user experience; (5) prevent fraud and ensure Platform security.`,
      },
      {
        heading: "Data Storage",
        body: `Your personal data is stored on secure servers. We implement reasonable technical and organisational measures to protect your data against unauthorised access, disclosure, or destruction.`,
      },
      {
        heading: "Data Sharing",
        body: `We do not sell your personal data to third parties. We may share your data in the following circumstances: (1) with your explicit consent; (2) as required by law; (3) to protect the legitimate interests of this Platform or its users.`,
      },
      {
        heading: "Cookies",
        body: `This Platform uses cookies and similar technologies to maintain your login state and remember your language preferences. You may manage cookies through your browser settings, though disabling cookies may affect the normal functioning of certain features.`,
      },
      {
        heading: "Your Rights",
        body: `You have the right to: (1) access personal data held by this Platform about you; (2) request correction of inaccurate data; (3) request deletion of your account and associated data; (4) object to the processing of your personal data. To exercise these rights, please contact us through the contact methods provided on this Platform.`,
      },
      {
        heading: "Minors",
        body: `This Platform is not designed for persons under the age of 18. If we become aware that a minor has provided personal data without parental consent, please contact us and we will take appropriate action.`,
      },
      {
        heading: "Policy Updates",
        body: `This Privacy Policy may be updated from time to time. Significant changes will be announced on this Platform, and continued use of this Platform constitutes acceptance of the updated policy.`,
      },
    ],
  },
};

export default function Privacy() {
  const { language } = useLanguage();
  const lang = language === "zh-CN" ? "zh-CN" : language === "en" ? "en" : "zh-TW";
  const c = content[lang];

  return (
    <div className="container py-8 max-w-3xl">
      <Link href="/">
        <Button variant="ghost" size="sm" className="gap-2 mb-6 -ml-2 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4" />
          {language === "en" ? "Back to Home" : "返回首頁"}
        </Button>
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <Shield className="w-6 h-6 shrink-0" />
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', 'Noto Serif TC', serif" }}>
          {c.title}
        </h1>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{c.lastUpdated}</p>
      <p className="text-sm text-muted-foreground leading-relaxed mb-8 p-4 bg-secondary/50 rounded-lg border border-border">
        {c.intro}
      </p>

      <div className="space-y-6">
        {c.sections.map((section, i) => (
          <section key={i}>
            <h2 className="text-base font-semibold mb-2">
              {i + 1}. {section.heading}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{section.body}</p>
          </section>
        ))}
      </div>

      <div className="mt-10 pt-6 border-t border-border flex gap-4 text-xs text-muted-foreground">
        <Link href="/disclaimer" className="hover:text-foreground transition-colors">
          {language === "en" ? "Disclaimer" : language === "zh-CN" ? "免责声明" : "免責聲明"}
        </Link>
        <Link href="/terms" className="hover:text-foreground transition-colors">
          {language === "en" ? "Terms of Use" : language === "zh-CN" ? "使用条款" : "使用條款"}
        </Link>
      </div>
    </div>
  );
}
