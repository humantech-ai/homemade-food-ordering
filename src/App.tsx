import React, { useState, useEffect } from 'react';
import { 
  LocalizationProvider, 
  useLocalization 
} from './components/LocalizationContext';
import { 
  CartProvider, 
  useCart 
} from './components/CartContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { FoodCard } from './components/FoodCard';
import { Testimonials } from './components/Testimonials';
import { FAQ } from './components/FAQ';
import { Invoice } from './components/Invoice';
import { Notification, NotificationType } from './components/Notification';
import { AdminOverview } from './components/AdminOverview';
import { AdminMenu } from './components/AdminMenu';
import { AdminOrders } from './components/AdminOrders';
import { AdminConfig } from './components/AdminConfig';
import { AdminPermissions } from './components/AdminPermissions';
import { AdminLogs } from './components/AdminLogs';
import { AdminCoupons } from './components/AdminCoupons';
import { 
  Category, 
  MenuItem, 
  Order, 
  OrderItem, 
  SiteConfig, 
  ActivityLog, 
  Admin, 
  OrderStatus,
  AdminRole,
  ActivityType,
  Coupon
} from './types';
import { dbService, defaultCategories, defaultMenuItems, defaultSiteConfig, defaultCoupons } from './lib/db';
import { isFirebaseConfigured, auth, db } from './lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { onSnapshot, collection } from 'firebase/firestore';
import { 
  ShoppingBag, 
  X, 
  ArrowRight, 
  CreditCard, 
  Smartphone, 
  CheckCircle, 
  Lock, 
  AlertTriangle, 
  LogOut, 
  Users, 
  FileLock, 
  Menu, 
  LayoutDashboard, 
  ListFilter, 
  Settings, 
  Clipboard, 
  Plus, 
  Trash2,
  Mail,
  QrCode,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Dynamic Coupon validation logic is loaded from dbService and managed in App.tsx state

// Wrapper to parse providers
function AppContent() {
  const { language, t } = useLocalization();
  const { cartItems, getCartTotal, updateQuantity, clearCart, getCartCount, addToCart } = useCart();

  // Navigation state: 'home' | 'tracking' | 'admin' | 'order-confirmation'
  const [activeView, setActiveView] = useState<string>('home');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // Cart panel toggle
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderingItem, setOrderingItem] = useState<MenuItem | null>(null);

  // Checkout inputs state
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [shippingArea, setShippingArea] = useState<'inside' | 'outside'>('inside');
  const [payMethod, setPayMethod] = useState<'bKash' | 'Cash on Delivery'>('Cash on Delivery');
  const [bkashPhone, setBkashPhone] = useState('');
  const [bkashTxnId, setBkashTxnId] = useState('');

  // Coupon and Discount states
  const [hasCouponChecked, setHasCouponChecked] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [isCouponApplied, setIsCouponApplied] = useState(false);

  // Loaded database state
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // Active tracking order
  const [trackingIdInput, setTrackingIdInput] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);

  // New placed confirmation order
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Admin Auth state
  const [loggedInAdmin, setLoggedInAdmin] = useState<any>(null);
  const [adminProfile, setAdminProfile] = useState<Admin | null>(null);
  // Sandbox credentials simulation
  const [sandboxEmail, setSandboxEmail] = useState('');
  const [sandboxPass, setSandboxPass] = useState('');
  const [isAdminAuthLoading, setIsAdminAuthLoading] = useState(false);

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Admin Dashboard Active Section: 'overview' | 'menu' | 'orders' | 'categories' | 'site_settings' | 'permissions' | 'logs'
  const [adminTab, setAdminTab] = useState<string>('overview');

  // Trigger Toaster notification
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<NotificationType>('success');
  const [isToastOpen, setIsToastOpen] = useState(false);

  // Add Category form fields (for categories tab in admin)
  const [newCatBn, setNewCatBn] = useState('');
  const [newCatEn, setNewCatEn] = useState('');
  const [newCatDescBn, setNewCatDescBn] = useState('');
  const [newCatDescEn, setNewCatDescEn] = useState('');
  const [newCatPrice, setNewCatPrice] = useState('');

  const triggerToast = (msg: string, type: NotificationType = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setIsToastOpen(true);
  };

  // Secret admin parameter checker effect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('admin') === 'true' || urlParams.get('portal') === 'rahis') {
        setActiveView('admin');
        triggerToast(language === 'bn' ? 'গোপন এডমিন প্যানেলে স্বাগতম!' : 'Welcome to the private admin portal!', 'success');
      }
    }
  }, [language]);

  // Recalculates applicability and calculates discount dynamically
  const validateCouponForCart = (coupon: Coupon) => {
    // 1. Is active check
    if (!coupon.isActive) {
      return {
        valid: false,
        reasonBn: 'কুপনটি নিষ্ক্রিয় করা হয়েছে।',
        reasonEn: 'This coupon is currently inactive.',
        applicableTotal: 0
      };
    }

    // 2. Date validity check
    const now = new Date();
    if (coupon.startDate) {
      const start = new Date(coupon.startDate);
      if (now < start) {
        return {
          valid: false,
          reasonBn: `এই কুপনটির অফার শুরু হবে ${start.toLocaleDateString()}-এ।`,
          reasonEn: `This coupon offer will start on ${start.toLocaleDateString()}.`,
          applicableTotal: 0
        };
      }
    }
    if (coupon.endDate) {
      const end = new Date(coupon.endDate);
      end.setHours(23, 59, 59, 999);
      if (now > end) {
        return {
          valid: false,
          reasonBn: 'দুঃখিত, কুপনটির মেয়াদ শেষ হয়ে গেছে।',
          reasonEn: 'This coupon has expired.',
          applicableTotal: 0
        };
      }
    }

    // 3. Item-specific applicability
    let applicableTotal = 0;
    if (coupon.applicability === 'specific' && coupon.applicableProductIds && coupon.applicableProductIds.length > 0) {
      const applicableCartItems = cartItems.filter(item => 
        coupon.applicableProductIds?.includes(item.menuItem.id)
      );
      if (applicableCartItems.length === 0) {
        const itemNames = menuItems
          .filter(i => coupon.applicableProductIds?.includes(i.id))
          .map(i => (language === 'bn' ? i.nameBn : i.nameEn))
          .join(', ');
        return {
          valid: false,
          reasonBn: `এই কুপনটি শুধু নির্দিষ্ট পণ্যগুলোর জন্য প্রযোজ্য: ${itemNames}`,
          reasonEn: `This coupon is only applicable to specific items: ${itemNames}`,
          applicableTotal: 0
        };
      }
      // Sum only applicable items total
      applicableTotal = applicableCartItems.reduce((sum, item) => {
        const itemPrice = item.menuItem.discountedPrice || item.menuItem.regularPrice;
        return sum + (itemPrice * item.quantity);
      }, 0);
    } else {
      // Applies to all items
      applicableTotal = getCartTotal();
    }

    return {
      valid: true,
      reasonBn: '',
      reasonEn: '',
      applicableTotal
    };
  };

  // Real-time Coupon Discount recalculation
  useEffect(() => {
    if (appliedCoupon && isCouponApplied && coupons.length > 0) {
      const couponSpecs = coupons.find(c => c.id.toUpperCase() === appliedCoupon.toUpperCase());
      if (couponSpecs) {
        const validation = validateCouponForCart(couponSpecs);
        if (validation.valid) {
          if (couponSpecs.discountType === 'percentage') {
            const discountVal = Math.round((validation.applicableTotal * couponSpecs.discountValue) / 100);
            setAppliedDiscount(discountVal);
          } else {
            setAppliedDiscount(Math.min(validation.applicableTotal, couponSpecs.discountValue));
          }
        } else {
          // Automatic invalidation if cart is changed
          setAppliedDiscount(0);
          setAppliedCoupon('');
          setIsCouponApplied(false);
          setCouponMessage(language === 'bn' ? validation.reasonBn : validation.reasonEn);
          triggerToast(language === 'bn' ? 'অপ্রযোজ্য কুপনটি বাদ দেওয়া হয়েছে' : 'Inapplicable coupon removed', 'info');
        }
      }
    } else {
      setAppliedDiscount(0);
    }
  }, [cartItems, appliedCoupon, isCouponApplied, coupons, language]);

  const handleApplyCoupon = (e: React.MouseEvent) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponMessage(language === 'bn' ? 'দয়া করে একটি সঠিক কুপন কোড প্রবেশ করান' : 'Please enter a valid coupon code');
      return;
    }
    
    const couponSpecs = coupons.find(c => c.id.toUpperCase() === code);
    if (couponSpecs) {
      const validation = validateCouponForCart(couponSpecs);
      if (validation.valid) {
        setAppliedCoupon(code);
        setIsCouponApplied(true);
        const descText = couponSpecs.discountType === 'percentage' 
          ? `${couponSpecs.discountValue}% Off` 
          : `৳${couponSpecs.discountValue} Flat`;
        setCouponMessage(language === 'bn' 
          ? `অভিনন্দন! কুপন "${code}" যুক্ত হয়েছে: ${couponSpecs.offerName} (${descText})` 
          : `Success! Coupon "${code}" applied: ${couponSpecs.offerName} (${descText})`);
        triggerToast(language === 'bn' ? 'কুপন সক্রিয় করা হয়েছে!' : 'Coupon applied successfully!', 'success');
      } else {
        setAppliedCoupon('');
        setIsCouponApplied(false);
        setAppliedDiscount(0);
        setCouponMessage(language === 'bn' ? validation.reasonBn : validation.reasonEn);
        triggerToast(language === 'bn' ? 'কুপনটি প্রযোজ্য নয়' : 'Invalid coupon application', 'error');
      }
    } else {
      setAppliedCoupon('');
      setIsCouponApplied(false);
      setAppliedDiscount(0);
      setCouponMessage(language === 'bn' ? 'দুঃখিত, এই কুপন কোডটি সঠিক নয়' : 'Invalid coupon code!');
      triggerToast(language === 'bn' ? 'ভুল কুপন কোড' : 'Invalid Coupon Code', 'error');
    }
  };

  const handleRemoveCoupon = () => {
    setCouponInput('');
    setAppliedCoupon('');
    setIsCouponApplied(false);
    setAppliedDiscount(0);
    setCouponMessage('');
    triggerToast(language === 'bn' ? 'কুপন বাতিল করা হয়েছে' : 'Coupon removed', 'info');
  };

  // Simulated dynamic social trust order tickers
  const [currentTickerIdx, setCurrentTickerIdx] = useState(0);
  const [showTicker, setShowTicker] = useState(true);

  const liveTickers = [
    { nameBn: 'রামিসা তাবাসসুম', nameEn: 'Ramisa Tabassum', areaBn: 'খুলশী আবাসিক এলাকা', areaEn: 'Khulshi R/A', itemBn: 'ঐতিহ্যবাহী চাটগাঁইয়া মেজবানি মাংস', itemEn: 'Traditional Chattogram Mezban Beef', timeBn: '২ মিনিট আগে', timeEn: '2 mins ago' },
    { nameBn: 'তানভীর রহমান', nameEn: 'Tanvir Rahman', areaBn: 'জিইসি মোড়', areaEn: 'GEC Circle', itemBn: 'চাটগাঁইয়া বিফ আখনি বিরিয়ানি', itemEn: 'Chattogram Beef Akhni Biryani', timeBn: '১ মিনিট আগে', timeEn: '1 min ago' },
    { nameBn: 'নাবিলা ইসলাম', nameEn: 'Nabila Islam', areaBn: 'নাসিরাবাদ', areaEn: 'Nasirabad', itemBn: 'রাহিস স্পেশাল কাশ্মীরি জাফরান ফিরনি', itemEn: "Rahi's Royal Saffron Firni", timeBn: '৩ মিনিট আগে', timeEn: '3 mins ago' },
    { nameBn: 'আদনান চৌধুরী', nameEn: 'Adnan Chowdhury', areaBn: 'হালিশহর', areaEn: 'Halishahar', itemBn: 'ঐতিহ্যবাহী মেজবানি বুটের ডাল', itemEn: 'Classic Mezbani Chonar Dal', timeBn: '৪ মিনিট আগে', timeEn: '4 mins ago' },
    { nameBn: 'তাসনিম আরা', nameEn: 'Tasnim Ara', areaBn: 'আগ্রাবাদ সিডিএ', areaEn: 'Agrabad CDA', itemBn: 'ঝাল চাটগাঁিয়া লইট্টা শুঁটকি ভুনা', itemEn: 'Ctg Extreme Spicy Loitta Shutki Bhuna', timeBn: '৫ মিনিট আগে', timeEn: '5 mins ago' },
    { nameBn: 'সাজ্জাদ হোসাইন', nameEn: 'Sajjad Hossain', areaBn: 'চকবাজার', areaEn: 'Chawkbazar', itemBn: 'ঐতিহ্যবাহী চাটগাঁইয়া মেজবানি মাংস', itemEn: 'Traditional Chattogram Mezban Beef', timeBn: '২ মিনিট আগে', timeEn: '2 mins ago' },
    { nameBn: 'ফাতেমা জোহরা', nameEn: 'Fatema Zohra', areaBn: 'পাঁচলাইশ', areaEn: 'Panchlaish', itemBn: 'ঐতিহ্যবাহী নারিকেলের দুধে ভিজা চিতই পিঠা', itemEn: 'Coconut Milk Dipped Traditional Pitha', timeBn: '৬ মিনিট আগে', timeEn: '6 mins ago' },
    { nameBn: 'ইমতিয়াজ আহমেদ', nameEn: 'Imtiaz Ahmed', areaBn: 'মুরাদপুর', areaEn: 'Muradpur', itemBn: 'চাটগাঁইয়া বিফ আখনি বিরিয়ানি', itemEn: 'Chattogram Beef Akhni Biryani', timeBn: '১ মিনিট আগে', timeEn: '1 min ago' }
  ];

  useEffect(() => {
    // Cycles every 40 seconds
    const interval = setInterval(() => {
      setShowTicker(false);
      setTimeout(() => {
        setCurrentTickerIdx((prev) => (prev + 1) % liveTickers.length);
        setShowTicker(true);
      }, 1200);
    }, 40000);

    return () => clearInterval(interval);
  }, []);

  // Fetch Data from DB service
  const loadDatabase = async () => {
    try {
      // Fetch public structures concurrently (highly optimized)
      const [cats, items, conf, cups] = await Promise.all([
        dbService.getCategories(),
        dbService.getMenuItems(),
        dbService.getSiteConfig(),
        dbService.getCoupons()
      ]);

      setCategories(cats);
      setMenuItems(items);
      setSiteConfig(conf);
      setCoupons(cups);

      // Fetch private structures concurrently (Only if active administrator/operator profile is present)
      if (adminProfile || loggedInAdmin) {
        const [ords, adms, logs] = await Promise.all([
          dbService.getOrders(),
          dbService.getAdmins(),
          dbService.getActivityLogs()
        ]);
        setOrders(ords);
        setAdmins(adms);
        setActivityLogs(logs);
      } else {
        // For guest, use local orders database array (fast, offline-capable)
        const storageKeys = localStorage.getItem('h_orders');
        const localOrders: Order[] = storageKeys ? JSON.parse(storageKeys) : [];
        setOrders(localOrders.filter(item => !item.isDeleted).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
    } catch (err) {
      console.error('Error fetching database layers:', err);
    }
  };

  useEffect(() => {
    loadDatabase();
  }, []);

  // Sync private admin variables dynamically ONLY when loading/entering administrative views
  useEffect(() => {
    if (activeView === 'admin' && (adminProfile || loggedInAdmin)) {
      loadDatabase();
    }
  }, [activeView, adminProfile, loggedInAdmin]);

  // Real-time Firestore Live synchronization (Public Collections accessible by everyone with robust fallback if empty)
  useEffect(() => {
    if (isFirebaseConfigured && db) {
      const unsubscribers: (() => void)[] = [];

      try {
        // 1. Live synchronized Menu Items
        unsubscribers.push(
          onSnapshot(collection(db, 'menuItems'), (snapshot) => {
            const items: MenuItem[] = [];
            snapshot.forEach((doc) => {
              items.push({ ...doc.data() } as MenuItem);
            });
            if (items.length > 0) {
              setMenuItems(items);
            } else {
              const storageKeys = localStorage.getItem('h_menu_items');
              const fallback = storageKeys ? JSON.parse(storageKeys) : defaultMenuItems;
              setMenuItems(fallback.filter((item: MenuItem) => !item.isDeleted));
            }
          }, (err) => {
            console.warn('Real-time items sync error:', err);
          })
        );

        // 2. Live synchronized Categories
        unsubscribers.push(
          onSnapshot(collection(db, 'categories'), (snapshot) => {
            const cats: Category[] = [];
            snapshot.forEach((doc) => {
              cats.push({ ...doc.data() } as Category);
            });
            if (cats.length > 0) {
              setCategories(cats);
            } else {
              const storageKeys = localStorage.getItem('h_categories');
              const fallback = storageKeys ? JSON.parse(storageKeys) : defaultCategories;
              setCategories(fallback.filter((item: Category) => !item.isDeleted));
            }
          }, (err) => {
            console.warn('Real-time categories sync error:', err);
          })
        );

        // 3. Live synchronized Site Config
        unsubscribers.push(
          onSnapshot(collection(db, 'siteConfig'), (snapshot) => {
            let found = false;
            snapshot.forEach((doc) => {
              if (doc.id === 'global') {
                setSiteConfig(doc.data() as SiteConfig);
                found = true;
              }
            });
            if (!found) {
              const storageKeys = localStorage.getItem('h_site_config');
              const fallback = storageKeys ? JSON.parse(storageKeys) : defaultSiteConfig;
              setSiteConfig(fallback);
            }
          }, (err) => {
            console.warn('Real-time site config sync error:', err);
          })
        );

        // 4. Live synchronized Coupons
        unsubscribers.push(
          onSnapshot(collection(db, 'coupons'), (snapshot) => {
            const cups: Coupon[] = [];
            snapshot.forEach((doc) => {
              cups.push({ ...doc.data() } as Coupon);
            });
            if (cups.length > 0) {
              setCoupons(cups);
            } else {
              const storageKeys = localStorage.getItem('h_coupons');
              const fallback = storageKeys ? JSON.parse(storageKeys) : defaultCoupons;
              setCoupons(fallback.filter((item: Coupon) => !item.isDeleted));
            }
          }, (err) => {
            console.warn('Real-time coupons sync error:', err);
          })
        );

      } catch (err) {
        console.error('Failed to setup public real-time firestore listeners:', err);
      }

      return () => {
        unsubscribers.forEach((unsub) => unsub());
      };
    }
  }, []);

  // Real-time Firestore Live synchronization (Private Admin Only Collections)
  useEffect(() => {
    if (isFirebaseConfigured && db && (adminProfile || loggedInAdmin)) {
      const unsubscribers: (() => void)[] = [];

      try {
        // 1. Live synchronized Orders
        unsubscribers.push(
          onSnapshot(collection(db, 'orders'), (snapshot) => {
            const ords: Order[] = [];
            snapshot.forEach((doc) => {
              ords.push({ ...doc.data() } as Order);
            });
            setOrders(ords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          }, (err) => {
            console.warn('Real-time order sync error:', err);
          })
        );

        // 2. Live synchronized Admin privileges
        unsubscribers.push(
          onSnapshot(collection(db, 'admins'), (snapshot) => {
            const adms: Admin[] = [];
            snapshot.forEach((doc) => {
              adms.push({ ...doc.data() } as Admin);
            });
            setAdmins(adms);
          }, (err) => {
            console.warn('Real-time admin privileges sync error:', err);
          })
        );

        // 3. Live synchronized Activity Logs
        unsubscribers.push(
          onSnapshot(collection(db, 'activityLogs'), (snapshot) => {
            const logs: ActivityLog[] = [];
            snapshot.forEach((doc) => {
              logs.push({ ...doc.data() } as ActivityLog);
            });
            setActivityLogs(logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          }, (err) => {
            console.warn('Real-time activity logs sync error:', err);
          })
        );

      } catch (err) {
        console.error('Failed to setup private real-time firestore listeners:', err);
      }

      return () => {
        unsubscribers.forEach((unsub) => unsub());
      };
    }
  }, [adminProfile, loggedInAdmin]);

  // Auth synchronization if firebase auth is alive
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsub = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setLoggedInAdmin(user);
          // retrieve role
          const adms = await dbService.getAdmins();
          const profile = adms.find(a => a.uid === user.uid && !a.isDeleted);
          
          if (profile) {
            setAdminProfile(profile);
            triggerToast(`Logged in as operator role ${profile.role}`, 'success');
            try {
              await dbService.syncLocalDataToFirebase();
              await loadDatabase();
            } catch (err) {
              console.warn('OnLogin sync warning:', err);
            }
          } else if (user.email === 'edutechsa55@gmail.com') {
            // automatic superadmin allowance
            const tempProfile: Admin = {
              uid: user.uid,
              email: user.email,
              role: 'super_admin',
              permissions: ['manage_menu', 'manage_categories', 'manage_orders', 'manage_site_config']
            };
            setAdminProfile(tempProfile);
            triggerToast('Root super admin logged in successfully.', 'success');
            try {
              await dbService.syncLocalDataToFirebase();
              await loadDatabase();
            } catch (err) {
              console.warn('OnLogin sync warning:', err);
            }
          } else {
            setAdminProfile(null);
            triggerToast('You are authenticated but have no administrative cleared roles.', 'error');
          }
        } else {
          setLoggedInAdmin(null);
          setAdminProfile(null);
        }
      });
      return () => unsub();
    }
  }, []);

  // --- ACTIONS HANDLERS ---

  const handleAddToCart = (item: MenuItem) => {
    addToCart(item);
    triggerToast(language === 'bn' ? `${item.nameBn} কার্টে যুক্ত করা হয়েছে` : `${item.nameEn} added to shopping bag`, 'success');
  };

  const handleQuickOrder = (item: MenuItem) => {
    addToCart(item);
    setOrderingItem(item);
    setIsCartOpen(true); // slides over instantly
  };

  // Generate 7 chars alphanumeric Order ID representing ERT2314 and similar
  const generateClientOrderId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    let letterPart = '';
    for (let i = 0; i < 3; i++) {
      letterPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    let numPart = '';
    for (let i = 0; i < 4; i++) {
      numPart += nums.charAt(Math.floor(Math.random() * nums.length));
    }
    return `${letterPart}${numPart}`;
  };

  // Submit Order logic (Secure Randomized IDs and confirmation invoices)
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      triggerToast(language === 'bn' ? 'অর্ডার করতে অন্তত একটি খাবার নির্বাচন করুন' : 'Your bag is empty', 'error');
      return;
    }
    if (!fullName || !phoneNumber || !fullAddress) {
      triggerToast(language === 'bn' ? 'দয়া করে বাধ্যতামূলক সকল ঘর পূরণ করুন' : 'Please fill all required inputs', 'error');
      return;
    }

    // Advanced validations for cash on delivery
    if (payMethod === 'Cash on Delivery') {
      if (!bkashPhone || !bkashTxnId) {
        triggerToast(
          language === 'bn' 
            ? 'ক্যাশ অন ডেলিভারিতে অগ্রিম ডেলিভারি ফি বিকাশ করার ট্রানজেকশন তথ্য দিন!' 
            : 'Advance delivery fee details are required for cash on delivery!', 
          'error'
        );
        return;
      }
    }

    // Additional validations for regular bKash payments
    if (payMethod === 'bKash') {
      if (!bkashPhone || !bkashTxnId) {
        triggerToast(
          language === 'bn' 
            ? 'বিকাশ ডাবল ভেরিফিকেশনের জন্য বিকাশ নম্বর ও ট্রানজেকশন আইডি দিন!' 
            : 'bKash sender number and Transaction ID must be stated!', 
          'error'
        );
        return;
      }
    }

    const currentDeliveryCost = shippingArea === 'inside' 
      ? (siteConfig?.deliveryChargeInside || 60) 
      : (siteConfig?.deliveryChargeOutside || 120);

    const generatedOrderId = generateClientOrderId();
    const generatedInvoice = 'INV-2026-' + Math.floor(100000 + Math.random() * 900000);

    const packedItems: OrderItem[] = cartItems.map(ci => ({
      id: ci.menuItem.id,
      nameBn: ci.menuItem.nameBn,
      nameEn: ci.menuItem.nameEn,
      quantity: ci.quantity,
      price: ci.menuItem.discountedPrice !== undefined && ci.menuItem.discountedPrice < ci.menuItem.regularPrice 
        ? ci.menuItem.discountedPrice 
        : ci.menuItem.regularPrice
    }));

    const newOrder: Order = {
      id: generatedOrderId,
      invoiceNumber: generatedInvoice,
      fullName,
      phoneNumber,
      fullAddress,
      items: packedItems,
      totalPrice: Math.max(0, getCartTotal() - appliedDiscount),
      deliveryCharge: currentDeliveryCost,
      paymentMethod: payMethod === 'bKash' ? 'bKash' : 'Cash on Delivery',
      bKashNumber: bkashPhone,
      transactionId: bkashTxnId,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      shippingArea: shippingArea as 'inside' | 'outside',
      ...(appliedCoupon ? { couponCode: appliedCoupon.toUpperCase(), couponDiscount: appliedDiscount } : {})
    };

    setIsPlacingOrder(true);
    try {
      await dbService.createOrder(newOrder);
      setConfirmedOrder(newOrder);
      clearCart();
      setIsCartOpen(false);
      setActiveView('order-confirmation');
      triggerToast(language === 'bn' ? 'আপনার অর্ডারটি পেন্ডিং হিসেবে জমা হয়েছে!' : 'Order submitted for verification!', 'success');
      
      // Reset inputs
      setFullName('');
      setPhoneNumber('');
      setFullAddress('');
      setBkashPhone('');
      setBkashTxnId('');
      setHasCouponChecked(false);
      setCouponInput('');
      setAppliedCoupon('');
      setAppliedDiscount(0);
      setCouponMessage('');
      setIsCouponApplied(false);
    } catch (err) {
      triggerToast('Could not submit order. Please retry.', 'error');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Track Orders
  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryTerm = trackingIdInput.trim();
    if (!queryTerm) {
      triggerToast(language === 'bn' ? 'অর্ডার আইডি অথবা ইনভয়েস নম্বর লিখুন' : 'Enter tracking references', 'error');
      return;
    }

    try {
      // 1. Direct query by ID which triggers single document GET (extremely fast, permitted by rules for guest)
      const directMatch = await dbService.getOrderById(queryTerm);
      if (directMatch) {
        setTrackedOrder(directMatch);
        triggerToast(language === 'bn' ? 'অর্ডার তথ্য লোড হয়েছে' : 'Order details located', 'success');
        return;
      }

      // 2. Query fallback on local memory/storage if single doc GET didn't hit
      const storageKeys = localStorage.getItem('h_orders');
      const localRecords: Order[] = storageKeys ? JSON.parse(storageKeys) : [];
      const localMatch = localRecords.find(r => 
        !r.isDeleted && 
        (r.id.toLowerCase() === queryTerm.toLowerCase() ||
         r.invoiceNumber.toLowerCase() === queryTerm.toLowerCase())
      );

      if (localMatch) {
        setTrackedOrder(localMatch);
        triggerToast(language === 'bn' ? 'অর্ডার তথ্য লোড হয়েছে' : 'Order details located', 'success');
      } else {
        setTrackedOrder(null);
        triggerToast(t('noOrderFound'), 'info');
      }
    } catch (err) {
      triggerToast('Order search failure.', 'error');
    }
  };

  // --- GOOGLE SIGN-IN OR PREVIEW SIMULATOR LOGIN ---

  const handleAdminGoogleLogin = async () => {
    if (isFirebaseConfigured && auth) {
      setIsAdminAuthLoading(true);
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } catch (err: any) {
        console.error('Google Sign in error details:', err);
        const errCode = err?.code || 'unknown-error';
        const errMsg = err?.message || '';
        
        let actionableTip = '';
        if (errCode === 'auth/unauthorized-domain') {
          actionableTip = ' (Domain needs to be added to Firebase "Authorized domains")';
        } else if (errCode === 'auth/popup-blocked') {
          actionableTip = ' (Popup was blocked. Please allow popups or try in a new tab)';
        } else if (errCode === 'auth/configuration-not-found' || errCode === 'auth/operation-not-allowed') {
          actionableTip = ' (Google Sign-In is not enabled in your Firebase Console)';
        }
        
        triggerToast(`Could not sign in: ${errCode}${actionableTip}`, 'error');
      } finally {
        setIsAdminAuthLoading(false);
      }
    }
  };

  const handleAdminSandboxLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sandboxEmail) return;

    setIsAdminAuthLoading(true);
    // Simulation checks
    const targetEmail = sandboxEmail.trim().toLowerCase();
    
    // Check if operator listed
    const recordAdms = await dbService.getAdmins();
    const match = recordAdms.find(a => a.email.toLowerCase() === targetEmail && !a.isDeleted);

    if (match) {
      setLoggedInAdmin({ email: match.email, uid: match.uid });
      setAdminProfile(match);
      triggerToast(`Signed in to Operator Dashboard (${match.role})`, 'success');
    } else if (targetEmail === 'edutechsa55@gmail.com') {
      // Automatic root super_admin bootstrap
      const rootProfile: Admin = {
        uid: 'root-sys',
        email: 'edutechsa55@gmail.com',
        role: 'super_admin',
        permissions: ['manage_menu', 'manage_categories', 'manage_orders', 'manage_site_config']
      };
      setLoggedInAdmin({ email: 'edutechsa55@gmail.com', uid: 'root-sys' });
      setAdminProfile(rootProfile);
      triggerToast('Root System Administrator logged in.', 'success');
    } else {
      triggerToast('Unauthorized Email credentials. Add this email in administrative permissions first.', 'error');
    }
    setIsAdminAuthLoading(false);
  };

  const handleAdminLogout = async () => {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    }
    setLoggedInAdmin(null);
    setAdminProfile(null);
    triggerToast('Logged out of admin console.', 'success');
  };

  // --- ACTIONS PROPAGATIONS TO SERVICES IN REAL TIME WITH CENTRAL LOGGING ASSURANCE ---

  const activePermissions = adminProfile?.role === 'super_admin' 
    ? ['manage_menu', 'manage_categories', 'manage_orders', 'manage_site_config', 'all'] 
    : adminProfile?.permissions || [];

  const recordLog = async (action: string, details?: string) => {
    const logId = 'log-' + Math.random().toString(36).substring(2, 11);
    const newLog: ActivityLog = {
      id: logId,
      adminEmail: adminProfile?.email || 'unknown@admin.com',
      action,
      details,
      createdAt: new Date().toISOString()
    };
    await dbService.addActivityLog(newLog);
    // Reload local logs state
    const currentLogs = await dbService.getActivityLogs();
    setActivityLogs(currentLogs);
  };

  // Menu updates
  const handleAddMenuItem = async (item: MenuItem) => {
    try {
      if (item.isMostlyOrdered) {
        const others = menuItems.filter(i => i.isMostlyOrdered && i.id !== item.id && !i.isDeleted);
        for (const otherItem of others) {
          await dbService.updateMenuItem(otherItem.id, { isMostlyOrdered: false });
        }
      }
      await dbService.createMenuItem(item);
      setMenuItems(await dbService.getMenuItems());
      triggerToast(`${item.nameEn} listed in menu.`, 'success');
      recordLog(`Added menu recipe item "${item.nameEn}"`, JSON.stringify(item));
    } catch (e) {
      triggerToast('Catalog insert error.', 'error');
    }
  };

  const handleUpdateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    try {
      if (updates.isMostlyOrdered) {
        const others = menuItems.filter(i => i.isMostlyOrdered && i.id !== id && !i.isDeleted);
        for (const otherItem of others) {
          await dbService.updateMenuItem(otherItem.id, { isMostlyOrdered: false });
        }
      }
      await dbService.updateMenuItem(id, updates);
      setMenuItems(await dbService.getMenuItems());
      triggerToast('Recipe item updated.', 'success');
      recordLog(`Modified recipe details for ID: ${id}`, JSON.stringify(updates));
    } catch (e) {
      triggerToast('Catalog edit error', 'error');
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    try {
      await dbService.deleteMenuItem(id);
      setMenuItems(await dbService.getMenuItems());
      triggerToast('Recipe soft-deleted.', 'success');
      recordLog(`Soft-deleted menu item with ID: ${id}`);
    } catch (e) {
      triggerToast('Catalog delete error', 'error');
    }
  };

  // Category additions
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatBn || !newCatEn) {
      triggerToast('Please state category title bn/en', 'error');
      return;
    }

    const generatedId = 'cat-' + Math.random().toString(36).substr(2, 6);
    const item: Category = {
      id: generatedId,
      nameBn: newCatBn,
      nameEn: newCatEn,
      descriptionBn: newCatDescBn,
      descriptionEn: newCatDescEn,
      isDeleted: false,
      price: newCatPrice ? parseFloat(newCatPrice) : undefined
    };

    setIsSavingCategory(true);
    try {
      await dbService.createCategory(item);
      setCategories(await dbService.getCategories());
      triggerToast(`Category "${newCatEn}" registered.`, 'success');
      recordLog(`Registered food category item: ${newCatEn}`, JSON.stringify(item));
      
      // Cleanup
      setNewCatBn('');
      setNewCatEn('');
      setNewCatDescBn('');
      setNewCatDescEn('');
      setNewCatPrice('');
    } catch (err) {
      triggerToast('Category insert error.', 'error');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!activePermissions.includes('manage_categories') && !activePermissions.includes('all')) {
      triggerToast('Unauthorized action.', 'error');
      return;
    }
    try {
      await dbService.deleteCategory(id);
      setCategories(await dbService.getCategories());
      triggerToast('Category removed.', 'success');
      recordLog(`Soft-deleted category ID: ${id}`);
    } catch (err) {
      triggerToast('Category delete error.', 'error');
    }
  };

  // Coupon handlers
  const handleCreateCoupon = async (coupon: Coupon) => {
    try {
      await dbService.createCoupon(coupon);
      setCoupons(await dbService.getCoupons());
      triggerToast(`Coupon ${coupon.id} created successfully!`, 'success');
      recordLog(`Created promotional coupon: ${coupon.id}`, JSON.stringify(coupon));
    } catch (err: any) {
      triggerToast(err.message || 'Error creating coupon.', 'error');
      throw err;
    }
  };

  const handleUpdateCoupon = async (id: string, updates: Partial<Coupon>) => {
    try {
      await dbService.updateCoupon(id, updates);
      setCoupons(await dbService.getCoupons());
      triggerToast(`Coupon ${id} updated!`, 'success');
      recordLog(`Updated promotional coupon: ${id}`, JSON.stringify(updates));
    } catch (err: any) {
      triggerToast('Error updating coupon.', 'error');
      throw err;
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      await dbService.deleteCoupon(id);
      setCoupons(await dbService.getCoupons());
      triggerToast(`Coupon ${id} deleted!`, 'success');
      recordLog(`Deleted promotional coupon: ${id}`);
    } catch (err: any) {
      triggerToast('Error deleting coupon.', 'error');
      throw err;
    }
  };

  // Order updates
  const handleUpdateOrderStatus = async (id: string, status: OrderStatus) => {
    try {
      await dbService.updateOrder(id, { status });
      setOrders(await dbService.getOrders());
      triggerToast(`Order status updated to ${status}.`, 'success');
      recordLog(`Transitioned order status of transaction ${id} to "${status}"`);
    } catch (e) {
      triggerToast('Status update failure.', 'error');
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      await dbService.deleteOrder(id);
      setOrders(await dbService.getOrders());
      triggerToast('Order records soft-removed.', 'success');
      recordLog(`Deleted customer order session file ID: ${id}`);
    } catch (e) {
      triggerToast('Order delete failure.', 'error');
    }
  };

  // Site Config updates
  const handleUpdateSiteConfig = async (updates: Partial<SiteConfig>) => {
    try {
      await dbService.updateSiteConfig(updates);
      setSiteConfig(await dbService.getSiteConfig());
      triggerToast('Site configurations saved successfully.', 'success');
      recordLog(`Modified global platform configuration settings`, JSON.stringify(updates));
    } catch (e) {
      triggerToast('Configs save failure.', 'error');
    }
  };

  // Administrative personnel additions / layers
  const handleAddAdmin = async (uid: string, email: string, role: AdminRole, perms: ActivityType[]) => {
    const admin: Admin = { uid, email, role, permissions: perms, isDeleted: false };
    try {
      await dbService.createAdmin(admin);
      setAdmins(await dbService.getAdmins());
      triggerToast(`Operator privilege cleared for ${email}.`, 'success');
      recordLog(`Registered administrative operator account`, JSON.stringify(admin));
    } catch (e) {
      triggerToast('Operator additions failure.', 'error');
    }
  };

  const handleUpdateAdminPermissions = async (uid: string, perms: ActivityType[]) => {
    try {
      await dbService.updateAdmin(uid, { permissions: perms });
      setAdmins(await dbService.getAdmins());
      triggerToast('Operator permissions updated.', 'success');
      recordLog(`Toggled access clearance permissions for operator: ${uid}`, JSON.stringify(perms));
    } catch (e) {
      triggerToast('Clearance change failure.', 'error');
    }
  };

  const handleUpdateAdminRole = async (uid: string, role: AdminRole) => {
    try {
      await dbService.updateAdmin(uid, { role });
      setAdmins(await dbService.getAdmins());
      triggerToast('Operator role level modified.', 'success');
      recordLog(`Adjusted administrative group level of UID: ${uid} to "${role}"`);
    } catch (e) {
      triggerToast('Role update failure.', 'error');
    }
  };

  const handleDeleteAdmin = async (uid: string) => {
    try {
      await dbService.deleteAdmin(uid);
      setAdmins(await dbService.getAdmins());
      triggerToast('Operator revoked.', 'success');
      recordLog(`Revoked platform operator clearances on UID: ${uid}`);
    } catch (e) {
      triggerToast('Operator deletion failure', 'error');
    }
  };

  // Copy helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    triggerToast(language === 'bn' ? 'কপি সফল হয়েছে!' : 'Copied to clipboard!', 'success');
  };

  // Filtered dishes
  const filteredDishes = menuItems.filter(item => {
    if (item.isDeleted) return false;
    return activeCategory === 'all' ? true : item.categoryId === activeCategory;
  });

  const cartTotal = getCartTotal();
  const deliveryCostForCheckout = shippingArea === 'inside' 
    ? (siteConfig?.deliveryChargeInside || 60) 
    : (siteConfig?.deliveryChargeOutside || 120);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between font-sans selection:bg-amber-100 antialiased">
      
      {/* Sticky Top Admin Return Control Bar */}
      {loggedInAdmin && activeView !== 'admin' && (
        <div className="bg-gradient-to-r from-gray-950 to-amber-950 text-white font-sans text-xs font-bold py-2.5 px-4 sticky top-0 z-[100] flex items-center justify-between shadow-sm border-b border-amber-900/30">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>
              {language === 'bn' 
                ? `অ্যাডমিন সেশন সচল: ${loggedInAdmin.email} (${adminProfile?.role === 'super_admin' ? 'সুপার রুট অ্যাডমিন' : 'অপারেটর'})`
                : `Admin Session Active: ${loggedInAdmin.email} (${adminProfile?.role === 'super_admin' ? 'Super Root' : 'Operator'})`}
            </span>
          </div>
          <button
            onClick={() => setActiveView('admin')}
            className="bg-amber-500 hover:bg-amber-600 active:scale-97 text-white text-[10px] font-black uppercase px-3 py-1 rounded-lg cursor-pointer transition-transform shadow-md shadow-amber-500/10 flex items-center gap-1 shrink-0"
          >
            <span>{language === 'bn' ? 'অ্যাডমিন প্যানেলে ফিরে যান ➔' : 'Return to Admin panel ➔'}</span>
          </button>
        </div>
      )}

      {/* Toast Notification */}
      <Notification
        message={toastMessage}
        type={toastType}
        isOpen={isToastOpen}
        onClose={() => setIsToastOpen(false)}
      />

      {/* Header element */}
      <Header
        onOpenCart={() => setIsCartOpen(true)}
        onOpenTracking={() => {
          setTrackedOrder(null);
          setTrackingIdInput('');
          setActiveView('tracking');
        }}
        onOpenAdmin={() => {
          setActiveView('admin');
        }}
        onGoHome={() => setActiveView('home')}
        activeView={activeView}
        isAdminLoggedIn={!!loggedInAdmin}
        adminRole={adminProfile?.role || 'operator'}
      />

      {/* Primary body switcher */}
      <main className="flex-grow">
        
        {/* --- FRONT END HOME VIEW --- */}
        {activeView === 'home' && (
          <div className="space-y-12">
            
            {/* Hero section */}
            <Hero
              categories={categories}
              activeCategory={activeCategory}
              onSelectCategory={(id) => setActiveCategory(id)}
              onExploreMenu={() => {
                const catalog = document.getElementById('catalog_section');
                catalog?.scrollIntoView({ behavior: 'smooth' });
              }}
              siteConfig={siteConfig}
              menuItems={menuItems}
              onAddToCart={(item, qty) => {
                // Add item qty times
                for (let i = 0; i < qty; i++) {
                  addToCart(item);
                }
                const msg = language === 'bn' 
                  ? `${qty}টি ${item.nameBn} সফলভাবে আপনার ঝুড়িতে যুক্ত করা হয়েছে` 
                  : `${qty}x ${item.nameEn} successfully added to your food bag`;
                triggerToast(msg, 'success');
                setIsCartOpen(true);
              }}
            />

            {/* Menu catalog list */}
            <div id="catalog_section" className="max-w-7xl mx-auto px-4 md:px-6 py-6 scroll-mt-20">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div className="text-center md:text-left space-y-1">
                  <h3 className="text-xl md:text-3xl font-black font-sans text-gray-950 tracking-tight">
                    {language === 'bn' ? 'আমাদের সম্পূর্ণ মেনু' : 'Our Full Menu'}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-500">
                    {language === 'bn' 
                      ? 'তাজা উপাদানের ঘরোয়া খাবার, ক্যাটাগরি সিলেক্ট করে আপনার পছন্দ খুঁজুন।' 
                      : 'Handcrafted premium mom-cook meals. Filter by category to find your favorite.'}
                  </p>
                </div>
              </div>

              {/* Dynamic Category Filtering Pills inside Full Menu */}
              <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-thin scrollbar-thumb-gray-200">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeCategory === 'all'
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10 scale-102 border border-amber-400/30'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-150 shadow-sm'
                  }`}
                >
                  🍲 {language === 'bn' ? 'সব খাবার' : 'All Delicacies'}
                </button>
                {categories.filter(c => !c.isDeleted).map((cat) => {
                  let emoji = '📌';
                  if (cat.id.includes('main')) emoji = '🍛';
                  if (cat.id.includes('snack')) emoji = '🥪';
                  if (cat.id.includes('dessert')) emoji = '🧁';
                  if (cat.id.includes('drink')) emoji = '🥤';
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        activeCategory === cat.id
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10 scale-102 border border-amber-400/30'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-150 shadow-sm'
                      }`}
                    >
                      {emoji} {language === 'bn' ? cat.nameBn : cat.nameEn}
                    </button>
                  );
                })}
              </div>

              {/* Grid recipe catalog cards */}
              {filteredDishes.length === 0 ? (
                <div className="bg-white border rounded-2xl p-10 text-center text-gray-400 text-xs">
                  {language === 'bn' ? 'এই ক্যাটাগরিতে বর্তমানে কোনো খাবার প্রস্তুত নেই।' : 'No dishes are listed in this category today.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredDishes.map((dish) => (
                    <FoodCard
                      key={dish.id}
                      item={dish}
                      onAddToCart={handleAddToCart}
                      onQuickOrder={handleQuickOrder}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Testimonials and common reviews */}
            <Testimonials />

            {/* FAQ common doubts */}
            <FAQ />

          </div>
        )}

        {/* --- ORDER TRACKING SYSTEM --- */}
        {activeView === 'tracking' && (
          <div className="max-w-3xl mx-auto px-4 py-12 md:py-16 space-y-8 text-center">
            
            <div className="space-y-2">
              <h3 className="text-2xl md:text-3xl font-black text-gray-950 font-sans tracking-tight">
                {t('trackingPageTitle')}
              </h3>
              <p className="text-xs md:text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                আপনার অর্ডারের বর্তমান অবস্থা এবং রিয়েল-টাইম কাজের অগ্রগতি ট্র্যাক করতে অর্ডার নাম্বার বা ইনভয়েস আইডিটি নিচের বক্সে লিখুন।
              </p>
            </div>

            {/* Search inputs */}
            <form onSubmit={handleTrackOrder} className="max-w-md mx-auto flex items-center gap-2">
              <input
                type="text"
                required
                placeholder={t('trackPlaceholder')}
                value={trackingIdInput}
                onChange={(e) => setTrackingIdInput(e.target.value)}
                className="flex-1 bg-white border border-gray-200 rounded-2xl p-3 text-xs md:text-sm focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-600 font-bold text-white px-5 py-3 rounded-2xl text-xs sm:text-sm shadow-md shadow-amber-500/10 cursor-pointer active:scale-97 transition-transform shrink-0"
              >
                {t('trackBtn')}
              </button>
            </form>

            <AnimatePresence mode="wait">
              {trackedOrder ? (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4 pt-4"
                >
                  <Invoice 
                    order={trackedOrder} 
                    onCopyId={() => copyToClipboard(trackedOrder.id)} 
                  />
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-gray-450 text-xs py-10"
                >
                  {language === 'bn' 
                    ? 'কোনো সক্রিয় ইনভয়েস ট্র্যাকার রেকর্ড খোলা নেই।' 
                    : 'No tracking statement currently active.'}
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        )}

        {/* --- ORDER CONFIRMATION INVOICE PAGE --- */}
        {activeView === 'order-confirmation' && confirmedOrder && (
          <div className="max-w-3xl mx-auto px-4 py-12 md:py-16 space-y-6 text-center">
            
            {/* Header Success visual */}
            <div className="space-y-2">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-gray-950 tracking-tight">
                {t('orderSuccess')}
              </h3>
              <p className="text-xs md:text-sm text-gray-500 max-w-md mx-auto">
                {language === 'bn' 
                  ? 'আপনার খাবার প্রস্তুত করার সেশনটি পেন্ডিং কাতারভুক্ত করা হয়েছে। আপনার অর্ডার ট্র্যাকিং নাম্বার এবং ইনভয়েস কপিটি নিচে সংরক্ষণ করুন।' 
                  : 'Your meal preparation session has been logged. Please save your order ID or tracking invoice below to track work status.'}
              </p>
            </div>

            {/* Copyable Order ID banner quick view */}
            <div className="bg-amber-50 border border-amber-200/50 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 max-w-sm mx-auto text-left text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-amber-800 uppercase font-bold tracking-wider">{t('orderIdLabel')}</span>
                <p className="font-mono font-bold text-gray-950">{confirmedOrder.id}</p>
              </div>
              <button
                onClick={() => copyToClipboard(confirmedOrder.id)}
                className="p-1 px-2.5 bg-white rounded-lg border border-gray-250 text-amber-700 font-bold cursor-pointer hover:bg-gray-50"
              >
                Copy ID
              </button>
            </div>

            {/* Render full Invoice details */}
            <Invoice 
              order={confirmedOrder} 
              onCopyId={() => copyToClipboard(confirmedOrder.id)} 
            />

            {/* Back to home buttons */}
            <div className="pt-4 flex justify-center gap-3">
              <button
                onClick={() => setActiveView('home')}
                className="px-6 py-3 bg-gray-950 font-bold hover:bg-gray-850 text-white rounded-2xl text-xs md:text-sm cursor-pointer shadow-md inline-flex items-center gap-1.5"
              >
                <span>{language === 'bn' ? 'হোমপেজে ফিরে যান' : 'Go Back Home'}</span>
              </button>
            </div>

          </div>
        )}

        {/* --- ADMIN DASHBOARD SECURE PANEL --- */}
        {activeView === 'admin' && (
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
            
            {/* Standard Login Panel */}
            {!loggedInAdmin ? (
              <div className="max-w-md mx-auto bg-white rounded-3xl border border-gray-150 p-6 md:p-8 space-y-6 shadow-sm text-center">
                
                <div className="space-y-1.5 pt-2">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white mx-auto shadow-md">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h4 className="font-sans font-black text-xl text-gray-950">
                    Administrative Portal
                  </h4>
                  <p className="text-xs text-gray-500">
                    Secure system verification. Authorized operators only.
                  </p>
                </div>

                {/* Simulation indicator or Firebase Login Button */}
                {isFirebaseConfigured ? (
                  <div className="space-y-4">
                    <button
                      onClick={handleAdminGoogleLogin}
                      disabled={isAdminAuthLoading}
                      className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-gray-950 hover:bg-gray-850 text-white font-bold rounded-2xl text-xs md:text-sm cursor-pointer transition-all active:scale-[0.98] shadow-sm"
                    >
                      <span>Google Login (Live Firebase)</span>
                    </button>
                    <p className="text-[10px] text-gray-400">Authorized Google UIDs listed in database permissions will have access.</p>
                    
                    <div className="relative flex py-2 items-center text-[10px] text-gray-400 uppercase font-black tracking-widest">
                      <div className="flex-grow border-t border-gray-200"></div>
                      <span className="flex-shrink mx-3">OR FOR IFRAME / PREVIEW TESTING</span>
                      <div className="flex-grow border-t border-gray-200"></div>
                    </div>

                    <form onSubmit={handleAdminSandboxLogin} className="space-y-4 text-xs text-left">
                      <div className="space-y-1.5">
                        <label className="font-bold text-gray-750">Sandbox/Local Email Bypass (Recommended for Iframe)</label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. edutechsa55@gmail.com"
                          value={sandboxEmail}
                          onChange={(e) => setSandboxEmail(e.target.value)}
                          className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isAdminAuthLoading}
                        className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl text-xs md:text-sm active:scale-98 transition-transform cursor-pointer shadow-md shadow-amber-500/10 text-center text-white"
                      >
                        Authenticate Sandbox Bypass
                      </button>
                    </form>
                  </div>
                ) : (
                  <form onSubmit={handleAdminSandboxLogin} className="space-y-4 text-xs text-left">
                    <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-3.5 space-y-1 flex items-start gap-2 text-[11px] text-amber-900 leading-relaxed mb-4">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Sandbox Environment Sandbox:</strong> Google login will activate once the Firebase rules terms are approved. In sandbox mode, log in by typing any listed admin email (e.g. <strong>edutechsa55@gmail.com</strong>) to test features.
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-750">System Email address</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. edutechsa55@gmail.com"
                        value={sandboxEmail}
                        onChange={(e) => setSandboxEmail(e.target.value)}
                        className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isAdminAuthLoading}
                      className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl text-xs md:text-sm active:scale-98 transition-transform cursor-pointer shadow-md shadow-amber-500/10 text-center"
                    >
                      Authenticate Sandbox
                    </button>
                  </form>
                )}

              </div>
            ) : (
              // --- FULL ADMIN PANEL DISPLAY ---
              <div className="space-y-6">
                
                {/* Active user status header */}
                <div className="bg-gray-950 text-white rounded-3xl p-5 md:p-6 flex flex-wrap items-center justify-between gap-4 text-left">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-500 text-white px-2 py-0.5 rounded-md leading-tight">Admin Console</span>
                      <span className="text-xs text-amber-300 font-mono">Role: {adminProfile?.role || 'operator'}</span>
                    </div>
                    <h3 className="font-sans font-bold text-base md:text-lg">
                      Welcome, {loggedInAdmin.email}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveView('home')}
                      className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      View Shop Front
                    </button>
                    <button
                      onClick={handleAdminLogout}
                      className="p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl cursor-pointer text-xs font-extrabold flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Logout</span>
                    </button>
                  </div>
                </div>

                {/* Category navigation bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-gray-150">
                  
                  <button
                    onClick={() => setAdminTab('overview')}
                    className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap shrink-0 border-b-2 flex items-center gap-1 cursor-pointer transition-all ${
                      adminTab === 'overview'
                        ? 'border-amber-500 text-amber-600 font-extrabold'
                        : 'border-transparent text-gray-500 hover:text-gray-950'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Overview Stats</span>
                  </button>

                  <button
                    onClick={() => setAdminTab('orders')}
                    className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap shrink-0 border-b-2 flex items-center gap-1 cursor-pointer transition-all ${
                      adminTab === 'orders'
                        ? 'border-amber-500 text-amber-600 font-extrabold'
                        : 'border-transparent text-gray-500 hover:text-gray-950'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Manage Orders ({orders.filter(o=>!o.isDeleted).length})</span>
                  </button>

                  <button
                    onClick={() => setAdminTab('menu')}
                    className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap shrink-0 border-b-2 flex items-center gap-1 cursor-pointer transition-all ${
                      adminTab === 'menu'
                        ? 'border-amber-500 text-amber-600 font-extrabold'
                        : 'border-transparent text-gray-500 hover:text-gray-950'
                    }`}
                  >
                    <Menu className="w-4 h-4" />
                    <span>Manage Menu Items</span>
                  </button>

                  <button
                    onClick={() => setAdminTab('categories')}
                    className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap shrink-0 border-b-2 flex items-center gap-1 cursor-pointer transition-all ${
                      adminTab === 'categories'
                        ? 'border-amber-500 text-amber-600 font-extrabold'
                        : 'border-transparent text-gray-500 hover:text-gray-950'
                    }`}
                  >
                    <ListFilter className="w-4 h-4" />
                    <span>Manage Categories</span>
                  </button>

                  <button
                    onClick={() => setAdminTab('site_settings')}
                    className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap shrink-0 border-b-2 flex items-center gap-1 cursor-pointer transition-all ${
                      adminTab === 'site_settings'
                        ? 'border-amber-500 text-amber-600 font-extrabold'
                        : 'border-transparent text-gray-500 hover:text-gray-950'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Site Configurations</span>
                  </button>

                  <button
                    onClick={() => setAdminTab('permissions')}
                    className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap shrink-0 border-b-2 flex items-center gap-1 cursor-pointer transition-all ${
                      adminTab === 'permissions'
                        ? 'border-amber-500 text-amber-600 font-extrabold'
                        : 'border-transparent text-gray-500 hover:text-gray-950'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Permissions ({admins.filter(a=>!a.isDeleted).length})</span>
                  </button>

                  <button
                    onClick={() => setAdminTab('logs')}
                    className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap shrink-0 border-b-2 flex items-center gap-1 cursor-pointer transition-all ${
                      adminTab === 'logs'
                        ? 'border-amber-500 text-amber-600 font-extrabold'
                        : 'border-transparent text-gray-500 hover:text-gray-955'
                    }`}
                  >
                    <Clipboard className="w-4 h-4" />
                    <span>Central Logs Trailing</span>
                  </button>

                  <button
                    onClick={() => setAdminTab('coupons')}
                    className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap shrink-0 border-b-2 flex items-center gap-1 cursor-pointer transition-all ${
                      adminTab === 'coupons'
                        ? 'border-amber-500 text-amber-600 font-extrabold'
                        : 'border-transparent text-gray-500 hover:text-gray-955'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Manage Coupons ({coupons.filter(c=>!c.isDeleted).length})</span>
                  </button>

                </div>

                {/* Tab content controller */}
                <div className="pt-4">
                  
                  {adminTab === 'overview' && (
                    <AdminOverview
                      orders={orders}
                      menuItems={menuItems}
                      onViewOrdersTab={() => setAdminTab('orders')}
                      onViewMenuTab={() => setAdminTab('menu')}
                    />
                  )}

                  {adminTab === 'menu' && (
                    <AdminMenu
                      menuItems={menuItems}
                      categories={categories}
                      onAddMenuItem={handleAddMenuItem}
                      onUpdateMenuItem={handleUpdateMenuItem}
                      onDeleteMenuItem={handleDeleteMenuItem}
                      permissions={activePermissions}
                    />
                  )}

                  {adminTab === 'orders' && (
                    <AdminOrders
                      orders={orders}
                      onUpdateOrderStatus={handleUpdateOrderStatus}
                      onDeleteOrder={handleDeleteOrder}
                      permissions={activePermissions}
                    />
                  )}

                  {adminTab === 'categories' && (
                    <div className="grid md:grid-cols-12 gap-8 text-left">
                      
                      {/* Create Categories Form (Left) */}
                      <div className="md:col-span-5 bg-white rounded-3xl border border-gray-150 p-5 md:p-6 shadow-sm space-y-4">
                        <h4 className="font-sans font-bold text-sm text-gray-950">
                          Create Food Category
                        </h4>
                        
                        <form onSubmit={handleCreateCategory} className="space-y-3.5 text-xs">
                          <div className="space-y-1">
                            <label className="font-bold text-gray-700 block">ক্যাটাগরি নাম (বাংলা) *</label>
                            <input
                              type="text"
                              required
                              placeholder="যেমন: ঘরোয়া পিঠাপুলি"
                              value={newCatBn}
                              onChange={(e) => setNewCatBn(e.target.value)}
                              className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-gray-700 block">Category Title (English) *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Traditional Cakes"
                              value={newCatEn}
                              onChange={(e) => setNewCatEn(e.target.value)}
                              className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-gray-700 block">Description (Bangla)</label>
                            <textarea
                              rows={2}
                              placeholder="বিবরণ..."
                              value={newCatDescBn}
                              onChange={(e) => setNewCatDescBn(e.target.value)}
                              className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-gray-700 block">Description (English)</label>
                            <textarea
                              rows={2}
                              placeholder="Slight details..."
                              value={newCatDescEn}
                              onChange={(e) => setNewCatDescEn(e.target.value)}
                              className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-gray-700 block">Category Price / মূল্য (Optional) ৳</label>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              placeholder="e.g. 150 (optional)"
                              value={newCatPrice}
                              onChange={(e) => setNewCatPrice(e.target.value)}
                              className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </div>

                           <button
                            type="submit"
                            disabled={isSavingCategory || (!activePermissions.includes('manage_categories') && !activePermissions.includes('all'))}
                            className={`w-full py-2.5 font-bold rounded-xl text-center flex items-center justify-center gap-1.5 transition-all text-sm ${
                              isSavingCategory 
                                ? 'bg-amber-400 text-white cursor-not-allowed opacity-80' 
                                : 'bg-amber-500 hover:bg-amber-600 active:scale-97 text-white cursor-pointer hover:shadow-md'
                            }`}
                          >
                            {isSavingCategory ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Registering Category...</span>
                              </>
                            ) : (
                              <span>Register Category</span>
                            )}
                          </button>
                        </form>
                      </div>

                      {/* Listed Categories list (Right) */}
                      <div className="md:col-span-7 bg-white rounded-3xl border border-gray-150 p-5 md:p-6 shadow-sm flex flex-col justify-between">
                        <h4 className="font-sans font-bold text-sm text-gray-950 mb-4 pb-2 border-b">
                          Active Registered Food Classifications Categories
                        </h4>

                        <div className="divide-y divide-gray-100 flex-1">
                          {categories.filter(c => !c.isDeleted).map((c) => (
                            <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                              <div className="text-left space-y-0.5 max-w-sm">
                                <p className="font-bold text-gray-900 leading-tight">
                                  {c.nameEn} • <span className="font-medium text-gray-650">{c.nameBn}</span>
                                  {c.price !== undefined && c.price !== null && (
                                    <span className="text-amber-600 font-extrabold ml-2 bg-amber-50 px-1.5 py-0.5 rounded text-[10px]">
                                      ৳{c.price}
                                    </span>
                                  )}
                                </p>
                                <p className="text-[10px] text-gray-400 font-mono">Category ID: {c.id}</p>
                              </div>
                              <button
                                onClick={() => handleDeleteCategory(c.id)}
                                className="p-1 px-2.5 bg-rose-50 hover:bg-rose-100 rounded text-rose-600 font-semibold cursor-pointer active:scale-97 text-[10px]"
                              >
                                Revoke
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                  {adminTab === 'site_settings' && (
                    <AdminConfig
                      siteConfig={siteConfig}
                      onUpdateSiteConfig={handleUpdateSiteConfig}
                      permissions={activePermissions}
                    />
                  )}

                  {adminTab === 'permissions' && (
                    <AdminPermissions
                      admins={admins}
                      currentAdminEmail={loggedInAdmin.email}
                      onAddAdmin={handleAddAdmin}
                      onUpdateAdminPermissions={handleUpdateAdminPermissions}
                      onUpdateAdminRole={handleUpdateAdminRole}
                      onDeleteAdmin={handleDeleteAdmin}
                      isSuperAdmin={adminProfile?.role === 'super_admin'}
                    />
                  )}

                  {adminTab === 'logs' && (
                    <AdminLogs logs={activityLogs} />
                  )}

                  {adminTab === 'coupons' && (
                    <AdminCoupons
                      coupons={coupons}
                      menuItems={menuItems}
                      orders={orders}
                      onCreateCoupon={handleCreateCoupon}
                      onUpdateCoupon={handleUpdateCoupon}
                      onDeleteCoupon={handleDeleteCoupon}
                      permissions={activePermissions}
                    />
                  )}

                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* --- FLOATING SECURE SLIDE-OVER BASKET AND CHECKOUT --- */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-gray-900 z-50 backdrop-blur-[2px]"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col justify-between overflow-y-auto"
            >
              
              {/* Box Header */}
              <div className="p-4 md:p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/10">
                <div className="flex items-center gap-2 text-left">
                  <div className="w-10 h-10 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-sm md:text-base text-gray-950 leading-tight">
                      {t('cartTitle')}
                    </h4>
                    <span className="text-[10px] text-gray-400 font-bold block mt-0.5 uppercase tracking-widest leading-none">
                      {cartItems.length} {t('itemsCount')} Selected
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-950 flex items-center justify-center p-1.5 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Items Area */}
              <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
                
                {cartItems.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center text-gray-400 select-none space-y-2">
                    <ShoppingBag className="w-12 h-12 text-gray-300 stroke-[1.5]" />
                    <p className="text-xs md:text-sm">{t('cartIsEmpty')}</p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="px-4 py-2 text-xs font-semibold bg-gray-105 border border-gray-200 hover:border-gray-350 text-gray-700 rounded-xl cursor-pointer mt-2"
                    >
                      {language === 'bn' ? 'মেনু থেকে খাবার যোগ করুন' : 'Explore listed menus'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cartItems.map((ci) => {
                      const itemTotal = (ci.menuItem.discountedPrice !== undefined && ci.menuItem.discountedPrice < ci.menuItem.regularPrice 
                        ? ci.menuItem.discountedPrice 
                        : ci.menuItem.regularPrice) * ci.quantity;

                      return (
                        <div key={ci.menuItem.id} className="flex gap-3 bg-gray-50/50 hover:bg-gray-50/80 p-3 rounded-2xl border border-gray-100 items-center justify-between text-left transition-colors">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-150">
                            <img src={ci.menuItem.image} alt={ci.menuItem.nameEn} className="w-full h-full object-cover" />
                          </div>
                          
                          <div className="flex-1 min-w-0 pr-2 space-y-0.5">
                            <h5 className="font-bold text-xs text-gray-900 truncate">
                              {language === 'bn' ? ci.menuItem.nameBn : ci.menuItem.nameEn}
                            </h5>
                            <p className="text-[10px] text-gray-500 font-mono">
                              ৳{ci.menuItem.discountedPrice !== undefined ? ci.menuItem.discountedPrice : ci.menuItem.regularPrice} / dish
                            </p>
                          </div>

                          {/* Quantities slider adjustment */}
                          <div className="flex items-center gap-2 border bg-white rounded-lg p-1 shrink-0">
                            <button
                              onClick={() => updateQuantity(ci.menuItem.id, ci.quantity - 1)}
                              className="px-2 py-0.5 text-xs text-gray-400 hover:text-gray-900 font-bold hover:bg-gray-50 rounded"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold font-mono px-1">{ci.quantity}</span>
                            <button
                              onClick={() => updateQuantity(ci.menuItem.id, ci.quantity + 1)}
                              className="px-2 py-0.5 text-xs text-gray-400 hover:text-gray-900 font-bold hover:bg-gray-50 rounded"
                            >
                              +
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Secure Customer Particulars Submission Billing */}
                {cartItems.length > 0 && (
                  <form id="checkout-form" onSubmit={handleSubmitOrder} className="border-t border-gray-100 pt-6 space-y-4 text-xs text-left">
                    
                    <div>
                      <h4 className="font-sans font-bold text-xs text-gray-950 uppercase tracking-wider flex items-center gap-1">
                        <span>📋 Deliver To Information Details</span>
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">All details must connect to valid Bangladeshi locations.</p>
                    </div>

                    <div className="space-y-3">
                      {/* Name */}
                      <div className="space-y-1">
                        <label className="font-bold text-gray-750">{t('fullName')} *</label>
                        <input
                          type="text"
                          required
                          placeholder={t('fullNamePlaceholder')}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-1">
                        <label className="font-bold text-gray-750">{t('phone')} *</label>
                        <input
                          type="tel"
                          required
                          pattern="^(01)[3-9][0-9]{8}$"
                          placeholder={t('phonePlaceholder')}
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold font-mono"
                        />
                        <span className="text-[9px] text-gray-450 block mt-0.5">Must be a valid 11-digit Bangladeshi mobile number.</span>
                      </div>

                      {/* Area/Shipping Cost selector */}
                      <div className="space-y-1">
                        <label className="font-bold text-gray-750">{language === 'bn' ? 'আবাসিক অঞ্চল নির্ধারণ করুন *' : 'Select Delivery Zone *'}</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setShippingArea('inside')}
                            className={`p-2.5 border rounded-xl font-bold cursor-pointer transition-all text-xs ${
                              shippingArea === 'inside'
                                ? 'border-amber-500 bg-amber-50/20 text-amber-700'
                                : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                            }`}
                          >
                            {t('insideDhaka')} (৳{siteConfig?.deliveryChargeInside || 60} Tk)
                          </button>
                          <button
                            type="button"
                            onClick={() => setShippingArea('outside')}
                            className={`p-2.5 border rounded-xl font-bold cursor-pointer transition-all text-xs ${
                              shippingArea === 'outside'
                                ? 'border-amber-500 bg-amber-50/20 text-amber-700'
                                : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                            }`}
                          >
                            {t('outsideDhaka')} (৳{siteConfig?.deliveryChargeOutside || 120} Tk)
                          </button>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="space-y-1">
                        <label className="font-bold text-gray-750">{t('address')} *</label>
                        <textarea
                          required
                          rows={2}
                          placeholder={t('addressPlaceholder')}
                          value={fullAddress}
                          onChange={(e) => setFullAddress(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      {/* Payment selection - CoD vs bKash */}
                      <div className="space-y-1 pt-1">
                        <label className="font-bold text-gray-750">{t('paymentTitle')} *</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setPayMethod('Cash on Delivery')}
                            className={`p-2.5 border rounded-xl font-bold cursor-pointer transition-all text-[10px] sm:text-xs leading-tight ${
                              payMethod === 'Cash on Delivery'
                                ? 'border-amber-500 bg-amber-50/20 text-amber-700'
                                : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                            }`}
                          >
                            {language === 'bn' ? 'ক্যাশ অন ডেলিভারি (COD)' : 'Cash on Delivery (COD)'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPayMethod('bKash')}
                            className={`p-2.5 border rounded-xl font-bold cursor-pointer transition-all text-[10px] sm:text-xs leading-tight ${
                              payMethod === 'bKash'
                                ? 'border-amber-500 bg-amber-50/20 text-amber-700'
                                : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                            }`}
                          >
                            {language === 'bn' ? 'বিকাশ ইনস্ট্যান্ট পেমেন্ট' : 'bKash Instant Payment'}
                          </button>
                        </div>
                      </div>

                      {/* Coupon / Discount section */}
                      <div className="space-y-3 pt-2 pb-1 border-t border-b border-gray-100 my-2 text-xs">
                        {/* Checkbox to reveal Coupon input */}
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="hasCouponInputCheck"
                            checked={hasCouponChecked}
                            onChange={(e) => {
                              setHasCouponChecked(e.target.checked);
                              if (!e.target.checked) {
                                // Reset coupon when unchecked
                                setCouponInput('');
                                setAppliedCoupon('');
                                setIsCouponApplied(false);
                                setAppliedDiscount(0);
                                setCouponMessage('');
                              }
                            }}
                            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-300 cursor-pointer"
                          />
                          <label htmlFor="hasCouponInputCheck" className="font-bold text-gray-750 select-none cursor-pointer text-xs">
                            {language === 'bn' ? 'আপনার কি কোনো প্রোমো কোড বা কুপন আছে?' : 'Do you have a coupon/promo code?'}
                          </label>
                        </div>

                        {/* Interactive Coupon and Read-only Discount field container */}
                        <div className="grid grid-cols-2 gap-3.5">
                          {/* Coupon Code input - initially disabled based on checkbox */}
                          <div className="space-y-1 text-left">
                            <label className="font-bold text-gray-750 block text-[11px]">
                              {language === 'bn' ? 'কুপন কোড (টাইপ করুন)' : 'Coupon Code (Type here)'}
                            </label>
                            <div className="flex gap-1">
                              <input
                                type="text"
                                disabled={!hasCouponChecked || isCouponApplied}
                                placeholder="e.g. RAHI20"
                                value={couponInput}
                                onChange={(e) => setCouponInput(e.target.value)}
                                className={`w-full p-2 text-xs rounded-lg border font-bold font-mono text-center focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase ${
                                  !hasCouponChecked 
                                    ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                                    : isCouponApplied 
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                      : 'bg-white text-gray-800 border-gray-200'
                                }`}
                              />
                              {hasCouponChecked && (
                                isCouponApplied ? (
                                  <button
                                    type="button"
                                    onClick={handleRemoveCoupon}
                                    className="px-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                                  >
                                    Reset
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={handleApplyCoupon}
                                    className="px-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                                  >
                                    Apply
                                  </button>
                                )
                              )}
                            </div>
                          </div>

                          {/* Calculated Discount Price Field (Read-only / Always Disabled to prevent hacking) */}
                          <div className="space-y-1 text-left">
                            <label className="font-bold text-gray-750 block text-[11px]">
                              {language === 'bn' ? 'মূল্যছাড় / ডিসকাউন্ট (টাকা)' : 'Discount Value (BDT)'}
                            </label>
                            <input
                              type="text"
                              disabled
                              value={appliedDiscount > 0 ? `৳${appliedDiscount}` : '৳0'}
                              className="w-full p-2 text-xs rounded-lg border font-bold font-mono text-center bg-gray-50 text-amber-600 border-gray-200 cursor-not-allowed"
                            />
                          </div>
                        </div>

                        {/* List of active provided valid coupons info when checked */}
                        {hasCouponChecked && (
                          <div className="space-y-1 text-left bg-gray-50 p-2.5 rounded-xl border border-gray-150">
                            <p className="font-bold text-[10px] text-gray-500">Available Coupons:</p>
                            <div className="grid grid-cols-2 gap-1 text-[9px] font-semibold text-gray-600 font-mono">
                              <div>• <span className="text-amber-600 font-extrabold">RAHI20</span> (20% Off)</div>
                              <div>• <span className="text-amber-600 font-extrabold">MEZBAN50</span> (৳50 Off)</div>
                              <div>• <span className="text-amber-600 font-extrabold">WELCOM100</span> (৳100 Off)</div>
                              <div>• <span className="text-amber-600 font-extrabold">FREE60</span> (৳60 Off)</div>
                            </div>
                            {couponMessage && (
                              <p className={`text-[10px] font-bold pt-1 border-t border-dashed border-gray-200 ${
                                isCouponApplied ? 'text-emerald-600' : 'text-rose-500'
                              }`}>
                                {couponMessage}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* bKash Payment Box instructions display when Cash on Delivery is selected since advance delivery charge is mandatory for both */}
                      <div className="border border-amber-200/50 bg-amber-50/20 p-4 rounded-2xl space-y-4">
                        
                        <div className="flex items-center gap-2 text-amber-900 border-b border-amber-200/40 pb-2">
                          <Smartphone className="w-5 h-5 text-amber-600 shrink-0" />
                          <div>
                            <p className="font-bold font-sans text-xs">{t('instructionTitle')}</p>
                            <span className="text-[10px] text-amber-750 font-medium">
                              {language === 'bn' ? 'অগ্রিম ডেলিভারি চার্জ বিকাশ করা বাধ্যতামূলক' : 'Advance delivery charge must be paid via bKash'}
                            </span>
                          </div>
                        </div>

                        {/* Instructions steps in Bangla */}
                        <div className="space-y-1.5 text-[11px] text-gray-650 leading-relaxed text-left">
                          <p>{t('instructionStep1')}</p>
                          <p className="bg-amber-100 font-bold px-2 py-0.5 rounded text-amber-900 inline-block text-xs font-mono select-all">
                            bKash No: {siteConfig?.bKashNumber || defaultSiteConfig.bKashNumber}
                          </p>
                          <p>{t('instructionStep2')}</p>
                          <p>{t('instructionStep3')}</p>
                        </div>

                        {/* Optional bKash QR code rendering */}
                        {siteConfig?.bKashQrUrl && (
                          <div className="flex items-center justify-center p-2 bg-white rounded-xl border border-gray-100 w-28 mx-auto max-w-full">
                            <img 
                              src={siteConfig.bKashQrUrl} 
                              alt="bKash QR code scanner" 
                              className="w-24 h-24 object-contain"
                            />
                          </div>
                        )}

                        {/* Mandatory bKash Sender and Txn ID Inputs */}
                        <div className="grid sm:grid-cols-2 gap-3.5 pt-2 border-t border-amber-200/40">
                          
                          <div className="space-y-1 text-left">
                            <label className="font-bold text-gray-750 flex items-center gap-1">
                              <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                              <span>{t('transactionLabel')} *</span>
                            </label>
                            <input
                              type="tel"
                              required
                              placeholder="e.g. 017xxxxxxxx"
                              value={bkashPhone}
                              onChange={(e) => setBkashPhone(e.target.value)}
                              className="w-full p-2 bg-white rounded-lg border border-gray-251 focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold font-mono text-center"
                            />
                          </div>

                          <div className="space-y-1 text-left">
                            <label className="font-bold text-gray-750 flex items-center gap-1">
                              <QrCode className="w-3.5 h-3.5 text-amber-600" />
                              <span>{t('txnIdLabel')} *</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. BKA4X12903"
                              value={bkashTxnId}
                              onChange={(e) => setBkashTxnId(e.target.value)}
                              className="w-full p-2 bg-white rounded-lg border border-gray-251 focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold font-mono text-center select-all uppercase"
                            />
                          </div>

                        </div>

                      </div>

                    </div>

                  </form>
                )}

              </div>

              {/* Bottom Surcharges totals calculation and placement CTA */}
              {cartItems.length > 0 && (
                <div className="p-4 md:p-6 bg-white border-t border-gray-100 space-y-4">
                  <div className="space-y-2 text-xs md:text-sm text-gray-650 text-left">
                    <div className="flex justify-between">
                      <span>{t('subtotal')}:</span>
                      <span className="font-bold text-gray-950">৳{cartTotal}</span>
                    </div>
                    {appliedDiscount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>{language === 'bn' ? 'কুপন মূল্যছাড়:' : 'Coupon Discount:'}</span>
                        <span className="font-bold">-৳{appliedDiscount}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>{t('deliveryCharge')}:</span>
                      <span className="font-bold text-gray-950">৳{deliveryCostForCheckout}</span>
                    </div>
                    <div className="flex justify-between text-base font-black text-gray-950 border-t border-gray-100 pt-2">
                      <span>{t('total')}:</span>
                      <span className="text-amber-600">৳{Math.max(0, cartTotal + deliveryCostForCheckout - appliedDiscount)}</span>
                    </div>
                  </div>

                   <button
                    type="submit"
                    form="checkout-form"
                    disabled={isPlacingOrder}
                    className={`w-full py-3.5 px-4 font-extrabold rounded-2xl shadow-lg text-xs sm:text-sm transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                      isPlacingOrder 
                        ? 'bg-amber-400 text-white cursor-not-allowed opacity-80' 
                        : 'bg-amber-500 hover:bg-amber-600 active:scale-97 text-white shadow-amber-500/20'
                    }`}
                  >
                    {isPlacingOrder ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{language === 'bn' ? 'অর্ডার প্রসেস হচ্ছে...' : 'Placing Order...'}</span>
                      </>
                    ) : (
                      <>
                        <span>{t('submitOrder')}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer message */}
      <footer id="site_footer" className="bg-gray-950 text-white py-10 text-xs md:text-sm border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid sm:grid-cols-12 gap-8 text-left">
          
          <div className="sm:col-span-5 space-y-3.5">
            <h4 className="font-sans font-black text-base text-amber-500">{t('appName')}</h4>
            <p className="text-gray-400 leading-relaxed text-xs">
              ১০০% ঘরোয়া ও প্রাকৃতিক উপাদানে সম্পূর্ণ পরিষ্কার পরিবেশে তৈরি মায়ের হাতের স্বাদে স্বাস্থ্যকর খাবারের নির্ভরযোগ্য ঠিকানা।
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-white/10 text-gray-300 font-bold px-2 py-0.5 rounded-full">Spark Plan</span>
              <span className="text-[10px] text-gray-400 font-mono">Server Native v1.1.2</span>
            </div>
          </div>

          <div className="sm:col-span-3 space-y-2 text-xs">
            <h5 className="font-bold text-white text-[11px] uppercase tracking-widest text-amber-400">খাবারের ধরণসমূহ</h5>
            <div className="space-y-1.5 flex flex-col pt-1">
              {categories.slice(0, 4).map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveCategory(c.id);
                    setActiveView('home');
                    document.getElementById('catalog_section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer text-left focus:outline-none"
                >
                  • {language === 'bn' ? c.nameBn : c.nameEn}
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-4 space-y-3">
            <h5 className="font-bold text-white text-[11px] uppercase tracking-widest text-amber-400 font-mono">Customer Assistance</h5>
            <p className="text-gray-400 text-xs leading-relaxed">
              যেকোনো প্রয়োজনে আমাদের সরাসরি কল করুন অথবা নিচের লিংকে হোয়াটসঅ্যাপে নক দিন।
            </p>
            
            {/* Live WhatsApp integration float button */}
            {siteConfig?.whatsappNumber && (
              <a
                href={`https://wa.me/${siteConfig.whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 p-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-lg transition-transform hover:scale-103 cursor-pointer"
              >
                <span>💬 WhatsApp Hotline Direct Chat</span>
              </a>
            )}
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-8 mt-8 border-t border-white/5 text-center text-[10px] text-gray-500 space-y-1">
          <p>© 2026 {t('appName')} Homemade Food Delivery Services. All Rights Reserved.</p>
          <p>Handcrafted under Zero-Trust billing paradigms with full bKash authorization checks. Done by AI Studio build.</p>
        </div>
      </footer>

      {/* Sticky, Floating Premium WhatsApp Icon on the bottom right corner */}
      <div className="fixed bottom-6 right-6 z-55 flex flex-col items-end gap-3 pointer-events-auto">
        <a
          href={`https://wa.me/88019999333643`}
          target="_blank"
          rel="noopener noreferrer"
          title={language === 'bn' ? 'হোয়াটসঅ্যাপে সরাসরি মেসেজ দিন' : 'Order directly on WhatsApp'}
          className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-650 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 border border-emerald-400/20 cursor-pointer transition-all hover:rotate-6 self-end"
          id="sticky_whatsapp_button"
        >
          <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
            <path d="M12.031 2C6.177 2 1.423 6.748 1.419 12.598a10.516 10.516 0 0 0 1.402 5.274L1 23l5.282-1.385a10.514 10.514 0 0 0 5.178 1.341h.005c5.854 0 10.608-4.749 10.612-10.599A10.53 10.53 0 0 0 12.031 2zm5.814 14.65c-.32.9-1.854 1.748-2.551 1.849-.6.087-1.393.161-2.22-.1-.663-.109-1.52-.366-2.585-.828-4.529-1.954-7.46-6.551-7.687-6.853-.226-.302-1.848-2.454-1.848-4.68 0-2.227 1.169-3.322 1.584-3.774.414-.452.904-.565 1.205-.565.3 0 .602.003.865.016.27.013.633-.103.99.754.368.874 1.258 3.064 1.365 3.284.107.22.179.477.033.77-.146.292-.22.427-.439.683-.22.254-.46.565-.658.758-.217.21-.447.44-.192.877.255.438 1.134 1.861 2.433 3.018 1.674 1.492 3.082 1.954 3.515 2.135.433.18.694.15.952-.148.257-.298 1.111-1.29 1.411-1.733.302-.442.602-.369 1.017-.215.414.153 2.623 1.236 3.075 1.462.452.227.753.339.866.533.113.195.113 1.13-.207 2.03z"/>
          </svg>
        </a>
      </div>

      {/* Dynamic Social Trust / Active Urgency Ticket on the bottom left corner */}
      <AnimatePresence>
        {showTicker && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 35, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="fixed bottom-6 left-6 z-55 max-w-sm w-[88vw] md:w-[350px] bg-white border border-amber-500/20 p-3 px-4 rounded-2xl shadow-xl shadow-amber-950/5 flex items-center gap-3 backdrop-blur-md bg-white/95"
            id="live_social_ticker"
          >
            <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 border border-amber-100 font-bold text-sm">
              🔥
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[9px] text-amber-600 font-extrabold uppercase tracking-widest mb-0.5 font-sans flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                {language === 'bn' ? 'সবশেষ অর্ডার হয়েছে' : 'LATEST PLACED ORDER'}
              </p>
              <p className="text-[11px] font-extrabold text-gray-900 truncate leading-tight">
                {language === 'bn' 
                  ? `${liveTickers[currentTickerIdx].nameBn}, ${liveTickers[currentTickerIdx].areaBn} থেকে (${liveTickers[currentTickerIdx].timeBn})` 
                  : `${liveTickers[currentTickerIdx].nameEn} from ${liveTickers[currentTickerIdx].areaEn} (${liveTickers[currentTickerIdx].timeEn})`}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5 truncate font-medium">
                {language === 'bn'
                  ? `আইটেম: ${liveTickers[currentTickerIdx].itemBn}`
                  : `Item: ${liveTickers[currentTickerIdx].itemEn}`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function App() {
  return (
    <LocalizationProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </LocalizationProvider>
  );
}
