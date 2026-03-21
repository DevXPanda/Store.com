import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("testimonials").collect();
    return all
      .filter((t) => t.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("testimonials").collect();
    return all.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    location: v.string(),
    text: v.string(),
    rating: v.number(),
    avatarEmoji: v.string(),
    verified: v.boolean(),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("testimonials", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("testimonials"),
    name: v.optional(v.string()),
    location: v.optional(v.string()),
    text: v.optional(v.string()),
    rating: v.optional(v.number()),
    avatarEmoji: v.optional(v.string()),
    verified: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(rest)) {
      if (val !== undefined) patch[k] = val;
    }
    await ctx.db.patch(id, patch as any);
  },
});

export const remove = mutation({
  args: { id: v.id("testimonials") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
