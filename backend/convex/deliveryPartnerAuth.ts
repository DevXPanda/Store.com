import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

function randomHex(byteLength: number) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function randomOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Public: submit rider application (name, phone, city). */
export const submitDeliveryPartnerApplication = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.string(),
    password: v.string(),
    city: v.string(),
  },
  handler: async (ctx, args) => {
    const phone = normalizePhone(args.phone);
    if (phone.length !== 10) throw new Error("Enter a valid 10-digit mobile number");
    const name = args.name.trim();
    if (name.length < 2) throw new Error("Enter your full name");
    const email = args.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address");
    if (args.password.trim().length < 6) throw new Error("Password must be at least 6 characters");
    const city = args.city.trim();
    if (!city) throw new Error("Select your city");

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .first();
    if (existingUser && existingUser.role === "delivery") {
      throw new Error("This number is already registered. Sign in with OTP.");
    }
    const existingEmailUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existingEmailUser && existingEmailUser.role === "delivery") {
      throw new Error("This email is already registered. Sign in instead.");
    }

    const forPhone = await ctx.db
      .query("deliveryPartnerApplications")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .collect();
    const pending = forPhone.find((a) => a.status === "pending");
    if (pending) {
      throw new Error("We already have an application under review for this number.");
    }
    const forEmail = await ctx.db
      .query("deliveryPartnerApplications")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    const pendingEmail = forEmail.find((a) => a.status === "pending");
    if (pendingEmail) {
      throw new Error("We already have an application under review for this email.");
    }
    const passwordHash = bcrypt.hashSync(args.password.trim(), 10);

    await ctx.db.insert("deliveryPartnerApplications", {
      name,
      phone,
      email,
      passwordHash,
      city,
      submittedAt: Date.now(),
      status: "pending",
    });

    return { ok: true as const };
  },
});

export const getDeliveryApplicationStatusByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const phone = normalizePhone(args.phone);
    if (phone.length !== 10) return { status: "none" as const };
    const apps = await ctx.db
      .query("deliveryPartnerApplications")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .collect();
    if (apps.length === 0) return { status: "none" as const };
    const latest = apps.reduce((a, b) => (a.submittedAt >= b.submittedAt ? a : b));
    return {
      status: latest.status,
      submittedAt: latest.submittedAt,
      city: latest.city,
    };
  },
});

export const listPendingDeliveryPartnerApplications = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("deliveryPartnerApplications")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();
  },
});

/** Approved + rejected delivery rider applications (newest reviewed first). */
export const listProcessedDeliveryPartnerApplications = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const cap = Math.min(args.limit ?? 200, 500);
    const approved = await ctx.db
      .query("deliveryPartnerApplications")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .order("desc")
      .take(cap);
    const rejected = await ctx.db
      .query("deliveryPartnerApplications")
      .withIndex("by_status", (q) => q.eq("status", "rejected"))
      .order("desc")
      .take(cap);
    const merged = [...approved, ...rejected];
    merged.sort(
      (a, b) =>
        (b.reviewedAt ?? b.submittedAt) - (a.reviewedAt ?? a.submittedAt)
    );
    return merged.slice(0, cap);
  },
});

export const approveDeliveryPartnerApplication = mutation({
  args: {
    applicationId: v.id("deliveryPartnerApplications"),
    reviewerId: v.id("admins"),
  },
  handler: async (ctx, args) => {
    const reviewer = await ctx.db.get(args.reviewerId);
    if (!reviewer || reviewer.role !== "superadmin" || !reviewer.isActive) {
      throw new Error("Only an active super admin can approve applications");
    }

    const app = await ctx.db.get(args.applicationId);
    if (!app) throw new Error("Application not found");
    if (app.status !== "pending") throw new Error("This application is not pending review");
    if (app.userId) throw new Error("Application already processed");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", app.phone))
      .first();
    if (existing) throw new Error("A user already exists for this phone number");

    const email = app.email?.trim().toLowerCase() || `delivery_${app.phone}@partners.vegfru.in`;
    const emailTaken = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (emailTaken) throw new Error("Account conflict — contact support");

    const passwordHash = app.passwordHash || bcrypt.hashSync(randomHex(32), 10);

    const userId = await ctx.db.insert("users", {
      name: app.name,
      email,
      passwordHash,
      role: "delivery",
      phone: app.phone,
      address: app.city,
      isActive: true,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.applicationId, {
      status: "approved",
      reviewedAt: Date.now(),
      reviewedBy: args.reviewerId,
      userId,
    });

    await ctx.db.insert("activityLog", {
      userId: args.reviewerId as unknown as string,
      userName: reviewer.name,
      action: "APPROVE_DELIVERY_PARTNER",
      target: app.phone,
      details: `Approved delivery partner: ${app.name} (${app.city})`,
      timestamp: Date.now(),
    });

    return { userId };
  },
});

export const rejectDeliveryPartnerApplication = mutation({
  args: {
    applicationId: v.id("deliveryPartnerApplications"),
    reviewerId: v.id("admins"),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const reviewer = await ctx.db.get(args.reviewerId);
    if (!reviewer || reviewer.role !== "superadmin" || !reviewer.isActive) {
      throw new Error("Only an active super admin can reject applications");
    }

    const app = await ctx.db.get(args.applicationId);
    if (!app) throw new Error("Application not found");
    if (app.status !== "pending") throw new Error("This application is not pending review");

    await ctx.db.patch(args.applicationId, {
      status: "rejected",
      reviewedAt: Date.now(),
      reviewedBy: args.reviewerId,
      rejectionReason: args.rejectionReason,
    });

    await ctx.db.insert("activityLog", {
      userId: args.reviewerId as unknown as string,
      userName: reviewer.name,
      action: "REJECT_DELIVERY_PARTNER",
      target: app.phone,
      details: `Rejected ${app.name}`,
      timestamp: Date.now(),
    });

    return { ok: true as const };
  },
});

export const requestDeliveryOtp = mutation({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const phone = normalizePhone(args.phone);
    if (phone.length !== 10) throw new Error("Enter a valid 10-digit mobile number");

    const user = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .first();
    if (!user || user.role !== "delivery") {
      throw new Error("No delivery account for this number. Register and wait for approval.");
    }
    if (!user.isActive) throw new Error("Your account is suspended. Contact support.");

    const existingOtps = await ctx.db
      .query("deliveryOtps")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .collect();
    for (const row of existingOtps) {
      await ctx.db.delete(row._id);
    }

    const code = randomOtp();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    await ctx.db.insert("deliveryOtps", { phone, code, expiresAt });

    // TODO: send SMS via provider; remove devCode in production.
    return { ok: true as const, phone, expiresInSec: 300, devCode: code };
  },
});

export const requestDeliveryOtpByEmail = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address");
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (!user || user.role !== "delivery") {
      throw new Error("No delivery account found for this email. Apply first, then wait for approval.");
    }
    if (!user.phone) throw new Error("No phone linked to this account. Contact support.");
    if (!user.isActive) throw new Error("Your account is suspended. Contact support.");

    const phone = normalizePhone(user.phone);
    if (phone.length !== 10) throw new Error("Account phone is invalid. Contact support.");

    const existingOtps = await ctx.db
      .query("deliveryOtps")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .collect();
    for (const row of existingOtps) {
      await ctx.db.delete(row._id);
    }

    const code = randomOtp();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    await ctx.db.insert("deliveryOtps", { phone, code, expiresAt });
    return { ok: true as const, phone, expiresInSec: 300, devCode: code };
  },
});

export const requestDeliveryEmailOtpByEmail = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address");
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (!user || user.role !== "delivery") {
      throw new Error("No delivery account found for this email. Apply first, then wait for approval.");
    }
    if (!user.isActive) throw new Error("Your account is suspended. Contact support.");

    const existingOtps = await ctx.db
      .query("deliveryEmailOtps")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    for (const row of existingOtps) {
      await ctx.db.delete(row._id);
    }

    const code = randomOtp();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    await ctx.db.insert("deliveryEmailOtps", { email, code, expiresAt });
    return { ok: true as const, email, expiresInSec: 300, devCode: code };
  },
});

export const verifyDeliveryOtp = mutation({
  args: { phone: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const phone = normalizePhone(args.phone);
    if (phone.length !== 10) throw new Error("Invalid phone number");

    const user = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .first();
    if (!user || user.role !== "delivery" || !user.isActive) {
      throw new Error("Invalid login");
    }

    const trimmed = args.code.trim();
    const rows = await ctx.db
      .query("deliveryOtps")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .collect();
    const match = rows.find((r) => r.code === trimmed && r.expiresAt > Date.now());
    if (!match) {
      throw new Error("Invalid or expired OTP. Request a new code.");
    }

    await ctx.db.delete(match._id);
    for (const r of rows) {
      if (r._id !== match._id) await ctx.db.delete(r._id);
    }

    await ctx.db.patch(user._id, { lastLogin: Date.now() });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone ?? phone,
        rating: 4.8,
      },
    };
  },
});

export const verifyDeliveryEmailOtp = mutation({
  args: { email: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (!email) throw new Error("Invalid email");
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (!user || user.role !== "delivery" || !user.isActive) {
      throw new Error("Invalid login");
    }

    const trimmed = args.code.trim();
    const rows = await ctx.db
      .query("deliveryEmailOtps")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    const match = rows.find((r) => r.code === trimmed && r.expiresAt > Date.now());
    if (!match) {
      throw new Error("Invalid or expired OTP. Request a new code.");
    }

    await ctx.db.delete(match._id);
    for (const r of rows) {
      if (r._id !== match._id) await ctx.db.delete(r._id);
    }

    await ctx.db.patch(user._id, { lastLogin: Date.now() });
    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
        rating: 4.8,
      },
    };
  },
});

export const loginDeliveryByPhone = mutation({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const phone = normalizePhone(args.phone);
    if (phone.length !== 10) throw new Error("Invalid phone number");

    const user = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .first();
    if (!user || user.role !== "delivery" || !user.isActive) {
      throw new Error("Invalid login");
    }

    await ctx.db.patch(user._id, { lastLogin: Date.now() });
    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone ?? phone,
        rating: 4.8,
      },
    };
  },
});
