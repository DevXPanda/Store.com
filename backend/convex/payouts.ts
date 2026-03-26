import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const requestPayout = mutation({
  args: {
    userId: v.id("users"),
    userName: v.string(),
    amount: v.number(),
    method: v.union(v.literal("upi"), v.literal("bank")),
    details: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    
    const currentBalance = user.balance || 0;
    if (args.amount > currentBalance) throw new Error("Insufficient balance");
    if (args.amount < 100) throw new Error("Minimum payout is ₹100");

    // Deduct balance immediately (escrow-style)
    await ctx.db.patch(args.userId, { balance: currentBalance - args.amount });

    const payoutId = await ctx.db.insert("payouts", {
      userId: args.userId,
      userName: args.userName,
      amount: args.amount,
      method: args.method,
      details: args.details,
      status: "pending",
      createdAt: Date.now(),
    });

    return payoutId;
  },
});

export const getMyPayouts = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payouts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const getAllPayoutRequests = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("payouts")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
  },
});

export const getPayoutHistory = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("payouts")
      .order("desc")
      .collect();
  },
});

export const processPayout = mutation({
  args: {
    payoutId: v.id("payouts"),
    status: v.union(v.literal("processed"), v.literal("rejected")),
    adminId: v.string(),
  },
  handler: async (ctx, args) => {
    const payout = await ctx.db.get(args.payoutId);
    if (!payout) throw new Error("Payout request not found");
    if (payout.status !== "pending") throw new Error("Payout already processed");

    await ctx.db.patch(args.payoutId, {
      status: args.status,
      processedAt: Date.now(),
    });

    // If rejected, refund the balance
    if (args.status === "rejected") {
      const user = await ctx.db.get(payout.userId);
      if (user) {
        await ctx.db.patch(payout.userId, {
          balance: (user.balance || 0) + payout.amount,
        });
      }
    }

    await ctx.db.insert("activityLog", {
      userId: args.adminId,
      userName: "Admin",
      action: "PROCESS_PAYOUT",
      target: payout.userId,
      details: `Payout of ₹${payout.amount} ${args.status}`,
      timestamp: Date.now(),
    });
  },
});
