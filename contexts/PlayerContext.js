// contexts/PlayerContext.js
import { useRouter } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

/**
 * PlayerContext - adjusted:
 *  - do NOT abort inFlight fetches inside cleanupAudio (fixes immediate-cancel bug)
 *  - keep race protections and caching
 */

const PlayerContext = createContext(null);

export function PlayerProvider({ children, streamBase = null }) {
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState("none");

  const [miniVisible, setMiniVisible] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isEditor, setIsEditor] = useState(false);

  const [streamUrl, setStreamUrl] = useState(null);
  const [loadingStream, setLoadingStream] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volumeValue, setVolumeValueState] = useState(1);
  const [playbackRate, setPlaybackRateState] = useState(1);

  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const router = useRouter();

  const audioRef = useRef(null);
  const loadIdRef = useRef(0);
  const nextTrackRef = useRef(null);

  const queueRef = useRef(queue);
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const currentIndexRef = useRef(currentIndex);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const miniVisibleRef = useRef(miniVisible);
  useEffect(() => {
    miniVisibleRef.current = miniVisible;
  }, [miniVisible]);

  const cacheRef = useRef(new Map());
  const inFlightRef = useRef({});
  const currentLoadKeyRef = useRef(null);
  const prefetchControllersRef = useRef(new Map());
  const prevTrackKeyRef = useRef(null);
  const playFailedForKeyRef = useRef(new Set());

  const currentTrack =
    currentIndex >= 0 && queue[currentIndex] ? queue[currentIndex] : null;

  const songKeyFor = (song) => {
    if (!song) return null;
    return song.id ?? song.webpage_url ?? song.title ?? null;
  };

  const isSameOrigin = (url) => {
    try {
      const u = new URL(url, window.location.href);
      return u.origin === window.location.origin;
    } catch (e) {
      return false;
    }
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const safeSetCurrentIndex = useCallback((idx) => {
    const len = (queueRef.current && queueRef.current.length) || 0;
    if (typeof idx !== "number" || idx < 0 || idx >= len) {
      if (len === 0) setCurrentIndex(-1);
      else setCurrentIndex(clamp(idx, 0, Math.max(0, len - 1)));
      return;
    }
    setCurrentIndex(idx);
  }, []);

  const setQueueSafe = useCallback((arr) => {
    if (!Array.isArray(arr)) {
      setQueue([]);
      setCurrentIndex(-1);
      setPosition(0);
      setDuration(0);
      setIsPlaying(false);
      return;
    }
    const next = arr.slice(0, 50);
    setQueue(next);
    setCurrentIndex((ci) =>
      next.length === 0 ? -1 : ci >= 0 && ci < next.length ? ci : 0
    );
  }, []);

  const cleanupAudio = useCallback(() => {
    // IMPORTANT: Do NOT abort inFlightRef fetch controllers here.
    // Aborting prefetch/in-flight fetches here causes fetchStreamForKey to reuse aborted promises.
    // Only clean up the audio element and audio-related state.
    const a = audioRef.current;
    if (!a) {
      setStreamUrl(null);
      setIsPlaying(false);
      setIsBuffering(false);
      return;
    }
    try {
      a.pause();
    } catch (e) {
      /* ignore */
    }
    a.onloadedmetadata = null;
    a.ontimeupdate = null;
    a.onended = null;
    a.onplay = null;
    a.onpause = null;
    a.onerror = null;
    try {
      a.src = "";
    } catch (e) {}
    audioRef.current = null;
    setStreamUrl(null);
    setIsPlaying(false);
    setIsBuffering(false);
  }, []);

  const stopRaf = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTimeRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (currentTrack && typeof currentTrack.duration === "number") {
      setDuration(currentTrack.duration);
      setPosition(0);
    } else {
      setDuration(0);
      setPosition(0);
    }
  }, [currentTrack]);

  // helper: map a stream src back to the cache key (reverse lookup)
  const keyForAudioSrc = (src) => {
    for (const [k, v] of cacheRef.current.entries()) {
      if (v?.src && (v.src === src || v.src.endsWith(src))) return k;
    }
    return null;
  };

  const createAndAttachAudio = useCallback(
    (src, { autoplay = true } = {}) => {
      if (!src) return null;
      const existing = audioRef.current;
      if (existing && existing.src) {
        const existingSrc = existing.src;
        if (existingSrc === src || existingSrc.endsWith(src)) {
          try {
            existing.volume = clamp(volumeValue, 0, 1);
            existing.playbackRate = playbackRate;
          } catch (e) {}
          stopRaf();
          setStreamUrl(src);
          if (autoplay && existing.paused) existing.play().catch(() => {});
          return existing;
        }
      }

      cleanupAudio();

      const audio = new Audio(src);
      if (isSameOrigin(src)) audio.crossOrigin = "anonymous";
      audio.preload = "auto";
      audio.volume = clamp(volumeValue, 0, 1);
      audio.playbackRate = playbackRate;

      setIsBuffering(true);

      audio.onloadedmetadata = () =>
        setDuration(isFinite(audio.duration) ? audio.duration : 0);
      audio.ontimeupdate = () => setPosition(audio.currentTime);
      audio.onended = () => {
        if (repeatMode === "one") {
          audio.currentTime = 0;
          audio
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        } else {
          nextTrackRef.current?.(!miniVisibleRef.current);
        }
      };
      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onerror = (ev) => {
        console.warn("Audio error", ev);
        setIsPlaying(false);
        setIsBuffering(false);
      };
      audio.oncanplay = () => setIsBuffering(false);

      audioRef.current = audio;
      setStreamUrl(src);
      stopRaf();

      if (autoplay) {
        audio
          .play()
          .then(() => {
            setIsPlaying(true);
            // if previously marked failed, remove from failed set
            try {
              playFailedForKeyRef.current.delete(keyForAudioSrc(src));
            } catch (e) {}
          })
          .catch((err) => {
            // classify the error (autoplay/NotAllowed or other)
            console.warn("Audio play() failed:", err);

            // mark as not playing but do NOT trigger an automatic reload
            setIsPlaying(false);

            // mark that this key failed to play so we don't retry automatically
            try {
              const key = keyForAudioSrc(src);
              if (key) playFailedForKeyRef.current.add(key);
            } catch (e) {}

            // keep the audio element attached (so user can manually resume)
          });
      } else {
        setIsPlaying(false);
      }

      return audio;
    },
    [cleanupAudio, playbackRate, volumeValue, stopRaf]
  );

  const fetchStreamForKey = useCallback(async (endpoint, key) => {
    if (!endpoint || !key) return null;
    const cached = cacheRef.current.get(key);
    if (cached?.src) return cached.src;

    if (inFlightRef.current[key]) {
      return inFlightRef.current[key].promise;
    }

    const controller = new AbortController();
    const promise = (async () => {
      try {
        const res = await fetch(endpoint, { signal: controller.signal });
        if (!res.ok) throw new Error("fetch failed: " + res.status);
        const data = await res.json();
        const src = data?.stream_url ?? data?.streamUrl ?? null;
        if (!src) throw new Error("no stream_url in backend response");
        cacheRef.current.set(key, { src, ts: Date.now() });
        return src;
      } finally {
        delete inFlightRef.current[key];
      }
    })();

    inFlightRef.current[key] = { controller, promise };
    return promise;
  }, []);

  const getStreamUrl = useCallback(
    (song) => {
      if (!song) return null;
      if (streamBase) {
        return `${streamBase}/api/stream/${encodeURIComponent(
          song.id || song.webpage_url || ""
        )}/`;
      }
      return null;
    },
    [streamBase]
  );

  const prefetchForIndex = useCallback(
    async (idx) => {
      const q = queueRef.current;
      if (!Array.isArray(q) || idx < 0 || idx >= q.length) return;
      const song = q[idx];
      const key = songKeyFor(song);
      if (!key) return;
      if (cacheRef.current.has(key)) return;
      const endpoint = getStreamUrl(song);
      if (!endpoint) return;
      try {
        await fetchStreamForKey(endpoint, key);
      } catch (err) {
        if (err?.name !== "AbortError") console.warn("prefetch failed", err);
      }
    },
    [fetchStreamForKey, getStreamUrl]
  );

  const loadStreamForIndex = useCallback(
    async (idx, { autoplay = true } = {}) => {
      // console.log("Song should have loaded by now.");
      const q = queueRef.current;
      if (!Array.isArray(q) || idx < 0 || idx >= q.length) return null;
      const song = q[idx];
      const key = songKeyFor(song);
      if (!key) return null;

      // If we previously tried to play this key and it failed, don't auto-retry.
      // If we have the cached src, attach it but DO NOT autoplay (let user gesture resume).
      if (playFailedForKeyRef.current.has(key)) {
        const cached = cacheRef.current.get(key);
        if (cached?.src) {
          setLoadingStream(false);
          setIsBuffering(false);
          // attach cached src but do not autoplay to avoid repeated failures
          return createAndAttachAudio(cached.src, { autoplay: false });
        }
        // not cached and previously failed -> bail
        setLoadingStream(false);
        setIsBuffering(false);
        return null;
      }

      const thisLoadId = ++loadIdRef.current;
      const endpoint = getStreamUrl(song);
      if (!endpoint) {
        console.warn("no stream endpoint for song", song);
        return null;
      }

      const cached = cacheRef.current.get(key);
      if (cached?.src) {
        if (thisLoadId !== loadIdRef.current) return null;
        setLoadingStream(false);
        const existing = audioRef.current;
        if (
          existing &&
          (existing.src === cached.src || existing.src.endsWith(cached.src))
        ) {
          try {
            existing.volume = clamp(volumeValue, 0, 1);
            existing.playbackRate = playbackRate;
          } catch (e) {}
          if (autoplay && existing.paused) existing.play().catch(() => {});
          return existing;
        }
        return createAndAttachAudio(cached.src, { autoplay });
      }

      if (currentLoadKeyRef.current && currentLoadKeyRef.current !== key) {
        try {
          const prev = inFlightRef.current[currentLoadKeyRef.current];
          prev?.controller?.abort();
        } catch (e) {
          console.warn("failed to abort previous load", e);
        }
        currentLoadKeyRef.current = null;
      }

      currentLoadKeyRef.current = key;
      setLoadingStream(true);
      setIsBuffering(true);

      try {
        const src = await fetchStreamForKey(endpoint, key);

        if (thisLoadId !== loadIdRef.current) {
          setLoadingStream(false);
          setIsBuffering(false);
          return null;
        }

        const currentSelectedKey =
          queueRef.current && currentIndexRef.current >= 0
            ? songKeyFor(queueRef.current[currentIndexRef.current])
            : null;
        if (currentLoadKeyRef.current !== key && currentSelectedKey !== key) {
          setLoadingStream(false);
          setIsBuffering(false);
          return null;
        }

        const audio = createAndAttachAudio(src, { autoplay });
        setLoadingStream(false);
        currentLoadKeyRef.current = null;

        if (!shuffle && q.length > 1) {
          const nextIdx =
            idx + 1 < q.length ? idx + 1 : repeatMode === "all" ? 0 : null;
          if (nextIdx !== null) prefetchForIndex(nextIdx);
        }
        return audio;
      } catch (err) {
        if (err?.name === "AbortError") {
          /* aborted */
        } else {
          console.error("Error resolving stream:", err);
        }
        setLoadingStream(false);
        setIsBuffering(false);
        currentLoadKeyRef.current = null;
        return null;
      }
    },
    [
      getStreamUrl,
      createAndAttachAudio,
      fetchStreamForKey,
      prefetchForIndex,
      shuffle,
      repeatMode,
      volumeValue,
      playbackRate,
    ]
  );

  const play = useCallback(() => {
    const a = audioRef.current;
    if (!a) {
      if (currentIndex >= 0)
        loadStreamForIndex(currentIndex, { autoplay: true });
      return;
    }
    a.play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }, [currentIndex, loadStreamForIndex]);

  const pause = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    try {
      a.pause();
    } catch (e) {
      console.warn(String(e));
    }
    setIsPlaying(false);
  }, []);

  const playPause = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  const playIndex = useCallback(
    async (idx) => {
      // console.log("Should be playing a song now.");
      const q = queueRef.current || [];
      if (!Array.isArray(q) || q.length === 0) return;
      if (idx < 0 || idx >= q.length) return;

      setLoadingStream(true);
      setIsBuffering(true);

      cleanupAudio();
      setCurrentIndex(idx);
      setPosition(0);
      setIsPlaying(true);

      try {
        await loadStreamForIndex(idx, { autoplay: true });
      } catch (e) {
        console.warn("Error loading stream in playIndex:", e);
      }
    },
    [cleanupAudio, loadStreamForIndex]
  );

  const nextTrack = useCallback(
    (shouldNavigate = false) => {
      cleanupAudio();
      setPosition(0);
      const len = queueRef.current.length;
      const ci = currentIndexRef.current;
      let nextIdx = null;
      if (!len) {
        setIsPlaying(false);
        return;
      }
      if (shuffle && len > 1) {
        do {
          nextIdx = Math.floor(Math.random() * len);
        } while (nextIdx === ci);
      } else if (ci + 1 >= len) {
        if (repeatMode === "all") {
          nextIdx = 0;
        } else {
          setCurrentIndex(ci);
          setIsPlaying(false);
          return;
        }
      } else {
        nextIdx = ci + 1;
      }
      setCurrentIndex(nextIdx);
      playIndex(nextIdx);
      if (shouldNavigate)
        router.push(
          `/player/${queueRef.current[nextIdx]?.id}${
            isEditor ? "?edit=true" : ""
          }`
        );
    },
    [cleanupAudio, playIndex, shuffle, repeatMode, router, isEditor]
  );

  useEffect(() => {
    nextTrackRef.current = nextTrack;
  }, [nextTrack]);

  const prev = useCallback(() => {
    cleanupAudio();
    setPosition(0);
    const nextIdx = Math.max(0, currentIndexRef.current - 1);
    setCurrentIndex(nextIdx);
    playIndex(nextIdx);
  }, [cleanupAudio, playIndex]);

  const playSong = useCallback(
    (song, addToQueue = true) => {
      if (!song) return;
      if (addToQueue) {
        setQueue((q) => {
          const next = [...(q || [])];
          const found = next.findIndex(
            (t) =>
              (t.webpage_url &&
                song.webpage_url &&
                t.webpage_url === song.webpage_url) ||
              t.title === song.title
          );
          if (found >= 0) {
            setCurrentIndex(found);
            playIndex(found);
          } else {
            next.push(song);
            if (next.length > 50) next.splice(0, next.length - 50);
            const newIdx = next.length - 1;
            setCurrentIndex(newIdx);
            playIndex(newIdx);
          }
          return next;
        });
      } else {
        setQueue([song]);
        setCurrentIndex(0);
        playIndex(0);
      }
      setPosition(0);
    },
    [playIndex]
  );

  const setQueueFromSearchResults = useCallback(
    (results = [], startIndex = 0) => {
      const next = Array.isArray(results) ? results.slice(0, 50) : [];
      setQueue(next);
      queueRef.current = next;
      const idx = Math.max(0, Math.min(startIndex, next.length - 1));
      setCurrentIndex(next.length ? idx : -1);
      setPosition(0);
      setIsPlaying(false);
    },
    []
  );

  const removeFromQueue = useCallback((identifier) => {
    setQueue((q) => {
      if (!Array.isArray(q) || q.length === 0) return q || [];
      if (typeof identifier === "number") {
        const next = [...q];
        next.splice(identifier, 1);
        setCurrentIndex((ci) => {
          if (next.length === 0) return -1;
          if (identifier < ci) return ci - 1;
          if (identifier === ci) {
            setIsPlaying(false);
            setPosition(0);
            return Math.max(0, ci - 1);
          }
          return ci;
        });
        return next;
      } else {
        const next = q.filter((t) => {
          if (!t) return true;
          return t.webpage_url !== identifier && t.title !== identifier;
        });
        if (next.length === 0) {
          setCurrentIndex(-1);
          setIsPlaying(false);
          setPosition(0);
        }
        return next;
      }
    });
  }, []);

  const showMiniForIndex = useCallback(
    (idx, shouldPlay = false) => {
      if (!Array.isArray(queueRef.current) || queueRef.current.length === 0) {
        setMiniVisible(false);
        return;
      }
      if (
        typeof idx !== "number" ||
        idx < 0 ||
        idx >= queueRef.current.length
      ) {
        setMiniVisible(false);
        return;
      }
      setCurrentIndex(idx);
      setPosition(0);
      setMiniVisible(true);
      if (shouldPlay) playIndex(idx);
    },
    [playIndex]
  );

  const sameSong = (a, b) => {
    if (!a || !b) return false;
    if (a.webpage_url && b.webpage_url) return a.webpage_url === b.webpage_url;
    if (a.id && b.id) return a.id === b.id;
    return a.title === b.title;
  };

  const moveQueueItem = useCallback((fromIndex, toIndex) => {
    setQueue((prev) => {
      if (!Array.isArray(prev)) return prev || [];
      const len = prev.length;
      if (fromIndex < 0 || fromIndex >= len) return prev;
      if (toIndex < 0) toIndex = 0;
      if (toIndex >= len) toIndex = len - 1;
      if (fromIndex === toIndex) return prev;
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      setCurrentIndex((ci) => {
        if (ci === fromIndex) return toIndex;
        if (fromIndex < ci && toIndex >= ci) return Math.max(0, ci - 1);
        if (fromIndex > ci && toIndex <= ci)
          return Math.min(next.length - 1, ci + 1);
        return ci;
      });
      return next;
    });
  }, []);

  const reorderQueue = useCallback(
    (newQueue = []) => {
      if (!Array.isArray(newQueue)) return;
      const next = newQueue.slice(0, 50);
      setQueue((prev) => {
        const cur =
          prev && prev.length && currentIndex >= 0 ? prev[currentIndex] : null;
        if (!cur) {
          setCurrentIndex(next.length ? 0 : -1);
          return next;
        }
        const newIndex = next.findIndex((t) => sameSong(t, cur));
        if (newIndex >= 0) setCurrentIndex(newIndex);
        else {
          const idx = Math.max(0, Math.min(currentIndex, next.length - 1));
          setCurrentIndex(next.length ? idx : -1);
          if (!next.length) setIsPlaying(false);
        }
        return next;
      });
    },
    [currentIndex]
  );

  const stop = useCallback(() => {
    cleanupAudio();
    setPosition(0);
    setIsPlaying(false);
    setCurrentIndex(-1);
  }, [cleanupAudio]);

  const closeMini = useCallback(
    (pausePlayback = true) => {
      setMiniVisible(false);
      if (pausePlayback) pause();
    },
    [pause]
  );

  const seek = useCallback(
    (toSec) => {
      const a = audioRef.current;
      if (a) {
        const clamped = Math.max(
          0,
          Math.min(toSec, a.duration || duration || 0)
        );
        a.currentTime = clamped;
        setPosition(clamped);
      } else {
        const clamped = Math.max(0, Math.min(toSec, duration || 0));
        setPosition(clamped);
      }
    },
    [duration]
  );

  const setPositionExternal = useCallback((sec) => setPosition(sec), []);
  const setDurationExternal = useCallback((sec) => setDuration(sec), []);

  const setVolumeValue = useCallback((val0to1) => {
    const v = clamp(Number(val0to1) || 0, 0, 1);
    setVolumeValueState(v);
    if (audioRef.current)
      try {
        audioRef.current.volume = v;
      } catch (e) {
        console.warn("Failed to set volume on audio element", e);
      }
  }, []);

  const setPlaybackRate = useCallback((rate) => {
    const r = Number(rate) || 1;
    setPlaybackRateState(r);
    if (audioRef.current)
      try {
        audioRef.current.playbackRate = r;
      } catch (e) {
        console.warn("Failed to set playbackRate on audio element", e);
      }
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try {
        for (const k of Object.keys(inFlightRef.current || {})) {
          try {
            inFlightRef.current[k]?.controller?.abort();
          } catch (e) {}
        }
      } catch (e) {}
      cleanupAudio();
    };
  }, [cleanupAudio]);

  const api = {
    queue,
    currentIndex,
    currentTrack,
    setCurrentIndex: safeSetCurrentIndex,
    isPlaying,
    position,
    duration,
    playIndex,
    playSong,
    playPause,
    play,
    pause,
    stop,
    next: nextTrack,
    prev,
    seek,
    setPosition: setPositionExternal,
    setDuration: setDurationExternal,
    setQueueFromSearchResults,
    removeFromQueue,
    setQueue: setQueueSafe,
    reorderQueue,
    moveQueueItem,
    getStreamUrl,
    miniVisible,
    showMiniForIndex,
    closeMini,
    shuffle,
    setShuffle,
    setRepeatMode,
    repeatMode,
    toggleShuffle: () => setShuffle((s) => !s),
    cycleRepeatMode: () =>
      setRepeatMode((prev) =>
        prev === "none" ? "all" : prev === "all" ? "one" : "none"
      ),
    isEditor,
    setIsEditor,
    streamUrl,
    loadingStream,
    setVolumeValue,
    setPlaybackRate,
    loadStreamForIndex,
    _streamCache: () => Array.from(cacheRef.current.entries()),
    isBuffering,
    cleanupAudio,
  };

  return (
    <PlayerContext.Provider value={api}>{children}</PlayerContext.Provider>
  );
}

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
};
