// lib/splashSession.js
// Uses sessionStorage when available (web/tab lifetime).
// Falls back to an in-memory flag for non-browser / native environments.

const KEY = "seekbeat:seenSplash";
let inMemoryFlag = false;

function storageAvailable() {
  try {
    return typeof window !== "undefined" && !!window.sessionStorage;
  } catch (e) {
    return false;
  }
}

export function hasSeenSplash() {
  if (storageAvailable()) {
    try {
      return sessionStorage.getItem(KEY) === "1";
    } catch (e) {
      // if sessionStorage throws, fall back to memory
      return !!inMemoryFlag;
    }
  }
  return !!inMemoryFlag;
}

export function markSplashSeen() {
  if (storageAvailable()) {
    try {
      sessionStorage.setItem(KEY, "1");
      return;
    } catch (e) {
      // ignore write failures, fall back to memory
    }
  }
  inMemoryFlag = true;
}

export function clearSeenSplash() {
  // helper for testing/dev to clear the flag
  if (storageAvailable()) {
    try {
      sessionStorage.removeItem(KEY);
    } catch (e) {}
  }
  inMemoryFlag = false;
}
