import type { Metadata } from "next";
import { ProductsAdmin } from "@/features/products/components/ProductsAdmin";

export const metadata: Metadata = { title: "Produtos" };

export default function ProductsPage() {
  return <ProductsAdmin />;
}
