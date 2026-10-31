import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { Product } from '../types';
import { hapticImpact } from '../telegram';

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  onAddToCart: (product: Product) => void;
  onRemoveFromCart: (productId: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantityInCart,
  onAddToCart,
  onRemoveFromCart
}) => {
  const currentPrice = product.discount_price || product.price;
  const hasDiscount = !!product.discount_price && product.discount_price < product.price;

  return (
    <div className="bg-white rounded-2xl p-2.5 flex flex-col justify-between border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group">
      {/* Product Image & Badges */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gray-50 mb-2">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80'}
          alt={product.name_uz}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
        />

        {/* Badges */}
        <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
          {hasDiscount && (
            <span className="bg-red-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shadow-sm">
              -{Math.round(((product.price - product.discount_price!) / product.price) * 100)}%
            </span>
          )}
          {product.is_popular && (
            <span className="bg-amber-400 text-amber-950 text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
              TOP
            </span>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight mb-1">
            {product.name_uz}
          </h3>
          <p className="text-[10px] text-gray-400 mb-2 font-medium">
            1 {product.unit} uchun
          </p>
        </div>

        {/* Price & Action Button */}
        <div className="pt-1 border-t border-gray-50 flex items-end justify-between gap-1">
          <div>
            {hasDiscount && (
              <span className="block text-[10px] text-gray-400 line-through leading-none">
                {product.price.toLocaleString()}
              </span>
            )}
            <div className="text-xs font-extrabold text-gray-900 leading-tight">
              {currentPrice.toLocaleString()} <span className="text-[10px] font-medium text-gray-500">so'm</span>
            </div>
          </div>

          {/* Add to Cart / Counter */}
          {quantityInCart === 0 ? (
            <button
              onClick={() => {
                hapticImpact('medium');
                onAddToCart(product);
              }}
              className="w-8 h-8 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white active:scale-90 transition-all flex items-center justify-center font-bold"
            >
              <Plus className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-red-600 text-white rounded-xl px-1 py-0.5 shadow-sm">
              <button
                onClick={() => {
                  hapticImpact('light');
                  onRemoveFromCart(product.id);
                }}
                className="w-6 h-6 rounded-lg bg-red-700/50 hover:bg-red-700 flex items-center justify-center text-xs active:scale-90 transition-all"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-xs font-bold px-0.5 min-w-[14px] text-center">
                {quantityInCart}
              </span>
              <button
                onClick={() => {
                  hapticImpact('medium');
                  onAddToCart(product);
                }}
                className="w-6 h-6 rounded-lg bg-red-700/50 hover:bg-red-700 flex items-center justify-center text-xs active:scale-90 transition-all"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
