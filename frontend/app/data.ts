/**
 * Re-exports catalog helpers only. Product data is loaded from Convex (`products:getAllProducts`).
 */
export {
  categories,
  mapConvexProduct,
  productsByKeyword,
  productsByCategory,
  getProductCatalogForAI,
  type CatalogProduct,
  type Product,
} from "@/lib/catalog";
