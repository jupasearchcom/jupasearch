import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import {
  addFavorite,
  bulkInsertCourses,
  createCourse,
  deleteCourse,
  getCourseById,
  getCourses,
  getDistinctValues,
  getFavoriteIds,
  getJupasChoices,
  getSavedReports,
  getUserFavorites,
  removeFavorite,
  saveJupasChoices,
  saveReport,
  updateCourse,
} from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

// ─── Admin guard ──────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

// ─── Course input schema ──────────────────────────────────────────────────────
const courseInputSchema = z.object({
  jupasCode: z.string().optional(),
  nameZhTw: z.string().min(1),
  nameZhCn: z.string().optional(),
  nameEn: z.string().optional(),
  degreeType: z.string().optional(),
  institution: z.string().min(1),
  institutionCode: z.string().optional(),
  duration: z.number().int().optional(),
  qualification: z.enum(["bachelor", "higher_diploma", "associate_degree"]).optional(),
  scoringMethod: z.string().optional(),
  requiredSubjects: z.array(z.string()).optional(),
  weightedSubjects: z.array(z.object({ subject: z.string(), multiplier: z.number() })).optional(),
  minRequirement: z.string().optional(),
  interviewArrangement: z.string().optional(),
  quota: z.number().int().optional(),
  lastYearMedian: z.number().optional(),
  lastYearQ1: z.number().optional(),
  lastYearAdmitted: z.number().int().optional(),
  lastYearGroupAAdmitted: z.number().int().optional(),
  lastYearGroupAApplicants: z.number().int().optional(),
  lastYearTotalApplicants: z.number().int().optional(),
  groupAOnly: z.boolean().optional(),
  scoreGap: z.enum(["above_median", "above_q1", "below_q1", "between_median_q1"]).optional(),
  fundingType: z.enum(["ugc", "nmtss", "sssdp", "self_financed"]).optional(),
  tuitionFee: z.number().int().optional(),
  scoringMethodChanged: z.boolean().optional(),
  isNew: z.boolean().optional(),
  moduleType: z.enum(["jupas", "eapp", "mainland"]).optional(),
  descriptionZhTw: z.string().optional(),
  descriptionZhCn: z.string().optional(),
  descriptionEn: z.string().optional(),
  careerProspectsZhTw: z.string().optional(),
  careerProspectsZhCn: z.string().optional(),
  careerProspectsEn: z.string().optional(),
  websiteUrl: z.string().url().optional().or(z.literal("")),
});

// ─── Filters schema ───────────────────────────────────────────────────────────
const filtersSchema = z.object({
  search: z.string().optional(),
  degreeTypes: z.array(z.string()).optional(),
  institutions: z.array(z.string()).optional(),
  durations: z.array(z.number()).optional(),
  qualifications: z.array(z.string()).optional(),
  scoringMethods: z.array(z.string()).optional(),
  interviewArrangements: z.array(z.string()).optional(),
  scoreGaps: z.array(z.string()).optional(),
  fundingTypes: z.array(z.string()).optional(),
  minRequirements: z.array(z.string()).optional(),
  groupAOnly: z.boolean().optional(),
  tuitionMin: z.number().optional(),
  tuitionMax: z.number().optional(),
  moduleType: z.string().optional(),
  sortBy: z.string().optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Courses ───────────────────────────────────────────────────────────────
  courses: router({
    list: publicProcedure.input(filtersSchema).query(async ({ input }) => {
      return getCourses(input);
    }),

    detail: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const course = await getCourseById(input.id);
      if (!course) throw new TRPCError({ code: "NOT_FOUND" });
      return course;
    }),

    filterOptions: publicProcedure.query(async () => {
      return getDistinctValues();
    }),

    // Admin CRUD
    create: adminProcedure.input(courseInputSchema).mutation(async ({ input }) => {
      await createCourse(input as any);
      return { success: true };
    }),

    update: adminProcedure
      .input(z.object({ id: z.number(), data: courseInputSchema.partial() }))
      .mutation(async ({ input }) => {
        await updateCourse(input.id, input.data as any);
        return { success: true };
      }),

    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteCourse(input.id);
      return { success: true };
    }),

    bulkImport: adminProcedure
      .input(z.array(courseInputSchema))
      .mutation(async ({ input }) => {
        await bulkInsertCourses(input as any[]);
        return { success: true, count: input.length };
      }),
  }),

  // ─── Favorites ─────────────────────────────────────────────────────────────
  favorites: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserFavorites(ctx.user.id);
    }),

    ids: protectedProcedure.query(async ({ ctx }) => {
      return getFavoriteIds(ctx.user.id);
    }),

    add: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await addFavorite(ctx.user.id, input.courseId);
        return { success: true };
      }),

    remove: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await removeFavorite(ctx.user.id, input.courseId);
        return { success: true };
      }),
  }),

  // ─── JUPAS Choices ─────────────────────────────────────────────────────────
  choices: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return getJupasChoices(ctx.user.id);
    }),

    save: protectedProcedure
      .input(
        z.object({
          choices: z.array(z.object({ courseId: z.number(), rank: z.number() })).max(20),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await saveJupasChoices(ctx.user.id, input.choices);
        return { success: true };
      }),
  }),

  // ─── Reports ───────────────────────────────────────────────────────────────
  reports: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getSavedReports(ctx.user.id);
    }),

    save: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          courseIds: z.array(z.number()),
          reportData: z.string(), // base64 PDF
        })
      )
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.reportData, "base64");
        const key = `reports/${ctx.user.id}/${nanoid()}.pdf`;
        const { url } = await storagePut(key, buffer, "application/pdf");
        await saveReport(ctx.user.id, input.title, input.courseIds, url);
        return { success: true, url };
      }),
  }),

  // ─── AI Recommendation ─────────────────────────────────────────────────────
  ai: router({
    recommend: protectedProcedure
      .input(
        z.object({
          dseScores: z.object({
            chinese: z.number().min(1).max(5),
            english: z.number().min(1).max(5),
            math: z.number().min(1).max(5),
            ls: z.number().min(1).max(5),
            elective1: z.number().min(1).max(5).optional(),
            elective2: z.number().min(1).max(5).optional(),
            elective3: z.number().min(1).max(5).optional(),
            elective1Name: z.string().optional(),
            elective2Name: z.string().optional(),
            elective3Name: z.string().optional(),
          }),
          interests: z.array(z.string()),
          targetInstitutions: z.array(z.string()),
          language: z.enum(["zh-TW", "zh-CN", "en"]).default("zh-TW"),
        })
      )
      .mutation(async ({ input }) => {
        const { dseScores, interests, targetInstitutions, language } = input;

        const scoreStr = `中文: ${dseScores.chinese}, 英文: ${dseScores.english}, 數學: ${dseScores.math}, 通識: ${dseScores.ls}` +
          (dseScores.elective1Name ? `, ${dseScores.elective1Name}: ${dseScores.elective1}` : "") +
          (dseScores.elective2Name ? `, ${dseScores.elective2Name}: ${dseScores.elective2}` : "") +
          (dseScores.elective3Name ? `, ${dseScores.elective3Name}: ${dseScores.elective3}` : "");

        const langInstruction = language === "zh-TW" ? "請用繁體中文回答" :
          language === "zh-CN" ? "请用简体中文回答" : "Please answer in English";

        const prompt = `${langInstruction}。

你是一位香港升學顧問，專門幫助學生選擇 JUPAS 課程。

學生 DSE 成績：${scoreStr}
興趣領域：${interests.join(", ")}
目標院校：${targetInstitutions.length > 0 ? targetInstitutions.join(", ") : "不限"}

請根據以上資料：
1. 分析學生的優勢科目和成績水平
2. 推薦 5-8 個最適合的 JUPAS 課程（包括課程名稱、院校、原因）
3. 分成「穩入」（成績明顯高於要求）、「目標」（成績接近要求）、「衝刺」（成績略低於要求）三類
4. 提供選科策略建議
5. 提醒需要注意的事項

請以結構化方式呈現，清晰易讀。`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "你是一位專業的香港升學顧問，熟悉 JUPAS 制度和各大學課程要求。" },
            { role: "user", content: prompt },
          ],
        });

        const content = response.choices[0]?.message?.content ?? "";
        return { recommendation: content };
      }),

    compareAnalysis: protectedProcedure
      .input(
        z.object({
          courseIds: z.array(z.number()).min(2).max(6),
          language: z.enum(["zh-TW", "zh-CN", "en"]).default("zh-TW"),
        })
      )
      .mutation(async ({ input }) => {
        const { courseIds, language } = input;

        // Fetch course details
        const courseDetails = await Promise.all(courseIds.map((id) => getCourseById(id)));
        const validCourses = courseDetails.filter(Boolean);

        const langInstruction = language === "zh-TW" ? "請用繁體中文回答" :
          language === "zh-CN" ? "请用简体中文回答" : "Please answer in English";

        const courseSummaries = validCourses.map((c) =>
          `- ${c!.nameZhTw} (${c!.institution}): 學費 ${c!.tuitionFee ?? "未知"} 元/年, 收生 ${c!.quota ?? "未知"} 人, 去年中位數 ${c!.lastYearMedian ?? "未知"}`
        ).join("\n");

        const prompt = `${langInstruction}。

請比較以下 JUPAS 課程，提供深入分析：

${courseSummaries}

請分析：
1. 各課程的入學競爭程度
2. 學費比較
3. 就業前景分析
4. 課程特色比較
5. 選擇建議

請以結構化方式呈現。`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "你是一位專業的香港升學顧問。" },
            { role: "user", content: prompt },
          ],
        });

        const content = response.choices[0]?.message?.content ?? "";
        return { analysis: content };
      }),
  }),
});

export type AppRouter = typeof appRouter;
