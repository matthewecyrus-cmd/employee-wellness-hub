import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

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

// Tableside activity sessions — up to 4 per month
export const tablesideSessions = mysqlTable("tableside_sessions", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }).notNull().default(""),
  description: text("description"),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  month: int("month").notNull(), // 1-12
  year: int("year").notNull(),
  sortOrder: int("sortOrder").notNull().default(0),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TablesideSession = typeof tablesideSessions.$inferSelect;
export type InsertTablesideSession = typeof tablesideSessions.$inferInsert;

// Hub section cards shown on the home page
export const hubSections = mysqlTable("hub_sections", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(), // e.g. "tableside", "resources"
  label: varchar("label", { length: 128 }).notNull(),
  icon: varchar("icon", { length: 64 }).notNull().default("circle"),
  color: varchar("color", { length: 32 }).notNull().default("#3B82F6"),
  route: varchar("route", { length: 128 }).notNull(),
  isActive: boolean("isActive").notNull().default(true),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HubSection = typeof hubSections.$inferSelect;
export type InsertHubSection = typeof hubSections.$inferInsert;

// Flexible content blocks per section (tip sheets, announcements, etc.)
export const hubContent = mysqlTable("hub_content", {
  id: int("id").autoincrement().primaryKey(),
  sectionKey: varchar("sectionKey", { length: 64 }).notNull(),
  contentType: varchar("contentType", { length: 64 }).notNull().default("text"), // text | link | announcement
  title: varchar("title", { length: 255 }).notNull().default(""),
  body: text("body"),
  url: varchar("url", { length: 512 }).default(""),
  sortOrder: int("sortOrder").notNull().default(0),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HubContent = typeof hubContent.$inferSelect;
export type InsertHubContent = typeof hubContent.$inferInsert;

// Hub settings (month theme headline, etc.)
export const hubSettings = mysqlTable("hub_settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 128 }).notNull().unique(),
  settingValue: text("settingValue").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HubSetting = typeof hubSettings.$inferSelect;
