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

export const getAdminByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const updateAdminLastLogin = mutation({
  args: { id: v.id("admins") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { lastLogin: Date.now() });
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
