import React, { useEffect, useState } from 'react';
import { Truck, MapPin, Phone, CheckCircle, Navigation, RefreshCw, AlertCircle } from 'lucide-react';
import { Order, Courier } from '../types';
import { api } from '../api';
import { hapticImpact, hapticNotification } from '../telegram';

export const CourierDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);

  const loadData = async () => {
    try {
      const [ordersData, couriersData] = await Promise.all([
        api.getOrders({ limit: 40 }),
        api.getCouriers()
      ]);
      setOrders(ordersData);
      setCouriers(couriersData);
      if (couriersData.length > 0 && !selectedCourierId) {
        setSelectedCourierId(couriersData[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    hapticImpact('medium');
    setIsUpdating(orderId);
    try {
      await api.updateOrderStatus(orderId, newStatus, selectedCourierId);
      hapticNotification('success');
      await loadData();
    } catch (e) {
      alert("Holatni o'zgartirishda xatolik yuz berdi");
    } finally {
      setIsUpdating(null);
    }
  };

  const openInMap = (order: Order) => {
    hapticImpact('light');
    if (order.delivery_lat && order.delivery_lng) {
      window.open(
        `https://yandex.uz/maps/?pt=${order.delivery_lng},${order.delivery_lat}&z=16&l=map`,
        '_blank'
      );
    } else {
      window.open(
        `https://yandex.uz/maps/?text=${encodeURIComponent(order.delivery_address)}`,
        '_blank'
      );
    }
  };

  const activeOrders = orders.filter(o => o.status !== 'yetkazildi' && o.status !== 'bekor');
  const finishedOrders = orders.filter(o => o.status === 'yetkazildi');

  return (
    <div className="max-w-2xl mx-auto px-3.5 sm:px-4 py-4 space-y-4 w-full overflow-x-hidden">
      {/* Top Banner */}
      <div className="bg-gray-900 text-white rounded-3xl p-4 sm:p-5 shadow-lg w-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center text-xl shrink-0">
              🛵
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-base font-extrabold truncate">Kuryer Ish Paneli</h2>
              <p className="text-xs text-gray-400 truncate">Yetkazib berish xizmati</p>
            </div>
          </div>
          <button
            onClick={() => { hapticImpact('light'); loadData(); }}
            className="p-2 rounded-xl bg-gray-800 text-gray-300 hover:text-white shrink-0 ml-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Select Courier Identity */}
        <div className="bg-gray-800/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-gray-300 font-medium shrink-0">Kuryer:</span>
          <select
            value={selectedCourierId}
            onChange={(e) => setSelectedCourierId(Number(e.target.value))}
            className="bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-700 outline-none max-w-full flex-1"
          >
            {couriers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.vehicle_type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
          <span className="text-xl font-black text-red-600">{activeOrders.length}</span>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Faol buyurtmalar</p>
        </div>
        <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
          <span className="text-xl font-black text-emerald-600">{finishedOrders.length}</span>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Yetkazilganlar</p>
        </div>
      </div>

      {/* Orders Stream */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">
          Yetkazish uchun buyurtmalar:
        </h3>

        {activeOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 text-gray-400 text-xs">
            Hozircha faol buyurtmalar yo'q 👍
          </div>
        ) : (
          activeOrders.map(order => {
            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3 w-full overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-extrabold text-sm text-gray-900 break-all">
                      #{order.order_number}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      order.status === 'yangi'
                        ? 'bg-blue-100 text-blue-700'
                        : order.status === 'kuryerda'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs font-black text-red-600 shrink-0">
                    {order.total_amount.toLocaleString()} so'm
                  </span>
                </div>

                {/* Customer & Location */}
                <div className="space-y-1.5 text-xs text-gray-600 bg-gray-50 rounded-xl p-3 w-full">
                  <div className="flex justify-between items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 break-words flex-1 min-w-0">
                      {order.customer_name}
                    </span>
                    <a
                      href={`tel:${order.customer_phone}`}
                      className="flex items-center gap-1 text-red-600 font-bold bg-white px-2 py-1 rounded-lg border border-red-100 shadow-xs shrink-0"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{order.customer_phone}</span>
                    </a>
                  </div>
                  <div className="flex items-start gap-1.5 text-gray-700 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                    <span className="break-words min-w-0 flex-1">{order.delivery_address}</span>
                  </div>
                  {order.delivery_notes && (
                    <p className="text-[11px] text-gray-400 italic break-words">
                      Izoh: {order.delivery_notes}
                    </p>
                  )}
                </div>

                {/* Products list summary */}
                <div className="text-[11px] text-gray-500 flex flex-wrap gap-1">
                  {order.items.map(item => (
                    <span key={item.id} className="bg-gray-100 px-2 py-0.5 rounded-md break-words max-w-full">
                      {item.product_name} ({item.quantity} {item.unit})
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
                  <button
                    onClick={() => openInMap(order)}
                    className="flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-2 rounded-xl font-bold text-xs transition-colors truncate"
                  >
                    <Navigation className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">Xaritada ochish</span>
                  </button>

                  {order.status === 'yangi' || order.status === 'tasdiqlandi' ? (
                    <button
                      onClick={() => handleStatusChange(order.id, 'kuryerda')}
                      disabled={isUpdating === order.id}
                      className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white py-2.5 px-2 rounded-xl font-bold text-xs shadow-md shadow-red-500/20 active:scale-95 transition-all truncate"
                    >
                      <Truck className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Yo'lga chiqdim</span>
                    </button>
                  ) : order.status === 'kuryerda' ? (
                    <button
                      onClick={() => handleStatusChange(order.id, 'yetkazildi')}
                      disabled={isUpdating === order.id}
                      className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-2 rounded-xl font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all truncate"
                    >
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Yetkazildi!</span>
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
