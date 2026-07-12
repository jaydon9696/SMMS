export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export type OrderSource = "table" | "standing";
export type PaymentMethod = "cash" | "pay_at_counter";

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  is_available: boolean;
  is_vegetarian: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  items: MenuItem[];
  created_at: string;
  updated_at: string;
}

export interface RestaurantTable {
  id: string;
  number: number;
  name: string | null;
  capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  menu_item_id: string;
  item_name: string;
  quantity: number;
  unit_price: string;
  line_total: string;
  note: string | null;
}

export interface Order {
  id: string;
  public_id: string;
  order_number: string;
  source: OrderSource;
  table_id: string | null;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: "unpaid" | "paid";
  customer_note: string | null;
  total_amount: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  items: OrderItem[];
}

export interface DashboardSummary {
  business_date: string;
  revenue: string;
  orders: number;
  pending: number;
  preparing: number;
  ready: number;
  completed: number;
  occupied_tables: number;
  standing_orders: number;
}

export interface DailyReport {
  business_date: string;
  revenue: string;
  order_count: number;
  by_status: Partial<Record<OrderStatus, number>>;
  payments: Array<{ method: PaymentMethod; orders: number; amount: string }>;
  popular_items: Array<{ name: string; quantity: number; revenue: string }>;
}

export interface ApiEnvelope<T> {
  data: T;
}

export interface ApiErrorEnvelope {
  error?: {
    message?: string;
  };
}
