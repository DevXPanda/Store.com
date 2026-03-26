import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const DEFAULT_SUPER_ADMIN_EMAIL = "satyamkumarpandey4567@gmail.com";
const DEFAULT_SUPER_ADMIN_NAME = "Satyam Kumar Pandey";
const DEFAULT_SUPER_ADMIN_PASSWORD_HASH =
  "$2a$10$y4e70EMOYW5ejrYpevUrkuAO8BRpkf6bILbvV93SFWMNTtMj9zxCq";

export const ensureDefaultSuperAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", DEFAULT_SUPER_ADMIN_EMAIL))
      .first();

    if (existing) {
      return { seeded: false, adminId: existing._id };
    }

    const adminId = await ctx.db.insert("admins", {
      name: DEFAULT_SUPER_ADMIN_NAME,
      email: DEFAULT_SUPER_ADMIN_EMAIL,
      passwordHash: DEFAULT_SUPER_ADMIN_PASSWORD_HASH,
      role: "superadmin",
      isActive: true,
      createdAt: Date.now(),
    });

    return { seeded: true, adminId };
  },
});

async function findAdmin(ctx: any, email: string) {
  const admin = await ctx.db
    .query("admins")
    .withIndex("by_email", (q: any) => q.eq("email", email))
    .first();
  if (admin) return admin;

  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q: any) => q.eq("email", email))
    .first();
  if (user && (user.role === "admin" || user.role === "superadmin")) return user;
  return null;
}

export const getAdminByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await findAdmin(ctx, args.email.toLowerCase().trim());
  },
});

export const updateAdminLastLogin = mutation({
  args: { id: v.union(v.id("admins"), v.id("users")) },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id as any, { lastLogin: Date.now() });
  },
});

export const createAdminBySuperAdmin = mutation({
  args: {
    creatorId: v.id("admins"),
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    role: v.optional(v.union(v.literal("admin"), v.literal("superadmin"))),
  },
  handler: async (ctx, args) => {
    const creator = await ctx.db.get(args.creatorId);
    if (!creator || creator.role !== "superadmin" || !creator.isActive) {
      throw new Error("Only active super admin can create admin accounts");
    }

    const existing = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (existing) {
      throw new Error("Admin email already exists");
    }

    const adminId = await ctx.db.insert("admins", {
      name: args.name,
      email: args.email,
      passwordHash: args.passwordHash,
      role: args.role ?? "admin",
      isActive: true,
      createdBy: args.creatorId,
      createdAt: Date.now(),
    });

    return adminId;
  },
});

export const getAllAdmins = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("admins").order("desc").collect();
  },
});

function randomOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export const requestAdminEmailOtp = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const admin = await findAdmin(ctx, email);
    if (!admin || !admin.isActive) {
      throw new Error("No active admin account found for this email");
    }

    const existingOtps = await ctx.db
      .query("adminEmailOtps")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    for (const row of existingOtps) await ctx.db.delete(row._id);

    const code = randomOtp();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    await ctx.db.insert("adminEmailOtps", { email, code, expiresAt });
    return { ok: true as const, email, expiresInSec: 300, devCode: code };
  },
});

export const verifyAdminEmailOtp = mutation({
  args: { email: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const admin: any = await findAdmin(ctx, email);
    if (!admin || !admin.isActive) throw new Error("Invalid admin login");

    const trimmed = args.code.trim();
    const rows = await ctx.db
      .query("adminEmailOtps")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();

    const match = rows.find((r) => r.code === trimmed && r.expiresAt > Date.now());
    if (!match) throw new Error("Invalid or expired OTP. Request a new code.");

    await ctx.db.delete(match._id);
    for (const r of rows) if (r._id !== match._id) await ctx.db.delete(r._id);

    await ctx.db.patch(admin._id, { lastLogin: Date.now() });
    return {
      success: true,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    };
  },
});
