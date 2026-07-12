import { notFound } from "next/navigation";

import { CustomerOrdering } from "@/features/customer/customer-ordering";

export default async function TableOrderPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const tableNumber = Number(number);
  if (!Number.isInteger(tableNumber) || tableNumber < 1) notFound();

  return <CustomerOrdering source="table" tableNumber={tableNumber} />;
}
