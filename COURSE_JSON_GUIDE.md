# JupaSearch 課程 JSON 資料格式指導

本指導用於 AI 自動抓取課程資料並生成標準 JSON 格式。

---

## 完整課程 JSON 範例

```json
{
  "jupasCode": "JS1050",
  "nameZhTw": "理學士（生物科技）",
  "nameZhCn": "理学士（生物科技）",
  "nameEn": "Bachelor of Science (Biotechnology)",
  "degreeType": "BSc",
  "institution": "香港大學",
  "institutionZhCn": "香港大学",
  "institutionEn": "University of Hong Kong",
  "institutionCode": "HKU",
  "duration": 4,
  "qualification": "bachelor",
  "scoringMethod": "best5",
  "requiredSubjects": ["chinese", "english", "math"],
  "weightedSubjects": [
    { "subject": "math", "multiplier": 2.5 },
    { "subject": "english", "multiplier": 2 },
    { "subject": "physics", "multiplier": 1.5 },
    { "subject": "chemistry", "multiplier": 1.5 }
  ],
  "minRequirement": "332A33",
  "interviewArrangement": "可能進行面試",
  "quota": 50,
  "lastYearMedian": 35.5,
  "lastYearQ1": 32.0,
  "expectedScore": null,
  "lastYearAdmitted": 48,
  "lastYearGroupAAdmitted": 40,
  "lastYearGroupAApplicants": 120,
  "lastYearTotalApplicants": 200,
  "groupAOnly": false,
  "scoreGap": "above_median",
  "fundingType": "ugc",
  "tuitionFee": 0,
  "scoringMethodChanged": false,
  "isNew": false,
  "moduleType": "jupas",
  "descriptionZhTw": "本課程培養學生在生物科技領域的專業知識...",
  "descriptionZhCn": "本课程培养学生在生物科技领域的专业知识...",
  "descriptionEn": "This programme equips students with professional knowledge in biotechnology...",
  "careerProspectsZhTw": "畢業生可從事生物科技研究、製藥、食品加工等行業...",
  "careerProspectsZhCn": "毕业生可从事生物科技研究、制药、食品加工等行业...",
  "careerProspectsEn": "Graduates can pursue careers in biotech research, pharmaceuticals, food processing...",
  "websiteUrl": "https://www.hku.hk/programme/bsc-biotechnology",
  "jupasUrl": "https://www.jupas.edu.hk/programmes/JS1050",
  "jupasOfficialUrl": "https://www.jupas.edu.hk/",
  "flexibleAdmission": false,
  "acceptMultipleSittings": "yes_no_penalty",
  "acceptAppliedLearning": false,
  "acceptOtherLanguage": false,
  "scoringScale": "8.5",
  "scoreFormula": {
    "method": "best5",
    "required": ["chinese", "english", "math"],
    "excluded": [],
    "weighted": [
      { "subject": "math", "multiplier": 2.5 },
      { "subject": "english", "multiplier": 2 },
      { "subject": "physics", "multiplier": 1.5 },
      { "subject": "chemistry", "multiplier": 1.5 }
    ],
    "coreSubjects": [],
    "minSubjectRequirements": [
      { "subject": "physics", "minGrade": "3" },
      { "subject": "chemistry", "minGrade": "3" }
    ],
    "electiveMinReq": "33",
    "excludeM1M2FromElectiveMin": false,
    "js4501Special": false,
    "excludeLv2": false,
    "weightedBestOf": [
      { "subjects": ["physics", "biology", "chemistry"], "multiplier": 1.66667 }
    ],
    "requiredBestOf": [["physics", "biology", "chemistry"]],
    "bonusSubject": null
  },
  "specificSubjectRequirements": {
    "groups": [
      { "subjects": ["physics", "chemistry", "biology"], "minGrade": 3 }
    ]
  }
}
```

---

## 欄位詳細說明

### 基本資訊

| 欄位 | 類型 | 必填 | 說明 | 範例 |
|------|------|------|------|------|
| `jupasCode` | string | ✓ | JUPAS 課程代碼 | `"JS1050"` |
| `nameZhTw` | string | ✓ | 課程名稱（繁體中文） | `"理學士（生物科技）"` |
| `nameZhCn` | string | | 課程名稱（簡體中文） | `"理学士（生物科技）"` |
| `nameEn` | string | | 課程名稱（英文） | `"Bachelor of Science (Biotechnology)"` |
| `degreeType` | string | | 學位類型 | `"BSc"`, `"BA"`, `"BEng"`, `"BEd"`, `"BLaw"`, `"BBA"` |

### 機構資訊

| 欄位 | 類型 | 必填 | 說明 | 範例 |
|------|------|------|------|------|
| `institution` | string | ✓ | 大學名稱（繁體中文） | `"香港大學"` |
| `institutionZhCn` | string | | 大學名稱（簡體中文） | `"香港大学"` |
| `institutionEn` | string | | 大學名稱（英文） | `"University of Hong Kong"` |
| `institutionCode` | string | | 大學代碼 | `"HKU"`, `"CUHK"`, `"UST"` |
| `duration` | integer | | 課程年期 | `2`, `4`, `5`, `6` |
| `qualification` | enum | | 資格類型 | `"bachelor"`, `"higher_diploma"`, `"associate_degree"` |

### 計分方式

| 欄位 | 類型 | 必填 | 說明 | 範例 |
|------|------|------|------|------|
| `scoringMethod` | string | | 計分方法 | `"best5"`, `"best6"`, `"best7"`, `"best4"`, `"3c2x"` |
| `scoringScale` | string | | 計分制 | `"8.5"` (8.5 分制), `"7"` (7 分制) |
| `requiredSubjects` | string[] | | 必修科目代號 | `["chinese", "english", "math"]` |
| `weightedSubjects` | object[] | | 加成科目 | 見下表 |
| `minRequirement` | string | | 最低要求 | `"332A33"` (中英數通識選修1選修2) |

### 加成科目格式

```json
"weightedSubjects": [
  { "subject": "math", "multiplier": 2.5 },
  { "subject": "english", "multiplier": 2.0 },
  { "subject": "physics", "multiplier": 1.5 }
]
```

**subject 代號列表**（26 個選修科目）：

| 科目 | 代號 |
|------|------|
| 物理 | `physics` |
| 化學 | `chemistry` |
| 生物 | `biology` |
| 組合科學（物理、化學） | `combined_sci_phy_chem` |
| 組合科學（化學、生物） | `combined_sci_chem_bio` |
| 組合科學（物理、生物） | `combined_sci_phy_bio` |
| 綜合科學 | `integrated_science` |
| 資訊及通訊科技 | `ict` |
| 設計與應用科技 | `dat` |
| 健康管理與社會關懷 | `hmsc` |
| 科技與生活（服裝、成衣與紡織） | `tal_clothing` |
| 科技與生活（食物科學與科技） | `tal_food` |
| 企業、會計與財務概論（會計選修部分） | `bafs_accounting` |
| 企業、會計與財務概論（商業管理選修部分） | `bafs_business` |
| 企業、會計與財務概論（不分選修） | `bafs` |
| 經濟 | `economics` |
| 地理 | `geography` |
| 歷史 | `history` |
| 中國歷史 | `chinese_history` |
| 倫理與宗教 | `ethics` |
| 中國文學 | `chinese_lit` |
| 英語文學 | `english_lit` |
| 旅遊與款待 | `tourism` |
| 視覺藝術 | `va` |
| 音樂 | `music` |
| 體育 | `pe` |

### 面試與收生

| 欄位 | 類型 | 必填 | 說明 | 範例 |
|------|------|------|------|------|
| `interviewArrangement` | string | | 面試安排 | `"可能進行面試"`, `"不設面試"`, `"必須面試"` |
| `quota` | integer | | 收生人數 | `50` |
| `lastYearMedian` | decimal | | 去年中位數 | `35.5` |
| `lastYearQ1` | decimal | | 去年下四分位數 | `32.0` |
| `expectedScore` | decimal | | 計分方式改變時的預期分數 | `null` 或 `36.0` |
| `lastYearAdmitted` | integer | | 去年取錄人數 | `48` |
| `lastYearGroupAAdmitted` | integer | | 去年組別 A 取錄人數 | `40` |
| `lastYearGroupAApplicants` | integer | | 去年組別 A 申請人數 | `120` |
| `lastYearTotalApplicants` | integer | | 去年總申請人數 | `200` |
| `groupAOnly` | boolean | | 去年是否只錄取組別 A | `false` |
| `scoreGap` | enum | | 分數差距分類 | `"above_median"`, `"above_q1"`, `"below_q1"`, `"between_median_q1"` |

### 資助與學費

| 欄位 | 類型 | 必填 | 說明 | 範例 |
|------|------|------|------|------|
| `fundingType` | enum | | 資助類型 | `"ugc"`, `"nmtss"`, `"sssdp"`, `"self_financed"` |
| `tuitionFee` | integer | | 年度學費（港元） | `0` (UGC 資助), `50000` (自資) |

### 狀態標誌

| 欄位 | 類型 | 必填 | 說明 | 範例 |
|------|------|------|------|------|
| `scoringMethodChanged` | boolean | | 計分方式是否改變 | `false` |
| `isNew` | boolean | | 是否為新課程 | `false` |
| `moduleType` | enum | | 課程模塊類型 | `"jupas"`, `"eapp"`, `"mainland"` |
| `flexibleAdmission` | boolean | | 是否接受彈性入學 | `false` |
| `acceptMultipleSittings` | enum | | 接受多次應考 | `"yes_no_penalty"`, `"yes_with_penalty"`, `"no"` |
| `acceptAppliedLearning` | boolean | | 是否接受應用學習 | `false` |
| `acceptOtherLanguage` | boolean | | 是否接受其他語言 | `false` |

### 描述與前景

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `descriptionZhTw` | text | | 課程描述（繁體中文） |
| `descriptionZhCn` | text | | 課程描述（簡體中文） |
| `descriptionEn` | text | | 課程描述（英文） |
| `careerProspectsZhTw` | text | | 職業前景（繁體中文） |
| `careerProspectsZhCn` | text | | 職業前景（簡體中文） |
| `careerProspectsEn` | text | | 職業前景（英文） |

### 連結

| 欄位 | 類型 | 必填 | 說明 | 範例 |
|------|------|------|------|------|
| `websiteUrl` | string | | 課程官方網址 | `"https://www.hku.hk/programme/bsc-biotechnology"` |
| `jupasUrl` | string | | JUPAS 課程頁面 | `"https://www.jupas.edu.hk/programmes/JS1050"` |
| `jupasOfficialUrl` | string | | JUPAS 官方網址 | `"https://www.jupas.edu.hk/"` |

---

## scoreFormula 詳細說明

`scoreFormula` 是一個複雜的 JSON 物件，定義了「我的分數」計算規則。

### 基本結構

```json
"scoreFormula": {
  "method": "best5",
  "required": ["chinese", "english", "math"],
  "excluded": [],
  "weighted": [
    { "subject": "math", "multiplier": 2.5 },
    { "subject": "english", "multiplier": 2 }
  ],
  "coreSubjects": [],
  "minSubjectRequirements": [
    { "subject": "physics", "minGrade": "3" }
  ],
  "electiveMinReq": "33",
  "excludeM1M2FromElectiveMin": false,
  "js4501Special": false,
  "excludeLv2": false,
  "weightedBestOf": [
    { "subjects": ["physics", "biology", "chemistry"], "multiplier": 1.66667 }
  ],
  "requiredBestOf": [["physics", "biology", "chemistry"]],
  "bonusSubject": null
}
```

### 各欄位說明

| 欄位 | 類型 | 說明 | 範例 |
|------|------|------|------|
| `method` | string | 計分方法 | `"best5"`, `"best6"`, `"best7"`, `"best4"`, `"3c2x"` |
| `required` | string[] | 必須計入的科目 | `["chinese", "english", "math"]` |
| `excluded` | string[] | 不能計入的科目 | `["ls"]` (通識不計分) |
| `weighted` | object[] | 加成科目及倍數 | `[{"subject": "math", "multiplier": 2.5}]` |
| `coreSubjects` | string[] | 3c2x 方法中的核心科目 | `["chinese", "english", "math"]` |
| `minSubjectRequirements` | object[] | 特定科目最低要求 | `[{"subject": "physics", "minGrade": "3"}]` |
| `electiveMinReq` | string | 選修科最低要求 | `"33"` (至少 2 科達 3 級), `"22"` (至少 2 科達 2 級), `null` (無要求) |
| `excludeM1M2FromElectiveMin` | boolean | M1/M2 是否計入選修科最低要求 | `false` (計入), `true` (不計入) |
| `js4501Special` | boolean | JS4501/JS4502 特殊 M1/M2 混合規則 | `false` |
| `excludeLv2` | boolean | 是否強制排除 2 級科目 | `false` |
| `weightedBestOf` | object[] | 組內最高分才加成 | `[{"subjects": ["physics", "biology", "chemistry"], "multiplier": 1.66667}]` |
| `requiredBestOf` | string[][] | 組內最高分強制計入 best-N | `[["physics", "biology", "chemistry"]]` |
| `bonusSubject` | object | N+1 科加成 | `{"multiplier": 1.5, "subject": "physics"}` 或 `null` |

### 計分邏輯說明

**Step 1: 基礎分數**
- 將每科 DSE 成績轉換為分數（通常 2 級=2 分，3 級=3 分，...，5 級=5 分）

**Step 2: 應用 `weighted` 加成**
- 若科目在 `weighted` 中，乘以對應倍數
- 例：math 原分 4，乘以 2.5 = 10 分

**Step 3: 應用 `weightedBestOf` 規則**
- 對於組內非 best 的科目，保留 `weighted` 的加成
- 對於組內 best 的科目，額外乘以 `weightedBestOf.multiplier`
- 例：`weightedBestOf: [{"subjects": ["physics", "biology", "chemistry"], "multiplier": 1.66667}]`
  - physics=4.5（已有 1.5 倍加成），biology=3，chemistry=6（已有 1.5 倍加成）
  - best = chemistry(6)，再乘 1.66667 = 10
  - 最終：physics=4.5, biology=3, chemistry=10

**Step 4: 應用 `requiredBestOf` 規則**
- 組內最高分的科目強制計入 best-N
- 其他科目放回 optional pool，由 best-N 演算法自由選取

**Step 5: 應用 `required` 規則**
- 必修科目必須計入 best-N

**Step 6: 選取 best-N**
- 根據 `method`（best5/best6 等）從所有科目中選取最高的 N 個分數

**Step 7: 應用 `bonusSubject`**
- 若有 N+1 科加成，額外加上該科的加成分數

---

## specificSubjectRequirements 說明

最低要求中的「特定科目要求」，使用 OR 邏輯（組內任一科達標即可）。

```json
"specificSubjectRequirements": {
  "groups": [
    { "subjects": ["physics", "chemistry", "biology"], "minGrade": 3 },
    { "subjects": ["chinese_lit", "english_lit"], "minGrade": 2 }
  ]
}
```

**含義**：
- 組 1：物理、化學、生物中至少一科達 3 級
- 組 2：中文文學、英文文學中至少一科達 2 級
- 兩個組都要滿足（AND 邏輯）

---

## AI 自動抓取指導

### 資料來源

1. **JUPAS 官方網站**：https://www.jupas.edu.hk/
   - 課程代碼、名稱、機構、計分方式
   - 最低要求、面試安排

2. **大學官方網站**
   - 課程描述、職業前景
   - 學位類型、年期、資助類型

3. **往年統計數據**
   - 中位數、Q1、取錄人數、申請人數

### 抓取步驟

1. **從 JUPAS 官方頁面抓取基本資訊**
   - 課程代碼、名稱、機構、計分方式
   - 最低要求字符串（如 "332A33"）

2. **解析最低要求字符串**
   - 格式：`[中文][英文][數學][通識][選修1][選修2]`
   - 例：`"332A33"` = 中文 3 級、英文 3 級、數學 2 級、通識達標、選修 1 為 3 級、選修 2 為 3 級

3. **從課程詳情頁抓取計分規則**
   - 必修科目、加成科目、特定科目要求
   - 組織成 `scoreFormula` JSON

4. **從統計頁面抓取往年數據**
   - 中位數、Q1、取錄人數等

5. **從大學網站抓取描述與前景**
   - 課程介紹、職業前景、聯絡方式

### 輸出格式

將抓取的資料組織成上述完整 JSON 格式，並驗證：
- 所有必填欄位已填寫
- subject 代號使用正確的英文代號（見上表）
- 數值欄位為正確的資料類型（integer、decimal）
- 列舉欄位使用允許的值

---

## 驗證清單

在提交 JSON 前，請確認：

- [ ] `jupasCode` 不為空且唯一
- [ ] `nameZhTw` 不為空
- [ ] `institution` 不為空
- [ ] `requiredSubjects` 中的代號都在允許列表中
- [ ] `weightedSubjects[].subject` 都在允許列表中
- [ ] `scoreFormula.required` 都在允許列表中
- [ ] `scoreFormula.weighted[].subject` 都在允許列表中
- [ ] `scoreFormula.weightedBestOf[].subjects[]` 都在允許列表中
- [ ] `scoreFormula.requiredBestOf[][]` 都在允許列表中
- [ ] `minRequirement` 格式正確（6 字符）
- [ ] `lastYearMedian` 和 `lastYearQ1` 為合理的分數範圍（通常 20-45）
- [ ] `tuitionFee` 為正整數或 0
- [ ] `duration` 為 2、4、5 或 6
- [ ] `scoringScale` 為 "8.5" 或 "7"
- [ ] 所有 URL 都以 `http://` 或 `https://` 開頭

---

## 常見錯誤

| 錯誤 | 原因 | 修正 |
|------|------|------|
| `"subject": "combined_science"` | 代號已廢棄，需拆分 | 改為 `"combined_sci_phy_chem"` 等 |
| `"subject": "ls"` | 通識不計分 | 從 `required`/`weighted` 中移除 |
| `"subject": "物理"` | 使用中文名稱 | 改為 `"physics"` |
| `minRequirement: "33233"` | 格式錯誤（5 字符） | 確保為 6 字符，如 `"332A33"` |
| `lastYearMedian: "35.5"` | 字符串類型 | 改為數值 `35.5` |
| `tuitionFee: "0"` | 字符串類型 | 改為數值 `0` |
| `scoringScale: "8.5分制"` | 包含額外文字 | 改為 `"8.5"` |

---

## 範例：完整課程 JSON（簡化版）

```json
{
  "jupasCode": "JS2001",
  "nameZhTw": "文學士",
  "institution": "香港中文大學",
  "institutionCode": "CUHK",
  "duration": 4,
  "qualification": "bachelor",
  "scoringMethod": "best5",
  "requiredSubjects": ["chinese", "english", "math"],
  "weightedSubjects": [
    { "subject": "english", "multiplier": 2 },
    { "subject": "chinese_lit", "multiplier": 1.5 }
  ],
  "minRequirement": "332A22",
  "quota": 100,
  "lastYearMedian": 32.5,
  "lastYearQ1": 29.0,
  "fundingType": "ugc",
  "tuitionFee": 0,
  "moduleType": "jupas",
  "scoringScale": "8.5",
  "scoreFormula": {
    "method": "best5",
    "required": ["chinese", "english", "math"],
    "excluded": [],
    "weighted": [
      { "subject": "english", "multiplier": 2 },
      { "subject": "chinese_lit", "multiplier": 1.5 }
    ],
    "coreSubjects": [],
    "electiveMinReq": "22",
    "excludeM1M2FromElectiveMin": false
  },
  "specificSubjectRequirements": {
    "groups": [
      { "subjects": ["chinese_lit", "english_lit"], "minGrade": 2 }
    ]
  }
}
```

---

## 提交方式

完成 JSON 後，可通過以下方式提交：

1. **直接貼入後台管理介面**（如已實裝）
2. **通過 API 批量上傳**（聯絡開發團隊）
3. **提交至資料庫**（DBA 操作）

如有任何問題或不確定的欄位，請參考本指導或聯絡開發團隊。
