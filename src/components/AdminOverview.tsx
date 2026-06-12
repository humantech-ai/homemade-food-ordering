import React, { useState } from 'react';
import { Order, MenuItem } from '../types';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  Flame, 
  ShoppingBag, 
  CreditCard, 
  TrendingUp, 
  Percent, 
  UtensilsCrossed, 
  Users,
  Smartphone,
  Sparkles
} from 'lucide-react';

interface AdminOverviewProps {
  orders: Order[];
  menuItems: MenuItem[];
  onViewOrdersTab: () => void;
  onViewMenuTab: () => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  orders,
  menuItems,
  onViewOrdersTab,
  onViewMenuTab
}) => {
  const [activeBar, setActiveBar] = useState<number | null>(null);
  const [activePie, setActivePie] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Filter out deleted orders
  const activeOrders = orders.filter(o => !o.isDeleted);

  // --- 1. CORE TELEMETRY CALCULATION ---
  const totalSales = activeOrders
    .filter(o => o.status === 'Delivered')
    .reduce((sum, o) => sum + o.totalPrice + o.deliveryCharge, 0);

  const pendingCount = activeOrders.filter(o => o.status === 'Pending').length;
  const preparingCount = activeOrders.filter(o => ['Accepted', 'Preparing', 'Out for Delivery'].includes(o.status)).length;
  
  // Delivered vs total (success rate)
  const completedOrders = activeOrders.filter(o => o.status === 'Delivered');
  const successRate = activeOrders.length > 0 
    ? Math.round((completedOrders.length / activeOrders.length) * 100) 
    : 100;

  // Average Order Value (AOV)
  const aov = completedOrders.length > 0
    ? Math.round(totalSales / completedOrders.length)
    : 0;

  // bKash payments total
  const bkashOrders = activeOrders.filter(o => o.paymentMethod === 'bKash');
  const codOrders = activeOrders.filter(o => o.paymentMethod === 'Cash on Delivery');

  // --- 2. BAR CHART: MEALS ORDER PATTERNS ---
  // Count menu item popularity across all active orders
  const itemCounts: Record<string, { count: number; nameBn: string; nameEn: string; color: string }> = {};
  
  // Seed with available items to prevent empty chart
  const validMenuItems = menuItems.filter(m => !m.isDeleted);
  const colors = [
    'from-amber-400 to-orange-500', 
    'from-pink-400 to-rose-500', 
    'from-emerald-400 to-teal-500',
    'from-sky-400 to-indigo-500', 
    'from-violet-400 to-purple-600',
    'from-yellow-400 to-amber-500'
  ];

  validMenuItems.forEach((item, index) => {
    itemCounts[item.id] = {
      count: 0,
      nameBn: item.nameBn,
      nameEn: item.nameEn,
      color: colors[index % colors.length]
    };
  });

  activeOrders.forEach(order => {
    order.items.forEach(orderItem => {
      if (itemCounts[orderItem.id]) {
        itemCounts[orderItem.id].count += orderItem.quantity;
      } else {
        // Fallback for custom or deleted menu items
        itemCounts[orderItem.id] = {
          count: orderItem.quantity,
          nameBn: orderItem.nameBn,
          nameEn: orderItem.nameEn,
          color: 'from-gray-400 to-gray-500'
        };
      }
    });
  });

  const popularItems = Object.entries(itemCounts)
    .map(([id, info]) => ({ id, ...info }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // top 5 popular items

  const maxCount = Math.max(...popularItems.map(i => i.count), 1);

  // --- 3. LINE CHART DATA (7 DAYS REGIONAL VOLUME) ---
  const lineChartData = [
    { dayBn: 'শনিবার', dayEn: 'Sat', val: 0, label: '৳' },
    { dayBn: 'রবিবার', dayEn: 'Sun', val: 0, label: '৳' },
    { dayBn: 'সোমবার', dayEn: 'Mon', val: 0, label: '৳' },
    { dayBn: 'মঙ্গলবার', dayEn: 'Tue', val: 0, label: '৳' },
    { dayBn: 'বুধবার', dayEn: 'Wed', val: 0, label: '৳' },
    { dayBn: 'বৃহস্পতিবার', dayEn: 'Thu', val: 0, label: '৳' },
    { dayBn: 'শুক্রবার', dayEn: 'Fri', val: 0, label: '৳' }
  ];

  // Distribute order dates across lineChartData (using actual order timestamps)
  activeOrders.forEach(order => {
    if (!order.createdAt) return;
    try {
      const orderDate = new Date(order.createdAt);
      const dayIndex = (orderDate.getDay() + 1) % 7; // Align to Sat (day 6 is Saturday)
      lineChartData[dayIndex].val += (order.totalPrice + order.deliveryCharge);
    } catch {
      // Ignore timestamp parsing bounds error
    }
  });

  const maxSales = Math.max(...lineChartData.map(d => d.val), 1);

  // --- 4. PIE DONUT DATA ---
  const bkashPercentage = activeOrders.length > 0 
    ? Math.round((bkashOrders.length / activeOrders.length) * 100) 
    : 0;
  const codPercentage = activeOrders.length > 0 
    ? Math.round((codOrders.length / activeOrders.length) * 100) 
    : 0;

  return (
    <div className="space-y-6 text-left">
      
      {/* 4 Cards Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Sales BDT */}
        <div className="bg-gradient-to-br from-white to-amber-50/20 rounded-2xl border border-amber-200/60 p-5 space-y-2.5 shadow-sm relative overflow-hidden transition-all duration-350 hover:shadow-md hover:-translate-y-0.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-sm shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Revenue</p>
            <h4 className="text-xl md:text-2xl font-extrabold text-amber-900 font-mono">৳{totalSales.toLocaleString()}</h4>
            <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-600">
              <TrendingUp className="w-3 h-3" />
              <span>৳{aov.toLocaleString()} AOV Avg</span>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 top-0 w-1.5 bg-gradient-to-b from-amber-400 to-orange-500" />
        </div>

        {/* Success Rate Card */}
        <div className="bg-gradient-to-br from-white to-emerald-50/20 rounded-2xl border border-emerald-200/60 p-5 space-y-2.5 shadow-sm relative overflow-hidden transition-all duration-350 hover:shadow-md hover:-translate-y-0.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Success Ratio</p>
            <h4 className="text-xl md:text-2xl font-extrabold text-emerald-990 font-mono">{successRate}%</h4>
            <div className="flex items-center gap-1 mt-1 text-[10px] font-semibold text-gray-500 font-mono">
              <span>{completedOrders.length} Completed</span>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 top-0 w-1.5 bg-gradient-to-b from-emerald-400 to-teal-500" />
        </div>

        {/* Pending Inquiries Status Card */}
        <div className="bg-gradient-to-br from-white to-pink-50/20 rounded-2xl border border-pink-200/60 p-5 space-y-2.5 shadow-sm relative overflow-hidden transition-all duration-350 hover:shadow-md hover:-translate-y-0.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-sm shadow-rose-500/20 group-hover:scale-105 transition-transform">
            <Clock className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Pending Tasks</p>
            <h4 className="text-xl md:text-2xl font-extrabold text-rose-950 font-mono">
              {pendingCount}
            </h4>
            <div className="flex items-center gap-1 mt-1 text-[10px] font-semibold text-amber-600">
              <Flame className="w-3 h-3 animate-bounce" />
              <span>{preparingCount} in Kitchen Queue</span>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 top-0 w-1.5 bg-gradient-to-b from-rose-500 to-pink-500" />
        </div>

        {/* Payments Ratio Quick Metric */}
        <div className="bg-gradient-to-br from-white to-sky-50/20 rounded-2xl border border-sky-200/60 p-5 space-y-2.5 shadow-sm relative overflow-hidden transition-all duration-350 hover:shadow-md hover:-translate-y-0.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-500 flex items-center justify-center text-white shadow-sm shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">bKash Ratio</p>
            <h4 className="text-xl md:text-2xl font-extrabold text-sky-950 font-mono">{bkashPercentage}%</h4>
            <div className="flex items-center gap-1 mt-1 text-[10px] font-semibold text-gray-500">
              <span>{bkashOrders.length} via bKash • {codOrders.length} COD</span>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 top-0 w-1.5 bg-gradient-to-b from-sky-400 to-blue-500" />
        </div>

      </div>

      {/* --- GRAPHS SECTION --- */}
      <div className="grid lg:grid-cols-12 gap-6 pt-2">
        
        {/* LINE CHART: Daily Sales Curve */}
        <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm lg:col-span-8 flex flex-col space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-50">
            <div>
              <h4 className="font-sans font-extrabold text-sm md:text-base text-gray-900 leading-tight flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>Daily Sales Performance Trend</span>
              </h4>
              <p className="text-[10px] text-gray-400 font-medium">Visualization of total order value across weekdays (BDT)</p>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              <span>Live Sync</span>
            </span>
          </div>

          <div className="relative h-48 w-full pt-4">
            {/* SVG responsive graph lines */}
            <svg className="w-full h-full overflow-visible" viewBox="0 0 700 130" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.00" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="10" x2="700" y2="10" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="50" x2="700" y2="50" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="90" x2="700" y2="90" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="130" x2="700" y2="130" stroke="#e2e8f0" strokeWidth="1" />

              {/* Area path */}
              <path
                d={`M 0,130 
                    ${lineChartData.map((d, i) => `${(i * 700) / 6},${130 - (d.val / maxSales) * 115}`).join(' ')} 
                    700,130 Z`}
                fill="url(#lineGlow)"
              />

              {/* Continuous Trend Line */}
              <path
                d={lineChartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${(i * 700) / 6},${130 - (d.val / maxSales) * 115}`).join(' ')}
                fill="none"
                stroke="#d97706"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Circular nodes on the line chart */}
              {lineChartData.map((d, i) => {
                const cx = (i * 700) / 6;
                const cy = 130 - (d.val / maxSales) * 115;
                const isHovered = hoveredPoint === i;
                return (
                  <g key={i}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 7 : 4.5}
                      className="fill-white stroke-amber-600 cursor-pointer transition-all duration-150"
                      strokeWidth={isHovered ? 4.5 : 2.5}
                      onMouseEnter={() => setHoveredPoint(i)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    {isHovered && (
                      <foreignObject x={cx - 50} y={cy - 40} width="100" height="35" className="overflow-visible">
                        <div className="bg-gray-900 shadow-xl border border-gray-800 rounded-lg p-1 text-center scale-95 transition-all text-white">
                          <p className="text-[9px] font-black truncate">৳{d.val.toLocaleString()}</p>
                        </div>
                      </foreignObject>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Bottom labels */}
            <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-2.5 px-0.5">
              {lineChartData.map((d, i) => (
                <span key={i} className="text-center w-10 font-sans tracking-tight">
                  {d.dayEn}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* PIE DONUT: Payment Channels Distribution */}
        <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm lg:col-span-4 flex flex-col justify-between">
          <div className="pb-3 border-b border-gray-50 text-left">
            <h4 className="font-sans font-extrabold text-sm text-gray-900">Payment Modes Ratio</h4>
            <p className="text-[10px] text-gray-400 font-medium">COD versus cash-out secure bKash</p>
          </div>

          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative w-36 h-36">
              {/* Pie Donut visualizer using responsive native CSS and SVG */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                {/* Background Ring */}
                <circle cx="18" cy="18" r="14.3" fill="none" stroke="#f1f5f9" strokeWidth="4.5" />
                
                {/* bKash Arc */}
                <circle 
                  cx="18" 
                  cy="18" 
                  r="14.3" 
                  fill="none" 
                  stroke="#0d9488" 
                  strokeWidth="4.5" 
                  strokeDasharray={`${bkashPercentage} ${100 - bkashPercentage}`}
                  strokeDashoffset="0"
                  className="transition-all duration-700 ease-out cursor-pointer"
                  onMouseEnter={() => setActivePie('bKash')}
                  onMouseLeave={() => setActivePie(null)}
                />

                {/* COD Arc */}
                <circle 
                  cx="18" 
                  cy="18" 
                  r="14.3" 
                  fill="none" 
                  stroke="#4f46e5" 
                  strokeWidth="4.5" 
                  strokeDasharray={`${codPercentage} ${100 - codPercentage}`}
                  strokeDashoffset={-bkashPercentage}
                  className="transition-all duration-700 ease-out cursor-pointer"
                  onMouseEnter={() => setActivePie('cod')}
                  onMouseLeave={() => setActivePie(null)}
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[8px] font-extrabold tracking-wider uppercase text-gray-400">Total volume</span>
                <span className="text-sm font-black text-gray-950 font-mono">{activeOrders.length}</span>
              </div>
            </div>
          </div>

          {/* Map labels and percentages */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between text-xs p-2 rounded-xl transition-all hover:bg-teal-50/20">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-teal-600" />
                <span className="font-bold text-gray-650">bKash Mobile Money</span>
              </div>
              <span className="font-extrabold text-teal-700 font-mono text-sm">{bkashPercentage}%</span>
            </div>
            <div className="flex items-center justify-between text-xs p-2 rounded-xl transition-all hover:bg-indigo-50/20">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-indigo-600" />
                <span className="font-bold text-gray-650">Cash on Delivery</span>
              </div>
              <span className="font-extrabold text-indigo-700 font-mono text-sm">{codPercentage}%</span>
            </div>
          </div>
        </div>

      </div>

      {/* --- SECTION 3: MULTI-COLOR BAR CHART FOR PRODUCT SALES VOLUME & QUICK TRAFFIC --- */}
      <div className="grid lg:grid-cols-12 gap-6 pt-2">
        
        {/* BAR CHART: Famous menu dishes */}
        <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm lg:col-span-8 flex flex-col space-y-4">
          <div>
            <h4 className="font-sans font-extrabold text-sm md:text-base text-gray-900 flex items-center gap-1">
              <UtensilsCrossed className="w-4 h-4 text-rose-500" />
              <span>Top Demanded Traditional Delicacies</span>
            </h4>
            <p className="text-[10px] text-gray-400 font-medium">Calculated quantity of helpings sold in delivery orders</p>
          </div>

          <div className="space-y-4 pt-1">
            {popularItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">No active selling statistics yet.</div>
            ) : (
              popularItems.map((item, idx) => {
                const percent = Math.round((item.count / maxCount) * 100);
                return (
                  <div key={item.id} className="space-y-1.5 group cursor-pointer" onMouseEnter={() => setActiveBar(idx)} onMouseLeave={() => setActiveBar(null)}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-gray-800 group-hover:text-amber-700 transition-colors">
                        {item.nameEn} • <span className="font-semibold text-gray-400">{item.nameBn}</span>
                      </span>
                      <span className="font-mono font-bold text-gray-900 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-lg">
                        {item.count} sold
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden relative">
                      <div 
                        className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-800 ease-out`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* QUICK LINK PANEL */}
        <div className="bg-gradient-to-br from-white to-gray-50/20 rounded-3xl border border-gray-150 p-6 shadow-sm lg:col-span-4 flex flex-col justify-between space-y-5">
          <div className="space-y-2 text-left">
            <h4 className="font-sans font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin-slow" />
              <span>Operator shortcuts</span>
            </h4>
            <p className="text-[10px] text-gray-400">Instantly browse and manage live inventory and customer entries</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={onViewOrdersTab}
              className="w-full p-4 bg-white hover:bg-amber-50/50 hover:border-amber-400 border border-gray-150 rounded-2xl flex items-center justify-between text-xs font-bold text-gray-800 cursor-pointer shadow-sm active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="font-black">Verify Orders Inbound</p>
                  <p className="text-[9px] text-gray-400 normal-case">Handle queue acceptances and receipts</p>
                </div>
              </div>
              <TrendingUp className="w-4 h-4 text-amber-500" />
            </button>

            <button
              onClick={onViewMenuTab}
              className="w-full p-4 bg-white hover:bg-rose-50/50 hover:border-rose-400 border border-gray-150 rounded-2xl flex items-center justify-between text-xs font-bold text-gray-800 cursor-pointer shadow-sm active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="font-black">Modify Menu Listings</p>
                  <p className="text-[9px] text-gray-400 normal-case">Adjust prices and dynamic ingredients</p>
                </div>
              </div>
              <TrendingUp className="w-4 h-4 text-rose-500" />
            </button>
          </div>

          <div className="bg-amber-50/40 border border-amber-200/50 p-4 rounded-2xl text-[10px] text-amber-900 leading-relaxed font-medium">
            💡 <strong className="font-bold">Protip:</strong> You can apply exclusive coupon discounts directly in customer transactions from the active checkouts panel!
          </div>
        </div>

      </div>

    </div>
  );
};
