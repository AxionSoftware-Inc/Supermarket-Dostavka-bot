import { Category, Product, Order, StoreSettings } from './types';

const API_BASE = '/api';

export const api = {
  // Categories
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('Kategoriyalarni yuklab boʻlmadi');
    return res.json();
  },

  // Products
  async getProducts(categoryId?: number, query?: string, popular?: boolean): Promise<Product[]> {
    const params = new URLSearchParams();
    if (categoryId) params.append('category_id', String(categoryId));
    if (query) params.append('q', query);
    if (popular) params.append('popular', 'true');

    const res = await fetch(`${API_BASE}/products?${params.toString()}`);
    if (!res.ok) throw new Error('Mahsulotlarni yuklab boʻlmadi');
    return res.json();
  },

  // Store Settings
  async getSettings(): Promise<StoreSettings> {
    const res = await fetch(`${API_BASE}/admin/settings`);
    if (!res.ok) throw new Error('Sozlamalarni yuklab boʻlmadi');
    return res.json();
  },

  // Customer Profile
  async getCustomerProfile(telegramId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/customers/${telegramId}`);
    if (!res.ok) return null;
    return res.json();
  },

  async saveCustomerProfile(profile: any): Promise<any> {
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    if (!res.ok) return null;
    return res.json();
  },

  // Orders
  async createOrder(orderData: any): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Buyurtma berishda xatolik yuz berdi');
    }
    return res.json();
  },

  async getOrders(params?: { status?: string; telegram_user_id?: string; courier_id?: number; limit?: number }): Promise<Order[]> {
    const urlParams = new URLSearchParams();
    if (params?.status) urlParams.append('status', params.status);
    if (params?.telegram_user_id) urlParams.append('telegram_user_id', params.telegram_user_id);
    if (params?.courier_id) urlParams.append('courier_id', String(params.courier_id));
    if (params?.limit) urlParams.append('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/orders?${urlParams.toString()}`);
    if (!res.ok) throw new Error('Buyurtmalarni yuklab boʻlmadi');
    return res.json();
  },

  async trackOrder(orderNumber: string): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/track/${encodeURIComponent(orderNumber)}`);
    if (!res.ok) throw new Error('Buyurtma topilmadi');
    return res.json();
  },

  async updateOrderStatus(orderId: number, status: string, courierId?: number): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, courier_id: courierId })
    });
    if (!res.ok) throw new Error('Holatni oʻzgartirib boʻlmadi');
    return res.json();
  },

  // Admin Stats
  async getAdminStats(): Promise<{
    total_orders: number;
    total_revenue: number;
    active_orders: number;
    products_count: number;
    couriers_count: number;
  }> {
    const res = await fetch(`${API_BASE}/admin/stats`);
    if (!res.ok) throw new Error('Statistikani yuklab boʻlmadi');
    return res.json();
  },

  // Couriers
  async getCouriers(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/couriers`);
    if (!res.ok) throw new Error('Kuryerlarni yuklab boʻlmadi');
    return res.json();
  }
};
