// contexts/AppStorageContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { storageGet, storageSet } from "../lib/storage";

const STORAGE_KEY = "@seekbeat:appdata";

const AppStorageContext = createContext(null);

export function AppStorageProvider({ children }) {
  const [isReady, setReady] = useState(false);
  const [mobileSheetVisible, setMobileSheetVisible] = useState(false);

  // default shape
  const defaultData = {
    downloads: [], // array of { id, webpage_url, status, filename, startedAt, finishedAt, error, ... }
    searchHistory: [],
    saveSearchHistory: true,
    playlists: {},
    mobileSheeVisible: false,
    sheetTab: "history",
    viewMode: "list",
    lastSearch: null,
    downloadUsePlaybackSettings: false,
    forceProxy: false,
  };

  const [data, setData] = useState(defaultData);

  // transient map used for UI loading state. Not persisted.
  // status values: "idle" | "pending" | "done" | "error"
  const [downloadStatuses, setDownloadStatuses] = useState({});
  const transientTimersRef = useRef({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await storageGet(STORAGE_KEY, null);
        if (!mounted) return;
        if (stored) setData({ ...defaultData, ...stored });
        setReady(true);
      } catch (e) {
        console.warn("Failed to load app data", e);
        if (mounted) {
          setData(defaultData);
          setReady(true);
        }
      }
    })();
    return () => (mounted = false);
  }, []);

  // persist on change (persist only `data`)
  useEffect(() => {
    if (!isReady) return;
    storageSet(STORAGE_KEY, data);
  }, [data, isReady]);

  /* ---------- DOWNLOADS (persistent + transient status) ---------- */

  // Normalize id extraction helper
  const idFor = (itemOrId) => {
    if (!itemOrId) return null;
    if (typeof itemOrId === "string") return itemOrId;
    return itemOrId.id ?? itemOrId.webpage_url ?? null;
  };

  // Add or merge a download record (persisted)
  // item: { id, webpage_url?, song?, status?, filename?, startedAt?, finishedAt?, error?, edits? }
  const addDownload = useCallback((item) => {
    const id = idFor(item);
    if (!id) return;
    setData((s) => {
      const existing = (s.downloads || []).find(
        (d) => (d.id ?? d.webpage_url) === id
      );
      if (existing) {
        // merge into existing
        const next = (s.downloads || []).map((d) =>
          (d.id ?? d.webpage_url) === id ? { ...d, ...item } : d
        );
        return { ...s, downloads: next };
      }
      // prepend newest
      const next = [{ ...item, id }, ...(s.downloads || [])];
      return { ...s, downloads: next };
    });
  }, []);

  // Update a persisted download's fields (merge)
  const updateDownload = useCallback((idOrItem, patch = {}) => {
    const id = idFor(idOrItem);
    if (!id) return;
    setData((s) => {
      const next = (s.downloads || []).map((d) =>
        (d.id ?? d.webpage_url) === id ? { ...d, ...patch } : d
      );
      return { ...s, downloads: next };
    });
  }, []);

  // Remove persisted download and any transient status
  const removeDownload = useCallback((idOrItem) => {
    const id = idFor(idOrItem);
    if (!id) return;
    setData((s) => ({
      ...s,
      downloads: (s.downloads || []).filter(
        (d) => (d.id ?? d.webpage_url) !== id
      ),
    }));
    setDownloadStatuses((m) => {
      const copy = { ...m };
      delete copy[id];
      return copy;
    });
    // clear timer
    try {
      const t = transientTimersRef.current[id];
      if (t) {
        clearTimeout(t);
        delete transientTimersRef.current[id];
      }
    } catch (e) {}
  }, []);

  const clearDownloads = useCallback(() => {
    setData((s) => ({ ...s, downloads: [] }));
    // clear transient map + timers
    Object.values(transientTimersRef.current).forEach((t) => {
      try {
        clearTimeout(t);
      } catch (e) {}
    });
    transientTimersRef.current = {};
    setDownloadStatuses({});
  }, []);

  const getDownloads = useCallback(() => data.downloads || [], [data]);

  // set transient and persisted status. opts: { transientTTL } resets transient status back to "idle" after TTL ms
  const setDownloadStatus = useCallback(
    (idOrItem, status, opts = {}) => {
      const id = idFor(idOrItem);
      if (!id) return;
      // set transient
      setDownloadStatuses((m) => ({ ...m, [id]: status }));
      // persist status into download record as well for convenience (so list UIs see it)
      updateDownload(id, { status });

      // clear any existing timer for that id
      try {
        const prev = transientTimersRef.current[id];
        if (prev) {
          clearTimeout(prev);
          delete transientTimersRef.current[id];
        }
      } catch (e) {}

      if (
        opts?.transientTTL &&
        typeof opts.transientTTL === "number" &&
        opts.transientTTL > 0
      ) {
        const t = setTimeout(() => {
          // reset transient state to idle after TTL
          setDownloadStatuses((m) => {
            const copy = { ...m };
            // only delete key if it's still the same status we set earlier (avoid racing)
            if (copy[id]) delete copy[id];
            return copy;
          });
          // also update persisted status if you prefer to mark idle
          updateDownload(id, { status: "idle" });
          delete transientTimersRef.current[id];
        }, opts.transientTTL);
        transientTimersRef.current[id] = t;
      }
    },
    [updateDownload]
  );

  const getDownloadStatus = useCallback(
    (idOrItem) => {
      const id = idFor(idOrItem);
      if (!id) return "idle";
      // transient status wins
      const transient = downloadStatuses[id];
      if (transient) return transient;
      // fallback to persisted
      const persisted = (data.downloads || []).find(
        (d) => (d.id ?? d.webpage_url) === id
      );
      return persisted?.status ?? "idle";
    },
    [downloadStatuses, data]
  );

  // cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(transientTimersRef.current || {}).forEach((t) => {
        try {
          clearTimeout(t);
        } catch (e) {}
      });
      transientTimersRef.current = {};
    };
  }, []);

  /* ---------- The rest of your existing context: search history, playlists etc ---------- */

  const pushSearch = (term) =>
    setData((s) => {
      if (!s.saveSearchHistory) return s;

      const trimmed = typeof term === "string" ? term.trim() : "";
      if (!trimmed) return s;

      const normalized = trimmed.toLowerCase();
      const filtered = (s.searchHistory || []).filter(
        (q) => q.term.toLowerCase() !== normalized
      );

      const MAX = 200;
      const next = [{ term: trimmed, when: Date.now() }, ...filtered].slice(
        0,
        MAX
      );

      return { ...s, searchHistory: next };
    });

  const removeSearchAt = (index) =>
    setData((s) => {
      const next = [...(s.searchHistory || [])];
      next.splice(index, 1);
      return { ...s, searchHistory: next };
    });

  const clearSearchHistory = () =>
    setData((s) => ({ ...s, searchHistory: [] }));

  const getSearchHistory = () => data.searchHistory || [];

  const setSaveSearchHistory = (enabled) =>
    setData((s) => ({ ...s, saveSearchHistory: !!enabled }));

  const getSaveSearchHistory = () => !!data.saveSearchHistory;

  const setViewMode = (mode) =>
    setData((s) => ({
      ...s,
      viewMode: mode || (s.viewMode === "list" ? "grid" : "list"),
    }));

  const getViewMode = () => data.viewMode;

  const setPlaylists = (playlists) => setData((s) => ({ ...s, playlists }));

  const addPlaylist = (id, playlist) =>
    setData((s) => ({
      ...s,
      playlists: { ...s.playlists, [id]: playlist },
    }));

  const removePlaylist = (id) =>
    setData((s) => {
      const copy = { ...s.playlists };
      delete copy[id];
      return { ...s, playlists: copy };
    });

  const getPlaylists = () => data.playlists || {};

  const setLastSearch = (payload) =>
    setData((s) => ({ ...s, lastSearch: payload || null }));

  const getLastSearch = () => data.lastSearch || null;

  const clearLastSearch = () => setData((s) => ({ ...s, lastSearch: null }));

  const setDownloadUsePlaybackSettings = useCallback((enabled) => {
    setData((s) => ({ ...s, downloadUsePlaybackSettings: !!enabled }));
  }, []);

  const getSheetTab = () => data.sheetTab;

  const setSheetTab = (tab) => setData((s) => ({ ...s, sheetTab: tab }));

  const getDownloadUsePlaybackSettings = useCallback(
    () => !!data.downloadUsePlaybackSettings,
    [data]
  );

  const getForceProxy = useCallback(() => !!data.forceProxy, [data]);

  const setForceProxy = useCallback((enabled) => {
    setData((s) => ({ ...s, forceProxy: !!enabled }));
  }, []);

  return (
    <AppStorageContext.Provider
      value={{
        data,
        isReady,
        setData,

        // Downloads persistent + transient helpers
        addDownload,
        updateDownload,
        removeDownload,
        clearDownloads,
        getDownloads,
        setDownloadStatus,
        getDownloadStatus,

        // Search history
        pushSearch,
        removeSearchAt,
        clearSearchHistory,
        getSearchHistory,

        // Save flag
        saveSearchHistory: getSaveSearchHistory(),
        setSaveSearchHistory,

        // View mode
        viewMode: getViewMode(),
        setViewMode,

        // Playlists
        setPlaylists,
        addPlaylist,
        removePlaylist,
        getPlaylists,

        // Last search cache
        setLastSearch,
        getLastSearch,
        clearLastSearch,

        // download playback setting accessors
        downloadUsePlaybackSettings: getDownloadUsePlaybackSettings(),
        setDownloadUsePlaybackSettings,

        // download playback setting accessors
        forceProxy: getForceProxy(),
        setForceProxy,

        getSheetTab,
        getMobileSheetVisible: () => {
          return mobileSheetVisible;
        },
        setSheetTab,
        setMobileSheetVisible,
      }}
    >
      {children}
    </AppStorageContext.Provider>
  );
}

export const useAppStorage = () => {
  const ctx = useContext(AppStorageContext);
  if (!ctx)
    throw new Error("useAppStorage must be used within AppStorageProvider");
  return ctx;
};
