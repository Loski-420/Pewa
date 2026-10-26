import { Category } from '../types';

/**
 * Generates an elegant inline SVG data URI as an unbreakable fallback
 * for product images if external assets fail to load or are blocked.
 */
export function getCategoryFallbackImage(category?: Category | string, name?: string): string {
  const cat = category || 'Spirits';
  const title = name ? name.substring(0, 18) : cat;

  let iconSvg = '';
  switch (cat) {
    case 'Whiskey':
      iconSvg = `
        <rect x="85" y="45" width="30" height="20" rx="3" fill="#d4af37" />
        <rect x="95" y="25" width="10" height="20" fill="#a17a22" />
        <path d="M70 65 C70 60 75 55 85 55 L115 55 C125 55 130 60 130 65 L135 150 C135 158 128 165 120 165 L80 165 C72 165 65 158 65 150 Z" fill="#d4af37" opacity="0.85" />
        <rect x="75" y="85" width="50" height="40" rx="4" fill="#121319" stroke="#fae59e" stroke-width="2" />
        <text x="100" y="105" fill="#fae59e" font-size="10" font-family="sans-serif" font-weight="bold" text-anchor="middle">WHISKEY</text>
        <text x="100" y="118" fill="#ffffff" font-size="7" font-family="sans-serif" text-anchor="middle">PEWA</text>
      `;
      break;
    case 'Gin':
      iconSvg = `
        <circle cx="100" cy="95" r="45" fill="#38bdf8" opacity="0.25" stroke="#38bdf8" stroke-width="2" />
        <rect x="93" y="25" width="14" height="25" rx="2" fill="#38bdf8" />
        <path d="M80 50 L120 50 L125 145 C125 155 118 160 110 160 L90 160 C82 160 75 155 75 145 Z" fill="#0284c7" opacity="0.7" stroke="#7dd3fc" stroke-width="2" />
        <rect x="80" y="80" width="40" height="40" rx="20" fill="#0c1017" stroke="#38bdf8" stroke-width="1.5" />
        <text x="100" y="103" fill="#38bdf8" font-size="9" font-family="sans-serif" font-weight="bold" text-anchor="middle">BOTANICAL</text>
      `;
      break;
    case 'Brandy':
      iconSvg = `
        <ellipse cx="100" cy="115" rx="40" ry="35" fill="#b45309" opacity="0.8" stroke="#f59e0b" stroke-width="2" />
        <rect x="93" y="35" width="14" height="45" fill="#78350f" />
        <path d="M88 45 L112 45 L118 80 L82 80 Z" fill="#d97706" />
        <rect x="80" y="98" width="40" height="30" rx="3" fill="#1c1917" stroke="#d4af37" stroke-width="1.5" />
        <text x="100" y="116" fill="#f59e0b" font-size="9" font-family="sans-serif" font-weight="bold" text-anchor="middle">COGNAC</text>
      `;
      break;
    case 'Wines':
      iconSvg = `
        <path d="M92 25 H108 V55 L120 85 V155 H80 V85 L92 55 Z" fill="#881337" opacity="0.9" stroke="#fda4af" stroke-width="1.5" />
        <rect x="94" y="20" width="12" height="8" rx="1" fill="#e11d48" />
        <rect x="85" y="95" width="30" height="35" rx="2" fill="#fff1f2" />
        <text x="100" y="114" fill="#881337" font-size="8" font-family="sans-serif" font-weight="bold" text-anchor="middle">VINTAGE</text>
      `;
      break;
    case 'Beer':
      iconSvg = `
        <rect x="75" y="45" width="45" height="110" rx="10" fill="#eab308" opacity="0.85" stroke="#fef08a" stroke-width="2" />
        <path d="M120 70 H135 C142 70 145 75 145 85 V115 C145 125 142 130 135 130 H120" stroke="#fef08a" stroke-width="5" stroke-linecap="round" fill="none" />
        <ellipse cx="97" cy="45" rx="25" ry="10" fill="#ffffff" />
        <circle cx="85" cy="40" r="12" fill="#ffffff" />
        <circle cx="105" cy="38" r="14" fill="#ffffff" />
        <text x="97" y="105" fill="#713f12" font-size="9" font-family="sans-serif" font-weight="bold" text-anchor="middle">CHILLED</text>
      `;
      break;
    case 'Munchies':
      iconSvg = `
        <path d="M55 80 C55 130 145 130 145 80 Z" fill="#ea580c" opacity="0.85" stroke="#fed7aa" stroke-width="2.5" />
        <ellipse cx="100" cy="80" rx="45" ry="15" fill="#fb923c" stroke="#fed7aa" stroke-width="2" />
        <circle cx="80" cy="72" r="9" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5" />
        <circle cx="100" cy="70" r="10" fill="#fed7aa" stroke="#c2410c" stroke-width="1.5" />
        <circle cx="120" cy="72" r="8" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5" />
        <circle cx="90" cy="62" r="7" fill="#f97316" />
        <text x="100" y="112" fill="#ffffff" font-size="9" font-family="sans-serif" font-weight="bold" text-anchor="middle">SNACKS</text>
      `;
      break;
    case 'Vodka':
      iconSvg = `
        <rect x="92" y="25" width="16" height="20" rx="2" fill="#e0f2fe" stroke="#38bdf8" stroke-width="1.5" />
        <rect x="95" y="18" width="10" height="7" rx="1" fill="#7dd3fc" />
        <path d="M80 55 L120 55 L123 155 C123 162 117 168 110 168 L90 168 C83 168 77 162 77 155 Z" fill="#0369a1" opacity="0.6" stroke="#bae6fd" stroke-width="2" />
        <rect x="80" y="85" width="40" height="46" rx="4" fill="#082f49" stroke="#38bdf8" stroke-width="1.5" />
        <text x="100" y="106" fill="#38bdf8" font-size="8" font-family="sans-serif" font-weight="bold" text-anchor="middle">VODKA</text>
        <text x="100" y="118" fill="#e0f2fe" font-size="7" font-family="sans-serif" text-anchor="middle">TRIPLE DISTILLED</text>
      `;
      break;
    case 'Spirits & Liquors':
      iconSvg = `
        <ellipse cx="100" cy="115" rx="36" ry="38" fill="#78350f" opacity="0.8" stroke="#d4af37" stroke-width="2" />
        <rect x="94" y="30" width="12" height="40" fill="#451a03" stroke="#d4af37" stroke-width="1" />
        <rect x="92" y="22" width="16" height="8" rx="2" fill="#d4af37" />
        <rect x="76" y="95" width="48" height="34" rx="4" fill="#1c1917" stroke="#fae59e" stroke-width="1.5" />
        <text x="100" y="112" fill="#fae59e" font-size="7.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">LIQUEUR</text>
        <text x="100" y="122" fill="#ffffff" font-size="6.5" font-family="sans-serif" text-anchor="middle">PREMIUM SPIRITS</text>
      `;
      break;
    case 'Cigarettes & Extras':
      iconSvg = `
        <rect x="70" y="45" width="60" height="95" rx="6" fill="#1e1b2e" stroke="#d4af37" stroke-width="2" />
        <rect x="70" y="45" width="60" height="24" rx="4" fill="#312e81" stroke="#d4af37" stroke-width="1" />
        <path d="M85 30 L85 45 M95 24 L95 45 M105 32 L105 45" stroke="#fde047" stroke-width="3" stroke-linecap="round" />
        <circle cx="100" cy="95" r="16" fill="#0f172a" stroke="#fae59e" stroke-width="1.5" />
        <text x="100" y="99" fill="#fae59e" font-size="8" font-family="sans-serif" font-weight="bold" text-anchor="middle">EXTRAS</text>
        <rect x="76" y="120" width="48" height="12" rx="2" fill="#b91c1c" />
        <text x="100" y="129" fill="#ffffff" font-size="6" font-family="sans-serif" font-weight="bold" text-anchor="middle">SMOKES & ACCESSORIES</text>
      `;
      break;
    default:
      iconSvg = `
        <rect x="75" y="45" width="50" height="110" rx="8" fill="#d4af37" opacity="0.8" stroke="#fae59e" stroke-width="2" />
        <text x="100" y="105" fill="#121319" font-size="9" font-family="sans-serif" font-weight="bold" text-anchor="middle">PEWA</text>
      `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="300" height="300">
    <rect width="200" height="200" fill="#0d0e14"/>
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#d4af37" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#0d0e14" stop-opacity="0"/>
    </radialGradient>
    <rect width="200" height="200" fill="url(#bgGlow)"/>
    <rect x="8" y="8" width="184" height="184" rx="16" fill="none" stroke="#262730" stroke-width="1.5"/>
    ${iconSvg}
    <text x="100" y="180" fill="#fae59e" font-size="9" font-family="sans-serif" font-weight="bold" text-anchor="middle" letter-spacing="1">${title.toUpperCase()}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Normalizes an image URL, repairing outdated dev paths or mapping missing items.
 */
export function sanitizeImageUrl(url: string | undefined, category: Category | string, name?: string): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return getCategoryFallbackImage(category, name);
  }

  // Already a valid Base64 data URL from computer upload
  if (url.startsWith('data:image')) {
    return url;
  }

  // If path was an old Vite asset reference like '/src/assets/images/...'
  if (url.includes('/src/assets/images/')) {
    if (url.includes('whiskey')) return '/images/whiskey.jpg';
    if (url.includes('gin')) return '/images/gin.jpg';
    if (url.includes('brandy')) return '/images/brandy.jpg';
    if (url.includes('wine')) return '/images/wine.jpg';
    if (url.includes('beer')) return '/images/beer.jpg';
    if (url.includes('munchies')) return '/images/munchies.jpg';
    if (url.includes('hero_lounge')) return '/images/hero_lounge.jpg';
  }

  return url;
}
