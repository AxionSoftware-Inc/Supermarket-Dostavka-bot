import React from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { CartItem } from '../types';
import { hapticImpact } from '../telegram';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: number, delta: number) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
  freeDeliveryThreshold: number;
  baseDeliveryFee: number;
  minOrderAmount?: number;
}

export const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onClearCart,
  onProceedToCheckout,
  freeDeliveryThreshold,
  baseDeliveryFee,
  minOrderAmount = 30000
}) => {
  if (!isOpen) return null;

  const itemsTotal = items.reduce((sum, item) => {
    const price = item.product.discount_price || item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const isFreeDelivery = itemsTotal >= freeDeliveryThreshold;
  const deliveryFee = isFreeDelivery ? 0 : (itemsTotal > 0 ? baseDeliveryFee : 0);
  const remainingForFree = Math.max(0, freeDeliveryThreshold - itemsTotal);
  const freeProgress = Math.min(100, Math.round((itemsTotal / freeDeliveryThreshold) * 100));
  const finalTotal = itemsTotal + deliveryFee;
  const isBelowMin = itemsTotal < minOrderAmount && itemsTotal > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900">Savatcha</h2>
            <span className="text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
              {items.length} xil mahsulot
            </span>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={() => {
                  hapticImpact('medium');
                  onClearCart();
                }}
                className="text-xs text-gray-400 hover:text-red-500 p-1.5 flex items-center gap-1 transition-colors"
                title="Savatchani tozalash"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Tozalash</span>
              </button>
            )}
            <button
              onClick={() => {
                hapticImpact('light');
                onClose();
              }}
              className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Free Delivery Banner & Progress */}
        {items.length > 0 && (
          <div className="bg-amber-50/70 border-b border-amber-100/60 px-5 py-2.5">
            {isFreeDelivery ? (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Tabriklaymiz! Siz uchun yetkazib berish bepul! 🎉</span>
              </div>
            ) : (
              <div>
                <div className="flex justify-between text-xs text-amber-900 mb-1.5 font-medium">
                  <span>Bepul yetkazib berishgacha:</span>
                  <span className="font-bold">{remainingForFree.toLocaleString()} so'm</span>
                </div>
                <div className="w-full bg-amber-200/50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${freeProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-5 py-3 divide-y divide-gray-100">
          {items.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center text-3xl">
                🛒
              </div>
              <h3 className="text-sm font-bold text-gray-800 mb-1">Savatchangiz bo'sh</h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto mb-4">
                Do'kondan o'zingizga yoqqan sifatli mahsulotlarni tanlang va savatchaga qo'shing.
              </p>
              <button
                onClick={() => {
                  hapticImpact('light');
                  onClose();
                }}
                className="bg-red-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md hover:bg-red-700"
              >
                Xaridni boshlash
              </button>
            </div>
          ) : (
            items.map(({ product, quantity }) => {
              const price = product.discount_price || product.price;
              const subtotal = price * quantity;
              return (
                <div key={product.id} className="py-3 flex items-center gap-3">
                  <img
                    src={product.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200'}
                    alt={product.name_uz}
                    className="w-14 h-14 rounded-xl object-cover bg-gray-50 shrink-0 border border-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-gray-800 truncate">
                      {product.name_uz}
                    </h4>
                    <p className="text-[11px] text-gray-400 font-medium">
                      {price.toLocaleString()} so'm / {product.unit}
                    </p>
                    <p className="text-xs font-extrabold text-gray-900 mt-0.5">
                      {subtotal.toLocaleString()} so'm
                    </p>
                  </div>
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-2 py-1">
                    <button
                      onClick={() => {
                        hapticImpact('light');
                        onUpdateQuantity(product.id, -1);
                      }}
                      className="w-6 h-6 rounded-lg bg-white shadow-xs text-gray-700 flex items-center justify-center active:scale-90"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-gray-900 min-w-[16px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => {
                        hapticImpact('medium');
                        onUpdateQuantity(product.id, 1);
                      }}
                      className="w-6 h-6 rounded-lg bg-red-600 shadow-xs text-white flex items-center justify-center active:scale-90"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer & Checkout Action */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/80">
            <div className="space-y-1.5 mb-3 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Mahsulotlar:</span>
                <span className="font-semibold text-gray-800">{itemsTotal.toLocaleString()} so'm</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Yetkazib berish:</span>
                <span className={`font-semibold ${isFreeDelivery ? 'text-emerald-600' : 'text-gray-800'}`}>
                  {isFreeDelivery ? 'Bepul' : `${deliveryFee.toLocaleString()} so'm`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-gray-900 pt-1.5 border-t border-gray-200">
                <span>Jami:</span>
                <span className="text-red-600 text-base">{finalTotal.toLocaleString()} so'm</span>
              </div>
            </div>

            {isBelowMin && (
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200 mb-2 font-medium text-center">
                Minimal buyurtma summasi: <strong>{minOrderAmount.toLocaleString()} so'm</strong>.<br />
                Yana {(minOrderAmount - itemsTotal).toLocaleString()} so'mlik mahsulot qo'shing.
              </p>
            )}

            <button
              disabled={isBelowMin}
              onClick={() => {
                hapticImpact('heavy');
                onProceedToCheckout();
              }}
              className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 active:scale-[0.99] text-white py-3.5 px-4 rounded-2xl font-extrabold text-sm shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              <span>Buyurtmani rasmiylashtirish</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
