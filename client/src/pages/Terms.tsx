import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ScrollText } from "lucide-react";

const content = {
  "zh-TW": {
    title: "使用條款",
    lastUpdated: "最後更新：2025年1月",
    intro: "請在使用 JupaSearch 平台前仔細閱讀以下使用條款。使用本平台即表示您同意受以下條款約束。",
    sections: [
      {
        heading: "接受條款",
        body: `使用 JupaSearch（本平台）即表示您同意遵守本使用條款。如您不同意任何條款，請停止使用本平台。本平台保留隨時修改本條款之權利，修改後之條款將在本頁面公佈，繼續使用本平台即視為接受修改後之條款。`,
      },
      {
        heading: "服務說明",
        body: `本平台為香港升學課程第三方資訊平台，提供 JUPAS 課程資訊查詢、比較及 AI 推薦等功能。本平台並非 JUPAS 官方平台，亦與任何香港院校無官方關聯。`,
      },
      {
        heading: "用戶帳戶",
        body: `部分功能（如收藏課程、模擬志願、AI 推薦）需要登入帳戶方可使用。您有責任妥善保管帳戶資料，並對帳戶下之所有活動負責。如發現帳戶被未經授權使用，請立即通知我們。`,
      },
      {
        heading: "禁止行為",
        body: `用戶不得：（1）使用本平台從事任何違法活動；（2）嘗試入侵、破壞或干擾本平台之正常運作；（3）抓取、複製或再分發本平台之課程資料用於商業目的；（4）冒充他人或提供虛假資料；（5）上傳任何含有病毒或惡意代碼之內容。`,
      },
      {
        heading: "知識產權",
        body: `本平台之設計、標誌、介面及原創內容均受版權保護，屬本平台所有。課程資料來源於公開資訊，本平台對其整理及呈現方式享有版權。未經書面許可，不得複製或商業使用。`,
      },
      {
        heading: "服務中斷",
        body: `本平台不保證服務之持續可用性。本平台可能因維護、升級或不可抗力因素而暫時中斷服務，本平台對此不承擔任何責任。`,
      },
      {
        heading: "適用法律",
        body: `本使用條款受香港特別行政區法律管轄，任何因本條款引起之爭議，應提交香港法院解決。`,
      },
      {
        heading: "聯絡我們",
        body: `如對本使用條款有任何疑問，請透過本平台之聯絡方式與我們聯繫。`,
      },
    ],
  },
  "zh-CN": {
    title: "使用条款",
    lastUpdated: "最后更新：2025年1月",
    intro: "请在使用 JupaSearch 平台前仔细阅读以下使用条款。使用本平台即表示您同意受以下条款约束。",
    sections: [
      {
        heading: "接受条款",
        body: `使用 JupaSearch（本平台）即表示您同意遵守本使用条款。如您不同意任何条款，请停止使用本平台。本平台保留随时修改本条款之权利，修改后之条款将在本页面公布，继续使用本平台即视为接受修改后之条款。`,
      },
      {
        heading: "服务说明",
        body: `本平台为香港升学课程第三方信息平台，提供 JUPAS 课程信息查询、比较及 AI 推荐等功能。本平台并非 JUPAS 官方平台，亦与任何香港院校无官方关联。`,
      },
      {
        heading: "用户账户",
        body: `部分功能（如收藏课程、模拟志愿、AI 推荐）需要登录账户方可使用。您有责任妥善保管账户资料，并对账户下之所有活动负责。如发现账户被未经授权使用，请立即通知我们。`,
      },
      {
        heading: "禁止行为",
        body: `用户不得：（1）使用本平台从事任何违法活动；（2）尝试入侵、破坏或干扰本平台之正常运作；（3）抓取、复制或再分发本平台之课程资料用于商业目的；（4）冒充他人或提供虚假资料；（5）上传任何含有病毒或恶意代码之内容。`,
      },
      {
        heading: "知识产权",
        body: `本平台之设计、标志、界面及原创内容均受版权保护，属本平台所有。课程资料来源于公开信息，本平台对其整理及呈现方式享有版权。未经书面许可，不得复制或商业使用。`,
      },
      {
        heading: "服务中断",
        body: `本平台不保证服务之持续可用性。本平台可能因维护、升级或不可抗力因素而暂时中断服务，本平台对此不承担任何责任。`,
      },
      {
        heading: "适用法律",
        body: `本使用条款受香港特别行政区法律管辖，任何因本条款引起之争议，应提交香港法院解决。`,
      },
      {
        heading: "联系我们",
        body: `如对本使用条款有任何疑问，请通过本平台之联系方式与我们联系。`,
      },
    ],
  },
  en: {
    title: "Terms of Use",
    lastUpdated: "Last updated: January 2025",
    intro: "Please read the following Terms of Use carefully before using the JupaSearch platform. By using this Platform, you agree to be bound by these terms.",
    sections: [
      {
        heading: "Acceptance of Terms",
        body: `By using JupaSearch (this Platform), you agree to comply with these Terms of Use. If you do not agree to any of these terms, please discontinue use of this Platform. This Platform reserves the right to modify these terms at any time. Updated terms will be published on this page, and continued use of this Platform constitutes acceptance of the updated terms.`,
      },
      {
        heading: "Description of Service",
        body: `This Platform is a third-party information platform for Hong Kong higher education courses, providing JUPAS course information search, comparison, and AI recommendation features. This Platform is not the official JUPAS platform and has no official affiliation with any Hong Kong institution.`,
      },
      {
        heading: "User Accounts",
        body: `Certain features (such as saving courses, simulating JUPAS choices, and AI recommendations) require a user account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. Please notify us immediately if you discover any unauthorised use of your account.`,
      },
      {
        heading: "Prohibited Conduct",
        body: `Users must not: (1) use this Platform for any unlawful purpose; (2) attempt to hack, damage, or disrupt the normal operation of this Platform; (3) scrape, copy, or redistribute course data from this Platform for commercial purposes; (4) impersonate others or provide false information; (5) upload any content containing viruses or malicious code.`,
      },
      {
        heading: "Intellectual Property",
        body: `The design, logo, interface, and original content of this Platform are protected by copyright and are the property of this Platform. Course data is sourced from publicly available information; this Platform holds copyright over its compilation and presentation. Reproduction or commercial use without written permission is prohibited.`,
      },
      {
        heading: "Service Interruptions",
        body: `This Platform does not guarantee continuous availability of its services. Services may be temporarily interrupted due to maintenance, upgrades, or force majeure events, and this Platform accepts no liability for such interruptions.`,
      },
      {
        heading: "Governing Law",
        body: `These Terms of Use are governed by the laws of the Hong Kong Special Administrative Region. Any disputes arising from these terms shall be submitted to the courts of Hong Kong for resolution.`,
      },
      {
        heading: "Contact Us",
        body: `If you have any questions about these Terms of Use, please contact us through the contact methods provided on this Platform.`,
      },
    ],
  },
};

export default function Terms() {
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
        <ScrollText className="w-6 h-6 shrink-0" />
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
        <Link href="/privacy" className="hover:text-foreground transition-colors">
          {language === "en" ? "Privacy Policy" : language === "zh-CN" ? "隐私政策" : "私隱政策"}
        </Link>
      </div>
    </div>
  );
}
