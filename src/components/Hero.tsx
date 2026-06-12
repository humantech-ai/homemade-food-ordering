import React, { useState } from 'react';
import { useLocalization } from './LocalizationContext';
import { Sparkles, ShieldCheck, Leaf, Star, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Category, SiteConfig, MenuItem } from '../types';

interface HeroProps {
  categories: Category[];
  activeCategory: string;
  onSelectCategory: (id: string) => void;
  onExploreMenu: () => void;
  siteConfig: SiteConfig | null;
  menuItems: MenuItem[];
  onAddToCart: (item: MenuItem, qty: number) => void;
}

export const Hero: React.FC<HeroProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
  onExploreMenu,
  siteConfig,
  menuItems,
  onAddToCart
}) => {
  const { language, t } = useLocalization();
  const [mostlyOrderedQuantity, setMostlyOrderedQuantity] = useState(1);

  // Find mostly ordered item dynamically from the catalog
  const mostlyOrderedItem = menuItems.find(
    (item) => item.isMostlyOrdered && !item.isDeleted && item.isAvailable
  ) || menuItems.find((item) => !item.isDeleted && item.isAvailable);

  const handleIncrement = () => {
    setMostlyOrderedQuantity(prev => Math.min(20, prev + 1));
  };

  const handleDecrement = () => {
    setMostlyOrderedQuantity(prev => Math.max(1, prev - 1));
  };

  return (
    <div className="relative overflow-hidden bg-gray-50/40 py-10 md:py-16">
      
      {/* Site Notice Banner */}
      {siteConfig && (siteConfig.bannerBn || siteConfig.bannerEn) && (
        <div className="max-w-7xl mx-auto px-4 mb-8">
          <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-3 md:p-4 text-center shadow-sm">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-extrabold bg-amber-500 text-white uppercase tracking-wider mb-1 md:mb-0 md:mr-2">
              <Sparkles className="w-3 h-3 text-white" /> Offer
            </span>
            <span className="text-xs md:text-sm font-semibold text-amber-900 font-sans">
              {language === 'bn' ? siteConfig.bannerBn : siteConfig.bannerEn}
            </span>
          </div>
        </div>
      )}

      {/* Bento Grid layout container */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-12 gap-5 items-stretch">
        
        {/* Bento Card 1: Main Title Block (spans 7 cols on desktop) */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-3xl border border-gray-150 p-6 md:p-8 flex flex-col justify-center relative overflow-hidden shadow-md shadow-gray-150/10 hover:shadow-lg transition-all duration-350">
          <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-amber-50 rounded-bl-full pointer-events-none"></div>
          
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] md:text-xs font-semibold mr-auto mb-4 relative z-10">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{language === 'bn' ? '১০০% ঘরোয়া উপাদানে স্বাস্থ্যসম্মত রেসিপি' : '100% Handcrafted mom-made healthy recipes'}</span>
          </div>

          <h2 className="text-2xl md:text-4.5xl font-black font-display text-gray-950 leading-tight mb-4 tracking-tight relative z-10">
            {language === 'bn' ? (
              <>
                খাঁটি ঘরোয়া <span className="text-amber-500 underline decoration-amber-100 decoration-wavy underline-offset-4">মায়ের হাতের</span> স্বাদে স্বাস্থ্যকর খাবারের নির্ভরযোগ্য ঠিকানা
              </>
            ) : (
              <>
                Savor the Authentic <span className="text-amber-500 underline decoration-amber-100 decoration-wavy underline-offset-4">Moms-Touch</span> Home-Cooked Delicacies
              </>
            )}
          </h2>

          <p className="text-xs md:text-sm text-gray-500 max-w-xl mb-6 leading-relaxed relative z-10">
            {t('tagline')}. কোনো কৃত্রিম রঙ, অতিরিক্ত টেস্টিং সল্ট বা অস্বাস্থ্যকর পাম অয়েল ব্যবহার ছাড়া সম্পূর্ণ খাঁটি মশলা ও খাঁটি সরিষা অথবা সয়াবিন তেলে প্রস্তুতকৃত।
          </p>

          <div className="flex flex-wrap gap-3 relative z-10">
            <button
              onClick={onExploreMenu}
              className="px-5 py-3 md:px-7 md:py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl shadow-lg shadow-amber-500/20 cursor-pointer active:scale-97 transition-transform text-xs md:text-sm"
            >
              🚀 {language === 'bn' ? 'এখনই অর্ডার করুন' : 'Order Now'}
            </button>
            <button
              onClick={onExploreMenu}
              className="px-5 py-3 md:px-7 md:py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-2xl border border-gray-200 cursor-pointer active:scale-97 transition-transform text-xs md:text-sm"
            >
              {t('viewMenu')}
            </button>
          </div>
        </div>

        {/* Bento Card 2: MOSTLY ORDERED ITEM WITH COLS AND ORDER BUTTON (Image-First high converting design!) */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-3xl border border-amber-200/60 p-4 flex flex-col justify-between shadow-xl shadow-amber-500/5 hover:shadow-2xl hover:border-amber-400/80 transition-all duration-300 min-h-[380px] group relative">
          {mostlyOrderedItem ? (
            <>
              {/* Upper Section: Beautiful High-Resolution Food Media Showcase (Image-First) */}
              <div className="relative w-full h-44 md:h-52 bg-gray-100 rounded-2xl overflow-hidden mb-4 shrink-0 shadow-inner">
                <img 
                  src={mostlyOrderedItem.image} 
                  alt={mostlyOrderedItem.nameEn} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-106"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
                
                {/* Popularity Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black bg-gradient-to-r from-red-600 to-amber-600 border border-red-500/10 text-white uppercase tracking-wider shadow-lg shadow-red-600/30">
                  <span className="w-2 h-2 bg-white rounded-full animate-ping shrink-0" />
                  <span>🔥 {language === 'bn' ? 'সবচেয়ে জনপ্রিয় ও বেশি বিক্রীত' : "Most Ordered"}</span>
                </div>

                {/* Steaming hot real-time indicator */}
                <div className="absolute top-3 right-3 flex items-center bg-emerald-600/95 text-white text-[9px] font-bold px-2 py-1 rounded-md border border-emerald-500/20 shadow-md">
                  <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full mr-1 animate-pulse" />
                  <span>{language === 'bn' ? 'রান্না চলছে' : 'Steaming Hot'}</span>
                </div>

                {/* Floated Price Indicator badge over Image */}
                <div className="absolute bottom-3 right-3 bg-white/95 border border-amber-200 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-lg flex items-baseline gap-1.5">
                  <span className="text-base font-black text-amber-600 font-sans">
                    ৳{mostlyOrderedItem.discountedPrice !== undefined ? mostlyOrderedItem.discountedPrice : mostlyOrderedItem.regularPrice}
                  </span>
                  {mostlyOrderedItem.discountedPrice !== undefined && mostlyOrderedItem.discountedPrice < mostlyOrderedItem.regularPrice && (
                    <span className="text-[10px] text-gray-400 line-through font-mono">
                      ৳{mostlyOrderedItem.regularPrice}
                    </span>
                  )}
                </div>
              </div>

              {/* Middle Section: Food Metadata & Description details */}
              <div className="flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1 text-left">
                  <h3 className="text-base md:text-lg font-black font-sans text-gray-950 leading-snug group-hover:text-amber-500 transition-colors">
                    {language === 'bn' ? mostlyOrderedItem.nameBn : mostlyOrderedItem.nameEn}
                  </h3>
                  <p className="text-[11.5px] text-gray-500 line-clamp-2 leading-relaxed">
                    {language === 'bn' ? mostlyOrderedItem.descriptionBn : mostlyOrderedItem.descriptionEn}
                  </p>
                </div>

                {/* Lower Controls: Quantity selectors and actions */}
                <div className="space-y-2.5 pt-2 border-t border-gray-150">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-bold text-gray-400">{language === 'bn' ? 'পরিমাণ নির্বাচন:' : 'Choose Quantity:'}</span>
                    <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-0.5">
                      <button
                        onClick={handleDecrement}
                        className="p-1 px-2 hover:bg-white hover:text-amber-500 hover:shadow-sm text-gray-500 rounded-lg cursor-pointer transition-all active:scale-90"
                        title="Decrease"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-mono font-black text-xs text-gray-800">{mostlyOrderedQuantity}</span>
                      <button
                        onClick={handleIncrement}
                        className="p-1 px-2 hover:bg-white hover:text-amber-500 hover:shadow-sm text-gray-500 rounded-lg cursor-pointer transition-all active:scale-90"
                        title="Increase"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => onAddToCart(mostlyOrderedItem, mostlyOrderedQuantity)}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 cursor-pointer transition-all"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'গরম গরম অর্ডার করুন' : 'Order Now'}</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-xs text-center py-10">
              Loading delicacies...
            </div>
          )}
        </div>

        {/* Bento Card 3: Freshness & Healthy Preparation Card */}
        <div className="col-span-12 md:col-span-6 lg:col-span-5 bg-gradient-to-br from-emerald-50 to-teal-50/20 rounded-3xl border border-emerald-100 p-6 flex flex-col justify-between shadow-lg shadow-emerald-500/5 hover:shadow-xl transition-all duration-350 min-h-[180px]">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h4 className="text-sm md:text-base font-extrabold text-emerald-950 font-sans tracking-tight">
                {language === 'bn' ? 'শতভাগ তাজা ও সেরা পুষ্টির নিশ্চয়তা' : '100% Organic Purity & Freshness'}
              </h4>
              <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider font-sans">
                {language === 'bn' ? 'ঘরে তৈরি স্বাস্থ্যকর খাবার' : 'ZERO Preservatives Promise'}
              </p>
            </div>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/10">
              <Leaf className="w-4 h-4 text-white" />
            </div>
          </div>
          
          <p className="text-xs text-emerald-900 leading-relaxed font-sans font-medium">
            {language === 'bn' 
              ? 'আমাদের কিচেনে বাসি খাবার বা ফ্রোজেন আইটেম সম্পূর্ণ নিষিদ্ধ। খাঁটি সরিষার তেল ও বাছাইকৃত তাজা দেশি উপকরণে প্রতিটি খাবার প্রস্তুত হয়।' 
              : 'Leftovers and mass frozen foods are strictly banned in our kitchen. We cook only with authentic home-pressed mustard oil and premium farm vegetables.'}
          </p>
        </div>

        {/* Bento Card 4: Highly Polished Rating / Trust Card */}
        <div className="col-span-6 md:col-span-3 lg:col-span-3 bg-white rounded-3xl border border-gray-150 p-6 flex flex-col justify-between shadow-lg shadow-gray-100/5 hover:shadow-xl transition-all duration-350 min-h-[180px]">
          <div className="space-y-2">
            <div className="flex items-center gap-0.5 shrink-0">
              {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-base font-extrabold text-gray-900 leading-tight">
              {language === 'bn' ? '৪.৯১ গড় রেটিং' : '4.91 Peak Rating'}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-450 font-bold uppercase tracking-wider leading-none">
              {language === 'bn' ? 'মায়ের হাতের রান্না' : '5-STAR FEEDBACK'}
            </p>
          </div>
          <p className="text-[11px] sm:text-xs text-gray-500 leading-normal">
            {language === 'bn' 
              ? 'চট্টগ্রামের ৫,০০০+ ভোজনরসিক পরিবারের অবিরাম আস্থা ও ভালোবাসার প্রতীক।' 
              : 'Loved and trusted by over 5,000+ local Chittagong families daily.'}
          </p>
        </div>

        {/* Bento Card 5: Safe Hot Delivery System */}
        <div className="col-span-6 md:col-span-3 lg:col-span-4 bg-white rounded-3xl border border-gray-150 p-6 flex flex-col justify-between shadow-lg shadow-gray-100/5 hover:shadow-xl transition-all duration-350 min-h-[180px]">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] bg-emerald-50 text-emerald-800 font-extrabold px-2.5 py-1 rounded-full uppercase border border-emerald-100 inline-block">
                {language === 'bn' ? 'উষ্ণ ও দ্রুত ডেলিভারি' : 'Steaming Hot'}
              </span>
              <p className="text-sm font-extrabold text-gray-950 leading-tight pt-1">
                {language === 'bn' ? '১০,০০০+ নিরাপদ অর্ডার' : '10,000+ Safe Deliveries'}
              </p>
            </div>
          </div>
          
          <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed font-sans">
            {language === 'bn' 
              ? 'বিশেষ থার্মাল ওভেন ও বায়ুনিরোধক বক্সে আপনার দরজায় খাবারটি পৌঁছাবে ধোঁয়া ওঠা গরম অবস্থায়।' 
              : 'Our sterilized thermal-retaining eco packaging ensures every dish delivers warm and oven-fresh.'}
          </p>
        </div>

      </div>

    </div>
  );
};
