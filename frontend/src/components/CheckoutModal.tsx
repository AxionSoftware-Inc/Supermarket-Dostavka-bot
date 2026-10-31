import React, { useState, useEffect } from 'react';
import { X, MapPin, Phone, User, FileText, CreditCard, Banknote, CheckCircle2, Loader2, Navigation } from 'lucide-react';
import { CartItem, Order } from '../types';
import { api } from '../api';
import { hapticImpact, hapticNotification, getTelegramUser } from '../telegram';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  freeDeliveryThreshold: number;
  baseDeliveryFee: number;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  freeDeliveryThreshold,
  baseDeliveryFee,
  onOrderSuccess
}) => {
  if (!isOpen) return null;

  const tgUser = getTelegramUser();

  // Load saved profile from localStorage if exists
  const savedProfile = (() => {
    try {
      const raw = localStorage.getItem('korzinka_customer_profile');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const [customerName, setCustomerName] = useState(savedProfile?.name || tgUser?.fullName || '');
  const [customerPhone, setCustomerPhone] = useState(savedProfile?.phone || '+998 ');
  const [address, setAddress] = useState(savedProfile?.address || '');
  const [notes, setNotes] = useState(savedProfile?.notes || '');
  const [paymentMethod, setPaymentMethod] = useState<'naqd' | 'click' | 'payme' | 'terminal'>('naqd');
  const [lat, setLat] = useState<number | undefined>(savedProfile?.lat);
  const [lng, setLng] = useState<number | undefined>(savedProfile?.lng);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Also check backend for existing profile by telegram_id
  useEffect(() => {
    if (tgUser?.id && (!savedProfile?.phone || !savedProfile?.address)) {
      api.getCustomerProfile(tgUser.id).then(backendProfile => {
        if (backendProfile) {
          if (!customerName && backendProfile.name) setCustomerName(backendProfile.name);
          if ((!customerPhone || customerPhone === '+998 ') && backendProfile.phone) {
            setCustomerPhone(backendProfile.phone);
          }
          if (!address && backendProfile.address) setAddress(backendProfile.address);
          if (backendProfile.lat) setLat(backendProfile.lat);
          if (backendProfile.lng) setLng(backendProfile.lng);
        }
      }).catch(() => {});
    }
  }, [tgUser?.id]);

  const itemsTotal = items.reduce((sum, item) => {
    const price = item.product.discount_price || item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const isFreeDelivery = itemsTotal >= freeDeliveryThreshold;
  const deliveryFee = isFreeDelivery ? 0 : baseDeliveryFee;
  const totalAmount = itemsTotal + deliveryFee;

  // Fetch current GPS location
  const handleGetLocation = () => {
    hapticImpact('medium');
    setIsLocating(true);
    if (!navigator.geolocation) {
      alert("Qurilmangizda geolokatsiya qo'llab-quvvatlanmaydi");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        if (!address) {
          setAddress(`Toshkent shahri (GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        }
        setIsLocating(false);
        hapticNotification('success');
      },
      (err) => {
        console.warn("Location error:", err);
        alert("Lokatsiyani aniqlab bo'lmadi. Iltimos manzilni qo'lda kiriting.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim()) {
      setErrorMessage("Iltimos, ismingizni kiriting");
      return;
    }
    if (!customerPhone.trim() || customerPhone.length < 9) {
      setErrorMessage("Iltimos, telefon raqamingizni to'liq kiriting");
      return;
    }
    if (!address.trim()) {
      setErrorMessage("Iltimos, yetkazib berish manzilini kiriting");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        telegram_user_id: tgUser?.id || undefined,
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_address: address,
        delivery_lat: lat,
        delivery_lng: lng,
        delivery_notes: notes || undefined,
        payment_method: paymentMethod,
        items: items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity
        }))
      };

      // Persist profile to localStorage
      try {
        localStorage.setItem('korzinka_customer_profile', JSON.stringify({
          name: customerName,
          phone: customerPhone,
          address: address,
          notes: notes,
          lat: lat,
          lng: lng
        }));
      } catch {}

      const createdOrder = await api.createOrder(orderPayload);
      hapticNotification('success');
      onOrderSuccess(createdOrder);
    } catch (err: any) {
      hapticNotification('error');
      setErrorMessage(err.message || "Buyurtma berishda xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 sm:p-4 overflow-x-hidden">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up max-w-full">
        {/* Header */}
        <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="min-w-0 flex-1 pr-2">
            <h2 className="text-base font-bold text-gray-900 truncate">Buyurtmani rasmiylashtirish</h2>
            <p className="text-[11px] text-gray-400 truncate">Yetkazib berish ma'lumotlarini to'ldiring</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-5 py-4 space-y-4 w-full">
          {(savedProfile?.phone || customerPhone.length > 8) && (
            <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50/80 px-3 py-2 rounded-xl border border-emerald-200 flex items-center gap-2">
              <span className="text-base leading-none">✨</span>
              <span>Profilingiz eslab qolingan: har safar qayta to'ldirish shart emas!</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200">
              {errorMessage}
            </div>
          )}

          {/* Customer Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gray-400" />
              <span>Ismingiz</span>
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Masalan: Sardor"
              className="w-full bg-gray-50 focus:bg-white text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              <span>Telefon raqamingiz</span>
            </label>
            <input
              type="tel"
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+998 90 123 45 67"
              className="w-full bg-gray-50 focus:bg-white text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all"
            />
          </div>

          {/* Address & GPS */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span>Yetkazib berish manzili</span>
              </label>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isLocating}
                className="text-[11px] font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 active:scale-95 transition-all"
              >
                {isLocating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Navigation className="w-3 h-3" />
                )}
                <span>{lat ? "📍 Aniqlangan" : "📍 Lokatsiyani olish"}</span>
              </button>
            </div>
            <textarea
              required
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Tuman, ko'cha, uy raqami, mo'ljal..."
              className="w-full bg-gray-50 focus:bg-white text-sm px-3.5 py-2 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all resize-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              <span>Qo'shimcha izoh (ixtiyoriy)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Podyezd, qavat, domofon kodi..."
              className="w-full bg-gray-50 focus:bg-white text-sm px-3.5 py-2 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              To'lov usuli:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'naqd', label: 'Naqd pul', icon: Banknote },
                { id: 'click', label: 'Click', icon: CreditCard },
                { id: 'payme', label: 'Payme', icon: CreditCard },
                { id: 'terminal', label: 'Karta (Kuryerga)', icon: CreditCard }
              ].map(opt => {
                const Icon = opt.icon;
                const isSelected = paymentMethod === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      hapticImpact('light');
                      setPaymentMethod(opt.id as any);
                    }}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      isSelected
                        ? 'border-red-600 bg-red-50/50 text-red-950 font-bold shadow-xs'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700 font-medium'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-red-600' : 'text-gray-400'}`} />
                    <span className="text-xs">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-2xl p-3.5 space-y-1.5 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Mahsulotlar:</span>
              <span className="font-semibold text-gray-800">{itemsTotal.toLocaleString()} so'm</span>
            </div>
            <div className="flex justify-between">
              <span>Yetkazish:</span>
              <span className="font-semibold text-gray-800">
                {deliveryFee === 0 ? 'Bepul' : `${deliveryFee.toLocaleString()} so'm`}
              </span>
            </div>
            <div className="flex justify-between text-sm font-black text-gray-900 pt-1.5 border-t border-gray-200">
              <span>To'lanadigan summa:</span>
              <span className="text-red-600 text-base">{totalAmount.toLocaleString()} so'm</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 active:scale-[0.99] text-white py-3.5 px-4 rounded-2xl font-extrabold text-sm shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Qabul qilinmoqda...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Buyurtmani tasdiqlash</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
