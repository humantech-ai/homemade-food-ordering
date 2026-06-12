import React, { useState } from 'react';
import { Coupon, MenuItem, Order } from '../types';
import { 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Tag, 
  Calendar, 
  ToggleLeft, 
  ToggleRight, 
  ShoppingBag, 
  Smartphone,
  CheckCircle,
  HelpCircle,
  Clock,
  Sparkles,
  BarChart4,
  Search,
  Filter,
  Loader2
} from 'lucide-react';

interface AdminCouponsProps {
  coupons: Coupon[];
  menuItems: MenuItem[];
  orders: Order[];
  onCreateCoupon: (coupon: Coupon) => Promise<void>;
  onUpdateCoupon: (id: string, updates: Partial<Coupon>) => Promise<void>;
  onDeleteCoupon: (id: string) => Promise<void>;
  permissions: string[];
}

export const AdminCoupons: React.FC<AdminCouponsProps> = ({
  coupons,
  menuItems,
  orders,
  onCreateCoupon,
  onUpdateCoupon,
  onDeleteCoupon,
  permissions
}) => {
  // Check permission constraints
  const canManage = permissions.includes('manage_site_config') || permissions.includes('all');

  // Input states
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [offerName, setOfferName] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [applicability, setApplicability] = useState<'all' | 'specific'>('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [errorText, setErrorText] = useState('');

  // Search/Filter states
  const [searchText, setSearchText] = useState('');

  // Handle checked menus for specific product coupon assignment
  const toggleProductSelect = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter(pid => pid !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    const promoCode = code.trim().toUpperCase();
    if (!promoCode) {
      setErrorText('Please enter a unique coupon code identifier.');
      return;
    }
    if (!offerName.trim()) {
      setErrorText('Please enter a descriptive offer name.');
      return;
    }
    if (discountValue <= 0) {
      setErrorText('Discount value must be greater than zero.');
      return;
    }
    if (discountType === 'percentage' && discountValue > 100) {
      setErrorText('Percentage discount cannot exceed 100%.');
      return;
    }
    if (applicability === 'specific' && selectedProductIds.length === 0) {
      setErrorText('Please select at least one menu item or toggle to "Select all items".');
      return;
    }

    const newCoupon: Coupon = {
      id: promoCode,
      offerName: offerName.trim(),
      discountType,
      discountValue,
      isActive: true,
      applicability,
      applicableProductIds: applicability === 'specific' ? selectedProductIds : [],
      startDate: startDate || undefined,
      endDate: endDate || undefined
    };

    setIsSaving(true);
    try {
      await onCreateCoupon(newCoupon);
      // Reset
      setCode('');
      setOfferName('');
      setDiscountType('percentage');
      setDiscountValue(0);
      setStartDate('');
      setEndDate('');
      setApplicability('all');
      setSelectedProductIds([]);
      setShowAddForm(false);
      setErrorText('');
    } catch (err: any) {
      setErrorText(err.message || 'Could not instantiate coupon code.');
    } finally {
      setIsSaving(false);
    }
  };

  // Extract usage/sales analytical data dynamically for a given coupon
  const getCouponUsageStats = (couponId: string) => {
    const couponOrders = orders.filter(o => 
      !o.isDeleted && 
      o.couponCode?.toUpperCase() === couponId.toUpperCase()
    );

    const totalRedeemedCount = couponOrders.length;
    const totalCouponDiscountSavings = couponOrders.reduce((sum, o) => sum + (o.couponDiscount || 0), 0);
    const totalRevenueGenerated = couponOrders.reduce((sum, o) => sum + o.totalPrice, 0);

    // Track transactional details: date, dishes ordered, customer telephone
    const salesTable = couponOrders.map(order => {
      // Gather item names
      const itemNames = order.items.map(item => `${item.nameEn} (x${item.quantity})`).join(', ');
      return {
        id: order.id,
        dateTime: order.createdAt ? new Date(order.createdAt).toLocaleString('bn-BD', { hour12: true }) : 'N/A',
        customerPhone: order.phoneNumber || 'N/A',
        productNames: itemNames,
        discountApplied: order.couponDiscount || 0,
        paidAmount: order.totalPrice
      };
    });

    return {
      count: totalRedeemedCount,
      savings: totalCouponDiscountSavings,
      revenue: totalRevenueGenerated,
      salesTable
    };
  };

  // Filter coupons list
  const filteredCoupons = coupons.filter(c => 
    !c.isDeleted && 
    (c.id.toLowerCase().includes(searchText.toLowerCase()) || 
     c.offerName.toLowerCase().includes(searchText.toLowerCase()))
  );

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-500" />
            <span>Manage Promotional Coupons & Discounts</span>
          </h2>
          <p className="text-[10px] sm:text-xs text-gray-500 font-medium">Create valid loyalty codes, activate specific dish eligibility, and review checkout redemptions</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full sm:w-auto p-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-black cursor-pointer shadow-md shadow-amber-500/10 flex items-center justify-center gap-2 transition-all"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showAddForm ? 'Hide Form' : 'Instantiate Coupon'}</span>
          </button>
        )}
      </div>

      {/* ERROR DISPLAY */}
      {errorText && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
          <X className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorText}</span>
        </div>
      )}

      {/* ADD/CREATE COUPON FORM CONTAINER */}
      {showAddForm && canManage && (
        <form onSubmit={handleCreateSubmit} className="bg-gradient-to-br from-white to-amber-50/10 border border-amber-200/60 p-6 rounded-3xl shadow-sm space-y-5">
          <div className="border-b border-amber-100 pb-2.5">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Instantiate New Loyalty Code</span>
            </h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Promo Code Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-500">Loyalty Code (Uppercase, Alphanumeric)</label>
              <input
                type="text"
                required
                placeholder="e.g. MEZBAN50"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                className="w-full p-3 bg-white border border-gray-150 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/10 font-mono tracking-wider placeholder:font-sans placeholder:tracking-normal"
              />
            </div>

            {/* Offer Name Description */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-500">Offer Banner Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Friday Eid Special Offer"
                value={offerName}
                onChange={e => setOfferName(e.target.value)}
                className="w-full p-3 bg-white border border-gray-150 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/10"
              />
            </div>

            {/* Discount Type Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-500">Reduction Structure</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDiscountType('percentage')}
                  className={`p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                    discountType === 'percentage'
                      ? 'bg-amber-500/15 border-amber-400 text-amber-700 font-extrabold shadow-sm'
                      : 'bg-white border-gray-150 text-gray-500'
                  }`}
                >
                  Percentage (%)
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('fixed')}
                  className={`p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                    discountType === 'fixed'
                      ? 'bg-amber-500/15 border-amber-400 text-amber-700 font-extrabold shadow-sm'
                      : 'bg-white border-gray-150 text-gray-500'
                  }`}
                >
                  Flat Cash Check (৳)
                </button>
              </div>
            </div>

            {/* Discount Value */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-500">
                {discountType === 'percentage' ? 'Percentage Reduction (%)' : 'Flat Cash Value (BDT / ৳)'}
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder={discountType === 'percentage' ? 'e.g. 20' : 'e.g. 150'}
                value={discountValue || ''}
                onChange={e => setDiscountValue(parseInt(e.target.value) || 0)}
                className="w-full p-3 bg-white border border-gray-150 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/10 font-mono"
              />
            </div>

            {/* Optional Validity Start Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-300 dark:text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Starts Date Bounds (Optional)</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full p-3 bg-white border border-gray-150 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            {/* Optional Validity End Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-300 dark:text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Expires Date Bounds (Optional)</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full p-3 bg-white border border-gray-150 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

          </div>

          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-gray-100 pt-3 gap-2">
              <label className="text-[10px] font-black uppercase text-gray-400">Coupon Application Scope</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setApplicability('all')}
                  className={`px-4 py-1.5 rounded-full border text-[10px] font-bold cursor-pointer transition-all ${
                    applicability === 'all'
                      ? 'bg-gray-950 border-gray-950 text-white font-extrabold'
                      : 'bg-white border-gray-150 text-gray-500'
                  }`}
                >
                  Apply to all recipes
                </button>
                <button
                  type="button"
                  onClick={() => setApplicability('specific')}
                  className={`px-4 py-1.5 rounded-full border text-[10px] font-bold cursor-pointer transition-all ${
                    applicability === 'specific'
                      ? 'bg-amber-500 border-amber-500 text-white font-extrabold'
                      : 'bg-white border-gray-150 text-gray-500'
                  }`}
                >
                  Select specific items
                </button>
              </div>
            </div>

            {/* If Specific Item Selection is checked */}
            {applicability === 'specific' && (
              <div className="border border-amber-100 bg-amber-50/15 p-4 rounded-2xl max-h-48 overflow-y-auto space-y-2">
                <p className="text-[9px] font-black uppercase text-amber-800 mb-1 leading-none">Select dish products that qualify under this code:</p>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {menuItems.filter(item => !item.isDeleted).map(item => {
                    const isSelected = selectedProductIds.includes(item.id);
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => toggleProductSelect(item.id)}
                        className={`p-2.5 border rounded-xl text-left text-[11px] font-bold flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-300 text-amber-900 font-extrabold'
                            : 'bg-white border-gray-200 text-gray-600'
                        }`}
                      >
                        <span className="truncate pr-1">{item.nameEn}</span>
                        {isSelected ? (
                          <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-white text-[9px]">✓</div>
                        ) : (
                          <div className="w-4 h-4 border border-gray-300 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setShowAddForm(false)}
              className="p-3 px-6 bg-gray-100 hover:bg-gray-250 text-gray-600 font-bold text-xs rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`p-3 px-8 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md flex items-center gap-1.5 transition-all ${
                isSaving 
                  ? 'bg-amber-450 cursor-not-allowed opacity-80' 
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/10'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Coupon</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* INNER SEARCH & OVERVIEW GRID */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        
        {/* COUPONS DIRECTORY */}
        <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-50 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-gray-900">Active Promos Catalog</h3>
              <p className="text-[10px] text-gray-400 font-semibold">Listing all available configurations</p>
            </div>
            
            {/* Search Input bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter by code/name..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                className="p-2 pl-8 text-[11px] font-bold bg-gray-50 border border-gray-150 rounded-xl focus:outline-none focus:border-amber-400 text-gray-900 w-full sm:w-48 placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="divide-y divide-gray-100 space-y-0.5">
            {filteredCoupons.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-450 flex flex-col items-center justify-center gap-1">
                <Tag className="w-8 h-8 text-gray-250" />
                <p>No coupons found matching search.</p>
              </div>
            ) : (
              filteredCoupons.map(coupon => {
                const stats = getCouponUsageStats(coupon.id);
                const isSelected = selectedCouponId === coupon.id;
                
                // Expiry statuses checking
                let isExpired = false;
                if (coupon.endDate) {
                  const end = new Date(coupon.endDate);
                  end.setHours(23, 59, 59, 999);
                  if (new Date() > end) isExpired = true;
                }

                // Start date status validation
                let isNotStartedYet = false;
                if (coupon.startDate) {
                  const start = new Date(coupon.startDate);
                  if (new Date() < start) isNotStartedYet = true;
                }

                return (
                  <div 
                    key={coupon.id} 
                    className={`py-3.5 px-3 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                      isSelected ? 'bg-amber-500/5 border border-amber-200/50' : 'hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="space-y-1.5 text-left max-w-sm shrink-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-xs text-gray-950 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg tracking-wider">
                          {coupon.id}
                        </span>
                        <div className="flex gap-1.5">
                          {/* Toggle Switch Pill */}
                          {coupon.isActive ? (
                            <span className="text-[8px] bg-emerald-50 border border-emerald-100 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5">
                              ● Active
                            </span>
                          ) : (
                            <span className="text-[8px] bg-gray-100 border border-gray-200 text-gray-400 font-extrabold px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5">
                              ○ Off
                            </span>
                          )}

                          {isExpired && (
                            <span className="text-[8px] bg-rose-50 border border-rose-100 text-rose-700 font-extrabold px-1.5 py-0.5 rounded uppercase">
                              Expired
                            </span>
                          )}
                          
                          {isNotStartedYet && (
                            <span className="text-[8px] bg-blue-50 border border-blue-100 text-blue-700 font-extrabold px-1.5 py-0.5 rounded uppercase">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-xs text-gray-900 leading-tight">{coupon.offerName}</h4>
                        <div className="text-[10px] text-gray-400 font-medium flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span className="font-extrabold text-amber-700">
                            {coupon.discountType === 'percentage' ? `${coupon.discountValue}% Reduction` : `৳${coupon.discountValue} Flat Sale`}
                          </span>
                          <span>•</span>
                          <span>{coupon.applicability === 'all' ? 'All products eligible' : `${coupon.applicableProductIds?.length} qualified dishes`}</span>
                        </div>
                      </div>

                      {/* Render Dates Validity ranges */}
                      {(coupon.startDate || coupon.endDate) && (
                        <div className="flex items-center gap-1 text-[9px] text-gray-400 font-mono">
                          <Calendar className="w-3 h-3 text-gray-300" />
                          <span>
                            {coupon.startDate ? new Date(coupon.startDate).toLocaleDateString() : 'Always'} 
                            {' ~ '} 
                            {coupon.endDate ? new Date(coupon.endDate).toLocaleDateString() : 'Forever'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Operational action toggles and statistics */}
                    <div className="flex items-center justify-between md:justify-end gap-3 mt-1 md:mt-0 pt-2 md:pt-0 border-t md:border-0 border-gray-50">
                      
                      <button
                        onClick={() => setSelectedCouponId(coupon.id)}
                        className={`p-1.5 px-3 rounded-lg text-[10px] font-black cursor-pointer transition-all flex items-center gap-1 ${
                          isSelected 
                            ? 'bg-amber-500 text-white' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        <BarChart4 className="w-3.5 h-3.5" />
                        <span>{stats.count} checkout sales</span>
                      </button>

                      {canManage && (
                        <div className="flex items-center gap-2">
                          {/* Active controller Toggle */}
                          <button
                            type="button"
                            onClick={() => onUpdateCoupon(coupon.id, { isActive: !coupon.isActive })}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="Toggle Activation status"
                          >
                            {coupon.isActive ? (
                              <ToggleRight className="w-7 h-7 text-emerald-600 cursor-pointer" />
                            ) : (
                              <ToggleLeft className="w-7 h-7 text-gray-300 cursor-pointer" />
                            )}
                          </button>

                          {/* Delete design code */}
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to revoke and delete coupon code ${coupon.id}?`)) {
                                onDeleteCoupon(coupon.id);
                                if (isSelected) setSelectedCouponId(null);
                              }
                            }}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl cursor-pointer"
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Dynamic usage details analytical statistics */}
        <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm lg:col-span-5 space-y-4">
          <div className="border-b border-gray-50 pb-3 text-left">
            <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
              <BarChart4 className="w-4 h-4 text-emerald-600 mt-0.5" />
              <span>Checkout Redemptions Analytics</span>
            </h3>
            <p className="text-[10px] text-gray-400 font-semibold">Select any promotional coupon left to evaluate sales activity</p>
          </div>

          {!selectedCouponId ? (
            <div className="py-20 text-center text-xs text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 p-6 flex flex-col items-center justify-center gap-2">
              <HelpCircle className="w-8 h-8 text-gray-300" />
              <p className="font-bold">No active Coupon Selected</p>
              <p className="text-[10px] max-w-xs leading-normal">Click any coupon's "sales" badge inside the list to view comprehensive purchase journals and customer demographics.</p>
            </div>
          ) : (
            (() => {
              const selectedCoupon = coupons.find(c => c.id === selectedCouponId);
              if (!selectedCoupon) {
                return <div className="py-4 text-center text-xs text-gray-400">Coupon data not found.</div>;
              }
              const analysis = getCouponUsageStats(selectedCouponId);
              
              return (
                <div className="space-y-4 text-left">
                  
                  {/* Static card metrics overview */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50/20 border border-amber-200/50 p-4 rounded-2xl shrink-0 space-y-1.5">
                    <p className="text-[10px] uppercase font-bold text-gray-400 leading-none">Coupon Analyzed</p>
                    <h4 className="font-mono font-black text-sm text-amber-950 flex items-center gap-1.5">
                      <span>{selectedCoupon.id}</span>
                      <span className="text-xs font-sans font-bold text-gray-500">({selectedCoupon.offerName})</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-amber-200/40">
                      <div>
                        <p className="text-[8px] uppercase font-bold text-gray-400">Times Applied</p>
                        <p className="text-sm font-extrabold text-gray-900 font-mono">{analysis.count} times</p>
                      </div>
                      <div>
                        <p className="text-[8px] uppercase font-bold text-gray-400">Total Savings Generaled</p>
                        <p className="text-sm font-extrabold text-emerald-700 font-mono">৳{analysis.savings.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Operational spreadsheet datatable journal of transactions */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] uppercase font-black text-gray-400">Order Logs using {selectedCoupon.id}</h4>
                    {analysis.salesTable.length === 0 ? (
                      <div className="py-12 border border-dashed border-gray-150 rounded-2xl text-center text-[11px] text-gray-450">
                        This promotional code hasn't been redeemed in any checkouts yet.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
                        {analysis.salesTable.map((sale, i) => (
                          <div key={sale.id} className="p-3 border border-gray-150 rounded-xl text-xs space-y-2 hover:border-amber-300 transition-colors bg-white">
                            <div className="flex items-center justify-between">
                              <p className="font-mono text-[9px] text-gray-450 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{sale.dateTime}</span>
                              </p>
                              <div className="text-right">
                                <span className="font-black text-gray-900">৳{sale.paidAmount} paid</span>
                              </div>
                            </div>

                            <p className="font-bold text-gray-800 text-[11px] leading-tight flex items-center gap-1">
                              <ShoppingBag className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span>{sale.productNames}</span>
                            </p>

                            <div className="flex items-center justify-between text-[10px] border-t border-gray-50 pt-1.5 mt-0.5">
                              <p className="font-bold text-gray-600 flex items-center gap-1">
                                <Smartphone className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                <span>Phone:</span>
                                <span className="font-mono text-gray-950 font-black">{sale.customerPhone}</span>
                              </p>
                              <p className="text-emerald-700 font-semibold text-[10px]">
                                Saved ৳{sale.discountApplied}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              );
            })()
          )}
        </div>

      </div>

    </div>
  );
};
