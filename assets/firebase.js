import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app-check.js";
import { firebaseConfig, appCheckSiteKey, isConfigured } from "./firebase-config.js";

export { isConfigured };

const app = isConfigured ? initializeApp(firebaseConfig) : null;

if (app && appCheckSiteKey.trim()) {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey.trim()),
    isTokenAutoRefreshEnabled: true
  });
}

export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;

export function humanizeFirebaseError(error) {
  const messages = {
    "auth/invalid-credential": "כתובת האימייל או הסיסמה שגויות.",
    "auth/invalid-email": "כתובת האימייל אינה תקינה.",
    "auth/too-many-requests": "יותר מדי ניסיונות. נסו שוב בעוד זמן קצר.",
    "auth/user-disabled": "חשבון המשתמש חסום.",
    "permission-denied": "אין הרשאה לפעולה. בדקו את הרשאות Firestore.",
    "firestore/permission-denied": "אין הרשאה לפעולה. בדקו את הרשאות Firestore.",
    "unavailable": "לא ניתן להתחבר כרגע. בדקו את החיבור ונסו שוב.",
    "firestore/unavailable": "לא ניתן להתחבר כרגע. בדקו את החיבור ונסו שוב.",
    "failed-precondition": "מסד הנתונים עדיין לא הוגדר כראוי.",
    "auth/network-request-failed": "שגיאת רשת. בדקו את חיבור האינטרנט."
  };
  return messages[error?.code] || "אירעה שגיאה. נסו שוב ובדקו את הגדרות Firebase.";
}
