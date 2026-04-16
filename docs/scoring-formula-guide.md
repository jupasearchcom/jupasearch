# JupaSearch 後台計分公式輸入指引

> 本指引說明如何在後台為每個課程設定「我的分數」計算公式，讓用戶能即時看到自己的估算分數。

---

## 一、計分流程概覽

系統按以下順序計算分數：

| 步驟 | 說明 |
|------|------|
| 1 | 檢查最低入學要求（不符合則不計算/顯示分數） |
| 2 | 將 DSE 等級按比例尺（Scale）轉換為數值 |
| 3 | 對 HKU / UST / PolyU 課程，Lv2 及以下科目自動計 0 分 |
| 4 | 按各科目 Weighting（加成）計算加成後分數 |
| 5 | 按 Best N 或 3C+2X 方式選出計分科目並加總 |
| 6 | 若設有 JS4501/JS4502 特殊條件，處理 M1/M2 替換邏輯 |
| 7 | 若設有額外加分科目（Bonus Subject），加上額外分數 |

---

## 二、後台各欄位說明

### 2.1 計分方式（Scoring Method）

| 選項 | 說明 |
|------|------|
| Best 4 | 所有科目（加成後）最佳 4 科加總 |
| Best 5 | 所有科目（加成後）最佳 5 科加總 |
| Best 6 | 所有科目（加成後）最佳 6 科加總 |
| Best 7 | 所有科目（加成後）最佳 7 科加總 |
| 3C+2X | 中文 + 英文 + 數學（3 科核心）+ 加成後最佳 2 科（選修/M1/M2）加總 |

> **注意**：若用戶只讀 5 科但選 Best 6，第 6 科計 0 分。

### 2.2 計分比例尺（Scoring Scale）

| 選項 | 5** | 5* | 5 | 4 | 3 | 2 | 1 | U |
|------|-----|----|----|---|---|---|---|---|
| 7 Scale | 7 | 6 | 5 | 4 | 3 | 2 | 1 | 0 |
| 8.5 Scale | 8.5 | 7 | 5.5 | 4 | 3 | 2 | 1 | 0 |

### 2.3 選修科最低要求

| 選項 | 說明 |
|------|------|
| 不設定 | 不設選修科最低要求 |
| 33 | 選修科/M1/M2 中至少 2 科達 3 級，否則不符合最低要求 |
| 22 | 選修科/M1/M2 中至少 2 科達 2 級，否則不符合最低要求 |

可額外勾選「不計入 M1/M2」，則 M1/M2 不納入上述條件計算。

---

## 三、計分公式 JSON 詳細說明

計分公式以 JSON 格式輸入，以下是完整的欄位說明。

### 3.1 必須欄位

```json
{
  "method": "best5",
  "required": ["chinese", "english"],
  "excluded": [],
  "weighted": [],
  "coreSubjects": []
}
```

| 欄位 | 類型 | 說明 |
|------|------|------|
| `method` | string | 計分方式：`best4` / `best5` / `best6` / `best7` / `3c2x` |
| `required` | string[] | 必須計入的科目（不受 Best N 篩選，一定計入） |
| `excluded` | string[] | 完全排除不計分的科目 |
| `weighted` | object[] | 科目加成設定（見 3.2） |
| `coreSubjects` | string[] | 3C+2X 方式的核心科目（通常為 `["chinese","english","math"]`） |

### 3.2 科目加成（weighted）

```json
"weighted": [
  { "subject": "math", "multiplier": 2 },
  { "subject": "physics", "multiplier": 1.5 }
]
```

每個科目的分數會乘以 `multiplier`。例如數學 ×2 表示數學分數加倍計算。

**科目代碼對照表：**

| 代碼 | 科目 |
|------|------|
| `chinese` | 中文 |
| `english` | 英文 |
| `math` | 數學（必修部分） |
| `m1` | 數學延伸（M1） |
| `m2` | 數學延伸（M2） |
| `physics` | 物理 |
| `chemistry` | 化學 |
| `biology` | 生物 |
| `economics` | 經濟 |
| `bafs` | 企業、會計及財務概論 |
| `ict` | 資訊及通訊科技 |
| `history` | 歷史 |
| `chinese_history` | 中國歷史 |
| `geography` | 地理 |
| `ls` | 通識教育（舊制） |
| `citizenship` | 公民與社會發展（新制） |
| `music` | 音樂 |
| `va` | 視覺藝術 |
| `pe` | 體育 |
| `tourism` | 旅遊與款待 |
| `design` | 設計與應用科技 |
| `ethics` | 倫理與宗教 |
| `chinese_lit` | 中國語文及文化 |
| `english_lit` | 英語文學 |

### 3.3 最佳一科加成（weightedBestOf）

當某課程只允許 M1/M2 中較好的一科有加成時使用：

```json
"weightedBestOf": [
  { "subjects": ["m1", "m2"], "multiplier": 1.2 }
]
```

系統會自動選出 `subjects` 中分數最高的一科乘以 `multiplier`，其餘科目保持原分。

### 3.4 進階計分選項

#### JS4501/JS4502 特殊條件（`js4501Special: true`）

適用於 JS4501（HKU 理學士）和 JS4502（HKU 工程學士）。

**規則：**
- M1/M2 預設不計入 Best 6
- 但若 Best 6 的最後一科分數低於 M1/M2，則以 `0.5 × 最後一科 + 0.5 × M1/M2` 替代最後一科

```json
{
  "method": "best6",
  "js4501Special": true,
  "required": ["chinese", "english"],
  "excluded": [],
  "weighted": [{"subject": "math", "multiplier": 2}],
  "coreSubjects": []
}
```

#### 強制排除 Lv2 科目（`excludeLv2: true`）

香港大學、香港科技大學、香港理工大學的課程**自動**排除 Lv2（即 DSE 等級 1、2、U）的科目（計 0 分）。其他學校如有相同需求，可手動勾選此選項或在 JSON 中設定 `"excludeLv2": true`。

#### 額外加分科目（`bonusSubject`）

計完 Best N 後，額外加上第 N+1 科的加成分數：

```json
"bonusSubject": { "multiplier": 0.2 }
```

若不指定 `subject`，系統自動選取 Best N 以外最高分的科目乘以 `multiplier` 加上。

若要指定特定科目：

```json
"bonusSubject": { "subject": "m1", "multiplier": 0.2 }
```

---

## 四、常見課程公式範例

### 4.1 標準 Best 5（大多數課程）

```json
{
  "method": "best5",
  "required": ["chinese", "english"],
  "excluded": [],
  "weighted": [],
  "coreSubjects": []
}
```

### 4.2 Best 5 + 數學 ×2（理科課程）

```json
{
  "method": "best5",
  "required": ["chinese", "english"],
  "excluded": [],
  "weighted": [{"subject": "math", "multiplier": 2}],
  "coreSubjects": []
}
```

### 4.3 Best 6 + 數學 ×2 + 物理/化學 ×1.5（HKU 理科）

```json
{
  "method": "best6",
  "required": ["chinese", "english"],
  "excluded": [],
  "weighted": [
    {"subject": "math", "multiplier": 2},
    {"subject": "physics", "multiplier": 1.5},
    {"subject": "chemistry", "multiplier": 1.5}
  ],
  "coreSubjects": []
}
```

### 4.4 JS4501 HKU 理學士（Best 6 + M1/M2 特殊條件）

```json
{
  "method": "best6",
  "js4501Special": true,
  "required": ["chinese", "english"],
  "excluded": [],
  "weighted": [{"subject": "math", "multiplier": 2}],
  "coreSubjects": []
}
```

### 4.5 3C+2X（部分大學商學院）

```json
{
  "method": "3c2x",
  "required": [],
  "excluded": [],
  "weighted": [{"subject": "math", "multiplier": 1.5}],
  "coreSubjects": ["chinese", "english", "math"]
}
```

### 4.6 Best 5 + 額外加分（第 6 科 ×0.2）

```json
{
  "method": "best5",
  "required": ["chinese", "english"],
  "excluded": [],
  "weighted": [],
  "coreSubjects": [],
  "bonusSubject": {"multiplier": 0.2}
}
```

---

## 五、特定科目最低要求（Specific Subject Requirements）

此功能在後台以視覺化 UI 設定，不需要在 JSON 中輸入。

**設定方式：**
1. 點擊「新增一組」
2. 選擇科目（同一組內為 OR 關係，即任一科達標即可）
3. 設定最低等級
4. 多組之間為 AND 關係（即所有組都必須達標）

**範例：**「英文 ≥ 4」且「物理/化學/生物 中任一 ≥ 3」

- 第 1 組：英文，最低 4 級
- 第 2 組：物理 + 化學 + 生物，最低 3 級

---

## 六、Expected Score（新計分方式）

若課程的計分方式已改變（例如今年起採用新公式），可勾選「計分方式已改變」並輸入 Expected Score。

前端會將中位數和 Q1 兩格合併，改為顯示「預期分數」，百分比偏差也以 Expected Score 作為基準計算。

---

## 七、常見問題

**Q：為什麼我的分數不顯示？**
A：可能是 DSE 成績不符合最低入學要求，或課程未設定計分公式。

**Q：3C+2X 的核心科目可以改嗎？**
A：可以。在 `coreSubjects` 中設定核心科目，例如 `["chinese","english","math"]`。系統會取這 3 科加上最佳 2 科選修。

**Q：如果某科目同時在 `required` 和 `weighted` 中，會怎樣？**
A：`required` 表示必須計入，`weighted` 表示加成倍數。兩者可以同時設定，例如英文必須計入且 ×1.5。

**Q：HKU/UST/PolyU 的 Lv2 排除是自動的嗎？**
A：是的，系統自動偵測課程所屬院校。若院校為香港大學、香港科技大學或香港理工大學，DSE 等級 1、2、U 的科目自動計 0 分，無需手動設定。

---

*最後更新：2026 年 4 月*
