// True when this page is running inside the MENO iOS app shell (Capacitor),
// as opposed to a normal browser tab. Capacitor injects `window.Capacitor`
// into every page it loads — including a remote URL, which is how the iOS
// app is set up — so this needs no @capacitor/core import and adds zero
// build dependency to the web app itself.
//
// Why this exists: Apple requires that any app unlocking paid content use
// Apple's own In-App Purchase system, unless the app never exposes a way to
// buy or manage that purchase from inside the app at all (the "external
// purchase" pattern — the same one Netflix/Spotify use). MENO keeps billing
// on Stripe via the website only, so every purchase/billing entry point in
// the UI must hide itself when running inside the native wrapper.
export function isNativeApp() {
  return typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();
}
