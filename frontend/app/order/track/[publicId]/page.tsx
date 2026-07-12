import { OrderTracker } from "@/features/customer/order-tracker";

export default async function TrackOrderPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  return <OrderTracker publicId={publicId} />;
}
