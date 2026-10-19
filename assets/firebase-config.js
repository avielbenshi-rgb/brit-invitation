/**
 * Firebase Web configuration (public browser identifiers, NOT a secret).
 * Security depends on deployed Firestore rules + App Check enforcement.
 * Do not add service-account keys, passwords, or Google Cloud secrets here.
 */
export const firebaseConfig = {
  apiKey: "AIzaSyBiTDULHOYW7HMmAn4thND2u14RoQn-mAs",
  authDomain: "brit-6e2a5.firebaseapp.com",
  databaseURL: "https://brit-6e2a5-default-rtdb.firebaseio.com",
  projectId: "brit-6e2a5",
  storageBucket: "brit-6e2a5.firebasestorage.app",
  messagingSenderId: "238803584085",
  appId: "1:238803584085:web:5b6892644ffd9714afc0dc",
  measurementId: "G-ZZJGGSRB41"
};
// Public reCAPTCHA Enterprise SITE key, after App Check registration.
// Keep empty until the Firebase Console is configured. Never paste a SECRET key.
// When filled, test from GitHub Pages BEFORE enabling Cloud Firestore enforcement.
export const appCheckSiteKey = "";
export const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId)
  && !Object.values(firebaseConfig).some(value => String(value).includes("PASTE_"));
