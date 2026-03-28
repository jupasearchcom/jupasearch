import {
  boolean,
  decimal,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Courses ─────────────────────────────────────────────────────────────────
export const courses = mysqlTable("courses", {
  id: int("id").autoincrement().primaryKey(),

  // Basic info
  jupasCode: varchar("jupasCode", { length: 20 }).unique(),
  nameZhTw: varchar("nameZhTw", { length: 255 }).notNull(),
  nameZhCn: varchar("nameZhCn", { length: 255 }),
  nameEn: varchar("nameEn", { length: 255 }),

  // Classification
  degreeType: varchar("degreeType", { length: 30 }), // BA, BSc, BEng, BEd, BLaw, BBA, etc.
  institution: varchar("institution", { length: 100 }).notNull(),
  institutionCode: varchar("institutionCode", { length: 20 }),
  duration: int("duration"), // 2, 4, 5, 6 years
  qualification: mysqlEnum("qualification", ["bachelor", "higher_diploma", "associate_degree"]).default("bachelor"),

  // Admission scoring
  scoringMethod: varchar("scoringMethod", { length: 50 }), // best5, best6, best4, 2c3x
  requiredSubjects: json("requiredSubjects").$type<string[]>(), // required subjects
  weightedSubjects: json("weightedSubjects").$type<{ subject: string; multiplier: number }[]>(),
  minRequirement: varchar("minRequirement", { length: 50 }), // e.g. "332A33", "332A22", "22222"

  // Interview
  interviewArrangement: varchar("interviewArrangement", { length: 100 }),

  // Admission statistics (last year)
  quota: int("quota"), // 收生人數
  lastYearMedian: decimal("lastYearMedian", { precision: 6, scale: 2 }), // 去年中位數/平均數
  lastYearQ1: decimal("lastYearQ1", { precision: 6, scale: 2 }), // 去年下四分位數
  lastYearAdmitted: int("lastYearAdmitted"), // 去年取錄人數
  lastYearGroupAAdmitted: int("lastYearGroupAAdmitted"), // 去年組別A取錄人數
  lastYearGroupAApplicants: int("lastYearGroupAApplicants"), // 去年組別A申請人數
  lastYearTotalApplicants: int("lastYearTotalApplicants"), // 去年總申請人數
  groupAOnly: boolean("groupAOnly").default(false), // 去年是否只錄取組別A

  // Score gap classification
  // above_median, above_q1, below_q1, between_median_q1
  scoreGap: mysqlEnum("scoreGap", ["above_median", "above_q1", "below_q1", "between_median_q1"]),

  // Funding
  fundingType: mysqlEnum("fundingType", ["ugc", "nmtss", "sssdp", "self_financed"]),

  // Tuition
  tuitionFee: int("tuitionFee"), // annual tuition in HKD

  // Flags
  scoringMethodChanged: boolean("scoringMethodChanged").default(false),
  isNew: boolean("isNew").default(false),

  // Module type (for future expansion)
  moduleType: mysqlEnum("moduleType", ["jupas", "eapp", "mainland"]).default("jupas").notNull(),

  // Additional info
  descriptionZhTw: text("descriptionZhTw"),
  descriptionZhCn: text("descriptionZhCn"),
  descriptionEn: text("descriptionEn"),
  careerProspectsZhTw: text("careerProspectsZhTw"),
  careerProspectsZhCn: text("careerProspectsZhCn"),
  careerProspectsEn: text("careerProspectsEn"),
  websiteUrl: varchar("websiteUrl", { length: 500 }),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

// ─── User Favorites ───────────────────────────────────────────────────────────
export const userFavorites = mysqlTable("user_favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  courseId: int("courseId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserFavorite = typeof userFavorites.$inferSelect;

// ─── JUPAS Choices (20 choices simulation) ───────────────────────────────────
export const jupasChoices = mysqlTable("jupas_choices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // one record per user
  choices: json("choices").$type<{ courseId: number; rank: number }[]>().default([]),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type JupasChoices = typeof jupasChoices.$inferSelect;

// ─── Saved PDF Reports ────────────────────────────────────────────────────────
export const savedReports = mysqlTable("saved_reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }),
  courseIds: json("courseIds").$type<number[]>(),
  reportUrl: varchar("reportUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SavedReport = typeof savedReports.$inferSelect;
