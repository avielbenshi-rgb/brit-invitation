import { db, isConfigured, humanizeFirebaseError } from "./firebase.js";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const byId = (id) => document.getElementById(id);
const form = byId("rsvpForm");
const errorBox = byId("formError");
const submitButton = byId("submitRsvp");
const numberInput = byId("guests");
let submitting = false;
let dialogOpener = null;
function closeThanks() {
  byId("thanksOverlay").hidden = true;
  document.body.classList.remove("thanks-open");
  dialogOpener?.focus();
}
byId("thanksCloseButton").addEventListener("click", closeThanks);
byId("thanksOverlay").addEventListener("click", event => {
  if (event.target === byId("thanksOverlay")) closeThanks();
});
byId("thanksOverlay").addEventListener("keydown", event => {
  if (event.key === "Escape") { closeThanks(); return; }
  if (event.key === "Tab") { event.preventDefault(); byId("thanksCloseButton").focus(); }
});

function safeTrim(value) {
  return value.trim().replace(/\s+/g, " ");
}
function formatEventDate(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return "התאריך יעודכן בקרוב";
  const date = new Date(dateString + "T12:00:00");
  if (Number.isNaN(date.getTime()) || [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-") !== dateString) return "התאריך יעודכן בקרוב";
  return new Intl.DateTimeFormat("he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);
}
function displayError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}
async function loadEvent() {
  if (!isConfigured) {
    byId("configAlert").hidden = false;
    submitButton.disabled = true;
    return;
  }
  try {
    const snapshot = await getDoc(doc(db, "settings", "event"));
    if (!snapshot.exists()) return;
    const event = snapshot.data();
    if (event.title) byId("eventTitle").textContent = event.title;
    if (event.subtitle) byId("eventSubtitle").textContent = event.subtitle;
    byId("eventDate").textContent = event.date ? formatEventDate(event.date) : "התאריך יעודכן בקרוב";
    byId("eventTime").textContent = /^\d{2}:\d{2}$/.test(event.time || "") ? event.time : "השעה תעודכן בקרוב";
    byId("eventVenue").textContent = event.venue || "המקום יעודכן בקרוב";
    byId("eventAddress").textContent = event.address || "";
    byId("eventAddress").hidden = !event.address;
    document.title = `${event.title || "הזמנה לברית מילה"} | אישור הגעה`;
  } catch (error) {
    byId("configAlert").textContent = "לא הצלחנו לטעון את פרטי האירוע. ודאו שהגדרות Firebase והרשאות הקריאה תקינות.";
    byId("configAlert").hidden = false;
    // Submissions may still work if only the settings read failed.
    console.error("Could not load event:", error);
  }
}
function adjustGuests(change) {
  const current = Number.parseInt(numberInput.value, 10);
  numberInput.value = String(Math.max(1, Math.min(20, (Number.isFinite(current) ? current : 1) + change)));
}
byId("minusGuests").addEventListener("click", () => adjustGuests(-1));
byId("plusGuests").addEventListener("click", () => adjustGuests(1));

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (submitting || !db) return;
  errorBox.hidden = true;
  const firstName = safeTrim(byId("firstName").value);
  const lastName = safeTrim(byId("lastName").value);
  const guests = Number(numberInput.value);
  if (firstName.length < 2 || firstName.length > 40 || lastName.length < 2 || lastName.length > 40) {
    displayError("יש להזין שם פרטי ושם משפחה, לפחות 2 תווים בכל שדה.");
    return;
  }
  if (!Number.isInteger(guests) || guests < 1 || guests > 20) {
    displayError("יש לבחור מספר אנשים בין 1 ל־20.");
    return;
  }
  if (byId("website").value.trim()) return; // Spam honeypot; does not replace App Check.

  submitting = true;
  submitButton.disabled = true;
  submitButton.querySelector(".button-text").textContent = "שולחים את האישור...";
  try {
    await addDoc(collection(db, "rsvps"), {
      firstName,
      lastName,
      guests,
      createdAt: serverTimestamp()
    });
    try { localStorage.setItem("brit-rsvp-sent", "yes"); } catch { /* Browser privacy settings */ }
    byId("successName").textContent = `${firstName} ${lastName}`;
    byId("successCount").textContent = `נרשמו ${guests} ${guests === 1 ? "מגיע" : "מגיעים"}.`;
    form.hidden = true;
    byId("previousNotice").hidden = true;
    byId("successPanel").hidden = false;
    // Only open after Firestore acknowledges the write. Never imply success on errors.
    dialogOpener = submitButton;
    byId("thanksSummary").textContent = `${firstName} ${lastName} · ${guests} ${guests === 1 ? "מגיע" : "מגיעים"}`;
    byId("thanksOverlay").hidden = false;
    document.body.classList.add("thanks-open");
    byId("thanksCloseButton").focus();
  } catch (error) {
    console.error("RSVP submission failed:", error);
    displayError(humanizeFirebaseError(error));
  } finally {
    submitting = false;
    submitButton.disabled = false;
    submitButton.querySelector(".button-text").textContent = "מאשרים הגעה באהבה";
  }
});

try { byId("previousNotice").hidden = localStorage.getItem("brit-rsvp-sent") !== "yes"; } catch { /* Browser privacy settings */ }
loadEvent();
