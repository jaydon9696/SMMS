export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  items?: MenuItem[];
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_enabled: boolean;
  sort_order: number;
}

export interface OrderItem {
  menu_item_id: string;
  quantity: number;
  notes?: string | null;
}

export interface OrderItemRead {
  id: string;
  menu_item_id: string;
  menu_item_name: string;
  menu_item_image_url: string | null;
  quantity: number;
  unit_price: number;
  notes: string | null;
}

export interface Order {
  id: string;
  order_number: string;
  table_id: string;
  order_type: string;
  status: string;
  payment_method: string;
  payment_status: string;
  notes: string | null;
  total_amount: number;
  items: OrderItemRead[];
  created_at: string;
}

export interface Table {
  id: string;
  number: number;
  is_standing: boolean;
  is_active: boolean;
  status?: string | null;
  order_id?: string | null;
  total_amount?: number | null;
}

export interface DashboardSummary {
  today_revenue: number;
  orders_today: number;
  pending: number;
  preparing: number;
  ready: number;
  completed: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
  notes: string;
}
