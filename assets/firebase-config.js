/**
 * Paste the WEB APP configuration from Firebase Console > Project settings > Your apps.
 * This config is intended for the browser; security comes from firestore.rules, not secrecy.
 * Do not paste a service account private key here.
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

// Optional: after setting up Firebase App Check with reCAPTCHA Enterprise,
// paste the public site key here. Leave blank until App Check is configured.
export const appCheckSiteKey = "";

export const isConfigured =
  Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId) &&
  !Object.values(firebaseConfig).some(value => String(value).includes("PASTE_"));
