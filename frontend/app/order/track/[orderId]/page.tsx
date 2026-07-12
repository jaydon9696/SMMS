"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getOrder } from "@/services/api";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import type { Order } from "@/types";

const statuses = ["pending", "accepted", "preparing", "ready", "completed"];

export default function TrackOrderPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<Order | null>(null);

  useWebSocket(orderId, (data: any) => {
    if (data.status) {
      setOrder((prev) => (prev ? { ...prev, status: data.status } : null));
    }
  });

  useEffect(() => {
    getOrder(orderId).then((o) => setOrder(o));
  }, [orderId]);

  if (!order) {
    return <div className="p-8 text-center">Loading order...</div>;
  }

  const currentIndex = statuses.indexOf(order.status);

  return (
    <div className="min-h-screen bg-muted p-4">
      <div className="mx-auto max-w-md pt-8">
        <h1 className="text-center text-2xl font-bold">Order {order.order_number}</h1>
        <p className="text-center text-muted-foreground">Track your order status</p>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-center capitalize text-2xl">{order.status}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {statuses.map((status, idx) => {
                const done = idx <= currentIndex;
                return (
                  <div key={status} className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-5 w-5" /> : <span>{idx + 1}</span>}
                    </div>
                    <div className="font-medium capitalize">{status}</div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 border-t pt-4">
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>₹{order.total_amount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
