export type Category = 
  | 'Whiskey' 
  | 'Vodka'
  | 'Spirits & Liquors'
  | 'Gin' 
  | 'Brandy' 
  | 'Wines' 
  | 'Beer' 
  | 'Munchies'
  | 'Cigarettes & Extras';

export type PriceFilter = 'all' | 'under2k' | '2k-5k' | '5k-10k' | 'above10k' | 'price-asc' | 'price-desc';

export type PopularityFilter = 'all' | 'popular' | 'local-legend' | 'reserve' | 'new';

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: Category;
  price: number; // in KES
  originalPrice?: number;
  abv: number; // percentage e.g. 40.0 (or 0.0 for snacks)
  volume: string; // e.g. "750ml", "1 Litre", "250g pack", "6 x 330ml"
  origin: string; // e.g. "Kenya", "Scotland", "France", "South Africa"
  isLocal: boolean;
  description: string;
  tastingNotes: string[];
  imageUrl: string;
  stock: number;
  rating: number;
  reviewCount: number;
  popularityScore: number;
  isCustom?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'rider_assigned' 
  | 'out_for_delivery' 
  | 'arrived' 
  | 'delivered';

export interface Rider {
  id: string;
  name: string;
  phone: string; // Primary Safaricom number
  altPhone?: string; // Alternative contact / WhatsApp
  vehiclePlate: string;
  zone?: string; // e.g. Kilimani Hub, Westlands Base
  avatarUrl?: string;
  rating: number;
  completedDeliveries: number;
  isAvailable: boolean;
  currentLat?: number;
  currentLng?: number;
}

export interface OrderLocation {
  address: string;
  estate: string;
  buildingOrHouse: string;
  lat: number;
  lng: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "PEWA-8921"
  createdAt: string;
  customerName: string;
  safaricomPhone: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  pointsEarned: number; // 10 points awarded per order
  pointsRedeemed?: number; // points applied for discount
  discountAmount?: number; // KES discount from points
  total: number;
  deliverySchedule: string; // "ASAP (Within 45 mins)" or scheduled slot
  location: OrderLocation;
  paymentMethod: 'kopokopo_on_delivery';
  paymentStatus: 'pending_on_delivery' | 'paid_via_kopokopo';
  status: OrderStatus;
  assignedRiderId?: string;
  riderEtaMinutes?: number;
  riderCurrentLocation?: {
    lat: number;
    lng: number;
  };
  whatsappNotified: boolean;
  notes?: string;
}

export interface CustomerProfile {
  name: string;
  phone: string;
  totalPoints: number;
  lifetimePointsEarned: number;
  pointsHistory: {
    id: string;
    orderNumber: string;
    date: string;
    points: number;
    description: string;
  }[];
}

export interface KopoKopoCredentials {
  clientId: string;
  clientSecret: string;
  apiKey: string;
  webhookSecret: string;
  environment: 'sandbox' | 'production';
  liveStatus: 'unconfigured' | 'connected' | 'error';
  lastTestedAt?: string;
}

export interface StoreSettings {
  storeName: string;
  ownerWhatsAppPhone: string; // e.g. "254712610337" (direct to 0712610337)
  kopoKopoTillNumber: string; // e.g. "349797"
  deliveryFee: number;
  minimumOrder: number;
  pointsPerOrder: number; // default 20 points awarded per order
  pointValueInKes: number; // 1 point = 1 Ksh (20 points = 20 Ksh, redeemable anytime)
  kopoKopoCredentials?: KopoKopoCredentials;
}
