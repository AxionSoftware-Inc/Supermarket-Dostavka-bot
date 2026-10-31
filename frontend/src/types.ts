export interface Category {
  id: number;
  name_uz: string;
  name_ru: string;
  icon: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
}

export interface Product {
  id: number;
  category_id: number;
  name_uz: string;
  name_ru: string;
  description?: string;
  price: number;
  discount_price?: number | null;
  unit: string;
  image_url?: string;
  is_popular: boolean;
  is_available: boolean;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  id: number;
  product_id?: number;
  product_name: string;
  price: number;
  quantity: number;
  unit: string;
  subtotal: number;
}

export interface Courier {
  id: number;
  name: string;
  phone: string;
  vehicle_type: string;
  is_active: boolean;
}

export interface Order {
  id: number;
  order_number: string;
  telegram_user_id?: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_lat?: number;
  delivery_lng?: number;
  delivery_notes?: string;
  payment_method: string;
  payment_status: string;
  items_total: number;
  delivery_fee: number;
  discount_amount: number;
  total_amount: number;
  status: 'yangi' | 'tasdiqlandi' | 'yigilyapti' | 'kuryerda' | 'yetkazildi' | 'bekor';
  courier_id?: number;
  courier?: Courier;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface StoreSettings {
  store_name: string;
  phone: string;
  address: string;
  is_open: boolean;
  min_order_amount: number;
  free_delivery_threshold: number;
  base_delivery_fee: number;
  delivery_time_text: string;
}
