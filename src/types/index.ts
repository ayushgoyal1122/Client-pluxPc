// ─── Global TypeScript types ──────────────────────────────────────────────────

export interface ActivePromotion {
  id?: string;
  name?: string;
  code?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  badgeText?: string;
  endDate?: string | null;
}

export interface PromotionalPoster {
  image: string;
  alt?: string;
  title?: string;
  description?: string;
  tag?: string;
  sortOrder?: number;
}

export interface ProductHighlight {
  icon?: string;
  title: string;
  description: string;
}

export interface ProductUseCase {
  title: string;
  description: string;
  badge?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;          // slug of the category
  categoryLabel: string;     // display label
  price: number;
  originalPrice?: number;
  basePrice?: number;
  activePromotion?: ActivePromotion | null;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  images?: string[];
  galleryImages?: string[];
  promotionalPosters?: PromotionalPoster[];
  badge?: string;            // "New Launch", "Bestseller", "Extra ₹100 Off" …
  badgeIcon?: string;        // emoji/icon prefix for badge
  featureTag?: string;       // "40 Hrs Playback", "BT Calling" …
  inStock: boolean;
  stockQuantity?: number;
  description?: string;
  overview?: string;
  keyFeatures?: string[];
  highlights?: ProductHighlight[];
  useCases?: ProductUseCase[];
  inTheBox?: string[];
  compatibility?: string[];
  warrantyDetails?: string;
  specs?: Record<string, string>;
  colors?: string[];         // tailwind bg class names for color dots
  section?: string[];        // which homepage sections this product appears in
  isNew?: boolean;
  isTrending?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  productCount?: number;
  description?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal?: number;
}

export interface CartData {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  platformFee?: number;
  total: number;
}

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  role: 'customer';
  avatar?: string;
}

export interface WishlistItem {
  product: Product;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  date: string;
  category: string;
  readTime: string;
  tab: "popular" | "latest";
}

export interface HeroBanner {
  id: string;
  tag: string;
  headline: string;
  subheadline: string;
  features: string[];
  imageUrl: string;
  bgFrom: string;
  bgTo: string;
  ctaLabel: string;
  ctaLink: string;
}

// API response shape — ready for MERN backend integration
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export type SortOption = "featured" | "price-asc" | "price-desc" | "rating" | "newest";

export interface FilterState {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  sort: SortOption;
  inStock?: boolean;
}

export interface DeliveryAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
}

export interface OrderItem {
  product: string;
  name: string;
  slug: string;
  imageUrl: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface TrackingEvent {
  status: string;
  timestamp: string;
  description: string;
  location?: string;
  actor?: "system" | "customer" | "admin";
}

export interface ShipmentDetails {
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDeliveryDate?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer: string | { _id: string; name: string; email: string };
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  platformFee?: number;
  platformFeeType?: "fixed" | "percentage" | null;
  platformFeeValue?: number;
  platformFeeEnabledAtPurchase?: boolean;
  discount: number;
  total: number;
  currency: string;
  deliveryAddress: DeliveryAddress;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  orderStatus: "placed" | "confirmed" | "processing" | "shipped" | "out_for_delivery" | "delivered" | "cancelled";
  trackingHistory?: TrackingEvent[];
  shipment?: ShipmentDetails;
  paymentMethod: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paidAt?: string;
  failedAt?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderResponse {
  success: boolean;
  orderId: string;
  orderNumber: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  message?: string;
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface PromoValidationResult {
  valid: boolean;
  code?: string;
  name?: string;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  totalDiscount?: number;
  newSubtotal?: number;
  message?: string;
  error?: string;
}

export interface PlatformFeeConfig {
  enabled: boolean;
  feeType: "fixed" | "percentage";
  feeValue: number;
  minFee?: number | null;
  maxFee?: number | null;
}

// ─── Blog Types ─────────────────────────────────────────────────────────────
export interface Blog {
  _id: string;
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  categorySlug?: string;
  author: string;
  authorRole?: string;
  authorAvatar?: string;
  tags?: string[];
  status: "draft" | "published";
  readTime: string;
  views: number;
  isFeatured: boolean;
  metaTitle?: string;
  metaDescription?: string;
  publishedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BlogCategory {
  name: string;
  slug: string;
  count: number;
}

export interface BlogListResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  totalPages: number;
  blogs: Blog[];
}

export interface BlogDetailResponse {
  success: boolean;
  blog: Blog;
  relatedBlogs: Blog[];
}

export interface BlogFeaturedResponse {
  success: boolean;
  featured: Blog | null;
  popular: Blog[];
}

