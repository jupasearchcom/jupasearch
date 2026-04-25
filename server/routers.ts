import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  addFavorite,
  bulkInsertCourses,
  createCourse,
  deleteCourse,
  getCourseById,
  getCourses,
  getCoursesByIds,
  getDistinctValues,
  getFavoriteIds,
  getJupasChoices,
  getSavedReports,
  getUserFavorites,
  removeFavorite,
  saveJupasChoices,
  saveReport,
  updateCourse,
  saveDseScores,
  getDseScores,
  getSystemSetting,
  setSystemSetting,
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
  expectedScore: z.number().optional(),
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
  jupasUrl: z.string().url().optional().or(z.literal("")),
  jupasOfficialUrl: z.string().url().optional().or(z.literal("")),
  flexibleAdmission: z.boolean().optional(),
  acceptMultipleSittings: z.enum(["yes_no_penalty", "yes_with_penalty", "no"]).optional(),
  acceptAppliedLearning: z.boolean().optional(),
  acceptOtherLanguage: z.boolean().optional(),
  scoreFormula: z.object({
    method: z.string(),
    required: z.array(z.string()),
    excluded: z.array(z.string()),
    weighted: z.array(z.object({ subject: z.string(), multiplier: z.number() })),
    coreSubjects: z.array(z.string()),
    minSubjectRequirements: z.array(z.object({ subject: z.string(), minGrade: z.string() })).optional(),
    electiveMinReq: z.enum(["33", "22"]).nullable().optional(),
    excludeM1M2FromElectiveMin: z.boolean().optional(),
  }).optional(),
  scoringScale: z.enum(["8.5", "7"]).optional(),
  specificSubjectRequirements: z.object({
    groups: z.array(z.object({
      subjects: z.array(z.string()),
      minGrade: z.number().int().min(1).max(5),
    })).max(4),
  }).optional(),
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
  groupAOnly: z.boolean().optional(),
  tuitionMin: z.number().optional(),
  tuitionMax: z.number().optional(),
  moduleType: z.string().optional(),
  flexibleAdmission: z.boolean().optional(),
  acceptMultipleSittings: z.array(z.string()).optional(),
  acceptAppliedLearning: z.boolean().optional(),
  acceptOtherLanguage: z.boolean().optional(),
  meetsMinRequirement: z.boolean().optional(), // filter by user's DSE score
  sortBy: z.string().optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
});

// ─── DSE Score schema ─────────────────────────────────────────────────────────
const dseScoreSchema = z.object({
  chinese: z.number().min(1).max(5).optional(),
  english: z.number().min(1).max(5).optional(),
  math: z.number().min(1).max(5).optional(),
  cs: z.string().optional(), // 公民與社會發展科: "attained" (always)
  m1: z.number().min(1).max(5).optional(),
  m2: z.number().min(1).max(5).optional(),
  electives: z.array(z.object({
    subject: z.string(),
    score: z.number().min(1).max(5),
  })).optional(),
  appliedLearning: z.object({
    subject: z.string(),
    grade: z.enum(["distinction_ii", "distinction_i", "attained", "not_attained"]),
  }).optional(),
  otherLanguage: z.object({
    language: z.string(),
    grade: z.string(),
  }).optional(),
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
    getByIds: publicProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .query(async ({ input }) => {
        return getCoursesByIds(input.ids);
      }),

    // Compute "My Score" for a list of courses given DSE scores
    computeMyScores: publicProcedure
      .input(z.object({
        courseIds: z.array(z.number()),
        dseScores: dseScoreSchema,
      }))
      .mutation(async ({ input }) => {
        const { courseIds, dseScores } = input;
        const results: Record<number, number | null> = {};

        for (const id of courseIds) {
          const course = await getCourseById(id);
          if (!course) { results[id] = null; continue; }

          const formula = course.scoreFormula as any;
          if (!formula) { results[id] = null; continue; }

          // Build subject score map
          const scoreMap: Record<string, number> = {};
          if (dseScores.chinese) scoreMap["chinese"] = dseScores.chinese;
          if (dseScores.english) scoreMap["english"] = dseScores.english;
          if (dseScores.math) scoreMap["math"] = dseScores.math;
          if (dseScores.m1) scoreMap["m1"] = dseScores.m1;
          if (dseScores.m2) scoreMap["m2"] = dseScores.m2;
          for (const e of (dseScores.electives ?? [])) {
            scoreMap[e.subject] = e.score;
          }
          // Applied learning grade to score
          if (dseScores.appliedLearning) {
            const alGrades: Record<string, number> = {
              distinction_ii: 4, distinction_i: 3, attained: 2, not_attained: 0,
            };
            scoreMap[dseScores.appliedLearning.subject] = alGrades[dseScores.appliedLearning.grade] ?? 0;
          }
          // Other language grade to score (simplified)
          if (dseScores.otherLanguage) {
            const olGrades: Record<string, number> = {
              C2: 5, C1: 4, B2: 3, B1: 2, A2: 1,
              N1: 5, N2: 4, N3: 3,
              "第6級": 5, "第5級": 4, "第4級": 3, "第3級": 2,
              "A++": 5, "A+": 5, "A": 4, "B++": 4, "B+": 3, "B": 3, "C": 2, "D": 1, "E": 1,
            };
            scoreMap[dseScores.otherLanguage.language] = olGrades[dseScores.otherLanguage.grade] ?? 0;
          }

          // Apply weightings
          const weightedMap: Record<string, number> = { ...scoreMap };
          for (const w of (formula.weighted ?? [])) {
            if (weightedMap[w.subject] !== undefined) {
              weightedMap[w.subject] = weightedMap[w.subject] * w.multiplier;
            }
          }

          // Filter out excluded subjects
          const excluded = new Set(formula.excluded ?? []);
          const available = Object.entries(weightedMap)
            .filter(([k]) => !excluded.has(k))
            .map(([k, v]) => ({ subject: k, score: v }));

          // Required subjects must be included
          const required = new Set(formula.required ?? []);
          const requiredBestOfGroupsSvr: string[][] = formula.requiredBestOf ?? [];
          const requiredBestOfSubjectsSvr = new Set(requiredBestOfGroupsSvr.flat());
          const requiredBestOfEntriesSvr: Array<{ subject: string; score: number }> = [];
          for (const group of requiredBestOfGroupsSvr) {
            const groupEntries = available.filter(e => group.includes(e.subject));
            if (groupEntries.length > 0) {
              groupEntries.sort((a: any, b: any) => b.score - a.score);
              requiredBestOfEntriesSvr.push(groupEntries[0]);
            }
          }
          const requiredEntries = available.filter(e => required.has(e.subject));
          const allRequiredEntriesSvr = [...requiredEntries, ...requiredBestOfEntriesSvr];
          const optionalEntries = available.filter(e => !required.has(e.subject) && !requiredBestOfSubjectsSvr.has(e.subject));

          // Sort optional by score desc
          optionalEntries.sort((a, b) => b.score - a.score);

          let total = 0;
          const method = formula.method ?? "best5";

          if (method === "best5" || method === "best4" || method === "best6" || method === "best7") {
            const n = method === "best4" ? 4 : method === "best6" ? 6 : method === "best7" ? 7 : 5;
            // Required subjects (incl. requiredBestOf) are ALWAYS included; fill remaining slots with best optional subjects
            const remainingSlots = Math.max(0, n - allRequiredEntriesSvr.length);
            const topOptional = optionalEntries.slice(0, remainingSlots);
            total = [...allRequiredEntriesSvr, ...topOptional].reduce((s, e) => s + e.score, 0);
          } else if (method === "3c2x") {
            // 3C+2X: 3 core subjects + best 2 electives
            const coreSubjects = new Set(formula.coreSubjects ?? ["chinese", "english", "math"]);
            const coreEntries = available.filter(e => coreSubjects.has(e.subject));
            const electiveEntries = available.filter(e => !coreSubjects.has(e.subject));
            electiveEntries.sort((a, b) => b.score - a.score);
            const topElective = electiveEntries.slice(0, 2);
            total = [...coreEntries, ...topElective].reduce((s, e) => s + e.score, 0);
          }

          results[id] = Math.round(total * 100) / 100;
        }

        return results;
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

    exportAll: adminProcedure.query(async () => {
      // Export all courses without pagination
      const result = await getCourses({ pageSize: 9999 });
      return result.courses;
    }),
  }),

  // ─── Favorites (no login required - use publicProcedure with optional auth) ─
  favorites: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserFavorites(ctx.user.id);
    }),

    ids: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return [];
      return getFavoriteIds(ctx.user.id);
    }),

    add: publicProcedure
      .input(z.object({ courseId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        await addFavorite(ctx.user.id, input.courseId);
        return { success: true };
      }),

    remove: publicProcedure
      .input(z.object({ courseId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        await removeFavorite(ctx.user.id, input.courseId);
        return { success: true };
      }),
  }),

  // ─── JUPAS Choices ─────────────────────────────────────────────────────────
  choices: router({
    get: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return { choices: [] };
      return getJupasChoices(ctx.user.id);
    }),

    save: publicProcedure
      .input(
        z.object({
          choices: z.array(z.object({ courseId: z.number(), rank: z.number() })).max(20),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        await saveJupasChoices(ctx.user.id, input.choices);
        return { success: true };
      }),
  }),

  // ─── DSE Scores ────────────────────────────────────────────────────────────
  dse: router({
    saveScores: protectedProcedure
      .input(z.object({
        chinese: z.string().optional(),
        english: z.string().optional(),
        math: z.string().optional(),
        mathExtended: z.string().optional(),
        civics: z.string().optional(),
        elective1Subject: z.string().optional(),
        elective1Grade: z.string().optional(),
        elective2Subject: z.string().optional(),
        elective2Grade: z.string().optional(),
        elective3Subject: z.string().optional(),
        elective3Grade: z.string().optional(),
        elective4Subject: z.string().optional(),
        elective4Grade: z.string().optional(),
        appliedLearningSubject: z.string().optional(),
        appliedLearningGrade: z.string().optional(),
        otherLanguage: z.string().optional(),
        otherLanguageGrade: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await saveDseScores(ctx.user.id, input);
        return { success: true };
      }),

    getScores: protectedProcedure.query(async ({ ctx }) => {
      return getDseScores(ctx.user.id);
    }),
  }),

  // ─── System Settings ──────────────────────────────────────────────────────
  settings: router({
    // Get applied learning subjects list (public) - returns array of {nameZhTw, nameZhCn, nameEn}
    getAppliedLearningSubjects: publicProcedure.query(async () => {
      const val = await getSystemSetting("applied_learning_subjects_v2");
      if (Array.isArray(val)) return val as { nameZhTw: string; nameZhCn: string; nameEn: string }[];
      // Fallback: try legacy string array
      const legacy = await getSystemSetting("applied_learning_subjects");
      if (Array.isArray(legacy)) {
        return (legacy as string[]).map((s) => ({ nameZhTw: s, nameZhCn: s, nameEn: s }));
      }
      return [] as { nameZhTw: string; nameZhCn: string; nameEn: string }[];
    }),

    // Set applied learning subjects list (admin only)
    setAppliedLearningSubjects: adminProcedure
      .input(z.object({
        subjects: z.array(z.object({
          nameZhTw: z.string(),
          nameZhCn: z.string().optional().default(""),
          nameEn: z.string().optional().default(""),
        }))
      }))
      .mutation(async ({ input }) => {
        await setSystemSetting("applied_learning_subjects_v2", input.subjects);
        return { success: true };
      }),
  }),

  // ─── Reports ────────────────────────────────────────────────────────────────────────────────
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
});

export type AppRouter = typeof appRouter;
