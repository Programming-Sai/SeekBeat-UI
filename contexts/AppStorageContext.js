// contexts/AppStorageContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { storageGet, storageSet } from "../lib/storage";

const STORAGE_KEY = "@seekbeat:appdata";

const AppStorageContext = createContext(null);

export function AppStorageProvider({ children }) {
  const [isReady, setReady] = useState(false);

  // default shape
  const defaultData = {
    downloads: [], // array of { id, ... }
    searchHistory: [], // array of { term, when }
    playlists: {}, // { [playlistId]: { name, items: [] } }
    saveSearchHistory: true, // whether to save incoming searches
    viewMode: "list", // "list" | "grid"
    lastSearch: null, // { type: 'single'|'bulk', ... }
  };

  const [data, setData] = useState(defaultData);

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

  // persist on change
  useEffect(() => {
    if (!isReady) return;
    storageSet(STORAGE_KEY, data);
  }, [data, isReady]);

  /* ---------- DOWNLOADS ---------- */
  const addDownload = (item) =>
    setData((s) => ({ ...s, downloads: [item, ...(s.downloads || [])] }));

  const removeDownload = (url) => {
    setData((s) => ({
      ...s,
      downloads: (s.downloads || []).filter((d) => d.webpage_url !== url),
    }));
  };

  const clearDownloads = () => setData((s) => ({ ...s, downloads: [] }));

  const getDownloads = () => data.downloads || [];

  /* ---------- SEARCH HISTORY ---------- */
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

  /* ---------- SAVE SEARCH FLAG ---------- */
  const setSaveSearchHistory = (enabled) =>
    setData((s) => ({ ...s, saveSearchHistory: !!enabled }));

  const getSaveSearchHistory = () => !!data.saveSearchHistory;

  /* ---------- VIEW MODE ---------- */
  const setViewMode = (mode) =>
    setData((s) => ({
      ...s,
      viewMode: mode || (s.viewMode === "list" ? "grid" : "list"),
    }));

  const getViewMode = () => data.viewMode;

  /* ---------- PLAYLISTS ---------- */
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

  /* ---------- LAST SEARCH CACHE ---------- */
  const setLastSearch = (payload) =>
    setData((s) => ({ ...s, lastSearch: payload || null }));

  const getLastSearch = () => data.lastSearch || null;

  const clearLastSearch = () => setData((s) => ({ ...s, lastSearch: null }));

  return (
    <AppStorageContext.Provider
      value={{
        data,
        isReady,
        setData,

        // Downloads
        addDownload,
        removeDownload,
        clearDownloads,
        getDownloads,

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
