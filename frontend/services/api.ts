import axios from "axios";
import type { MenuCategory, MenuItem, Order, OrderItem, Table, DashboardSummary } from "@/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("smms_token");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("smms_refresh_token");
}

export function saveAuthToken(token: string, refreshToken: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("smms_token", token);
  localStorage.setItem("smms_refresh_token", refreshToken);
  setAuthToken(token);
}

export function removeAuthToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("smms_token");
  localStorage.removeItem("smms_refresh_token");
  setAuthToken(null);
}

if (typeof window !== "undefined") {
  const token = getAuthToken();
  if (token) setAuthToken(token);
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function fetchMenu(): Promise<MenuCategory[]> {
  const res = await api.get("/menu/items");
  return res.data.data;
}

export async function fetchCategories(): Promise<MenuCategory[]> {
  const res = await api.get("/menu/categories");
  return res.data.data;
}

export async function login(email: string, password: string) {
  const res = await api.post("/auth/login", { email, password });
  return res.data.data;
}

export async function getMe() {
  const res = await api.get("/auth/me");
  return res.data.data;
}

export async function createOrder(order: {
  table_id: string;
  items: OrderItem[];
  payment_method: string;
  notes: string | null;
}) {
  const res = await api.post("/orders", order);
  return res.data.data;
}

export async function getOrder(orderId: string) {
  const res = await api.get(`/orders/${orderId}`);
  return res.data.data;
}

export async function getOrderByNumber(orderNumber: string) {
  const res = await api.get(`/orders/number/${orderNumber}`);
  return res.data.data;
}

export async function getDashboardSummary() {
  const res = await api.get("/dashboard/summary");
  return res.data.data;
}

export async function getLiveOrders() {
  const res = await api.get("/dashboard/live-orders");
  return res.data.data;
}

export async function getTables() {
  const res = await api.get("/tables");
  return res.data.data;
}

export async function getOrders(active_only = false) {
  const res = await api.get("/orders", { params: { active_only } });
  return res.data.data;
}

export async function updateOrderStatus(orderId: string, status: string) {
  const res = await api.put(`/orders/${orderId}/status`, { status });
  return res.data.data;
}

export async function markOrderPaid(orderId: string) {
  const res = await api.post(`/orders/${orderId}/pay`);
  return res.data.data;
}

export async function getDailyReport() {
  const res = await api.get("/reports/daily");
  return res.data.data;
}

export async function getPopularItems() {
  const res = await api.get("/reports/popular-items");
  return res.data.data;
}

export async function createCategory(name: string) {
  const res = await api.post("/menu/categories", { name });
  return res.data.data;
}

export async function updateCategory(id: string, data: Partial<MenuCategory>) {
  const res = await api.put(`/menu/categories/${id}`, data);
  return res.data.data;
}

export async function deleteCategory(id: string) {
  const res = await api.delete(`/menu/categories/${id}`);
  return res.data.data;
}

export async function createItem(data: Partial<MenuItem>) {
  const res = await api.post("/menu/items", data);
  return res.data.data;
}

export async function updateItem(id: string, data: Partial<MenuItem>) {
  const res = await api.put(`/menu/items/${id}`, data);
  return res.data.data;
}

export async function deleteItem(id: string) {
  const res = await api.delete(`/menu/items/${id}`);
  return res.data.data;
}

export async function uploadImage(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post("/upload/image", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data.url;
}

export default api;
