/**
 * Format seconds into "M:SS" or "H:MM:SS".
 *
 * @param {number} value - time value (seconds by default unless `inputIsMs` is true)
 * @param {object} [opts]
 * @param {boolean} [opts.inputIsMs=false] - if true, treat `value` as milliseconds
 * @param {boolean} [opts.verbose=false] - if true, return verbose "1h 2m 03s"
 * @returns {string} formatted time
 */
export default function formatTime(value, opts = {}) {
  const { inputIsMs = false, verbose = false } = opts;

  if (typeof value !== "number" || !isFinite(value)) return "0:00";

  // Normalize to whole seconds, non-negative
  const totalSeconds = Math.max(
    0,
    Math.floor(inputIsMs ? value / 1000 : value)
  );

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad2 = (n) => String(n).padStart(2, "0");

  if (verbose) {
    const parts = [];
    if (hours) parts.push(`${hours}h`);
    if (minutes || hours) parts.push(`${minutes}m`);
    parts.push(`${pad2(seconds)}s`);
    return parts.join(" ");
  }

  if (hours > 0) {
    return `${hours}:${pad2(minutes)}:${pad2(seconds)}`;
  } else {
    return `${minutes}:${pad2(seconds)}`;
  }
}

// lib/responseUtils.js

/**
 * Helpers for detecting whether a search API response is:
 *  - a plain list of result items (normal search), or
 *  - a bulk response: array of blocks { search_term, results, count }
 *
 * The functions are defensive: they inspect a few elements, handle nested one-level wrappers,
 * and try not to throw on odd inputs.
 */

/** Small util: is a plain object (not null and not array) */
function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** Inspect up to n elements of an array, return a sample array */
function sampleElements(arr, n = 5) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, n);
}

/**
 * Detects bulk response shape.
 * Bulk = array of "blocks" where each block usually has:
 *   { search_term: {...}, results: [...], count: number }
 *
 * Returns true if it looks like bulk.
 */
export function isBulkResponse(payload) {
  if (!Array.isArray(payload)) return false;

  // empty array — ambiguous. Treat empty array as non-bulk (no blocks).
  if (payload.length === 0) return false;

  // unwrap one-layer array if top-level is [ [ ...blocks... ] ] (you showed a case like this)
  let first = payload[0];
  if (Array.isArray(first) && first.length > 0) {
    first = first[0];
  }

  // must be an object with a results array OR a search_term key
  if (!isPlainObject(first)) return false;

  // If the element has "results" and it's an array -> bulk
  if (Array.isArray(first.results)) return true;

  // Or if it has search_term + count keys -> bulk
  if ("search_term" in first && ("count" in first || "results" in first))
    return true;

  // scan a few elements: if many have results arrays, treat as bulk
  const sample = sampleElements(
    Array.isArray(payload[0]) ? payload[0] : payload,
    4
  );
  const hits = sample.filter(
    (el) => isPlainObject(el) && Array.isArray(el.results)
  ).length;
  if (hits >= 1) return true;

  return false;
}

/**
 * Detects plain item list shape (normal search).
 * Heuristics:
 *  - payload is an array (possibly empty)
 *  - elements are objects and have at least one of the typical item keys:
 *    'webpage_url' | 'largest_thumbnail' | 'title' | 'uploader'
 *
 * Returns true for empty array as well (empty result list).
 */
export function isItemList(payload) {
  if (!Array.isArray(payload)) return false;

  // empty array -> treat as item list (no results)
  if (payload.length === 0) return true;

  // unwrap one-layer array if top-level is [ [ ...items... ] ]
  let arr = payload;
  if (Array.isArray(payload[0]) && payload.length === 1) {
    arr = payload[0];
    if (!Array.isArray(arr)) return false;
    if (arr.length === 0) return true;
  }

  const sample = sampleElements(arr, 6);

  // fields commonly present on result items
  const itemKeys = [
    "webpage_url",
    "largest_thumbnail",
    "thumbnail",
    "title",
    "uploader",
    "duration",
  ];

  // count how many sample elements look like items
  let itemLike = 0;
  for (const el of sample) {
    if (!isPlainObject(el)) continue;
    const hasAnyKey = itemKeys.some((k) => k in el);
    if (hasAnyKey) itemLike++;
  }

  // if majority of sampled elements look like items -> treat as item list
  return itemLike >= Math.ceil(sample.length / 2);
}

/**
 * Normalize a response into a shape the UI can consume.
 * Returns:
 *  - { type: "bulk", blocks: [ { search_term, results, count }, ... ] }
 *  - { type: "list", items: [ ... ] }
 *  - { type: "unknown", raw: payload }
 */
export function normalizeSearchResponse(payload) {
  // bulk?
  if (isBulkResponse(payload)) {
    // unwrap if necessary: sometimes the backend returns [ [ blocks... ] ]
    let blocks =
      Array.isArray(payload[0]) && payload.length === 1 ? payload[0] : payload;

    // defensive: ensure each block has a results array
    blocks = blocks.map((b) => {
      if (!isPlainObject(b))
        return { search_term: null, results: [], count: 0 };
      return {
        search_term: b.search_term ?? null,
        results: Array.isArray(b.results) ? b.results : [],
        count:
          typeof b.count === "number"
            ? b.count
            : Array.isArray(b.results)
            ? b.results.length
            : 0,
      };
    });

    return { type: "bulk", blocks };
  }

  // item list?
  if (isItemList(payload)) {
    // unwrap one-layer wrapper if exists
    const items =
      Array.isArray(payload[0]) && payload.length === 1 ? payload[0] : payload;
    return { type: "list", items: Array.isArray(items) ? items : [] };
  }

  // fallback
  return { type: "unknown", raw: payload };
}
