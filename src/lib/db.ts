import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  getDocFromServer
} from 'firebase/firestore';
import { db, isFirebaseConfigured, auth } from './firebase';
import { 
  Category, 
  MenuItem, 
  Order, 
  SiteConfig, 
  ActivityLog, 
  Admin, 
  OrderStatus,
  AdminRole,
  ActivityType,
  Coupon
} from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore SEC_RULE Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- SEED CONTEXTS FOR HOMEPAGE POPULATION ---

const defaultCategories: Category[] = [
  { id: 'cat-main', nameBn: 'ঐতিহ্যবাহী চাটগাঁইয়া খাবার', nameEn: 'Chattogram Traditional', descriptionBn: 'খাঁটি চাটগাঁইয়া মশলায় তৈরি সুস্বাদু মেজবানি মাংস, বুটের ডাল ও আখনি বিরিয়ানি।', descriptionEn: 'Authentic Chittagong Mezban beef, Chonar Dal, and special Akhni.' },
  { id: 'cat-snacks', nameBn: 'বিকালের মচমচে নাস্তা', nameEn: 'Evening Snacks', descriptionBn: 'রাহিস কিচেনের স্পেশাল গরম গরম সিঙ্গাড়া, সমোসা ও ঘরোয়া সুস্বাদু সস চাটনি।', descriptionEn: 'Flaky and crispy tea-time mouthwatering snacks prepared fresh daily.' },
  { id: 'cat-pickles', nameBn: 'জিভে জল আনা ঘরোয়া আচার', nameEn: 'Handcrafted Pickles', descriptionBn: 'খাঁটি সরিষার তেলে রোদে শুকানো মজাদার আমের কাশ্মীরি মিষ্টি আচার।', descriptionEn: 'Premium homemade pickles marinated in authentic local organic ingredients.' },
  { id: 'cat-dessert', nameBn: 'ঐতিহ্যবাহী মিষ্টিমুখ ও পিঠা', nameEn: 'Traditional Sweets & Pitha', descriptionBn: 'চাটগাঁইয়া নারিকেলের রসের পিঠা ও স্পেশাল শাহী জাফরান ফিরনি।', descriptionEn: 'Sweet regional delicacies, coconut cream milk pitha, and saffron firm puddings.' }
];

const defaultMenuItems: MenuItem[] = [
  { 
    id: 'food-beef-mezban', 
    nameBn: 'ঐতিহ্যবাহী চাটগাঁইয়া মেজবানি গরুর মাংস', 
    nameEn: 'Traditional Chattogram Mezban Beef', 
    descriptionBn: 'লাল মরিচ, মেজবানি সিক্রেট হাড়ি-মশলা ও খাঁটি সরিষার তেলে কসিয়ে রান্না করা অত্যন্ত সুস্বাদু ঝাল মেজবানি গরুর মাংস। খুলশী এলাকা স্পেশাল!', 
    descriptionEn: 'Melt-in-mouth beef cooked with authentic red chilies, mustard oil, and 24-blend secret Mezbani spices.',
    image: 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=800&auto=format&fit=crop&q=80', 
    regularPrice: 380, 
    discountedPrice: 320, 
    isAvailable: true, 
    categoryId: 'cat-main',
    createdAt: new Date().toISOString(),
    isMostlyOrdered: true
  },
  { 
    id: 'food-chonar-dal', 
    nameBn: 'ঐতিহ্যবাহী মেজবানি বুটের ডাল (চনার ডাল)', 
    nameEn: 'Classic Mezbani Chonar Dal', 
    descriptionBn: 'খাসির কচি মেদ বা গরুর চর্বিযুক্ত মাংস, বুটের ডাল ও মেজবানি স্পেশাল সুগন্ধি মশলায় তৈরি মনকারা চনার ডাল। খুলশী ও জিইসির সেরা রেসিপি!', 
    descriptionEn: 'Slow-cooked split Bengal gram enriched with tender beef fat, bone marrow, and local spices.',
    image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=800&auto=format&fit=crop&q=80', 
    regularPrice: 150, 
    discountedPrice: 120, 
    isAvailable: true, 
    categoryId: 'cat-main',
    createdAt: new Date().toISOString()
  },
  { 
    id: 'food-beef-akhni', 
    nameBn: 'চাটগাঁইয়া বিফ আখনি বিরিয়ানি', 
    nameEn: 'Chattogram Beef Akhni Biryani', 
    descriptionBn: 'চট্টগ্রামের ঐতিহ্যবাহী কালাই সুগন্ধি চিনিগুঁড়া চাল, নরম রসালো গরুর কষা মাংস এবং দমে রান্না করা সুস্বাদু খাঁটি আখনি বিরিয়ানি।', 
    descriptionEn: 'Chinigura scented rice and premium beef cubes cooked with ginger, garlic, and special spices.',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80', 
    regularPrice: 290, 
    discountedPrice: 250, 
    isAvailable: true, 
    categoryId: 'cat-main',
    createdAt: new Date().toISOString()
  },
  { 
    id: 'food-loitta-shutki', 
    nameBn: 'ঝাল চাটগাঁইয়া লইট্টা শুঁটকি ভুনা', 
    nameEn: 'Ctg Extreme Spicy Loitta Shutki Bhuna', 
    descriptionBn: 'বিখ্যাত লইট্টা শুঁটকি, প্রচুর পেঁয়াজ কুচি, দেশি রশুন এবং চট্টগ্রামের ঝাল লাল মরিচে ভুনা করা অত্যন্ত জনপ্রিয় উপাদেয় হটেস্ট শুঁটকি!', 
    descriptionEn: 'Authentic local sun-dried Loitta fish bhuna cooked with generous garlic cloves and whole red chilies.',
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop&q=80', 
    regularPrice: 180, 
    discountedPrice: 145, 
    isAvailable: true, 
    categoryId: 'cat-main',
    createdAt: new Date().toISOString()
  },
  { 
    id: 'food-singara-rahis', 
    nameBn: 'রাহিস স্পেশাল মচমচে সিঙ্গাড়া (৫টি)', 
    nameEn: "Rahi's Crispy Singara (5 Pcs)", 
    descriptionBn: 'সম্পূর্ণ তাজা ও পরিষ্কার তেলে ভাজা আলু ও কলিজা ভরা কড়কড়ে গরম সিঙ্গাড়া, রাহিস কিচেনের মায়ের হাতের স্পেশাল ধনেপাতা চাটনির সাথে পরিবেশিত।', 
    descriptionEn: 'Super flaky triangles stuffed with seasoned potato hash and beef liver, served with fresh mint chutney.',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80', 
    regularPrice: 80, 
    discountedPrice: 65, 
    isAvailable: true, 
    categoryId: 'cat-snacks',
    createdAt: new Date().toISOString()
  },
  { 
    id: 'food-mango-kashmiri', 
    nameBn: 'আমের কাশ্মীরি মিষ্টি আচার (২৫০g)', 
    nameEn: 'Handmade Kashmiri Mango Pickle', 
    descriptionBn: 'রোদে শুকানো কাঁচা আম, খাঁটি সরিষার তেল, ভিনেগার এবং আদা কুচিতে রাহিস কিচেনের অতুলনীয় স্বাদের মিষ্টি মায়ের হাতের কাশ্মীরি আচার।', 
    descriptionEn: 'Sun-dried raw mango fingers cured with spicy ginger strips, pure mustard oil, and sugar syrup.',
    image: 'https://images.unsplash.com/photo-1605497746444-ac9dbd39f4a5?w=800&auto=format&fit=crop&q=80', 
    regularPrice: 195, 
    discountedPrice: 160, 
    isAvailable: true, 
    categoryId: 'cat-pickles',
    createdAt: new Date().toISOString()
  },
  { 
    id: 'food-rost-coconut-pitha', 
    nameBn: 'ঐতিহ্যবাহী নারিকেলের দুধে ভিজা চিতই পিঠা (৪ পিস)', 
    nameEn: 'Coconut Milk Dipped Traditional Pitha (4 Pcs)', 
    descriptionBn: 'গরম রসালো চিতই পিঠা, তরল নারিকেলের ঘন দুধ ও চট্টগ্রামের পাহাড়ি খাঁটি খেজুরের গুড়ে ভিজা অসাধারণ সুস্বাদু পিঠা।', 
    descriptionEn: 'Warm fluffy rice cakes soaked in sweet syrup infused with rich coconut milk and organic date palm jaggery.',
    image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800&auto=format&fit=crop&q=80', 
    regularPrice: 150, 
    discountedPrice: 115, 
    isAvailable: true, 
    categoryId: 'cat-dessert',
    createdAt: new Date().toISOString()
  },
  { 
    id: 'food-zafran-firni', 
    nameBn: 'রাহিস স্পেশাল কাশ্মীরি জাফরান ফিরনি', 
    nameEn: "Rahi's Royal Saffron Firni", 
    descriptionBn: 'ঘন খাঁটি গরুর দুধে সুগন্ধি চিনিগুঁড়া চালের কণা, আসল কাশ্মীরি জাফরান, এলাচ, কিসমিস ও পেস্তা বাদামের মিশেলে ঐতিহ্যবাহী জমানো ফিরনি।', 
    descriptionEn: 'Traditional condensed milk pudding slow-steamed with broken rice grains, pure saffron strands, and roasted pistachios.',
    image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800&auto=format&fit=crop&q=80', 
    regularPrice: 110, 
    discountedPrice: 90, 
    isAvailable: true, 
    categoryId: 'cat-dessert',
    createdAt: new Date().toISOString()
  }
];

const defaultSiteConfig: SiteConfig = {
  id: 'global',
  deliveryChargeInside: 50, // Inside Chittagong City
  deliveryChargeOutside: 100, // Outside Chittagong City
  bKashNumber: '01815-562912',
  bKashQrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=01815562912',
  bannerBn: 'হাতে তৈরি খাঁটি মেজবানি মাংস ও ঐতিহ্যবাহী চাটগাঁইয়া স্বাদের খাবারের নির্ভরযোগ্য কিচেন "রাহিস কিচেন"!',
  bannerEn: "Rahi's Kitchen: Authentic home-cooked Chittagong Mezban & Traditional Delicacies!",
  whatsappNumber: '8801815562912'
};

const defaultAdmins: Admin[] = [
  {
    uid: 'system-boot',
    email: 'edutechsa55@gmail.com',
    role: 'super_admin',
    permissions: ['manage_menu', 'manage_categories', 'manage_orders', 'manage_site_config'],
    isDeleted: false
  }
];

const defaultCoupons: Coupon[] = [
  {
    id: 'RAHI20',
    offerName: '20% Special Discount Offer',
    discountType: 'percentage',
    discountValue: 20,
    isActive: true,
    applicability: 'all'
  },
  {
    id: 'MEZBAN50',
    offerName: 'মেহমানদারী ৫০ টাকা অফার',
    discountType: 'fixed',
    discountValue: 50,
    isActive: true,
    applicability: 'all'
  },
  {
    id: 'WELCOME100',
    offerName: 'শাহী স্বাগতম অফার',
    discountType: 'fixed',
    discountValue: 100,
    isActive: true,
    applicability: 'all'
  },
  {
    id: 'FREE60',
    offerName: 'স্পেশাল ৬১ টাকা ক্যাশব্যাক',
    discountType: 'fixed',
    discountValue: 60,
    isActive: true,
    applicability: 'all'
  }
];

// Helper to initialize local storage with seeds if empty
function initializeLocalStorage() {
  if (typeof window !== 'undefined') {
    // If h_menu_items doesn't exist OR has the old model 'food-beef-kacchi', we clear and force-reseed
    const currentItems = localStorage.getItem('h_menu_items');
    const hasOldItems = currentItems && (
      currentItems.includes('food-beef-kacchi') || 
      !currentItems.includes('food-beef-mezban') || 
      !currentItems.includes('isMostlyOrdered')
    );
    
    if (!localStorage.getItem('h_categories') || hasOldItems) {
      localStorage.setItem('h_categories', JSON.stringify(defaultCategories));
    }
    if (!localStorage.getItem('h_menu_items') || hasOldItems) {
      localStorage.setItem('h_menu_items', JSON.stringify(defaultMenuItems));
    }
    if (!localStorage.getItem('h_site_config') || hasOldItems) {
      localStorage.setItem('h_site_config', JSON.stringify(defaultSiteConfig));
    }
    if (!localStorage.getItem('h_admins')) {
      localStorage.setItem('h_admins', JSON.stringify(defaultAdmins));
    }
    if (!localStorage.getItem('h_orders')) {
      localStorage.setItem('h_orders', JSON.stringify([]));
    }
    if (!localStorage.getItem('h_activity_logs')) {
      localStorage.setItem('h_activity_logs', JSON.stringify([]));
    }
    if (!localStorage.getItem('h_coupons')) {
      localStorage.setItem('h_coupons', JSON.stringify(defaultCoupons));
    }
  }
}

// Initial Call
initializeLocalStorage();

export const dbService = {
  // --- CATEGORIES PORTFOLIO ---
  async getCategories(): Promise<Category[]> {
    const storageKeys = localStorage.getItem('h_categories');
    const items: Category[] = storageKeys ? JSON.parse(storageKeys) : defaultCategories;
    const localFiltered = items.filter(item => !item.isDeleted);

    if (isFirebaseConfigured && db) {
      // Background async update to keep browser client refreshed without blocking UI thread
      getDocs(collection(db, 'categories'))
        .then((snap) => {
          const list = snap.docs.map(d => d.data() as Category);
          const mergedList = [...list];
          const dbIds = new Set(list.map(x => x.id));
          for (const local of items) {
            if (!dbIds.has(local.id)) {
              mergedList.push(local);
            }
          }
          localStorage.setItem('h_categories', JSON.stringify(mergedList));
        })
        .catch((err) => {
          console.warn('Background categories sync failed:', err);
        });
    }

    return localFiltered;
  },

  async createCategory(category: Category): Promise<void> {
    // Write and persist to local storage first
    const categories = await this.getCategories();
    categories.push(category);
    localStorage.setItem('h_categories', JSON.stringify(categories));

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'categories', category.id), category);
      } catch (err) {
        console.warn('Firestore createCategory failed, kept local copy:', err);
      }
    }
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
    // Write and persist to local storage first
    const items = await this.getCategories();
    const updated = items.map(item => item.id === id ? { ...item, ...updates } : item);
    localStorage.setItem('h_categories', JSON.stringify(updated));

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'categories', id), updates as any);
      } catch (err) {
        console.warn('Firestore updateCategory failed, kept local copy:', err);
      }
    }
  },

  async deleteCategory(id: string): Promise<void> {
    await this.updateCategory(id, { isDeleted: true });
  },

  // --- MENU ITEMS PORTFOLIO ---
  async getMenuItems(): Promise<MenuItem[]> {
    const storageKeys = localStorage.getItem('h_menu_items');
    const items: MenuItem[] = storageKeys ? JSON.parse(storageKeys) : defaultMenuItems;
    const localFiltered = items.filter(item => !item.isDeleted);

    if (isFirebaseConfigured && db) {
      // Background async update to keep browser client refreshed without blocking UI thread
      getDocs(collection(db, 'menuItems'))
        .then((snap) => {
          const list = snap.docs.map(d => d.data() as MenuItem);
          const mergedList = [...list];
          const dbIds = new Set(list.map(x => x.id));
          for (const local of items) {
            if (!dbIds.has(local.id)) {
              mergedList.push(local);
            }
          }
          localStorage.setItem('h_menu_items', JSON.stringify(mergedList));
        })
        .catch((err) => {
          console.warn('Background menuItems sync failed:', err);
        });
    }

    return localFiltered;
  },

  async createMenuItem(item: MenuItem): Promise<void> {
    const items = await this.getMenuItems();
    items.push(item);
    localStorage.setItem('h_menu_items', JSON.stringify(items));

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'menuItems', item.id), item);
      } catch (err) {
        console.warn('Firestore createMenuItem failed, kept local copy:', err);
      }
    }
  },

  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<void> {
    const items = await this.getMenuItems();
    const updated = items.map(item => item.id === id ? { ...item, ...updates } : item);
    localStorage.setItem('h_menu_items', JSON.stringify(updated));

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'menuItems', id), updates as any);
      } catch (err) {
        console.warn('Firestore updateMenuItem failed, kept local copy:', err);
      }
    }
  },

  async deleteMenuItem(id: string): Promise<void> {
    await this.updateMenuItem(id, { isDeleted: true });
  },

  // --- ORDER TRANSACTIONS ---
  async getOrders(): Promise<Order[]> {
    let list: Order[] | null = null;
    if (isFirebaseConfigured && db && auth?.currentUser) {
      try {
        const snap = await getDocs(collection(db, 'orders'));
        list = snap.docs.map(d => d.data() as Order);
      } catch (err) {
        console.warn('Firestore getOrders failed, using fallback:', err);
      }
    }
    const storageKeys = localStorage.getItem('h_orders');
    const items: Order[] = storageKeys ? JSON.parse(storageKeys) : [];
    if (list) {
      const mergedList = [...list];
      const dbIds = new Set(list.map(x => x.id));
      for (const local of items) {
        if (!dbIds.has(local.id)) {
          mergedList.push(local);
        }
      }
      localStorage.setItem('h_orders', JSON.stringify(mergedList));
      return mergedList.filter(item => !item.isDeleted).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return items.filter(item => !item.isDeleted).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getOrderById(id: string): Promise<Order | null> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'orders', id);
        const snap = await getDocFromServer(docRef);
        if (snap.exists()) {
          const item = snap.data() as Order;
          return item.isDeleted ? null : item;
        }
      } catch (err) {
        console.warn('Firestore getOrderById failed, searching locally:', err);
      }
    }
    const storageKeys = localStorage.getItem('h_orders');
    const items: Order[] = storageKeys ? JSON.parse(storageKeys) : [];
    return items.find(item => item.id.toLowerCase() === id.toLowerCase() && !item.isDeleted) || null;
  },

  async createOrder(order: Order): Promise<void> {
    // Write and persist to local storage FIRST (completely synchronous and failure-proof)
    const storageKeys = localStorage.getItem('h_orders');
    const items: Order[] = storageKeys ? JSON.parse(storageKeys) : [];
    items.push(order);
    localStorage.setItem('h_orders', JSON.stringify(items));
    
    // Store phone numbers separately in customer collection if wanted
    const customers = JSON.parse(localStorage.getItem('h_unique_customers') || '[]');
    if (!customers.includes(order.phoneNumber)) {
      customers.push(order.phoneNumber);
      localStorage.setItem('h_unique_customers', JSON.stringify(customers));
    }

    if (isFirebaseConfigured && db) {
      // Fire-and-forget background transaction, ensuring the guest checkout experiences zero UI delay
      setDoc(doc(db, 'orders', order.id), order)
        .then(() => {
          console.log(`Order ${order.id} successfully synchronized to cloud Firestore.`);
        })
        .catch((err) => {
          console.warn(`Firestore upload failed for order ${order.id}, stored locally:`, err);
        });
    }
  },

  async updateOrder(id: string, updates: Partial<Order>): Promise<void> {
    const items = await this.getOrders();
    const updated = items.map(item => item.id === id ? { ...item, ...updates } : item);
    localStorage.setItem('h_orders', JSON.stringify(updated));

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'orders', id), updates as any);
      } catch (err) {
        console.warn('Firestore updateOrder failed, kept local copy:', err);
      }
    }
  },

  async deleteOrder(id: string): Promise<void> {
    await this.updateOrder(id, { isDeleted: true });
  },

  // --- ADMINISTRATORS AND OPERATORS ---
  async getAdmins(): Promise<Admin[]> {
    let list: Admin[] | null = null;
    if (isFirebaseConfigured && db && auth?.currentUser) {
      try {
        const snap = await getDocs(collection(db, 'admins'));
        list = snap.docs.map(d => d.data() as Admin);
      } catch (err) {
        console.warn('Firestore getAdmins failed, using fallback:', err);
      }
    }
    const storageKeys = localStorage.getItem('h_admins');
    const items: Admin[] = storageKeys ? JSON.parse(storageKeys) : defaultAdmins;
    if (list) {
      const mergedList = [...list];
      const dbIds = new Set(list.map(x => x.uid));
      for (const local of items) {
        if (!dbIds.has(local.uid)) {
          mergedList.push(local);
        }
      }
      localStorage.setItem('h_admins', JSON.stringify(mergedList));
      return mergedList.filter(item => !item.isDeleted);
    }
    return items.filter(item => !item.isDeleted);
  },

  async createAdmin(admin: Admin): Promise<void> {
    const items = await this.getAdmins();
    items.push(admin);
    localStorage.setItem('h_admins', JSON.stringify(items));

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'admins', admin.uid), admin);
      } catch (err) {
        console.warn('Firestore createAdmin failed, kept local copy:', err);
      }
    }
  },

  async updateAdmin(uid: string, updates: Partial<Admin>): Promise<void> {
    const items = await this.getAdmins();
    const updated = items.map(item => item.uid === uid ? { ...item, ...updates } : item);
    localStorage.setItem('h_admins', JSON.stringify(updated));

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'admins', uid), updates as any);
      } catch (err) {
        console.warn('Firestore updateAdmin failed, kept local copy:', err);
      }
    }
  },

  async deleteAdmin(uid: string): Promise<void> {
    await this.updateAdmin(uid, { isDeleted: true });
  },

  // --- SITE CONFIGURATION MANAGEMENT ---
  async getSiteConfig(): Promise<SiteConfig> {
    const storageKeys = localStorage.getItem('h_site_config');
    const fallbackConf = storageKeys ? JSON.parse(storageKeys) : defaultSiteConfig;

    if (isFirebaseConfigured && db) {
      // Background async update to keep configs fresh silently
      getDoc(doc(db, 'siteConfig', 'global'))
        .then((snap) => {
          if (snap.exists()) {
            const conf = snap.data() as SiteConfig;
            localStorage.setItem('h_site_config', JSON.stringify(conf));
          } else {
            setDoc(doc(db, 'siteConfig', 'global'), defaultSiteConfig)
              .then(() => {
                localStorage.setItem('h_site_config', JSON.stringify(defaultSiteConfig));
              });
          }
        })
        .catch((err) => {
          console.warn('Background siteConfig sync failed:', err);
        });
    }

    return fallbackConf;
  },

  async updateSiteConfig(updates: Partial<SiteConfig>): Promise<void> {
    const current = await this.getSiteConfig();
    const merged = { ...current, ...updates };
    localStorage.setItem('h_site_config', JSON.stringify(merged));

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'siteConfig', 'global'), merged, { merge: true });
      } catch (err) {
        console.warn('Firestore updateSiteConfig failed, kept local copy:', err);
      }
    }
  },

  // --- AUDITING TRAIL LOGS ---
  async getActivityLogs(): Promise<ActivityLog[]> {
    let list: ActivityLog[] | null = null;
    if (isFirebaseConfigured && db && auth?.currentUser) {
      try {
        const snap = await getDocs(collection(db, 'activityLogs'));
        list = snap.docs.map(d => d.data() as ActivityLog);
      } catch (err) {
        console.warn('Firestore getActivityLogs failed, using fallback:', err);
      }
    }
    const storageKeys = localStorage.getItem('h_activity_logs');
    const items: ActivityLog[] = storageKeys ? JSON.parse(storageKeys) : [];
    if (list) {
      const mergedList = [...list];
      const dbIds = new Set(list.map(x => x.id));
      for (const local of items) {
        if (!dbIds.has(local.id)) {
          mergedList.push(local);
        }
      }
      localStorage.setItem('h_activity_logs', JSON.stringify(mergedList));
      return mergedList.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return items.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async addActivityLog(log: ActivityLog): Promise<void> {
    const items = await this.getActivityLogs();
    items.unshift(log);
    localStorage.setItem('h_activity_logs', JSON.stringify(items));

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'activityLogs', log.id), log);
      } catch (err) {
        console.warn('Firestore addActivityLog failed, kept local copy:', err);
      }
    }
  },

  // --- UNIQUE CUSTOMER PHONES EXTRACTION ---
  async getRegisteredCustomerPhones(): Promise<string[]> {
    if (isFirebaseConfigured && db && auth?.currentUser) {
      try {
        const orders = (await this.getOrders()) as Order[];
        return Array.from(new Set(orders.map(o => o.phoneNumber)));
      } catch (err) {
        console.warn('Could not extract phones from live orders:', err);
      }
    }
    const customers = localStorage.getItem('h_unique_customers');
    if (customers) {
      try {
        const parsed = JSON.parse(customers);
        if (Array.isArray(parsed)) return parsed as string[];
      } catch {
        // Fallback
      }
    }
    const orders = (await this.getOrders()) as Order[];
    return Array.from(new Set(orders.map(o => o.phoneNumber)));
  },

  // --- DYNAMIC COUPONS ENDPOINTS ---
  async getCoupons(): Promise<Coupon[]> {
    const storageKeys = localStorage.getItem('h_coupons');
    const items: Coupon[] = storageKeys ? JSON.parse(storageKeys) : defaultCoupons;
    const localFiltered = items.filter(item => !item.isDeleted);

    if (isFirebaseConfigured && db) {
      // Background async update to keep coupons list clean and updated
      getDocs(collection(db, 'coupons'))
        .then((snap) => {
          const list = snap.docs.map(d => d.data() as Coupon);
          const mergedList = [...list];
          const dbIds = new Set(list.map(x => x.id.toUpperCase()));
          for (const local of items) {
            if (!dbIds.has(local.id.toUpperCase())) {
              mergedList.push(local);
            }
          }
          localStorage.setItem('h_coupons', JSON.stringify(mergedList));
        })
        .catch((err) => {
          console.warn('Background coupons sync failed:', err);
        });
    }

    return localFiltered;
  },

  async createCoupon(coupon: Coupon): Promise<void> {
    const coupons = await this.getCoupons();
    if (coupons.some(c => c.id.toUpperCase() === coupon.id.toUpperCase())) {
      throw new Error("Coupon code already exists");
    }
    coupons.push(coupon);
    localStorage.setItem('h_coupons', JSON.stringify(coupons));

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'coupons', coupon.id.toUpperCase()), coupon);
      } catch (err) {
        console.warn('Firestore createCoupon failed, kept local copy:', err);
      }
    }
  },

  async updateCoupon(id: string, updates: Partial<Coupon>): Promise<void> {
    const items = await this.getCoupons();
    const updated = items.map(item => item.id === id ? { ...item, ...updates } : item);
    localStorage.setItem('h_coupons', JSON.stringify(updated));

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'coupons', id), updates as any);
      } catch (err) {
        console.warn('Firestore updateCoupon failed, kept local copy:', err);
      }
    }
  },

  async deleteCoupon(id: string): Promise<void> {
    await this.updateCoupon(id, { isDeleted: true });
  },

  async syncLocalDataToFirebase(): Promise<void> {
    if (!isFirebaseConfigured || !db || !auth?.currentUser) {
      return;
    }
    console.log('Starting background synchronization of sandbox/local-only data to Firebase live collections...');
    
    // 1. Sync Categories
    try {
      const snap = await getDocs(collection(db, 'categories'));
      const liveIds = new Set(snap.docs.map(d => d.id));
      const storageKeys = localStorage.getItem('h_categories');
      const localItems: Category[] = storageKeys ? JSON.parse(storageKeys) : [];
      for (const cat of localItems) {
        if (!liveIds.has(cat.id)) {
          await setDoc(doc(db, 'categories', cat.id), cat);
          console.log(`Synced local category to FireStore: ${cat.id}`);
        }
      }
    } catch (e) {
      console.warn('Auto-sync categories warning:', e);
    }

    // 2. Sync Menu Items
    try {
      const snap = await getDocs(collection(db, 'menuItems'));
      const liveIds = new Set(snap.docs.map(d => d.id));
      const storageKeys = localStorage.getItem('h_menu_items');
      const localItems: MenuItem[] = storageKeys ? JSON.parse(storageKeys) : [];
      for (const item of localItems) {
        if (!liveIds.has(item.id)) {
          await setDoc(doc(db, 'menuItems', item.id), item);
          console.log(`Synced local menu item to FireStore: ${item.id}`);
        }
      }
    } catch (e) {
      console.warn('Auto-sync menuItems warning:', e);
    }

    // 3. Sync Orders
    try {
      const snap = await getDocs(collection(db, 'orders'));
      const liveIds = new Set(snap.docs.map(d => d.id));
      const storageKeys = localStorage.getItem('h_orders');
      const localItems: Order[] = storageKeys ? JSON.parse(storageKeys) : [];
      for (const ord of localItems) {
        if (!liveIds.has(ord.id)) {
          await setDoc(doc(db, 'orders', ord.id), ord);
          console.log(`Synced local order to FireStore: ${ord.id}`);
        }
      }
    } catch (e) {
      console.warn('Auto-sync orders warning:', e);
    }

    // 4. Sync Coupons
    try {
      const snap = await getDocs(collection(db, 'coupons'));
      const liveIds = new Set(snap.docs.map(d => d.id.toUpperCase()));
      const storageKeys = localStorage.getItem('h_coupons');
      const localItems: Coupon[] = storageKeys ? JSON.parse(storageKeys) : [];
      for (const c of localItems) {
        if (!liveIds.has(c.id.toUpperCase())) {
          await setDoc(doc(db, 'coupons', c.id.toUpperCase()), c);
          console.log(`Synced local coupon to FireStore: ${c.id}`);
        }
      }
    } catch (e) {
      console.warn('Auto-sync coupons warning:', e);
    }
  }
};
export { defaultCategories, defaultMenuItems, defaultSiteConfig, defaultCoupons };
export { OperationType };
