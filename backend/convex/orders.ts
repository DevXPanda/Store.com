import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getAllOrders = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db.query("orders").withIndex("by_created").order("desc").take(args.limit ?? 100);
  },
});

export const getOrdersByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("orders")
      .withIndex("by_status", q => q.eq("status", args.status as any))
      .order("desc").collect();
  },
});

export const getOrdersByDeliveryBoy = query({
  args: { deliveryBoyId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.query("orders")
      .withIndex("by_delivery_boy", q => q.eq("assignedDeliveryBoyId", args.deliveryBoyId))
      .order("desc").collect();
  },
});

export const getOrderById = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const getOrderItems = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db.query("orderItems")
      .withIndex("by_order", q => q.eq("orderId", args.orderId)).collect();
  },
});

export const getOrdersByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.query("orders")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .order("desc").collect();
  },
});

// FIX: userId is now optional — supports both logged-in and guest checkout
export const placeOrder = mutation({
  args: {
    userId: v.optional(v.id("users")),
    guestId: v.optional(v.string()),
    customerName: v.string(),
    customerEmail: v.string(),
    customerPhone: v.string(),
    deliveryAddress: v.string(),
    subtotal: v.number(),
    deliveryFee: v.number(),
    discount: v.number(),
    total: v.number(),
    paymentMethod: v.union(v.literal("cod"), v.literal("online"), v.literal("upi")),
    notes: v.optional(v.string()),
    razorpayOrderId: v.optional(v.string()),
    items: v.array(v.object({
      productId: v.optional(v.id("products")),
      productName: v.string(),
      productEmoji: v.string(),
      productImage: v.optional(v.string()),
      quantity: v.number(),
      unitPrice: v.number(),
      totalPrice: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const { items, ...orderData } = args;
    const orderId = await ctx.db.insert("orders", {
      ...orderData,
      status: "pending",
      paymentStatus: args.paymentMethod === "cod" ? "pending" : "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    for (const item of items) {
      await ctx.db.insert("orderItems", {
        orderId,
        productId: item.productId,
        productName: item.productName,
        productEmoji: item.productEmoji,
        productImage: item.productImage,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      });
    }
    for (const item of items) {
      if (item.productId) {
        const product = await ctx.db.get(item.productId);
        if (product && product.stock >= item.quantity) {
          await ctx.db.patch(item.productId, {
            stock: product.stock - item.quantity,
            updatedAt: Date.now(),
          });
        }
      }
    }
    return orderId;
  },
});

export const getOrdersByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("orders").withIndex("by_created").order("desc").collect();
    return all.filter(o => o.customerEmail === args.email).slice(0, 50);
  },
});

export const cancelOrderByCustomer = mutation({
  args: { orderId: v.id("orders"), customerEmail: v.string(), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    if (order.customerEmail !== args.customerEmail) throw new Error("Unauthorized");
    if (!["pending", "confirmed"].includes(order.status)) throw new Error("Cannot cancel order in current state");
    await ctx.db.patch(args.orderId, {
      status: "cancelled",
      cancelReason: args.reason || "Cancelled by customer",
      updatedAt: Date.now(),
    });
  },
});

// Call /api/sms from your frontend after this mutation for customer SMS notifications
export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("pending"), v.literal("confirmed"), v.literal("preparing"),
      v.literal("assigned"), v.literal("picked_up"), v.literal("out_for_delivery"),
      v.literal("delivered"), v.literal("cancelled")
    ),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, { status: args.status, updatedAt: Date.now() });
    const order = await ctx.db.get(args.orderId);
    // Log the status change
    try {
      await ctx.db.insert("activityLog", {
        userId: "system",
        userName: "System",
        action: "ORDER_STATUS_CHANGE",
        target: args.orderId,
        details: `Order status → ${args.status}${args.note ? `: ${args.note}` : ""}`,
        timestamp: Date.now(),
      });
    } catch {}
    if (order?.assignedDeliveryBoyId) {
      await ctx.db.insert("deliveryTracking", {
        orderId: args.orderId,
        deliveryBoyId: order.assignedDeliveryBoyId,
        status: args.status,
        note: args.note,
        timestamp: Date.now(),
      });
    }
  },
});

export const updatePaymentStatus = mutation({
  args: {
    orderId: v.id("orders"),
    paymentStatus: v.union(v.literal("pending"), v.literal("paid"), v.literal("failed")),
    razorpayPaymentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, {
      paymentStatus: args.paymentStatus,
      razorpayPaymentId: args.razorpayPaymentId,
      updatedAt: Date.now(),
    });
  },
});

export const assignDeliveryBoy = mutation({
  args: {
    orderId: v.id("orders"),
    deliveryBoyId: v.id("users"),
    deliveryBoyName: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, {
      assignedDeliveryBoyId: args.deliveryBoyId,
      assignedDeliveryBoyName: args.deliveryBoyName,
      status: "assigned",
      updatedAt: Date.now(),
    });
  },
});

export const getAdminStats = query({
  args: {},
  handler: async (ctx) => {
    const allOrders = await ctx.db.query("orders").collect();
    const totalRevenue = allOrders.filter(o => o.status === "delivered").reduce((s, o) => s + o.total, 0);
    const pendingOrders = allOrders.filter(o => ["pending","confirmed","preparing"].includes(o.status)).length;
    const today = new Date().toDateString();
    const deliveredToday = allOrders.filter(o => o.status === "delivered" && new Date(o.createdAt).toDateString() === today).length;
    const allProducts = await ctx.db.query("products").collect();
    const lowStock = allProducts.filter(p => p.stock < 10 && p.isActive).length;
    return {
      totalOrders: allOrders.length,
      totalRevenue,
      pendingOrders,
      deliveredToday,
      lowStockProducts: lowStock,
      totalProducts: allProducts.filter(p => p.isActive).length,
    };
  },
});

export const getDeliveryStats = query({
  args: { deliveryBoyId: v.id("users") },
  handler: async (ctx, args) => {
    const myOrders = await ctx.db.query("orders")
      .withIndex("by_delivery_boy", q => q.eq("assignedDeliveryBoyId", args.deliveryBoyId)).collect();
    const today = new Date().toDateString();
    return {
      totalAssigned: myOrders.length,
      delivered: myOrders.filter(o => o.status === "delivered").length,
      pending: myOrders.filter(o => ["assigned","picked_up","out_for_delivery"].includes(o.status)).length,
      todayDelivered: myOrders.filter(o => o.status === "delivered" && new Date(o.createdAt).toDateString() === today).length,
    };
  },
});

export const subscribeNewsletter = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("newsletters")
      .withIndex("by_email", q => q.eq("email", args.email)).first();
    if (existing) return { success: true, alreadySubscribed: true };
    await ctx.db.insert("newsletters", { email: args.email, subscribedAt: Date.now(), active: true });
    return { success: true, alreadySubscribed: false };
  },
});

export const getRevenueByDay = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const days = args.days ?? 7;
    const since = Date.now() - days * 86400000;
    const orders = await ctx.db.query("orders")
      .withIndex("by_created")
      .filter(q => q.gte(q.field("createdAt"), since))
      .order("asc")
      .collect();

    const byDay: Record<string, { date: string; revenue: number; count: number }> = {};
    for (const o of orders) {
      if (o.status === "cancelled") continue;
      const d = new Date(o.createdAt).toISOString().split("T")[0];
      if (!byDay[d]) byDay[d] = { date: d, revenue: 0, count: 0 };
      byDay[d].revenue += o.total;
      byDay[d].count++;
    }
    return Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));
  },
});

export const getTopProducts = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("orderItems").collect();
    const counts: Record<string, { name: string; emoji: string; qty: number; revenue: number }> = {};
    for (const item of items) {
      const k = item.productName;
      if (!counts[k]) counts[k] = { name: item.productName, emoji: item.productEmoji, qty: 0, revenue: 0 };
      counts[k].qty += item.quantity;
      counts[k].revenue += item.totalPrice;
    }
    return Object.values(counts).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  },
});
