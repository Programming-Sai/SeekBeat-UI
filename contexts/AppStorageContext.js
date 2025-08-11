// contexts/AppStorageContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { storageGet, storageSet } from "../lib/storage";

const STORAGE_KEY = "@seekbeat:appdata";

const AppStorageContext = createContext(null);

export function AppStorageProvider({ children }) {
  const [isReady, setReady] = useState(false);

  // data shape:
  // { downloads: [{id, title, path, size, addedAt}], searchHistory: [query,..], playlists: {...}, ... }
  const [data, setData] = useState({
    downloads: [],
    searchHistory: [],
    playlists: {},
    // add more keys as needed
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const stored = await storageGet(STORAGE_KEY, null);
      if (!mounted) return;
      if (stored) setData(stored);
      setReady(true);
    })();
    return () => (mounted = false);
  }, []);

  // persist on change (debounce if you expect many changes)
  useEffect(() => {
    if (!isReady) return;
    storageSet(STORAGE_KEY, data);
  }, [data, isReady]);

  // helpers
  const addDownload = (item) =>
    setData((s) => ({ ...s, downloads: [item, ...s.downloads] }));
  const removeDownload = (id) =>
    setData((s) => ({
      ...s,
      downloads: s.downloads.filter((d) => d.id !== id),
    }));

  const pushSearch = (query) =>
    setData((s) => {
      const arr = [query, ...s.searchHistory.filter((q) => q !== query)].slice(
        0,
        50
      );
      return { ...s, searchHistory: arr };
    });

  const clearSearchHistory = () =>
    setData((s) => ({ ...s, searchHistory: [] }));

  const setPlaylists = (playlists) => setData((s) => ({ ...s, playlists }));

  return (
    <AppStorageContext.Provider
      value={{
        data,
        isReady,
        addDownload,
        removeDownload,
        pushSearch,
        clearSearchHistory,
        setPlaylists,
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
