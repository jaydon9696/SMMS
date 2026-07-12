"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

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
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, formatCurrency, uploadMenuImage } from "@/services/api";
import type { MenuCategory, MenuItem } from "@/types/domain";

interface ItemDraft {
  id?: string;
  category_id: string;
  name: string;
  description: string;
  price: string;
  image_url: string;
  is_available: boolean;
  is_vegetarian: boolean;
}

const emptyItem: ItemDraft = {
  category_id: "",
  name: "",
  description: "",
  price: "",
  image_url: "",
  is_available: true,
  is_vegetarian: true,
};

export function MenuManager() {
  const queryClient = useQueryClient();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [itemOpen, setItemOpen] = useState(false);
  const [itemDraft, setItemDraft] = useState<ItemDraft>(emptyItem);
  const [deleteTarget, setDeleteTarget] = useState<
    { type: "category" | "item"; id: string; name: string } | undefined
  >();
  const categories = useQuery({
    queryKey: ["menu-categories"],
    queryFn: () => apiRequest<MenuCategory[]>("/menu/categories"),
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["menu-categories"] });
  const createCategory = useMutation({
    mutationFn: () =>
      apiRequest<MenuCategory>("/menu/categories", {
        method: "POST",
        body: JSON.stringify({
          name: categoryName,
          description: categoryDescription || null,
          is_active: true,
          display_order: categories.data?.length ?? 0,
        }),
      }),
    onSuccess: () => {
      setCategoryOpen(false);
      setCategoryName("");
      setCategoryDescription("");
      refresh();
    },
  });
  const updateCategory = useMutation({
    mutationFn: ({
      category,
      isActive,
    }: {
      category: MenuCategory;
      isActive: boolean;
    }) =>
      apiRequest<MenuCategory>(`/menu/categories/${category.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: isActive }),
      }),
    onSuccess: refresh,
  });
  const saveItem = useMutation({
    mutationFn: () =>
      apiRequest<MenuItem>(
        itemDraft.id ? `/menu/items/${itemDraft.id}` : "/menu/items",
        {
          method: itemDraft.id ? "PATCH" : "POST",
          body: JSON.stringify({
            category_id: itemDraft.category_id,
            name: itemDraft.name,
            description: itemDraft.description || null,
            price: itemDraft.price,
            image_url: itemDraft.image_url || null,
            is_available: itemDraft.is_available,
            is_vegetarian: itemDraft.is_vegetarian,
            display_order: 0,
          }),
        },
      ),
    onSuccess: () => {
      setItemOpen(false);
      setItemDraft(emptyItem);
      refresh();
    },
  });
  const uploadImage = useMutation({
    mutationFn: uploadMenuImage,
    onSuccess: (result) =>
      setItemDraft((draft) => ({ ...draft, image_url: result.url })),
  });
  const deleteEntry = useMutation({
    mutationFn: (target: NonNullable<typeof deleteTarget>) =>
      apiRequest<void>(
        target.type === "item"
          ? `/menu/items/${target.id}`
          : `/menu/categories/${target.id}`,
        { method: "DELETE" },
      ),
    onSuccess: () => {
      setDeleteTarget(undefined);
      refresh();
    },
  });

  function editItem(item: MenuItem) {
    setItemDraft({
      id: item.id,
      category_id: item.category_id,
      name: item.name,
      description: item.description ?? "",
      price: item.price,
      image_url: item.image_url ?? "",
      is_available: item.is_available,
      is_vegetarian: item.is_vegetarian,
    });
    setItemOpen(true);
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Catalog management</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Menu</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCategoryOpen(true)}>
            <Plus className="size-4" /> Category
          </Button>
          <Button
            onClick={() => {
              setItemDraft({
                ...emptyItem,
                category_id: categories.data?.[0]?.id ?? "",
              });
              setItemOpen(true);
            }}
            disabled={!categories.data?.length}
          >
            <Plus className="size-4" /> Menu item
          </Button>
        </div>
      </div>

      {categories.isLoading ? (
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : categories.data?.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="p-12 text-center">
            <p className="font-medium">Start by creating a category.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Categories keep the customer menu fast to browse.
            </p>
            <Button className="mt-5" onClick={() => setCategoryOpen(true)}>
              Create category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-6">
          {categories.data?.map((category) => (
            <section key={category.id} className="rounded-xl border bg-card">
              <div className="flex flex-col justify-between gap-3 border-b p-5 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">{category.name}</h2>
                    <Badge variant={category.is_active ? "secondary" : "outline"}>
                      {category.is_active ? "Visible" : "Hidden"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {category.description ?? `${category.items.length} menu items`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={category.is_active}
                      onCheckedChange={(checked) =>
                        updateCategory.mutate({ category, isActive: checked })
                      }
                    />
                    Enabled
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${category.name}`}
                    onClick={() =>
                      setDeleteTarget({
                        type: "category",
                        id: category.id,
                        name: category.name,
                      })
                    }
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                {category.items.length === 0 && (
                  <div className="col-span-full rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                    No items in this category.
                  </div>
                )}
                {category.items.map((item) => (
                  <article
                    key={item.id}
                    className="flex gap-4 rounded-xl border bg-background p-4"
                  >
                    <div className="grid size-16 shrink-0 place-items-center rounded-lg bg-muted">
                      <ImageIcon className="size-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="truncate font-medium">{item.name}</h3>
                          <p className="mt-1 font-semibold">
                            {formatCurrency(item.price)}
                          </p>
                        </div>
                        <div className="flex">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Edit ${item.name}`}
                            onClick={() => editItem(item)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete ${item.name}`}
                            onClick={() =>
                              setDeleteTarget({
                                type: "item",
                                id: item.id,
                                name: item.name,
                              })
                            }
                          >
                            <Trash2 className="size-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <Badge
                        className="mt-3"
                        variant={item.is_available ? "secondary" : "outline"}
                      >
                        {item.is_available ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New category</DialogTitle>
            <DialogDescription>
              Group related menu items for easier browsing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                value={categoryDescription}
                onChange={(event) => setCategoryDescription(event.target.value)}
              />
            </div>
            <Button
              className="w-full"
              disabled={!categoryName.trim() || createCategory.isPending}
              onClick={() => createCategory.mutate()}
            >
              Save category
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={itemOpen} onOpenChange={setItemOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{itemDraft.id ? "Edit menu item" : "New menu item"}</DialogTitle>
            <DialogDescription>
              Prices and availability are validated again when an order is placed.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Category</Label>
              <Select
                value={itemDraft.category_id}
                onValueChange={(value) =>
                  setItemDraft((draft) => ({ ...draft, category_id: value ?? "" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.data?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-name">Name</Label>
              <Input
                id="item-name"
                value={itemDraft.name}
                onChange={(event) =>
                  setItemDraft((draft) => ({ ...draft, name: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-price">Price</Label>
              <Input
                id="item-price"
                type="number"
                min="0"
                step="0.01"
                value={itemDraft.price}
                onChange={(event) =>
                  setItemDraft((draft) => ({ ...draft, price: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="item-description">Description</Label>
              <Textarea
                id="item-description"
                value={itemDraft.description}
                onChange={(event) =>
                  setItemDraft((draft) => ({
                    ...draft,
                    description: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="item-image">Cloudinary image URL</Label>
              <Input
                id="item-image"
                type="url"
                value={itemDraft.image_url}
                onChange={(event) =>
                  setItemDraft((draft) => ({
                    ...draft,
                    image_url: event.target.value,
                  }))
                }
              />
              <Input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                aria-label="Upload menu image"
                disabled={uploadImage.isPending}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) uploadImage.mutate(file);
                }}
              />
              {uploadImage.isPending && (
                <p className="text-xs text-muted-foreground">Uploading image…</p>
              )}
              {uploadImage.isError && (
                <p className="text-xs text-destructive">
                  {uploadImage.error.message}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>Available</Label>
              <Switch
                checked={itemDraft.is_available}
                onCheckedChange={(checked) =>
                  setItemDraft((draft) => ({ ...draft, is_available: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>Vegetarian</Label>
              <Switch
                checked={itemDraft.is_vegetarian}
                onCheckedChange={(checked) =>
                  setItemDraft((draft) => ({ ...draft, is_vegetarian: checked }))
                }
              />
            </div>
            {saveItem.isError && (
              <p className="text-sm text-destructive sm:col-span-2">
                {saveItem.error.message}
              </p>
            )}
            <Button
              className="sm:col-span-2"
              disabled={
                !itemDraft.name.trim() ||
                !itemDraft.category_id ||
                Number(itemDraft.price) < 0 ||
                saveItem.isPending
              }
              onClick={() => saveItem.mutate()}
            >
              Save menu item
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This hides it from active operations while preserving historical orders.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteTarget && deleteEntry.mutate(deleteTarget)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
