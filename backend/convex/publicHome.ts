import { query } from "./_generated/server";

export const getPublicStats = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    const activeProducts = products.filter((p) => p.isActive);
    const orders = await ctx.db.query("orders").collect();
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const allUsers = await ctx.db.query("users").collect();
    const customers = allUsers.filter((u) => u.role === "customer" && u.isActive);
    return {
      productCount: activeProducts.length,
      ordersDelivered: delivered,
      customerCount: customers.length,
    };
  },
});

export const getMarqueeItems = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    const active = products.filter((p) => p.isActive);
    const names = active.slice(0, 28).map((p) => `${p.emoji} ${p.name}`);
    if (names.length === 0) {
      return [
        "Farm-fresh vegetables & fruits",
        "Free delivery above ₹299",
        "4–6 hour delivery · Delhi NCR",
      ];
    }
    return names;
  },
});
