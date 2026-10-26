import React, { useState } from 'react';
import { Plus, Eye, Check, UtensilsCrossed } from 'lucide-react';
import { Product } from '../types';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  isInCart?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onQuickView,
  isInCart = false,
}) => {
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  const isSnack = product.category === 'Munchies';
  const isExtras = product.category === 'Cigarettes & Extras';
  const isNonAlcoholic = isSnack || isExtras || product.abv === 0;

  return (
    <div
      onClick={() => onQuickView(product)}
      className="group relative flex flex-col rounded-2xl bg-[#121319] border border-neutral-800/90 hover:border-[#d4af37]/60 hover:shadow-[0_0_25px_rgba(212,175,55,0.15)] transition-all duration-300 overflow-hidden cursor-pointer"
    >
      {/* Category / Origin quiet top badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 flex-wrap">
        {(product.isCustom || product.updatedAt || product.createdAt) && (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#382b08] text-[#fae59e] border border-[#d4af37] tracking-wider shadow">
            ★ UPDATED / NEW
          </span>
        )}
        {isSnack ? (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#2a1e12] text-[#fae59e] border border-[#d4af37]/40 tracking-wide flex items-center gap-1">
            <UtensilsCrossed className="w-3 h-3 text-[#d4af37]" />
            <span>Munchies</span>
          </span>
        ) : isExtras ? (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#241a2e] text-[#e0e7ff] border border-indigo-500/40 tracking-wide flex items-center gap-1">
            <span>🚬 Extras</span>
          </span>
        ) : product.isLocal ? (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1a1811] text-[#fae59e] border border-[#d4af37]/40 tracking-wide">
            Kenya Original
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#14161f] text-neutral-400 border border-neutral-800">
            Imported
          </span>
        )}
      </div>

      {/* Stock warning if low */}
      {product.stock <= 5 && product.stock > 0 && (
        <span className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded text-[10px] font-mono bg-red-950/80 text-red-300 border border-red-800/50">
          Only {product.stock} left
        </span>
      )}

      {/* Product Image Stage: Standardized 300px by 300px for ultra-fast loading on slow connections */}
      <div className="relative w-full aspect-square bg-[#0c0d12] overflow-hidden flex items-center justify-center p-2 sm:p-3">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          category={product.category}
          name={product.name}
          width={300}
          height={300}
          className="w-full h-full rounded-xl transition-transform duration-500 group-hover:scale-105"
        />

        {/* Hover Quick View Trigger */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="py-1.5 px-3 rounded-lg bg-[#121319]/90 border border-[#d4af37]/40 text-xs font-medium text-[#f3e5ab] flex items-center gap-1.5 shadow-lg">
            <Eye className="w-3.5 h-3.5" />
            <span>{isSnack ? 'Snack Details' : 'Tasting Notes & Info'}</span>
          </span>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Unboxed Metadata Header (Zero-Pill Rule) */}
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-medium">
            <span className="uppercase tracking-wider text-[#d4af37]">{product.brand}</span>
            <span aria-hidden="true">·</span>
            <span>{product.volume}</span>
            {!isNonAlcoholic && (
              <>
                <span aria-hidden="true">·</span>
                <span>{product.abv}% ABV</span>
              </>
            )}
          </div>

          <h3 className="text-sm sm:text-base font-serif font-semibold text-white mt-1 group-hover:text-[#fae59e] transition-colors line-clamp-1">
            {product.name}
          </h3>

          <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Tasting / Flavor Notes as quiet subtle inline list */}
          {product.tastingNotes && product.tastingNotes.length > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 mt-2 truncate">
              <span className="text-[#d4af37]">{isSnack ? 'Flavor:' : isExtras ? 'Info:' : 'Notes:'}</span>
              <span className="truncate">{product.tastingNotes.join(' · ')}</span>
            </div>
          )}
        </div>

        {/* Price & Add to Cart Footer */}
        <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-serif font-bold text-[#fae59e] font-mono tabular-nums">
                KES {product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-xs text-neutral-500 line-through font-mono">
                  KES {product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            <span className="text-[10px] text-neutral-500 block">Same-day delivery</span>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className={`py-2 px-3.5 rounded-xl text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
              justAdded
                ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#aa801a] text-black hover:brightness-110 active:scale-95 shadow-[0_0_15px_rgba(212,175,55,0.2)]'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added!</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>{isInCart ? 'Add More' : 'Add to Basket'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
