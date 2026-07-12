"use client";

import { useEffect, useState } from "react";
import { getTables } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Table } from "@/types";

const statusVariant: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  accepted: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  preparing: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  ready: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  available: "bg-muted",
};

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTables()
      .then((data) => setTables(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Tables</h1>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {tables.map((table) => (
          <Card key={table.id} className={table.status ? statusVariant[table.status] || "" : "bg-muted/50"}>
            <CardHeader>
              <CardTitle className="text-3xl font-bold">
                {table.is_standing ? "S" : table.number}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium capitalize">{table.status || "Available"}</div>
              {table.total_amount ? (
                <div className="text-sm text-muted-foreground">₹{table.total_amount}</div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
