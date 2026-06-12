import React from 'react';
import { MenuItem } from '../types';
import { useLocalization } from './LocalizationContext';
import { ShoppingCart, Zap, AlertCircle } from 'lucide-react';

interface FoodCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
  onQuickOrder: (item: MenuItem) => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  item,
  onAddToCart,
  onQuickOrder
}) => {
  const { language, t } = useLocalization();

  const hasDiscount = item.discountedPrice !== undefined && item.discountedPrice < item.regularPrice;
  const originalPrice = item.regularPrice;
  const currentPrice = hasDiscount ? (item.discountedPrice as number) : item.regularPrice;

  // Percentage discount
  const discountPercent = hasDiscount 
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) 
    : 0;

  return (
    <div className={`relative flex flex-col bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200/80 transition-all group ${!item.isAvailable ? 'opacity-85' : ''}`}>
      
      {/* Discount Badge */}
      {item.isAvailable && hasDiscount && (
        <span className="absolute top-3 left-3 z-10 px-2.5 py-1 text-[10px] font-extrabold bg-amber-500 text-white rounded-lg uppercase tracking-wider animate-pulse shadow-sm">
          {language === 'bn' ? `${discountPercent}% ছাড়` : `${discountPercent}% OFF`}
        </span>
      )}

      {/* Out of Stock Ribbon / Overlay */}
      {!item.isAvailable && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold bg-gray-900/90 text-white rounded-lg shadow-sm">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          <span>{t('outOfStock')}</span>
        </div>
      )}

      {/* Image container */}
      <div className="relative w-full aspect-[4/3] bg-gray-50 overflow-hidden">
        <img
          src={item.image || 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=600&auto=format&fit=crop&q=80'}
          alt={language === 'bn' ? item.nameBn : item.nameEn}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 select-none pointer-events-none"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // fallback image
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=600&auto=format&fit=crop&q=80';
          }}
        />
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center p-4" />
        )}
      </div>

      {/* Body content */}
      <div className="flex-1 p-4 flex flex-col space-y-3">
        <div>
          {/* Item Category Indicator */}
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">
            Homemade Pure Quality
          </span>
          <h4 className="font-sans font-bold text-sm md:text-base text-gray-950 group-hover:text-amber-600 transition-colors line-clamp-1">
            {language === 'bn' ? item.nameBn : item.nameEn}
          </h4>
          <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
            {language === 'bn' ? item.descriptionBn : item.descriptionEn}
          </p>
        </div>

        {/* Pricing tier */}
        <div className="mt-auto flex items-baseline gap-2 pt-1 border-t border-gray-50">
          <span className="text-base md:text-lg font-black text-gray-950">
            {t('bdt')}{currentPrice}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-450 line-through">
              {t('bdt')}{originalPrice}
            </span>
          )}
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* Add to Cart */}
          <button
            onClick={() => onAddToCart(item)}
            disabled={!item.isAvailable}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              item.isAvailable
                ? 'bg-white border-gray-250 text-gray-850 hover:bg-gray-50 focus:ring-2 focus:ring-gray-200'
                : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span className="truncate">{t('addToCart')}</span>
          </button>

          {/* Quick Order button */}
          <button
            onClick={() => onQuickOrder(item)}
            disabled={!item.isAvailable}
            className={`flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-sm ${
              item.isAvailable
                ? 'bg-amber-500 hover:bg-amber-600 focus:ring-2 focus:ring-amber-300 shadow-amber-500/10 active:scale-97'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-white animate-pulse" />
            <span className="truncate">{t('quickOrder')}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
