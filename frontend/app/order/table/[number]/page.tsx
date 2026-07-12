"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createOrder, fetchCustomerMenu, getTableByNumber } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { CartItem, MenuCategory, MenuItem } from "@/types";

export default function TableOrderPage() {
  const params = useParams();
  const router = useRouter();
  const number = Number(params.number);
  const [tableId, setTableId] = useState<string | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [table, menu] = await Promise.all([getTableByNumber(number), fetchCustomerMenu()]);
        setTableId(table.id);
        setCategories(menu);
        if (menu.length) setActiveCategory(menu[0].id);
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to load menu");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [number]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1, notes: "" }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const updateNotes = (id: string, notes: string) => {
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, notes } : i)));
  };

  const total = cart.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);

  const placeOrder = async () => {
    if (!tableId || cart.length === 0) return;
    try {
      const order = await createOrder({
        table_id: tableId,
        items: cart.map((i) => ({ menu_item_id: i.id, quantity: i.quantity, notes: i.notes || null })),
        payment_method: paymentMethod,
        notes: notes || null,
      });
      router.push(`/order/track/${order.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to place order");
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading menu...</div>;
  }

  return (
    <div className="min-h-screen bg-muted pb-32">
      <header className="sticky top-0 z-10 border-b bg-background p-4">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-xl font-bold">Table {number} Menu</h1>
          <p className="text-sm text-muted-foreground">Scan, order and relax</p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap ${
                activeCategory === c.id ? "bg-primary text-primary-foreground" : "bg-card"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {categories
            .find((c) => c.id === activeCategory)
            ?.items?.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex-1">
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-sm text-muted-foreground">{item.description}</div>
                    <div className="mt-1 font-bold">₹{item.price}</div>
                  </div>
                  <Button size="sm" onClick={() => addToCart(item)}>Add</Button>
                </CardContent>
              </Card>
            ))}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4">
        <div className="mx-auto max-w-4xl">
          {cart.length > 0 && (
            <div className="mb-4 max-h-48 overflow-auto space-y-2">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <Input
                      className="h-8 text-sm"
                      placeholder="Notes"
                      value={item.notes}
                      onChange={(e) => updateNotes(item.id, e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" onClick={() => updateQuantity(item.id, -1)}>-</Button>
                    <span>{item.quantity}</span>
                    <Button size="icon" variant="outline" onClick={() => updateQuantity(item.id, 1)}>+</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <div className="font-bold">Total: ₹{total.toFixed(2)}</div>
            <Button onClick={placeOrder} disabled={cart.length === 0}>
              Place Order
            </Button>
          </div>
          <div className="mt-2">
            <Input placeholder="Order notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
}
