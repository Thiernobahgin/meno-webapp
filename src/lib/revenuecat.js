// Thin wrapper around the RevenueCat Capacitor SDK. Everything here is a
// no-op on the web (isNativeApp() is false there) — the web app keeps using
// Stripe Checkout exactly as before. Only the native iOS shell calls into
// RevenueCat, which talks to Apple's StoreKit for real purchases + the
// 30-day free trial configured on each subscription in App Store Connect.
import { isNativeApp } from './platform.js';

// This is RevenueCat's "Public API Key" (project MENO) — it's meant to ship
// inside client code, the same way a Stripe *publishable* key is public.
const REVENUECAT_API_KEY_IOS = 'appl_SHbCsVUeQmwcDUSgHhLyrCkqXrw';

// Must match the Entitlement identifier created in the RevenueCat dashboard.
export const ENTITLEMENT_ID = 'MENO Pro';

let configured = false;

async function sdk() {
  return import('@revenuecat/purchases-capacitor');
}

// Configures the SDK once per app launch. Safe to call many times.
export async function configurePurchases() {
  if (!isNativeApp() || configured) return;
  const { Purchases, LOG_LEVEL } = await sdk();
  await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
  await Purchases.configure({ apiKey: REVENUECAT_API_KEY_IOS });
  configured = true;
}

// Links the RevenueCat user to our Supabase user id as soon as someone is
// signed in, so RevenueCat's `app_user_id` (sent on every webhook event) IS
// profiles.id — api/revenuecat-webhook.js relies on that to know whose
// subscription just changed, with no separate mapping table needed.
export async function loginPurchases(userId) {
  if (!isNativeApp() || !userId) return;
  await configurePurchases();
  const { Purchases } = await sdk();
  await Purchases.logIn({ appUserID: userId });
}

// Called on sign-out so a shared device doesn't keep the previous person's
// RevenueCat identity attached.
export async function logoutPurchases() {
  if (!isNativeApp()) return;
  await configurePurchases();
  const { Purchases } = await sdk();
  try {
    await Purchases.logOut();
  } catch {
    // Already anonymous / nothing to log out of — fine to ignore.
  }
}

// Returns { monthly, annual } RevenueCat packages from the default
// offering (as configured in RevenueCat → Product catalog → Offerings), or
// null if offerings can't be loaded (e.g. no network, or nothing configured).
export async function getOfferingPackages() {
  if (!isNativeApp()) return null;
  await configurePurchases();
  const { Purchases } = await sdk();
  const offerings = await Purchases.getOfferings();
  const current = offerings?.current;
  if (!current) return null;
  return {
    monthly: current.monthly || null,
    annual: current.annual || null
  };
}

export async function purchase(pkg) {
  const { Purchases } = await sdk();
  const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
  return customerInfo;
}

export async function restorePurchases() {
  const { Purchases } = await sdk();
  const { customerInfo } = await Purchases.restorePurchases();
  return customerInfo;
}

export function hasEntitlement(customerInfo) {
  return !!customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
}
