import { and, asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  HubContent,
  HubSection,
  HubSetting,
  InsertHubContent,
  InsertHubSection,
  InsertTablesideSession,
  InsertUser,
  TablesideSession,
  hubContent,
  hubSections,
  hubSettings,
  tablesideSessions,
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

// ─── Users ────────────────────────────────────────────────────────────────────

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
  return result[0] ?? undefined;
}

// ─── Tableside Sessions ───────────────────────────────────────────────────────

export async function getTablesideSessions(month: number, year: number): Promise<TablesideSession[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(tablesideSessions)
    .where(and(eq(tablesideSessions.month, month), eq(tablesideSessions.year, year), eq(tablesideSessions.isActive, true)))
    .orderBy(asc(tablesideSessions.sortOrder), asc(tablesideSessions.startTime));
}

export async function getAllTablesideSessions(): Promise<TablesideSession[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(tablesideSessions)
    .orderBy(asc(tablesideSessions.year), asc(tablesideSessions.month), asc(tablesideSessions.sortOrder));
}

export async function getTablesideSessionById(id: number): Promise<TablesideSession | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tablesideSessions).where(eq(tablesideSessions.id, id)).limit(1);
  return result[0] ?? undefined;
}

export async function createTablesideSession(data: InsertTablesideSession): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(tablesideSessions).values(data);
}

export async function updateTablesideSession(id: number, data: Partial<InsertTablesideSession>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(tablesideSessions).set(data).where(eq(tablesideSessions.id, id));
}

export async function deleteTablesideSession(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(tablesideSessions).where(eq(tablesideSessions.id, id));
}

// ─── Hub Sections ─────────────────────────────────────────────────────────────

export async function getHubSections(): Promise<HubSection[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(hubSections).orderBy(asc(hubSections.sortOrder));
}

export async function upsertHubSection(data: InsertHubSection): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(hubSections)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        label: data.label,
        icon: data.icon,
        color: data.color,
        route: data.route,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      },
    });
}

// ─── Hub Content ──────────────────────────────────────────────────────────────

export async function getHubContent(sectionKey: string): Promise<HubContent[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(hubContent)
    .where(and(eq(hubContent.sectionKey, sectionKey), eq(hubContent.isActive, true)))
    .orderBy(asc(hubContent.sortOrder));
}

export async function getAllHubContent(): Promise<HubContent[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(hubContent).orderBy(asc(hubContent.sectionKey), asc(hubContent.sortOrder));
}

export async function createHubContent(data: InsertHubContent): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(hubContent).values(data);
}

export async function updateHubContent(id: number, data: Partial<InsertHubContent>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(hubContent).set(data).where(eq(hubContent.id, id));
}

export async function deleteHubContent(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(hubContent).where(eq(hubContent.id, id));
}

// ─── Hub Settings ─────────────────────────────────────────────────────────────

export async function getHubSettings(): Promise<Record<string, string>> {
  const db = await getDb();
  if (!db) return {};
  const rows = await db.select().from(hubSettings);
  return Object.fromEntries(rows.map((r: HubSetting) => [r.settingKey, r.settingValue]));
}

export async function upsertHubSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(hubSettings)
    .values({ settingKey: key, settingValue: value })
    .onDuplicateKeyUpdate({ set: { settingValue: value } });
}
