import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { CategoryBar } from './components/CategoryBar';
import { ProductCard } from './components/ProductCard';
import { CartModal } from './components/CartModal';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { CourierDashboard } from './components/CourierDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { Category, Product, CartItem, Order, StoreSettings } from './types';
import { api } from './api';
import { initTelegramApp, hapticImpact, getTelegramUser } from './telegram';
import { ShoppingBag, Sparkles, ChevronRight, Clock, ShieldCheck, PhoneCall } from 'lucide-react';

export const App: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('korzinka_cart');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(item => item && item.product && typeof item.product.price === 'number');
      }
      return [];
    } catch {
      return [];
    }
  });

  const [settings, setSettings] = useState<StoreSettings>({
    store_name: 'Korzinka Supermarket',
    phone: '+998 78 140 14 14',
    address: 'Toshkent shahri',
    is_open: true,
    min_order_amount: 30000,
    free_delivery_threshold: 150000,
    base_delivery_fee: 15000,
    delivery_time_text: '25 - 40 daqiqa'
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);

  // Active view: 'client' | 'orders' | 'courier' | 'admin'
  const [activeRole, setActiveRole] = useState<'client' | 'courier' | 'admin' | 'orders'>('client');
  const [userRoleInfo, setUserRoleInfo] = useState<{ isAdmin: boolean; isCourier: boolean }>({ isAdmin: false, isCourier: false });
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Initialize Telegram & check permissions
  useEffect(() => {
    initTelegramApp();

    const user = getTelegramUser();
    const urlParams = new URLSearchParams(window.location.search);
    const tgId = urlParams.get('tg_id') || user?.id;
    const username = user?.username;

    api.checkRole(tgId || undefined, username || undefined).then(res => {
      setUserRoleInfo({ isAdmin: res.is_admin, isCourier: res.is_courier });
      const roleParam = urlParams.get('role');
      if (roleParam === 'admin' && res.is_admin) {
        setActiveRole('admin');
      } else if (roleParam === 'courier' && (res.is_courier || res.is_admin)) {
        setActiveRole('courier');
      }
    }).catch(err => console.warn("Check role error:", err));

    const tabParam = urlParams.get('tab');
    const trackParam = urlParams.get('track');

    if (tabParam === 'orders') setActiveRole('orders');

    if (trackParam) {
      api.trackOrder(trackParam).then(order => {
        setTrackingOrder(order);
        setIsTrackingOpen(true);
      }).catch(err => console.warn(err));
    }
  }, []);

  // Save cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem('korzinka_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // Load Initial Data
  const loadStoreData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [cats, prods, sett] = await Promise.all([
        api.getCategories(),
        api.getProducts(),
        api.getSettings().catch(() => settings)
      ]);
      setCategories(cats || []);
      setProducts(prods || []);
      if (sett) setSettings(sett);
    } catch (e: any) {
      console.error("Initial load error:", e);
      setLoadError("Mahsulotlarni yuklashda xatolik yuz berdi. Internet aloqangizni tekshiring.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStoreData();
  }, []);

  // Filter products by category and search
  const filteredProducts = products.filter(product => {
    if (selectedCategoryId && product.category_id !== selectedCategoryId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = product.name_uz.toLowerCase().includes(q) || product.name_ru.toLowerCase().includes(q);
      const matchDesc = product.description?.toLowerCase().includes(q);
      return matchName || matchDesc;
    }
    return true;
  });

  // Load customer's past orders when 'orders' tab is opened
  useEffect(() => {
    if (activeRole === 'orders') {
      const tgUser = getTelegramUser();
      api.getOrders({ telegram_user_id: tgUser?.id }).then(setMyOrders).catch(() => {});
    }
  }, [activeRole]);

  // Cart operations
  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (productId: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === productId);
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        return prev.filter(item => item.product.id !== productId);
      }
      return prev.map(item =>
        item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  };

  const handleUpdateQuantity = (productId: number, delta: number) => {
    if (delta > 0) {
      const item = cart.find(i => i.product.id === productId);
      if (item) handleAddToCart(item.product);
    } else {
      handleRemoveFromCart(productId);
    }
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleReorder = (order: Order) => {
    hapticImpact('heavy');
    // Map order items back to products
    const newCartItems: CartItem[] = [];
    order.items.forEach(orderItem => {
      const prod = products.find(p => p.id === orderItem.product_id);
      if (prod) {
        newCartItems.push({
          product: prod,
          quantity: orderItem.quantity
        });
      }
    });

    if (newCartItems.length > 0) {
      setCart(newCartItems);
      setActiveRole('client');
      setIsCartOpen(true);
    } else {
      alert("Bu mahsulotlar hozirda mavjud emas");
    }
  };

  const cartTotal = cart.reduce((sum, item) => {
    const p = item.product.discount_price || item.product.price;
    return sum + p * item.quantity;
  }, 0);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // When order is successfully created
  const handleOrderSuccess = (createdOrder: Order) => {
    setCart([]);
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
    setTrackingOrder(createdOrder);
    setIsTrackingOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900 pb-20 w-full overflow-x-hidden">
      {/* Top Navbar */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        isAdmin={userRoleInfo.isAdmin}
        isCourier={userRoleInfo.isCourier}
      />

      {/* Main Content Area based on active view */}
      {activeRole === 'client' && (
        <main className="flex-1 max-w-2xl mx-auto w-full overflow-x-hidden">
          {/* Promotional Banner */}
          {!searchQuery && (
            <div className="px-3.5 sm:px-4 pt-3 pb-1">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 via-red-500 to-amber-500 text-white p-4 shadow-md">
                <div className="relative z-10 max-w-[70%]">
                  <span className="inline-block bg-white/20 backdrop-blur-md text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider mb-1.5">
                    Aksiya
                  </span>
                  <h2 className="text-sm sm:text-base font-black leading-tight mb-1">
                    Yangi mahsulotlar va 15% gacha chegirmalar!
                  </h2>
                  <p className="text-[10px] sm:text-[11px] text-red-50 font-medium">
                    150 000 so'mdan yuqori buyurtmalar uchun yetkazib berish bepul!
                  </p>
                </div>
                <div className="absolute right-2 -bottom-2 text-5xl sm:text-6xl opacity-90 select-none">
                  🍉
                </div>
              </div>
            </div>
          )}

          {/* Categories Horizontal Bar */}
          <CategoryBar
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />

          {/* Products Grid */}
          <div className="px-3.5 sm:px-4 py-2">
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-xs sm:text-sm font-extrabold text-gray-900 truncate pr-2">
                {selectedCategoryId
                  ? categories.find(c => c.id === selectedCategoryId)?.name_uz || 'Mahsulotlar'
                  : searchQuery
                  ? `Qidiruv natijalari: "${searchQuery}"`
                  : 'Barcha sara mahsulotlar'}
              </h2>
              <span className="text-xs text-gray-400 font-semibold shrink-0">
                {isLoading ? 'Yuklanmoqda...' : `${filteredProducts.length} ta`}
              </span>
            </div>

            {isLoading ? (
              /* Loading Skeletons */
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-2.5 border border-gray-100 shadow-sm animate-pulse space-y-2">
                    <div className="aspect-square w-full rounded-xl bg-gray-200"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-2.5 bg-gray-100 rounded w-1/2"></div>
                    <div className="flex justify-between items-center pt-2">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="w-8 h-8 rounded-xl bg-gray-200"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : loadError ? (
              /* Error with Retry */
              <div className="bg-white rounded-2xl p-8 text-center border border-red-100 my-4 shadow-sm">
                <span className="text-4xl block mb-2">⚠️</span>
                <h3 className="text-sm font-bold text-gray-800 mb-1">Aloqa xatoligi</h3>
                <p className="text-xs text-gray-500 mb-4">{loadError}</p>
                <button
                  onClick={loadStoreData}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
                >
                  🔄 Qayta yuklash
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 my-4">
                <span className="text-4xl block mb-2">🔍</span>
                <h3 className="text-sm font-bold text-gray-800">Hech narsa topilmadi</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Boshqa nom yoki toifani qidirib ko'ring.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {filteredProducts.map(product => {
                  const cartItem = cart.find(i => i.product.id === product.id);
                  const quantityInCart = cartItem ? cartItem.quantity : 0;
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      quantityInCart={quantityInCart}
                      onAddToCart={handleAddToCart}
                      onRemoveFromCart={handleRemoveFromCart}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </main>
      )}

      {/* Orders Tab */}
      {activeRole === 'orders' && (
        <main className="flex-1 max-w-2xl mx-auto w-full px-3.5 sm:px-4 py-4 space-y-3 overflow-x-hidden">
          <h2 className="text-base font-extrabold text-gray-900">Buyurtmalarim tarixi</h2>
          {myOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
              <span className="text-3xl block mb-2">📋</span>
              <h3 className="text-sm font-bold text-gray-800">Sizda hali buyurtmalar yo'q</h3>
              <p className="text-xs text-gray-400 mt-1 mb-4">
                Do'kondan o'zingizga ma'qul mahsulotlarni tanlang va xarid qiling!
              </p>
              <button
                onClick={() => setActiveRole('client')}
                className="bg-red-600 text-white font-bold text-xs px-4 py-2 rounded-xl"
              >
                Do'konga o'tish
              </button>
            </div>
          ) : (
            myOrders.map(order => (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs hover:shadow-md transition-all space-y-3"
              >
                <div
                  onClick={() => {
                    setTrackingOrder(order);
                    setIsTrackingOpen(true);
                  }}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-gray-900">#{order.order_number}</span>
                      <span className="text-[10px] font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded-full">
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {order.items.length} xil mahsulot • {order.total_amount.toLocaleString()} so'm
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-400 text-[11px]">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleReorder(order)}
                    className="bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors"
                  >
                    🔄 Qayta buyurtma
                  </button>
                </div>
              </div>
            ))
          )}
        </main>
      )}

      {/* Courier Tab */}
      {activeRole === 'courier' && <CourierDashboard />}

      {/* Admin Tab */}
      {activeRole === 'admin' && <AdminDashboard />}

      {/* Floating Bottom Cart Bar for Client (when items > 0) */}
      {activeRole === 'client' && cartCount > 0 && !isCartOpen && !isCheckoutOpen && (
        <div className="fixed bottom-4 left-0 right-0 z-30 px-4 max-w-2xl mx-auto animate-bounce-subtle">
          <button
            onClick={() => {
              hapticImpact('heavy');
              setIsCartOpen(true);
            }}
            className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-3 px-5 rounded-2xl shadow-xl shadow-red-500/30 flex items-center justify-between font-bold text-sm active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <span className="bg-white/20 px-2 py-0.5 rounded-lg text-xs">
                {cartCount} ta
              </span>
              <span>Savatchani ko'rish</span>
            </div>
            <span className="text-base font-extrabold">
              {cartTotal.toLocaleString()} so'm
            </span>
          </button>
        </div>
      )}

      {/* Cart Modal */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={handleClearCart}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        freeDeliveryThreshold={settings.free_delivery_threshold}
        baseDeliveryFee={settings.base_delivery_fee}
        minOrderAmount={settings.min_order_amount}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cart}
        freeDeliveryThreshold={settings.free_delivery_threshold}
        baseDeliveryFee={settings.base_delivery_fee}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Order Tracking Modal */}
      <OrderTrackingModal
        order={trackingOrder}
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
      />
    </div>
  );
};
export default App;
