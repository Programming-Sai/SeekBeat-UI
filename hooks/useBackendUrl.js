// hooks/useBackendUrl.js
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "seekbeat:backend_base";
const DEFAULT_BACKEND = "https://seekbeat.onrender.com";

// simple in-window pubsub so multiple hook instances in same document sync immediately
const backendEventTarget =
  typeof window !== "undefined" ? new EventTarget() : null;

function safeLocalStorageGet(key) {
  try {
    return typeof window !== "undefined"
      ? window.localStorage.getItem(key)
      : null;
  } catch (e) {
    return null;
  }
}
function safeLocalStorageSet(key, value) {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
  } catch (e) {
    // ignore
  }
}
function safeLocalStorageRemove(key) {
  try {
    if (typeof window !== "undefined") window.localStorage.removeItem(key);
  } catch (e) {}
}

/** Normalize user input URL:
 *  - if no scheme, add http://
 *  - throw if not http/https after normalization
 */
function normalizeUrlCandidate(candidate) {
  if (!candidate) throw new Error("empty url");
  let trimmed = String(candidate).trim();
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
    // no scheme -> assume http
    trimmed = "http://" + trimmed;
  }
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      throw new Error("only http/https supported");
    }
    // remove trailing slash for consistency
    u.pathname = u.pathname.replace(/\/$/, "") || "/";
    // return origin + (pathname === '/' ? '' : pathname) but we'll keep origin if path is root
    return (u.origin + (u.pathname === "/" ? "" : u.pathname)).replace(
      /\/$/,
      ""
    );
  } catch (e) {
    throw new Error("invalid url");
  }
}

/**
 * useBackendUrl
 *
 * Returns:
 *  - backendUrl: current effective url (string)
 *  - setBackendUrl(urlOrCandidate) -> Promise that resolves to normalized url or rejects on invalid
 *  - resetBackendUrl() -> sets to default (and persists)
 *  - clearBackendUrl() -> removes custom value (so hook consumers can treat as "unset")
 *  - isDefault -> true if the current url equals default
 *  - getBackendUrlSync() -> synchronous getter for outside effects if needed
 */
export function useBackendUrl(defaultUrl = DEFAULT_BACKEND) {
  const defaultNormalized = (() => {
    try {
      return normalizeUrlCandidate(defaultUrl);
    } catch {
      return DEFAULT_BACKEND;
    }
  })();

  // initialize from storage or use default
  const initial = (() => {
    const raw = safeLocalStorageGet(STORAGE_KEY);
    if (raw) {
      try {
        return normalizeUrlCandidate(raw);
      } catch {
        return defaultNormalized;
      }
    }
    return defaultNormalized;
  })();

  const [backendUrl, setBackendUrlState] = useState(initial);

  // notify helper
  const broadcast = useCallback((value) => {
    // in-window
    try {
      if (backendEventTarget) {
        backendEventTarget.dispatchEvent(
          new CustomEvent("seekbeat:backend_changed", {
            detail: { backendUrl: value },
          })
        );
      }
    } catch (e) {}
    // across tabs/windows (use localStorage write trick)
    try {
      if (typeof window !== "undefined") {
        // write a small marker as JSON with timestamp so storage event fires
        window.localStorage.setItem(
          `${STORAGE_KEY}:changed`,
          JSON.stringify({ backendUrl: value, t: Date.now() })
        );
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    // subscribe to in-window events
    if (!backendEventTarget) return;
    const handler = (ev) => {
      const n = ev?.detail?.backendUrl;
      if (typeof n === "string" && n !== backendUrl) setBackendUrlState(n);
    };
    backendEventTarget.addEventListener("seekbeat:backend_changed", handler);

    // subscribe to storage events (cross-tab)
    const onStorage = (ev) => {
      try {
        if (!ev) return;
        if (ev.key === STORAGE_KEY) {
          // main storage changed
          const val = ev.newValue;
          if (val && val !== backendUrl) {
            setBackendUrlState(normalizeUrlCandidate(val));
          } else if (!val) {
            setBackendUrlState(defaultNormalized);
          }
        } else if (ev.key === `${STORAGE_KEY}:changed`) {
          // small helper marker
          try {
            const parsed = JSON.parse(ev.newValue || "{}");
            if (parsed.backendUrl && parsed.backendUrl !== backendUrl) {
              setBackendUrlState(parsed.backendUrl);
            }
          } catch {}
        }
      } catch {}
    };
    window.addEventListener("storage", onStorage);

    return () => {
      backendEventTarget.removeEventListener(
        "seekbeat:backend_changed",
        handler
      );
      window.removeEventListener("storage", onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendUrl, defaultNormalized]);

  const setBackendUrl = useCallback(
    async (candidate) => {
      const normalized = normalizeUrlCandidate(candidate);
      try {
        safeLocalStorageSet(STORAGE_KEY, normalized);
      } catch {}
      setBackendUrlState(normalized);
      broadcast(normalized);
      return normalized;
    },
    [broadcast]
  );

  const resetBackendUrl = useCallback(() => {
    try {
      safeLocalStorageSet(STORAGE_KEY, defaultNormalized);
    } catch {}
    setBackendUrlState(defaultNormalized);
    broadcast(defaultNormalized);
    return defaultNormalized;
  }, [defaultNormalized, broadcast]);

  const clearBackendUrl = useCallback(() => {
    try {
      safeLocalStorageRemove(STORAGE_KEY);
    } catch {}
    setBackendUrlState(defaultNormalized);
    broadcast(defaultNormalized);
    return defaultNormalized;
  }, [defaultNormalized, broadcast]);

  const getBackendUrlSync = useCallback(() => backendUrl, [backendUrl]);

  const isDefault = backendUrl === defaultNormalized;

  return {
    backendUrl,
    setBackendUrl, // async normalization/validation
    resetBackendUrl,
    clearBackendUrl,
    getBackendUrlSync,
    isDefault,
    defaultUrl: DEFAULT_BACKEND,
  };
}
