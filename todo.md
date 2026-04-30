# JupaSearch TODO

## Phase 1: Database Schema & Migration
- [x] Design and create courses table with all required fields
- [x] Create user_favorites table
- [x] Create jupas_choices table (20 choices simulation)
- [x] Run migration SQL

## Phase 2: Backend API
- [x] Course list query with filters (name, degree type, institution, duration, qualification, scoring, interview, score gap, funding, min req, group A)
- [x] Course detail query
- [x] Course CRUD for admin (create, update, delete)
- [x] Bulk import courses (CSV/JSON)
- [x] Tuition fee range filter (slider 0-100000)
- [x] Multi-dimension sorting (quota, tuition, probability, group A applicants, total applicants)
- [x] User favorites (add/remove/list)
- [x] JUPAS choices simulation (save/update 20 choices)
- [x] AI course recommendation endpoint
- [x] PDF comparison report generation

## Phase 3: Frontend Framework
- [x] Multi-language system (zh-TW, zh-CN, en) with i18n context
- [x] Language switcher component
- [x] Dark/light theme toggle
- [x] Top navigation bar with logo, language, theme, auth
- [x] Home/landing page with hero section
- [x] Footer with links

## Phase 4: Course List Page
- [x] Course list with all key fields displayed
- [x] Name search input
- [x] Degree type filter (BA, BSc, BEng, BEd, BLaw, etc.)
- [x] Institution filter (16 universities)
- [x] Duration filter (2, 4, 5, 6 years)
- [x] Qualification filter (Bachelor/Higher Diploma)
- [x] Scoring method filter (Best 5, Best 6, Best 4, 2C+3X)
- [x] Interview arrangement filter
- [x] Score gap filter (above median, above Q1, below Q1, between median and Q1)
- [x] Funding type filter (UGC/NMTSS/SSSDP)
- [x] Min requirement filter
- [x] Group A only filter
- [x] Tuition fee range slider (0-100000, step 1000)
- [x] Sort options (quota, tuition, probability, group A applicants, total applicants)
- [x] Pagination

## Phase 5: Course Detail & Other Pages
- [x] Course detail page with full information
- [x] Favorites page (saved courses list)
- [x] JUPAS 20-choice simulation page (drag-and-drop ordering)

## Phase 6: Admin Panel
- [x] Admin dashboard overview
- [x] Course management table (list, search, filter)
- [x] Add new course form (all fields)
- [x] Edit existing course form
- [x] Delete course with confirmation
- [x] Bulk import via JSON upload
- [x] Real-time update (changes reflect immediately on frontend)

## Phase 7: AI & PDF Features
- [x] AI recommendation page (input DSE scores, interests, target institutions)
- [x] LLM analysis and course recommendations
- [x] Course comparison selector (multi-select)
- [x] PDF comparison report generation (admission data, tuition, career prospects)
- [x] Save PDF reports to user account

## Phase 7b: Legal Pages
- [x] 建立免責聲明頁面（三語）
- [x] 建立使用條款頁面（三語）
- [x] 建立隱私政策頁面（三語）
- [x] Footer 加入法律頁面連結
- [x] 首次訪問彈出免責聲明提示橫幅

## Phase 8: Polish & Delivery
- [x] Responsive design (mobile/tablet/desktop)
- [x] Loading states and error handling
- [x] Empty states
- [x] Vitest unit tests (4 tests passing)
- [x] Final checkpoint and delivery
- [x] 面試安排篩選 UI（Courses.tsx）
- [x] 最低要求篩選 UI（Courses.tsx）
- [x] 志願頁面 HTML5 原生拖拉功能
- [x] interview.* 三語翻譯鍵

## 2026-03 Update Batch (30 items - ALL COMPLETED)
- [x] #1 首頁「16合作院校」→「16收錄院校」，「用戶使用」移除∞
- [x] #2 移除收藏/模擬志願的登入要求
- [x] #3 移動端頂部加入「JupaSearch 香港升學資訊平台」文字
- [x] #4 院校名稱在篩選/課程列表支援三語切換
- [x] #5 收生統計欄位名稱加入「去年」前綴
- [x] #6 官方網站分兩格：院校官方網站 + JUPAS官方網站
- [x] #7 課程分頁「基本資料」移除「分差」項
- [x] #8 篩選學位類型加入中英文名稱
- [x] #9 移除篩選的「最低要求」
- [x] #10 學費改為自由輸入上/下限
- [x] #11 移動端切換頁面後滾動至頂部
- [x] #12 AI推薦→「文憑試分數」獨立頁面，Cookie儲存
- [x] #13 篩選加入「是否接受多於一次文憑試成績」
- [x] #14 篩選「資助類型」移除「自資」
- [x] #15 篩選加入「彈性收生」
- [x] #16 課程列表加入「我的分數」欄，顏色highlight，排序
- [x] #17 課程後台設定科目要求/倍率公式
- [x] #18 篩選加入「僅列出符合最低要求的課程」
- [x] #19 篩選「組別A錄取」→「僅錄取組別A申請者」
- [x] #20 模擬志願顏色按指定RGB設定
- [x] #21 Bug：無法把課程加入志願和收藏
- [x] #22 移除AI功能、課程比較AI、AI推薦頁面
- [x] #23 Bug：法律頁面最後更新日期→2026年3月
- [x] #24 Footer加入聯絡我們 jupasearch.hk@gmail.com
- [x] #25 Footer加入版權/侵權聯絡說明
- [x] #26 移除首頁「第三方資訊平台·jupasearch.com」模塊
- [x] #27 課程列表展示更多數據
- [x] #28 DSE成績：公民與社會發展科、應用學習、其他語言科目
- [x] #29 篩選「面試安排」更新為5個選項
- [x] #30 更新語言翻譯和服務條款
- [x] SEO: 修復標題長度、加入meta description

## Bug Fix Batch (2026-03-30)
- [x] Bug 1: 文憑試成績頁面無法開啟（資料庫表格重建 + 伺服器重啟）
- [x] Bug 2: 學費輸入框輸入數字後跳回頂部（加入 debounce 600ms）
- [x] Bug 3: 課程無法加入志願（改為 pending 候選區機制）
- [x] Feature: 志願頁改為「候選課程區 → 點添加 → 志願表」流程
- [x] Feature: 收藏頁加入「添加到志願」按鈕

## Bug Fix & Feature Batch 2 (2026-03-30)
- [x] Bug 1: 文憑試成績頁仍無法開啟（修復 DSE getScores query enabled 條件，防止 protectedProcedure 未登入時觸發全局重定向）
- [x] Bug 2: 學費輸入仍跳回頂部（debounce 已正確設定 600ms）
- [x] Bug 3: 志願候選區 UI 不顯示（已修復 getByIds 路由）
- [x] Feature: 課程官方網站分兩格（院校官網 + JUPAS官網）
- [x] Feature: 篩選加入「重考政策」（3選項）
- [x] Feature: 篩選「資助類型」移除「自資」選項
- [x] Feature: 篩選加入「彈性收生」（單選「是」）
- [x] Feature: 課程列表加入「我的分數」欄（按公式計算，紅/黃/綠顏色highlight）
- [x] Feature: 後台可設定每個課程的計分公式（必修科、倍率、計分方式）
- [x] Feature: 篩選「組別A錄取」改為「僅錄取組別A申請者」（單選「是」）
- [x] Feature: 面試安排改為 5 個固定選項（後台下拉選擇）
  - [x] Feature: 篩選「僅列出符合最低入學要求的課程」（已在 Batch 3 實作）
  - [x] Feature: 排序「最可能/最不可能取錄」按 (我的分數-中位數)÷中位數 計算（已在 Batch 10 實作）

## QA 發現的待改進事項 (2026-03-30)
- [x] 統一 jupasUrl vs jupasOfficialUrl 欄位名稱（mathExtended 已拆分為 m1/m2，其他已在後續 batch 處理）
- [x] My Score 計算器：修復 mathExtended 處理邏輯（已在 Batch 8 拆分為 m1/m2）
- [x] My Score Admin：改為結構化表單（已在 Batch 5/10 增加結構化表單）
- [x] 加入「按我的分數排序」選項（已在 Batch 10 實作）
- [x] 驗證 DSE 成績頁面 bug 修復（已在多個 batch 修復）

## Bug Fix & Feature Batch 3 (2026-03-30)
- [x] Bug 1: 未登入時無法把課程加至收藏（在 addFav/removeFav mutation 加入 onError 擄截 UNAUTHORIZED 錯誤）
- [x] Bug 2: 志願顏色背景未按指定 RGB 設定（按用戶指定的 20 個志願位置 RGB 顏色已設定）
- [x] Bug 3: 學費輸入仍跳回頂部（改為 type=text + inputMode=numeric 避免 IME 問題）
- [x] Bug 4: 面試安排 5 個選項顯示為翻譯 key（已在 LanguageContext.tsx 加入正確翻譯）
- [x] Bug 5: 篩選「組別A錄取」標籤改為「僅限組別A錄取」，選項改為「是」
- [x] Bug 6: DSE 成績「選修科目」上限加至 4 個
- [x] Bug 7: DSE 成績「選修科目」更新為 26 個指定科目列表
- [x] Bug 8: DSE 成績「應用學習科目」改為後台設定（Admin 頁面新增應用學習科目管理對話框）
- [x] Bug 9: DSE 成績「其他語言科目」列表無法選擇（修復 value="none" 處理）
- [x] Feature 10: 篩選「僅列出符合最低要求的課程」（332A33 等格式 + scoreFormula.minSubjectRequirements）

## Bug Fix & Feature Batch 4 (2026-03-30)
- [x] Bug 1: 學費輸入仍一次只能輸入一個數字（移除 debounce effect 中的 setPage(1)，避免每次輸入後重置頁面）
- [x] Bug 2: 其他語言科目列表仍無法選擇（改用語言代碼存儲，解決語言切換時 value 不匹配問題）
- [x] Bug 3: 志願表刪除課程後應返回「待加入課程」列表（removeChoice 後自動把課程加回 pendingIds）
- [x] Bug 4: 應用學習科目後台設定加入繁中/簡中/英文名稱欄位（AppliedLearningDialog 改為三欄輸入）
- [x] Bug 5: 移除「文憑試成績」頁面上方的「Best 5」「Best 6」模塊
- [x] Bug 6: 不符合最低收生要求的課程右上角顯示紅色警告提示（僅在已輸入 DSE 成績時顯示）
- [x] Bug 7: 課程基本資料的「面試安排」顯示翻譯 key（在 LanguageContext 加入舊鍵名向後兼容映射）
- [x] Bug 8: 未登入時仍無法把課程加至收藏（main.tsx 排除 favorites.add/remove 的 UNAUTHORIZED 錯誤觸發全局重定向）

## Bug Fix & Feature Batch 5 (2026-04-02)
- [x] Bug 1: Footer「文憑試成績」移至「升學工具」分類下
- [x] Bug 2: 面試安排篩選不匹配（在 db.ts 加入新舊鍵名映射：yes_all→all_applicants, yes_selective→selective_basis, no→no_interview）
- [x] Bug 3: 未登入收藏（加入 authLoading 判斷，auth 狀態穩定後才決定走 API 或本地路徑）
- [x] Feature 4: 應用學習/其他語言科目僅 admin 帳戶登入後可見
- [x] Feature 5: 課程後台新增「計分比例尺」選項（8.5 scale / 7 scale），計算「我的分數」時按比例尺轉換
- [x] Feature 6: 課程後台新增「特定科目最低要求」視覺化設定（最多4組，每組最多5科，設定最低等級）
- [x] Feature 7: 比較列表移除中位數和下四分位數欄位
- [x] Feature 8: 待加入課程列表無論是否空白都常駐顯示

## Bug Fix & Feature Batch 6 (2026-04-03)
- [x] Bug 1: Footer "文憑試成績" 仍在「課程平台」下（應在「升學工具」下）
- [x] Bug 2: Footer 版權年份應為 2026 而非 2025
- [x] Bug 3: 未登入時仍然不能把課程加至收藏
- [x] Bug 4: DSE 頁面「應用學習科目」和「其他語言科目」未登入或普通用戶仍可見
- [x] Feature 5: 課程卡片九格資訊重新排版（第一行：收生人數/中位數/Q1；第二行：總申請/組別A申請/取錄；第三行：最低要求/學費/年期）

## Bug Fix Batch 7 (2026-04-04)
- [x] Bug: 未登入時仍然不能把課程加至收藏（徹底修復）

## Feature Batch 8 (2026-04-05)
- [x] 1. 移除 E-app/內地升學等相關模塊（moduleType 篩選、相關 UI）
- [x] 2. 移除篩選中的「學費」篩選選項
- [x] 3. 篩選中可勾選的格子和字向右移一點（checkbox 增加左 padding）
- [x] 4. 排序那格未選時顯示「預設排序」文字
- [x] 5. 數學延伸部份拆分為「M1」和「M2」（DSE 頁面、課程篩選、計分公式）
- [x] 6. 暫時移除「收藏課程」模塊（移除導航入口，但 /favorites URL 仍可前往）
- [x] 7. 移除登入模塊（移除登入按鈕/入口，但 /admin 仍可登入），私隱政策移除 Manus OAuth 字眼
- [x] 8. 「年期」字眼改為「修讀年期」
- [x] 9. 課程卡片 9 項資料改為只顯示第一行，按按鈕才展開另外兩行

## Feature Batch 9 (2026-04-08)
- [x] 1. 課程列表移除♥收藏心形按鈕（未登入及普通用戶不顯示，admin 登入後仍顯示）
- [x] 2. 模擬志願頁移除「志願已儲存於本機。登入以跨裝置同步。登入」提示模塊
- [x] 3. 模擬志願頁移除「拖拉調整順序」提示文字
- [x] 4. /admin 頁面未登入時，點擊中間感嘆號 5 次才顯示登入按鈕

## Feature Batch 10 (2026-04-09)
- [x] 1. DSE 科目等級選項下限：中文/英文最低3，數學/M1/M2/選修最低2
- [x] 2. 後台課程設定新增「選修科最低要求」欄位（33/22，可額外勾選「不計M1/M2」）
- [x] 3. 前端計算最低要求時加入選修科最低要求邏輯（33=至少2科逃3，22=至少2科适2），不符合則不顯示「我的分數」
- [x] 4. 後台「計分方式」新增 Best7 選項
- [x] 5. 「我的分數」後顯示百分比偏差（(分數-中位數)/中位數×100%），正綠負紅，用於排序/比較/志願

## Feature Batch 11 (2026-04-12)
- [x] 1. 後台課程勾選新計分方式後，前端中位數/Q1 兩格合為一格「Expected Score」（由後台輸入），百分比偏差以 Expected Score 計算
- [x] 2. 文憑試成績頁面：同一選修科不能複選，已選的科目在其他選修格不顯示
- [x] 3. 後台編輯已加入的課程時，表單自動填入已儲存的數据/選項

## Feature Batch 12 - 計分系統重構 (2026-04-16)
- [x] 1. 修復 2C+3X 錯誤（前端/後端/後台/篩選全部改為 3C+2X）
- [x] 2. 重構 computeMyScore：完整計分流程（Scale→HKU/UST/PolyU Lv2排除→Weighting→Best N/3C+2X→特殊必修/排除→JS4501/JS4502特殊條件→額外加分）
- [x] 3. 後台 Admin 表單支援新計分參數（HKU/UST/PolyU Lv2排除開關、JS4501/JS4502特殊M1/M2條件、額外加分科目設定）
- [x] 4. 生成後台輸入指引文件

## Bug Fix Batch 13 (2026-04-18)
- [x] Bug 1: computeMyScore 的 required 科目未強制計入（Best N 排序後 required 科目可能被排除）→ 修復：先保留所有 required，再從剩餘名額填 optional（Courses.tsx / Compare.tsx / routers.ts 三處同步）
- [x] Bug 2: 8.5 scale 未生效 → 根本原因是 scoringScale 欄位未在 Drizzle schema 定義，ORM 靜默忽略儲存，已修復 schema 並更新資料庫欄位類型
- [x] Bug 3: 後台編輯課程時，比例尺和特定科目要求未自動填入表單 → 同 Bug 2，schema 修復後 select() 會正確回傳欄位值

## Feature Batch 14 - 篩選與路由修正 (2026-04-21)
- [x] 1. 修正「輸入DSE成績」按鈕路由：/dse-scores → /dse
- [x] 2. 移除篩選中的「計分方式」FilterSection
- [x] 3. 將篩選「分差」改名為「我的分數」，新增「高於預期分數」/「低於預期分數」選項，實作 client-side 真實篩選（根據 computeMyScore 結果對比 median/expected/Q1）

## Feature Batch 15 (2026-04-23)
- [x] 1. 篩選「我的分數」選項改為三個：高於中位數/平均數/預期分數、介乎中位數/平均數/預期分數及下四分位數、低於下四分位數（client-side 真實篩選）
- [x] 2. 不符合課程最低要求時，點擊「不符合最低要求」彈出 tooltip 列出具體原因
- [x] 3. 百分數 * tooltip 顯示完整公式說明（含實際中位數/預期分數）
- [x] 4. 加入 JupaSearch 專屬 favicon（藍底白字 JS）及 OG meta 標簽
- [x] 5. 後台新增「匯出 JSON」按鈕，一鍵下載所有課程資料
- [x] 6. 志願模擬課程卡片顯示「我的分數」及彩色百分比（正綠負紅）和學額
- [x] 7. 後台學位類型新增開關，開啟後可選最多三個學位類型（逗號分隔儲存）
- [x] 8. 移除使用條款第三部分「用戶帳戶」（三語同步）
- [x] 9. 志願模擬待加入區常駐顯示，空時顯示「從課程搜尋加入」提示
- [x] 10. 全站 jupasearch.hk@gmail.com 改為 jupasearch.com@gmail.com（包括超連結）
## Bug Fix Batch 16 (2026-04-25)
- [x] 1. 手機/iPad 無遊標，tooltip 改為點擊觸發（建立 TapTooltip 組件，覆蓋「不符合最低要求」 badge、行內提示、百分數 * 三處）
- [x] 2. 志願模擬百分數改為與去年中位數比較；不符合最低要求顯示「--」
- [x] 3. 待加入區有時不顯示：加入 1 秒輪詢 + storage event 監聽，確保跨頁面寫入後即時更新
- [x] 4. 手機版志願模擬百分數和學額換行顯示（sm:hidden 新增一行）

## Feature Batch 17 (2026-04-25)
- [x] 1. 「去年只取錄組別A」標簽只應在課程詳情頁顯示，移除課程列表卡片頂部的顯示
- [x] 2. 計分公式 JSON 新增 requiredBestOf 欄位（幾科中取最好1科計入），Courses.tsx / Compare.tsx / routers.ts 三處同步更新
- [x] 3. 志願模擬課程卡片顯示與去年中位數比較的百分數；未輸入成績顯示「請輸入成績」，不符合要求顯示--
- [x] 4. 手機版志願模擬課程卡片格式重構：第一行 JUPAS code + 學位類型 + 院校，第二行課程名稱，第三行（手機）學額 + 百分比

## Bug Fix Batch 18 (2026-04-27)
- [x] 1. CourseDetail.tsx 頂部 badge 移除「去年只取錄組別A」標示，只保留基本資料表格中的「是/否」顯示
- [x] 2. Choices.tsx 志願模擬百分數：修復 medianRef 計算邏輯，與 Courses.tsx 完全一致（優先 scoringMethodChanged+expectedScore，其次 lastYearMedian）；桌面版和手機版同步修復

## Bug Fix Batch 19 (2026-04-29)
- [x] Bug 1: Choices.tsx 百分數仍顯示「請輸入成績」 — DSE 改從 cookie 讀取（與 Courses.tsx 一致），computeChoiceMyScore 補全 requiredBestOf/weightedBestOf/excludeLv2/js4501Special/bonusSubject
- [x] Bug 2: Admin 儲存時刪除 requiredBestOf 欄位 — routers.ts scoreFormula Zod schema 補加 requiredBestOf、weightedBestOf、js4501Special、excludeLv2、bonusSubject
- [x] Bug 3: 選修科目代號不完整 — DSEScores.tsx 改用英文代號作為 value（26個），Courses.tsx/Compare.tsx/routers.ts 同步更新科目映射，drizzle/schema.ts 補全 requiredBestOf 類型

## Bug Fix Batch 19 (2026-04-29)
- [x] Bug 1: Choices.tsx 百分數仍顯示「請輸入成績」 — DSE 改從 cookie 讀取（與 Courses.tsx 一致），computeChoiceMyScore 補全 requiredBestOf/weightedBestOf/excludeLv2/js4501Special/bonusSubject
- [x] Bug 2: Admin 儲存時刪除 requiredBestOf 欄位 — routers.ts scoreFormula Zod schema 補加 requiredBestOf、weightedBestOf、js4501Special、excludeLv2、bonusSubject
- [x] Bug 3: 選修科目代號不完整 — DSEScores.tsx 改用英文代號作為 value（26個），Courses.tsx/Compare.tsx/routers.ts 同步更新科目映射，drizzle/schema.ts 補全 requiredBestOf 類型
