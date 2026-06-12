import React, { useState, useEffect } from 'react';
import { SiteConfig } from '../types';
import { Save, RefreshCw, Smartphone, MapPin, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';

interface AdminConfigProps {
  siteConfig: SiteConfig | null;
  onUpdateSiteConfig: (updates: Partial<SiteConfig>) => void;
  permissions: string[];
}

export const AdminConfig: React.FC<AdminConfigProps> = ({
  siteConfig,
  onUpdateSiteConfig,
  permissions
}) => {
  const [chargeInside, setChargeInside] = useState<number>(60);
  const [chargeOutside, setChargeOutside] = useState<number>(120);
  const [bkashNumber, setBkashNumber] = useState('');
  const [bkashQr, setBkashQr] = useState('');
  const [bannerBn, setBannerBn] = useState('');
  const [bannerEn, setBannerEn] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  const canManage = permissions.includes('manage_site_config') || permissions.includes('all');

  // Load Initial config values
  useEffect(() => {
    if (siteConfig) {
      setChargeInside(siteConfig.deliveryChargeInside);
      setChargeOutside(siteConfig.deliveryChargeOutside);
      setBkashNumber(siteConfig.bKashNumber);
      setBkashQr(siteConfig.bKashQrUrl || '');
      setBannerBn(siteConfig.bannerBn || '');
      setBannerEn(siteConfig.bannerEn || '');
      setWhatsapp(siteConfig.whatsappNumber || '');
    }
  }, [siteConfig]);

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      alert('You do not have administrative permission to modify global site configurations.');
      return;
    }

    setIsSaving(true);
    try {
      await onUpdateSiteConfig({
        deliveryChargeInside: Number(chargeInside),
        deliveryChargeOutside: Number(chargeOutside),
        bKashNumber: bkashNumber,
        bKashQrUrl: bkashQr,
        bannerBn,
        bannerEn,
        whatsappNumber: whatsapp
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-150 p-6 md:p-8 shadow-sm text-left max-w-2xl mx-auto space-y-6">
      
      <div>
        <h4 className="font-sans font-bold text-base text-gray-950">⚙️ Global Website Settings</h4>
        <p className="text-xs text-gray-450 mt-0.5">Adjust delivery charges, payment codes, notice boards, and whatsapp chat connections.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        
        {/* Delivery charges inside and outside Dhaka */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 border border-gray-100 rounded-2xl p-4 bg-gray-50/10">
            <label className="font-bold text-gray-750 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              <span>চট্টগ্রাম সিটির ভেতরে ডেলিভারি চার্জ (Tk) *</span>
            </label>
            <input
              type="number"
              required
              min={0}
              value={chargeInside || ''}
              onChange={(e) => setChargeInside(Number(e.target.value))}
              className="w-full mt-1 p-2 bg-white rounded-xl border border-gray-205 focus:ring-2 focus:ring-amber-550/10 focus:outline-none font-bold"
            />
          </div>

          <div className="space-y-1.5 border border-gray-100 rounded-2xl p-4 bg-gray-50/10">
            <label className="font-bold text-gray-750 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              <span>চট্টগ্রাম সিটির বাইরে ডেলিভারি চার্জ (Tk) *</span>
            </label>
            <input
              type="number"
              required
              min={0}
              value={chargeOutside || ''}
              onChange={(e) => setChargeOutside(Number(e.target.value))}
              className="w-full mt-1 p-2 bg-white rounded-xl border border-gray-205 focus:ring-2 focus:ring-amber-550/10 focus:outline-none font-bold"
            />
          </div>
        </div>

        {/* bKash configuration variables */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 border border-gray-100 rounded-2xl p-4 bg-gray-50/10">
            <label className="font-bold text-gray-750 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-amber-500" />
              <span>বিকাশ মার্চেন্ট/পার্সোনাল নাম্বার *</span>
            </label>
            <input
              type="text"
              required
              value={bkashNumber}
              onChange={(e) => setBkashNumber(e.target.value)}
              className="w-full mt-1 p-2 bg-white rounded-xl border border-gray-205 focus:ring-2 focus:ring-amber-550/10 focus:outline-none font-bold"
            />
          </div>

          <div className="space-y-1.5 border border-gray-100 rounded-2xl p-4 bg-gray-50/10">
            <label className="font-bold text-gray-750 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-amber-500" />
              <span>বিকাশ QR কোড ইমেজ (URL)</span>
            </label>
            <input
              type="url"
              placeholder="https://api.qrserver.com/v1/create-qr-code/..."
              value={bkashQr}
              onChange={(e) => setBkashQr(e.target.value)}
              className="w-full mt-1 p-2 bg-white rounded-xl border border-gray-251 focus:ring-2 focus:ring-amber-550/10 focus:outline-none"
            />
          </div>
        </div>

        {/* Whatsapp contact number */}
        <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/10 space-y-1.5">
          <label className="font-bold text-gray-750 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
            <span>হোমপেজ হোয়াটসঅ্যাপ বাটন নাম্বার (যেমন: 8801700000000)</span>
          </label>
          <input
            type="text"
            placeholder="8801XXXXXXXXX"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="w-full p-2 bg-white rounded-xl border border-gray-205 focus:ring-2 focus:ring-amber-550/10 focus:outline-none font-bold"
          />
        </div>

        {/* Global Notice banners */}
        <div className="space-y-3.5 border border-gray-100 rounded-2xl p-4 bg-gray-50/10">
          <h5 className="font-bold text-gray-750 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>হোমপেজ টপ নোটিশ বার্তা / Announcement Banner</span>
          </h5>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-gray-500 block">Bangla Announcement Text</label>
              <textarea
                placeholder="মাদার্স ডে স্পেশাল অফার..."
                rows={2}
                value={bannerBn}
                onChange={(e) => setBannerBn(e.target.value)}
                className="w-full p-2.5 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-gray-500 block">English Announcement Text</label>
              <textarea
                placeholder="Special promo code active..."
                rows={2}
                value={bannerEn}
                onChange={(e) => setBannerEn(e.target.value)}
                className="w-full p-2.5 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="submit"
            disabled={!canManage || isSaving}
            className={`px-5 py-2.5 rounded-xl font-bold text-white flex items-center gap-2 shadow-sm transition-transform cursor-pointer ${
              isSaving
                ? 'bg-amber-400 opacity-80 cursor-not-allowed'
                : canManage 
                ? 'bg-amber-500 hover:bg-amber-600 active:scale-97' 
                : 'bg-gray-300 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Configurations...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Configurations</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
