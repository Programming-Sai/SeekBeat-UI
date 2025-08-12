// contexts/AppStorageContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { storageGet, storageSet } from "../lib/storage";

const STORAGE_KEY = "@seekbeat:appdata";

const AppStorageContext = createContext(null);

export function AppStorageProvider({ children }) {
  const [isReady, setReady] = useState(false);

  // default shape
  const defaultData = {
    downloads: [],
    searchHistory: [], // array of { term, when }
    playlists: {},
    // new flag - whether to save incoming searches
    saveSearchHistory: true,
  };

  const [data, setData] = useState(defaultData);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await storageGet(STORAGE_KEY, null);
        if (!mounted) return;
        // merge stored with defaults to avoid missing keys
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

  // persist on change (simple immediate persist; debounce if many writes)
  useEffect(() => {
    if (!isReady) return;
    storageSet(STORAGE_KEY, data);
  }, [data, isReady]);

  /* ---------- helpers ---------- */

  const addDownload = (item) =>
    setData((s) => ({ ...s, downloads: [item, ...(s.downloads || [])] }));

  const removeDownload = (id) =>
    setData((s) => ({
      ...s,
      downloads: (s.downloads || []).filter((d) => d.id !== id),
    }));

  // pushSearch respects saveSearchHistory flag
  const pushSearch = (term) =>
    setData((s) => {
      if (!s.saveSearchHistory) return s; // do nothing when disabled

      const trimmed = typeof term === "string" ? term.trim() : "";
      if (!trimmed) return s;

      // dedupe (case-insensitive) and keep newest first
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

  const clearSearchHistory = () =>
    setData((s) => ({ ...s, searchHistory: [] }));

  // new: toggle the save flag. We do NOT auto-clear history when disabling; that is UX choice.
  const setSaveSearchHistory = (enabled) =>
    setData((s) => ({ ...s, saveSearchHistory: !!enabled }));

  const setPlaylists = (playlists) => setData((s) => ({ ...s, playlists }));

  // convenience getters
  const getSearchHistory = () => data.searchHistory || [];
  const getSaveSearchHistory = () => !!data.saveSearchHistory;

  return (
    <AppStorageContext.Provider
      value={{
        data,
        isReady,
        // downloads
        addDownload,
        removeDownload,
        // search
        pushSearch,
        clearSearchHistory,
        getSearchHistory,
        // save flag
        saveSearchHistory: getSaveSearchHistory(),
        setSaveSearchHistory,
        // playlists
        setPlaylists,
        // (optionally) setter for raw data
        setData,
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
