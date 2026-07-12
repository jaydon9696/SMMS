"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, RefreshCcw } from "lucide-react";

import { OrderStatusBadge } from "@/components/order-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, formatCurrency } from "@/services/api";
import type { Order, OrderStatus, RestaurantTable } from "@/types/domain";

const columns: Array<{ status: OrderStatus; label: string }> = [
  { status: "pending", label: "Pending" },
  { status: "accepted", label: "Accepted" },
  { status: "preparing", label: "Preparing" },
  { status: "ready", label: "Ready" },
];

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "accepted",
  accepted: "preparing",
  preparing: "ready",
  ready: "completed",
};

const nextLabel: Partial<Record<OrderStatus, string>> = {
  pending: "Accept",
  accepted: "Start preparing",
  preparing: "Mark ready",
  ready: "Complete",
};

export function OrderBoard() {
  const queryClient = useQueryClient();
  const orders = useQuery({
    queryKey: ["orders", "live"],
    queryFn: () => apiRequest<Order[]>("/orders?limit=200"),
    refetchInterval: 8_000,
  });
  const tables = useQuery({
    queryKey: ["tables"],
    queryFn: () => apiRequest<RestaurantTable[]>("/tables"),
  });
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      apiRequest<Order>(`/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
  const tableMap = new Map(tables.data?.map((table) => [table.id, table.number]));

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Operational queue</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Live orders
          </h1>
        </div>
        <Button variant="outline" onClick={() => orders.refetch()}>
          <RefreshCcw className="size-4" />
          Refresh
        </Button>
      </div>
      {orders.isLoading ? (
        <div className="mt-6 grid gap-4 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} className="h-80 rounded-xl" />
          ))}
        </div>
      ) : orders.isError ? (
        <Card className="mt-6">
          <CardContent className="p-10 text-center">
            <p>Unable to load orders.</p>
            <Button className="mt-4" variant="outline" onClick={() => orders.refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid items-start gap-4 xl:grid-cols-4">
          {columns.map((column) => {
            const columnOrders =
              orders.data?.filter((order) => order.status === column.status) ?? [];
            return (
              <section key={column.status} className="rounded-xl bg-muted/60 p-3">
                <div className="flex items-center justify-between px-1 py-2">
                  <h2 className="font-semibold">{column.label}</h2>
                  <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
                    {columnOrders.length}
                  </span>
                </div>
                <div className="mt-2 space-y-3">
                  {columnOrders.length === 0 && (
                    <div className="rounded-lg border border-dashed bg-background/50 p-6 text-center text-sm text-muted-foreground">
                      No {column.label.toLowerCase()} orders
                    </div>
                  )}
                  {columnOrders.map((order) => (
                    <Card key={order.id}>
                      <CardHeader className="gap-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">
                            #{order.order_number}
                          </CardTitle>
                          <OrderStatusBadge status={order.status} />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {order.source === "standing"
                              ? "Standing"
                              : `Table ${tableMap.get(order.table_id ?? "") ?? "—"}`}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock3 className="size-3" />
                            {new Date(order.created_at).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ul className="space-y-1.5 text-sm">
                          {order.items.map((item) => (
                            <li key={item.id} className="flex justify-between gap-3">
                              <span>
                                {item.quantity}× {item.item_name}
                              </span>
                              <span className="text-muted-foreground">
                                {formatCurrency(item.line_total)}
                              </span>
                            </li>
                          ))}
                        </ul>
                        {order.customer_note && (
                          <p className="rounded-lg bg-muted p-2 text-xs">
                            {order.customer_note}
                          </p>
                        )}
                        <div className="flex items-center justify-between border-t pt-3">
                          <span className="font-semibold">
                            {formatCurrency(order.total_amount)}
                          </span>
                          <Button
                            size="sm"
                            disabled={updateStatus.isPending}
                            onClick={() =>
                              updateStatus.mutate({
                                id: order.id,
                                status: nextStatus[order.status]!,
                              })
                            }
                          >
                            {nextLabel[order.status]}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recently completed</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {orders.data
            ?.filter((order) => order.status === "completed")
            .slice(0, 6)
            .map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium">#{order.order_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.items.length} items
                  </p>
                </div>
                <span className="font-medium">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
