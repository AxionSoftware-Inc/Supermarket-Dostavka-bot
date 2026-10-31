import React, { useEffect, useState } from 'react';
import { X, CheckCircle, Clock, PackageCheck, Truck, Home, Phone, MapPin, RefreshCw } from 'lucide-react';
import { Order } from '../types';
import { api } from '../api';
import { hapticImpact } from '../telegram';

interface OrderTrackingModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_STEPS = [
  { key: 'yangi', label: 'Qabul qilindi', icon: Clock },
  { key: 'tasdiqlandi', label: 'Tasdiqlandi', icon: CheckCircle },
  { key: 'yigilyapti', label: 'Yigʻilmoqda', icon: PackageCheck },
  { key: 'kuryerda', label: 'Kuryer yoʻlda', icon: Truck },
  { key: 'yetkazildi', label: 'Yetkazildi', icon: Home }
];

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  order: initialOrder,
  isOpen,
  onClose
}) => {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(initialOrder);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setCurrentOrder(initialOrder);
  }, [initialOrder]);

  // Polling for live status updates every 6 seconds
  useEffect(() => {
    if (!isOpen || !currentOrder || currentOrder.status === 'yetkazildi' || currentOrder.status === 'bekor') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const fresh = await api.trackOrder(currentOrder.order_number);
        setCurrentOrder(fresh);
      } catch (e) {
        // quiet fallback
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [isOpen, currentOrder?.order_number, currentOrder?.status]);

  if (!isOpen || !currentOrder) return null;

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === currentOrder.status);
  const isCancelled = currentOrder.status === 'bekor';

  const handleManualRefresh = async () => {
    hapticImpact('light');
    setIsRefreshing(true);
    try {
      const fresh = await api.trackOrder(currentOrder.order_number);
      setCurrentOrder(fresh);
    } catch (e) {
      alert("Ma'lumotlarni yangilab bo'lmadi");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 sm:p-4 overflow-x-hidden">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up max-w-full">
        {/* Header */}
        <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-extrabold text-gray-900 break-all">
                Buyurtma #{currentOrder.order_number}
              </h2>
              <button
                onClick={handleManualRefresh}
                className={`p-1 text-gray-400 hover:text-gray-600 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                title="Yangilash"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              {new Date(currentOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} da berildi
            </p>
          </div>
          <button
            onClick={() => {
              hapticImpact('light');
              onClose();
            }}
            className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-5 py-4 space-y-4 w-full">
          {/* Status Stepper */}
          {isCancelled ? (
            <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-center">
              <span className="text-2xl">❌</span>
              <h3 className="text-sm font-bold text-red-700 mt-1">Buyurtma bekor qilingan</h3>
              <p className="text-xs text-red-500 mt-0.5">Savollar bo'lsa operatorimiz bilan bog'laning.</p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex justify-between items-center relative">
                {/* Horizontal Progress Line */}
                <div className="absolute top-4 left-6 right-6 h-0.5 bg-gray-200 -z-0">
                  <div
                    className="h-full bg-red-600 transition-all duration-500"
                    style={{
                      width: `${Math.max(0, Math.min(100, (currentStepIndex / (STATUS_STEPS.length - 1)) * 100))}%`
                    }}
                  />
                </div>

                {STATUS_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isDone = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;

                  return (
                    <div key={step.key} className="flex flex-col items-center relative z-10">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isDone
                            ? 'bg-red-600 text-white shadow-md shadow-red-500/25 scale-105'
                            : 'bg-white text-gray-300 border-2 border-gray-200'
                        } ${isCurrent ? 'ring-4 ring-red-100' : ''}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span
                        className={`text-[9px] mt-1.5 font-bold text-center leading-tight max-w-[54px] ${
                          isDone ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Courier Card (if assigned) */}
          {currentOrder.courier && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-sm">
                  🛵
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">{currentOrder.courier.name}</h4>
                  <p className="text-[11px] text-gray-500">Kuryer (Tezkor yetkazish)</p>
                </div>
              </div>
              <a
                href={`tel:${currentOrder.courier.phone}`}
                className="bg-white text-red-600 border border-red-200 hover:bg-red-50 p-2.5 rounded-xl flex items-center gap-1.5 font-bold text-xs shadow-xs active:scale-95 transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Qo'ng'iroq</span>
              </a>
            </div>
          )}

          {/* Delivery Details */}
          <div className="bg-gray-50 rounded-2xl p-3.5 space-y-2 text-xs">
            <div className="flex items-start gap-2 text-gray-700">
              <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-gray-900 block">Manzil:</strong>
                <span>{currentOrder.delivery_address}</span>
                {currentOrder.delivery_notes && (
                  <span className="block text-gray-400 text-[11px] mt-0.5">
                    Izoh: {currentOrder.delivery_notes}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Items Summary */}
          <div>
            <h4 className="text-xs font-bold text-gray-800 mb-2">Buyurtma tarkibi:</h4>
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl p-3 space-y-2">
              {currentOrder.items.map((item) => (
                <div key={item.id} className="pt-2 first:pt-0 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-gray-900">{item.product_name}</span>
                    <span className="text-gray-400 block text-[11px]">
                      {item.quantity} {item.unit} x {item.price.toLocaleString()} so'm
                    </span>
                  </div>
                  <span className="font-bold text-gray-900">
                    {item.subtotal.toLocaleString()} so'm
                  </span>
                </div>
              ))}

              <div className="pt-2 text-xs text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span>Yetkazish:</span>
                  <span className="font-semibold text-gray-800">
                    {currentOrder.delivery_fee === 0 ? 'Bepul' : `${currentOrder.delivery_fee.toLocaleString()} so'm`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-gray-900 pt-1 border-t border-gray-100">
                  <span>Jami summa:</span>
                  <span className="text-red-600">{currentOrder.total_amount.toLocaleString()} so'm</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
          <button
            onClick={() => {
              hapticImpact('light');
              onClose();
            }}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-bold text-xs transition-colors"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
