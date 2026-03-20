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
    isActive: v.optional(v.boolean()), badge: v.optional(v.string()),
    description: v.optional(v.string()),
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
  handler: async (ctx) => {
    const existing = await ctx.db.query("products").collect();
    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };

    const PRODUCTS = [
      { name:"Cherry Tomatoes", category:"vegetables", price:49, originalPrice:65, unit:"500g", emoji:"🍅", image:"https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=600&q=80", description:"Vine-ripened, bursting with sweetness", tag:"Organic", badge:"BESTSELLER", stock:50, rating:4.9, reviews:1243 },
      { name:"Alphonso Mangoes", category:"fruits", price:299, originalPrice:380, unit:"1kg", emoji:"🥭", image:"https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600&q=80", description:"The king of mangoes from Ratnagiri", tag:"Premium", badge:"SEASONAL", stock:30, rating:5.0, reviews:2891 },
      { name:"Baby Spinach", category:"leafy", price:39, originalPrice:55, unit:"250g", emoji:"🥬", image:"https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&q=80", description:"Tender leaves, rich in iron & vitamins", tag:"Organic", badge:undefined, stock:80, rating:4.7, reviews:456 },
      { name:"Dragon Fruit", category:"exotic", price:189, originalPrice:220, unit:"400g", emoji:"🍈", image:"https://images.unsplash.com/photo-1527325678964-54921661f888?w=600&q=80", description:"Vibrant pitaya from tropical farms", tag:"Imported", badge:"EXOTIC", stock:20, rating:4.8, reviews:89 },
      { name:"Strawberries", category:"berries", price:129, originalPrice:160, unit:"250g", emoji:"🍓", image:"https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&q=80", description:"Sweet Mahabaleshwar strawberries", tag:"Local", badge:"FRESH", stock:45, rating:4.9, reviews:412 },
      { name:"Blueberries", category:"berries", price:249, originalPrice:320, unit:"125g", emoji:"🫐", image:"https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=600&q=80", description:"Plump blueberries bursting with antioxidants", tag:"Imported", badge:"IMPORTED", stock:20, rating:4.8, reviews:289 },
      { name:"Avocado", category:"exotic", price:179, originalPrice:230, unit:"2 pcs", emoji:"🥑", image:"https://images.unsplash.com/photo-1519162808019-7de1683fa2ad?w=600&q=80", description:"Creamy Hass avocados — ripe & ready", tag:"Imported", badge:"TRENDING", stock:25, rating:4.8, reviews:345 },
      { name:"Fresh Basil", category:"herbs", price:29, originalPrice:40, unit:"50g", emoji:"🌿", image:"https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=600&q=80", description:"Aromatic Italian basil, freshly harvested", tag:"Organic", badge:undefined, stock:60, rating:4.6, reviews:78 },
      { name:"Purple Broccoli", category:"vegetables", price:89, originalPrice:110, unit:"400g", emoji:"🥦", image:"https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=600&q=80", description:"Anthocyanin-rich heirloom variety", tag:"Heirloom", badge:"RARE", stock:15, rating:4.8, reviews:145 },
      { name:"Orange Carrots", category:"root", price:35, originalPrice:48, unit:"500g", emoji:"🥕", image:"https://images.unsplash.com/photo-1445282768818-728615cc910a?w=600&q=80", description:"Sweet organic carrots, farm-fresh", tag:"Organic", badge:"BESTSELLER", stock:90, rating:4.8, reviews:341 },
      { name:"Navel Oranges", category:"citrus", price:79, originalPrice:100, unit:"1kg", emoji:"🍊", image:"https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=600&q=80", description:"Seedless juicy Nagpur oranges", tag:"Seasonal", badge:undefined, stock:80, rating:4.8, reviews:567 },
      { name:"Meyer Lemons", category:"citrus", price:69, originalPrice:90, unit:"500g", emoji:"🍋", image:"https://images.unsplash.com/photo-1590502593747-42a996133562?w=600&q=80", description:"Sweeter, thinner-skinned Meyer lemons", tag:"Gourmet", badge:"GOURMET", stock:60, rating:4.8, reviews:178 },
      { name:"Kiwi Fruit", category:"fruits", price:199, originalPrice:260, unit:"4 pcs", emoji:"🥝", image:"https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?w=600&q=80", description:"Tangy green kiwi from New Zealand", tag:"Imported", badge:"IMPORTED", stock:30, rating:4.8, reviews:267 },
      { name:"Green Peas", category:"vegetables", price:55, originalPrice:72, unit:"500g", emoji:"🫛", image:"https://images.unsplash.com/photo-1587049633312-d628ae50a8ae?w=600&q=80", description:"Fresh shelled green peas, protein-rich", tag:"Seasonal", badge:"SEASONAL", stock:45, rating:4.9, reviews:267 },
      { name:"Lychee", category:"fruits", price:149, originalPrice:199, unit:"250g", emoji:"🍇", image:"https://images.unsplash.com/photo-1596591868231-05e808fd7b79?w=600&q=80", description:"Fragrant summer lychees from Bihar", tag:"Seasonal", badge:"SEASONAL", stock:20, rating:5.0, reviews:812 },
      { name:"Curly Kale", category:"leafy", price:59, originalPrice:80, unit:"200g", emoji:"🥬", image:"https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?w=600&q=80", description:"Nutrient-dense superfood, freshly harvested", tag:"Organic", badge:"SUPERFOOD", stock:40, rating:4.8, reviews:134 },
      { name:"Button Mushrooms", category:"vegetables", price:79, originalPrice:105, unit:"250g", emoji:"🍄", image:"https://images.unsplash.com/photo-1504545102780-26774c1bb073?w=600&q=80", description:"Fresh white button mushrooms, earthy", tag:"Cultivated", badge:"UMAMI", stock:55, rating:4.8, reviews:312 },
      { name:"Sweet Corn", category:"vegetables", price:39, originalPrice:52, unit:"2 pcs", emoji:"🌽", image:"https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&q=80", description:"Fresh sweet corn, tender kernels", tag:"Seasonal", badge:undefined, stock:60, rating:4.8, reviews:389 },
      { name:"Watermelon", category:"fruits", price:49, originalPrice:65, unit:"1kg cut", emoji:"🍉", image:"https://images.unsplash.com/photo-1563114773-84221bd62daa?w=600&q=80", description:"Chilled watermelon — summer in a fruit", tag:"Seasonal", badge:"SUMMER", stock:80, rating:4.8, reviews:456 },
      { name:"Pomegranate", category:"fruits", price:89, originalPrice:120, unit:"1 pc", emoji:"🍎", image:"https://images.unsplash.com/photo-1541344999736-83eca272f6fc?w=600&q=80", description:"Ruby-red pomegranate, antioxidant-rich", tag:"Local", badge:"ANTIOXIDANT", stock:40, rating:4.8, reviews:234 },
      { name:"Baby Potatoes", category:"root", price:55, originalPrice:70, unit:"500g", emoji:"🥔", image:"https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&q=80", description:"Tender baby potatoes, great for roasting", tag:"Local", badge:"BESTSELLER", stock:100, rating:4.8, reviews:456 },
      { name:"Microgreens Mix", category:"herbs", price:149, originalPrice:199, unit:"100g", emoji:"🌱", image:"https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=600&q=80", description:"Chef-grade microgreens, ultra-fresh", tag:"Gourmet", badge:"GOURMET", stock:20, rating:4.9, reviews:89 },
      { name:"Himachali Apple", category:"fruits", price:149, originalPrice:195, unit:"1kg", emoji:"🍎", image:"https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&q=80", description:"Crisp Royal Gala apples from Himachal", tag:"Local", badge:"PREMIUM", stock:55, rating:4.8, reviews:456 },
      { name:"Asparagus", category:"vegetables", price:149, originalPrice:199, unit:"200g", emoji:"🌱", image:"https://images.unsplash.com/photo-1537486336219-d07b3b98b014?w=600&q=80", description:"Tender asparagus spears — spring treat", tag:"Gourmet", badge:"GOURMET", stock:15, rating:4.9, reviews:89 },
      { name:"Coconut", category:"exotic", price:45, originalPrice:60, unit:"1 pc", emoji:"🥥", image:"https://images.unsplash.com/photo-1580984969071-a8da5656c2fb?w=600&q=80", description:"Fresh coconut, naturally hydrating", tag:"Local", badge:undefined, stock:55, rating:4.8, reviews:389 },
    ];

    let count = 0;
    for (const p of PRODUCTS) {
      await ctx.db.insert("products", {
        ...p,
        category: p.category as any,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      count++;
    }
    return { seeded: count, message: `Seeded ${count} products` };
  },
});
