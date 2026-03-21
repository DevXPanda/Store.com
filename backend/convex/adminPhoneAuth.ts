import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";

export const getAdminByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("admins")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .first();
  },
});

function randomHex(byteLength: number) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

const onboardingFields = {
  name: v.string(),
  email: v.string(),
  phone: v.string(),
  dateOfBirth: v.string(),
  pan: v.string(),
  pincode: v.string(),
  cityCurrent: v.string(),
  cityApplying: v.string(),
  cityResidencyYears: v.string(),
  educationLevel: v.string(),
  instituteName: v.optional(v.string()),
  occupation: v.string(),
  industry: v.string(),
  workExperienceYears: v.string(),
  roleDescription: v.string(),
  hearAbout: v.string(),
  programUnderstanding: v.string(),
  whyPartner: v.string(),
  dayToDayInvolvement: v.string(),
  timeCommitment: v.string(),
  familyIncome: v.string(),
  investmentAmount: v.string(),
  fundingPlan: v.string(),
  relatedToEmployee: v.union(v.literal("yes"), v.literal("no")),
  providesToVegFru: v.union(v.literal("yes"), v.literal("no")),
  partnerCount: v.string(),
};

/** Partner form submission — awaits superadmin approval before an admin account exists. */
export const submitOnboardingApplication = mutation({
  args: onboardingFields,
  handler: async (ctx, args) => {
    const existingEmail = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (existingEmail) throw new Error("Email already registered");

    const existingPhoneAdmin = await ctx.db
      .query("admins")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .first();
    if (existingPhoneAdmin) throw new Error("Phone already registered");

    const forPhone = await ctx.db
      .query("adminOnboardingApplications")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .collect();

    const hasPending = forPhone.some((a) => a.status === "pending");
    if (hasPending) {
      throw new Error("Application already under review for this phone number");
    }

    await ctx.db.insert("adminOnboardingApplications", {
      phone: args.phone,
      name: args.name,
      email: args.email,
      dateOfBirth: args.dateOfBirth,
      pan: args.pan,
      pincode: args.pincode,
      cityCurrent: args.cityCurrent,
      cityApplying: args.cityApplying,
      cityResidencyYears: args.cityResidencyYears,
      educationLevel: args.educationLevel,
      instituteName: args.instituteName,
      occupation: args.occupation,
      industry: args.industry,
      workExperienceYears: args.workExperienceYears,
      roleDescription: args.roleDescription,
      hearAbout: args.hearAbout,
      programUnderstanding: args.programUnderstanding,
      whyPartner: args.whyPartner,
      dayToDayInvolvement: args.dayToDayInvolvement,
      timeCommitment: args.timeCommitment,
      familyIncome: args.familyIncome,
      investmentAmount: args.investmentAmount,
      fundingPlan: args.fundingPlan,
      relatedToEmployee: args.relatedToEmployee,
      providesToVegFru: args.providesToVegFru,
      partnerCount: args.partnerCount,
      submittedAt: Date.now(),
      status: "pending",
    });

    return { ok: true as const };
  },
});

export const getOnboardingStatusByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const apps = await ctx.db
      .query("adminOnboardingApplications")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .collect();
    if (apps.length === 0) return { status: "none" as const };

    const latest = apps.reduce((a, b) =>
      a.submittedAt >= b.submittedAt ? a : b
    );
    const st =
      latest.status ??
      (latest.adminId ? ("approved" as const) : ("pending" as const));

    return {
      status: st,
      submittedAt: latest.submittedAt,
      applicationId: latest._id,
    };
  },
});

export const listPendingOnboardingApplications = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("adminOnboardingApplications")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();
  },
});

/** Approved + rejected franchise onboarding (newest reviewed first). */
export const listProcessedOnboardingApplications = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const cap = Math.min(args.limit ?? 200, 500);
    const approved = await ctx.db
      .query("adminOnboardingApplications")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .order("desc")
      .take(cap);
    const rejected = await ctx.db
      .query("adminOnboardingApplications")
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

export const approveOnboardingApplication = mutation({
  args: {
    applicationId: v.id("adminOnboardingApplications"),
    reviewerId: v.id("admins"),
  },
  handler: async (ctx, args) => {
    const reviewer = await ctx.db.get(args.reviewerId);
    if (!reviewer || reviewer.role !== "superadmin" || !reviewer.isActive) {
      throw new Error("Only an active super admin can approve applications");
    }

    const app = await ctx.db.get(args.applicationId);
    if (!app) throw new Error("Application not found");
    if (app.status !== "pending") {
      throw new Error("This application is not pending review");
    }
    if (app.adminId) throw new Error("Application already processed");

    const existingEmail = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", app.email))
      .first();
    if (existingEmail) throw new Error("Email already registered");

    const existingPhone = await ctx.db
      .query("admins")
      .withIndex("by_phone", (q) => q.eq("phone", app.phone))
      .first();
    if (existingPhone) throw new Error("Phone already registered");

    const passwordHash = bcrypt.hashSync(randomHex(32), 10);

    const adminId = await ctx.db.insert("admins", {
      name: app.name,
      email: app.email,
      passwordHash,
      phone: app.phone,
      role: "admin",
      isActive: true,
      createdBy: args.reviewerId,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.applicationId, {
      adminId,
      status: "approved",
      reviewedAt: Date.now(),
      reviewedBy: args.reviewerId,
    });

    return { adminId };
  },
});

export const rejectOnboardingApplication = mutation({
  args: {
    applicationId: v.id("adminOnboardingApplications"),
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
    if (app.status !== "pending") {
      throw new Error("This application is not pending review");
    }

    await ctx.db.patch(args.applicationId, {
      status: "rejected",
      reviewedAt: Date.now(),
      reviewedBy: args.reviewerId,
      rejectionReason: args.rejectionReason,
    });

    return { ok: true as const };
  },
});
