"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { MenuItem, OrderSource } from "@/types/domain";

export interface CartLine {
  item: MenuItem;
  quantity: number;
  note: string;
}

interface CartContextValue {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  add: (item: MenuItem) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateNote: (itemId: string, note: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  source,
  tableNumber,
  children,
}: {
  source: OrderSource;
  tableNumber?: number;
  children: React.ReactNode;
}) {
  const storageKey = `smms-cart:${source}:${tableNumber ?? "standing"}`;
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      queueMicrotask(() => setLines(JSON.parse(saved) as CartLine[]));
    }
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(lines));
  }, [lines, storageKey]);

  const add = useCallback((item: MenuItem) => {
    setLines((current) => {
      const existing = current.find((line) => line.item.id === item.id);
      if (!existing) return [...current, { item, quantity: 1, note: "" }];
      return current.map((line) =>
        line.item.id === item.id
          ? { ...line, quantity: Math.min(line.quantity + 1, 50) }
          : line,
      );
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    setLines((current) =>
      quantity <= 0
        ? current.filter((line) => line.item.id !== itemId)
        : current.map((line) =>
            line.item.id === itemId ? { ...line, quantity } : line,
          ),
    );
  }, []);

  const updateNote = useCallback((itemId: string, note: string) => {
    setLines((current) =>
      current.map((line) => (line.item.id === itemId ? { ...line, note } : line)),
    );
  }, []);

  const value = useMemo(
    () => ({
      lines,
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotal: lines.reduce(
        (sum, line) => sum + Number(line.item.price) * line.quantity,
        0,
      ),
      add,
      updateQuantity,
      updateNote,
      clear: () => setLines([]),
    }),
    [add, lines, updateNote, updateQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
