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
