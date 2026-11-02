import React, { useEffect, useState } from 'react';
import { Package, TrendingUp, Users, ShoppingBag, RefreshCw, Truck, UserPlus, Trash2, Phone, AtSign } from 'lucide-react';
import { Order, Courier } from '../types';
import { api } from '../api';
import { hapticImpact, hapticNotification } from '../telegram';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'orders' | 'couriers'>('orders');
  const [isLoading, setIsLoading] = useState(true);

  // New courier form state
  const [showAddCourier, setShowAddCourier] = useState(false);
  const [newCourierName, setNewCourierName] = useState('');
  const [newCourierPhone, setNewCourierPhone] = useState('');
  const [newCourierUsername, setNewCourierUsername] = useState('');
  const [newCourierVehicle, setNewCourierVehicle] = useState('car');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAll = async () => {
    try {
      const [statsData, ordersData, couriersData] = await Promise.all([
        api.getAdminStats(),
        api.getOrders({ limit: 50 }),
        api.getCouriers()
      ]);
      setStats(statsData);
      setOrders(ordersData);
      setCouriers(couriersData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (orderId: number, status: string, courierId?: number) => {
    hapticImpact('medium');
    try {
      await api.updateOrderStatus(orderId, status, courierId);
      hapticNotification('success');
      await loadAll();
    } catch (e) {
      alert("Holatni yangilab bo'lmadi");
    }
  };

  const handleAddCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourierName.trim() || !newCourierPhone.trim()) {
      alert("Iltimos, kuryer ismi va telefon raqamini kiriting");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.saveCourier({
        name: newCourierName.trim(),
        phone: newCourierPhone.trim(),
        username: newCourierUsername.trim().replace(/^@/, '') || undefined,
        vehicle_type: newCourierVehicle
      });
      hapticNotification('success');
      setNewCourierName('');
      setNewCourierPhone('');
      setNewCourierUsername('');
      setShowAddCourier(false);
      await loadAll();
    } catch (err: any) {
      alert(err.message || "Kuryerni qo'shib bo'lmadi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourier = async (courierId: number, courierName: string) => {
    if (!confirm(`Haqiqatan ham ${courierName} kuryerni o'chirmoqchimisiz?`)) return;
    try {
      await api.deleteCourier(courierId);
      hapticNotification('success');
      await loadAll();
    } catch (e) {
      alert("Kuryerni o'chirib bo'lmadi");
    }
  };

  const filteredOrders = orders.filter(o => {
    if (selectedFilter === 'all') return true;
    return o.status === selectedFilter;
  });

  return (
    <div className="p-3.5 sm:p-4 max-w-2xl mx-auto w-full space-y-4 overflow-x-hidden">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-gray-900">Do'kon Boshqaruvi</h1>
          <p className="text-xs text-gray-500">Supermarket admin paneli (@Software_engineerings)</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'orders' ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700'
            }`}
          >
            📦 Buyurtmalar ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('couriers')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'couriers' ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700'
            }`}
          >
            🛵 Kuryerlar ({couriers.length})
          </button>
          <button
            onClick={() => { hapticImpact('light'); loadAll(); }}
            className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all shrink-0"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Buyurtmalar</span>
            <Package className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-xl font-black text-gray-900">{stats?.total_orders ?? '...'}</div>
          <div className="text-[10px] text-amber-600 font-semibold">{stats?.active_orders ?? 0} ta faol</div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Tushum</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-base sm:text-lg font-black text-emerald-600">
            {stats ? `${Number(stats.total_revenue).toLocaleString()}` : '...'}
          </div>
          <div className="text-[10px] text-gray-400">so'm</div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Mahsulotlar</span>
            <ShoppingBag className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-black text-gray-900">{stats?.products_count ?? '...'}</div>
          <div className="text-[10px] text-emerald-600 font-semibold">Barchasi mavjud</div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Kuryerlar</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-black text-gray-900">{couriers.length}</div>
          <div className="text-[10px] text-purple-600 font-semibold">{couriers.filter(c => c.is_active).length} ta faol</div>
        </div>
      </div>

      {/* COURIERS TAB */}
      {activeTab === 'couriers' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Kuryerlarni tayinlash va boshqarish</h2>
            <button
              onClick={() => setShowAddCourier(!showAddCourier)}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{showAddCourier ? "Yopish" : "Yangi Kuryer Qo'shish"}</span>
            </button>
          </div>

          {/* Add Courier Modal/Form */}
          {showAddCourier && (
            <form onSubmit={handleAddCourier} className="bg-white p-4 rounded-2xl border border-red-100 shadow-sm space-y-3">
              <h3 className="text-xs font-black uppercase text-red-600 tracking-wider">Yangi kuryer ma'lumotlari</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">Ism familiyasi *</label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Sardor Aliyev"
                    value={newCourierName}
                    onChange={(e) => setNewCourierName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">Telefon raqami *</label>
                  <input
                    type="text"
                    required
                    placeholder="+998 90 123 45 67"
                    value={newCourierPhone}
                    onChange={(e) => setNewCourierPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">Telegram Username</label>
                  <div className="relative">
                    <AtSign className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="kuryer_username"
                      value={newCourierUsername}
                      onChange={(e) => setNewCourierUsername(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-xs text-gray-900 outline-none focus:border-red-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">Transport turi</label>
                  <select
                    value={newCourierVehicle}
                    onChange={(e) => setNewCourierVehicle(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 outline-none focus:border-red-500"
                  >
                    <option value="car">🚗 Avtomobil</option>
                    <option value="moto">🛵 Mototsikl / Skuter</option>
                    <option value="bike">🚲 Velosiped</option>
                    <option value="walking">🚶 Piyoda</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddCourier(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
                >
                  {isSubmitting ? "Saqlanmoqda..." : "Saqlash va Tayinlash"}
                </button>
              </div>
            </form>
          )}

          {/* Courier List */}
          <div className="space-y-2">
            {couriers.map((c) => (
              <div key={c.id} className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg shrink-0">
                    {c.vehicle_type === 'moto' ? '🛵' : c.vehicle_type === 'bike' ? '🚲' : c.vehicle_type === 'walking' ? '🚶' : '🚗'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-900 truncate">{c.name}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                        c.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {c.is_active ? 'Faol' : 'Nofaol'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <a href={`tel:${c.phone}`} className="hover:underline text-gray-700 font-medium">{c.phone}</a>
                      </span>
                      {c.username && (
                        <span className="flex items-center gap-1 text-blue-600 font-medium">
                          @{c.username}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteCourier(c.id, c.name)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors shrink-0"
                  title="O'chirish"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          {/* Order Status Filters */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'all', label: 'Barchasi' },
              { id: 'yangi', label: 'Yangi ⚡️' },
              { id: 'tasdiqlandi', label: 'Tasdiqlangan' },
              { id: 'kuryerda', label: 'Kuryerda 🛵' },
              { id: 'yetkazildi', label: 'Yetkazilgan ✅' },
              { id: 'bekor', label: 'Bekor ❌' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { hapticImpact('light'); setSelectedFilter(tab.id); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedFilter === tab.id
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Orders List */}
          <div className="space-y-2.5">
            {isLoading ? (
              <div className="text-center py-10 text-gray-400 text-xs">Yuklanmoqda...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 p-6">
                <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-medium">Ushbu holatda buyurtmalar yo'q</p>
              </div>
            ) : (
              filteredOrders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-gray-900">#{order.order_number}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          order.status === 'yangi' ? 'bg-amber-100 text-amber-800' :
                          order.status === 'yetkazildi' ? 'bg-emerald-100 text-emerald-800' :
                          order.status === 'kuryerda' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'bekor' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {new Date(order.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black text-gray-900">
                        {order.total_amount.toLocaleString()} so'm
                      </div>
                      <div className="text-[10px] text-gray-500 uppercase">{order.payment_method}</div>
                    </div>
                  </div>

                  {/* Customer details */}
                  <div className="bg-gray-50 rounded-xl p-2.5 text-xs text-gray-700 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">{order.customer_name}</span>
                      <a href={`tel:${order.customer_phone}`} className="text-red-600 font-bold hover:underline">
                        {order.customer_phone}
                      </a>
                    </div>
                    <div className="text-gray-500 text-[11px] flex items-start gap-1">
                      <span>📍</span>
                      <span className="line-clamp-2">{order.delivery_address}</span>
                    </div>
                  </div>

                  {/* Actions & Courier Assignment */}
                  <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                    <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
                      <Truck className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <select
                        value={order.courier_id || ''}
                        onChange={(e) => {
                          const cid = e.target.value ? Number(e.target.value) : undefined;
                          handleStatusChange(order.id, order.status, cid);
                        }}
                        className="bg-gray-100 text-gray-800 text-xs rounded-lg px-2 py-1 font-medium border border-gray-200 outline-none w-full"
                      >
                        <option value="">Kuryer biriktirish...</option>
                        {couriers.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.phone})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-1.5 flex-wrap">
                      {order.status === 'yangi' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'tasdiqlandi', order.courier_id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all"
                        >
                          Tasdiqlash
                        </button>
                      )}
                      {order.status !== 'yetkazildi' && order.status !== 'bekor' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'yetkazildi', order.courier_id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all"
                        >
                          Yetkazildi
                        </button>
                      )}
                      {order.status !== 'bekor' && order.status !== 'yetkazildi' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'bekor')}
                          className="bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all"
                        >
                          Bekor qilish
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
