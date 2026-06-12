import React, { useRef } from 'react';
import { Order, OrderStatus } from '../types';
import { useLocalization } from './LocalizationContext';
import { Printer, CheckCircle, Clock, Truck, ShieldAlert, Check, Copy, ShoppingBag, MapPin, Receipt, Phone } from 'lucide-react';

interface InvoiceProps {
  order: Order;
  onCopyId?: () => void;
  showTimeline?: boolean;
  onPrint?: () => void;
}

export const Invoice: React.FC<InvoiceProps> = ({
  order,
  onCopyId,
  showTimeline = true,
  onPrint
}) => {
  const { language, t } = useLocalization();
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Print handler with premium, corporate, high-end customized styling
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    }
    const windowUrl = 'about:blank';
    const uniqueName = new Date().getTime();
    const printWindow = window.open(windowUrl, `Print_${uniqueName}`, 'left=100,top=100,width=800,height=900');
    
    if (printWindow) {
      const itemsSubtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const calculatedDiscount = itemsSubtotal - order.totalPrice;
      const finalBill = order.totalPrice + order.deliveryCharge;
      const orderDateStr = new Date(order.createdAt).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { 
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
      });

      const tableRows = order.items.map(it => `
        <tr>
          <td style="padding: 14px 16px; border-bottom: 1px solid #f3f4f6; text-align: left;">
            <div style="font-weight: 700; color: #111827; font-size: 13px;">${language === 'bn' ? it.nameBn : it.nameEn}</div>
            <div style="font-size: 10px; color: #9ca3af; font-family: monospace; margin-top: 2px;">ID/SKU: ${it.id}</div>
          </td>
          <td style="padding: 14px 16px; border-bottom: 1px solid #f3f4f6; text-align: center; font-weight: 700; color: #374151;">${it.quantity}</td>
          <td style="padding: 14px 16px; border-bottom: 1px solid #f3f4f6; text-align: right; color: #374151; font-family: monospace;">৳${it.price}</td>
          <td style="padding: 14px 16px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 700; color: #111827; font-family: monospace;">৳${it.price * it.quantity}</td>
        </tr>
      `).join('');

      const discountRow = calculatedDiscount > 0 ? `
        <div class="summary-line" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: #059669; font-weight: 600;">
          <span>${language === 'bn' ? 'কুপন ডিসকাউন্ট:' : 'Coupon Discount:'}</span>
          <span>-৳${calculatedDiscount}</span>
        </div>
      ` : '';

      const couponDetails = order.couponCode ? `
        <div style="margin-top: 8px; font-size: 11px; text-transform: uppercase; font-weight: 800; color: #047857; background: #ecfdf5; border: 1px solid #d1fae5; padding: 6px 12px; border-radius: 8px; display: inline-block;">
          ✓ Code: "${order.couponCode}" Included
        </div>
      ` : '';

      const isInsideStr = order.shippingArea === 'inside'
        ? (language === 'bn' ? 'চট্টগ্রাম সিটির ভেতরে' : 'Inside Chittagong City')
        : (language === 'bn' ? 'চট্টগ্রাম সিটির বাইরে' : 'Outside Chittagong City');

      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice - ${order.invoiceNumber}</title>
            <style>
              body { 
                font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
                color: #1f2937; 
                background: #ffffff;
                padding: 40px; 
                margin: 0; 
                line-height: 1.5;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .invoice-container {
                max-width: 800px;
                margin: 0 auto;
                border: 1px solid #e5e7eb;
                padding: 40px;
                border-radius: 16px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
              }
              .invoice-header { 
                display: flex; 
                justify-content: space-between; 
                align-items: flex-start;
                border-bottom: 2px solid #f1f5f9; 
                padding-bottom: 24px; 
              }
              .brand-info { text-align: left; }
              .brand-name { 
                font-size: 24px; 
                font-weight: 900; 
                color: #f59e0b; 
                letter-spacing: -0.025em;
                margin: 0;
              }
              .brand-motto {
                font-size: 11px;
                color: #6b7280;
                margin: 4px 0 0 0;
              }
              .invoice-desc { text-align: right; }
              .invoice-title { 
                font-size: 26px; 
                font-weight: 900; 
                color: #111827; 
                margin: 0;
                letter-spacing: -0.025em;
              }
              .invoice-meta {
                font-size: 11px;
                color: #4b5563;
                margin: 6px 0 0 0;
                font-family: monospace;
              }
              .billing-info { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 24px; 
                margin-top: 32px; 
                margin-bottom: 32px; 
              }
              .box { 
                border: 1px solid #f1f5f9; 
                background-color: #fafafa;
                padding: 20px; 
                border-radius: 12px; 
                text-align: left;
              }
              .box-title {
                font-size: 10px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #9ca3af;
                margin: 0 0 12px 0;
              }
              .info-title {
                font-weight: 750;
                color: #111827;
                font-size: 14px;
                margin: 0 0 6px 0;
              }
              .info-text {
                font-size: 12.5px;
                color: #4b5563;
                margin: 0 0 4px 0;
              }
              .table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 24px 0; 
              }
              .table th { 
                background: #f8fafc; 
                text-align: left; 
                padding: 12px 16px; 
                border-bottom: 2px solid #e2e8f0; 
                font-size: 10.5px; 
                font-weight: 800; 
                color: #475569;
                text-transform: uppercase;
                letter-spacing: 0.05em;
              }
              .summary-container {
                display: flex;
                justify-content: flex-end;
                margin-top: 24px;
              }
              .summary { 
                width: 320px; 
                text-align: right; 
                padding: 20px;
                background: #fcfcfc;
                border-radius: 12px;
                border: 1px solid #f1f5f9;
              }
              .summary-row { 
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 10px; 
                font-size: 13px; 
                color: #4b5563;
              }
              .summary-total { 
                font-weight: 900; 
                font-size: 18px; 
                color: #111827;
                border-top: 2px dashed #cbd5e1; 
                padding-top: 12px; 
                margin-top: 12px; 
                display: flex;
                justify-content: space-between;
              }
              .footer { 
                text-align: center; 
                margin-top: 48px; 
                font-size: 11px; 
                color: #9ca3af; 
                border-top: 1px solid #f1f5f9; 
                padding-top: 24px; 
              }
              .footer-bold {
                font-weight: 700;
                color: #4b5563;
                margin-bottom: 4px;
              }
              @media print {
                body { padding: 0; }
                .invoice-container { border: none; box-shadow: none; padding: 0; }
              }
            </style>
          </head>
          <body>
            <div class="invoice-container">
              
              <!-- 1. Header Section -->
              <div class="invoice-header">
                <div class="brand-info">
                  <h1 class="brand-name">${language === 'bn' ? 'স্পেশাল ঘরোয়া রান্নাবান্না' : 'Special Homemade Food'}</h1>
                  <p class="brand-motto">${language === 'bn' ? '১০০% ঘরোয়া উপাদানে মায়ের হাতের স্পেশাল রান্না।' : '100% homemade ingredients cooked with pure motherly love.'}</p>
                </div>
                <div class="invoice-desc">
                  <h2 class="invoice-title">${language === 'bn' ? 'ইনভয়েস স্টেটমেন্ট' : 'INVOICE STATEMENT'}</h2>
                  <p class="invoice-meta">${language === 'bn' ? 'ইনভয়েস নং' : 'INV NO'}: ${order.invoiceNumber}</p>
                  <p class="invoice-meta">${language === 'bn' ? 'তারিখ' : 'Date'}: ${orderDateStr}</p>
                </div>
              </div>

              <!-- 2. Address & Billing Boxes -->
              <div class="billing-info">
                
                <!-- Box A: Customer Deliveries -->
                <div class="box">
                  <h3 class="box-title">❃ ${language === 'bn' ? 'ডেলিভারি ঠিকানা' : 'DELIVERY ADDRESS'}</h3>
                  <div class="info-title">${order.fullName}</div>
                  <p class="info-text"><strong>Phone:</strong> ${order.phoneNumber}</p>
                  <p class="info-text"><strong>Address:</strong> ${order.fullAddress}</p>
                  <p class="info-text" style="font-size: 11px; margin-top: 8px; color: #92400e;">📍 Zone: ${isInsideStr}</p>
                </div>

                <!-- Box B: Payments Information -->
                <div class="box">
                  <h3 class="box-title">❑ ${language === 'bn' ? 'বিলিং ও পেমেন্ট' : 'PAYMENT CONFORMS'}</h3>
                  <div class="info-title">Method: ${order.paymentMethod === 'bKash' ? 'bKash Mobile Money' : 'Cash on Delivery'}</div>
                  <p class="info-text"><strong>Status:</strong> ${order.status === 'Pending' ? 'Adv. Fee Under Review' : 'Verified & Confirmed'}</p>
                  ${order.bKashNumber ? `<p class="info-text"><strong>Sender:</strong> ${order.bKashNumber}</p>` : ''}
                  ${order.transactionId ? `<p class="info-text" style="font-family: monospace; font-size: 11px;"><strong>TxnID:</strong> ${order.transactionId}</p>` : ''}
                  ${couponDetails}
                </div>

              </div>

              <!-- 3. Ordered Goods Table -->
              <table class="table">
                <thead>
                  <tr>
                    <th style="text-align: left;">${language === 'bn' ? 'খাবারের নাম ও বিবরণ' : 'Dish Description'}</th>
                    <th style="text-align: center; width: 80px;">${language === 'bn' ? 'পরিমাণ' : 'Qty'}</th>
                    <th style="text-align: right; width: 120px;">${language === 'bn' ? 'একক মূল্য' : 'Unit Price'}</th>
                    <th style="text-align: right; width: 140px;">${language === 'bn' ? 'মোট মূল্য' : 'Aggregate total'}</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>

              <!-- 4. Financial breakdown summary -->
              <div class="summary-container">
                <div class="summary">
                  <div class="summary-row">
                    <span>${language === 'bn' ? 'সাবটোটাল (খাবার বিল):' : 'Subtotal (Food Bill):'}</span>
                    <span style="font-family: monospace;">৳${itemsSubtotal}</span>
                  </div>
                  ${discountRow}
                  <div class="summary-row">
                    <span>${language === 'bn' ? 'ডেলিভারি চার্জ:' : 'Delivery Charge:'}</span>
                    <span style="font-family: monospace;">৳${order.deliveryCharge}</span>
                  </div>
                  <div class="summary-total">
                    <span>${language === 'bn' ? 'সর্বমোট প্রদেয় বিল:' : 'Final Gross Payable:'}</span>
                    <span style="font-family: monospace; border-bottom: 3px double #111827;">৳${finalBill}</span>
                  </div>
                </div>
              </div>

              <!-- 5. Compliments footer -->
              <div class="footer">
                <p class="footer-bold">${language === 'bn' ? 'আমাদের ঘরোয়া খাবারের ওপর আস্থা রাখার জন্য অসংখ্য ধন্যবাদ!' : 'Thank you for placing orders of our homemade delicacies!'}</p>
                <p>This is a certified digital commercial receipt auto-generated from active online servers. For any queries, please preserve your Invoice Number.</p>
              </div>

            </div>
            
            <script>
              window.onload = function() { 
                window.print(); 
                setTimeout(function() { window.close(); }, 500); 
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Status Color Mapper
  const getStatusConfig = (status: OrderStatus) => {
    const mapping: Record<OrderStatus, { textBn: string; textEn: string; colorClass: string; icon: React.ReactNode }> = {
      Pending: { textBn: 'পেন্ডিং (যাচাই চলছে)', textEn: 'Pending Verification', colorClass: 'bg-amber-100 text-amber-800 border-amber-200', icon: <Clock className="w-4 h-4 text-amber-600" /> },
      Hold: { textBn: 'হোল্ড (অপেক্ষা)', textEn: 'On Hold', colorClass: 'bg-orange-100 text-orange-850 border-orange-250', icon: <Clock className="w-4 h-4 text-orange-600" /> },
      Accepted: { textBn: 'অর্ডার গৃহীত হয়েছে', textEn: 'Order Accepted', colorClass: 'bg-blue-100 text-blue-800 border-blue-200', icon: <CheckCircle className="w-4 h-4 text-blue-600" /> },
      Preparing: { textBn: 'খাবার রান্না হচ্ছে', textEn: 'Preparing Food', colorClass: 'bg-indigo-100 text-indigo-850 border-indigo-250', icon: <Clock className="w-4 h-4 text-indigo-600 animate-pulse" /> },
      'Out for Delivery': { textBn: 'ডেলিভারি ম্যানের কাছে আছে', textEn: 'Out for Delivery', colorClass: 'bg-purple-100 text-purple-800 border-purple-250', icon: <Truck className="w-4 h-4 text-purple-650 animate-bounce" /> },
      Delivered: { textBn: 'সফলভাবে সরবরাহকৃত', textEn: 'Delivered Successfully', colorClass: 'bg-emerald-100 text-emerald-850 border-emerald-250', icon: <CheckCircle className="w-4 h-4 text-emerald-700" /> },
      Cancelled: { textBn: 'বাতিল করা হয়েছে', textEn: 'Order Cancelled', colorClass: 'bg-rose-100 text-rose-800 border-rose-200', icon: <ShieldAlert className="w-4 h-4 text-rose-600" /> },
    };
    return mapping[status] || mapping.Pending;
  };

  const statusConfig = getStatusConfig(order.status);

  // Status index for linear visual timeline tracker
  const statusOrder: OrderStatus[] = ['Pending', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered'];
  const activeStatusIndex = statusOrder.indexOf(order.status);

  return (
    <div className="space-y-6">
      
      {/* Linear Timeline Graphic (Outstanding UX) */}
      {showTimeline && order.status !== 'Cancelled' && order.status !== 'Hold' && (
        <div className="bg-white rounded-3xl border border-gray-150 p-6 md:p-8 shadow-sm">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center mb-6">
            {language === 'bn' ? 'অর্ডারের কাজের ধাপ সমূহ' : 'Work Progress Tracking'}
          </h4>
          
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-2">
            
            {/* Center Connect bar line */}
            <div className="absolute left-[17px] sm:left-4 sm:right-4 top-8 sm:top-5 bottom-8 sm:bottom-auto h-auto sm:h-1 bg-gray-100 -z-0 w-1 sm:w-auto" />
            {/* Progress completion bar line */}
            {activeStatusIndex >= 0 && (
              <div 
                className="absolute left-[17px] sm:left-4 top-8 sm:top-5 h-auto sm:h-1 bg-amber-500 -z-0 transition-all duration-700 w-1 sm:w-auto"
                style={{
                  height: typeof window !== 'undefined' && window.innerWidth < 640 ? `${(activeStatusIndex / (statusOrder.length - 1)) * 100}%` : '4px',
                  width: typeof window !== 'undefined' && window.innerWidth >= 640 ? `${(activeStatusIndex / (statusOrder.length - 1)) * 100}%` : '4px',
                }}
              />
            )}

            {statusOrder.map((step, idx) => {
              const isCompleted = idx <= activeStatusIndex;
              const isCurrent = idx === activeStatusIndex;
              
              const stepNames: Record<OrderStatus, { bn: string; en: string }> = {
                Pending: { bn: 'অর্ডার পেন্ডিং', en: 'Pending' },
                Accepted: { bn: 'গৃহীত', en: 'Accepted' },
                Preparing: { bn: 'রান্না প্রস্তুত', en: 'Preparing' },
                'Out for Delivery': { bn: 'রাইডার পথে', en: 'On Road' },
                Delivered: { bn: 'ডেলিভার্ড', en: 'Delivered' },
                Hold: { bn: 'অপেক্ষা', en: 'On Hold' },
                Cancelled: { bn: 'বাতিল', en: 'Cancelled' },
              };

              return (
                <div key={idx} className="relative z-10 flex sm:flex-col items-center gap-4 sm:gap-2 w-full sm:w-auto text-left sm:text-center shrink-0">
                  <div 
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                      isCompleted 
                        ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/25' 
                        : 'bg-white border-gray-200 text-gray-400'
                    } ${isCurrent ? 'ring-4 ring-amber-100 scale-115' : ''}`}
                  >
                    {isCompleted && !isCurrent ? <Check className="w-4 h-4 stroke-[3px]" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                  </div>
                  <div>
                    <h5 className={`text-xs font-bold leading-tight ${isCurrent ? 'text-amber-600' : isCompleted ? 'text-gray-950' : 'text-gray-400'}`}>
                      {language === 'bn' ? stepNames[step].bn : stepNames[step].en}
                    </h5>
                    <p className="text-[10px] text-gray-500 font-mono hidden sm:block mt-0.5">{step}</p>
                  </div>
                </div>
              );
            })}

          </div>
        </div>
      )}

      {/* Invoice Card Frame */}
      <div className="bg-white rounded-3xl border border-gray-150 overflow-hidden shadow-sm">
        
        {/* Dynamic header summary controller */}
        <div className="bg-gray-50 px-5 md:px-8 py-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1 text-left">
            <span className="text-[10.5px] uppercase font-bold tracking-widest text-amber-700">Invoice Statement</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-sm font-extrabold text-gray-900 font-mono select-all">
                ID: #{order.id}
              </h4>
              {onCopyId && (
                <button
                  onClick={() => onCopyId()}
                  className="p-1 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-150 transition-colors active:scale-95 cursor-pointer"
                  title="Copy Order ID"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Status indicators */}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.colorClass}`}>
              {statusConfig.icon}
              <span>{language === 'bn' ? statusConfig.textBn : statusConfig.textEn}</span>
            </span>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'প্রিন্ট' : 'Print'}</span>
            </button>
          </div>
        </div>

        {/* Print Area Section */}
        <div ref={invoiceRef} className="p-6 md:p-8 space-y-6">
          
          {/* Print Only Header */}
          <div className="invoice-header flex justify-between gap-4 items-start border-b border-gray-100 pb-5">
            <div className="text-left space-y-1">
              <div className="font-extrabold text-amber-500 text-lg md:text-xl">
                {t('appName')}
              </div>
              <p className="text-[10px] md:text-xs text-gray-500 max-w-sm">
                {language === 'bn' ? '১০০% ঘরোয়া উপাদানে মায়ের হাতের স্পেশাল রান্না।' : '100% homemade ingredients cooked with pure motherly love.'}
              </p>
            </div>
            <div className="text-right space-y-1">
              <div className="text-sm font-black text-gray-900">
                {language === 'bn' ? 'ইনভয়েস' : 'INVOICE'}
              </div>
              <p className="text-[10px] font-mono text-gray-550">
                {t('invoiceNoLabel')} {order.invoiceNumber}
              </p>
              <p className="text-[10px] text-gray-400 font-mono">
                Date: {new Date(order.createdAt).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Billing Info Box */}
          <div className="grid md:grid-cols-2 gap-4 pt-1">
            
            {/* Customer Details block */}
            <div className="border border-gray-100 rounded-2xl p-4 space-y-3.5 text-left bg-gray-50/10">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>{language === 'bn' ? 'ডেলিভারি ঠিকানা ও বিবরণ' : 'Delivery Details'}</span>
              </h5>
              <div className="space-y-1.5 text-sm">
                <p className="font-sans font-bold text-gray-900">{order.fullName}</p>
                <p className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Phone className="w-3 h-3" />
                  <span>{order.phoneNumber}</span>
                </p>
                <p className="text-xs text-gray-600 leading-tight">
                  {order.fullAddress}
                </p>
              </div>
            </div>

            {/* Payment Details block */}
            <div className="border border-gray-100 rounded-2xl p-4 space-y-3 text-left bg-gray-50/10">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-amber-500" />
                <span>{language === 'bn' ? 'বিল ও পেমেন্ট বিবরণ' : 'Billing Information'}</span>
              </h5>
              <div className="space-y-1.5 text-sm pt-1">
                <p className="font-sans font-semibold text-gray-800">
                  {language === 'bn' ? 'পদ্ধতি: ' : 'Method: '}
                  <span className="font-bold text-amber-600">{order.paymentMethod === 'bKash' ? t('paymentOptionBkash') : t('paymentOptionCod')}</span>
                </p>
                
                {order.paymentMethod === 'Cash on Delivery' && (
                  <p className="text-xs text-gray-500">
                    {language === 'bn' ? '* ডেলিভারি ফি বিকাশে অগ্রিম পরিশোধিত।' : '* Delivery fee paid in advance.'}
                  </p>
                )}

                {order.bKashNumber && (
                  <p className="text-xs text-gray-600">
                    <strong>bKash No:</strong> {order.bKashNumber}
                  </p>
                )}
                {order.transactionId && (
                  <p className="text-xs text-gray-650 font-mono">
                    <strong>TxnID:</strong> {order.transactionId}
                  </p>
                )}
                
                <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5 pt-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span>
                    {order.status === 'Pending' 
                      ? (language === 'bn' ? 'অগ্রিম ডেলিভারি ফি যাচাইাধীন' : 'Adv. Fee Under Review') 
                      : (language === 'bn' ? 'ডেলিভারি ফি ভেরিফাই সম্পন্ন' : 'Adv. Fee Confirmed & Verified')}
                  </span>
                </p>
              </div>
            </div>

          </div>

          {/* Items breakdown table list */}
          <div className="overflow-x-auto border border-gray-100 rounded-2xl">
            <table className="w-full text-left border-collapse table">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100">
                  <th className="p-3 text-xs md:text-sm font-bold text-gray-500">{language === 'bn' ? 'খাবারের নাম ও বিবরণ' : 'Dish Description'}</th>
                  <th className="p-3 text-xs md:text-sm font-bold text-gray-500 text-center">{language === 'bn' ? 'পরিমাণ' : 'Qty'}</th>
                  <th className="p-3 text-xs md:text-sm font-bold text-gray-500 text-right">{language === 'bn' ? 'মূল্য' : 'Price'}</th>
                  <th className="p-3 text-xs md:text-sm font-bold text-gray-500 text-right">{language === 'bn' ? 'মোট' : 'Total'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {order.items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/20">
                    <td className="p-3">
                      <div className="font-semibold text-gray-900 leading-snug">
                        {language === 'bn' ? it.nameBn : it.nameEn}
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono block">Item ID: {it.id}</span>
                    </td>
                    <td className="p-3 text-center font-bold text-gray-800">
                      {it.quantity}
                    </td>
                    <td className="p-3 text-right font-medium text-gray-600">
                      {t('bdt')}{it.price}
                    </td>
                    <td className="p-3 text-right font-bold text-gray-900">
                      {t('bdt')}{it.price * it.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial summary calculations */}
          {(() => {
            const itemsSubtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const calculatedDiscount = itemsSubtotal - order.totalPrice;
            return (
              <div className="flex justify-end pt-1">
                <div className="w-full max-w-[270px] space-y-2 text-sm text-left">
                  <div className="flex justify-between text-gray-600">
                    <span>{t('subtotal')}:</span>
                    <span className="font-bold text-gray-900">{t('bdt')}{itemsSubtotal}</span>
                  </div>
                  {calculatedDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>{language === 'bn' ? 'কুপন ডিসকাউন্ট:' : 'Coupon Discount:'}</span>
                      <span className="font-bold">-{t('bdt')}{calculatedDiscount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>{t('deliveryCharge')}:</span>
                    <span className="font-bold text-gray-900">{t('bdt')}{order.deliveryCharge}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-gray-950 border-t border-gray-150 pt-2 summary-total">
                    <span>{t('total')}:</span>
                    <span>{t('bdt')}{order.totalPrice + order.deliveryCharge}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Sincere message footer */}
          <div className="border-t border-gray-100 pt-5 text-center text-xs text-gray-400 space-y-1.5 footer">
            <p className="font-semibold text-gray-500">
              {language === 'bn' ? 'আমাদের পরিচ্ছন্ন ঘরোয়া খাবারের ওপর আস্থা রাখার জন্য অসংখ্য ধন্যবাদ!' : 'Thank you for ordering our warm, healthy homemade food!'}
            </p>
            <p className="text-[10px]">
              This is a secure system-generated invoice from order session {order.invoiceNumber}. Safe dining!
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
