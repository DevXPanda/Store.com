import { mutation } from "./_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";

export const upsertRegistrationOtp = mutation({
  args: {
    email: v.string(),
    codeHash: v.string(),
    expiresAt: v.number(),
    name: v.string(),
    passwordHash: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existing) throw new Error("Email already registered");

    const prev = await ctx.db
      .query("registrationOtps")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    for (const row of prev) await ctx.db.delete(row._id);

    await ctx.db.insert("registrationOtps", {
      email,
      codeHash: args.codeHash,
      expiresAt: args.expiresAt,
      name: args.name.trim(),
      passwordHash: args.passwordHash,
      phone: args.phone,
    });
    return { ok: true as const };
  },
});

export const verifyRegistrationOtp = mutation({
  args: { email: v.string(), otp: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    const rows = await ctx.db
      .query("registrationOtps")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    const row = rows[0];
    if (!row) throw new Error("No pending verification for this email");
    if (row.expiresAt < Date.now()) {
      await ctx.db.delete(row._id);
      throw new Error("Code expired. Request a new one.");
    }
    const ok = bcrypt.compareSync(args.otp.trim(), row.codeHash);
    if (!ok) throw new Error("Invalid verification code");

    await ctx.db.delete(row._id);

    const userId = await ctx.db.insert("users", {
      name: row.name,
      email: row.email,
      passwordHash: row.passwordHash,
      role: "customer",
      phone: row.phone,
      address: undefined,
      isActive: true,
      createdAt: Date.now(),
    });

    return { userId };
  },
});
