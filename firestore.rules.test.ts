/**
 * Adversarial "Dirty Dozen" Security Rules Test Suite for Pewa Firestore Rules.
 * Run against Firebase Emulator when available.
 */
import assert from 'node:assert';

export const DIRTY_DOZEN_CASES = [
  {
    name: '1. Unauthenticated Product Delete must fail',
    operation: 'delete',
    path: 'products/prod-wh1',
    auth: null,
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '2. Non-Admin Signed-In Product Delete must fail',
    operation: 'delete',
    path: 'products/prod-wh1',
    auth: { uid: 'customer-1', email: 'customer@example.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '3. Unverified Admin Email Spoof must fail',
    operation: 'delete',
    path: 'products/prod-wh1',
    auth: { uid: 'spoof-1', email: 'talk2odongo@gmail.com', email_verified: false },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '4. Shadow Field Injection on Product Create must fail',
    operation: 'create',
    path: 'products/prod-evil',
    auth: { uid: 'admin-1', email: 'talk2odongo@gmail.com', email_verified: true },
    payload: { id: 'prod-evil', shadowField: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '5. Shadow Field / ID Mutation on Product Update must fail',
    operation: 'update',
    path: 'products/prod-wh1',
    auth: { uid: 'admin-1', email: 'talk2odongo@gmail.com', email_verified: true },
    payload: { id: 'prod-other', price: 100 },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '6. ID Poisoning with invalid characters must fail',
    operation: 'create',
    path: 'products/bad id$!',
    auth: { uid: 'admin-1', email: 'talk2odongo@gmail.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '7. Oversized Description (>2000 chars) must fail',
    operation: 'update',
    path: 'products/prod-wh1',
    auth: { uid: 'admin-1', email: 'talk2odongo@gmail.com', email_verified: true },
    payload: { description: 'x'.repeat(2005) },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '8. Unbounded tastingNotes array (>10) must fail',
    operation: 'update',
    path: 'products/prod-wh1',
    auth: { uid: 'admin-1', email: 'talk2odongo@gmail.com', email_verified: true },
    payload: { tastingNotes: Array(12).fill('oak') },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '9. Invalid tastingNotes element type must fail',
    operation: 'update',
    path: 'products/prod-wh1',
    auth: { uid: 'admin-1', email: 'talk2odongo@gmail.com', email_verified: true },
    payload: { tastingNotes: [12345] },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '10. Client-forged updatedAt timestamp must fail',
    operation: 'update',
    path: 'products/prod-wh1',
    auth: { uid: 'admin-1', email: 'talk2odongo@gmail.com', email_verified: true },
    payload: { updatedAt: 0 },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '11. Privilege escalation on /admins/{uid} must fail',
    operation: 'create',
    path: 'admins/attacker-uid',
    auth: { uid: 'attacker-uid', email: 'attacker@example.com', email_verified: true },
    payload: { email: 'attacker@example.com', role: 'admin' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '12. Negative price / stock poisoning must fail',
    operation: 'update',
    path: 'products/prod-wh1',
    auth: { uid: 'admin-1', email: 'talk2odongo@gmail.com', email_verified: true },
    payload: { price: -100, stock: -5 },
    expected: 'PERMISSION_DENIED',
  },
];

assert.strictEqual(DIRTY_DOZEN_CASES.length, 12);
