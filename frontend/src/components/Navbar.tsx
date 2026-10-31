import React from 'react';
import { ShoppingBag, Search, Clock, Truck, ShieldCheck, X } from 'lucide-react';
import { hapticImpact } from '../telegram';

interface NavbarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  activeRole: 'client' | 'courier' | 'admin' | 'orders';
  setActiveRole: (role: 'client' | 'courier' | 'admin' | 'orders') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  setSearchQuery,
  cartCount,
  cartTotal,
  onOpenCart,
  activeRole,
  setActiveRole
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm w-full overflow-hidden">
      {/* Top Banner & Brand */}
      <div className="max-w-2xl mx-auto px-3.5 sm:px-4 pt-2.5 pb-2 flex items-center justify-between gap-2 w-full min-w-0">
        <div className="flex items-center gap-2 cursor-pointer min-w-0 flex-1" onClick={() => setActiveRole('client')}>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center text-white shadow-md shadow-red-500/20 shrink-0">
            <span className="text-lg sm:text-xl font-black tracking-tight">K</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-base sm:text-lg font-black text-gray-900 tracking-tight truncate">korzinka</span>
              <span className="text-[9px] sm:text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                Tezkor
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-gray-500 truncate">
              <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">Yetkazish: <strong className="text-gray-700">25-40 daqiqa</strong></span>
            </div>
          </div>
        </div>

        {/* Cart Quick Button */}
        <button
          onClick={() => {
            hapticImpact('light');
            onOpenCart();
          }}
          className="relative flex items-center gap-1.5 sm:gap-2 bg-red-600 hover:bg-red-700 active:scale-95 transition-all text-white px-2.5 sm:px-3.5 py-2 rounded-xl font-semibold shadow-md shadow-red-500/25 shrink-0"
        >
          <ShoppingBag className="w-4 h-4 shrink-0" />
          <span className="text-xs font-bold whitespace-nowrap">
            {cartCount > 0 ? `${cartTotal.toLocaleString()} so'm` : 'Savatcha'}
          </span>
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-red-900 font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Role / Navigation Tabs */}
      <div className="max-w-2xl mx-auto px-3.5 sm:px-4 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar text-xs w-full">
        <button
          onClick={() => { hapticImpact('light'); setActiveRole('client'); }}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap shrink-0 transition-all ${
            activeRole === 'client'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🛒 Do'kon
        </button>
        <button
          onClick={() => { hapticImpact('light'); setActiveRole('orders'); }}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap shrink-0 transition-all ${
            activeRole === 'orders'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📋 Buyurtmalarim
        </button>
        <button
          onClick={() => { hapticImpact('light'); setActiveRole('courier'); }}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap shrink-0 transition-all ${
            activeRole === 'courier'
              ? 'bg-gray-900 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🛵 Kuryer Paneli
        </button>
        <button
          onClick={() => { hapticImpact('light'); setActiveRole('admin'); }}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap shrink-0 transition-all ${
            activeRole === 'admin'
              ? 'bg-gray-900 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ⚙️ Admin
        </button>
      </div>

      {/* Search Bar (Only shown on client store tab) */}
      {activeRole === 'client' && (
        <div className="max-w-2xl mx-auto px-3.5 sm:px-4 pb-2.5 w-full">
          <div className="relative flex items-center w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Mahsulot yoki toifani qidiring..."
              className="w-full bg-gray-100 focus:bg-white text-sm text-gray-900 pl-9 pr-8 py-2 rounded-xl border border-transparent focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
