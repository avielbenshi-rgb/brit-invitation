/**
 * Paste the WEB APP configuration from Firebase Console > Project settings > Your apps.
 * This config is intended for the browser; security comes from firestore.rules, not secrecy.
 * Do not paste a service account private key here.
 */
export const firebaseConfig = {
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "PASTE_MESSAGING_SENDER_ID",
  appId: "PASTE_APP_ID"
};

// Optional: after setting up Firebase App Check with reCAPTCHA Enterprise,
// paste the public site key here. Leave blank until App Check is configured.
export const appCheckSiteKey = "";

export const isConfigured =
  Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId) &&
  !Object.values(firebaseConfig).some(value => String(value).includes("PASTE_"));
