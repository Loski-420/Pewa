import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Category, Product, StoreSettings } from './types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const ADMIN_BOOTSTRAP_EMAIL = 'talk2odongo@gmail.com';
export const BANNED_SAMPLE_IDS = ['prod-wn4', 'prod-wn5', 'prod-ce9'];

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

const VALID_CATEGORIES: Category[] = [
  'Whiskey',
  'Vodka',
  'Spirits & Liquors',
  'Gin',
  'Brandy',
  'Wines',
  'Beer',
  'Munchies',
  'Cigarettes & Extras',
];

const sanitizeDocId = (rawId: string): string => {
  const cleaned = String(rawId || '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 128);
  return cleaned || `prod-${Date.now()}`;
};

const clampNumber = (val: unknown, min: number, max: number, fallback: number): number => {
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

export function toFirestoreProductPayload(
  product: Product,
  mode: 'create' | 'update'
): Record<string, unknown> {
  const safeId = sanitizeDocId(product.id);
  const safeCategory: Category = VALID_CATEGORIES.includes(product.category)
    ? product.category
    : 'Munchies';
  const safeTastingNotes = Array.isArray(product.tastingNotes)
    ? product.tastingNotes
        .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
        .slice(0, 10)
        .map((t) => t.trim().slice(0, 80))
    : [];

  const payload: Record<string, unknown> = {
    id: safeId,
    name: String(product.name || 'Item').trim().slice(0, 200) || 'Item',
    brand: String(product.brand || 'Pewa').trim().slice(0, 120) || 'Pewa',
    category: safeCategory,
    price: clampNumber(product.price, 0, 10000000, 0),
    abv: clampNumber(product.abv, 0, 100, 0),
    volume: String(product.volume || 'Standard').trim().slice(0, 80) || 'Standard',
    origin: String(product.origin || 'Kenya').trim().slice(0, 80) || 'Kenya',
    isLocal: Boolean(product.isLocal),
    description: String(product.description || '').slice(0, 2000),
    tastingNotes: safeTastingNotes,
    imageUrl: String(product.imageUrl || '').slice(0, 700000),
    stock: clampNumber(product.stock, 0, 1000000, 0),
    rating: clampNumber(product.rating, 0, 5, 4.8),
    reviewCount: clampNumber(product.reviewCount, 0, 10000000, 0),
    popularityScore: clampNumber(product.popularityScore, 0, 10000000, 0),
    updatedAt: serverTimestamp(),
  };

  if (typeof product.originalPrice === 'number' && Number.isFinite(product.originalPrice) && product.originalPrice >= 0) {
    payload.originalPrice = clampNumber(product.originalPrice, 0, 10000000, 0);
  }
  if (typeof product.isCustom === 'boolean') {
    payload.isCustom = product.isCustom;
  }
  if (mode === 'create' && typeof product.createdAt === 'number' && Number.isFinite(product.createdAt) && product.createdAt >= 0) {
    payload.createdAt = product.createdAt;
  }

  return payload;
}

export function fromFirestoreProduct(data: Record<string, any>): Product {
  const updatedAtMillis =
    data.updatedAt instanceof Timestamp
      ? data.updatedAt.toMillis()
      : typeof data.updatedAt === 'number'
      ? data.updatedAt
      : undefined;

  return {
    id: String(data.id),
    name: String(data.name || ''),
    brand: String(data.brand || 'Pewa'),
    category: (VALID_CATEGORIES.includes(data.category) ? data.category : 'Munchies') as Category,
    price: Number(data.price) || 0,
    ...(typeof data.originalPrice === 'number' ? { originalPrice: data.originalPrice } : {}),
    abv: Number(data.abv) || 0,
    volume: String(data.volume || 'Standard'),
    origin: String(data.origin || 'Kenya'),
    isLocal: Boolean(data.isLocal),
    description: String(data.description || ''),
    tastingNotes: Array.isArray(data.tastingNotes) ? data.tastingNotes : [],
    imageUrl: String(data.imageUrl || ''),
    stock: Number(data.stock) || 0,
    rating: Number(data.rating) || 4.8,
    reviewCount: Number(data.reviewCount) || 0,
    popularityScore: Number(data.popularityScore) || 0,
    ...(typeof data.isCustom === 'boolean' ? { isCustom: data.isCustom } : {}),
    ...(typeof data.createdAt === 'number' ? { createdAt: data.createdAt } : {}),
    ...(updatedAtMillis ? { updatedAt: updatedAtMillis } : {}),
  };
}

export async function isFirebaseAdminUser(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) return false;
  if (user.email?.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase()) {
    return true;
  }
  try {
    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
    return adminDoc.exists() && adminDoc.data()?.role === 'admin';
  } catch {
    return false;
  }
}

export async function signInAdminWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  const authorized = await isFirebaseAdminUser(result.user);
  if (!authorized) {
    await signOut(auth);
    throw new Error(
      `Signed-in account (${result.user.email || 'unknown'}) is not an authorized store admin. Please sign in with ${ADMIN_BOOTSTRAP_EMAIL}.`
    );
  }
  return result.user;
}

export async function seedCatalogToFirestoreOnce(currentProducts: Product[]): Promise<boolean> {
  const metaRef = doc(db, 'meta', 'catalog_state');
  try {
    const metaSnap = await getDocFromServer(metaRef);
    if (metaSnap.exists() && metaSnap.data()?.seeded === true) {
      return false; // Already seeded — NEVER re-seed deleted items
    }
  } catch (err) {
    // Fallback to cached getDoc only if offline, otherwise let handleFirestoreError report
    try {
      const cachedMeta = await getDoc(metaRef);
      if (cachedMeta.exists() && cachedMeta.data()?.seeded === true) {
        return false;
      }
    } catch {
      handleFirestoreError(err, OperationType.GET, 'meta/catalog_state');
    }
  }

  // Check if /products already has docs in Firestore
  try {
    const existingSnap = await getDocs(collection(db, 'products'));
    if (!existingSnap.empty) {
      await setDoc(metaRef, { seeded: true, updatedAt: serverTimestamp() });
      return false;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'products');
  }

  // Seed initial items cleanly in batches
  const filtered = currentProducts.filter((p) => !BANNED_SAMPLE_IDS.includes(p.id));
  const CHUNK = 350;
  try {
    for (let i = 0; i < filtered.length; i += CHUNK) {
      const batch = writeBatch(db);
      const slice = filtered.slice(i, i + CHUNK);
      for (const prod of slice) {
        const safeId = sanitizeDocId(prod.id);
        const ref = doc(db, 'products', safeId);
        batch.set(ref, toFirestoreProductPayload({ ...prod, id: safeId }, 'create'));
      }
      if (i + CHUNK >= filtered.length) {
        batch.set(metaRef, { seeded: true, updatedAt: serverTimestamp() });
      }
      await batch.commit();
    }
    if (filtered.length === 0) {
      await setDoc(metaRef, { seeded: true, updatedAt: serverTimestamp() });
    }
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'products');
  }
}

export async function saveProductToFirestore(
  product: Product,
  mode: 'create' | 'update'
): Promise<void> {
  const safeId = sanitizeDocId(product.id);
  const path = `products/${safeId}`;
  const ref = doc(db, 'products', safeId);
  try {
    if (mode === 'create') {
      await setDoc(ref, toFirestoreProductPayload({ ...product, id: safeId }, 'create'));
    } else {
      const payload = toFirestoreProductPayload({ ...product, id: safeId }, 'update');
      // Remove immutable id from updateDoc payload so affectedKeys only checks mutable fields
      delete payload.id;
      const existingSnap = await getDoc(ref);
      if (existingSnap.exists()) {
        await updateDoc(ref, payload);
      } else {
        await setDoc(ref, toFirestoreProductPayload({ ...product, id: safeId }, 'create'));
      }
    }
  } catch (err) {
    handleFirestoreError(
      err,
      mode === 'create' ? OperationType.CREATE : OperationType.UPDATE,
      path
    );
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  const safeId = sanitizeDocId(productId);
  const path = `products/${safeId}`;
  const ref = doc(db, 'products', safeId);
  try {
    // Ensure catalog_state is marked seeded before deleting so deletion is never reverted
    const metaRef = doc(db, 'meta', 'catalog_state');
    const metaSnap = await getDoc(metaRef);
    if (!metaSnap.exists()) {
      await setDoc(metaRef, { seeded: true, updatedAt: serverTimestamp() });
    }
    await deleteDoc(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function replaceCatalogInFirestore(products: Product[]): Promise<void> {
  const path = 'products';
  try {
    const existingSnap = await getDocs(collection(db, 'products'));
    const nextIds = new Set(products.map((p) => sanitizeDocId(p.id)));
    const batch = writeBatch(db);

    for (const d of existingSnap.docs) {
      if (!nextIds.has(d.id)) {
        batch.delete(d.ref);
      }
    }
    for (const p of products.filter((x) => !BANNED_SAMPLE_IDS.includes(x.id))) {
      const safeId = sanitizeDocId(p.id);
      batch.set(doc(db, 'products', safeId), toFirestoreProductPayload({ ...p, id: safeId }, 'create'));
    }
    batch.set(doc(db, 'meta', 'catalog_state'), {
      seeded: true,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function savePublicSettingsToFirestore(settings: StoreSettings): Promise<void> {
  const path = 'settings/store';
  try {
    await setDoc(doc(db, 'settings', 'store'), {
      storeName: String(settings.storeName || 'Pewa').slice(0, 120),
      ownerWhatsAppPhone: String(settings.ownerWhatsAppPhone || '254712610337').slice(0, 20),
      kopoKopoTillNumber: String(settings.kopoKopoTillNumber || '349797').slice(0, 20),
      deliveryFee: clampNumber(settings.deliveryFee, 0, 100000, 300),
      minimumOrder: clampNumber(settings.minimumOrder, 0, 1000000, 1000),
      pointsPerOrder: clampNumber(settings.pointsPerOrder, 0, 100000, 20),
      pointValueInKes: clampNumber(settings.pointValueInKes, 0, 1000, 1),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export { onAuthStateChanged, signOut, onSnapshot, collection, doc };
export type { User };
