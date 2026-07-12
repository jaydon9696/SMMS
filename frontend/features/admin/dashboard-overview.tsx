"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  ChefHat,
  Clock3,
  ListOrdered,
  PackageCheck,
  UsersRound,
} from "lucide-react";

import { OrderStatusBadge } from "@/components/order-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiRequest, formatCurrency } from "@/services/api";
import type { DashboardSummary, Order } from "@/types/domain";

export function DashboardOverview() {
  const summary = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => apiRequest<DashboardSummary>("/dashboard/summary"),
    refetchInterval: 15_000,
  });
  const orders = useQuery({
    queryKey: ["orders", "recent"],
    queryFn: () => apiRequest<Order[]>("/orders?limit=8"),
    refetchInterval: 10_000,
  });

  const cards = [
    {
      label: "Today's revenue",
      value: summary.data ? formatCurrency(summary.data.revenue) : "—",
      icon: Banknote,
    },
    {
      label: "Orders today",
      value: summary.data?.orders ?? "—",
      icon: ListOrdered,
    },
    {
      label: "Pending",
      value: summary.data?.pending ?? "—",
      icon: Clock3,
    },
    {
      label: "Preparing",
      value: summary.data?.preparing ?? "—",
      icon: ChefHat,
    },
    {
      label: "Ready",
      value: summary.data?.ready ?? "—",
      icon: PackageCheck,
    },
    {
      label: "Occupied tables",
      value: summary.data?.occupied_tables ?? "—",
      icon: UsersRound,
    },
  ];

  return (
    <div>
      <div>
        <p className="text-sm text-muted-foreground">Live operations</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Overview</h1>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                {summary.isLoading ? (
                  <Skeleton className="mt-3 h-8 w-24" />
                ) : (
                  <p className="mt-2 text-2xl font-semibold">{value}</p>
                )}
              </div>
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((item) => (
                <Skeleton key={item} className="h-12" />
              ))}
            </div>
          ) : orders.data?.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              New orders will appear here.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.data?.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      #{order.order_number}
                    </TableCell>
                    <TableCell className="capitalize">{order.source}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(order.total_amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
