export type Language = 'bn' | 'en';

export interface Category {
  id: string;
  nameBn: string;
  nameEn: string;
  descriptionBn?: string;
  descriptionEn?: string;
  isDeleted?: boolean;
  price?: number;
}

export interface MenuItem {
  id: string;
  nameBn: string;
  nameEn: string;
  descriptionBn?: string;
  descriptionEn?: string;
  image: string;
  regularPrice: number;
  discountedPrice?: number;
  isAvailable: boolean;
  categoryId: string;
  createdAt: string;
  isDeleted?: boolean;
  isMostlyOrdered?: boolean;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface OrderItem {
  id: string;
  nameBn: string;
  nameEn: string;
  quantity: number;
  price: number; // Price charged (e.g. discountedPrice if exists, else regularPrice)
}

export type OrderStatus =
  | "Pending"
  | "Hold"
  | "Accepted"
  | "Preparing"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

export interface Order {
  id: string;
  invoiceNumber: string;
  fullName: string;
  phoneNumber: string;
  fullAddress: string;
  items: OrderItem[];
  totalPrice: number;
  deliveryCharge: number;
  paymentMethod: 'bKash' | 'Cash on Delivery';
  bKashNumber?: string;
  transactionId?: string;
  status: OrderStatus;
  createdAt: string;
  isDeleted?: boolean;
  couponCode?: string;
  couponDiscount?: number;
  shippingArea?: 'inside' | 'outside';
}

export interface Coupon {
  id: string; // Dynamic code (e.g., "RAHI20")
  offerName: string; // Display name
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate?: string; // ISO date string (YYYY-MM-DD or full ISO)
  endDate?: string; // ISO date string (YYYY-MM-DD or full ISO)
  isActive: boolean;
  isDeleted?: boolean;
  applicability: 'all' | 'specific';
  applicableProductIds?: string[]; // Empty or list of menu item IDs when specificity is "specific"
}

export type AdminRole = 'super_admin' | 'operator';

export type ActivityType =
  | 'manage_menu'
  | 'manage_categories'
  | 'manage_orders'
  | 'manage_site_config'
  | 'view_audit_logs';

export interface Admin {
  uid: string;
  email: string;
  role: AdminRole;
  permissions: ActivityType[];
  isDeleted?: boolean;
}

export interface SiteConfig {
  id: string;
  deliveryChargeInside: number;
  deliveryChargeOutside: number;
  bKashNumber: string;
  bKashQrUrl?: string;
  bannerBn?: string;
  bannerEn?: string;
  whatsappNumber?: string;
}

export interface ActivityLog {
  id: string;
  adminEmail: string;
  action: string;
  details?: string;
  createdAt: string;
}
