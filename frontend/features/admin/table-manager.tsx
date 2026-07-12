"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Plus, QrCode, Trash2, Users } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { QRCodeSVG } from "qrcode.react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/services/api";
import type { Order, RestaurantTable } from "@/types/domain";

type TableState = "available" | "occupied" | "preparing" | "ready";

const statusStyles: Record<TableState, string> = {
  available: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  occupied: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  preparing: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  ready: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
};

export function TableManager() {
  const queryClient = useQueryClient();
  const origin = useSyncExternalStore(
    () => () => undefined,
    () => window.location.origin,
    () => "",
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTable, setDeleteTable] = useState<RestaurantTable>();
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("4");
  const tables = useQuery({
    queryKey: ["tables"],
    queryFn: () => apiRequest<RestaurantTable[]>("/tables"),
  });
  const orders = useQuery({
    queryKey: ["orders", "table-status"],
    queryFn: () => apiRequest<Order[]>("/orders?limit=200"),
    refetchInterval: 10_000,
  });
  const createTable = useMutation({
    mutationFn: () =>
      apiRequest<RestaurantTable>("/tables", {
        method: "POST",
        body: JSON.stringify({
          number: Number(number),
          name: name || null,
          capacity: Number(capacity),
          is_active: true,
        }),
      }),
    onSuccess: () => {
      setDialogOpen(false);
      setNumber("");
      setName("");
      setCapacity("4");
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });
  const removeTable = useMutation({
    mutationFn: (table: RestaurantTable) =>
      apiRequest<void>(`/tables/${table.id}`, { method: "DELETE" }),
    onSuccess: () => {
      setDeleteTable(undefined);
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });

  function getState(table: RestaurantTable): TableState {
    const active = orders.data?.filter(
      (order) =>
        order.table_id === table.id &&
        !["completed", "cancelled"].includes(order.status),
    );
    if (!active?.length) return "available";
    if (active.some((order) => order.status === "ready")) return "ready";
    if (active.some((order) => order.status === "preparing")) return "preparing";
    return "occupied";
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Floor and QR setup</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Tables</h1>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" /> Add table
        </Button>
      </div>

      <Card className="mt-6 overflow-hidden border-primary/20">
        <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row">
          <div className="rounded-xl border bg-white p-3">
            {origin ? (
              <QRCodeSVG value={`${origin}/order/standing`} size={112} />
            ) : (
              <div className="size-28" />
            )}
          </div>
          <div className="flex-1">
            <Badge>Standing orders</Badge>
            <h2 className="mt-3 text-xl font-semibold">Counter and takeaway QR</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Use this code where customers order without a table.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() =>
              navigator.clipboard.writeText(`${origin}/order/standing`)
            }
          >
            <Copy className="size-4" /> Copy link
          </Button>
        </CardContent>
      </Card>

      {tables.isLoading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Skeleton key={item} className="h-60 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tables.data?.map((table) => {
            const state = getState(table);
            const orderUrl = `${origin}/order/table/${table.number}`;
            return (
              <Card key={table.id}>
                <CardHeader className="flex-row items-start justify-between">
                  <div>
                    <CardTitle>{table.name ?? `Table ${table.number}`}</CardTitle>
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="size-3.5" /> {table.capacity} seats
                    </p>
                  </div>
                  <Badge className={statusStyles[state]} variant="secondary">
                    {state}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg border bg-white p-2">
                      {origin ? (
                        <QRCodeSVG value={orderUrl} size={88} />
                      ) : (
                        <div className="size-[88px]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-muted-foreground">
                        {orderUrl}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigator.clipboard.writeText(orderUrl)}
                        >
                          <Copy className="size-3.5" /> Copy
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Delete table ${table.number}`}
                          onClick={() => setDeleteTable(table)}
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {tables.data?.length === 0 && (
            <Card className="sm:col-span-2 xl:col-span-3">
              <CardContent className="p-12 text-center">
                <QrCode className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-4 font-medium">No tables configured.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a table</DialogTitle>
            <DialogDescription>
              A unique QR ordering link is generated automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="table-number">Table number</Label>
              <Input
                id="table-number"
                type="number"
                min="1"
                value={number}
                onChange={(event) => setNumber(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={capacity}
                onChange={(event) => setCapacity(event.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="table-name">Display name (optional)</Label>
              <Input
                id="table-name"
                value={name}
                placeholder="Window table"
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            {createTable.isError && (
              <p className="text-sm text-destructive sm:col-span-2">
                {createTable.error.message}
              </p>
            )}
            <Button
              className="sm:col-span-2"
              disabled={
                Number(number) < 1 ||
                Number(capacity) < 1 ||
                createTable.isPending
              }
              onClick={() => createTable.mutate()}
            >
              Create table
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTable)}
        onOpenChange={(open) => !open && setDeleteTable(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove table {deleteTable?.number}?</AlertDialogTitle>
            <AlertDialogDescription>
              Its QR link will stop accepting new orders. Historical orders remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep table</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteTable && removeTable.mutate(deleteTable)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
