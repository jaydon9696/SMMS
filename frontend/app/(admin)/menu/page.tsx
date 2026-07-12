"use client";

import { useEffect, useState } from "react";
import {
  createCategory,
  createItem,
  deleteCategory,
  deleteItem,
  fetchCategories,
  updateCategory,
  updateItem,
} from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { MenuCategory, MenuItem } from "@/types";

export default function MenuPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAddCategory = async (name: string) => {
    await createCategory(name);
    load();
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id);
    load();
  };

  const handleUpdateCategory = async (id: string, data: Partial<MenuCategory>) => {
    await updateCategory(id, data);
    load();
  };

  const handleAddItem = async (data: Partial<MenuItem>) => {
    await createItem(data);
    load();
  };

  const handleUpdateItem = async (id: string, data: Partial<MenuItem>) => {
    await updateItem(id, data);
    load();
  };

  const handleDeleteItem = async (id: string) => {
    await deleteItem(id);
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Menu Management</h1>
      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <CategoryForm onSubmit={handleAddCategory} />
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Card key={category.id}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={category.is_active}
                        onCheckedChange={(v) => handleUpdateCategory(category.id, { is_active: v })}
                      />
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                        Delete
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <ItemDialog categories={categories} onSubmit={handleAddItem} />
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) =>
                (category.items || []).map((item) => (
                  <Card key={item.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">{item.description || "No description"}</div>
                      <div className="mt-2 font-semibold">₹{item.price}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <Switch
                          checked={item.is_available}
                          onCheckedChange={(v) => handleUpdateItem(item.id, { is_available: v })}
                        />
                        <span className="text-sm">Available</span>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <ItemDialog categories={categories} initial={item} onSubmit={(d) => handleUpdateItem(item.id, d)}>
                          <Button variant="outline" size="sm">Edit</Button>
                        </ItemDialog>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteItem(item.id)}>
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CategoryForm({ onSubmit }: { onSubmit: (name: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await onSubmit(name);
    setName("");
    setBusy(false);
    toast.success("Category added");
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex-1 space-y-2">
        <Label>New Category</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" />
      </div>
      <Button type="submit" disabled={busy || !name.trim()}>Add</Button>
    </form>
  );
}

function ItemDialog({
  categories,
  initial,
  onSubmit,
  children,
}: {
  categories: MenuCategory[];
  initial?: MenuItem;
  onSubmit: (data: Partial<MenuItem>) => Promise<void>;
  children?: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Partial<MenuItem>>(
    initial || {
      name: "",
      description: "",
      price: 0,
      image_url: "",
      category_id: "",
      is_available: true,
      is_enabled: true,
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(data);
    setOpen(false);
    toast.success(initial ? "Item updated" : "Item added");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children || <Button>{initial ? "Edit" : "Add Item"}</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Item" : "Add Item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={data.category_id}
              onValueChange={(v) => setData({ ...data, category_id: v ?? undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={data.description || ""} onChange={(e) => setData({ ...data, description: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Price</Label>
            <Input type="number" value={data.price} onChange={(e) => setData({ ...data, price: Number(e.target.value) })} />
          </div>
          <div className="space-y-2">
            <Label>Image URL</Label>
            <Input value={data.image_url || ""} onChange={(e) => setData({ ...data, image_url: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={data.is_available} onCheckedChange={(v) => setData({ ...data, is_available: v })} />
            <Label>Available</Label>
          </div>
          <Button type="submit" className="w-full">Save</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
