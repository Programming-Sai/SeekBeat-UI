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

function extractVideoId(url) {
  try {
    const u = new URL(url);
    return u.searchParams.get("v"); // works for "https://www.youtube.com/watch?v=PEwy4U1OkBA"
  } catch {
    return null;
  }
}

function augmentWithId(normalized) {
  if (!normalized) return null;

  if (normalized.type === "list") {
    return {
      ...normalized,
      items: normalized.items.map((song) => ({
        ...song,
        id: extractVideoId(song.webpage_url),
      })),
    };
  }

  if (normalized.type === "bulk") {
    return {
      ...normalized,
      blocks: normalized.blocks.map((block) => ({
        ...block,
        results: block.results.map((song) => ({
          ...song,
          id: extractVideoId(song.webpage_url),
        })),
      })),
    };
  }

  return normalized;
}

// const searchBase = "https://0bea512690fc.ngrok-free.app";
// const searchBase = "https://seekbeat.onrender.com";

export function SearchProvider({
  children,
  defaultPageSize = 12,
  searchBase = "https://0bea512690fc.ngrok-free.app",
}) {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState(null);
  const [normalized, setNormalized] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [focusSearch, setFocusSearch] = useState(() => () => {});
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

  // diagnostic submitSearch + submitBulk
  // paste into your SearchContext.js replacing the existing functions

  // helper to read a safe preview of the body
  async function readBodyPreview(res) {
    // always read as text (safe) and return first N chars
    const text = await res.text();
    const preview = text.slice(0, 1200); // increase if you want larger preview
    return { text, preview };
  }

  const submitSearch = useCallback(
    async (q = query) => {
      if (!q || !q.trim()) {
        clearResults();
        return;
      }

      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch (e) {}
      }
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);

      const url = `${searchBase}/api/search/?query=${encodeURIComponent(q)}`;
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            // other headers you need...
            "ngrok-skip-browser-warning": "true",
          },
        });
        console.log("[SEARCH] Request URL:", url);
        console.log("[SEARCH] Response URL (final):", res.url);
        console.log("[SEARCH] Status:", res.status, res.statusText);

        // log headers
        console.group("[SEARCH] Response headers");
        res.headers.forEach((v, k) => console.log(k, ":", v));
        console.groupEnd();

        const contentType = (
          res.headers.get("content-type") || ""
        ).toLowerCase();

        // If not JSON, capture a preview of the body and throw with details
        if (!contentType.includes("application/json")) {
          const { preview } = await readBodyPreview(res);
          const errMsg =
            `Expected JSON but got "${contentType || "none"}" (status ${
              res.status
            }). ` + `Response preview:\n${preview}`;
          console.error("[SEARCH] Non-JSON response preview:", preview);
          throw new Error(errMsg);
        }

        if (!res.ok) {
          // try to parse JSON error body
          const jsonErr = await res.json().catch(() => null);
          const errText = jsonErr?.message || `Search failed: ${res.status}`;
          throw new Error(errText);
        }

        const json = await res.json();
        console.log("[SEARCH] JSON result:", json);
        setResponse(json);

        const norm = normalizeSearchResponse(json);
        setNormalized(augmentWithId(norm));
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

  const submitBulk = useCallback(
    async (queries = []) => {
      const qarr = (queries || []).map((q) => (q || "").trim()).filter(Boolean);
      if (!qarr.length) {
        clearResults();
        return;
      }

      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch (e) {}
      }
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);

      const queriesParam = encodeURIComponent(qarr.join(","));
      const url = `${searchBase}/api/search/bulk/?queries=${queriesParam}`;

      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            // other headers you need...
            "ngrok-skip-browser-warning": "true",
          },
        });
        console.log("[BULK SEARCH] Request URL:", url);
        console.log("[BULK SEARCH] Response URL (final):", res.url);
        console.log("[BULK SEARCH] Status:", res.status, res.statusText);
        console.group("[BULK SEARCH] Response headers");
        res.headers.forEach((v, k) => console.log(k, ":", v));
        console.groupEnd();

        const contentType = (
          res.headers.get("content-type") || ""
        ).toLowerCase();
        if (!contentType.includes("application/json")) {
          const { preview } = await readBodyPreview(res);
          const errMsg = `Expected JSON but got "${
            contentType || "none"
          }" (status ${res.status}). Response preview:\n${preview}`;
          console.error("[BULK SEARCH] Non-JSON response preview:", preview);
          throw new Error(errMsg);
        }

        if (!res.ok) {
          const jsonErr = await res.json().catch(() => null);
          const errText =
            jsonErr?.message || `Bulk search failed: ${res.status}`;
          throw new Error(errText);
        }

        const json = await res.json();
        console.log("[BULK SEARCH] JSON result:", json);
        setResponse(json);

        const norm = normalizeSearchResponse(json);
        setNormalized(augmentWithId(norm));
        setPage(1);
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
        setIsLoading,
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
        focusSearch,
        setFocusSearch,
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
