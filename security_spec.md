# Pewa Firestore Security Specification

## 1. Data Invariants
1. **Default-Deny Catch-All**: All Firestore paths are denied by default (`match /{document=**} { allow read, write: if false; }`).
2. **Admin-Only Mutations**: Only verified administrators (`request.auth.token.email_verified == true` and either the bootstrapped owner email `talk2odongo@gmail.com` or an explicitly registered `/admins/{uid}` document) may create, update, or delete products, catalog metadata, or store settings.
3. **Permanent Deletions**: Once `/meta/catalog_state` is marked `{ seeded: true }`, deletions on `/products/{productId}` remove the document permanently and clients never re-seed deleted items.
4. **No Shadow Fields or Unbounded Lists**: All writes enforce `hasAll` + `hasOnly`, `affectedKeys().hasOnly(...)` on updates, bounded string `.size()`, bounded arrays (`tastingNotes.size() <= 10`), and server timestamps (`updatedAt == request.time`).
5. **PII & Secret Isolation**: Neither `adminPassword` nor `kopoKopoCredentials` secrets are stored in public `/settings` documents.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Product Delete**: Unauthenticated client calls `deleteDoc(doc(db, 'products', 'prod-wh1'))` -> DENIED (`isAdmin()` false).
2. **Non-Admin Signed-In Product Delete**: Verified customer (`other@example.com`) calls `deleteDoc(...)` -> DENIED (`isAdmin()` false).
3. **Unverified Admin Email Spoof**: User with `email: 'talk2odongo@gmail.com'` and `email_verified: false` attempts write -> DENIED.
4. **Shadow Field Injection on Create**: Admin creates product with extra key `isVerifiedAdminOverride: true` -> DENIED (`keys().hasOnly(...)`).
5. **Shadow Field Injection on Update**: Admin updates product with extra key `id: 'hacked'` -> DENIED (`affectedKeys().hasOnly(...)` & `incoming().id == existing().id`).
6. **ID Poisoning**: Admin creates product with 500-char ID or `/` characters (`../evil`) -> DENIED (`isValidId(productId)`).
7. **Denial-of-Wallet Oversized Description**: Admin sends 100KB `description` string -> DENIED (`description.size() <= 2000`).
8. **Unbounded Array Injection**: Admin sends 50 items in `tastingNotes` -> DENIED (`tastingNotes.size() <= 10`).
9. **Wrong Array Element Type**: Admin sends `tastingNotes: [12345]` -> DENIED (`tastingNotes[0] is string`).
10. **Client-Forged Timestamp**: Admin sends `updatedAt: Timestamp.fromMillis(0)` instead of `serverTimestamp()` -> DENIED (`updatedAt == request.time`).
11. **Privilege Escalation**: Non-admin user tries to create `/admins/{uid}` -> DENIED (`isAdmin()` false).
12. **Negative Price / Stock Poisoning**: Admin attempts to set `price: -500` or `stock: -10` -> DENIED (`price >= 0 && stock >= 0`).
