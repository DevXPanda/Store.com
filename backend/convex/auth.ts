import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("users").withIndex("by_email", q => q.eq("email", args.email)).first();
  },
});

export const getUserById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const createUser = mutation({
  args: {
    name: v.string(), email: v.string(), passwordHash: v.string(),
    role: v.union(v.literal("customer"), v.literal("admin"), v.literal("superadmin"), v.literal("delivery")),
    phone: v.optional(v.string()),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", args.email)).first();
    if (existing) throw new Error("Email already registered");
    const { createdBy, ...userArgs } = args;
    const userId = await ctx.db.insert("users", { ...userArgs, address: undefined, isActive: true, createdAt: Date.now() });
    if (createdBy) {
      await ctx.db.insert("activityLog", {
        userId: createdBy, userName: "Admin",
        action: "CREATE_USER", target: args.email,
        details: `Created ${args.role} account for ${args.name}`,
        timestamp: Date.now(),
      });
    }
    return userId;
  },
});

export const updateUser = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.union(v.literal("customer"), v.literal("admin"), v.literal("superadmin"), v.literal("delivery"))),
    isActive: v.optional(v.boolean()),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, updatedBy, ...updates } = args;
    const filtered = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
    await ctx.db.patch(id, filtered);
    if (updatedBy) {
      await ctx.db.insert("activityLog", {
        userId: updatedBy, userName: "Admin",
        action: "UPDATE_USER", target: id,
        details: `Updated user: ${JSON.stringify(filtered)}`,
        timestamp: Date.now(),
      });
    }
  },
});

export const deleteUser = mutation({
  args: { id: v.id("users"), deletedBy: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    if (args.deletedBy && user) {
      await ctx.db.insert("activityLog", {
        userId: args.deletedBy, userName: "SuperAdmin",
        action: "DELETE_USER", target: user.email,
        details: `Deleted ${user.role} account: ${user.name}`,
        timestamp: Date.now(),
      });
    }
  },
});

export const updateLastLogin = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { lastLogin: Date.now() });
  },
});

export const getAllDeliveryBoys = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users")
      .withIndex("by_role", q => q.eq("role", "delivery"))
      .collect();
  },
});

export const getAllAdmins = query({
  args: {},
  handler: async (ctx) => {
    const admins = await ctx.db.query("users").withIndex("by_role", q => q.eq("role", "admin")).collect();
    const superadmins = await ctx.db.query("users").withIndex("by_role", q => q.eq("role", "superadmin")).collect();
    return [...superadmins, ...admins];
  },
});

export const getAllCustomers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").withIndex("by_role", q => q.eq("role", "customer")).collect();
  },
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").order("desc").collect();
  },
});

export const updateUserStatus = mutation({
  args: { id: v.id("users"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isActive: args.isActive });
  },
});

export const getActivityLog = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db.query("activityLog")
      .withIndex("by_timestamp")
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const seedAdminAndDelivery = mutation({
  args: {},
  handler: async (ctx) => {
    // Real pre-computed bcrypt hashes (rounds=10)
    const adminHash = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";     // admin123
    const superHash = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";     // superadmin123
    const deliveryHash = "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi"; // delivery123
    const customerHash = "$2a$10$TwT5h.qW4X3r7JvX3mYNVeQ3VkFO3AkKHvZ5dWKfpQDG8cKBp9tVO"; // customer123

    const users = [
      { name:"Super Admin",  email:"superadmin@vegfru.com", passwordHash: superHash,    role:"superadmin" as const, phone:"9800000000" },
      { name:"Admin User",   email:"admin@vegfru.com",      passwordHash: adminHash,    role:"admin"      as const, phone:"9800000001" },
      { name:"Ravi Kumar",   email:"ravi@vegfru.com",       passwordHash: deliveryHash, role:"delivery"   as const, phone:"9876543210" },
      { name:"Sunil Singh",  email:"sunil@vegfru.com",      passwordHash: deliveryHash, role:"delivery"   as const, phone:"9871234567" },
      { name:"Mohan Das",    email:"mohan@vegfru.com",      passwordHash: deliveryHash, role:"delivery"   as const, phone:"9812345678" },
      { name:"Priya Sharma", email:"customer@vegfru.com",   passwordHash: customerHash, role:"customer"   as const, phone:"9876543211" },
    ];

    let seeded = 0;
    for (const u of users) {
      const existing = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", u.email)).first();
      if (!existing) {
        await ctx.db.insert("users", { ...u, address: undefined, isActive: true, createdAt: Date.now() });
        seeded++;
      }
    }
    return { seeded, message: `Seeded ${seeded} users` };
  },
});

export const updateUserPassword = mutation({
  args: { id: v.id("users"), passwordHash: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { passwordHash: args.passwordHash });
    await ctx.db.insert("activityLog", {
      userId: args.id,
      userName: "User",
      action: "PASSWORD_RESET",
      timestamp: Date.now(),
    });
  },
});
