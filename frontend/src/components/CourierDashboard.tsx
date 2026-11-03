import React, { useEffect, useState } from 'react';
import {
  Truck,
  MapPin,
  Phone,
  CheckCircle,
  Navigation,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Package,
  Clock
} from 'lucide-react';
import { Order, Courier } from '../types';
import { api } from '../api';
import { hapticImpact, hapticNotification } from '../telegram';

export const CourierDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);

  const loadData = async () => {
    try {
      const [ordersData, couriersData] = await Promise.all([
        api.getOrders({ limit: 50 }),
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

  // Active orders: pending, confirmed, or on the way (NOT delivered or cancelled)
  const activeOrders = orders.filter(o => o.status !== 'yetkazildi' && o.status !== 'bekor');
  // Completed orders
  const completedOrders = orders.filter(o => o.status === 'yetkazildi');

  const currentList = activeTab === 'active' ? activeOrders : completedOrders;

  return (
    <div className="max-w-xl mx-auto px-3 sm:px-4 py-3 space-y-3 w-full overflow-x-hidden">
      {/* Sleek, Compact Top Bar (No oversized bulky banners) */}
      <div className="bg-white rounded-2xl p-2.5 border border-gray-100 shadow-xs flex items-center justify-between gap-2">
        {/* Courier Selector Pill */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="text-base shrink-0">🛵</span>
          <select
            value={selectedCourierId}
            onChange={(e) => setSelectedCourierId(Number(e.target.value))}
            className="bg-gray-50 text-gray-900 text-xs font-bold px-2 py-1.5 rounded-xl border border-gray-200 outline-none max-w-full flex-1 truncate"
          >
            {couriers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.vehicle_type === 'moto' ? 'Skuter' : c.vehicle_type === 'bike' ? 'Velik' : c.vehicle_type === 'walking' ? 'Piyoda' : 'Mashina'})
              </option>
            ))}
          </select>
        </div>

        {/* Tab switchers: Faol vs Yetkazilgan */}
        <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-xl shrink-0">
          <button
            onClick={() => { hapticImpact('light'); setActiveTab('active'); }}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'active' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'
            }`}
          >
            Faol ({activeOrders.length})
          </button>
          <button
            onClick={() => { hapticImpact('light'); setActiveTab('completed'); }}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'completed' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'
            }`}
          >
            Tarix ({completedOrders.length})
          </button>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => { hapticImpact('light'); loadData(); }}
          className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 shrink-0"
          title="Yangilash"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-red-600' : ''}`} />
        </button>
      </div>

      {/* Orders Stream (Only Active by Default) */}
      <div className="space-y-2">
        {currentList.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <Package className="w-8 h-8 text-gray-300 mx-auto mb-1.5" />
            <p className="text-xs text-gray-600 font-semibold">
              {activeTab === 'active' ? 'Faol buyurtmalar yo\'q' : 'Yetkazilgan buyurtmalar tarixi bo\'sh'}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {activeTab === 'active' ? 'Yangi buyurtma tushishi bilan bu yerda paydo bo\'ladi' : ''}
            </p>
          </div>
        ) : (
          currentList.map(order => {
            const isExpanded = expandedOrderId === order.id;
            const statusLabel =
              order.status === 'yangi' ? { bg: 'bg-amber-100 text-amber-800', text: '⚡️ Yangi' } :
              order.status === 'tasdiqlandi' ? { bg: 'bg-blue-100 text-blue-800', text: 'Tayyorlanmoqda' } :
              order.status === 'kuryerda' ? { bg: 'bg-purple-100 text-purple-800', text: '🛵 Yo\'lda' } :
              { bg: 'bg-emerald-100 text-emerald-800', text: '✅ Yetkazildi' };

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-3 border border-gray-100 shadow-xs space-y-2.5 transition-all hover:border-gray-200"
              >
                {/* Header: #OrderNumber, Status Badge, Price & Payment */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-black text-xs text-gray-900">#{order.order_number}</span>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${statusLabel.bg}`}>
                      {statusLabel.text}
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
                    <span className="text-[10px] text-gray-400 ml-1 uppercase">
                      ({order.payment_method})
                    </span>
                  </div>
                </div>

                {/* Customer Info & Address (Direct Clickable Actions) */}
                <div className="bg-gray-50 rounded-xl p-2.5 text-xs space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-gray-900 truncate">
                      👤 {order.customer_name}
                    </span>
                    <a
                      href={`tel:${order.customer_phone}`}
                      className="flex items-center gap-1 text-red-600 bg-white font-bold px-2 py-0.5 rounded-lg border border-red-100 text-[11px] shadow-2xs hover:bg-red-50 shrink-0"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{order.customer_phone}</span>
                    </a>
                  </div>

                  {/* Address with Direct Navigation Action */}
                  <div className="flex items-start justify-between gap-2 pt-0.5">
                    <div className="flex items-start gap-1 text-gray-600 text-[11px] min-w-0 flex-1">
                      <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                      <span className="break-words line-clamp-2">{order.delivery_address}</span>
                    </div>

                    <button
                      onClick={() => openInMap(order)}
                      className="flex items-center gap-1 bg-white hover:bg-blue-50 text-blue-600 text-[11px] font-bold px-2 py-0.5 rounded-lg border border-blue-100 shrink-0 shadow-2xs"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Xarita</span>
                    </button>
                  </div>

                  {order.delivery_notes && (
                    <div className="text-[11px] text-gray-500 italic pt-0.5">
                      Izoh: {order.delivery_notes}
                    </div>
                  )}
                </div>

                {/* Items Accordion Toggle */}
                <div className="flex items-center justify-between text-[11px]">
                  <button
                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                    className="text-gray-500 hover:text-gray-800 font-semibold flex items-center gap-1"
                  >
                    <span>📦 {order.items?.length || 0} xil mahsulot</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
                  </button>

                  <span className="text-gray-400 text-[10px]">
                    Yetkazish: {order.delivery_fee ? `${order.delivery_fee.toLocaleString()} so'm` : 'bepul'}
                  </span>
                </div>

                {/* Expanded Items details */}
                {isExpanded && (
                  <div className="bg-gray-50 rounded-xl p-2 text-[11px] space-y-1 border border-gray-100 animate-in fade-in duration-100">
                    {order.items?.map(it => (
                      <div key={it.id} className="flex justify-between items-center text-gray-600">
                        <span className="truncate flex-1">• {it.product_name}</span>
                        <span className="font-semibold text-gray-800 shrink-0 ml-2">
                          {it.quantity} {it.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Primary Action Button */}
                {activeTab === 'active' && (
                  <div className="pt-1">
                    {order.status === 'yangi' || order.status === 'tasdiqlandi' ? (
                      <button
                        onClick={() => handleStatusChange(order.id, 'kuryerda')}
                        disabled={isUpdating === order.id}
                        className="w-full flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 active:scale-98 text-white py-2 rounded-xl font-bold text-xs shadow-xs transition-all"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Yo'lga chiqdim</span>
                      </button>
                    ) : order.status === 'kuryerda' ? (
                      <button
                        onClick={() => handleStatusChange(order.id, 'yetkazildi')}
                        disabled={isUpdating === order.id}
                        className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white py-2 rounded-xl font-bold text-xs shadow-xs transition-all"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Yetkazildi deb belgilash</span>
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
