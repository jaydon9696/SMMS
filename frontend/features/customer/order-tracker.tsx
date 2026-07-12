"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChefHat, CircleDot, PackageCheck, ReceiptText } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, formatCurrency } from "@/services/api";
import type { Order, OrderStatus } from "@/types/domain";

const steps: Array<{
  status: OrderStatus;
  label: string;
  description: string;
  icon: typeof ReceiptText;
}> = [
  {
    status: "pending",
    label: "Order received",
    description: "Your order is in the queue.",
    icon: ReceiptText,
  },
  {
    status: "accepted",
    label: "Accepted",
    description: "The team has confirmed it.",
    icon: CircleDot,
  },
  {
    status: "preparing",
    label: "Preparing",
    description: "Your food is being prepared.",
    icon: ChefHat,
  },
  {
    status: "ready",
    label: "Ready",
    description: "Your order is ready to collect.",
    icon: PackageCheck,
  },
  {
    status: "completed",
    label: "Completed",
    description: "Thank you. Enjoy your meal!",
    icon: Check,
  },
];

export function OrderTracker({ publicId }: { publicId: string }) {
  const queryClient = useQueryClient();
  const order = useQuery({
    queryKey: ["order", publicId],
    queryFn: () => apiRequest<Order>(`/public/orders/${publicId}`),
    refetchInterval: 15_000,
  });

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost/api/v1";
    const socket = new WebSocket(`${base}/ws/orders/${publicId}`);
    socket.onmessage = (event) => {
      queryClient.setQueryData(["order", publicId], JSON.parse(event.data) as Order);
    };
    const keepAlive = window.setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) socket.send("ping");
    }, 20_000);
    return () => {
      window.clearInterval(keepAlive);
      socket.close();
    };
  }, [publicId, queryClient]);

  if (order.isLoading) {
    return (
      <main className="mx-auto min-h-dvh max-w-xl space-y-4 px-4 py-10">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </main>
    );
  }
  if (!order.data || order.isError) {
    return (
      <main className="grid min-h-dvh place-items-center px-4">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h1 className="text-xl font-semibold">Order not found</h1>
            <p className="mt-2 text-muted-foreground">
              Check the tracking link or place a new order.
            </p>
            <Button className="mt-6" render={<Link href="/order/standing" />}>
              Open menu
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const currentIndex = steps.findIndex((step) => step.status === order.data.status);
  return (
    <main className="min-h-dvh bg-muted/30 px-4 py-8">
      <div className="mx-auto max-w-xl">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Tracking</p>
            <h1 className="text-xl font-semibold">#{order.data.order_number}</h1>
          </div>
          <ThemeToggle />
        </header>
        <Card className="mt-8 overflow-hidden">
          <div className="bg-primary p-6 text-primary-foreground">
            <Badge className="bg-white/15 text-white">Live status</Badge>
            <h2 className="mt-3 text-2xl font-semibold">
              {order.data.status === "ready"
                ? "Your order is ready"
                : order.data.status === "completed"
                  ? "Order completed"
                  : "We are on it"}
            </h2>
            <p className="mt-1 text-sm text-primary-foreground/75">
              Updates appear here automatically.
            </p>
          </div>
          <CardContent className="p-6">
            <ol className="space-y-1">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const reached = index <= currentIndex;
                return (
                  <li key={step.status} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span
                        className={`grid size-9 place-items-center rounded-full border ${
                          reached
                            ? "border-primary bg-primary text-primary-foreground"
                            : "bg-background text-muted-foreground"
                        }`}
                      >
                        <Icon className="size-4" />
                      </span>
                      {index < steps.length - 1 && (
                        <span
                          className={`h-12 w-px ${
                            index < currentIndex ? "bg-primary" : "bg-border"
                          }`}
                        />
                      )}
                    </div>
                    <div className="pt-1.5">
                      <p className={reached ? "font-medium" : "text-muted-foreground"}>
                        {step.label}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="mt-6 flex items-center justify-between border-t pt-5">
              <span className="text-muted-foreground">Order total</span>
              <span className="font-semibold">
                {formatCurrency(order.data.total_amount)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
