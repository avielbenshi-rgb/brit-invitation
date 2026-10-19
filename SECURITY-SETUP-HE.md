# אבטחת אתר הברית — מדריך הפעלה לפרויקט brit-6e2a5

הקבצים האלו מוכנים לפריסה ב־GitHub Pages, **אבל פעולות Firebase/Google Cloud אינן מבוצעות באמצעות העלאת ZIP**. אל תפעילו הגנה שלא הוגדרה מראש: הדבר עלול לחסום את אישורי ההגעה.

## 1. פרסום כללי Cloud Firestore (חובה)

- Firebase Console → הפרויקט `brit-6e2a5` → Firestore Database → Rules.
- החליפו את כל הכללים בתוכן `firestore.rules` ולחצו **Publish**.
- ודאו שההרשאות הן: אורח יכול ליצור רק מסמך חדש ב־`rsvps`, אינו יכול לקרוא/לעדכן/למחוק רשומות; רק משתמש מחובר עם `admins/{UID}.active == true` יכול לקרוא ולנהל אותן.
- **לא** לשנות את הכללים ל־`allow read, write: if true` ולא להדביק כללי Firestore ב־Realtime Database.

## 2. חסימת Realtime Database שאינו בשימוש (מומלץ)

האתר משתמש ב־**Cloud Firestore**, לא ב־Realtime Database. אם לא בונים שירות אחר על Realtime Database: פתחו Realtime Database → Rules והחליפו בתוכן `database.rules.json`, ואז Publish. הכללים חוסמים את כלל הקריאות והכתיבות. אם מסד הנתונים משרת אפליקציה נוספת, **לא** לפרסם בלי לבדוק את ההשפעה.

## 3. בדיקת Firebase Storage (אם נוצר)

אם קיים Storage בפרויקט ואינכם משתמשים בו בשום שירות אחר: Storage → Rules והדביקו את `storage.rules` ואז Publish. זה חוסם קריאה וכתיבה. **אל** תפרסמו אם שירות אחר צריך גישה לקבצים שם.

## 4. חשבון מנהל והרשאות

- Firebase → Authentication → Users: השאירו רק חשבונות נחוצים; השתמשו בסיסמה חזקה וייחודית למנהל.
- Firestore → Data → `admins` → מסמך שמזההו זהה ל־UID של החשבון ב־Authentication → שדה `active` מסוג boolean עם הערך `true`.
- ודאו שלא הוגדר חשבון נוסף כמנהל ללא אישורכם. כדי לבטל הרשאה, שנו לו `active=false` או מחקו את מסמך ה־UID מה־Console.
- האתר `admin.html` נגיש בכתובת ציבורית, אבל הגישה לנתונים חייבת להיאכף ב־Firestore Security Rules.
- הגנו גם על חשבון GitHub וחשבון Google האישי באימות דו־שלבי.

## 5. אימות הדומיין

Firebase → Authentication → Settings → Authorized domains, הוסיפו אם חסר `avielbenshi-rgb.github.io` (ללא https וללא נתיב). ודאו שזה שם המשתמש הנכון.

## 6. הגנת App Check נגד בוטים — יש לבצע בסדר הזה

1. Firebase Console → App Check → Apps: רשמו את אפליקציית Web של הפרויקט והגדירו **reCAPTCHA Enterprise**. ודאו שהדומיין של GitHub Pages מורשה, בהתאם למסך ההגדרות.
2. קבלו את ה־**site key הציבורי** (לא secret key!) ושימו אותו בין המרכאות ב־`export const appCheckSiteKey = "";` שב־`assets/firebase-config.js`.
3. העלו ל־GitHub וחכו לפרסום האתר. בדקו שליחת אישור אמיתי וקריאת רשימה במנהל. בדקו App Check → Metrics שקיימות בקשות מאומתות.
4. **רק אחרי בדיקות תקינות**, הפעילו App Check **Enforce** עבור **Cloud Firestore** מתוך מסך App Check.
5. בצעו שוב בדיקה באתר האורחים ובמנהל, כולל טלפון וגלישה בסתר.

> App Check מצמצם שימוש מלקוחות מזויפים אבל לא מזהה אם אדם אמיתי הזין שמות פיקטיביים. הגנה חזקה מפני ספאם בקנה מידה גדול (למשל הגבלת מספר הגשות ל־IP/זמן) מחייבת שרת/Cloud Functions או שירות חיצוני מתאים. אל תציגו את המערכת כחסינה לחלוטין מבוטים. שימו לב למכסות ולתמחור reCAPTCHA Enterprise/Google Cloud.

## 7. התראת GitHub על Google API Key

- Google Cloud Console → APIs & Services → Credentials → בחרו את הפרויקט `brit-6e2a5`, ואז את **Browser key** של Firebase.
- בדקו שיש API restrictions המתאימות ל־Firebase בלבד, בלי Generative Language API, Maps ושירותים אחרים לא נחוצים. אל תשנו API ללא בדיקה — שינוי שגוי יכול להשבית התחברות.
- מפתח Firebase Web הוא מזהה ציבורי לפי התיעוד של Firebase, ולכן מותר שיישאר בקובץ הדפדפן. **לא מוחקים אותו ולא קוראים לו סיסמה**. אם המפתח שימש שירות שאינו Firebase או לא היה מוגבל, טפלו בשירות, שקלו החלפה מבוקרת ובדקו את האתר.
- לאחר שהמפתח הוגבל ואומת, אפשר לסגור את התראת GitHub כהתרעה על מפתח Web ציבורי מכוון (Won't fix/False positive בהתאם להסבר). סגירה לא מחליפה אבטחה.

## 8. בדיקת תפקוד ואבטחה לפני שליחת הזמנות

1. פתחו את אתר האורחים בחלון גלישה פרטי ושלחו הרשמה ניסיונית אחת. **חלון תודה מופיע רק לאחר אישור מהשרת**.
2. ב־Firestore → Data בדקו שנוצר מסמך תחת `rsvps`. אם לא, חפשו שגיאה במסך האורח, ודאו שהכללים פורסמו וש־App Check לא נאכף לפני שהוגדר.
3. התחברו ל־`https://avielbenshi-rgb.github.io/brit-invitation/admin.html` ובדקו שהאישור מופיע. אפשר ללחוץ **רענון הרשימה** כדי לאלץ קריאה מהשרת.
4. התנתקו מהמנהל. בחלון אחר (ללא התחברות) בדקו שלא ניתן לקרוא את מסמכי `rsvps` או את אוסף `admins` דרך SDK/REST של Firestore.
5. מחקו את רשומת הניסיון דרך המנהל. בדקו שלא ניתן לכתוב לרשומה קיימת או למחוק אותה כמשתמש לא מחובר.
6. ב־Google Cloud בדקו Quotas/Billing והגדירו התראות תקציב אם לפרויקט יש חשבון חיוב. התראת תקציב אינה מגבלת חיוב קשיחה.
7. בסיום האירוע, מחקו נתונים אישיים שכבר אינם נחוצים לכם, לפי חובותיכם בדין.

## מה לא תוקן אוטומטית

אין לנו גישה לשנות את ההגדרות החיות של Firebase, Google Cloud או את מערכת ההתראות של GitHub. חיבור GitHub הקיים מאפשר קריאה אך החזיר בעבר שגיאת 403 בכתיבה, ולכן יש להעלות את קובצי ה־ZIP בעצמכם. בנוסף, לא ניתן לאמת שקריאות ל־Firestore החי מצליחות בלי לבצע בדיקת אמת בחשבונכם.

### קישורים

- https://firebase.google.com/docs/projects/api-keys
- https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider
- https://firebase.google.com/docs/firestore/security/get-started
- https://firebase.google.com/docs/database/security
