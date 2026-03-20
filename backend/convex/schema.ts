import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    role: v.union(
      v.literal("customer"),
      v.literal("admin"),
      v.literal("superadmin"),
      v.literal("delivery")
    ),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    avatar: v.optional(v.string()),
    isActive: v.boolean(),
    lastLogin: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  products: defineTable({
    name: v.string(),
    category: v.union(
      v.literal("vegetables"), v.literal("fruits"), v.literal("herbs"),
      v.literal("exotic"), v.literal("seasonal"), v.literal("leafy"),
      v.literal("berries"), v.literal("citrus"), v.literal("root")
    ),
    price: v.number(),
    originalPrice: v.number(),
    unit: v.string(),
    emoji: v.string(),
    image: v.optional(v.string()),
    description: v.string(),
    longDescription: v.optional(v.string()),
    tag: v.string(),
    badge: v.optional(v.string()),
    rating: v.number(),
    reviews: v.number(),
    stock: v.number(),
    nutritionHighlight: v.optional(v.string()),
    origin: v.optional(v.string()),
    keywords: v.optional(v.array(v.string())),
    isActive: v.boolean(),
    createdBy: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_active", ["isActive"])
    .index("by_rating", ["rating"]),

  orders: defineTable({
    userId: v.optional(v.id("users")),
    guestId: v.optional(v.string()),
    customerName: v.string(),
    customerEmail: v.string(),
    customerPhone: v.string(),
    deliveryAddress: v.string(),
    status: v.union(
      v.literal("pending"), v.literal("confirmed"), v.literal("preparing"),
      v.literal("assigned"), v.literal("picked_up"), v.literal("out_for_delivery"),
      v.literal("delivered"), v.literal("cancelled")
    ),
    subtotal: v.number(),
    deliveryFee: v.number(),
    discount: v.number(),
    total: v.number(),
    paymentMethod: v.union(v.literal("cod"), v.literal("online"), v.literal("upi")),
    paymentStatus: v.union(v.literal("pending"), v.literal("paid"), v.literal("failed")),
    razorpayOrderId: v.optional(v.string()),
    razorpayPaymentId: v.optional(v.string()),
    assignedDeliveryBoyId: v.optional(v.id("users")),
    assignedDeliveryBoyName: v.optional(v.string()),
    notes: v.optional(v.string()),
    estimatedDelivery: v.optional(v.string()),
    aiSessionId: v.optional(v.string()),
    orderedViaAI: v.optional(v.boolean()),
    cancelledBy: v.optional(v.string()),
    cancelReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_delivery_boy", ["assignedDeliveryBoyId"])
    .index("by_created", ["createdAt"]),

  orderItems: defineTable({
    orderId: v.id("orders"),
    productId: v.optional(v.id("products")),
    productName: v.string(),
    productEmoji: v.string(),
    productImage: v.optional(v.string()),
    quantity: v.number(),
    unitPrice: v.number(),
    totalPrice: v.number(),
  }).index("by_order", ["orderId"]),

  aiChatSessions: defineTable({
    sessionId: v.string(),
    userId: v.optional(v.id("users")),
    messages: v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      timestamp: v.number(),
    })),
    totalMessages: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_user", ["userId"]),

  deliveryTracking: defineTable({
    orderId: v.id("orders"),
    deliveryBoyId: v.optional(v.id("users")),
    status: v.string(),
    note: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    timestamp: v.number(),
  })
    .index("by_order", ["orderId"])
    .index("by_delivery_boy", ["deliveryBoyId"]),

  newsletters: defineTable({
    email: v.string(),
    subscribedAt: v.number(),
    active: v.boolean(),
  }).index("by_email", ["email"]),

  activityLog: defineTable({
    userId: v.string(),
    userName: v.string(),
    action: v.string(),
    target: v.optional(v.string()),
    details: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_timestamp", ["timestamp"]),
});
