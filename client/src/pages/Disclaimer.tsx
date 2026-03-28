import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, AlertTriangle } from "lucide-react";

const content = {
  "zh-TW": {
    title: "免責聲明",
    lastUpdated: "最後更新：2025年1月",
    sections: [
      {
        heading: "資料性質",
        body: `JupaSearch（本平台）所提供之所有課程資訊，包括但不限於收生人數、入學成績中位數、下四分位數、最低入學要求、學費及各項篩選資料，均屬第三方整理之參考資料，並非由各大學或香港考試及評核局（HKDSE）官方提供。`,
      },
      {
        heading: "資料準確性",
        body: `本平台盡力確保所載資料之準確性，惟不保證任何資料之完整性、及時性或適用性。課程資料可能隨院校政策更改而有所變動，用戶在作出任何升學決定前，務必向相關院校或官方渠道（如 JUPAS 官方網站 www.jupas.edu.hk）核實最新資訊。`,
      },
      {
        heading: "AI 推薦功能",
        body: `本平台提供之 AI 課程推薦功能，僅供參考之用。AI 分析結果並不構成任何專業升學輔導意見。用戶應結合個人實際情況、諮詢專業升學顧問，並參閱官方資料後，方可作出最終升學決定。`,
      },
      {
        heading: "責任限制",
        body: `本平台對因使用或依賴本平台資料而引致之任何直接、間接、附帶或後果性損失，概不負責。用戶須自行承擔使用本平台資料之一切風險。`,
      },
      {
        heading: "外部連結",
        body: `本平台可能包含連結至第三方網站。本平台對該等外部網站之內容及私隱政策概不負責，亦不代表本平台認可該等網站之內容。`,
      },
      {
        heading: "資料更新",
        body: `本平台之課程資料由管理員不定期更新。如發現任何資料錯誤，歡迎透過聯絡方式通知我們，我們將盡快核實及更正。`,
      },
    ],
  },
  "zh-CN": {
    title: "免责声明",
    lastUpdated: "最后更新：2025年1月",
    sections: [
      {
        heading: "资料性质",
        body: `JupaSearch（本平台）所提供之所有课程信息，包括但不限于收生人数、入学成绩中位数、下四分位数、最低入学要求、学费及各项筛选资料，均属第三方整理之参考资料，并非由各大学或香港考试及评核局（HKDSE）官方提供。`,
      },
      {
        heading: "资料准确性",
        body: `本平台尽力确保所载资料之准确性，惟不保证任何资料之完整性、及时性或适用性。课程资料可能随院校政策更改而有所变动，用户在作出任何升学决定前，务必向相关院校或官方渠道（如 JUPAS 官方网站 www.jupas.edu.hk）核实最新信息。`,
      },
      {
        heading: "AI 推荐功能",
        body: `本平台提供之 AI 课程推荐功能，仅供参考之用。AI 分析结果并不构成任何专业升学辅导意见。用户应结合个人实际情况、咨询专业升学顾问，并参阅官方资料后，方可作出最终升学决定。`,
      },
      {
        heading: "责任限制",
        body: `本平台对因使用或依赖本平台资料而引致之任何直接、间接、附带或后果性损失，概不负责。用户须自行承担使用本平台资料之一切风险。`,
      },
      {
        heading: "外部链接",
        body: `本平台可能包含链接至第三方网站。本平台对该等外部网站之内容及隐私政策概不负责，亦不代表本平台认可该等网站之内容。`,
      },
      {
        heading: "资料更新",
        body: `本平台之课程资料由管理员不定期更新。如发现任何资料错误，欢迎通过联系方式通知我们，我们将尽快核实及更正。`,
      },
    ],
  },
  en: {
    title: "Disclaimer",
    lastUpdated: "Last updated: January 2025",
    sections: [
      {
        heading: "Nature of Information",
        body: `All course information provided by JupaSearch (this Platform), including but not limited to admission quotas, median admission scores, lower quartile scores, minimum entry requirements, tuition fees, and other filter data, is compiled by a third party for reference purposes only and is not officially provided by any university or the Hong Kong Examinations and Assessment Authority (HKDSE).`,
      },
      {
        heading: "Accuracy of Information",
        body: `While this Platform strives to ensure the accuracy of all information, we make no warranty as to the completeness, timeliness, or suitability of any information. Course details may change in accordance with institutional policies. Before making any academic decisions, users must verify the latest information with the relevant institution or official channels (e.g., the official JUPAS website at www.jupas.edu.hk).`,
      },
      {
        heading: "AI Recommendation Feature",
        body: `The AI course recommendation feature provided by this Platform is for reference purposes only. AI analysis results do not constitute professional academic counselling advice. Users should consider their personal circumstances, consult professional academic advisors, and refer to official information before making any final academic decisions.`,
      },
      {
        heading: "Limitation of Liability",
        body: `This Platform accepts no responsibility for any direct, indirect, incidental, or consequential loss arising from the use of or reliance on information provided by this Platform. Users assume all risks associated with using information from this Platform.`,
      },
      {
        heading: "External Links",
        body: `This Platform may contain links to third-party websites. This Platform accepts no responsibility for the content or privacy policies of such external websites, nor does it imply endorsement of the content of those websites.`,
      },
      {
        heading: "Data Updates",
        body: `Course data on this Platform is updated periodically by administrators. If you discover any inaccuracies, please contact us and we will verify and correct the information as soon as possible.`,
      },
    ],
  },
};

export default function Disclaimer() {
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
        <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', 'Noto Serif TC', serif" }}>
          {c.title}
        </h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8">{c.lastUpdated}</p>

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
        <Link href="/terms" className="hover:text-foreground transition-colors">
          {language === "en" ? "Terms of Use" : language === "zh-CN" ? "使用条款" : "使用條款"}
        </Link>
        <Link href="/privacy" className="hover:text-foreground transition-colors">
          {language === "en" ? "Privacy Policy" : language === "zh-CN" ? "隐私政策" : "私隱政策"}
        </Link>
      </div>
    </div>
  );
}
