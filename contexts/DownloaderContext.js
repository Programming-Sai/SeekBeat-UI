// hooks/useDownloader.js
import { useCallback } from "react";
import { useAppStorage } from "../contexts/AppStorageContext";

/**
 * useDownloader - returns a `download` function to trigger backend POST download.
 * - song: object that must contain at least `.id` (or webpage_url) and optionally metadata
 * - edits: optional edits JSON to send in POST body
 */
export function useDownloader(streamBase = "http://localhost:8000") {
  const { addDownload, updateDownload, setDownloadStatus } = useAppStorage();

  const download = useCallback(
    async (song, edits = {}) => {
      if (!song?.id && !song?.webpage_url) throw new Error("missing video id");
      const id = song?.id ?? song?.webpage_url;

      // normalized download record to persist
      const initialRecord = {
        id,
        webpage_url: song?.webpage_url ?? null,
        song: song, // keep a copy of metadata handy
        status: "pending",
        filename: null,
        startedAt: Date.now(),
        finishedAt: null,
        error: null,
        edits: edits || {},
      };

      // persist or merge existing
      addDownload(initialRecord);

      // set transient/persistent status (pending)
      setDownloadStatus(id, "pending");

      try {
        const res = await fetch(
          `${streamBase}/api/stream/${encodeURIComponent(id)}/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ edits: edits || {} }),
          }
        );

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`Download failed: ${res.status} ${text}`);
        }

        // parse filename if present
        const cd = res.headers.get("content-disposition") || "";
        let filename = `${song?.title ?? id}.mp3`;
        const m = cd.match(/filename="?([^"]+)"?/);
        if (m?.[1]) filename = m[1];

        const blob = await res.blob();

        // trigger automatic download in browser
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        // mark done in persisted downloads
        updateDownload(id, {
          status: "done",
          filename,
          finishedAt: Date.now(),
          error: null,
        });

        // set transient "done" and then reset to idle after 3s (handled by context TTL)
        setDownloadStatus(id, "done", { transientTTL: 3000 });

        return { filename };
      } catch (err) {
        console.error("download error", err);
        updateDownload(id, {
          status: "error",
          error: String(err),
          finishedAt: Date.now(),
        });
        setDownloadStatus(id, "error");
        throw err;
      }
    },
    [addDownload, updateDownload, setDownloadStatus, streamBase]
  );

  return { download };
}
