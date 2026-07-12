"use client";

import { useEffect, useState } from "react";
import { getDashboardSummary, getLiveOrders, getTables } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardSummary, Order, Table } from "@/types";

const statusVariant: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  accepted: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  preparing: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  ready: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  completed: "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, o, t] = await Promise.all([getDashboardSummary(), getLiveOrders(), getTables()]);
        setSummary(s);
        setLiveOrders(o);
        setTables(t);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const StatCard = ({ title, value }: { title: string; value: string }) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );

  if (loading || !summary) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Today's Revenue" value={`₹${summary.today_revenue}`} />
        <StatCard title="Orders Today" value={`${summary.orders_today}`} />
        <StatCard title="Pending" value={`${summary.pending}`} />
        <StatCard title="Preparing" value={`${summary.preparing}`} />
        <StatCard title="Ready" value={`${summary.ready}`} />
        <StatCard title="Completed" value={`${summary.completed}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Live Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {liveOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No live orders.</p>
            ) : (
              liveOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="font-medium">{order.order_number}</div>
                    <div className="text-sm text-muted-foreground">Table {order.table_number}</div>
                  </div>
                  <Badge className={statusVariant[order.status] || ""}>{order.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className={`rounded-lg border p-3 text-center ${
                    table.status ? "bg-primary/10" : "bg-muted"
                  }`}
                >
                  <div className="font-semibold">{table.is_standing ? "S" : table.number}</div>
                  <div className="text-xs text-muted-foreground">{table.status || "Available"}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
