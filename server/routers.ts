import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createHubContent,
  createTablesideSession,
  deleteHubContent,
  deleteTablesideSession,
  getAllHubContent,
  getAllTablesideSessions,
  getHubContent,
  getHubSections,
  getHubSettings,
  getTablesideSessionById,
  getTablesideSessions,
  updateHubContent,
  updateTablesideSession,
  upsertHubSection,
  upsertHubSetting,
  upsertUser,
  getUserByOpenId,
  getAdminPassword,
} from "./db";
import { sdk } from "./_core/sdk";
import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME } from "@shared/const";

import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

// Admin guard middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),

    // Standalone admin password login — no Manus OAuth required
    adminLogin: publicProcedure
      .input(z.object({ password: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const storedPassword = await getAdminPassword();
        if (!storedPassword || input.password !== storedPassword) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Incorrect password" });
        }
        // Ensure the owner admin user exists in the DB
        const ADMIN_OPEN_ID = "local_admin";
        let user = await getUserByOpenId(ADMIN_OPEN_ID);
        if (!user) {
          await upsertUser({
            openId: ADMIN_OPEN_ID,
            name: "Admin",
            email: null,
            loginMethod: "password",
            role: "admin",
            lastSignedIn: new Date(),
          });
          user = await getUserByOpenId(ADMIN_OPEN_ID);
        }
        if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create admin session" });
        // Ensure role is admin (in case it was downgraded)
        if (user.role !== "admin") {
          await upsertUser({ openId: ADMIN_OPEN_ID, role: "admin", lastSignedIn: new Date() });
        }
        const token = await sdk.createSessionToken(ADMIN_OPEN_ID, { name: "Admin" });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
        return { success: true } as const;
      }),

    // Change admin password (requires being logged in as admin)
    adminChangePassword: adminProcedure
      .input(z.object({ newPassword: z.string().min(6) }))
      .mutation(async ({ input }) => {
        await upsertHubSetting("admin_password", input.newPassword);
        return { success: true } as const;
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Tableside Sessions ─────────────────────────────────────────────────────
  tableside: router({
    list: publicProcedure
      .input(z.object({ month: z.number().min(1).max(12), year: z.number().min(2020) }))
      .query(({ input }) => getTablesideSessions(input.month, input.year)),

    listAll: adminProcedure.query(() => getAllTablesideSessions()),

    create: adminProcedure
      .input(
        z.object({
          title: z.string().min(1),
          location: z.string(),
          description: z.string().optional(),
          startTime: z.string(), // ISO string from client
          endTime: z.string(),
          month: z.number().min(1).max(12),
          year: z.number().min(2020),
          sortOrder: z.number().default(0),
        })
      )
      .mutation(async ({ input }) => {
        await createTablesideSession({
          ...input,
          startTime: new Date(input.startTime),
          endTime: new Date(input.endTime),
          isActive: true,
        });
        return { success: true };
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).optional(),
          location: z.string().optional(),
          description: z.string().optional(),
          startTime: z.string().optional(),
          endTime: z.string().optional(),
          month: z.number().min(1).max(12).optional(),
          year: z.number().min(2020).optional(),
          sortOrder: z.number().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, startTime, endTime, ...rest } = input;
        await updateTablesideSession(id, {
          ...rest,
          ...(startTime ? { startTime: new Date(startTime) } : {}),
          ...(endTime ? { endTime: new Date(endTime) } : {}),
        });
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteTablesideSession(input.id);
        return { success: true };
      }),
  }),

  // ─── Hub Sections ───────────────────────────────────────────────────────────
  sections: router({
    list: publicProcedure.query(() => getHubSections()),

    upsert: adminProcedure
      .input(
        z.object({
          key: z.string().min(1),
          label: z.string().min(1),
          icon: z.string(),
          color: z.string(),
          route: z.string(),
          isActive: z.boolean().default(true),
          sortOrder: z.number().default(0),
        })
      )
      .mutation(async ({ input }) => {
        await upsertHubSection(input);
        return { success: true };
      }),
  }),

  // ─── Hub Content ────────────────────────────────────────────────────────────
  content: router({
    get: publicProcedure
      .input(z.object({ sectionKey: z.string() }))
      .query(({ input }) => getHubContent(input.sectionKey)),

    getAll: adminProcedure.query(() => getAllHubContent()),

    create: adminProcedure
      .input(
        z.object({
          sectionKey: z.string().min(1),
          contentType: z.string().default("text"),
          title: z.string().default(""),
          body: z.string().optional(),
          url: z.string().optional(),
          sortOrder: z.number().default(0),
        })
      )
      .mutation(async ({ input }) => {
        await createHubContent({ ...input, isActive: true });
        return { success: true };
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          body: z.string().optional(),
          url: z.string().optional(),
          isActive: z.boolean().optional(),
          sortOrder: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateHubContent(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteHubContent(input.id);
        return { success: true };
      }),
  }),

  // ─── Hub Settings ───────────────────────────────────────────────────────────
  settings: router({
    get: publicProcedure.query(() => getHubSettings()),

    upsert: adminProcedure
      .input(z.object({ key: z.string().min(1), value: z.string() }))
      .mutation(async ({ input }) => {
        await upsertHubSetting(input.key, input.value);
        return { success: true };
      }),

    upsertMany: adminProcedure
      .input(z.array(z.object({ key: z.string().min(1), value: z.string() })))
      .mutation(async ({ input }) => {
        for (const item of input) {
          await upsertHubSetting(item.key, item.value);
        }
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
