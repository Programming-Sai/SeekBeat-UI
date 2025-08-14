// contexts/SearchContext.js
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { normalizeSearchResponse } from "../lib/utils";
import { useAppStorage } from "./AppStorageContext";

const SearchContext = createContext(null);

export function SearchProvider({ children, defaultPageSize = 12 }) {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState(null);
  const [normalized, setNormalized] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [viewMode, setViewMode] = useState("list");

  const { pushSearch } = useAppStorage ? useAppStorage() : { pushSearch: null };

  const abortRef = useRef(null);

  const clearResults = useCallback(() => {
    setResponse(null);
    setNormalized(null);
    setError(null);
    setIsLoading(false);
    setPage(1);
  }, []);

  // submit single query (call on Enter or Submit button)
  const submitSearch = useCallback(
    async (q = query) => {
      if (!q || !q.trim()) {
        clearResults();
        return;
      }

      // cancel previous
      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch (e) {}
      }
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);

      try {
        // NOTE: backend expects `?query=...`
        const url = `https://seekbeat.onrender.com/api/search/?query=${encodeURIComponent(
          q
        )}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          let txt = `Search failed: ${res.status}`;
          try {
            const jsonErr = await res.json();
            if (jsonErr?.message) txt = jsonErr.message;
          } catch (_) {}
          throw new Error(txt);
        }
        const json = await res.json();
        console.log("Search Result: ", json);

        setResponse(json);

        const norm = normalizeSearchResponse(json);
        setNormalized(norm);

        setPage(1);
        try {
          pushSearch && typeof pushSearch === "function" && pushSearch(q);
        } catch (err) {
          console.warn("pushSearch failed:", err);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Search error:", err);
          setError(err.message || String(err));
        }
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [query, clearResults, pushSearch]
  );

  // submit bulk queries array -> calls your bulk endpoint
  const submitBulk = useCallback(
    async (queries = []) => {
      // sanitize
      const qarr = (queries || []).map((q) => (q || "").trim()).filter(Boolean);
      if (!qarr.length) {
        clearResults();
        return;
      }

      // cancel previous
      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch (e) {}
      }
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);

      try {
        // join with commas and encode as single param value
        // backend expects: /api/search/bulk/?queries=rustage%2Cpure%20o%20juice
        const queriesParam = encodeURIComponent(qarr.join(","));
        const url = `https://seekbeat.onrender.com/api/search/bulk/?queries=${queriesParam}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          let txt = `Bulk search failed: ${res.status}`;
          try {
            const jsonErr = await res.json();
            if (jsonErr?.message) txt = jsonErr.message;
          } catch (_) {}
          throw new Error(txt);
        }
        const json = await res.json();
        console.log("Search Result: ", json);
        setResponse(json);

        const norm = normalizeSearchResponse(json);
        setNormalized(norm);

        setPage(1);

        // push each query into history if desired
        try {
          qarr.forEach((q) => {
            pushSearch && typeof pushSearch === "function" && pushSearch(q);
          });
        } catch (err) {
          console.warn("pushSearch failed:", err);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Bulk search error:", err);
          setError(err.message || String(err));
        }
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [clearResults, pushSearch]
  );

  const getBlocks = useCallback(() => {
    if (!normalized) return [];
    return normalized.type === "bulk" ? normalized.blocks : [];
  }, [normalized]);

  const getFlatItems = useCallback(() => {
    if (!normalized) return [];
    if (normalized.type === "list") return normalized.items;
    if (normalized.type === "bulk" && normalized.blocks?.length === 1)
      return normalized.blocks[0].results;
    return [];
  }, [normalized]);

  const totalItems = getFlatItems().length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const getPageItems = useCallback(() => {
    const items = getFlatItems();
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [getFlatItems, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [normalized, pageSize]);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  return (
    <SearchContext.Provider
      value={{
        query,
        setQuery,
        submitSearch,
        submitBulk,
        clearResults,
        response,
        normalized,
        getBlocks,
        getFlatItems,
        isLoading,
        error,
        page,
        setPage,
        pageSize,
        setPageSize,
        totalItems,
        totalPages,
        getPageItems,
        viewMode,
        setViewMode,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within SearchProvider");
  return ctx;
}
