import { db, isConfigured, humanizeFirebaseError } from "./firebase.js";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const el = (id) => document.getElementById(id);
const form = el("rsvpForm");
const submitButton = el("submitRsvp");
const guestCount = el("guests");
let submitting = false;
let modalRestoreFocus = null;

function normalizeTime(value) {
  // The admin's <input type="time"> stores HH:mm; also accept a single-digit hour.
  if (typeof value !== "string") return "";
  const match = value.trim().match(/^(\d{1,2}):([0-5]\d)(?::[0-5]\d)?$/);
  if (!match || Number(match[1]) > 23) return "";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function formatDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return "—";
  }
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  // Prevent overflow dates such as 2026-02-31 from displaying as March.
  const sameDate = date.getFullYear() === Number(value.slice(0, 4)) &&
    date.getMonth() + 1 === Number(value.slice(5, 7)) &&
    date.getDate() === Number(value.slice(8, 10));
  if (!sameDate) return "—";
  return new Intl.DateTimeFormat("he-IL", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    timeZone: "Asia/Jerusalem"
  }).format(date);
}

function safeNavigationUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return "";
    const host = url.hostname.toLowerCase();
    const domains = ["waze.com", "google.com", "goo.gl"];
    if (!domains.some((domain) => host === domain || host.endsWith(`.${domain}`))) return "";
    return url.href;
  } catch { return ""; }
}

function renderEvent(settings) {
  if (!settings || typeof settings !== "object") return;
  if (typeof settings.title === "string" && settings.title.trim()) {
    el("eventTitle").textContent = settings.title.trim();
    document.title = `${settings.title.trim()} | אישור הגעה`;
  }
  if (typeof settings.subtitle === "string" && settings.subtitle.trim()) {
    el("eventSubtitle").textContent = settings.subtitle.trim();
  }
  el("eventDate").textContent = formatDate(settings.date);
  // Show the actual saved admin time. 15:00 remains the default if unset/invalid.
  el("eventTime").textContent = normalizeTime(settings.time) || "15:00";
  el("eventVenue").textContent = settings.venue || "—";
  const address = typeof settings.address === "string" ? settings.address.trim() : "";
  el("eventAddress").textContent = address;
  el("eventAddress").hidden = !address;
  const navigationUrl = safeNavigationUrl(settings.mapUrl);
  const navigationLink = el("eventMapLink");
  if (navigationUrl) navigationLink.href = navigationUrl;
  navigationLink.hidden = !navigationUrl;
}

function showConnectionError(message) {
  const error = el("configAlert");
  error.textContent = message;
  error.hidden = false;
}

function loadEvent() {
  if (!isConfigured || !db) {
    showConnectionError("ההזמנה עדיין לא חוברה ל־Firebase. יש לפנות למארגנים.");
    submitButton.disabled = true;
    return;
  }
  // Live subscription ensures admin changes appear without stale cached displays.
  onSnapshot(doc(db, "settings", "event"), (snapshot) => {
    if (snapshot.exists()) {
      renderEvent(snapshot.data());
      el("configAlert").hidden = true;
    }
  }, (error) => {
    console.error("Cannot read event settings:", error);
    showConnectionError("לא הצלחנו לטעון את פרטי האירוע. נא לבדוק את הרשאות הקריאה של Firestore או לפנות למארגנים.");
  });
}

function adjustGuests(delta) {
  const current = Number.parseInt(guestCount.value, 10);
  guestCount.value = String(Math.max(1, Math.min(20, (Number.isInteger(current) ? current : 1) + delta)));
}
el("minusGuests").addEventListener("click", () => adjustGuests(-1));
el("plusGuests").addEventListener("click", () => adjustGuests(1));

function showFormError(message) {
  el("formError").textContent = message;
  el("formError").hidden = false;
}

function closeThanks() {
  el("thanksOverlay").hidden = true;
  document.body.classList.remove("thanks-open");
  const focusTarget = modalRestoreFocus;
  modalRestoreFocus = null;
  if (focusTarget?.isConnected && !focusTarget.disabled && !focusTarget.closest("[hidden]")) {
    focusTarget.focus();
  } else {
    el("successPanel").setAttribute("tabindex", "-1");
    el("successPanel").focus();
  }
}
el("thanksCloseButton").addEventListener("click", closeThanks);
el("thanksOverlay").addEventListener("click", (event) => {
  if (event.target === el("thanksOverlay")) closeThanks();
});
el("thanksOverlay").addEventListener("keydown", (event) => {
  if (event.key === "Escape") { event.preventDefault(); closeThanks(); }
  if (event.key === "Tab") { event.preventDefault(); el("thanksCloseButton").focus(); }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (submitting || !db) return;
  el("formError").hidden = true;

  const firstName = el("firstName").value.trim().replace(/\s+/g, " ");
  const lastName = el("lastName").value.trim().replace(/\s+/g, " ");
  const guests = Number(guestCount.value);
  if (firstName.length < 2 || firstName.length > 40 || lastName.length < 2 || lastName.length > 40) {
    showFormError("נא למלא שם פרטי ושם משפחה, 2–40 תווים בכל שדה.");
    return;
  }
  if (!Number.isInteger(guests) || guests < 1 || guests > 20) {
    showFormError("נא לבחור מספר אורחים שלם בין 1 ל־20.");
    return;
  }
  if (el("website").value.trim()) return;

  submitting = true;
  submitButton.disabled = true;
  submitButton.querySelector(".button-text").textContent = "שולחים אישור...";

  try {
    await addDoc(collection(db, "rsvps"), {
      firstName, lastName, guests, createdAt: serverTimestamp()
    });
    el("successName").textContent = `${firstName} ${lastName}`;
    el("successCount").textContent = `נרשמו ${guests} ${guests === 1 ? "מגיע" : "מגיעים"}.`;
    el("thanksSummary").textContent = `${firstName} ${lastName} · ${guests} ${guests === 1 ? "מגיע" : "מגיעים"}`;
    // No device-based previous-submission notice or persisted flag is used.
    form.hidden = true;
    el("successPanel").hidden = false;
    modalRestoreFocus = submitButton;
    el("thanksOverlay").hidden = false;
    document.body.classList.add("thanks-open");
    el("thanksCloseButton").focus();
  } catch (error) {
    console.error("RSVP save failed:", error);
    showFormError(humanizeFirebaseError(error));
  } finally {
    submitting = false;
    submitButton.disabled = false;
    submitButton.querySelector(".button-text").textContent = "אישור הגעה";
  }
});

const cue = el("scrollToRsvp");
const section = el("rsvpSection");
function setCueVisibility(visible) {
  cue.classList.toggle("is-hidden", visible);
  cue.setAttribute("aria-hidden", String(visible));
  cue.tabIndex = visible ? -1 : 0;
}
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    const item = entries[0];
    setCueVisibility(item.isIntersecting && item.intersectionRect.height >= 20);
  }, { threshold: [0, 0.05, 0.25] });
  observer.observe(section);
} else {
  const updateCue = () => {
    const rect = section.getBoundingClientRect();
    setCueVisibility(rect.top < window.innerHeight - 20 && rect.bottom > 20);
  };
  window.addEventListener("scroll", updateCue, { passive: true });
  updateCue();
}

loadEvent();
