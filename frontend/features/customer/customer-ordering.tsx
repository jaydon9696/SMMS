"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  Utensils,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { CartProvider, useCart } from "@/contexts/cart-context";
import { apiRequest, formatCurrency } from "@/services/api";
import type {
  MenuCategory,
  Order,
  OrderSource,
  PaymentMethod,
} from "@/types/domain";

export function CustomerOrdering({
  source,
  tableNumber,
}: {
  source: OrderSource;
  tableNumber?: number;
}) {
  return (
    <CartProvider source={source} tableNumber={tableNumber}>
      <CustomerOrderingContent source={source} tableNumber={tableNumber} />
    </CartProvider>
  );
}

function CustomerOrderingContent({
  source,
  tableNumber,
}: {
  source: OrderSource;
  tableNumber?: number;
}) {
  const router = useRouter();
  const cart = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("pay_at_counter");
  const [customerNote, setCustomerNote] = useState("");
  const menu = useQuery({
    queryKey: ["public-menu"],
    queryFn: () => apiRequest<MenuCategory[]>("/public/menu"),
  });
  const placeOrder = useMutation({
    mutationFn: () =>
      apiRequest<Order>("/public/orders", {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          source,
          table_number: tableNumber,
          payment_method: paymentMethod,
          customer_note: customerNote || null,
          items: cart.lines.map((line) => ({
            menu_item_id: line.item.id,
            quantity: line.quantity,
            note: line.note || null,
          })),
        }),
      }),
    onSuccess: (order) => {
      cart.clear();
      window.localStorage.setItem("smms-last-order", order.public_id);
      router.push(`/order/track/${order.public_id}`);
    },
  });

  return (
    <main className="min-h-dvh bg-muted/30 pb-28">
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Utensils className="size-5" />
            </span>
            <div>
              <p className="font-semibold">Smart Mess</p>
              <p className="text-xs text-muted-foreground">
                {source === "table" ? `Table ${tableNumber}` : "Standing order"}
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-3xl bg-primary p-6 text-primary-foreground sm:p-8">
          <Badge className="bg-white/15 text-white">Fresh today</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            What are you in the mood for?
          </h1>
          <p className="mt-2 max-w-xl text-primary-foreground/75">
            Choose your meal, add any preparation notes and follow it live from
            received to ready.
          </p>
        </div>

        {menu.isLoading ? (
          <MenuSkeleton />
        ) : menu.isError ? (
          <div className="mt-8 rounded-2xl border bg-card p-8 text-center">
            <p className="font-medium">We could not load the menu.</p>
            <Button className="mt-4" variant="outline" onClick={() => menu.refetch()}>
              Try again
            </Button>
          </div>
        ) : menu.data?.length === 0 ? (
          <div className="mt-8 rounded-2xl border bg-card p-10 text-center text-muted-foreground">
            The menu is being updated. Please check again shortly.
          </div>
        ) : (
          <div className="mt-10 space-y-12">
            {menu.data?.map((category) => (
              <section key={category.id}>
                <div className="mb-5">
                  <h2 className="text-2xl font-semibold">{category.name}</h2>
                  {category.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {category.items.map((item) => {
                    const quantity =
                      cart.lines.find((line) => line.item.id === item.id)
                        ?.quantity ?? 0;
                    return (
                      <motion.article
                        layout
                        key={item.id}
                        className="rounded-2xl border bg-card p-5 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`size-3 rounded-sm border ${
                                  item.is_vegetarian
                                    ? "border-emerald-600 bg-emerald-500"
                                    : "border-rose-600 bg-rose-500"
                                }`}
                                aria-label={
                                  item.is_vegetarian
                                    ? "Vegetarian"
                                    : "Non-vegetarian"
                                }
                              />
                              <h3 className="font-semibold">{item.name}</h3>
                            </div>
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                              {item.description ?? "Prepared fresh to order"}
                            </p>
                            <p className="mt-4 font-semibold">
                              {formatCurrency(item.price)}
                            </p>
                          </div>
                          {quantity === 0 ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => cart.add(item)}
                            >
                              Add
                            </Button>
                          ) : (
                            <div className="flex items-center rounded-lg border">
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                aria-label={`Remove one ${item.name}`}
                                onClick={() =>
                                  cart.updateQuantity(item.id, quantity - 1)
                                }
                              >
                                <Minus className="size-3.5" />
                              </Button>
                              <span className="w-8 text-center text-sm font-semibold">
                                {quantity}
                              </span>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                aria-label={`Add one ${item.name}`}
                                onClick={() =>
                                  cart.updateQuantity(item.id, quantity + 1)
                                }
                              >
                                <Plus className="size-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      <AnimatePresence>
        {cart.itemCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-4 backdrop-blur"
          >
            <div className="mx-auto flex max-w-5xl items-center gap-3">
              <Sheet>
                <SheetTrigger
                  render={
                    <Button variant="outline" size="lg" className="flex-1 justify-between" />
                  }
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="size-4" />
                    {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"}
                  </span>
                  <span>{formatCurrency(cart.subtotal)}</span>
                </SheetTrigger>
                <CartSheet />
              </Sheet>
              <Button size="lg" onClick={() => setCheckoutOpen(true)}>
                Review <ChevronRight className="size-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm your order</DialogTitle>
            <DialogDescription>
              Pay at the counter or settle with cash when your meal is served.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">Payment method</label>
              <Select
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pay_at_counter">Pay at counter</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium" htmlFor="order-note">
                Order note
              </label>
              <Textarea
                id="order-note"
                value={customerNote}
                maxLength={1000}
                placeholder="Anything the team should know?"
                onChange={(event) => setCustomerNote(event.target.value)}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted p-4">
              <span className="font-medium">Total</span>
              <span className="text-lg font-semibold">
                {formatCurrency(cart.subtotal)}
              </span>
            </div>
            {placeOrder.isError && (
              <p role="alert" className="text-sm text-destructive">
                {placeOrder.error.message}
              </p>
            )}
            <Button
              className="w-full"
              size="lg"
              disabled={placeOrder.isPending}
              onClick={() => placeOrder.mutate()}
            >
              {placeOrder.isPending ? "Placing order…" : "Place order"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function CartSheet() {
  const cart = useCart();
  return (
    <SheetContent className="overflow-y-auto">
      <SheetHeader>
        <SheetTitle>Your order</SheetTitle>
        <SheetDescription>Add notes or adjust quantities.</SheetDescription>
      </SheetHeader>
      <div className="space-y-5 px-4 pb-6">
        {cart.lines.map((line) => (
          <div key={line.item.id} className="space-y-3 rounded-xl border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{line.item.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(Number(line.item.price) * line.quantity)}
                </p>
              </div>
              <div className="flex items-center rounded-lg border">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() =>
                    cart.updateQuantity(line.item.id, line.quantity - 1)
                  }
                >
                  <Minus className="size-3.5" />
                </Button>
                <span className="w-8 text-center text-sm">{line.quantity}</span>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() =>
                    cart.updateQuantity(line.item.id, line.quantity + 1)
                  }
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>
            </div>
            <Textarea
              value={line.note}
              maxLength={500}
              placeholder="Item note"
              onChange={(event) =>
                cart.updateNote(line.item.id, event.target.value)
              }
            />
          </div>
        ))}
        <div className="flex items-center justify-between border-t pt-5">
          <span className="font-medium">Subtotal</span>
          <span className="font-semibold">{formatCurrency(cart.subtotal)}</span>
        </div>
      </div>
    </SheetContent>
  );
}

function MenuSkeleton() {
  return (
    <div className="mt-10 space-y-5">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((item) => (
          <Skeleton key={item} className="h-44 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
