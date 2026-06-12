import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../types';

interface TranslationSet {
  [key: string]: {
    bn: string;
    en: string;
  };
}

const translations: TranslationSet = {
  appName: { bn: 'রাহিস কিচেন', en: "Rahi's Kitchen" },
  tagline: { bn: 'চট্টগ্রামের ঐতিহ্যবাহী মেজবান ও মায়ের হাতের স্বাদে ১০০% স্বাস্থ্যসম্মত ও সুস্বাদু খাবার', en: "Authentic Chittagong Mezban & 100% hygienic mom-made healthy recipes" },
  quickOrder: { bn: 'ঝটপট অর্ডার', en: 'Quick Order' },
  viewMenu: { bn: 'মেনু দেখুন', en: 'Explore Menu' },
  categories: { bn: 'খাদ্য ক্যাটাগরি', en: 'Categories' },
  featuredDishes: { bn: 'আজকের বিশেষ আয়োজন', en: 'Today’s Specials' },
  allDishes: { bn: 'আমাদের সমগ্র মেনু', en: 'Our Full Menu' },
  addToCart: { bn: 'কার্টে যোগ করুন', en: 'Add to Cart' },
  outOfStock: { bn: 'আজকের মতো শেষ', en: 'Sold Out' },
  bdt: { bn: '৳', en: 'BDT ' },
  cartIsEmpty: { bn: 'আপনার কার্টটি খালি রয়েছে।', en: 'Your shopping cart is empty.' },
  subtotal: { bn: 'সাবটোটাল', en: 'Subtotal' },
  deliveryCharge: { bn: 'ডেলিভারি চার্জ', en: 'Delivery Charge' },
  total: { bn: 'সর্বমোট', en: 'Total Amount' },
  checkoutTitle: { bn: 'অর্ডার কনফার্ম করুন', en: 'Confirm Order' },
  fullName: { bn: 'আপনার নাম', en: 'Full Name' },
  fullNamePlaceholder: { bn: 'যেমন: মোহাম্মদ তানভীর রহমান', en: 'e.g. Tanvir Rahman' },
  phone: { bn: 'মোবাইল নাম্বার', en: 'Phone Number' },
  phonePlaceholder: { bn: 'যেমন: 018xxxxxxxx', en: 'e.g. 018xxxxxxxx' },
  address: { bn: 'ডেলিভারি ঠিকানা', en: 'Delivery Address' },
  addressPlaceholder: { bn: 'যেমন: বাসা ১০, রোড ৫, খুলশী আবাসিক এলাকা, চট্টগ্রাম', en: 'e.g. House 10, Road 5, Khulshi R/A, Chittagong' },
  paymentTitle: { bn: 'পেমেন্ট পদ্ধতি', en: 'Payment Option' },
  deliveryRequirementNote: { bn: 'সতর্কতা: আমাদের অর্ডারের ডেলিভারি চার্জটি অগ্রিম বিকাশ করতে হবে।', en: 'Note: The delivery charge must be paid in advance via bKash.' },
  transactionLabel: { bn: 'যে বিকাশ নাম্বার থেকে টাকা পাঠিয়েছেন', en: 'Sender bKash Mobile No' },
  txnIdLabel: { bn: 'বিকাশ ট্রানজেকশন ID (TxnID)', en: 'bKash Transaction ID (TxnID)' },
  submitOrder: { bn: 'অর্ডার সম্পন্ন করুন', en: 'Place Order' },
  orderSuccess: { bn: 'অর্ডার সফল হয়েছে!', en: 'Order Placed Successfully!' },
  orderIdLabel: { bn: 'অর্ডার আইডি:', en: 'Order ID:' },
  invoiceNoLabel: { bn: 'ইনভয়েস নং:', en: 'Invoice No:' },
  trackYourOrder: { bn: 'অর্ডার ট্র্যাক করুন', en: 'Track Order' },
  trackBtn: { bn: 'ট্র্যাক করুন', en: 'Search Order' },
  trackPlaceholder: { bn: 'অর্ডার আইডি অথবা ইনভয়েস লিখুন', en: 'Enter Order ID or Invoice No' },
  noOrderFound: { bn: 'কোনো অর্ডার খুঁজে পাওয়া যায়নি। আইডিটি পুনরায় চেক করুন।', en: 'No matching order found. Please check and retry.' },
  orderStatusLabel: { bn: 'অর্ডারের বর্তমান অবস্থা:', en: 'Current Status:' },
  instructionTitle: { bn: 'বিকাশ পেমেন্ট ইন্সট্রাকশন', en: 'bKash Payment Instruction' },
  instructionStep1: { bn: '১. নিচে দেওয়া বিকাশ নাম্বারে সেন্ড মানি করুন।', en: '1. Send Money to the bKash number below.' },
  instructionStep2: { bn: '২. চট্টগ্রাম সিটির ভেতরে ডেলিভারি ৫০ টাকা, বাইরে ১০০ টাকা। এই টাকাটি অগ্রিম বিকাশ সেন্ড মানি করতে হবে।', en: '2. Advance delivery charge inside Chittagong is 50 Tk, outside is 100 Tk.' },
  instructionStep3: { bn: '৩. টাকা পাঠানোর পর নিচের ইনপুট বক্সে আপনার বিকাশ নাম্বার এবং প্রাপ্ত ট্রানজেকশন আইডি দিন।', en: '3. After payment, enter your sending bKash number and Transaction ID below.' },
  whatsappAlert: { bn: 'যেকোনো প্রয়োজনে হোয়াটসঅ্যাপ করুন', en: 'Chat with us on WhatsApp' },
  faqTitle: { bn: 'সাধারণ জিজ্ঞাসা (FAQ)', en: 'Frequently Asked Questions (FAQ)' },
  testimonialsTitle: { bn: 'গ্রাহকদের মতামত', en: 'Happy Customer Testimonials' },
  insideDhaka: { bn: 'চট্টগ্রাম সিটির ভেতরে', en: 'Inside Chittagong City' },
  outsideDhaka: { bn: 'চট্টগ্রাম সিটির বাইরে', en: 'Outside Chittagong City' },
  itemsCount: { bn: 'টি আইটেম', en: 'items' },
  paymentOptionBkash: { bn: 'বিকাশ পেমেন্ট', en: 'bKash Payment' },
  paymentOptionCod: { bn: 'ক্যাশ অন ডেলিভারি (অগ্রিম ডেলিভারি ফি সহ)', en: 'Cash on Delivery (Advance delivery fee required)' },
  trackingPageTitle: { bn: 'অর্ডার ট্র্যাকিং সিস্টেম', en: 'Real-time Order Tracking' },
  cartTitle: { bn: 'আপনার শপিং ব্যাগ', en: 'Your Shopping Bag' },
} as const;

interface LocalizationContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LocalizationContext = createContext<LocalizationContextProps | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('bn');

  useEffect(() => {
    const savedLang = localStorage.getItem('h_language') as Language | null;
    if (savedLang) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('h_language', lang);
  };

  const t = (key: string): string => {
    const item = translations[key];
    if (!item) return key;
    return item[language] || item['en'] || key;
  };

  return (
    <LocalizationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};
