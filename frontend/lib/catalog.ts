/** Shared catalog types + helpers — data comes from Convex `products` table. */

export const categories = [
  { id: "all", label: "All", emoji: "🌿" },
  { id: "vegetables", label: "Vegetables", emoji: "🥦" },
  { id: "fruits", label: "Fruits", emoji: "🍎" },
  { id: "leafy", label: "Leafy", emoji: "🥬" },
  { id: "herbs", label: "Herbs", emoji: "🌱" },
  { id: "berries", label: "Berries", emoji: "🍓" },
  { id: "citrus", label: "Citrus", emoji: "🍋" },
  { id: "exotic", label: "Exotic", emoji: "🥭" },
  { id: "seasonal", label: "Seasonal", emoji: "🍂" },
  { id: "root", label: "Root Veg", emoji: "🥕" },
] as const;

const CATEGORY_BG: Record<string, string> = {
  vegetables: "from-red-100 to-orange-50",
  fruits: "from-amber-100 to-yellow-50",
  leafy: "from-green-100 to-emerald-50",
  herbs: "from-lime-100 to-green-50",
  berries: "from-pink-100 to-rose-50",
  citrus: "from-yellow-100 to-orange-50",
  exotic: "from-violet-100 to-purple-50",
  seasonal: "from-orange-100 to-amber-50",
  root: "from-stone-100 to-amber-50",
};

const CATEGORY_ACCENT: Record<string, string> = {
  vegetables: "#15803d",
  fruits: "#d97706",
  leafy: "#059669",
  herbs: "#65a30d",
  berries: "#e11d48",
  citrus: "#ca8a04",
  exotic: "#7c3aed",
  seasonal: "#ea580c",
  root: "#92400e",
};

export type CatalogProduct = {
  _id: string;
  /** Same as Convex document id — used in routes and cart */
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  unit: string;
  emoji: string;
  image?: string;
  bg: string;
  accent: string;
  badge: string | null;
  badgeColor: string;
  description: string;
  longDescription: string;
  rating: number;
  reviews: number;
  tag: string;
  nutritionHighlight: string;
  origin: string;
  stock: number;
  keywords: string[];
};

/** @deprecated Use CatalogProduct — alias for gradual migration */
export type Product = CatalogProduct;

export function mapConvexProduct(doc: Record<string, unknown>): CatalogProduct {
  const category = String(doc.category ?? "vegetables");
  const badge = (doc.badge as string | undefined) ?? null;
  const orig = Number(doc.originalPrice ?? 0);
  const price = Number(doc.price ?? 0);
  const longDesc =
    (doc.longDescription as string | undefined)?.trim() ||
    String(doc.description ?? "");
  return {
    _id: String(doc._id),
    id: String(doc._id),
    name: String(doc.name ?? ""),
    category,
    price,
    originalPrice: orig > 0 ? orig : price,
    unit: String(doc.unit ?? ""),
    emoji: String(doc.emoji ?? "🌿"),
    image: doc.image as string | undefined,
    bg: CATEGORY_BG[category] ?? "from-green-50 to-lime-50",
    accent: CATEGORY_ACCENT[category] ?? "#16a34a",
    badge,
    badgeColor: badge ? "bg-forest-700" : "",
    description: String(doc.description ?? ""),
    longDescription: longDesc,
    rating: Number(doc.rating ?? 0),
    reviews: Number(doc.reviews ?? 0),
    tag: String(doc.tag ?? ""),
    nutritionHighlight: String(doc.nutritionHighlight ?? ""),
    origin: String(doc.origin ?? ""),
    stock: Number(doc.stock ?? 0),
    keywords: Array.isArray(doc.keywords)
      ? (doc.keywords as string[])
      : [],
  };
}

export function productsByKeyword(
  list: CatalogProduct[],
  keyword: string
): CatalogProduct[] {
  const lower = keyword.toLowerCase().trim();
  if (!lower) return list;
  return list.filter((p) => {
    const kw = p.keywords.some((k) => k.toLowerCase().includes(lower));
    return (
      kw ||
      p.name.toLowerCase().includes(lower) ||
      p.category.toLowerCase().includes(lower) ||
      p.description.toLowerCase().includes(lower) ||
      p.origin.toLowerCase().includes(lower)
    );
  });
}

export function productsByCategory(
  list: CatalogProduct[],
  cat: string
): CatalogProduct[] {
  if (cat === "all") return list;
  return list.filter((p) => p.category === cat);
}

export function getProductCatalogForAI(list: CatalogProduct[]): string {
  if (list.length === 0) return "(No products in catalog yet — ask admin to add products.)";
  return list
    .map(
      (p) =>
        `${p.name} | ${p.category} | ₹${p.price}/${p.unit} | ${p.tag} | ${p.origin} | ${p.keywords.join(", ")}`
    )
    .join("\n");
}
