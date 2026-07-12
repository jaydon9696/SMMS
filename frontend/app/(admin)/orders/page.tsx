"use client";

import { useEffect, useState } from "react";
import { getOrders, updateOrderStatus, markOrderPaid } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Order } from "@/types";

const statuses = ["pending", "accepted", "preparing", "ready", "completed", "cancelled"];

const statusVariant: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  accepted: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  preparing: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  ready: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  completed: "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await updateOrderStatus(orderId, status);
      toast.success("Status updated");
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const payOrder = async (orderId: string) => {
    try {
      await markOrderPaid(orderId);
      toast.success("Marked as paid");
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to mark paid");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
      {loading ? (
        <p>Loading orders...</p>
      ) : (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <p className="text-muted-foreground">No orders yet.</p>
          ) : (
            orders.map((order) => (
              <Card key={order.id}>
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-lg">{order.order_number}</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      Table {order.order_type === "standing" ? "Standing" : order.table_id} · {new Date(order.created_at).toLocaleString()}
                    </div>
                  </div>
                  <Badge className={statusVariant[order.status] || ""}>{order.status}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.menu_item_name} x {item.quantity}</span>
                        <span>₹{item.unit_price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="font-semibold">Total: ₹{order.total_amount}</div>
                    <div className="flex flex-wrap gap-2">
                      <Select value={order.status} onValueChange={(v) => v && updateStatus(order.id, v)}>
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {order.payment_status !== "paid" && (
                        <Button size="sm" variant="outline" onClick={() => payOrder(order.id)}>
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
