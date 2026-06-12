import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { Search, Eye, Edit, ChevronDown, Check, X, ShieldAlert, FileText, Trash2, Loader2, Download, Tag } from 'lucide-react';
import { Invoice } from './Invoice';

interface AdminOrdersProps {
  orders: Order[];
  onUpdateOrderStatus: (id: string, status: OrderStatus) => void;
  onDeleteOrder: (id: string) => void;
  permissions: string[];
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({
  orders,
  onUpdateOrderStatus,
  onDeleteOrder,
  permissions
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [couponFilter, setCouponFilter] = useState<string>('All');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  const canManage = permissions.includes('manage_orders') || permissions.includes('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, newStatus: OrderStatus) => {
    setUpdatingId(id);
    try {
      await onUpdateOrderStatus(id, newStatus);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Order ID',
      'Invoice Number',
      'Created At',
      'Status',
      'Customer Name',
      'Phone Number',
      'Delivery Address',
      'Ordered Dishes',
      'Food Bill (৳)',
      'Delivery Charge (৳)',
      'Coupon Applied',
      'Coupon Code',
      'Coupon Discount (৳)',
      'Total Bill (৳)',
      'Payment Method',
      'bKash Number',
      'Transaction ID'
    ];

    const rows = filteredOrders.map(o => {
      const itemsListStr = o.items.map(item => `${item.nameEn} (x${item.quantity})`).join(' | ');
      const hasCoupon = !!o.couponCode;
      const totalPaid = o.totalPrice + o.deliveryCharge;
      return [
        o.id,
        o.invoiceNumber,
        o.createdAt ? new Date(o.createdAt).toLocaleString() : '',
        o.status,
        o.fullName.replace(/"/g, '""'),
        o.phoneNumber,
        o.fullAddress.replace(/"/g, '""'),
        itemsListStr.replace(/"/g, '""'),
        o.totalPrice,
        o.deliveryCharge,
        hasCoupon ? 'YES' : 'NO',
        o.couponCode || '',
        o.couponDiscount || 0,
        totalPaid,
        o.paymentMethod,
        o.bKashNumber || '',
        o.transactionId || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `traditional_food_orders_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredOrders = orders.filter(o => {
    if (o.isDeleted) return false;
    
    // Clean leading hash from search term
    const termCleaned = searchTerm.trim().replace(/^#/, '').toLowerCase();
    
    // Search constraints
    const matchesSearch = 
      o.fullName.toLowerCase().includes(termCleaned) ||
      o.phoneNumber.includes(termCleaned) ||
      o.id.toLowerCase().includes(termCleaned) ||
      o.invoiceNumber.toLowerCase().includes(termCleaned) ||
      (o.bKashNumber && o.bKashNumber.includes(termCleaned)) ||
      (o.transactionId && o.transactionId.toLowerCase().includes(termCleaned));
    
    // Filter by status
    const matchesStatus = statusFilter === 'All' ? true : o.status === statusFilter;

    // Filter by Coupon applied state
    let matchesCoupon = true;
    if (couponFilter === 'Applied') {
      matchesCoupon = !!o.couponCode;
    } else if (couponFilter === 'NotApplied') {
      matchesCoupon = !o.couponCode;
    }

    return matchesSearch && matchesStatus && matchesCoupon;
  });

  const statuses: OrderStatus[] = [
    'Pending',
    'Hold',
    'Accepted',
    'Preparing',
    'Out for Delivery',
    'Delivered',
    'Cancelled'
  ];

  // Coupon statistics metrics for pattern analysis
  const activeNonDeletedOrders = orders.filter(o => !o.isDeleted);
  const couponOrdersCount = activeNonDeletedOrders.filter(o => !!o.couponCode).length;
  const totalCouponSavings = activeNonDeletedOrders.reduce((sum, o) => sum + (o.couponDiscount || 0), 0);
  const couponDiscountedSalesTotal = activeNonDeletedOrders.filter(o => !!o.couponCode).reduce((sum, o) => sum + o.totalPrice, 0);

  return (
    <div className="space-y-6 text-left">
      
      {/* Sales Stats for Coupon Performance & Pattern Analysis */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white border border-gray-150 p-4 rounded-2xl shadow-sm">
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Coupon Frequency</span>
          <p className="text-base font-black text-amber-900 mt-0.5">{couponOrdersCount} checkouts</p>
          <p className="text-[9px] text-gray-450">Out of {activeNonDeletedOrders.length} total orders</p>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Cumulated Discounts</span>
          <p className="text-base font-black text-emerald-700 mt-0.5">৳{totalCouponSavings.toLocaleString()}</p>
          <p className="text-[9px] text-gray-450">Active balance savings</p>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Sales Under Coupons</span>
          <p className="text-base font-black text-gray-800 mt-0.5">৳{couponDiscountedSalesTotal.toLocaleString()}</p>
          <p className="text-[9px] text-gray-450">Food bill receipts sum</p>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Coupon Utilization Rate</span>
          <p className="text-base font-black text-sky-700 mt-0.5">
            {activeNonDeletedOrders.length > 0 ? Math.round((couponOrdersCount / activeNonDeletedOrders.length) * 100) : 0}%
          </p>
          <p className="text-[9px] text-gray-450">System market reach ratio</p>
        </div>
      </div>

      {/* Search and status filter triggers */}
      <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between bg-white/50 p-3 rounded-2xl border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-1">
          {/* Main Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders (Name, Phone, ID or Inv)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-gray-150 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Coupon interactive filters dropdown */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <span className="text-[11px] font-bold text-gray-400 shrink-0">Coupon:</span>
            <select
              value={couponFilter}
              onChange={(e) => setCouponFilter(e.target.value)}
              className="p-1 px-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-700 font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 select-none cursor-pointer"
            >
              <option value="All">All Transactions</option>
              <option value="Applied">Only Coupon Applied</option>
              <option value="NotApplied">No Coupon Applied</option>
            </select>
          </div>
        </div>
        
        {/* Actions bar */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          {/* Status Category switcher */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b sm:border-0 max-w-[280px] xs:max-w-md md:max-w-full">
            {['All', ...statuses].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all border whitespace-nowrap shrink-0 ${
                  statusFilter === st
                    ? 'bg-amber-500 border-amber-500 text-white font-bold'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* CSV Export Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 border border-emerald-600/10 text-white transition-all cursor-pointer shadow-md shadow-emerald-600/5 active:scale-95 shrink-0"
            title="Download CSV database export sheet"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        
        {/* Orders Table list split */}
        <div className={`bg-white rounded-3xl border border-gray-150 overflow-hidden shadow-sm ${selectedInvoiceOrder ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-gray-50 text-[10px] uppercase font-extrabold text-gray-500 border-b border-gray-100">
                  <th className="p-4 min-w-[140px]">Customer Details</th>
                  <th className="p-4">Dishes Ordered</th>
                  <th className="p-4">Price (Food Bill)</th>
                  <th className="p-4">Del. Charge</th>
                  <th className="p-4">Coupon Info</th>
                  <th className="p-4">Verification</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-750">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-gray-400 italic">
                      No matching orders available under current filters.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => {
                    return (
                      <tr 
                        key={o.id} 
                        className={`hover:bg-gray-50/40 transition-colors ${selectedInvoiceOrder?.id === o.id ? 'bg-amber-50/20 font-medium' : ''}`}
                      >
                        
                        {/* Name and delivery data */}
                        <td className="p-4">
                          <div className="font-bold text-gray-905 leading-tight">{o.fullName}</div>
                          <div className="font-extrabold text-amber-600 text-[9px] uppercase font-mono mt-0.5">ID: #{o.id}</div>
                          <p className="text-[10px] text-gray-500 font-semibold font-mono mt-0.5">{o.phoneNumber}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5 leading-tight truncate max-w-[140px]" title={o.fullAddress}>{o.fullAddress}</p>
                          <p className="text-[9px] font-mono text-gray-450 mt-1">Inv: {o.invoiceNumber}</p>
                        </td>

                        {/* Ordered Item list */}
                        <td className="p-4 max-w-[180px]">
                          <div className="space-y-0.5">
                            {o.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-1 text-[11px] text-gray-700 font-medium leading-none">
                                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                                <span className="truncate max-w-[120px]" title={item.nameEn}>{item.nameEn}</span>
                                <span className="text-[10px] font-bold text-gray-400 font-mono bg-gray-50 border px-1 rounded">x{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Customers food pricing bill column */}
                        <td className="p-4 font-mono">
                          <div className="font-extrabold text-gray-900 text-xs">৳{o.totalPrice.toLocaleString()}</div>
                          <p className="text-[8px] text-gray-400">After coupons</p>
                        </td>

                        {/* Paid Delivery Charge column */}
                        <td className="p-4 font-mono text-gray-900">
                          <div className="font-semibold text-xs">৳{o.deliveryCharge}</div>
                          <p className="text-[8px] text-gray-400 font-sans">{o.shippingArea === 'inside' ? 'Inside' : 'Outside'}</p>
                        </td>

                        {/* Coupon Applied Details custom column */}
                        <td className="p-4">
                          {o.couponCode ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-250 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase">
                                <Tag className="w-2.5 h-2.5 text-emerald-600" />
                                {o.couponCode}
                              </span>
                              <p className="text-[10px] font-bold text-emerald-600 font-mono mt-0.5">Saved: ৳{o.couponDiscount || 0}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-[10px]">None applied</span>
                          )}
                        </td>

                        {/* bKash Payment verification fields */}
                        <td className="p-4">
                          {o.bKashNumber ? (
                            <div className="space-y-0.5 max-w-[145px] truncate text-[10px] pr-2">
                              <p className="text-gray-750 font-semibold font-mono"><strong>Sender:</strong> {o.bKashNumber}</p>
                              <p className="font-mono text-gray-500 truncate text-[9px]" title={o.transactionId}>
                                <strong>TxnID:</strong> {o.transactionId}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-450 font-semibold text-[10px]">CoD Cash Only</span>
                          )}
                        </td>

                        {/* Current Status and Dropdown updating */}
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <div className="relative inline-block text-left">
                              <select
                                disabled={!canManage || updatingId === o.id}
                                value={o.status}
                                onChange={(e) => handleStatusChange(o.id, e.target.value as OrderStatus)}
                                className={`p-1 px-2 rounded-full text-[10px] font-extrabold focus:outline-none focus:ring-1 focus:ring-amber-500 select-none cursor-pointer border ${
                                  updatingId === o.id
                                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                    : o.status === 'Delivered'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : o.status === 'Cancelled'
                                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                                    : o.status === 'Pending'
                                    ? 'bg-amber-50 border-amber-200 text-amber-800 animate-pulse'
                                    : 'bg-white border-gray-200 text-gray-750'
                                }`}
                              >
                                {statuses.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </div>
                            {updatingId === o.id && (
                              <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin flex-shrink-0" />
                            )}
                          </div>
                        </td>

                        {/* Table actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Invoice overlay */}
                            <button
                              onClick={() => setSelectedInvoiceOrder(o)}
                              className="p-1.5 bg-gray-50 hover:bg-gray-150 text-gray-600 hover:text-gray-800 rounded-lg transition-colors cursor-pointer"
                              title="Show Invoice details"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            {/* Delete Button */}
                            {canManage && (
                              <button
                                onClick={() => {
                                  if (confirm(`Soft-delete order ${o.invoiceNumber}?`)) {
                                    onDeleteOrder(o.id);
                                  }
                                }}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title="Delete order records"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
              
              {/* Aggregated totals row block displayed at the end of columns */}
              {filteredOrders.length > 0 && (
                <tfoot>
                  <tr className="bg-amber-50/15 font-bold border-t border-gray-200 text-gray-900 text-[11px]">
                    <td className="p-4 font-black text-amber-900 border-t border-gray-200">TOTAL SUMS ({filteredOrders.length} orders)</td>
                    <td className="p-4 border-t border-gray-200"></td>
                    <td className="p-4 font-mono font-black text-xs text-amber-950 border-t border-gray-200">
                      ৳{filteredOrders.reduce((sum, o) => sum + o.totalPrice, 0).toLocaleString()}
                    </td>
                    <td className="p-4 font-mono font-black text-xs text-gray-900 border-t border-gray-200">
                      ৳{filteredOrders.reduce((sum, o) => sum + o.deliveryCharge, 0).toLocaleString()}
                    </td>
                    <td className="p-4 font-mono font-bold text-emerald-700 border-t border-gray-200">
                      Saved: ৳{filteredOrders.reduce((sum, o) => sum + (o.couponDiscount || 0), 0).toLocaleString()}
                    </td>
                    <td className="p-4 text-xs font-black text-emerald-850 border-t border-gray-200" colSpan={3}>
                      Total Gross: <span className="font-mono text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">৳{filteredOrders.reduce((sum, o) => sum + o.totalPrice + o.deliveryCharge, 0).toLocaleString()}</span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Invoice View Panel (Only visible when split active) */}
        {selectedInvoiceOrder && (
          <div className="lg:col-span-5 bg-white rounded-3xl border border-amber-200/50 p-6 shadow-md relative">
            <button
              onClick={() => setSelectedInvoiceOrder(null)}
              className="absolute right-4 top-4 bg-gray-100 hover:bg-gray-200 text-gray-550 w-7 h-7 rounded-full flex items-center justify-center p-1 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h4 className="font-sans font-bold text-sm text-gray-950 mb-5">
              📄 Active Orders Statement Invoice Details
            </h4>
            <Invoice order={selectedInvoiceOrder} showTimeline={false} />
          </div>
        )}

      </div>

    </div>
  );
};
