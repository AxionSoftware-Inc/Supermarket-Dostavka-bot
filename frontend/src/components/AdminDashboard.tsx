import React, { useEffect, useState } from 'react';
import {
  Package,
  TrendingUp,
  Users,
  ShoppingBag,
  RefreshCw,
  Truck,
  UserPlus,
  Trash2,
  Phone,
  AtSign,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Order, Courier } from '../types';
import { api } from '../api';
import { hapticImpact, hapticNotification } from '../telegram';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('active'); // Default: ONLY active orders
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilterMenu, setShowFilterMenu] = useState<boolean>(false);
  const [showStatsDetail, setShowStatsDetail] = useState<boolean>(false);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
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
        api.getOrders({ limit: 60 }),
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

  // Filter orders: Default 'active' filters out delivered and cancelled
  const activeCount = orders.filter(o => o.status !== 'yetkazildi' && o.status !== 'bekor').length;
  const filteredOrders = orders.filter(o => {
    // 1. Status Filter
    if (selectedFilter === 'active') {
      if (o.status === 'yetkazildi' || o.status === 'bekor') return false;
    } else if (selectedFilter !== 'all') {
      if (o.status !== selectedFilter) return false;
    }

    // 2. Search Query (order_number, customer_name, customer_phone, delivery_address)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNumber = o.order_number?.toLowerCase().includes(q);
      const matchName = o.customer_name?.toLowerCase().includes(q);
      const matchPhone = o.customer_phone?.toLowerCase().includes(q);
      const matchAddress = o.delivery_address?.toLowerCase().includes(q);
      if (!matchNumber && !matchName && !matchPhone && !matchAddress) return false;
    }

    return true;
  });

  const filterOptions = [
    { id: 'active', label: 'Faol buyurtmalar', count: activeCount, color: 'text-amber-700 bg-amber-50' },
    { id: 'yangi', label: 'Yangi', count: orders.filter(o => o.status === 'yangi').length, color: 'text-yellow-700 bg-yellow-50' },
    { id: 'tasdiqlandi', label: 'Tasdiqlangan', count: orders.filter(o => o.status === 'tasdiqlandi').length, color: 'text-blue-700 bg-blue-50' },
    { id: 'kuryerda', label: 'Kuryerda', count: orders.filter(o => o.status === 'kuryerda').length, color: 'text-purple-700 bg-purple-50' },
    { id: 'yetkazildi', label: 'Yetkazilgan', count: orders.filter(o => o.status === 'yetkazildi').length, color: 'text-emerald-700 bg-emerald-50' },
    { id: 'bekor', label: 'Bekor qilingan', count: orders.filter(o => o.status === 'bekor').length, color: 'text-red-700 bg-red-50' },
    { id: 'all', label: 'Barchasi (Arxiv)', count: orders.length, color: 'text-gray-700 bg-gray-100' },
  ];

  return (
    <div className="p-3 sm:p-4 max-w-xl mx-auto w-full space-y-3 overflow-x-hidden">
      {/* Sleek Header & Tab Switcher */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-2xl">
          <button
            onClick={() => { hapticImpact('light'); setActiveTab('orders'); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'orders' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Buyurtmalar
            {activeCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-red-600 text-white text-[10px] rounded-full">
                {activeCount}
              </span>
            )}
          </button>
          <button
            onClick={() => { hapticImpact('light'); setActiveTab('couriers'); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'couriers' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Kuryerlar ({couriers.length})
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {activeTab === 'orders' && (
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                selectedFilter !== 'active' || searchQuery
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
              title="Filtr"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>
                {selectedFilter === 'active' ? 'Faol' : filterOptions.find(f => f.id === selectedFilter)?.label}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
          )}

          <button
            onClick={() => { hapticImpact('light'); loadAll(); }}
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 transition-all shrink-0"
            title="Yangilash"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-red-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Dropdown / Search Modal (Tucked cleanly inside icon menu) */}
      {showFilterMenu && activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-3 shadow-lg space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="text-xs font-extrabold text-gray-900">Filtr va qidiruv</span>
            <button
              onClick={() => setShowFilterMenu(false)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buyurtma #, mijoz ismi yoki tel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-900 outline-none focus:border-red-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Options */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {filterOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => {
                  hapticImpact('light');
                  setSelectedFilter(opt.id);
                  setShowFilterMenu(false);
                }}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  selectedFilter === opt.id
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-gray-200 shrink-0">
                  {opt.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Slim Minimalist Stats Ribbon (Replaces 4 bulky cards) */}
      <div className="bg-white rounded-2xl border border-gray-100 p-2.5 shadow-xs flex items-center justify-between text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-gray-500 text-[11px]">Faol:</span>
            <span className="font-extrabold text-gray-900">{activeCount} ta</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 text-[11px]">Tushum:</span>
            <span className="font-extrabold text-emerald-600">
              {stats ? `${Math.round(Number(stats.total_revenue) / 1000).toLocaleString()}k` : '...'} so'm
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 text-[11px]">Kuryerlar:</span>
            <span className="font-extrabold text-purple-700">
              {couriers.filter(c => c.is_active).length}/{couriers.length}
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowStatsDetail(!showStatsDetail)}
          className="text-gray-400 hover:text-gray-600 p-1"
          title="Batafsil"
        >
          {showStatsDetail ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expandable Full Stats details (Only if admin wants to see) */}
      {showStatsDetail && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 animate-in fade-in duration-150">
          <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between text-gray-400 mb-0.5">
              <span className="text-[10px] font-bold uppercase">Jami buyurtma</span>
              <Package className="w-3.5 h-3.5 text-red-500" />
            </div>
            <div className="text-base font-black text-gray-900">{stats?.total_orders ?? '...'}</div>
            <div className="text-[10px] text-amber-600 font-medium">{stats?.active_orders ?? 0} ta faol</div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between text-gray-400 mb-0.5">
              <span className="text-[10px] font-bold uppercase">Jami tushum</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-sm font-black text-emerald-600">
              {stats ? `${Number(stats.total_revenue).toLocaleString()}` : '...'}
            </div>
            <div className="text-[10px] text-gray-400">so'm</div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between text-gray-400 mb-0.5">
              <span className="text-[10px] font-bold uppercase">Mahsulotlar</span>
              <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-base font-black text-gray-900">{stats?.products_count ?? '...'}</div>
            <div className="text-[10px] text-emerald-600 font-medium">Barchasi faol</div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between text-gray-400 mb-0.5">
              <span className="text-[10px] font-bold uppercase">Kuryerlar</span>
              <Users className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <div className="text-base font-black text-gray-900">{couriers.length}</div>
            <div className="text-[10px] text-purple-600 font-medium">{couriers.filter(c => c.is_active).length} ta faol</div>
          </div>
        </div>
      )}

      {/* COURIERS TAB */}
      {activeTab === 'couriers' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700">Kuryerlar ro'yxati</span>
            <button
              onClick={() => setShowAddCourier(!showAddCourier)}
              className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{showAddCourier ? "Yopish" : "Qo'shish"}</span>
            </button>
          </div>

          {/* Add Courier Form */}
          {showAddCourier && (
            <form onSubmit={handleAddCourier} className="bg-white p-3.5 rounded-2xl border border-red-100 shadow-sm space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Ism familiyasi *</label>
                  <input
                    type="text"
                    required
                    placeholder="Sardor Aliyev"
                    value={newCourierName}
                    onChange={(e) => setNewCourierName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Telefon raqami *</label>
                  <input
                    type="text"
                    required
                    placeholder="+998 90 123 45 67"
                    value={newCourierPhone}
                    onChange={(e) => setNewCourierPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Telegram Username</label>
                  <div className="relative">
                    <AtSign className="w-3 h-3 text-gray-400 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      placeholder="kuryer_username"
                      value={newCourierUsername}
                      onChange={(e) => setNewCourierUsername(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-7 pr-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-red-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Transport turi</label>
                  <select
                    value={newCourierVehicle}
                    onChange={(e) => setNewCourierVehicle(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-1.5 text-xs text-gray-900 outline-none focus:border-red-500"
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
                  className="px-2.5 py-1 text-xs text-gray-400 hover:text-gray-600"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs"
                >
                  {isSubmitting ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          )}

          {/* Courier List */}
          <div className="space-y-1.5">
            {couriers.map((c) => (
              <div key={c.id} className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base shrink-0">
                    {c.vehicle_type === 'moto' ? '🛵' : c.vehicle_type === 'bike' ? '🚲' : c.vehicle_type === 'walking' ? '🚶' : '🚗'}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-gray-900 truncate">{c.name}</span>
                      <span className={`text-[9px] font-bold px-1 py-0.2 rounded-full uppercase ${
                        c.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {c.is_active ? 'Faol' : 'Nofaol'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                      <a href={`tel:${c.phone}`} className="hover:underline font-medium text-gray-600">{c.phone}</a>
                      {c.username && <span className="text-blue-600 font-medium truncate">@{c.username}</span>}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteCourier(c.id, c.name)}
                  className="p-1.5 text-gray-300 hover:text-red-600 transition-colors shrink-0"
                  title="O'chirish"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-2">
          {/* Active Filter Notice if non-active is selected */}
          {selectedFilter !== 'active' && (
            <div className="flex items-center justify-between bg-gray-100 px-3 py-1.5 rounded-xl text-xs text-gray-600">
              <span>
                Ko'rsatilmoqda: <strong className="text-gray-900">{filterOptions.find(f => f.id === selectedFilter)?.label}</strong> ({filteredOrders.length})
              </span>
              <button
                onClick={() => { setSelectedFilter('active'); setSearchQuery(''); }}
                className="text-red-600 font-bold hover:underline text-[11px]"
              >
                Faqat faollarni ko'rish
              </button>
            </div>
          )}

          {/* Orders List */}
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center py-8 text-gray-400 text-xs">Yuklanmoqda...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 p-4">
                <Package className="w-8 h-8 text-gray-300 mx-auto mb-1.5" />
                <p className="text-xs text-gray-600 font-semibold">Buyurtmalar yo'q</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {selectedFilter === 'active' ? 'Ayni damda yangi yoki faol buyurtma mavjud emas' : 'Tanlangan filtr bo\'yicha buyurtma topilmadi'}
                </p>
              </div>
            ) : (
              filteredOrders.map(order => {
                const isExpanded = expandedOrderId === order.id;
                const statusBadge =
                  order.status === 'yangi' ? { bg: 'bg-amber-100 text-amber-800', label: '⚡️ Yangi' } :
                  order.status === 'tasdiqlandi' ? { bg: 'bg-blue-100 text-blue-800', label: 'Tasdiqlandi' } :
                  order.status === 'kuryerda' ? { bg: 'bg-purple-100 text-purple-800', label: '🛵 Kuryerda' } :
                  order.status === 'yetkazildi' ? { bg: 'bg-emerald-100 text-emerald-800', label: '✅ Yetkazildi' } :
                  { bg: 'bg-gray-100 text-gray-700', label: '❌ Bekor' };

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-gray-100 p-3 shadow-xs space-y-2 transition-all hover:border-gray-200"
                  >
                    {/* Header Row: Order Number, Status, Time, Total Amount */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-black text-xs text-gray-900">#{order.order_number}</span>
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${statusBadge.bg}`}>
                          {statusBadge.label}
                        </span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(order.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-gray-900">
                          {order.total_amount.toLocaleString()} so'm
                        </span>
                      </div>
                    </div>

                    {/* Customer & Address Row (High Signal, No Fluff) */}
                    <div className="flex items-start justify-between gap-2 text-xs">
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 truncate">{order.customer_name}</span>
                          <a href={`tel:${order.customer_phone}`} className="text-red-600 font-semibold text-[11px] hover:underline">
                            {order.customer_phone}
                          </a>
                        </div>
                        <div className="text-gray-500 text-[11px] flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                          <span className="truncate">{order.delivery_address}</span>
                        </div>
                      </div>

                      {/* Expand Products Button */}
                      <button
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        className="text-[11px] font-semibold text-gray-400 hover:text-gray-700 flex items-center gap-0.5 shrink-0 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100"
                      >
                        <span>{order.items?.length || 0} ta mahsulot</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>

                    {/* Expandable Items List */}
                    {isExpanded && (
                      <div className="bg-gray-50 rounded-xl p-2.5 text-[11px] space-y-1.5 border border-gray-100 animate-in fade-in duration-100">
                        <div className="font-bold text-gray-700 text-[10px] uppercase tracking-wider">
                          Mahsulotlar tarkibi:
                        </div>
                        <div className="space-y-1">
                          {order.items?.map(it => (
                            <div key={it.id} className="flex justify-between items-center text-gray-600">
                              <span className="truncate flex-1">• {it.product_name}</span>
                              <span className="font-medium shrink-0 ml-2">
                                {it.quantity} {it.unit} × {it.price.toLocaleString()} so'm
                              </span>
                            </div>
                          ))}
                        </div>
                        {order.delivery_notes && (
                          <div className="pt-1 border-t border-gray-200 text-gray-500 italic">
                            Izoh: {order.delivery_notes}
                          </div>
                        )}
                        <div className="pt-1 border-t border-gray-200 flex justify-between text-gray-500 text-[10px]">
                          <span>To'lov usuli: <strong>{order.payment_method.toUpperCase()}</strong></span>
                          <span>Holati: <strong>{order.payment_status}</strong></span>
                        </div>
                      </div>
                    )}

                    {/* Action & Courier Selector Bar */}
                    <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-gray-50">
                      {/* Compact Courier Dropdown */}
                      <div className="flex items-center gap-1 flex-1 min-w-[130px] max-w-[200px]">
                        <Truck className="w-3 h-3 text-gray-400 shrink-0" />
                        <select
                          value={order.courier_id || ''}
                          onChange={(e) => {
                            const cid = e.target.value ? Number(e.target.value) : undefined;
                            handleStatusChange(order.id, order.status, cid);
                          }}
                          className="bg-gray-50 text-gray-800 text-[11px] rounded-lg px-1.5 py-1 font-medium border border-gray-200 outline-none w-full truncate"
                        >
                          <option value="">Kuryer: tanlanmagan</option>
                          {couriers.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.username ? `(@${c.username})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Primary Quick Status Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        {order.status === 'yangi' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'tasdiqlandi', order.courier_id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg active:scale-95 transition-all flex items-center gap-1 shadow-xs"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Tasdiqlash</span>
                          </button>
                        )}

                        {order.status !== 'yetkazildi' && order.status !== 'bekor' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'yetkazildi', order.courier_id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg active:scale-95 transition-all shadow-xs"
                          >
                            Yetkazildi
                          </button>
                        )}

                        {order.status !== 'bekor' && order.status !== 'yetkazildi' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'bekor')}
                            className="text-gray-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                            title="Bekor qilish"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
