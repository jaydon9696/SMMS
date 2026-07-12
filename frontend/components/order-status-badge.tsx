import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/types/domain";

const styles: Record<OrderStatus, string> = {
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  accepted: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  preparing: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  ready: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge className={styles[status]} variant="secondary">
      {status.replace("_", " ")}
    </Badge>
  );
}
