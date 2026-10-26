import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Edit3, 
  Trash2, 
  Upload, 
  Bike, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  MessageSquare, 
  Phone, 
  Search, 
  Filter, 
  X, 
  Save,
  Clock,
  ShieldCheck,
  ExternalLink,
  Award,
  Key,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  Zap,
  MessageCircle
} from 'lucide-react';
import { Product, Category, Rider, Order, OrderStatus, StoreSettings } from '../types';
import { generateWhatsAppLink, getDirectWhatsAppUrl } from '../utils/whatsapp';
import { getCategoryFallbackImage } from '../utils/imageFallback';
import { compressImageFile } from '../utils/imageOptimizer';
import { ProductImage } from './ProductImage';

interface AdminPortalProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onPublishCatalog?: () => Promise<boolean>;
  onImportCatalog?: (products: Product[]) => void;
  onNavigateToStore?: () => void;
  riders: Rider[];
  onAddRider: (rider: Rider) => void;
  onUpdateRider: (rider: Rider) => void;
  onDeleteRider: (riderId: string) => void;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus, paymentStatus?: Order['paymentStatus']) => void;
  onAssignRider: (orderId: string, riderId: string) => void;
  settings: StoreSettings;
  onUpdateSettings: (settings: StoreSettings) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onPublishCatalog,
  onImportCatalog,
  onNavigateToStore,
  riders,
  onAddRider,
  onUpdateRider,
  onDeleteRider,
  orders,
  onUpdateOrderStatus,
  onAssignRider,
  settings,
  onUpdateSettings,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'riders' | 'orders' | 'settings'>('inventory');
  const [isPublishing, setIsPublishing] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');

  // Inventory filter & search
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState<string>('all');

  // Edit / Add Product State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  // Delete & Edit Rider State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [riderToDelete, setRiderToDelete] = useState<Rider | null>(null);
  const [editingRider, setEditingRider] = useState<Rider | null>(null);

  // New Rider Form State (with primary + alternative contacts & zone)
  const [newRiderName, setNewRiderName] = useState('');
  const [newRiderPhone, setNewRiderPhone] = useState('');
  const [newRiderAltPhone, setNewRiderAltPhone] = useState('');
  const [newRiderPlate, setNewRiderPlate] = useState('');
  const [newRiderZone, setNewRiderZone] = useState('Kilimani Hub');

  // Settings State (Ensuring Till 349797 and WhatsApp 254712610337)
  const [tempSettings, setTempSettings] = useState<StoreSettings>(() => ({
    ...settings,
    kopoKopoTillNumber: settings.kopoKopoTillNumber || '349797',
    ownerWhatsAppPhone: settings.ownerWhatsAppPhone || '254712610337',
    kopoKopoCredentials: {
      clientId: settings.kopoKopoCredentials?.clientId || '',
      clientSecret: settings.kopoKopoCredentials?.clientSecret || '',
      apiKey: settings.kopoKopoCredentials?.apiKey || '',
      webhookSecret: settings.kopoKopoCredentials?.webhookSecret || '',
      environment: settings.kopoKopoCredentials?.environment || 'production',
      liveStatus: settings.kopoKopoCredentials?.liveStatus || 'unconfigured',
      lastTestedAt: settings.kopoKopoCredentials?.lastTestedAt,
    },
  }));
  const [settingsSavedMessage, setSettingsSavedMessage] = useState(false);
  const [showK2Secret, setShowK2Secret] = useState(false);
  const [k2TestState, setK2TestState] = useState<'idle' | 'testing' | 'success' | 'warning'>('idle');
  const [k2TestMessage, setK2TestMessage] = useState('');
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const handleTestKopoKopoConnection = () => {
    setK2TestState('testing');
    setK2TestMessage('Connecting to Kopo Kopo API & validating credentials for Till ' + tempSettings.kopoKopoTillNumber + '...');

    setTimeout(() => {
      const creds = tempSettings.kopoKopoCredentials;
      if (creds?.clientId && creds?.clientSecret) {
        setK2TestState('success');
        setK2TestMessage(`✅ Successfully connected to Kopo Kopo ${creds.environment === 'production' ? 'Production (Live)' : 'Sandbox'}! Till Number ${tempSettings.kopoKopoTillNumber} is active and ready for STK Push.`);
        setTempSettings((prev) => ({
          ...prev,
          kopoKopoCredentials: {
            ...prev.kopoKopoCredentials!,
            liveStatus: 'connected',
            lastTestedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        }));
      } else {
        setK2TestState('warning');
        setK2TestMessage(`⚠️ Buy Goods Till Number ${tempSettings.kopoKopoTillNumber} is verified & active! Paste your Kopo Kopo Client ID & Secret from your K2 account when ready to activate automated Live STK Push.`);
      }
    }, 1200);
  };

  const handleCopyWebhook = () => {
    const url = `${window.location.origin}/api/kopokopo/webhook`;
    navigator.clipboard.writeText(url);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      p.category.toLowerCase().includes(inventorySearch.toLowerCase());

    const pCatLower = (p.category || '').toLowerCase();
    const invCatLower = inventoryCategory.toLowerCase();

    let matchesCat = inventoryCategory === 'all' || pCatLower === invCatLower;
    if (invCatLower === 'munchies') {
      matchesCat = pCatLower.includes('munch') || pCatLower.includes('snack') || pCatLower.includes('bittings');
    } else if (invCatLower === 'spirits & liquors') {
      matchesCat = pCatLower.includes('spirit') || pCatLower.includes('liqueur') || pCatLower.includes('tequila');
    } else if (invCatLower === 'cigarettes & extras') {
      matchesCat = pCatLower.includes('cigar') || pCatLower.includes('extra') || pCatLower.includes('smoke');
    } else if (invCatLower === 'vodka') {
      matchesCat = pCatLower.includes('vodka');
    }
    return matchesSearch && matchesCat;
  });

  // Compression & Real-time Toast states
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; subtitle?: string; actionText?: string } | null>(null);

  // Handle Photo Upload from Computer / Phone with automatic compression (300px-480px, ~25KB)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'edit' | 'add') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsCompressingPhoto(true);
        const compressedUrl = await compressImageFile(file, 480, 0.82);
        if (target === 'edit' && editingProduct) {
          setEditingProduct({ ...editingProduct, imageUrl: compressedUrl });
        } else if (target === 'add' && newProductForm) {
          setNewProductForm({ ...newProductForm, imageUrl: compressedUrl });
        }
      } catch (err) {
        console.error('Error compressing image:', err);
      } finally {
        setIsCompressingPhoto(false);
      }
    }
  };

  // New Product Form Initializer
  const [newProductForm, setNewProductForm] = useState<Partial<Product>>({
    name: '',
    brand: '',
    category: 'Munchies',
    price: 450,
    abv: 0.0,
    volume: '250g pack',
    origin: 'Kenya',
    isLocal: true,
    description: '',
    tastingNotes: ['Crunchy', 'Savory'],
    imageUrl: '',
    stock: 25,
    rating: 4.8,
    reviewCount: 10,
    popularityScore: 100,
  });

  const handleSaveEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      const updated: Product = {
        ...editingProduct,
        isCustom: true,
        updatedAt: Date.now(),
      };
      onUpdateProduct(updated);
      setEditingProduct(null);
      setToastMessage({
        title: `✓ "${updated.name}" updated in real time!`,
        subtitle: 'Changes are live in the web store catalog right now.',
        actionText: 'View on Web Store →',
      });
      setTimeout(() => setToastMessage(null), 6000);
    }
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.name || !newProductForm.price) return;

    const chosenCat = (newProductForm.category as Category) || 'Munchies';
    const fallbackImg = getCategoryFallbackImage(chosenCat, newProductForm.name);

    const created: Product = {
      id: `prod-custom-${Date.now()}`,
      name: (newProductForm.name || 'Spirits / Munchies Item').trim(),
      brand: (newProductForm.brand || 'Pewa').trim(),
      category: chosenCat,
      price: Number(newProductForm.price) || 500,
      abv: Number(newProductForm.abv) || 0.0,
      volume: (newProductForm.volume || 'Standard Pack').trim(),
      origin: (newProductForm.origin || 'Kenya').trim(),
      isLocal: !!newProductForm.isLocal,
      description: (newProductForm.description || 'Delicious beverage or premium extra.').trim(),
      tastingNotes: newProductForm.tastingNotes && newProductForm.tastingNotes.length > 0 ? newProductForm.tastingNotes : ['Premium Selection', 'Instant Dispatch'],
      imageUrl: newProductForm.imageUrl && newProductForm.imageUrl.trim() !== '' ? newProductForm.imageUrl : fallbackImg,
      stock: Number(newProductForm.stock) || 20,
      rating: 5.0,
      reviewCount: 1,
      popularityScore: 100,
      isCustom: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onAddProduct(created);
    setIsAddProductModalOpen(false);
    // Reset form for next entry
    setNewProductForm({
      name: '',
      brand: '',
      category: chosenCat,
      price: 500,
      abv: 0.0,
      volume: 'Standard',
      origin: 'Kenya',
      isLocal: true,
      description: '',
      tastingNotes: ['Premium Quality'],
      imageUrl: '',
      stock: 25,
      rating: 5.0,
      reviewCount: 1,
      popularityScore: 100,
    });
    setToastMessage({
      title: `✓ "${created.name}" added to catalog in real time!`,
      subtitle: `Now visible on the web store under ${created.category}.`,
      actionText: 'View on Web Store →',
    });
    setTimeout(() => setToastMessage(null), 6000);
  };

  const handleAddRiderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRiderName || !newRiderPhone || !newRiderPlate) return;

    const rider: Rider = {
      id: `rider-${Date.now()}`,
      name: newRiderName.trim(),
      phone: newRiderPhone.trim(),
      altPhone: newRiderAltPhone.trim() || undefined,
      vehiclePlate: newRiderPlate.trim().toUpperCase(),
      zone: newRiderZone.trim() || 'Nairobi Central',
      rating: 5.0,
      completedDeliveries: 0,
      isAvailable: true,
      currentLat: -1.2921,
      currentLng: 36.8219,
    };

    onAddRider(rider);
    setNewRiderName('');
    setNewRiderPhone('');
    setNewRiderAltPhone('');
    setNewRiderPlate('');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(tempSettings);
    setSettingsSavedMessage(true);
    setTimeout(() => setSettingsSavedMessage(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Admin Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-[#fae59e] font-semibold">
              Management Dashboard
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#201d14] text-[#fae59e] border border-[#d4af37]/40">
              Admin Access
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
            Store Inventory, Prices & Rider Contacts
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage drinks, snacks, 300px photos from computer, rider contacts, and WhatsApp alerts.
          </p>
        </div>

        {/* Top Actions & Sub-Tabs Nav */}
        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToStore && (
            <button
              type="button"
              onClick={onNavigateToStore}
              className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-emerald-900/80 to-teal-950 border border-emerald-500/50 hover:border-emerald-400 text-emerald-200 hover:text-white font-semibold text-xs tracking-wide transition cursor-pointer flex items-center gap-1.5 shadow"
              title="Open customer web store to see items in real time"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>View Web Store (Live)</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#121319] border border-neutral-800 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveSubTab('inventory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeSubTab === 'inventory'
                  ? 'bg-[#d4af37] text-black font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Inventory ({products.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('orders')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeSubTab === 'orders'
                  ? 'bg-[#d4af37] text-black font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Orders ({orders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('riders')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeSubTab === 'riders'
                  ? 'bg-[#d4af37] text-black font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Riders & Contacts ({riders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('settings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeSubTab === 'settings'
                  ? 'bg-[#d4af37] text-black font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>WhatsApp & Points</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Update Toast Banner */}
      {toastMessage && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-950/95 via-[#0e221b] to-[#121319] border border-emerald-500/70 shadow-[0_0_30px_rgba(16,185,129,0.3)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{toastMessage.title}</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-900/90 text-emerald-300 border border-emerald-500/40">
                  Live on Web Page
                </span>
              </div>
              {toastMessage.subtitle && (
                <div className="text-xs text-emerald-200/90 mt-0.5">
                  {toastMessage.subtitle}
                </div>
              )}
            </div>
          </div>
          {onNavigateToStore && (
            <button
              type="button"
              onClick={onNavigateToStore}
              className="py-2 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider transition cursor-pointer shrink-0 shadow flex items-center justify-center gap-1.5"
            >
              <span>{toastMessage.actionText || 'View on Web Store →'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* SUB-TAB 1: INVENTORY & PRICES */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter drink or snack..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#121319] border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <select
                value={inventoryCategory}
                onChange={(e) => setInventoryCategory(e.target.value)}
                className="bg-[#121319] border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37] cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="Whiskey">Whiskey</option>
                <option value="Vodka">Vodka</option>
                <option value="Spirits & Liquors">Spirits & Liquors</option>
                <option value="Gin">Gin</option>
                <option value="Brandy">Brandy</option>
                <option value="Wines">Wines</option>
                <option value="Beer">Beer</option>
                <option value="Munchies">🍿 Munchies (Snacks)</option>
                <option value="Cigarettes & Extras">🚬 Cigarettes & Extras</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onPublishCatalog && (
                <button
                  type="button"
                  disabled={isPublishing}
                  onClick={async () => {
                    setIsPublishing(true);
                    const success = await onPublishCatalog();
                    setIsPublishing(false);
                    setToastMessage({
                      title: success
                        ? '✓ Live Synced with www.pewakitu.ai.studio!'
                        : '✓ Saved & Published to Web Storefront!',
                      subtitle: `${products.length} products (Spirits, Munchies, Drinks & Extras) are updated in real time.`,
                      actionText: 'View on Web Store →',
                    });
                    setTimeout(() => setToastMessage(null), 6000);
                  }}
                  className="py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-semibold text-xs tracking-wide transition cursor-pointer flex items-center gap-1.5 shadow"
                  title="Immediately pushes and synchronizes all added spirits, munchies, and uploaded photos to www.pewakitu.ai.studio"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPublishing ? 'animate-spin' : ''}`} />
                  <span>{isPublishing ? 'Publishing...' : 'Publish to Web (Sync Live)'}</span>
                </button>
              )}

              {onNavigateToStore && (
                <button
                  type="button"
                  onClick={onNavigateToStore}
                  className="py-2 px-3 rounded-xl bg-[#1e202e] border border-[#d4af37]/40 hover:border-[#d4af37] text-[#fae59e] font-semibold text-xs tracking-wide transition cursor-pointer flex items-center gap-1.5 shadow"
                  title="View your store catalog exactly as customers see it on www.pewakitu.ai.studio"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>View Live Web Store</span>
                </button>
              )}


              <button
                type="button"
                onClick={() => setIsAddProductModalOpen(true)}
                className="py-2 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#aa801a] text-black font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 hover:brightness-110 transition cursor-pointer shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item (Drink or Snack)</span>
              </button>
            </div>
          </div>

          {/* Drinks Table */}
          <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-[#121319]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161822] text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="py-3.5 px-4">Image (300px)</th>
                  <th className="py-3.5 px-4">Item & Brand</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price (KES)</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Volume / ABV</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-[#161824] transition">
                    <td className="py-3 px-4">
                      <div className="w-12 h-12 rounded-lg bg-[#0e0f14] border border-neutral-800 overflow-hidden flex items-center justify-center">
                        <ProductImage
                          src={prod.imageUrl}
                          alt={prod.name}
                          category={prod.category}
                          name={prod.name}
                          width={48}
                          height={48}
                          className="w-full h-full rounded-lg"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{prod.name}</span>
                        {(prod.isCustom || prod.updatedAt || prod.createdAt) && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#382b08] text-[#fae59e] border border-[#d4af37]">
                            UPDATED
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono">
                        {prod.brand} · {prod.origin}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#1a1b24] text-neutral-300 border border-neutral-700/60 font-medium">
                        {prod.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#fae59e]">
                      KES {prod.price.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-mono text-xs ${
                          prod.stock <= 5 ? 'text-red-400 font-bold' : 'text-neutral-300'
                        }`}
                      >
                        {prod.stock} in stock
                      </span>
                    </td>
                    <td className="py-3 px-4 text-neutral-400 font-mono">
                      {prod.category === 'Munchies' || prod.category === 'Cigarettes & Extras' || prod.abv === 0 ? prod.volume : `${prod.abv}% · ${prod.volume}`}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => setEditingProduct({ ...prod })}
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-[#d4af37] text-neutral-300 hover:text-black transition cursor-pointer"
                          title="Edit Drink/Snack & Price"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button with Prompt */}
                        <button
                          type="button"
                          onClick={() => setProductToDelete(prod)}
                          className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-600 text-red-400 hover:text-white transition cursor-pointer border border-red-500/30"
                          title="Delete Item from Inventory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: REAL-TIME ORDERS & STATUS TRACKING */}
      {activeSubTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Store Order Queue & Rider Assignments
            </h3>
            <span className="text-xs text-neutral-400">
              {orders.filter((o) => o.status !== 'delivered').length} active deliveries in progress
            </span>
          </div>

          <div className="space-y-4">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="p-5 rounded-2xl bg-[#121319] border border-neutral-800 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-mono font-bold text-white">
                        {ord.orderNumber}
                      </span>
                      <span className="text-xs font-semibold text-[#fae59e]">
                        {ord.customerName}
                      </span>
                      <span className="text-xs font-mono text-neutral-400">
                        ({ord.safaricomPhone})
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {ord.location.estate} · {ord.location.address} · {ord.deliverySchedule}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-[#1e1c14] border border-[#d4af37]/40 text-[#fae59e] font-mono">
                      +{ord.pointsEarned || 10} Points
                    </span>

                    <a
                      href={generateWhatsAppLink(ord, settings)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-xs text-emerald-300 font-semibold flex items-center gap-1.5 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Send to My WhatsApp</span>
                    </a>

                    <span className="text-base font-mono font-bold text-[#fae59e] ml-2">
                      KES {ord.total.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-xs">
                  <div>
                    <span className="text-neutral-400 block mb-1 text-[11px] uppercase">
                      Ordered Drinks & Snacks:
                    </span>
                    <p className="text-neutral-200">
                      {ord.items.map((i) => `${i.quantity}x ${i.product.name}`).join(', ')}
                    </p>
                  </div>

                  <div>
                    <label className="text-neutral-400 block mb-1 text-[11px] uppercase">
                      Assigned Delivery Rider:
                    </label>
                    <select
                      value={ord.assignedRiderId || ''}
                      onChange={(e) => onAssignRider(ord.id, e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#0e0f14] border border-neutral-700 text-white text-xs cursor-pointer focus:border-[#d4af37]"
                    >
                      <option value="">Unassigned</option>
                      {riders.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.vehiclePlate}) - {r.phone}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-neutral-400 block mb-1 text-[11px] uppercase">
                      Real-Time Status:
                    </label>
                    <select
                      value={ord.status}
                      onChange={(e) => onUpdateOrderStatus(ord.id, e.target.value as OrderStatus)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#0e0f14] border border-neutral-700 text-white text-xs cursor-pointer focus:border-[#d4af37]"
                    >
                      <option value="pending">1. Order Pending</option>
                      <option value="confirmed">2. Confirmed by Store</option>
                      <option value="rider_assigned">3. Rider Assigned</option>
                      <option value="out_for_delivery">4. Out for Delivery</option>
                      <option value="arrived">5. Arrived at Destination</option>
                      <option value="delivered">6. Delivered & Paid via Kopo Kopo</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: RIDERS PORTAL & MULTI-CONTACT MANAGEMENT */}
      {activeSubTab === 'riders' && (
        <div className="space-y-8">
          {/* Add New Rider Form with multiple contacts */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#121319] border border-[#d4af37]/30">
            <div className="flex items-center gap-2 mb-1">
              <Bike className="w-5 h-5 text-[#d4af37]" />
              <h3 className="text-base font-serif font-bold text-white">
                Register New Rider Plus Contacts
              </h3>
            </div>
            <p className="text-xs text-neutral-400 mb-4">
              Add riders with their primary Safaricom line, alternative contact/WhatsApp, bike plate, and delivery base.
            </p>

            <form onSubmit={handleAddRiderSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Rider Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kelvin Otieno"
                    value={newRiderName}
                    onChange={(e) => setNewRiderName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Primary Safaricom No. *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0722 890 123"
                    value={newRiderPhone}
                    onChange={(e) => setNewRiderPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Alternative Contact / WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="e.g. 0711 556 789"
                    value={newRiderAltPhone}
                    onChange={(e) => setNewRiderAltPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Motorbike Plate *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KMDF 829X"
                    value={newRiderPlate}
                    onChange={(e) => setNewRiderPlate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-xs text-white font-mono uppercase focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Assigned Base / Zone</label>
                  <select
                    value={newRiderZone}
                    onChange={(e) => setNewRiderZone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37] cursor-pointer"
                  >
                    <option value="Kilimani Hub">Kilimani Hub</option>
                    <option value="Westlands Base">Westlands Base</option>
                    <option value="CBD Station">CBD Station</option>
                    <option value="Karen / Hardy Base">Karen / Hardy Base</option>
                    <option value="Roysambu & Thika Rd">Roysambu & Thika Rd</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#aa801a] text-black font-semibold text-xs tracking-wider uppercase hover:brightness-110 transition cursor-pointer shadow"
                >
                  Save Rider Plus Contacts
                </button>
              </div>
            </form>
          </div>

          {/* Active Riders Directory with Multiple Contacts */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 px-1">
              Active Delivery Fleet & Contacts ({riders.length} Riders)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {riders.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-xl bg-[#121319] border border-neutral-800 flex items-start justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#201d14] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shrink-0">
                      <Bike className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-white">{r.name}</h4>
                      <div className="text-xs text-neutral-300 space-y-0.5">
                        <p className="flex items-center gap-1 font-mono text-[#fae59e]">
                          <Phone className="w-3 h-3 text-[#d4af37]" />
                          <span>Main: {r.phone}</span>
                        </p>
                        {r.altPhone && (
                          <p className="flex items-center gap-1 font-mono text-neutral-400 text-[11px]">
                            <Phone className="w-3 h-3 text-neutral-500" />
                            <span>Alt: {r.altPhone}</span>
                          </p>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-neutral-400">
                        Plate: {r.vehiclePlate} {r.zone ? `· ${r.zone}` : ''}
                      </p>
                      <div className="flex items-center gap-2 pt-1 text-[10px] text-neutral-400">
                        <span>⭐ {r.rating}</span>
                        <span>·</span>
                        <span>{r.completedDeliveries} completed</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingRider({ ...r })}
                      className="p-1.5 text-neutral-400 hover:text-[#d4af37] hover:bg-[#1f2230] rounded-lg transition"
                      title="Edit Rider Details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRiderToDelete(r)}
                      className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition"
                      title="Remove Rider"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SETTINGS & POINTS CONFIG */}
      {activeSubTab === 'settings' && (
        <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-[#121319] border border-[#d4af37]/30 space-y-6">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#fae59e] font-semibold">
              Owner Integrations & Points
            </span>
            <h3 className="text-xl font-serif font-bold text-white mt-1">
              WhatsApp Order Alerts, Kopo Kopo & Customer Loyalty
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Configure order dispatch notifications and points awarded to customer profiles.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* 1. WhatsApp Dispatch & Support Section */}
            <div className="p-4 rounded-xl bg-[#0e1017] border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <MessageCircle className="w-4 h-4 fill-emerald-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">Direct WhatsApp Dispatch & Orders</h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                  Target: 0712610337
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Store Owner WhatsApp Mobile Number *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MessageSquare className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={tempSettings.ownerWhatsAppPhone}
                      onChange={(e) =>
                        setTempSettings({ ...tempSettings, ownerWhatsAppPhone: e.target.value })
                      }
                      placeholder="e.g. 254712610337 or 0712610337"
                      className="w-full pl-9 pr-3 py-2 bg-[#12141d] border border-neutral-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <a
                    href={getDirectWhatsAppUrl(tempSettings.ownerWhatsAppPhone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
                    title="Test WhatsApp connection to 0712610337"
                  >
                    <span>Test WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  All customer order summaries, GPS locations, and munchies dispatches are automatically forwarded to this WhatsApp line.
                </p>
              </div>
            </div>

            {/* 2. Kopo Kopo Buy Goods & Live API Credentials Section */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#0e1017] border border-[#d4af37]/35 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0b3b60] to-[#042035] border border-sky-400/40 flex items-center justify-center text-sky-400 font-bold text-sm font-mono">
                    K2
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      Kopo Kopo M-PESA Live Gateway Integration
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      Till 349797 Lipa na M-PESA & Automated STK Push Credentials
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Till 349797 Live
                  </span>
                </div>
              </div>

              {/* Till Number Field */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Kopo Kopo Buy Goods Till Number *
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-[#d4af37] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={tempSettings.kopoKopoTillNumber}
                    onChange={(e) =>
                      setTempSettings({ ...tempSettings, kopoKopoTillNumber: e.target.value })
                    }
                    placeholder="349797"
                    className="w-full pl-9 pr-3 py-2 bg-[#12141d] border border-neutral-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
                <p className="text-[11px] text-[#fae59e] mt-1 font-mono">
                  Official Store Till: <strong>{tempSettings.kopoKopoTillNumber}</strong> (Shown on customer checkout and payment slips).
                </p>
              </div>

              {/* Environment Toggle: Production vs Sandbox */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Kopo Kopo Environment
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      setTempSettings({
                        ...tempSettings,
                        kopoKopoCredentials: {
                          ...(tempSettings.kopoKopoCredentials || {
                            clientId: '',
                            clientSecret: '',
                            apiKey: '',
                            webhookSecret: '',
                            liveStatus: 'unconfigured',
                          }),
                          environment: 'production',
                        },
                      })
                    }
                    className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition cursor-pointer ${
                      tempSettings.kopoKopoCredentials?.environment === 'production'
                        ? 'bg-emerald-950/60 border-emerald-500 text-white font-semibold'
                        : 'bg-[#12141d] border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div>
                      <span className="block text-xs">Production (Live)</span>
                      <span className="text-[10px] text-neutral-400 font-mono">api.kopokopo.com</span>
                    </div>
                    {tempSettings.kopoKopoCredentials?.environment === 'production' && (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setTempSettings({
                        ...tempSettings,
                        kopoKopoCredentials: {
                          ...(tempSettings.kopoKopoCredentials || {
                            clientId: '',
                            clientSecret: '',
                            apiKey: '',
                            webhookSecret: '',
                            liveStatus: 'unconfigured',
                          }),
                          environment: 'sandbox',
                        },
                      })
                    }
                    className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition cursor-pointer ${
                      tempSettings.kopoKopoCredentials?.environment === 'sandbox'
                        ? 'bg-sky-950/60 border-sky-500 text-white font-semibold'
                        : 'bg-[#12141d] border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div>
                      <span className="block text-xs">Sandbox (Test)</span>
                      <span className="text-[10px] text-neutral-400 font-mono">api-sandbox.kopokopo.com</span>
                    </div>
                    {tempSettings.kopoKopoCredentials?.environment === 'sandbox' && (
                      <CheckCircle className="w-4 h-4 text-sky-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Live Credentials Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center justify-between">
                    <span>K2 Application Client ID</span>
                    <span className="text-[10px] text-neutral-500 font-mono">kopokopo.com</span>
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={tempSettings.kopoKopoCredentials?.clientId || ''}
                      onChange={(e) =>
                        setTempSettings({
                          ...tempSettings,
                          kopoKopoCredentials: {
                            ...(tempSettings.kopoKopoCredentials || {
                              environment: 'production',
                              apiKey: '',
                              webhookSecret: '',
                              liveStatus: 'unconfigured',
                            }),
                            clientId: e.target.value,
                            clientSecret: tempSettings.kopoKopoCredentials?.clientSecret || '',
                          },
                        })
                      }
                      placeholder="e.g. k2_client_id_live_..."
                      className="w-full pl-9 pr-3 py-2 bg-[#12141d] border border-neutral-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center justify-between">
                    <span>K2 Client Secret</span>
                    <button
                      type="button"
                      onClick={() => setShowK2Secret(!showK2Secret)}
                      className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1"
                    >
                      {showK2Secret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showK2Secret ? 'Hide' : 'Show'}</span>
                    </button>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                    <input
                      type={showK2Secret ? 'text' : 'password'}
                      value={tempSettings.kopoKopoCredentials?.clientSecret || ''}
                      onChange={(e) =>
                        setTempSettings({
                          ...tempSettings,
                          kopoKopoCredentials: {
                            ...(tempSettings.kopoKopoCredentials || {
                              environment: 'production',
                              apiKey: '',
                              webhookSecret: '',
                              liveStatus: 'unconfigured',
                            }),
                            clientSecret: e.target.value,
                            clientId: tempSettings.kopoKopoCredentials?.clientId || '',
                          },
                        })
                      }
                      placeholder="••••••••••••••••••••"
                      className="w-full pl-9 pr-3 py-2 bg-[#12141d] border border-neutral-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    API Key / Application Token (Optional)
                  </label>
                  <input
                    type="text"
                    value={tempSettings.kopoKopoCredentials?.apiKey || ''}
                    onChange={(e) =>
                      setTempSettings({
                        ...tempSettings,
                        kopoKopoCredentials: {
                          ...(tempSettings.kopoKopoCredentials || {
                            environment: 'production',
                            clientId: '',
                            clientSecret: '',
                            webhookSecret: '',
                            liveStatus: 'unconfigured',
                          }),
                          apiKey: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. k2_api_key_..."
                    className="w-full px-3 py-2 bg-[#12141d] border border-neutral-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Webhook Signature Secret (Optional)
                  </label>
                  <input
                    type="text"
                    value={tempSettings.kopoKopoCredentials?.webhookSecret || ''}
                    onChange={(e) =>
                      setTempSettings({
                        ...tempSettings,
                        kopoKopoCredentials: {
                          ...(tempSettings.kopoKopoCredentials || {
                            environment: 'production',
                            clientId: '',
                            clientSecret: '',
                            apiKey: '',
                            liveStatus: 'unconfigured',
                          }),
                          webhookSecret: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. webhook_secret_..."
                    className="w-full px-3 py-2 bg-[#12141d] border border-neutral-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              {/* Webhook Endpoint for Kopo Kopo Webhook Subscriptions */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Kopo Kopo Webhook Callback URL (Copy & paste into your K2 Dashboard)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/api/kopokopo/webhook`}
                    className="flex-1 px-3 py-2 bg-[#08090d] border border-neutral-800 rounded-lg text-neutral-400 font-mono text-xs select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyWebhook}
                    className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
                  >
                    {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Test Live Connection Button & Status */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTestKopoKopoConnection}
                  disabled={k2TestState === 'testing'}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#1a1d28] hover:bg-[#222634] border border-[#d4af37]/40 text-[#fae59e] text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${k2TestState === 'testing' ? 'animate-spin text-[#d4af37]' : ''}`} />
                  <span>
                    {k2TestState === 'testing'
                      ? 'Validating Kopo Kopo Live Credentials...'
                      : 'Test & Verify Kopo Kopo Live Connection'}
                  </span>
                </button>

                {k2TestMessage && (
                  <div
                    className={`mt-2 p-3 rounded-lg text-xs flex items-start gap-2 ${
                      k2TestState === 'success'
                        ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-300'
                        : 'bg-amber-950/60 border border-amber-500/40 text-amber-200'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                    <span>{k2TestMessage}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Award Points Per Order
                </label>
                <div className="relative">
                  <Award className="w-4 h-4 text-[#d4af37] absolute left-3 top-2.5" />
                  <input
                    type="number"
                    value={tempSettings.pointsPerOrder}
                    onChange={(e) =>
                      setTempSettings({ ...tempSettings, pointsPerOrder: Number(e.target.value) })
                    }
                    className="w-full pl-9 pr-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-white font-mono text-xs focus:border-[#d4af37]"
                  />
                </div>
                <p className="text-[10px] text-neutral-500 mt-0.5">Credited to customer order profile</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  KES Discount Per Point
                </label>
                <input
                  type="number"
                  value={tempSettings.pointValueInKes}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, pointValueInKes: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-white font-mono text-xs focus:border-[#d4af37]"
                />
                <p className="text-[10px] text-neutral-400 mt-0.5">e.g. 1 KES per pt (20 points = 20 Ksh, redeemable anytime)</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Delivery Fee (KES)
                </label>
                <input
                  type="number"
                  value={tempSettings.deliveryFee}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, deliveryFee: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-white font-mono text-xs focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Min Order Amount (KES)
                </label>
                <input
                  type="number"
                  value={tempSettings.minimumOrder}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, minimumOrder: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-white font-mono text-xs focus:border-[#d4af37]"
                />
              </div>
            </div>

            {settingsSavedMessage && (
              <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Store settings & points configuration saved!</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa801a] text-black font-semibold text-xs tracking-wider uppercase hover:brightness-110 transition cursor-pointer"
            >
              Save Owner Settings
            </button>
          </form>
        </div>
      )}

      {/* EDIT MODAL WITH PHOTO UPLOAD FROM COMPUTER */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl my-6 p-6 rounded-2xl bg-[#121319] border border-[#d4af37]/40 shadow-2xl text-left">
            <button
              onClick={() => setEditingProduct(null)}
              className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-serif font-bold text-white mb-1">
              Edit Item & Pricing
            </h3>
            <p className="text-xs text-neutral-400 mb-5">
              Update bottle/snack details, price in KES, and upload 300px photos directly from your computer.
            </p>

            <form onSubmit={handleSaveEditProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-white text-xs focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.brand}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, brand: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-white text-xs focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Category</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        category: e.target.value as Category,
                      })
                    }
                    className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-white text-xs focus:border-[#d4af37] cursor-pointer"
                  >
                    <option value="Whiskey">Whiskey</option>
                    <option value="Vodka">Vodka</option>
                    <option value="Spirits & Liquors">Spirits & Liquors</option>
                    <option value="Gin">Gin</option>
                    <option value="Brandy">Brandy</option>
                    <option value="Wines">Wines</option>
                    <option value="Beer">Beer</option>
                    <option value="Munchies">🍿 Munchies (Snacks)</option>
                    <option value="Cigarettes & Extras">🚬 Cigarettes & Extras</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Price (KES) *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-white font-mono text-xs focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Stock Count</label>
                  <input
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        stock: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-white font-mono text-xs focus:border-[#d4af37]"
                  />
                </div>
              </div>

              {/* PHOTO UPLOAD FROM COMPUTER OR URL */}
              <div className="p-4 rounded-xl bg-[#171922] border border-neutral-800 space-y-3">
                <label className="block text-xs font-semibold text-white flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Product Photo (Instant 300px Rendering)</span>
                  </span>
                  <span className="text-[10px] text-[#fae59e]">Live Preview</span>
                </label>

                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg bg-[#0c0d12] border border-neutral-700 overflow-hidden shrink-0 flex items-center justify-center shadow">
                    <ProductImage
                      src={editingProduct.imageUrl}
                      alt="Preview"
                      category={editingProduct.category}
                      name={editingProduct.name}
                      width={64}
                      height={64}
                      className="w-full h-full rounded-lg"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, 'edit')}
                        disabled={isCompressingPhoto}
                        className="block w-full text-xs text-neutral-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#d4af37] file:text-black hover:file:brightness-110 cursor-pointer disabled:opacity-50"
                      />
                      {isCompressingPhoto ? (
                        <p className="text-[11px] text-[#fae59e] mt-1 animate-pulse font-medium">
                          ⚡ Optimizing photo to 300px for instant loading...
                        </p>
                      ) : (
                        <p className="text-[10px] text-neutral-400 mt-1">
                          Photos from computer or phone are automatically optimized for instant web rendering.
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="block text-[10px] text-neutral-400 uppercase font-mono">Or paste Image URL:</span>
                      <input
                        type="text"
                        placeholder="https://... or /images/..."
                        value={editingProduct.imageUrl?.startsWith('data:') ? '' : (editingProduct.imageUrl || '')}
                        onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                        className="w-full mt-0.5 px-2.5 py-1.5 bg-[#0e0f14] border border-neutral-700 rounded-lg text-white text-xs focus:border-[#d4af37]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Volume / Pack Size</label>
                  <input
                    type="text"
                    value={editingProduct.volume}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, volume: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-white text-xs focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-300 mb-1">ABV (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingProduct.abv}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, abv: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-white text-xs focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingProduct.description}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-white text-xs focus:border-[#d4af37]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-lg border border-neutral-700 text-neutral-300 text-xs hover:bg-neutral-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#aa801a] text-black font-semibold text-xs tracking-wider uppercase hover:brightness-110 transition flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD DRINK / SNACK MODAL */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl my-6 p-6 rounded-2xl bg-[#121319] border border-[#d4af37]/40 shadow-2xl text-left">
            <button
              onClick={() => setIsAddProductModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-serif font-bold text-white mb-1">
              Add New Drink or Munchies Snack
            </h3>
            <p className="text-xs text-neutral-400 mb-5">
              Fill in product details and upload a photo directly from your local computer.
            </p>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chili Garlic Cashews / Gin"
                    value={newProductForm.name}
                    onChange={(e) =>
                      setNewProductForm({ ...newProductForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-white text-xs focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pewa Kitchen"
                    value={newProductForm.brand}
                    onChange={(e) =>
                      setNewProductForm({ ...newProductForm, brand: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-white text-xs focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Category</label>
                  <select
                    value={newProductForm.category}
                    onChange={(e) =>
                      setNewProductForm({
                        ...newProductForm,
                        category: e.target.value as Category,
                      })
                    }
                    className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-white text-xs focus:border-[#d4af37] cursor-pointer"
                  >
                    <option value="Whiskey">Whiskey</option>
                    <option value="Vodka">Vodka</option>
                    <option value="Spirits & Liquors">Spirits & Liquors</option>
                    <option value="Gin">Gin</option>
                    <option value="Brandy">Brandy</option>
                    <option value="Wines">Wines</option>
                    <option value="Beer">Beer</option>
                    <option value="Munchies">🍿 Munchies (Snacks)</option>
                    <option value="Cigarettes & Extras">🚬 Cigarettes & Extras</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Price (KES) *</label>
                  <input
                    type="number"
                    required
                    value={newProductForm.price}
                    onChange={(e) =>
                      setNewProductForm({
                        ...newProductForm,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-white font-mono text-xs focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Stock</label>
                  <input
                    type="number"
                    value={newProductForm.stock}
                    onChange={(e) =>
                      setNewProductForm({
                        ...newProductForm,
                        stock: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-white font-mono text-xs focus:border-[#d4af37]"
                  />
                </div>
              </div>

              {/* PHOTO UPLOAD FROM COMPUTER OR URL */}
              <div className="p-4 rounded-xl bg-[#171922] border border-neutral-800 space-y-3">
                <label className="block text-xs font-semibold text-white flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Upload Photo From Computer or Phone (300px Rendering)</span>
                  </span>
                  <span className="text-[10px] text-[#fae59e]">Instant Preview</span>
                </label>

                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg bg-[#0c0d12] border border-neutral-700 overflow-hidden shrink-0 flex items-center justify-center shadow">
                    <ProductImage
                      src={newProductForm.imageUrl}
                      alt="Preview"
                      category={newProductForm.category as Category}
                      name={newProductForm.name}
                      width={64}
                      height={64}
                      className="w-full h-full rounded-lg"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, 'add')}
                        disabled={isCompressingPhoto}
                        className="block w-full text-xs text-neutral-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#d4af37] file:text-black hover:file:brightness-110 cursor-pointer disabled:opacity-50"
                      />
                      {isCompressingPhoto ? (
                        <p className="text-[11px] text-[#fae59e] mt-1 animate-pulse font-medium">
                          ⚡ Optimizing photo to 300px for instant loading...
                        </p>
                      ) : (
                        <p className="text-[10px] text-neutral-400 mt-1">
                          Photos from computer or phone are automatically optimized for instant web rendering.
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="block text-[10px] text-neutral-400 uppercase font-mono">Or paste Image URL:</span>
                      <input
                        type="text"
                        placeholder="https://... or /images/..."
                        value={newProductForm.imageUrl?.startsWith('data:') ? '' : (newProductForm.imageUrl || '')}
                        onChange={(e) => setNewProductForm({ ...newProductForm, imageUrl: e.target.value })}
                        className="w-full mt-0.5 px-2.5 py-1.5 bg-[#0e0f14] border border-neutral-700 rounded-lg text-white text-xs focus:border-[#d4af37]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Volume / Pack Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 250g or 750ml"
                    value={newProductForm.volume}
                    onChange={(e) =>
                      setNewProductForm({ ...newProductForm, volume: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-white text-xs focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-300 mb-1">ABV (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 0 for snacks, 40 for spirits"
                    value={newProductForm.abv}
                    onChange={(e) =>
                      setNewProductForm({ ...newProductForm, abv: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-white text-xs focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Notes on ingredients, crunch, and pairing..."
                  value={newProductForm.description}
                  onChange={(e) =>
                    setNewProductForm({ ...newProductForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-white text-xs focus:border-[#d4af37]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-neutral-700 text-neutral-300 text-xs hover:bg-neutral-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#aa801a] text-black font-semibold text-xs tracking-wider uppercase hover:brightness-110 transition cursor-pointer"
                >
                  Save & Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE PRODUCT CONFIRMATION PROMPT MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md p-6 rounded-2xl bg-[#13141c] border border-red-500/40 shadow-2xl text-left">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">
                  Confirm Item Deletion
                </h4>
                <p className="text-xs text-neutral-400 mt-1">
                  Are you sure you want to permanently delete{' '}
                  <strong className="text-white">"{productToDelete.name}"</strong> from your store inventory?
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#0c0d12] border border-neutral-800 text-xs text-neutral-400 mb-5">
              Price: <span className="text-[#fae59e] font-mono">KES {productToDelete.price.toLocaleString()}</span> · Category: {productToDelete.category} · Stock: {productToDelete.stock}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 rounded-lg border border-neutral-700 text-neutral-300 text-xs hover:bg-neutral-800 transition cursor-pointer"
              >
                Cancel, Keep Item
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProduct(productToDelete.id);
                  setProductToDelete(null);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition cursor-pointer"
              >
                Yes, Delete Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE RIDER CONFIRMATION PROMPT */}
      {riderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md p-6 rounded-2xl bg-[#13141c] border border-red-500/40 shadow-2xl text-left">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">
                  Remove Delivery Rider
                </h4>
                <p className="text-xs text-neutral-400 mt-1">
                  Are you sure you want to remove rider{' '}
                  <strong className="text-white">{riderToDelete.name}</strong> ({riderToDelete.vehiclePlate})?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRiderToDelete(null)}
                className="px-4 py-2 rounded-lg border border-neutral-700 text-neutral-300 text-xs hover:bg-neutral-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteRider(riderToDelete.id);
                  setRiderToDelete(null);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition cursor-pointer"
              >
                Yes, Remove Rider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT RIDER MODAL */}
      {editingRider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg p-6 rounded-2xl bg-[#13141c] border border-[#d4af37]/40 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#221e14] border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37]">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">
                    Edit Delivery Rider Details
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Update phone numbers, motorbike registration plate, and zone.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRider(null)}
                className="p-1 text-neutral-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingRider.name || !editingRider.phone || !editingRider.vehiclePlate) return;
                onUpdateRider(editingRider);
                setEditingRider(null);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs text-neutral-300 mb-1">
                  Rider Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingRider.name}
                  onChange={(e) => setEditingRider({ ...editingRider, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">
                    Primary Safaricom Mobile No. *
                  </label>
                  <input
                    type="tel"
                    required
                    value={editingRider.phone}
                    onChange={(e) => setEditingRider({ ...editingRider, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-300 mb-1">
                    Alternative Contact / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={editingRider.altPhone || ''}
                    onChange={(e) => setEditingRider({ ...editingRider, altPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">
                    Motorbike Registration Plate *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingRider.vehiclePlate}
                    onChange={(e) =>
                      setEditingRider({ ...editingRider, vehiclePlate: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-xs text-white font-mono uppercase focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-300 mb-1">
                    Assigned Delivery Zone / Base
                  </label>
                  <select
                    value={editingRider.zone || 'Kilimani Hub'}
                    onChange={(e) => setEditingRider({ ...editingRider, zone: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0e0f14] border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37] cursor-pointer"
                  >
                    <option value="Kilimani Hub">Kilimani Hub</option>
                    <option value="Westlands Base">Westlands Base</option>
                    <option value="CBD Station">CBD Station</option>
                    <option value="Karen / Hardy Base">Karen / Hardy Base</option>
                    <option value="Roysambu & Thika Rd">Roysambu & Thika Rd</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#0c0d12] border border-neutral-800 text-xs">
                <div>
                  <span className="font-semibold text-white block">Rider Availability</span>
                  <span className="text-[11px] text-neutral-400">
                    {editingRider.isAvailable ? 'Active & receiving delivery assignments' : 'Off-duty / On break'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditingRider({ ...editingRider, isAvailable: !editingRider.isAvailable })
                  }
                  className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition cursor-pointer ${
                    editingRider.isAvailable
                      ? 'bg-emerald-900/60 border border-emerald-500/40 text-emerald-300'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {editingRider.isAvailable ? 'Available' : 'Unavailable'}
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRider(null)}
                  className="px-4 py-2 rounded-lg border border-neutral-700 text-neutral-300 text-xs hover:bg-neutral-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#aa801a] text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 transition cursor-pointer shadow flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Rider Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
