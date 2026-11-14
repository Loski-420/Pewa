import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { Product, CartItem, Order, Rider, OrderStatus, StoreSettings } from './types';
import { INITIAL_PRODUCTS, INITIAL_RIDERS, INITIAL_ORDERS, INITIAL_SETTINGS } from './data/initialData';
import { sanitizeImageUrl } from './utils/imageFallback';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProductCatalog } from './components/ProductCatalog';
import { CartDrawer, DELIVERY_TIME_SLOTS } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { CustomerDashboard } from './components/CustomerDashboard';
import { RiderPortal } from './components/RiderPortal';
import { AdminPortal } from './components/AdminPortal';
import { AgeVerificationModal } from './components/AgeVerificationModal';
import { KopoKopoModal } from './components/KopoKopoModal';
import { DownloadAppModal } from './components/DownloadAppModal';
import { WhatsAppChatButton } from './components/WhatsAppChatButton';
import { AdminAuthLogin } from './components/AdminAuthLogin';
import { getAdminToken, clearAdminToken } from './utils/adminToken';
import {
  db,
  auth,
  onAuthStateChanged,
  signOut,
  onSnapshot,
  collection,
  doc,
  isFirebaseAdminUser,
  signInAdminWithGoogle,
  seedCatalogToFirestoreOnce,
  saveProductToFirestore,
  deleteProductFromFirestore,
  replaceCatalogInFirestore,
  savePublicSettingsToFirestore,
  fromFirestoreProduct,
  handleFirestoreError,
  OperationType,
  BANNED_SAMPLE_IDS,
} from './firebase';

export const CATALOG_VERSION = 'pewa_v2026_11_14_firestore_live_sync';

export default function App() {
  // 1. Age Verification State (with localStorage persistence)
  const [isAgeVerified, setIsAgeVerified] = useState<boolean>(() => {
    return localStorage.getItem('pewa_age_verified') === 'true';
  });
  const [showAgeModal, setShowAgeModal] = useState<boolean>(!isAgeVerified);

  // 2. Main Store Products State with Permanent LocalStorage & Admin Edit Persistence
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('pewa_products');
      if (saved) {
        const parsed: Product[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Preserve user's exact product list without auto-injecting extra items
          const cleaned = parsed
            .filter((p) => !['prod-wn4', 'prod-wn5', 'prod-ce9'].includes(p.id))
            .map((p) => ({
              ...p,
              imageUrl: sanitizeImageUrl(p.imageUrl, p.category, p.name),
            }));
          try {
            localStorage.setItem('pewa_products', JSON.stringify(cleaned));
          } catch (_) {}
          return cleaned;
        }
      }
    } catch (e) {
      console.error('Error initializing products from storage:', e);
    }

    try {
      localStorage.setItem('pewa_products', JSON.stringify(INITIAL_PRODUCTS));
    } catch (_) {}
    return INITIAL_PRODUCTS;
  });

  // 3. Riders State (with contacts & zone)
  const [riders, setRiders] = useState<Rider[]>(() => {
    try {
      const saved = localStorage.getItem('pewa_riders');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_RIDERS;
  });

  // 4. Orders State
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('pewa_orders');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_ORDERS;
  });

  // 5. Store Settings State (Ensuring Till 349797 & WhatsApp 0712610337)
  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('pewa_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migrate old placeholder till numbers or phones if present
        const merged: StoreSettings = {
          ...INITIAL_SETTINGS,
          ...parsed,
          kopoKopoTillNumber:
            !parsed.kopoKopoTillNumber || parsed.kopoKopoTillNumber === '5849201'
              ? '349797'
              : parsed.kopoKopoTillNumber,
          ownerWhatsAppPhone:
            !parsed.ownerWhatsAppPhone || parsed.ownerWhatsAppPhone === '254712345678'
              ? '254712610337'
              : parsed.ownerWhatsAppPhone,
          pointValueInKes: 1, // 1 point = 1 Ksh (20 points = 20 Ksh, redeemable anytime)
          pointsPerOrder: parsed.pointsPerOrder || 20,
          kopoKopoCredentials: {
            ...INITIAL_SETTINGS.kopoKopoCredentials,
            ...(parsed.kopoKopoCredentials || {}),
          },
        };
        return merged;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SETTINGS;
  });

  // 6. Customer Loyalty Points State (20 points = 20 Ksh, redeemable anytime)
  const [customerPoints, setCustomerPoints] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pewa_customer_points');
      if (saved) return Number(saved);
    } catch (e) {
      console.error(e);
    }
    return 20; // Default starter 20 points (KES 20 value)
  });

  // 7. Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('pewa_cart');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Helper: Detect whether current domain is admin.pewakitu.shop
  const checkIsAdminDomain = () => {
    if (typeof window === 'undefined') return false;
    const hostname = window.location.hostname.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);

    // 1. Primary requested production domain: admin.pewakitu.shop
    if (hostname === 'pewakitu.shop/admin' || hostname.startsWith('admin.')) return true;

    // 2. Allow path-based route for preview / sub-routes
    if (pathname === '/admin' || pathname.startsWith('/admin/')) return true;

    // 3. Allow query parameter switch for AI Studio preview testing
    if (
      params.get('domain') === 'pewakitu.shop/admin' ||
      params.get('domain') === 'admin.pewakitu.shop' ||
      params.get('admin') === 'true'
    ) return true;
    
        return false;
      };

  // 8. Admin Domain & Authentication State (strictly for admin.pewakitu.shop or /admin)
  const [isAdminDomain, setIsAdminDomain] = useState<boolean>(checkIsAdminDomain);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return !!(localStorage.getItem('pewa_admin_auth') || sessionStorage.getItem('pewa_admin_auth'));
    } catch {
      return false;
    }
  });
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);
  const [cloudSyncError, setCloudSyncError] = useState<string | null>(null);

  const productsRef = useRef<Product[]>(products);
  const isFirestoreAuthoritativeRef = useRef<boolean>(false);
  const isFirestoreSeededRef = useRef<boolean>(false);
  const lastLocalMutationRef = useRef<number>(0);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  useEffect(() => {
    const handleUrlCheck = () => {
      setIsAdminDomain(checkIsAdminDomain());
    };
    window.addEventListener('popstate', handleUrlCheck);
    return () => window.removeEventListener('popstate', handleUrlCheck);
  }, []);

  // Firebase Auth listener for Admin Cloud Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const authorized = await isFirebaseAdminUser(user);
      setIsCloudConnected(authorized);
      if (authorized) {
        setCloudSyncError(null);
        try {
          await seedCatalogToFirestoreOnce(productsRef.current);
        } catch (err: any) {
          console.warn('Initial catalog sync check warning:', err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleConnectCloudSync = async () => {
    setCloudSyncError(null);
    try {
      await signInAdminWithGoogle();
      setIsCloudConnected(true);
      await seedCatalogToFirestoreOnce(productsRef.current);
    } catch (err: any) {
      setCloudSyncError(
        err?.message || 'Failed to connect Google Cloud Sync. Please try again.'
      );
    }
  };

  // Real-Time Cloud Firestore Listeners (Authoritative across www.pewakitu.shop, pewakitu.shop, admin.pewakitu.shop, and mobile)
  useEffect(() => {
    const unsubMeta = onSnapshot(
      doc(db, 'meta', 'catalog_state'),
      (snap) => {
        const seeded = snap.exists() && snap.data()?.seeded === true;
        isFirestoreSeededRef.current = seeded;
        if (seeded) {
          isFirestoreAuthoritativeRef.current = true;
        }
      },
      (error) => {
        console.warn('Firestore meta listener error:', error);
      }
    );

    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        if (snapshot.docs.length > 0 || isFirestoreSeededRef.current) {
          isFirestoreAuthoritativeRef.current = true;
          const liveProducts = snapshot.docs
            .map((d) => fromFirestoreProduct(d.data()))
            .filter((p) => !BANNED_SAMPLE_IDS.includes(p.id))
            .map((p) => ({
              ...p,
              imageUrl: sanitizeImageUrl(p.imageUrl, p.category, p.name),
            }));
          setProducts(liveProducts);
          try {
            localStorage.setItem('pewa_products', JSON.stringify(liveProducts));
          } catch (_) {}
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'products');
      }
    );

    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'store'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setSettings((prev) => ({
            ...prev,
            storeName: data.storeName || prev.storeName,
            ownerWhatsAppPhone: data.ownerWhatsAppPhone || prev.ownerWhatsAppPhone,
            kopoKopoTillNumber: data.kopoKopoTillNumber || prev.kopoKopoTillNumber,
            deliveryFee: typeof data.deliveryFee === 'number' ? data.deliveryFee : prev.deliveryFee,
            minimumOrder: typeof data.minimumOrder === 'number' ? data.minimumOrder : prev.minimumOrder,
            pointsPerOrder: typeof data.pointsPerOrder === 'number' ? data.pointsPerOrder : prev.pointsPerOrder,
            pointValueInKes: typeof data.pointValueInKes === 'number' ? data.pointValueInKes : prev.pointValueInKes,
          }));
        }
      },
      (error) => {
        console.warn('Firestore settings listener error:', error);
      }
    );

    return () => {
      unsubMeta();
      unsubProducts();
      unsubSettings();
    };
  }, []);

  // 9. Navigation & Modals State
  const [currentView, setCurrentView] = useState<'store' | 'tracking' | 'rider'>('store');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isDownloadAppOpen, setIsDownloadAppOpen] = useState(false);
  const [selectedDeliverySchedule, setSelectedDeliverySchedule] = useState(DELIVERY_TIME_SLOTS[0]);
  const [selectedTrackingOrderId, setSelectedTrackingOrderId] = useState<string | undefined>(undefined);

  // Kopo Kopo Pay Modal
  const [kopoKopoModalOrder, setKopoKopoModalOrder] = useState<Order | null>(null);

  // Save to localStorage and notify tabs when state changes
  useEffect(() => {
    try {
      localStorage.setItem('pewa_products', JSON.stringify(products));
    } catch (e) {
      console.warn('Storage quota exceeded for products:', e);
    }
  }, [products]);

  // Fallback sync with /api/products only when Cloud Firestore is not yet seeded
  useEffect(() => {
    const load = async () => {
      if (isFirestoreAuthoritativeRef.current) return;
      const requestStartedAt = Date.now();
      try {
        const res = await fetch(`/api/products?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (isFirestoreAuthoritativeRef.current || lastLocalMutationRef.current > requestStartedAt) {
          return;
        }
        if (Array.isArray(data) && data.length > 0) {
          const final = data
            .filter((p: Product) => !BANNED_SAMPLE_IDS.includes(p.id))
            .map((p: Product) => ({
              ...p,
              imageUrl: sanitizeImageUrl(p.imageUrl, p.category, p.name),
            }));
          setProducts(final);
          try {
            localStorage.setItem('pewa_products', JSON.stringify(final));
          } catch (_) {}
        }
      } catch (err) {
        console.warn('Live catalog fetch error:', err);
      }
    };

    load();

    const onVisible = () => {
      if (document.visibilityState === 'visible' && !isFirestoreAuthoritativeRef.current) {
        load();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(() => {
      if (!isFirestoreAuthoritativeRef.current) {
        load();
      }
    }, 10000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    };
  }, []);

  // Real-time synchronization across browser tabs, windows, and BroadcastChannel
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('pewa_catalog_channel');
        channel.onmessage = (event) => {
          if (event.data?.type === 'PRODUCTS_UPDATED' && Array.isArray(event.data.products)) {
            setProducts(event.data.products);
          }
        };
      }
    } catch (err) {
      console.warn('BroadcastChannel error:', err);
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pewa_products' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProducts(parsed);
          }
        } catch (err) {
          console.error('Failed to parse updated products from storage:', err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('pewa_riders', JSON.stringify(riders));
  }, [riders]);

  useEffect(() => {
    localStorage.setItem('pewa_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('pewa_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('pewa_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('pewa_customer_points', customerPoints.toString());
  }, [customerPoints]);

  const handleVerifyAge = () => {
    setIsAgeVerified(true);
    setShowAgeModal(false);
    localStorage.setItem('pewa_age_verified', 'true');
  };

  const handleResetAgeVerification = () => {
    setIsAgeVerified(false);
    setShowAgeModal(true);
    localStorage.removeItem('pewa_age_verified');
  };

  // Cart Actions
  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Order Placement (Awards 10 points and adjusts redeemed points)
  const handleOrderPlaced = (newOrder: Order, pointsRedeemed: number) => {
    setOrders((prev) => [newOrder, ...prev]);
    setCartItems([]);
    setSelectedTrackingOrderId(newOrder.id);

    // Update customer points: deduct redeemed, add earned points (20 points = 20 Ksh)
    const pointsAwarded = newOrder.pointsEarned || settings.pointsPerOrder || 20;
    setCustomerPoints((prevPoints) => Math.max(0, prevPoints - pointsRedeemed) + pointsAwarded);
  };

  // Order Status Updates (Rider & Admin)
  const handleUpdateOrderStatus = (
    orderId: string,
    newStatus: OrderStatus,
    paymentStatus?: Order['paymentStatus']
  ) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated: Order = {
            ...o,
            status: newStatus,
            paymentStatus: paymentStatus || o.paymentStatus,
          };

          if (newStatus === 'delivered') {
            updated.riderEtaMinutes = 0;
            updated.paymentStatus = 'paid_via_kopokopo';
          } else if (newStatus === 'arrived') {
            updated.riderEtaMinutes = 1;
          } else if (newStatus === 'out_for_delivery') {
            updated.riderEtaMinutes = 10;
          }
          return updated;
        }
        return o;
      })
    );
  };

  // Assign Rider to Order
  const handleAssignRider = (orderId: string, riderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, assignedRiderId: riderId, status: 'rider_assigned' } : o))
    );
  };

  // Helper to persist and sync products across server and all tabs in real time
  const broadcastAndSaveProducts = async (updated: Product[]) => {
    try {
      localStorage.setItem('pewa_products', JSON.stringify(updated));
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('pewa_catalog_channel');
        channel.postMessage({ type: 'PRODUCTS_UPDATED', products: updated });
        channel.close();
      }
    } catch (_) {}

    const token = getAdminToken() || 'pewa_admin_token_active';
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify(updated),
      });
      if (res.status === 401) {
        clearAdminToken();
      }
    } catch (err) {
      console.warn('Network sync to /api/products failed:', err);
    }
  };

  // Admin Product Actions (Local + Broadcast + Server API + Cloud Firestore)
  const handleAddProduct = async (newProduct: Product) => {
    lastLocalMutationRef.current = Date.now();
    const productWithTimestamp: Product = {
      ...newProduct,
      isCustom: true,
      createdAt: newProduct.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [
      productWithTimestamp,
      ...productsRef.current.filter((p) => p.id !== newProduct.id),
    ];
    setProducts(updated);
    broadcastAndSaveProducts(updated);

    if (isCloudConnected) {
      try {
        await saveProductToFirestore(productWithTimestamp, 'create');
        setCloudSyncError(null);
      } catch (err: any) {
        setCloudSyncError(err?.message || 'Failed to save new product to Cloud Firestore.');
      }
    } else {
      setCloudSyncError('Item saved locally only. Click "Connect Cloud Sync" to publish across domains.');
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    lastLocalMutationRef.current = Date.now();
    const productWithTimestamp: Product = {
      ...updatedProduct,
      updatedAt: Date.now(),
    };
    const updated = productsRef.current.map((p) =>
      p.id === updatedProduct.id ? productWithTimestamp : p
    );
    setProducts(updated);
    broadcastAndSaveProducts(updated);

    if (isCloudConnected) {
      try {
        await saveProductToFirestore(productWithTimestamp, 'update');
        setCloudSyncError(null);
      } catch (err: any) {
        setCloudSyncError(err?.message || 'Failed to update product in Cloud Firestore.');
      }
    } else {
      setCloudSyncError('Edit saved locally only. Click "Connect Cloud Sync" to publish across domains.');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    lastLocalMutationRef.current = Date.now();
    const updated = productsRef.current.filter((p) => p.id !== productId);
    setProducts(updated);
    setCartItems((prev) => prev.filter((it) => it.product.id !== productId));
    broadcastAndSaveProducts(updated);

    if (isCloudConnected) {
      try {
        await deleteProductFromFirestore(productId);
        setCloudSyncError(null);
      } catch (err: any) {
        setCloudSyncError(err?.message || 'Failed to delete product from Cloud Firestore.');
      }
    } else {
      setCloudSyncError(
        'Item removed locally only. Click "Connect Cloud Sync" so deletion reflects on pewakitu.shop!'
      );
    }
  };

  const handlePublishCatalog = async (): Promise<boolean> => {
    lastLocalMutationRef.current = Date.now();
    let apiOk = false;
    try {
      localStorage.setItem('pewa_products', JSON.stringify(productsRef.current));
      const token = getAdminToken(true) || 'pewa_admin_token_active';
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify(productsRef.current),
      });
      if (res.status === 401) clearAdminToken();
      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        apiOk = json?.persisted !== false;
      }
    } catch {
      apiOk = false;
    }

    if (isCloudConnected) {
      try {
        await replaceCatalogInFirestore(productsRef.current);
        setCloudSyncError(null);
        return true;
      } catch (err: any) {
        setCloudSyncError(err?.message || 'Failed to publish catalog to Cloud Firestore.');
        return apiOk;
      }
    }
    setCloudSyncError('Click "Connect Cloud Sync" to synchronize catalog across pewakitu.shop.');
    return apiOk;
  };

  const handleImportCatalog = async (imported: Product[]) => {
    if (Array.isArray(imported) && imported.length > 0) {
      lastLocalMutationRef.current = Date.now();
      const cleaned = imported.filter((p) => !BANNED_SAMPLE_IDS.includes(p.id));
      setProducts(cleaned);
      broadcastAndSaveProducts(cleaned);
      if (isCloudConnected) {
        try {
          await replaceCatalogInFirestore(cleaned);
          setCloudSyncError(null);
        } catch (err: any) {
          setCloudSyncError(err?.message || 'Failed to import catalog to Cloud Firestore.');
        }
      }
    }
  };

  const handleUpdateSettings = async (nextSettings: StoreSettings) => {
    setSettings(nextSettings);
    if (isCloudConnected) {
      try {
        await savePublicSettingsToFirestore(nextSettings);
      } catch (err: any) {
        console.warn('Settings cloud sync warning:', err);
      }
    }
  };

  // Admin Rider Actions (Add, Edit, Delete)
  const handleAddRider = (newRider: Rider) => {
    setRiders((prev) => [...prev, newRider]);
  };

  const handleUpdateRider = (updatedRider: Rider) => {
    setRiders((prev) =>
      prev.map((r) => (r.id === updatedRider.id ? updatedRider : r))
    );
  };

  const handleDeleteRider = (riderId: string) => {
    setRiders((prev) => prev.filter((r) => r.id !== riderId));
  };

  // ------------------------------------------------------------------
  // ADMIN SUBDOMAIN GATEWAY: admin.pewakitu.shop
  // Restricted access strictly for the admin domain with phone & password auth
  // ------------------------------------------------------------------
  if (isAdminDomain) {
    if (!isAdminAuthenticated) {
      return (
        <AdminAuthLogin
          settings={settings}
          onSuccess={() => setIsAdminAuthenticated(true)}
          onGoToStore={() => {
            if (window.location.hostname !== 'admin.pewakitu.shop') {
              const url = new URL(window.location.href);
              url.searchParams.delete('admin');
              url.searchParams.delete('domain');
              if (url.pathname.startsWith('/admin')) {
                url.pathname = '/';
              }
              window.location.href = url.toString();
            } else {
              window.location.href = 'https://pewakitu.shop';
            }
          }}
        />
      );
    }

    return (
      <div className="min-h-screen bg-[#07080c] text-stone-100 flex flex-col">
        {/* Dedicated Admin Header for admin.pewakitu.shop */}
        <header className="sticky top-0 z-40 bg-[#0c0d12]/95 backdrop-blur-md border-b border-[#d4af37]/30 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#d4af37]/60 shadow-[0_0_15px_rgba(212,175,55,0.25)] shrink-0">
              <img src="/pwa-512x512.png" alt="Pewa Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-white text-base tracking-tight">Pewa Administration</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1b1c26] text-[#fae59e] border border-[#d4af37]/40">
                  admin.pewakitu.shop
                </span>
              </div>
              <span className="text-[11px] text-neutral-400">Authenticated Manager Session</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                if (window.location.hostname !== 'admin.pewakitu.shop') {
                  const url = new URL(window.location.href);
                  url.searchParams.delete('admin');
                  url.searchParams.delete('domain');
                  if (url.pathname.startsWith('/admin')) {
                    url.pathname = '/';
                  }
                  window.location.href = url.toString();
                } else {
                  window.open('https://pewakitu.shop', '_blank');
                }
              }}
              className="py-1.5 px-3 rounded-xl bg-[#171924] hover:bg-[#202330] border border-neutral-700 hover:border-neutral-500 text-neutral-300 hover:text-white text-xs font-semibold transition cursor-pointer"
            >
              Customer Store ↗
            </button>

            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('pewa_admin_auth');
                localStorage.removeItem('pewa_admin_token');
                sessionStorage.removeItem('pewa_admin_auth');
                sessionStorage.removeItem('pewa_admin_token');
                signOut(auth).catch(() => {});
                setIsAdminAuthenticated(false);
              }}
              className="py-1.5 px-3.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/50 text-red-200 hover:text-white font-semibold text-xs tracking-wide transition cursor-pointer flex items-center gap-1.5 shadow"
            >
              <span>Lock / Sign Out</span>
            </button>
          </div>
        </header>

        {/* Admin Portal Body */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
          <AdminPortal
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onPublishCatalog={handlePublishCatalog}
            onImportCatalog={handleImportCatalog}
            onNavigateToStore={() => {
              if (window.location.hostname !== 'admin.pewakitu.shop') {
                const url = new URL(window.location.href);
                url.searchParams.delete('admin');
                url.searchParams.delete('domain');
                if (url.pathname.startsWith('/admin')) {
                  url.pathname = '/';
                }
                window.location.href = url.toString();
              } else {
                window.open('https://pewakitu.shop', '_blank');
              }
            }}
            riders={riders}
            onAddRider={handleAddRider}
            onUpdateRider={handleUpdateRider}
            onDeleteRider={handleDeleteRider}
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onAssignRider={handleAssignRider}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            isCloudConnected={isCloudConnected}
            cloudSyncError={cloudSyncError}
            onConnectCloudSync={handleConnectCloudSync}
            onSignOut={() => {
              localStorage.removeItem('pewa_admin_auth');
              localStorage.removeItem('pewa_admin_token');
              sessionStorage.removeItem('pewa_admin_auth');
              sessionStorage.removeItem('pewa_admin_token');
              signOut(auth).catch(() => {});
              setIsAdminAuthenticated(false);
            }}
          />
        </main>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // CUSTOMER STORE (pewakitu.shop / www.pewakitu.shop)
  // Clean customer-facing storefront; no admin buttons or links visible
  // ------------------------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col bg-[#0b0c10] text-[#f3f4f6]">
      {/* 1. Age Verification Portal (blocks browsing if not confirmed) */}
      <AgeVerificationModal
        isOpen={showAgeModal}
        onVerify={handleVerifyAge}
      />

      {/* 2. Top Bar Navigation with Pewa Logo & Download App Button */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'admin') return;
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        cartItems={cartItems}
        onOpenCart={() => setIsCartOpen(true)}
        orderCount={orders.length}
        customerPoints={customerPoints}
        isAgeVerified={isAgeVerified}
        onResetAgeVerification={handleResetAgeVerification}
        onOpenDownloadApp={() => setIsDownloadAppOpen(true)}
        settings={settings}
        isAdminDomain={false}
      />

      {/* 3. Main Views */}
      <main className="flex-1">
        {currentView === 'store' && (
          <ProductCatalog
            products={products}
            cartItems={cartItems}
            onAddToCart={handleAddToCart}
            onOpenScheduleInCart={() => setIsCartOpen(true)}
            onOpenDownloadApp={() => setIsDownloadAppOpen(true)}
            onNavigateToAdmin={undefined}
          />
        )}

        {currentView === 'tracking' && (
          <CustomerDashboard
            orders={orders}
            riders={riders}
            selectedOrderId={selectedTrackingOrderId}
            onSelectOrder={(id) => setSelectedTrackingOrderId(id)}
            onOpenKopoKopo={(ord) => setKopoKopoModalOrder(ord)}
            settings={settings}
            customerPoints={customerPoints}
            onNavigateToStore={() => setCurrentView('store')}
          />
        )}

        {currentView === 'rider' && (
          <RiderPortal
            riders={riders}
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            settings={settings}
          />
        )}
      </main>

      {/* 4. Cart & Delivery Scheduling Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        selectedSchedule={selectedDeliverySchedule}
        onScheduleChange={setSelectedDeliverySchedule}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        settings={settings}
      />

      {/* 5. Checkout Modal with Map Picker, Redeemable Points & WhatsApp Dispatch */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        deliverySchedule={selectedDeliverySchedule}
        settings={settings}
        customerPoints={customerPoints}
        onOrderPlaced={handleOrderPlaced}
        onOpenTracking={(orderId) => {
          setSelectedTrackingOrderId(orderId);
          setCurrentView('tracking');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenKopoKopo={(order) => {
          setKopoKopoModalOrder(order);
        }}
      />

      {/* 6. Kopo Kopo Mobile Payment Modal */}
      {kopoKopoModalOrder && (
        <KopoKopoModal
          isOpen={!!kopoKopoModalOrder}
          onClose={() => setKopoKopoModalOrder(null)}
          orderNumber={kopoKopoModalOrder.orderNumber}
          totalAmount={kopoKopoModalOrder.total}
          customerPhone={kopoKopoModalOrder.safaricomPhone}
          settings={settings}
          onPaymentSuccess={() => {
            handleUpdateOrderStatus(kopoKopoModalOrder.id, 'delivered', 'paid_via_kopokopo');
          }}
        />
      )}

      {/* 7. Download Pewa Web App Modal (Using the provided Pewa App Icon) */}
      <DownloadAppModal
        isOpen={isDownloadAppOpen}
        onClose={() => setIsDownloadAppOpen(false)}
      />

      {/* 8. Footer */}
      <Footer
        settings={settings}
        onNavigate={(view) => {
          if (view === 'admin') return;
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenDownloadApp={() => setIsDownloadAppOpen(true)}
        isAdminDomain={false}
      />

      {/* 9. Mobile Sticky Action Bar: Always visible on phone when basket has items */}
      {cartItems.length > 0 && currentView === 'store' && !isCartOpen && !isCheckoutOpen && (
        <aside
          aria-label="Mobile Checkout Bar"
          className="fixed bottom-0 inset-x-0 z-40 p-3 bg-[#0d0e15]/95 backdrop-blur-md border-t border-[#d4af37]/40 md:hidden shadow-[0_-5px_30px_rgba(0,0,0,0.85)]"
        >
          <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2.5 text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1c1a12] border border-[#d4af37]/50 flex items-center justify-center text-[#fae59e] shrink-0 relative">
                <ShoppingBag className="w-5 h-5 text-[#d4af37]" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-black font-mono text-[11px] font-bold flex items-center justify-center shadow">
                  {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase tracking-wider font-semibold">
                  Basket Total
                </span>
                <span className="text-sm font-bold font-mono text-[#fae59e]">
                  KES {cartItems.reduce((acc, i) => acc + i.product.price * i.quantity, 0).toLocaleString()}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsCheckoutOpen(true)}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-[#d4af37] to-amber-500 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 transition cursor-pointer"
            >
              <span>Enter Name & Location</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>
      )}

      {/* 10. Direct Floating WhatsApp Contact Option (0712610337) */}
      <WhatsAppChatButton
        settings={settings}
        hasCartBar={cartItems.length > 0 && currentView === 'store' && !isCartOpen && !isCheckoutOpen}
      />
    </div>
  );
}
