import { and, asc, desc, eq, gte, inArray, like, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Course,
  InsertCourse,
  InsertUser,
  courses,
  dseScores,
  jupasChoices,
  savedReports,
  systemSettings,
  userFavorites,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User helpers ─────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Course helpers ───────────────────────────────────────────────────────────
export interface CourseFilters {
  search?: string;
  degreeTypes?: string[];
  institutions?: string[];
  durations?: number[];
  qualifications?: string[];
  scoringMethods?: string[];
  interviewArrangements?: string[];
  scoreGaps?: string[];
  fundingTypes?: string[];
  minRequirements?: string[];
  groupAOnly?: boolean;
  tuitionMin?: number;
  tuitionMax?: number;
  moduleType?: string;
  flexibleAdmission?: boolean;
  acceptMultipleSittings?: string[];
  acceptAppliedLearning?: boolean;
  acceptOtherLanguage?: boolean;
  meetsMinRequirement?: boolean;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export async function getCourses(filters: CourseFilters = {}) {
  const db = await getDb();
  if (!db) return { courses: [], total: 0 };

  const {
    search,
    degreeTypes,
    institutions,
    durations,
    qualifications,
    scoringMethods,
    interviewArrangements,
    scoreGaps,
    fundingTypes,
    minRequirements,
    groupAOnly,
    tuitionMin,
    tuitionMax,
    moduleType = "jupas",
    sortBy = "id",
    sortDir = "asc",
    page = 1,
    pageSize = 20,
  } = filters;

  const conditions = [eq(courses.moduleType, moduleType as "jupas" | "eapp" | "mainland")];

  if (search) {
    conditions.push(
      or(
        like(courses.nameZhTw, `%${search}%`),
        like(courses.nameZhCn, `%${search}%`),
        like(courses.nameEn, `%${search}%`),
        like(courses.jupasCode, `%${search}%`)
      )!
    );
  }
  if (degreeTypes?.length) conditions.push(inArray(courses.degreeType, degreeTypes));
  if (institutions?.length) conditions.push(inArray(courses.institution, institutions));
  if (durations?.length) conditions.push(inArray(courses.duration, durations));
  if (qualifications?.length)
    conditions.push(inArray(courses.qualification, qualifications as ("bachelor" | "higher_diploma" | "associate_degree")[]));
  if (scoringMethods?.length) conditions.push(inArray(courses.scoringMethod, scoringMethods));
  if (interviewArrangements?.length)
    conditions.push(inArray(courses.interviewArrangement, interviewArrangements));
  if (scoreGaps?.length)
    conditions.push(inArray(courses.scoreGap, scoreGaps as ("above_median" | "above_q1" | "below_q1" | "between_median_q1")[]));
  if (fundingTypes?.length)
    conditions.push(inArray(courses.fundingType, fundingTypes as ("ugc" | "nmtss" | "sssdp" | "self_financed")[]));
  if (minRequirements?.length) conditions.push(inArray(courses.minRequirement, minRequirements));
  if (groupAOnly !== undefined) conditions.push(eq(courses.groupAOnly, groupAOnly));
  if (tuitionMin !== undefined) conditions.push(gte(courses.tuitionFee, tuitionMin));
  if (tuitionMax !== undefined) conditions.push(lte(courses.tuitionFee, tuitionMax));
  if (filters.flexibleAdmission !== undefined) conditions.push(eq(courses.flexibleAdmission, filters.flexibleAdmission));
  if (filters.acceptMultipleSittings?.length) conditions.push(inArray(courses.acceptMultipleSittings, filters.acceptMultipleSittings as ("yes_no_penalty" | "yes_with_penalty" | "no")[]));
  if (filters.acceptAppliedLearning !== undefined) conditions.push(eq(courses.acceptAppliedLearning, filters.acceptAppliedLearning));
  if (filters.acceptOtherLanguage !== undefined) conditions.push(eq(courses.acceptOtherLanguage, filters.acceptOtherLanguage));

  const where = and(...conditions);

  // Count total
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(courses)
    .where(where);
  const total = Number(countResult[0]?.count ?? 0);

  // Build order
  let orderExpr;
  const dir = sortDir === "desc" ? desc : asc;
  switch (sortBy) {
    case "quota_desc": orderExpr = desc(courses.quota); break;
    case "quota_asc": orderExpr = asc(courses.quota); break;
    case "tuition_desc": orderExpr = desc(courses.tuitionFee); break;
    case "tuition_asc": orderExpr = asc(courses.tuitionFee); break;
    case "probability_desc": orderExpr = asc(courses.lastYearMedian); break; // lower median = easier
    case "probability_asc": orderExpr = desc(courses.lastYearMedian); break;
    case "groupA_desc": orderExpr = desc(courses.lastYearGroupAApplicants); break;
    case "groupA_asc": orderExpr = asc(courses.lastYearGroupAApplicants); break;
    case "applicants_desc": orderExpr = desc(courses.lastYearTotalApplicants); break;
    case "applicants_asc": orderExpr = asc(courses.lastYearTotalApplicants); break;
    default: orderExpr = dir(courses.id);
  }

  const offset = (page - 1) * pageSize;
  const result = await db
    .select()
    .from(courses)
    .where(where)
    .orderBy(orderExpr)
    .limit(pageSize)
    .offset(offset);

  return { courses: result, total };
}

export async function getCourseById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createCourse(data: InsertCourse) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(courses).values(data);
  return result;
}

export async function updateCourse(id: number, data: Partial<InsertCourse>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(courses).set(data).where(eq(courses.id, id));
}

export async function deleteCourse(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(courses).where(eq(courses.id, id));
}

export async function bulkInsertCourses(data: InsertCourse[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.length === 0) return;
  await db.insert(courses).values(data);
}

export async function getDistinctValues() {
  const db = await getDb();
  if (!db) return { institutions: [], degreeTypes: [], interviewArrangements: [], minRequirements: [] };

  const [instResult, degResult, intResult, minReqResult] = await Promise.all([
    db.selectDistinct({ v: courses.institution }).from(courses).where(sql`institution IS NOT NULL`),
    db.selectDistinct({ v: courses.degreeType }).from(courses).where(sql`degreeType IS NOT NULL`),
    db.selectDistinct({ v: courses.interviewArrangement }).from(courses).where(sql`interviewArrangement IS NOT NULL`),
    db.selectDistinct({ v: courses.minRequirement }).from(courses).where(sql`minRequirement IS NOT NULL`),
  ]);

  return {
    institutions: instResult.map((r) => r.v).filter(Boolean) as string[],
    degreeTypes: degResult.map((r) => r.v).filter(Boolean) as string[],
    interviewArrangements: intResult.map((r) => r.v).filter(Boolean) as string[],
    minRequirements: minReqResult.map((r) => r.v).filter(Boolean) as string[],
  };
}

// ─── Favorites helpers ────────────────────────────────────────────────────────
export async function getUserFavorites(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const favs = await db.select().from(userFavorites).where(eq(userFavorites.userId, userId));
  if (favs.length === 0) return [];
  const ids = favs.map((f) => f.courseId);
  return db.select().from(courses).where(inArray(courses.id, ids));
}

export async function addFavorite(userId: number, courseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .insert(userFavorites)
    .values({ userId, courseId })
    .onDuplicateKeyUpdate({ set: { userId } });
}

export async function removeFavorite(userId: number, courseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(userFavorites)
    .where(and(eq(userFavorites.userId, userId), eq(userFavorites.courseId, courseId)));
}

export async function getFavoriteIds(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({ courseId: userFavorites.courseId })
    .from(userFavorites)
    .where(eq(userFavorites.userId, userId));
  return result.map((r) => r.courseId);
}

// ─── JUPAS Choices helpers ────────────────────────────────────────────────────
export async function getJupasChoices(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(jupasChoices).where(eq(jupasChoices.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function saveJupasChoices(userId: number, choices: { courseId: number; rank: number }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .insert(jupasChoices)
    .values({ userId, choices })
    .onDuplicateKeyUpdate({ set: { choices } });
}

// ─── Saved Reports helpers ────────────────────────────────────────────────────
export async function getSavedReports(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(savedReports).where(eq(savedReports.userId, userId));
}

export async function saveReport(userId: number, title: string, courseIds: number[], reportUrl: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(savedReports).values({ userId, title, courseIds, reportUrl });
}

// ─── DSE Scores helpers ───────────────────────────────────────────────────────
export async function saveDseScores(userId: number, scores: Record<string, string | undefined>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Filter out undefined values
  const cleanScores: Record<string, string> = {};
  for (const [k, v] of Object.entries(scores)) {
    if (v !== undefined) cleanScores[k] = v;
  }
  await db
    .insert(dseScores)
    .values({ userId, scores: cleanScores })
    .onDuplicateKeyUpdate({ set: { scores: cleanScores, updatedAt: new Date() } });
}

export async function getDseScores(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(dseScores).where(eq(dseScores.userId, userId)).limit(1);
  return result[0]?.scores ?? null;
}

export async function getCoursesByIds(ids: number[]) {
  if (ids.length === 0) return [];
  const db = await getDb();
  if (!db) return [];
  return db.select().from(courses).where(inArray(courses.id, ids));
}

// ─── System Settings helpers ────────────────────────────────────────────────────────────────────────────────
export async function getSystemSetting(key: string): Promise<unknown | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(systemSettings).where(eq(systemSettings.settingKey, key)).limit(1);
  return result[0]?.settingValue ?? null;
}

export async function setSystemSetting(key: string, value: unknown): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .insert(systemSettings)
    .values({ settingKey: key, settingValue: value })
    .onDuplicateKeyUpdate({ set: { settingValue: value, updatedAt: new Date() } });
}
