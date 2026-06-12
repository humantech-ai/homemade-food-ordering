import React from 'react';
import { useLocalization } from './LocalizationContext';
import { useCart } from './CartContext';
import { ShoppingBag, Search, ShieldAlert, Globe, Utensils } from 'lucide-react';

interface HeaderProps {
  onOpenCart: () => void;
  onOpenTracking: () => void;
  onOpenAdmin: () => void;
  onGoHome: () => void;
  activeView: string;
  isAdminLoggedIn?: boolean;
  adminRole?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCart,
  onOpenTracking,
  onOpenAdmin,
  onGoHome,
  activeView,
  isAdminLoggedIn,
  adminRole
}) => {
  const { language, setLanguage, t } = useLocalization();
  const { getCartCount } = useCart();
  const count = getCartCount();

  const toggleLanguage = () => {
    setLanguage(language === 'bn' ? 'en' : 'bn');
  };

  return (
    <header id="site_header" className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-3">
        
        {/* Brand Logo */}
        <button 
          onClick={onGoHome}
          className="flex items-center gap-2 cursor-pointer group text-left"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/10 group-hover:scale-105 transition-transform font-display font-black text-xl italic">
            R
          </div>
          <div>
            <h1 className="font-display font-extrabold text-sm md:text-base text-gray-900 leading-tight tracking-tight">
              {t('appName')}<span className="text-amber-500 font-extrabold">.</span>
            </h1>
            <p className="text-[8px] uppercase tracking-wider font-extrabold text-amber-500">
              {language === 'bn' ? 'চট্টগ্রামের ঐতিহ্যবাহী খাঁটি স্বাদ' : 'Traditional Chittagong Kitchen'}
            </p>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-2 md:gap-3">
          
          {/* Quick-Return Admin Portal Banner Badge */}
          {isAdminLoggedIn && activeView !== 'admin' && (
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-red-600 to-amber-650 hover:from-red-700 hover:to-orange-700 text-white transition-all scale-100 hover:scale-102 active:scale-95 cursor-pointer shadow-lg shadow-red-600/10 border border-red-500/10"
              id="header_admin_back_btn"
              title="Return back to the active administrative terminal panel"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-100 animate-pulse" />
              <span className="hidden xs:inline">{adminRole === 'super_admin' ? 'Super Admin Panel' : 'Admin Panel'}</span>
              <span className="xs:hidden">{adminRole === 'super_admin' ? 'Super' : 'Admin'}</span>
            </button>
          )}

          {/* Tracking button */}
          <button
            onClick={onOpenTracking}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
              activeView === 'tracking'
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('trackYourOrder')}</span>
          </button>

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'English' : 'বাংলা'}</span>
          </button>

          {/* Secret Admin status active helper indicator if viewing admin mode */}
          {activeView === 'admin' && (
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" title="Admin Mode Active" />
          )}

          {/* Shopping Bag Button */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gray-950 hover:bg-gray-850 text-white shadow-lg shadow-gray-950/20 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-white animate-bounce">
                {count}
              </span>
            )}
          </button>

        </div>
      </div>
    </header>
  );
};
