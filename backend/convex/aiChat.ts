import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Save a chat session to Convex
export const saveSession = mutation({
  args: {
    sessionId: v.string(),
    userId: v.optional(v.id("users")),
    messages: v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      timestamp: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("aiChatSessions")
      .withIndex("by_session", q => q.eq("sessionId", args.sessionId))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        messages: args.messages,
        totalMessages: args.messages.length,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("aiChatSessions", {
        sessionId: args.sessionId,
        userId: args.userId,
        messages: args.messages,
        totalMessages: args.messages.length,
        ordersPlaced: 0,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Get session by ID
export const getSession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("aiChatSessions")
      .withIndex("by_session", q => q.eq("sessionId", args.sessionId))
      .first();
  },
});

// Increment orders placed via AI
export const incrementAIOrders = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("aiChatSessions")
      .withIndex("by_session", q => q.eq("sessionId", args.sessionId))
      .first();
    if (session) {
      await ctx.db.patch(session._id, {
        ordersPlaced: (session.ordersPlaced ?? 0) + 1,
        updatedAt: Date.now(),
      });
    }
  },
});

// Admin: get all AI sessions
export const getAllSessions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db.query("aiChatSessions")
      .order("desc")
      .take(args.limit ?? 50);
  },
});

// Admin: AI usage stats
export const getAIStats = query({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db.query("aiChatSessions").collect();
    const totalSessions = sessions.length;
    const totalMessages = sessions.reduce((s, sess) => s + sess.totalMessages, 0);
    const totalAIOrders = sessions.reduce((s, sess) => s + (sess.ordersPlaced ?? 0), 0);
    const avgMessagesPerSession = totalSessions > 0 ? Math.round(totalMessages / totalSessions) : 0;
    return { totalSessions, totalMessages, totalAIOrders, avgMessagesPerSession };
  },
});
