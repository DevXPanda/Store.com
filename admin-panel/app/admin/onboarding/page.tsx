"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Leaf, Loader2, MapPin } from "lucide-react";

const input =
  "w-full rounded-xl border border-green-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-600/25 focus:border-green-500";
const label =
  "block text-[11px] font-mono uppercase tracking-wide text-gray-600 mb-1";
const section =
  "rounded-2xl border border-green-100 bg-white/80 backdrop-blur-sm p-5 shadow-sm";

export default function AdminOnboardingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    dateOfBirth: "",
    pan: "",
    pincode: "",
    cityCurrent: "",
    cityApplying: "",
    cityResidencyYears: "",
    educationLevel: "",
    instituteName: "",
    occupation: "",
    industry: "",
    workExperienceYears: "",
    roleDescription: "",
    hearAbout: "",
    programUnderstanding: "",
    whyPartner: "",
    dayToDayInvolvement: "",
    timeCommitment: "",
    familyIncome: "",
    investmentAmount: "",
    fundingPlan: "",
    relatedToEmployee: "no" as "yes" | "no",
    providesToVegFru: "no" as "yes" | "no",
    partnerCount: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/onboarding/session", {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          router.replace("/");
          return;
        }
        setPhone(data.phone || "");
        setReady(true);
      } catch {
        router.replace("/");
      }
    })();
  }, [router]);

  const setField =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not submit");
        setLoading(false);
        return;
      }
      if (data.next === "pending_review") {
        setLoading(false);
        router.push("/admin/pending");
        router.refresh();
        return;
      }
      setError("Unexpected response from server");
    } catch {
      setError("Network error");
    }
    setLoading(false);
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#FEFAE0] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-forest-700 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FEFAE0] text-gray-900">
      <div className="bg-forest-800 text-green-100 text-xs py-1.5 text-center font-body tracking-wide">
        <span className="inline-flex items-center justify-center gap-2 px-4">
          <MapPin className="w-3 h-3 shrink-0" />
          Partner onboarding · {phone}
        </span>
      </div>
      <header className="sticky top-0 z-40 bg-[#FEFAE0]/95 backdrop-blur-md border-b border-green-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-forest-700 rounded-xl flex items-center justify-center shadow-md group-hover:rotate-12 transition-transform duration-300">
              <Leaf className="w-5 h-5 text-green-200" />
            </div>
            <div>
              <span className="font-display font-bold text-xl text-forest-800 tracking-tight">
                Veg<span className="text-green-600">Fru</span>
              </span>
              <span className="block text-[9px] font-mono text-green-600 tracking-widest uppercase -mt-0.5">
                Admin Portal
              </span>
            </div>
          </Link>
          <Link
            href="/"
            className="text-sm text-forest-700 hover:underline font-medium"
          >
            ← Home
          </Link>
        </div>
      </header>

      <main className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="blob-1 absolute -top-32 -left-32 w-96 h-96 bg-green-200/40" />
          <div className="blob-2 absolute -bottom-20 -right-32 w-80 h-80 bg-amber-200/40" />
          <div className="absolute top-1/3 right-1/4 w-64 h-64 blob-1 bg-lime-100/60" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
          <div className="max-w-5xl mx-auto w-full">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-forest-900 mb-2">
          Partner application
        </h1>
        <p className="text-gray-600 text-sm mb-8">
          Complete your profile to access the VegFru admin dashboard. Fields
          marked * are required.
        </p>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-100 text-red-800 text-sm px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-8">
          <section className={section}>
            <h2 className="font-display text-xl font-semibold text-forest-900 mb-4">
              1. Personal details
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={label}>Full name *</label>
                <input
                  required
                  className={input}
                  value={form.name}
                  onChange={setField("name")}
                />
              </div>
              <div>
                <label className={label}>Date of birth *</label>
                <input
                  required
                  type="date"
                  className={input}
                  value={form.dateOfBirth}
                  onChange={setField("dateOfBirth")}
                />
              </div>
              <div>
                <label className={label}>PAN *</label>
                <input
                  required
                  className={input}
                  value={form.pan}
                  onChange={setField("pan")}
                />
              </div>
              <div>
                <label className={label}>Pincode *</label>
                <input
                  required
                  className={input}
                  value={form.pincode}
                  onChange={setField("pincode")}
                />
              </div>
              <div>
                <label className={label}>Email *</label>
                <input
                  required
                  type="email"
                  className={input}
                  value={form.email}
                  onChange={setField("email")}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>City you are based in *</label>
                <input
                  required
                  className={input}
                  value={form.cityCurrent}
                  onChange={setField("cityCurrent")}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>City you are applying for *</label>
                <input
                  required
                  className={input}
                  value={form.cityApplying}
                  onChange={setField("cityApplying")}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>
                  How long in the city you are applying for? *
                </label>
                <input
                  required
                  className={input}
                  value={form.cityResidencyYears}
                  onChange={setField("cityResidencyYears")}
                />
              </div>
            </div>
          </section>

          <section className={section}>
            <h2 className="font-display text-xl font-semibold text-forest-900 mb-4">
              2. Education &amp; occupation
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={label}>Highest education *</label>
                <input
                  required
                  className={input}
                  value={form.educationLevel}
                  onChange={setField("educationLevel")}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Institute name</label>
                <input
                  className={input}
                  value={form.instituteName}
                  onChange={setField("instituteName")}
                />
              </div>
              <div>
                <label className={label}>Current occupation *</label>
                <input
                  required
                  className={input}
                  value={form.occupation}
                  onChange={setField("occupation")}
                />
              </div>
              <div>
                <label className={label}>Industry *</label>
                <input
                  required
                  className={input}
                  value={form.industry}
                  onChange={setField("industry")}
                />
              </div>
              <div>
                <label className={label}>Total work experience (years) *</label>
                <input
                  required
                  className={input}
                  value={form.workExperienceYears}
                  onChange={setField("workExperienceYears")}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>About your current role *</label>
                <textarea
                  required
                  rows={4}
                  minLength={50}
                  placeholder="Minimum 50 characters"
                  className={input}
                  value={form.roleDescription}
                  onChange={setField("roleDescription")}
                />
              </div>
            </div>
          </section>

          <section className={section}>
            <h2 className="font-display text-xl font-semibold text-forest-900 mb-4">
              3. Program &amp; partnership
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={label}>How did you hear about VegFru? *</label>
                <input
                  required
                  className={input}
                  value={form.hearAbout}
                  onChange={setField("hearAbout")}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>What do you understand about the program? *</label>
                <textarea
                  required
                  rows={4}
                  minLength={50}
                  className={input}
                  value={form.programUnderstanding}
                  onChange={setField("programUnderstanding")}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Why do you want to partner with VegFru? *</label>
                <input
                  required
                  className={input}
                  value={form.whyPartner}
                  onChange={setField("whyPartner")}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Day-to-day involvement *</label>
                <input
                  required
                  className={input}
                  value={form.dayToDayInvolvement}
                  onChange={setField("dayToDayInvolvement")}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Time you can commit *</label>
                <input
                  required
                  className={input}
                  value={form.timeCommitment}
                  onChange={setField("timeCommitment")}
                />
              </div>
              <div>
                <label className={label}>Approx. annual family income *</label>
                <input
                  required
                  className={input}
                  value={form.familyIncome}
                  onChange={setField("familyIncome")}
                />
              </div>
              <div>
                <label className={label}>Investment you are willing to make *</label>
                <input
                  required
                  className={input}
                  value={form.investmentAmount}
                  onChange={setField("investmentAmount")}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>How will you fund this? *</label>
                <input
                  required
                  className={input}
                  value={form.fundingPlan}
                  onChange={setField("fundingPlan")}
                />
              </div>
              <div>
                <label className={label}>Related to anyone at VegFru? *</label>
                <select
                  required
                  className={input}
                  value={form.relatedToEmployee}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      relatedToEmployee: e.target.value as "yes" | "no",
                    }))
                  }
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div>
                <label className={label}>Provide goods/services to VegFru? *</label>
                <select
                  required
                  className={input}
                  value={form.providesToVegFru}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      providesToVegFru: e.target.value as "yes" | "no",
                    }))
                  }
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Number of partners involved *</label>
                <input
                  required
                  className={input}
                  value={form.partnerCount}
                  onChange={setField("partnerCount")}
                />
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-white font-semibold py-4 text-base shadow-lg shadow-green-900/10"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            Submit &amp; open dashboard
          </button>
        </form>
          </div>
        </div>
      </main>
    </div>
  );
}
