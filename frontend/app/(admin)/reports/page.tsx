"use client";

import { useEffect, useState } from "react";
import { getDailyReport, getPopularItems } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ReportData {
  date: string;
  total_orders: number;
  revenue: number;
  payment_summary: Record<string, number>;
  orders: any[];
}

export default function ReportsPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [popular, setPopular] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([getDailyReport(), getPopularItems()]).then(([r, p]) => {
      setReport(r);
      setPopular(p);
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Orders</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{report?.total_orders ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">₹{report?.revenue ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {report?.payment_summary ? (
              Object.entries(report.payment_summary).map(([method, amount]) => (
                <div key={method} className="text-sm capitalize">
                  {method}: ₹{amount}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No payments</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Popular Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Sold</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {popular.map((item) => (
                <TableRow key={item.menu_item_id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>₹{item.unit_price}</TableCell>
                  <TableCell>{item.total_sold}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
