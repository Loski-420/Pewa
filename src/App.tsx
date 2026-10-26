import React, { useState, useEffect } from 'react';
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

export const CATALOG_VERSION = 'pewa_v2026_10_21_catalog_65_items_live_v7';

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
          // Preserve 100% of user edits and custom products
          const existingList = parsed.map((p) => ({
            ...p,
            imageUrl: sanitizeImageUrl(p.imageUrl, p.category, p.name),
          }));

          // Add any new default items from INITIAL_PRODUCTS that don't exist yet
          const existingIds = new Set(parsed.map((p) => p.id));
          const missingDefaults = INITIAL_PRODUCTS.filter((initP) => !existingIds.has(initP.id)).map((initP) => ({
            ...initP,
            imageUrl: sanitizeImageUrl(initP.imageUrl, initP.category, initP.name),
          }));

          const merged = [...existingList, ...missingDefaults];
          try {
            localStorage.setItem('pewa_products', JSON.stringify(merged));
          } catch (_) {}
          return merged;
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

  // 8. Admin Domain & Authentication State (strictly for admin.pewakitu.shop)
  const [isAdminDomain, setIsAdminDomain] = useState<boolean>(checkIsAdminDomain);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return !!(localStorage.getItem('pewa_admin_auth') || sessionStorage.getItem('pewa_admin_auth'));
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleUrlCheck = () => {
      setIsAdminDomain(checkIsAdminDomain());
    };
    window.addEventListener('popstate', handleUrlCheck);
    return () => window.removeEventListener('popstate', handleUrlCheck);
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

  // Initial fetch from server API to sync across sessions and domains (e.g. www.pewakitu.ai.studio)
  useEffect(() => {
    let isMounted = true;
    const fetchLiveCatalog = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const serverProducts = await res.json();
          if (Array.isArray(serverProducts) && serverProducts.length > 0 && isMounted) {
            setProducts((prev) => {
              // Preserve any custom items and user-edited items from local admin
              const localMap = new Map(prev.map((p) => [p.id, p]));
              const merged = serverProducts.map((sp: Product) => {
                const local = localMap.get(sp.id);
                // If the product was edited by user (updatedAt or isCustom), maintain the user's edits!
                if (local && (local.isCustom || local.updatedAt)) {
                  return local;
                }
                return sp;
              });
              // Keep items added locally that are not yet on the server
              const serverIds = new Set(serverProducts.map((sp: Product) => sp.id));
              const localOnly = prev.filter((p) => !serverIds.has(p.id));
              const finalProducts = [...merged, ...localOnly].map((p) => ({
                ...p,
                imageUrl: sanitizeImageUrl(p.imageUrl, p.category, p.name),
              }));
              try {
                localStorage.setItem('pewa_products', JSON.stringify(finalProducts));
              } catch (_) {}
              return finalProducts;
            });
          }
        }
      } catch (err) {
        // Fallback safely to offline / localStorage data
      }
    };

    fetchLiveCatalog();
    return () => {
      isMounted = false;
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
  const broadcastAndSaveProducts = (updated: Product[]) => {
    try {
      localStorage.setItem('pewa_products', JSON.stringify(updated));
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('pewa_catalog_channel');
        channel.postMessage({ type: 'PRODUCTS_UPDATED', products: updated });
        channel.close();
      }
    } catch (_) {}

    // Async push to server store for cross-domain sync (e.g. www.pewakitu.ai.studio)
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch((err) => {
      console.warn('Backend server sync skipped (offline or static hosting):', err);
    });
  };

  // Admin Product Actions
  const handleAddProduct = (newProduct: Product) => {
    setProducts((prev) => {
      const productWithTimestamp: Product = {
        ...newProduct,
        isCustom: true,
        updatedAt: Date.now(),
      };
      const updated = [productWithTimestamp, ...prev.filter((p) => p.id !== newProduct.id)];
      broadcastAndSaveProducts(updated);
      return updated;
    });
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts((prev) => {
      const productWithTimestamp: Product = {
        ...updatedProduct,
        updatedAt: Date.now(),
      };
      const updated = prev.map((p) => (p.id === updatedProduct.id ? productWithTimestamp : p));
      broadcastAndSaveProducts(updated);
      return updated;
    });
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      broadcastAndSaveProducts(updated);
      return updated;
    });
    setCartItems((prev) => prev.filter((it) => it.product.id !== productId));
  };

  const handlePublishCatalog = async (): Promise<boolean> => {
    try {
      broadcastAndSaveProducts(products);
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(products),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const handleImportCatalog = (imported: Product[]) => {
    if (Array.isArray(imported) && imported.length > 0) {
      setProducts(imported);
      broadcastAndSaveProducts(imported);
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
                sessionStorage.removeItem('pewa_admin_auth');
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
            onUpdateSettings={setSettings}
            onSignOut={() => {
              localStorage.removeItem('pewa_admin_auth');
              sessionStorage.removeItem('pewa_admin_auth');
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

      {/* 9. Direct Floating WhatsApp Contact Option (0712610337) */}
      <WhatsAppChatButton settings={settings} />
    </div>
  );
}
