import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getAllProducts = query({
  args: { includeInactive: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("products").collect();
    if (args.includeInactive) return all;
    return all.filter(p => p.isActive);
  },
});

export const getProductsByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("products")
      .withIndex("by_category", q => q.eq("category", args.category as any))
      .filter(q => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const getProductById = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const createProduct = mutation({
  args: {
    name: v.string(), category: v.string(), price: v.number(),
    originalPrice: v.number(), unit: v.string(), emoji: v.string(),
    description: v.string(), tag: v.string(),
    badge: v.optional(v.string()), stock: v.number(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("products", {
      ...args,
      category: args.category as any,
      rating: 0, reviews: 0, isActive: true,
      createdAt: Date.now(), updatedAt: Date.now(),
    });
  },
});

export const updateProduct = mutation({
  args: {
    id: v.id("products"),
    price: v.optional(v.number()), stock: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    badge: v.optional(v.string()),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
  },
});

export const deleteProduct = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => ctx.db.delete(args.id),
});

export const seedProducts = mutation({
  args: {},
  handler: async () => {
    return { seeded: 0, message: "Demo product seeding is disabled. Add real catalog data from admin/product APIs." };
  },
});

export const purgeDemoProducts = mutation({
  args: {},
  handler: async (ctx) => {
    const demoProductNames = new Set([
      "Cherry Tomatoes",
      "Alphonso Mangoes",
      "Baby Spinach",
      "Dragon Fruit",
      "Strawberries",
      "Blueberries",
      "Avocado",
      "Fresh Basil",
      "Purple Broccoli",
      "Orange Carrots",
      "Navel Oranges",
      "Meyer Lemons",
      "Kiwi Fruit",
      "Green Peas",
      "Lychee",
      "Curly Kale",
      "Button Mushrooms",
      "Sweet Corn",
      "Watermelon",
      "Pomegranate",
      "Baby Potatoes",
      "Microgreens Mix",
      "Himachali Apple",
      "Asparagus",
      "Coconut",
    ]);

    const products = await ctx.db.query("products").collect();
    let removed = 0;
    for (const product of products) {
      if (demoProductNames.has(product.name)) {
        await ctx.db.delete(product._id);
        removed++;
      }
    }
    return { removed, message: `Removed ${removed} demo products` };
  },
});
