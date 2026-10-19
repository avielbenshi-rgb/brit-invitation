# אישורי הגעה לברית — אתר מלא ל־GitHub Pages + Firebase

אתר הזמנה RTL בעברית עם טופס אישור הגעה, ממשק ניהול מוגן, נתונים בזמן אמת, עריכת האירוע, עריכת מספר מוזמנים, מחיקת אישורים וייצוא CSV לאקסל.

> **חשוב:** הקוד מלא, אבל עד להגדרת פרויקט Firebase משלך לא ניתן לשמור אישורים או להתחבר לניהול. לא נדרש שרת משלך, התקנת Node או תהליך build כדי לפרסם את האתר ב־GitHub Pages.

## מבנה הפרויקט

```text
index.html                  דף ההזמנה והאישור לאורחים
admin.html                  דף כניסת מנהל וממשק הניהול
assets/styles.css           העיצוב וההתאמה לנייד
assets/guest.js             שמירה ושליפת פרטי הזמנה
assets/admin.js             כניסה, הרשמה, נתונים וייצוא
assets/firebase.js          אתחול Firebase וטיפול בשגיאות
assets/firebase-config.js   כאן מזינים את פרטי הפרויקט שלך
assets/favicon.svg          אייקון האתר
firestore.rules             הרשאות האבטחה - חובה להפעיל!
firebase.json               הגדרת פריסת הכללים ב־Firebase CLI (אופציונלי)
.nojekyll                   תאימות לפרסום ישיר ב־GitHub Pages
```

## שלב 1 — לפתוח פרויקט Firebase

1. נכנסים ל־https://console.firebase.google.com/ ולוחצים **Add project / הוספת פרויקט**.
2. בתוך **Project Overview** לוחצים על סמל האינטרנט `</>` כדי ליצור **Web App**.
3. מעתיקים את אובייקט `firebaseConfig` המוצג בקונסול.
4. פותחים את `assets/firebase-config.js` ומחליפים את ערכי `PASTE_...` בערכים מהקונסול (משאירים את `appCheckSiteKey` ריק בינתיים).
5. פותחים **Build → Firestore Database → Create database**. בוחרים את האזור המתאים ומפעילים. יש לפרסם את כללי האבטחה בשלב הבא **לפני ששולחים את הקישור**. אם מוצע Production mode, אפשר לבחור בו; הכללים יחליפו את ברירת המחדל החוסמת.

**זהו קוד הגדרות ציבורי של אפליקציית Web ולא מפתח שירות סודי. לעולם אל תעתיקו אליו private key, service account, או סיסמה.**

## שלב 2 — כללי האבטחה (חובה)

1. ב־Firebase Console → **Firestore Database → Rules**.
2. מחליפים **את כל** התוכן בכללים שנמצאים בקובץ `firestore.rules` בפרויקט הזה.
3. לוחצים **Publish / פרסום**.

הכללים מאפשרים לכל אורח להוסיף *אישור חדש בלבד*, אך אוסרים עליו לקרוא רשומות. רשימת המגיעים ופעולות הניהול מותרות רק לחשבונות שקיבלו הרשאת מנהל.

**חלופה לפרסום הכללים:** עם Firebase CLI מותקן ומחובר אפשר להריץ בתיקיית הפרויקט `firebase deploy --only firestore:rules --project YOUR_PROJECT_ID`. GitHub Pages לא מפרסם את כללי Firestore; חייבים להגדיר אותם ב־Firebase בנוסף לעליית הקבצים ל־GitHub.

## שלב 3 — יצירת חשבון מנהל

1. ב־Firebase → **Build → Authentication → Get started → Sign-in method** מפעילים **Email/Password**.
2. בכרטיסיית **Users** לוחצים **Add user** ומזינים את האימייל והסיסמה שלך. לא קיימת הרשמה ציבורית דרך האתר.
3. מעתיקים את **User UID** של אותו משתמש מכרטיסיית Users.
4. ב־**Firestore Database → Data**, יוצרים אוסף (Collection) חדש בשם `admins`.
5. יוצרים מסמך (Document) שה־**Document ID** שלו זהה **בדיוק** ל־UID שהעתקת.
6. במסמך מוסיפים שדה מסוג **boolean** בשם `active` עם הערך `true` (לא מחרוזת `"true"`).

דוגמת מבנה המסמך:

```text
admins/
  YOUR_FIREBASE_AUTH_UID/
    active: true   (boolean)
```

**חשוב:** אל תיצור את מסמך המנהל דרך האתר. יוצרים אותו דרך Firebase Console בלבד, שבו יש לך הרשאת פרויקט. הכללים חוסמים מהדפדפן יצירה או עריכה של הרשאות ניהול.

## שלב 4 — הרשאת הדומיין ב־Authentication

ב־**Authentication → Settings → Authorized domains**, ודא שהדומיין שבו תריץ את האתר מאושר. עבור GitHub Pages מוסיפים `YOUR_GITHUB_USERNAME.github.io` (בלי `https://` ובלי נתיב הריפו). עבור בדיקות מקומיות הוסף `localhost` אם אינו קיים כבר. במקרה של דומיין משלך, הוסף אותו גם כן.

## שלב 5 — לפרסם בחינם ב־GitHub Pages

1. צור Repository חדש ב־GitHub (למשל `brit-invitation`). כדי להשתמש ב־GitHub Pages לפי תנאי החשבון שלך, בדרך כלל בוחרים ריפו **Public**.
2. העלה את **כל** קובצי התיקייה `brit-rsvp` לשורש הריפו. ודא שהקבצים `index.html` ו־`admin.html` נמצאים בשורש ולא בתוך תיקייה נוספת.
3. היכנס ל־**Settings → Pages**, בחר **Deploy from a branch**, ענף `main`, תיקייה `/(root)`, ושמור.
4. לאחר השלמת הפרסום, כתובת ההזמנה תהיה בערך:
   `https://YOUR_GITHUB_USERNAME.github.io/brit-invitation/`
5. כתובת הניהול תהיה:
   `https://YOUR_GITHUB_USERNAME.github.io/brit-invitation/admin.html`
6. לאחר כניסה לניהול, פתח את אזור **פרטי ההזמנה**. תוכל להשאיר את התאריך, השעה והמקום ריקים ולמלא אותם בהמשך. לחץ **שמירת פרטי האירוע**.
7. לחץ על **העתקת לינק להזמנה**, והעבר לאורחים ב־WhatsApp או בכל דרך שתרצה.

## בדיקה מקומית

אפשר לפתוח את הפרויקט ב־VS Code עם תוסף Live Server, או להריץ מתוך התיקייה:

```bash
python -m http.server 5500
```

פתח `http://localhost:5500/` עבור האורחים, ו־`http://localhost:5500/admin.html` עבור הניהול. **אל תפתח את HTML ישירות עם `file://`** — האתר משתמש במודולי JavaScript.

## איך מוודאים שהכול פועל

1. נסה לפתוח את `admin.html` ללא התחברות — לא אמורה להופיע רשימת אנשים.
2. היכנס עם האימייל והסיסמה שיצרת והפעל את הגדרות האירוע.
3. פתח את דף האורח בחלון פרטי / בגלישה אחרת, הזן שם, משפחה ומספר מגיעים ולחץ אישור.
4. בדוק שמופיעה הודעת הצלחה ושההרשמה מופיעה בזמן אמת בדף המנהל.
5. ערוך מספר אנשים, מחק בדיקת הרשמה, הורד את קובץ ה־CSV ובדוק שהשינויים מוצגים.
6. ודא שכללי Firestore פורסמו ושהמשתמש הלא־מחובר **אינו יכול לקרוא** את `rsvps` באמצעות Firestore.

## מה חשוב לדעת על אבטחה ושמירת מידע

- Firebase Auth מגן על מסך הניהול, אבל **ההגנה האמיתית היא בקובץ `firestore.rules`**. אין לפרסם את האתר עם Firestore Test Mode או כללים כגון `allow read, write: if true`.
- הקוד מונע גישה ציבורית לקריאת שמות האורחים, מגביל את שדות ההרשמה ואוסר על שינוי הרשמה קיימת מצד אורח. שמות המשפחה ונתוני הנוכחות נשמרים ב־Firestore.
- מכיוון שהטופס ציבורי ואינו דורש התחברות, גורמים עוינים עדיין עלולים ליצור הרשמות פיקטיביות או הרבה רשומות. ה־honeypot הפשוט באתר אינו הגנה מספקת בפני מתקפה.
- **מומלץ לפני הפצה רחבה:** להפעיל **Firebase App Check with reCAPTCHA Enterprise**: רשום את Web App ואת דומיין GitHub, צור site key, שים אותו במשתנה `appCheckSiteKey` בקובץ `assets/firebase-config.js`, פרסם מחדש, ודא שבקשות תקינות עוברות ורק אז הפעל Enforce בשירות Cloud Firestore. App Check מצמצם ניצול לרעה אך לא מבטיח שכל הגשה היא אמיתית. ראו https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider
- אם משתמשים ב־Firebase Spark (ללא חיוב), בדוק בקונסול את המגבלות והצריכה של Firestore. שירותים נוספים, מכסות או App Check/Google Cloud עשויים לכלול עלויות לפי הגדרות ותעבורה.
- כדאי למחוק את הרשומות לאחר האירוע כאשר כבר אין צורך בנתונים, ולהציג מדיניות פרטיות המתאימה לשימוש שלך.
- כדי להגביל מחדש גישה של מנהל, הגדר `active=false` במסמך `admins/{UID}` דרך הקונסול או מחק אותו.

## האם אפשר בלי Firebase?

**GitHub Pages לבדו אינו מספיק למערכת חיה עם רשימת אישורים ומנהל.** הוא מגיש קובצי HTML, CSS ו־JavaScript סטטיים, ואינו מספק מסד נתונים או שרת ששומר נתוני אורחים.

אפשר לפרסם את אותו עיצוב ב־GitHub Pages ולהחליף את שכבת הנתונים ב־**Supabase**, **Google Apps Script + Google Sheets**, או **Cloudflare Workers + D1**, אבל נדרש להתאים את קוד השמירה והאבטחה לאותו שירות. לא מומלץ לשמור אישורים ב־localStorage בתור פתרון, כי הוא שומר אותם רק בדפדפן של האורח ולא מציג אותם למנהל.

## מקורות תיעוד

- https://firebase.google.com/docs/web/setup
- https://firebase.google.com/docs/firestore/security/get-started
- https://firebase.google.com/docs/auth/web/password-auth
- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

## בדיקות מובנות לקוד (לא דורש חשבון Firebase)

אם מותקנים במחשב Python ו־Node.js, אפשר להריץ מתוך התיקייה:

```bash
python -m unittest discover -s tests -v
```

אלה בדיקות תחביר, קישורים ומבנה הרשאות. הן אינן מחליפות בדיקת תהליך הרשמה מלא מול פרויקט Firebase אמיתי לאחר שתגדיר אותו.
