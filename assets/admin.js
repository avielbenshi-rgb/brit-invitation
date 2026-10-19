import { auth, db, isConfigured, humanizeFirebaseError } from "./firebase.js";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import { collection, deleteDoc, doc, getDoc, getDocsFromServer, onSnapshot, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const byId = (id) => document.getElementById(id);
let currentResponses = [];
let unsubscribeResponses = null;
let unsubscribeSettings = null;
let toastTimeout = null;

function showView(view) {
  byId("loadingView").hidden = view !== "loading";
  byId("loginView").hidden = view !== "login";
  byId("dashboardView").hidden = view !== "dashboard";
}
function setMessage(id, text, kind = "error") {
  const element = byId(id);
  element.textContent = text;
  element.className = `form-message message-${kind}`;
  element.hidden = !text;
}
function toast(message) {
  const element = byId("toast");
  element.textContent = message;
  element.hidden = false;
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => { element.hidden = true; }, 3700);
}
function stopListening() {
  if (unsubscribeResponses) unsubscribeResponses();
  if (unsubscribeSettings) unsubscribeSettings();
  unsubscribeResponses = null;
  unsubscribeSettings = null;
  currentResponses = [];
  // Clear private records on sign-out or failed authorization.
  updateOverview();
  renderResponses();
}
function localDate(timestamp) {
  if (!timestamp || typeof timestamp.toDate !== "function") return "—";
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    timeZone: "Asia/Jerusalem"
  }).format(timestamp.toDate());
}
function getSortedResponses(snapshot) {
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))
    .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
}
function updateOverview() {
  const total = currentResponses.reduce((sum, person) => sum + Number(person.guests || 0), 0);
  byId("totalGuests").textContent = total.toLocaleString("he-IL");
  byId("totalResponses").textContent = currentResponses.length.toLocaleString("he-IL");
  byId("responseCountBadge").textContent = String(currentResponses.length);
  byId("lastResponse").textContent = currentResponses.length ? localDate(currentResponses[0].createdAt) : "—";
}
function makeButton(text, className, handler, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = text;
  button.setAttribute("aria-label", label);
  button.addEventListener("click", handler);
  return button;
}
async function editResponse(response) {
  const value = window.prompt(`כמה מגיעים עבור ${response.firstName} ${response.lastName}? (1–20)`, String(response.guests));
  if (value === null) return;
  if (!/^\d+$/.test(value.trim()) || Number(value) < 1 || Number(value) > 20) {
    toast("יש להזין מספר שלם בין 1 ל־20.");
    return;
  }
  try {
    await updateDoc(doc(db, "rsvps", response.id), { guests: Number(value) });
    toast("מספר המגיעים עודכן בהצלחה.");
  } catch (error) {
    setMessage("dashboardError", humanizeFirebaseError(error));
  }
}
async function deleteResponse(response) {
  if (!window.confirm(`למחוק את האישור של ${response.firstName} ${response.lastName}? לא ניתן לבטל פעולה זו.`)) return;
  try {
    await deleteDoc(doc(db, "rsvps", response.id));
    toast("אישור ההגעה נמחק.");
  } catch (error) {
    setMessage("dashboardError", humanizeFirebaseError(error));
  }
}
function renderResponses() {
  const query = byId("searchInput").value.trim().toLocaleLowerCase("he-IL");
  const filtered = currentResponses.filter(person =>
    `${person.firstName || ""} ${person.lastName || ""}`.toLocaleLowerCase("he-IL").includes(query)
  );
  byId("tableSummary").textContent = `${filtered.length} תוצאות`;
  const body = byId("responsesBody");
  body.replaceChildren();
  if (!filtered.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.className = "empty-table";
    cell.textContent = currentResponses.length ? "לא נמצאו אנשים שמתאימים לחיפוש." : "עדיין אין אישורי הגעה. ברגע שמישהו יאשר, הוא יופיע כאן.";
    row.append(cell);
    body.append(row);
    return;
  }
  const fragment = document.createDocumentFragment();
  for (const person of filtered) {
    const row = document.createElement("tr");
    const name = document.createElement("td");
    name.className = "name-cell";
    name.textContent = `${person.firstName || ""} ${person.lastName || ""}`;
    const count = document.createElement("td");
    const countBadge = document.createElement("span");
    countBadge.className = "guests-badge";
    countBadge.textContent = String(person.guests ?? "—");
    count.append(countBadge);
    const date = document.createElement("td");
    date.textContent = localDate(person.createdAt);
    const actions = document.createElement("td");
    actions.append(
      makeButton("עריכה", "table-action", () => editResponse(person), `עריכת מספר מגיעים עבור ${name.textContent}`),
      makeButton("מחיקה", "table-action danger", () => deleteResponse(person), `מחיקת האישור של ${name.textContent}`)
    );
    row.append(name, count, date, actions);
    fragment.append(row);
  }
  body.append(fragment);
}
function setSyncStatus(message) { byId("syncStatus").textContent = message; }
async function refreshResponses() {
  const button = byId("refreshResponses");
  button.disabled = true;
  setSyncStatus("בודקים אישורים ישירות מול Firestore...");
  try {
    const snapshot = await getDocsFromServer(collection(db, "rsvps"));
    currentResponses = getSortedResponses(snapshot);
    updateOverview();
    renderResponses();
    setMessage("dashboardError", "");
    setSyncStatus(`סונכרן עם Firestore · ${currentResponses.length} אישורים נמצאו`);
  } catch (error) {
    setSyncStatus("לא ניתן לקרוא אישורים מהשרת.");
    setMessage("dashboardError", `רענון נכשל: ${humanizeFirebaseError(error)} (${error?.code || "שגיאה לא ידועה"})`);
    console.error("Firestore server refresh failed", error);
  } finally { button.disabled = false; }
}
byId("refreshResponses").addEventListener("click", refreshResponses);
function listenForResponses() {
  unsubscribeResponses = onSnapshot(collection(db, "rsvps"), snapshot => {
    currentResponses = getSortedResponses(snapshot);
    setMessage("dashboardError", "");
    updateOverview();
    renderResponses();
    setSyncStatus(snapshot.metadata.fromCache
      ? "מוצגים נתונים מהמטמון בלבד — ממתינים לחיבור לשרת. לחצו על רענון הרשימה."
      : `מחובר ל־Firestore · ${currentResponses.length} אישורים`);
  }, error => {
    setSyncStatus("שגיאה בקריאת הרשימה מ־Firestore");
    setMessage("dashboardError", `לא ניתן לטעון את האישורים: ${humanizeFirebaseError(error)} (${error?.code || "שגיאה לא ידועה"})`);
    console.error("Firestore live RSVP listener failed", error);
  });
}
function listenForSettings() {
  unsubscribeSettings = onSnapshot(doc(db, "settings", "event"), snapshot => {
    if (!snapshot.exists()) return;
    const settings = snapshot.data();
    // Avoid overwriting fields while the user is editing the form.
    const form = byId("settingsForm");
    if (form.contains(document.activeElement) && document.activeElement?.tagName === "INPUT") return;
    byId("settingTitle").value = settings.title || "";
    byId("settingSubtitle").value = settings.subtitle || "";
    byId("settingDate").value = settings.date || "";
    byId("settingTime").value = settings.time || "";
    byId("settingVenue").value = settings.venue || "";
    byId("settingAddress").value = settings.address || "";
  }, error => setMessage("dashboardError", `לא ניתן לטעון את פרטי האירוע: ${humanizeFirebaseError(error)}`));
}
async function enterDashboard(user) {
  stopListening();
  try {
    const membership = await getDoc(doc(db, "admins", user.uid));
    if (!membership.exists() || membership.data().active !== true) {
      await signOut(auth);
      setMessage("loginError", "החשבון קיים, אך הוא לא הוגדר כמנהל. יש להוסיף את ה־UID לאוסף admins עם active=true.");
      showView("login");
      return;
    }
    byId("userEmail").textContent = user.email || "מנהל";
    showView("dashboard");
    listenForResponses();
    listenForSettings();
  } catch (error) {
    await signOut(auth);
    setMessage("loginError", `אימות ההרשאות נכשל: ${humanizeFirebaseError(error)}`);
    showView("login");
  }
}

byId("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!auth) return;
  const button = byId("loginButton");
  button.disabled = true;
  setMessage("loginError", "");
  try {
    await signInWithEmailAndPassword(auth, byId("email").value.trim(), byId("password").value);
    // onAuthStateChanged handles authorization and displaying the dashboard.
  } catch (error) {
    setMessage("loginError", humanizeFirebaseError(error));
  } finally {
    button.disabled = false;
  }
});
byId("logoutButton").addEventListener("click", async () => {
  stopListening();
  try { await signOut(auth); } catch (error) { toast(humanizeFirebaseError(error)); }
});
byId("searchInput").addEventListener("input", renderResponses);
byId("settingsForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const saveButton = byId("saveSettingsButton");
  saveButton.disabled = true;
  setMessage("settingsMessage", "");
  const settings = {
    title: byId("settingTitle").value.trim(),
    subtitle: byId("settingSubtitle").value.trim(),
    date: byId("settingDate").value,
    time: byId("settingTime").value,
    venue: byId("settingVenue").value.trim(),
    address: byId("settingAddress").value.trim()
  };
  if (!settings.title || settings.title.length > 100) {
    setMessage("settingsMessage", "יש להזין כותרת תקינה.");
    saveButton.disabled = false;
    return;
  }
  try {
    await setDoc(doc(db, "settings", "event"), settings);
    setMessage("settingsMessage", "פרטי האירוע נשמרו בהצלחה והם זמינים בדף ההזמנה.", "success");
  } catch (error) {
    setMessage("settingsMessage", humanizeFirebaseError(error));
  } finally {
    saveButton.disabled = false;
  }
});
byId("copyLinkButton").addEventListener("click", async () => {
  const url = new URL("./index.html", window.location.href).href;
  try {
    await navigator.clipboard.writeText(url);
    toast("הלינק לדף ההזמנה הועתק.");
  } catch {
    window.prompt("העתיקו את הלינק:", url);
  }
});
function csvCell(value) {
  let content = String(value ?? "");
  // Prevent spreadsheet formula injection from untrusted guest names.
  if (/^[\s\u0000-\u001f]*[=+@\-]/.test(content)) content = "'" + content;
  return `"${content.replaceAll('"', '""')}"`;
}
byId("exportButton").addEventListener("click", () => {
  const rows = [
    ["שם פרטי", "שם משפחה", "מספר מגיעים", "זמן אישור"],
    ...currentResponses.map(person => [person.firstName || "", person.lastName || "", person.guests ?? "", localDate(person.createdAt)])
  ];
  const contents = "\uFEFF" + rows.map(row => row.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([contents], {type: "text/csv;charset=utf-8;"}));
  const link = document.createElement("a");
  link.href = url;
  link.download = `brit-rsvp-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2500);
  toast("קובץ המשתתפים נשמר במכשיר.");
});

if (!isConfigured) {
  showView("login");
  byId("setupMessage").hidden = false;
  byId("loginButton").disabled = true;
} else {
  onAuthStateChanged(auth, user => {
    if (!user) { stopListening(); showView("login"); return; }
    showView("loading");
    enterDashboard(user);
  }, error => {
    setMessage("loginError", humanizeFirebaseError(error));
    showView("login");
  });
}
