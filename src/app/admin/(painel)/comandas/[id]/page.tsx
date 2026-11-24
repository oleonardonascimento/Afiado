import type { Metadata } from "next";
import { OrderEditor } from "@/features/orders/components/OrderEditor";

export const metadata: Metadata = { title: "Comanda" };

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderEditor id={id} />;
}
