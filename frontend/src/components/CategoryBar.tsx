import React from 'react';
import { Category } from '../types';
import { hapticImpact } from '../telegram';

interface CategoryBarProps {
  categories: Category[];
  selectedCategoryId: number | null;
  onSelectCategory: (id: number | null) => void;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory
}) => {
  return (
    <div className="py-2.5 overflow-x-auto no-scrollbar">
      <div className="flex gap-2 px-4 max-w-2xl mx-auto">
        <button
          onClick={() => {
            hapticImpact('light');
            onSelectCategory(null);
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
            selectedCategoryId === null
              ? 'bg-red-600 text-white shadow-md shadow-red-500/25 scale-[1.02]'
              : 'bg-white text-gray-700 border border-gray-200/70 hover:bg-gray-50'
          }`}
        >
          <span>🔥</span>
          <span>Barchasi</span>
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                hapticImpact('light');
                onSelectCategory(cat.id);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                isSelected
                  ? 'bg-red-600 text-white shadow-md shadow-red-500/25 scale-[1.02]'
                  : 'bg-white text-gray-700 border border-gray-200/70 hover:bg-gray-50'
              }`}
            >
              <span>{cat.icon || '📦'}</span>
              <span>{cat.name_uz}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
