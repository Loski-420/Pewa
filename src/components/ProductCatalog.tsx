import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Clock, ShieldCheck, UtensilsCrossed, Download, Award, MessageCircle } from 'lucide-react';
import { Product, Category, PriceFilter, PopularityFilter, CartItem } from '../types';
import { ProductCard } from './ProductCard';
import { ProductQuickViewModal } from './ProductQuickViewModal';
import { PewaAppIcon } from './PewaAppIcon';

interface ProductCatalogProps {
  products: Product[];
  cartItems: CartItem[];
  onAddToCart: (product: Product) => void;
  onOpenScheduleInCart: () => void;
  onOpenDownloadApp: () => void;
}

const CATEGORIES: { label: string; value: 'all' | Category }[] = [
  { label: 'All Items & Drinks', value: 'all' },
  { label: 'Whiskey', value: 'Whiskey' },
  { label: 'Vodka', value: 'Vodka' },
  { label: 'Spirits & Liquors', value: 'Spirits & Liquors' },
  { label: 'Gin', value: 'Gin' },
  { label: 'Brandy', value: 'Brandy' },
  { label: 'Wines', value: 'Wines' },
  { label: 'Beer', value: 'Beer' },
  { label: '🍿 Munchies', value: 'Munchies' },
  { label: '🚬 Cigarettes & Extras', value: 'Cigarettes & Extras' },
];

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  cartItems,
  onAddToCart,
  onOpenScheduleInCart,
  onOpenDownloadApp,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | Category>('all');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [popularityFilter, setPopularityFilter] = useState<PopularityFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const cartProductIds = useMemo(() => new Set(cartItems.map((i) => i.product.id)), [cartItems]);

  // Filter & sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Category Filter with case-insensitivity and synonym handling
        if (selectedCategory !== 'all') {
          const cat = (p.category || '').toLowerCase();
          const sel = selectedCategory.toLowerCase();
          if (sel === 'munchies') {
            if (!cat.includes('munch') && !cat.includes('snack') && !cat.includes('bite') && !cat.includes('bittings')) return false;
          } else if (sel === 'spirits & liquors') {
            if (!cat.includes('spirit') && !cat.includes('liquor') && !cat.includes('tequila') && !cat.includes('aperitivo')) return false;
          } else if (sel === 'cigarettes & extras') {
            if (!cat.includes('cigar') && !cat.includes('extra') && !cat.includes('smoke') && !cat.includes('chaser')) return false;
          } else if (sel === 'vodka') {
            if (!cat.includes('vodka')) return false;
          } else if (cat !== sel) {
            return false;
          }
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchBrand = p.brand.toLowerCase().includes(q);
          const matchCategory = p.category.toLowerCase().includes(q);
          const matchOrigin = p.origin.toLowerCase().includes(q);
          const matchNotes = p.tastingNotes?.some((n) => n.toLowerCase().includes(q));
          if (!matchName && !matchBrand && !matchCategory && !matchOrigin && !matchNotes) {
            return false;
          }
        }

        // Price Filter
        if (priceFilter === 'under2k' && p.price >= 2000) return false;
        if (priceFilter === '2k-5k' && (p.price < 2000 || p.price > 5000)) return false;
        if (priceFilter === '5k-10k' && (p.price < 5000 || p.price > 10000)) return false;
        if (priceFilter === 'above10k' && p.price <= 10000) return false;

        // Popularity Filter
        if (popularityFilter === 'popular' && p.popularityScore < 94) return false;
        if (popularityFilter === 'local-legend' && !p.isLocal) return false;
        if (popularityFilter === 'reserve' && p.price < 5000 && !p.name.includes('Single Malt')) return false;

        return true;
      })
      .sort((a, b) => {
        if (priceFilter === 'price-asc') return a.price - b.price;
        if (priceFilter === 'price-desc') return b.price - a.price;
        if (popularityFilter === 'popular') return (b.popularityScore || 0) - (a.popularityScore || 0);
        // Prioritize newly added or edited admin items at the very top so changes reflect instantly
        const aCustomTime = a.updatedAt || a.createdAt || (a.isCustom ? 1000 : 0);
        const bCustomTime = b.updatedAt || b.createdAt || (b.isCustom ? 1000 : 0);
        if (aCustomTime !== bCustomTime) {
          return bCustomTime - aCustomTime;
        }
        return (b.popularityScore || 0) - (a.popularityScore || 0);
      });
  }, [products, selectedCategory, priceFilter, popularityFilter, searchQuery]);

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Showcase Banner */}
      <section className="relative overflow-hidden border-b border-[#d4af37]/20 bg-[#0c0d12]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-5 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b1912] border border-[#d4af37]/40 text-[#fae59e] text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Nairobi Express Spirits & Munchies Delivery (Earn 20 Points Per Order!)</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-extrabold text-white leading-tight tracking-tight text-balance">
              PEWA EXTRAORDINARY<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fae59e] via-[#d4af37] to-[#aa801a]">
                DRINKS &MUNCHIES
              </span>
            </h1>

            <p className="text-sm sm:text-base text-neutral-300 max-w-xl leading-relaxed">
              Browse Kenya's finest collection of single malts, botanical gins, aged cognacs, estate wines, craft beers, and savory bar munchies. Get 20 redeemable points with every delivery order (20 points = 20 Ksh, redeemable anytime)!
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onOpenScheduleInCart}
                className="py-3 px-5 sm:px-6 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#aa801a] text-black font-semibold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition cursor-pointer shadow-[0_0_25px_rgba(212,175,55,0.25)] flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                <span>Schedule Same-Day Delivery</span>
              </button>

              <a
                href="https://wa.me/254712610337?text=Hello%20Pewa%2C%20I%20would%20like%20to%20order%20drinks%20or%20snacks."
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/90 text-xs font-semibold tracking-wide transition cursor-pointer flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              >
                <MessageCircle className="w-4 h-4 fill-emerald-400 text-emerald-400" />
                <span>WhatsApp (0712610337)</span>
              </a>

              <button
                type="button"
                onClick={onOpenDownloadApp}
                className="py-3 px-4 rounded-xl bg-[#171a26] border border-[#d4af37]/60 text-white hover:border-[#d4af37] text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-2 shadow-sm hover:shadow-[0_0_20px_rgba(212,175,55,0.2)]"
              >
                <PewaAppIcon size={20} />
                <span>Download App</span>
                <Download className="w-3.5 h-3.5 text-[#d4af37]" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('Munchies')}
                className="py-3 px-4 rounded-xl bg-[#14151e] border border-neutral-800 text-neutral-300 hover:text-white text-xs font-medium tracking-wide transition cursor-pointer flex items-center gap-1.5"
              >
                <UtensilsCrossed className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Munchies</span>
              </button>
            </div>

            {/* Quick trust bar: Till 349797 & WhatsApp */}
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-neutral-400">
              <div className="flex items-center gap-1.5 font-mono text-[#fae59e]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Lipa na Kopo Kopo Till: <strong>349797</strong></span>
              </div>
              <span className="text-neutral-600 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5 text-neutral-300">
                <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>45-Min Express Courier Across Nairobi</span>
              </div>
            </div>
          </div>

          {/* Right Hero Image Card - Official Pewa Brand Showcase & Logo */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[16/10] sm:aspect-[4/3] rounded-2xl overflow-hidden border border-[#d4af37]/40 shadow-[0_0_40px_rgba(212,175,55,0.25)] bg-[#0d0e15] flex items-center justify-center p-3 group">
              <img
                src="/assets/aistudio/Pewa__1__1da1bb82.jpg"
                alt="Pewa Official Courier Logo"
                className="max-h-full max-w-full object-contain rounded-full shadow-2xl transition-transform duration-700 group-hover:scale-105"
                loading="eager"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/pewa-logo.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none rounded-2xl" />


              {/* Till Badge Top Right */}
              <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/80 border border-[#d4af37]/40 shadow-lg backdrop-blur-md text-[#fae59e] text-xs font-mono font-semibold">
                <span>Till: 349797</span>
              </div>

              {/* Bottom Hero Overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-neutral-200 z-10 p-3 rounded-xl bg-black/85 border border-[#d4af37]/40 backdrop-blur-md shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-white">20 Pts = 20 Ksh</span>
                  <span className="text-neutral-500 hidden sm:inline">•</span>
                  <span className="text-[#fae59e] text-[11px] hidden sm:inline">Redeemable Anytime</span>
                </div>
                <span className="font-mono text-[11px] text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/40">
                  45-Min Express Delivery
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download Web App Promo Banner Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#161824] via-[#1a1c2d] to-[#161824] border border-[#d4af37]/35 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shrink-0 drop-shadow-md">
              <PewaAppIcon size={48} className="rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-serif font-bold text-white">
                  Get The Pewa Web App
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-medium border border-emerald-800/40">
                  Instant Access
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-0.5">
                Install directly on your phone home screen for live rider GPS tracking & instant reordering.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenDownloadApp}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa801a] text-black font-semibold text-xs tracking-wider uppercase hover:brightness-110 active:scale-95 transition cursor-pointer shrink-0 flex items-center gap-2 shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download App Now</span>
          </button>
        </div>
      </section>

      {/* Main Catalog Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Category Tabs & Filter Toolbar */}
        <div className="space-y-4">
          {/* Category Tabs: Whiskey, Gin, Brandy, Wines, Beer, Munchies */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#121319] border border-neutral-800 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setSelectedCategory(cat.value)}
                className={`py-2 px-4 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  selectedCategory === cat.value
                    ? 'bg-[#d4af37] text-black shadow-md font-bold'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search & Dropdown Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search spirits, beers, biltong, nuts (e.g. Tusker, Biltong, Glenhaven)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#121319] border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#d4af37] transition"
              />
            </div>

            {/* Price Dropdown Filter */}
            <div className="sm:col-span-3">
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value as PriceFilter)}
                className="w-full bg-[#121319] border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37] cursor-pointer"
              >
                <option value="all">Price: All Ranges</option>
                <option value="under2k">Under KES 2,000</option>
                <option value="2k-5k">KES 2,000 - 5,000</option>
                <option value="5k-10k">KES 5,000 - 10,000</option>
                <option value="above10k">Above KES 10,000</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>

            {/* Brand Popularity Dropdown Filter */}
            <div className="sm:col-span-3">
              <select
                value={popularityFilter}
                onChange={(e) => setPopularityFilter(e.target.value as PopularityFilter)}
                className="w-full bg-[#121319] border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37] cursor-pointer"
              >
                <option value="all">Popularity: All Brands</option>
                <option value="popular">Top Rated & Most Popular</option>
                <option value="local-legend">Kenyan Legends (Local Spirits & Bites)</option>
                <option value="reserve">Master Reserve & Single Malts</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
          <span>
            Showing <strong className="text-white font-mono">{filteredProducts.length}</strong> items in{' '}
            <strong className="text-[#fae59e]">
              {selectedCategory === 'all'
                ? 'All Items & Drinks'
                : selectedCategory === 'Munchies'
                ? 'Munchies & Snacks'
                : selectedCategory === 'Cigarettes & Extras'
                ? 'Cigarettes & Extras'
                : selectedCategory}
            </strong>
          </span>
          {(searchQuery || priceFilter !== 'all' || popularityFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setPriceFilter('all');
                setPopularityFilter('all');
              }}
              className="text-[#d4af37] hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center rounded-2xl bg-[#121319] border border-neutral-800">
            <p className="text-base font-serif text-neutral-300">No items match your filter criteria.</p>
            <p className="text-xs text-neutral-500 mt-1">Try resetting the price or category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                onQuickView={setQuickViewProduct}
                isInCart={cartProductIds.has(product.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Quick View Modal */}
      <ProductQuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={onAddToCart}
      />
    </div>
  );
};
