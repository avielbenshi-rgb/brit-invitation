/** Firebase Web App config — public client values; security is in Firestore rules. */
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
export const appCheckSiteKey = "";
export const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId)
  && !Object.values(firebaseConfig).some(value => String(value).includes("PASTE_"));
