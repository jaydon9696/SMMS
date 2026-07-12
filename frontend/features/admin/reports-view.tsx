"use client";

import { useQuery } from "@tanstack/react-query";
import { Banknote, CreditCard, ListOrdered, Trophy } from "lucide-react";
import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import type { DailyReport } from "@/types/domain";

function localDate() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

export function ReportsView() {
  const [date, setDate] = useState(localDate);
  const report = useQuery({
    queryKey: ["daily-report", date],
    queryFn: () =>
      apiRequest<DailyReport>(`/dashboard/reports/daily?business_date=${date}`),
  });
  const maxQuantity = Math.max(
    1,
    ...(report.data?.popular_items.map((item) => item.quantity) ?? []),
  );

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Business performance</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Reports</h1>
        </div>
        <Input
          aria-label="Report date"
          className="w-auto"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </div>

      {report.isLoading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : report.isError ? (
        <Card className="mt-6">
          <CardContent className="p-10 text-center">
            Unable to load the report for this date.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Revenue"
              value={formatCurrency(report.data?.revenue ?? 0)}
              icon={Banknote}
            />
            <Metric
              label="Orders"
              value={String(report.data?.order_count ?? 0)}
              icon={ListOrdered}
            />
            <Metric
              label="Completed"
              value={String(report.data?.by_status.completed ?? 0)}
              icon={Trophy}
            />
            <Metric
              label="Payment methods"
              value={String(report.data?.payments.length ?? 0)}
              icon={CreditCard}
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Popular items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {report.data?.popular_items.length === 0 && (
                  <p className="py-10 text-center text-muted-foreground">
                    No item sales for this date.
                  </p>
                )}
                {report.data?.popular_items.map((item, index) => (
                  <div key={item.name}>
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="font-medium">
                        {index + 1}. {item.name}
                      </span>
                      <span className="text-muted-foreground">
                        {item.quantity} sold · {formatCurrency(item.revenue)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(item.quantity / maxQuantity) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment summary</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Method</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.data?.payments.map((payment) => (
                      <TableRow key={payment.method}>
                        <TableCell className="font-medium capitalize">
                          {payment.method.replaceAll("_", " ")}
                        </TableCell>
                        <TableCell>{payment.orders}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {report.data?.payments.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="h-28 text-center text-muted-foreground"
                        >
                          No completed payments for this date.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Banknote;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
        <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  );
}
