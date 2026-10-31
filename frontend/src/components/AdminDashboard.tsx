import React, { useEffect, useState } from 'react';
import { Package, TrendingUp, Users, ShoppingBag, Clock, RefreshCw, CheckCircle2, XCircle, Truck } from 'lucide-react';
import { Order, Courier } from '../types';
import { api } from '../api';
import { hapticImpact, hapticNotification } from '../telegram';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

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

  const filteredOrders = orders.filter(o => {
    if (selectedFilter === 'all') return true;
    return o.status === selectedFilter;
  });

  return (
    <div className="max-w-2xl mx-auto px-3.5 sm:px-4 py-4 space-y-4 w-full overflow-x-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm sm:text-base font-extrabold text-gray-900 truncate">Do'kon Boshqaruv Markazi</h2>
          <p className="text-xs text-gray-500 truncate">Buyurtmalar va kuryerlar nazorati</p>
        </div>
        <button
          onClick={() => { hapticImpact('light'); loadAll(); }}
          className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 shadow-xs shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm min-w-0">
          <div className="flex items-center gap-1.5 text-red-600 mb-1">
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-bold truncate">Tushum</span>
          </div>
          <div className="text-sm font-black text-gray-900 truncate">
            {stats ? `${(stats.total_revenue / 1000).toFixed(0)}k so'm` : '...'}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm min-w-0">
          <div className="flex items-center gap-1.5 text-blue-600 mb-1">
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-bold truncate">Buyurtmalar</span>
          </div>
          <div className="text-sm font-black text-gray-900 truncate">
            {stats ? stats.total_orders : '...'}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm min-w-0">
          <div className="flex items-center gap-1.5 text-amber-600 mb-1">
            <Clock className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-bold truncate">Jarayonda</span>
          </div>
          <div className="text-sm font-black text-gray-900 truncate">
            {stats ? stats.active_orders : '...'}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm min-w-0">
          <div className="flex items-center gap-1.5 text-purple-600 mb-1">
            <Users className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-bold truncate">Kuryerlar</span>
          </div>
          <div className="text-sm font-black text-gray-900 truncate">
            {stats ? stats.couriers_count : '...'}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar text-xs w-full">
        {[
          { id: 'all', label: 'Barchasi' },
          { id: 'yangi', label: 'Yangi' },
          { id: 'tasdiqlandi', label: 'Tasdiqlangan' },
          { id: 'kuryerda', label: 'Kuryerda' },
          { id: 'yetkazildi', label: 'Yetkazildi' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { hapticImpact('light'); setSelectedFilter(tab.id); }}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap shrink-0 transition-all ${
              selectedFilter === tab.id
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 text-gray-400 text-xs">
            Ushbu toifada buyurtmalar topilmadi.
          </div>
        ) : (
          filteredOrders.map(order => (
            <div
              key={order.id}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3 w-full overflow-hidden"
            >
              {/* Top Details */}
              <div className="flex justify-between items-start gap-2 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-gray-900 break-all">#{order.order_number}</span>
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md shrink-0">
                      {order.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5 break-words">
                    {order.customer_name} • {order.customer_phone}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-black text-sm text-red-600 block">
                    {order.total_amount.toLocaleString()} so'm
                  </span>
                  <span className="block text-[10px] text-gray-400 uppercase font-semibold">
                    {order.payment_method}
                  </span>
                </div>
              </div>

              {/* Address */}
              <p className="text-xs text-gray-600 bg-gray-50 rounded-xl p-2.5 break-words">
                📍 {order.delivery_address}
                {order.delivery_notes && <span className="block text-gray-400 text-[11px] mt-0.5 break-words">Izoh: {order.delivery_notes}</span>}
              </p>

              {/* Items */}
              <div className="text-[11px] text-gray-500 space-y-0.5">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between gap-2">
                    <span className="break-words min-w-0 flex-1">• {item.product_name} ({item.quantity} {item.unit})</span>
                    <span className="shrink-0 font-medium">{item.subtotal.toLocaleString()} so'm</span>
                  </div>
                ))}
              </div>

              {/* Courier Assignment & Status Controls */}
              <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs max-w-full">
                  <Truck className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <select
                    value={order.courier_id || ''}
                    onChange={(e) => {
                      const cid = e.target.value ? Number(e.target.value) : undefined;
                      handleStatusChange(order.id, order.status, cid);
                    }}
                    className="bg-gray-100 text-gray-800 text-xs rounded-lg px-2 py-1 font-medium border border-gray-200 outline-none max-w-full"
                  >
                    <option value="">Kuryer biriktirish...</option>
                    {couriers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
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
  );
};
