import React from 'react';
import { X, Plus, ShieldCheck, Check, Sparkles, MapPin, UtensilsCrossed } from 'lucide-react';
import { Product } from '../types';
import { ProductImage } from './ProductImage';

interface ProductQuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  if (!product) return null;

  const isSnack = product.category === 'Munchies';
  const isExtras = product.category === 'Cigarettes & Extras';
  const isNonAlcoholic = isSnack || isExtras || product.abv === 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md animate-fade-in overscroll-contain">
      <div className="min-h-full flex items-start sm:items-center justify-center p-3 sm:p-6 text-left">
        <div className="relative w-full max-w-2xl my-3 sm:my-8 p-5 sm:p-7 rounded-2xl bg-[#121319] border border-[#d4af37]/40 shadow-2xl text-left">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          {/* Item Showcase (300px by 300px fast loading) */}
          <div className="relative aspect-square rounded-xl bg-[#0c0d12] border border-neutral-800 overflow-hidden flex items-center justify-center p-3">
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              category={product.category}
              name={product.name}
              width={300}
              height={300}
              className="w-[300px] h-[300px] max-w-full max-h-full rounded-lg"
            />
            {isSnack ? (
              <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded text-[10px] bg-[#2a1e12] text-[#fae59e] border border-[#d4af37]/40 font-semibold flex items-center gap-1">
                <UtensilsCrossed className="w-3 h-3 text-[#d4af37]" />
                <span>Bar Munchies</span>
              </span>
            ) : isExtras ? (
              <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded text-[10px] bg-[#241a2e] text-[#e0e7ff] border border-indigo-500/40 font-semibold flex items-center gap-1">
                <span>🚬 Smokes & Extras</span>
              </span>
            ) : product.isLocal ? (
              <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded text-[10px] bg-[#221e14] text-[#fae59e] border border-[#d4af37]/40 font-semibold">
                Kenyan Distilled
              </span>
            ) : null}
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
                <span className="text-[#d4af37] uppercase tracking-wider">{product.brand}</span>
                <span>·</span>
                <span>{product.category}</span>
                <span>·</span>
                <span>{product.origin}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-white mt-1">
                {product.name}
              </h2>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-[#fae59e]">
                KES {product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-neutral-500 line-through font-mono">
                  KES {product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              {product.description}
            </p>

            {/* Specifications */}
            <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl bg-[#171922] border border-neutral-800 text-center text-xs">
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase">
                  {isSnack ? 'Type' : isExtras ? 'Category' : 'ABV'}
                </span>
                <span className="font-mono font-bold text-white">
                  {isSnack ? 'Fresh' : isExtras ? 'Smokes' : `${product.abv}%`}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase">
                  {isSnack ? 'Weight' : isExtras ? 'Packaging' : 'Volume'}
                </span>
                <span className="font-mono font-bold text-white">{product.volume}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase">Stock</span>
                <span className="font-mono font-bold text-emerald-400">{product.stock} units</span>
              </div>
            </div>

            {/* Tasting / Flavor Notes */}
            {product.tastingNotes && product.tastingNotes.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-neutral-300 block mb-1.5">
                  {isSnack ? 'Flavor & Ingredients:' : 'Tasting Profile:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {product.tastingNotes.map((note, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2 py-0.5 rounded bg-[#1f1d16] text-[#fae59e] border border-[#d4af37]/30"
                    >
                      {note}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onAddToCart(product);
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#aa801a] text-black font-semibold text-xs tracking-wider uppercase hover:brightness-110 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.25)]"
              >
                <Plus className="w-4 h-4" />
                <span>Add to Basket · Same-Day Delivery</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};
