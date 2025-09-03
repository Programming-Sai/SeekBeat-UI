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
 * PlayerContext (updated)
 *
 * - Adds stream caching to avoid re-fetching backend stream_url.
 * - Volume / speed updates no longer recreate the audio element.
 * - Changing the queue / re-ordering won't force reload if the current track identity is unchanged.
 */

const PlayerContext = createContext(null);

export function PlayerProvider({
  children,
  streamBase = null /* optional backend base e.g. '/api/stream' */,
}) {
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState("none");

  const [miniVisible, setMiniVisible] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isEditor, setIsEditor] = useState(false);

  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const router = useRouter();

  // audio + fetch helpers
  const audioRef = useRef(null);
  const loadIdRef = useRef(0);
  const inflightControllerRef = useRef(null);

  // queueRef keeps a stable reference for functions that shouldn't re-create when queue changes
  const queueRef = useRef(queue);
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const miniVisibleRef = useRef(miniVisible);
  useEffect(() => {
    miniVisibleRef.current = miniVisible;
  }, [miniVisible]);

  const [streamUrl, setStreamUrl] = useState(null);
  const [loadingStream, setLoadingStream] = useState(false);
  const [volumeValue, setVolumeValueState] = useState(1); // 0..1
  const [playbackRate, setPlaybackRateState] = useState(1);

  // helper: current track
  const currentTrack =
    currentIndex >= 0 && queue[currentIndex] ? queue[currentIndex] : null;

  // utility to identify a song robustly
  const songKeyFor = (song) => {
    if (!song) return null;
    return song.id ?? song.webpage_url ?? song.title ?? null;
  };

  // prev track key to avoid reloading when queue recreated but same song
  const prevTrackKeyRef = useRef(null);
  // near top of PlayerProvider, add these refs/states
  const cacheRef = useRef(new Map()); // key: song id/webpage_url -> { src, ts }
  const inFlightRef = useRef({});
  const prefetchControllersRef = useRef(new Map()); // key -> AbortController for prefetches
  const [isBuffering, setIsBuffering] = useState(false); // new: buffering state exposed to UI

  // cap queue to 50 items safely
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
    setCurrentIndex((ci) => {
      if (next.length === 0) return -1;
      return ci >= 0 && ci < next.length ? ci : 0;
    });
  }, []);

  /* --------- Audio lifecycle: cleanup/create/attach --------- */
  const cleanupAudio = useCallback(() => {
    try {
      inflightControllerRef.current?.abort();
    } catch (e) {
      console.warn(String(e));
    }
    const a = audioRef.current;
    if (!a) return;
    try {
      a.pause();
    } catch (e) {
      console.warn(String(e));
    }
    a.onloadedmetadata = null;
    a.ontimeupdate = null;
    a.onended = null;
    a.onplay = null;
    a.onpause = null;
    a.onerror = null;
    try {
      a.src = "";
    } catch (e) {
      console.warn(String(e));
    }
    audioRef.current = null;
    setStreamUrl(null);
    setIsPlaying(false);
    setIsBuffering(false);
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

  const nextTrack = useCallback(
    (shouldNavigate = false) => {
      cleanupAudio();
      setPosition(0);
      setCurrentIndex((ci) => {
        if (shuffle && queueRef.current.length > 1) {
          let nextIdx;
          do {
            nextIdx = Math.floor(Math.random() * queueRef.current.length);
          } while (nextIdx === ci);

          if (shouldNavigate) {
            router.push(
              `/player/${queueRef.current[nextIdx]?.id}${
                isEditor ? "?edit=true" : ""
              }`
            );
          }
          return nextIdx;
        }

        if (ci + 1 >= queueRef.current.length) {
          if (repeatMode === "all") {
            if (shouldNavigate) {
              router.push(
                `/player/${queueRef.current[0]?.id}${
                  isEditor ? "?edit=true" : ""
                }`
              );
            }
            return 0;
          } else {
            setIsPlaying(false);
            return ci;
          }
        }

        if (shouldNavigate) {
          router.push(
            `/player/${queueRef.current[ci + 1]?.id}${
              isEditor ? "?edit=true" : ""
            }`
          );
        }
        return ci + 1;
      });
    },
    [shuffle, repeatMode, router, isEditor]
  );

  // RAF simulation (only used when there is no real audio element)
  const startRaf = useCallback(() => {
    if (rafRef.current) return;
    lastTimeRef.current = performance.now();
    const tick = (now) => {
      const last = lastTimeRef.current || now;
      const dt = (now - last) / 1000;
      lastTimeRef.current = now;

      setPosition((p) => {
        const nextPos = p + dt;
        if (duration && nextPos >= duration) {
          setTimeout(() => {
            if (repeatMode === "one") {
              setPosition(0);
            } else {
              nextTrack(!miniVisibleRef.current);
            }
          }, 0);
          return duration;
        }
        return nextPos;
      });

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [duration, nextTrack, repeatMode]);

  const stopRaf = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTimeRef.current = null;
    }
  }, []);

  useEffect(() => {
    // If we have a real audio element, let it update the position/time; stop RAF.
    if (audioRef.current) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }
    // otherwise we could run the simulated RAF when isPlaying true - left commented for now
    // if (isPlaying) startRaf(); else stopRaf();
  }, [isPlaying, startRaf, stopRaf]);

  /* --------- Controls --------- */
  // in playIndex
  const playIndex = useCallback(
    (idx) => {
      if (!Array.isArray(queue) || queue.length === 0) return;
      if (idx < 0 || idx >= queue.length) return;

      // user initiated -> stop current audio immediately
      cleanupAudio();

      setCurrentIndex(idx);
      setPosition(0);
      setIsPlaying(true);
    },
    [queue, cleanupAudio]
  );

  const playSong = useCallback((song, addToQueue = true) => {
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
        } else {
          next.push(song);
          if (next.length > 50) next.splice(0, next.length - 50);
          setCurrentIndex(next.length - 1);
        }
        return next;
      });
    } else {
      setQueue([song]);
      setCurrentIndex(0);
    }
    setPosition(0);
    setIsPlaying(true);
  }, []);

  const prev = useCallback(() => {
    cleanupAudio();
    setPosition(0);
    setCurrentIndex((ci) => Math.max(0, ci - 1));
    setIsPlaying(true);
  }, []);

  const setPositionExternal = useCallback((sec) => setPosition(sec), []);
  const setDurationExternal = useCallback((sec) => setDuration(sec), []);

  /* --------- Queue management (unchanged semantics) --------- */
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

  const showMiniForIndex = useCallback((idx, shouldPlay = false) => {
    if (!Array.isArray(queueRef.current) || queueRef.current.length === 0) {
      setMiniVisible(false);
      return;
    }
    if (typeof idx !== "number" || idx < 0 || idx >= queueRef.current.length) {
      setMiniVisible(false);
      return;
    }
    setCurrentIndex(idx);
    setPosition(0);
    setMiniVisible(true);
    if (shouldPlay) setIsPlaying(true);
  }, []);

  const closeMini = useCallback((pause = false) => {
    setMiniVisible(false);
    if (pause) setIsPlaying(false);
  }, []);

  const sameSong = (a, b) => {
    if (!a || !b) return false;
    if (a.webpage_url && b.webpage_url) return a.webpage_url === b.webpage_url;
    if (a.id && b.id) return a.id === b.id;
    return a.title === b.title;
  };

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
        if (newIndex >= 0) {
          setCurrentIndex(newIndex);
        } else {
          const idx = Math.max(0, Math.min(currentIndex, next.length - 1));
          setCurrentIndex(next.length ? idx : -1);
          if (!next.length) setIsPlaying(false);
        }
        return next;
      });
    },
    [currentIndex]
  );

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

  /* --------- Stream URL helper --------- */
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

  const isSameOrigin = (url) => {
    try {
      const u = new URL(url, window.location.href);
      return u.origin === window.location.origin;
    } catch (e) {
      return false;
    }
  };

  /**
   * createAndAttachAudio:
   * - DOES NOT always call cleanupAudio; that is decided by the caller.
   * - sets volume/playbackRate on newly created audio element using the current state
   */
  const createAndAttachAudio = useCallback(
    (src, { autoplay = true } = {}) => {
      cleanupAudio();
      if (!src) return null;

      const audio = new Audio(src);
      if (isSameOrigin(src)) audio.crossOrigin = "anonymous";
      audio.preload = "auto";

      audio.volume = Math.max(0, Math.min(1, volumeValue));
      audio.playbackRate = playbackRate;

      // important: buffering state
      setIsBuffering(true);

      audio.onloadedmetadata = () => {
        setDuration(isFinite(audio.duration) ? audio.duration : 0);
      };
      audio.ontimeupdate = () => setPosition(audio.currentTime);
      audio.onended = () => {
        if (repeatMode === "one") {
          audio.currentTime = 0;
          audio.play().catch(() => {});
          setIsPlaying(true);
        } else {
          // nextTrack(false);
          nextTrack(!miniVisibleRef.current);
        }
      };
      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onerror = (ev) => {
        console.warn("Audio error", ev);
        setIsPlaying(false);
        setIsBuffering(false);
      };

      // *crucial* — when the audio is ready to actually play, clear buffering
      audio.oncanplay = () => {
        setIsBuffering(false);
      };

      audioRef.current = audio;
      setStreamUrl(src);

      if (autoplay) {
        audio
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn("Audio play() failed:", err);
            setIsPlaying(false);
          });
      } else {
        setIsPlaying(false);
      }

      return audio;
    },
    [cleanupAudio, nextTrack, repeatMode, playbackRate, volumeValue]
  );

  /* --------- Prefetch helper (caches result) --------- */

  // Prefetch stream_url JSON and cache it (non-blocking)
  const prefetchForIndex = useCallback(
    async (idx) => {
      if (!Array.isArray(queue) || idx < 0 || idx >= queue.length) return;
      const song = queue[idx];
      const key = song.id ?? song.webpage_url ?? song.title;
      if (cacheRef.current.has(key)) return; // already cached

      // abort any previous prefetch for that key
      try {
        prefetchControllersRef.current.get(key)?.abort();
      } catch (e) {}

      const endpoint = getStreamUrl(song);
      if (!endpoint) return;

      const controller = new AbortController();
      prefetchControllersRef.current.set(key, controller);

      try {
        const res = await fetch(endpoint, { signal: controller.signal });
        if (!res.ok) throw new Error("prefetch failed:" + res.status);
        const data = await res.json();
        const src = data?.stream_url ?? data?.streamUrl ?? null;
        if (src) {
          cacheRef.current.set(key, { src, ts: Date.now() });
        }
      } catch (err) {
        if (err?.name !== "AbortError") {
          console.warn("prefetch error", err);
        }
      } finally {
        // remove controller ref
        prefetchControllersRef.current.delete(key);
      }
    },
    [queue, getStreamUrl]
  );

  /**
   * loadStreamForIndex:
   * - Stable: does not depend on `queue` variable; uses queueRef.current
   * - Uses cache if present
   * - If audioRef.current.src === src, avoid recreating and optionally play()
   */
  const loadStreamForIndex = useCallback(
    async (idx, { autoplay = true } = {}) => {
      if (!Array.isArray(queue) || idx < 0 || idx >= queue.length) return null;
      const song = queue[idx];
      const key = song.id ?? song.webpage_url ?? song.title;
      const endpoint = getStreamUrl(song);
      if (!endpoint) {
        console.warn("no stream endpoint for song", song);
        return null;
      }

      // If src is cached, attach immediately
      const cached = cacheRef.current.get(key);
      if (cached?.src) {
        setLoadingStream(false);
        // attach audio from cached src (this sets isBuffering->true until oncanplay)
        const audio = createAndAttachAudio(cached.src, { autoplay });
        // optionally prefetch next
        return audio;
      }

      // else fetch and cache with inflightControllerRef (single active "load" controller)
      const myId = ++loadIdRef.current;
      try {
        inflightControllerRef.current?.abort();
      } catch (e) {}
      const controller = new AbortController();
      inflightControllerRef.current = controller;

      setLoadingStream(true);
      setIsBuffering(true);

      try {
        const res = await fetch(endpoint, { signal: controller.signal });
        if (myId !== loadIdRef.current) {
          setLoadingStream(false);
          setIsBuffering(false);
          return null;
        }
        if (!res.ok) throw new Error("stream endpoint failed: " + res.status);
        const data = await res.json();
        const src = data?.stream_url ?? data?.streamUrl ?? null;
        if (!src) throw new Error("no stream_url in backend response");

        // cache it (so future skips can be instant)
        cacheRef.current.set(key, { src, ts: Date.now() });

        // attach audio
        const audio = createAndAttachAudio(src, { autoplay });

        setLoadingStream(false);
        inflightControllerRef.current = null;

        // optionally prefetch next track (non-blocking)
        if (!shuffle && queue.length > 1) {
          const nextIdx =
            idx + 1 < queue.length ? idx + 1 : repeatMode === "all" ? 0 : null;
          if (nextIdx !== null) prefetchForIndex(nextIdx);
        }

        return audio;
      } catch (err) {
        if (err?.name === "AbortError") {
          // expected if canceled
        } else {
          console.error("Error resolving stream:", err);
        }
        setLoadingStream(false);
        setIsBuffering(false);
        inflightControllerRef.current = null;
        return null;
      }
    },
    [
      queue,
      getStreamUrl,
      createAndAttachAudio,
      prefetchForIndex,
      shuffle,
      repeatMode,
    ]
  );

  // When currentIndex changes, load stream if the current track key changed.
  useEffect(() => {
    if (currentIndex < 0) return;

    const currentSong = queueRef.current[currentIndex];
    const key = songKeyFor(currentSong);

    // if key same as previous and there's an audioRef (already loaded), do nothing
    if (key && prevTrackKeyRef.current === key && audioRef.current) {
      // ensure playing state if requested
      if (isPlaying && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      }
      return;
    }

    prevTrackKeyRef.current = key;

    // load and autoplay
    loadStreamForIndex(currentIndex, { autoplay: true });

    return () => {
      // optional: keep the audio to allow gapless behavior; here we cleanup to avoid leaks
      // cleanupAudio();
    };
  }, [currentIndex, loadStreamForIndex, isPlaying]);

  // Play / Pause wrappers
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

  // VOLUME / PLAYBACK RATE helpers - update the existing audio element instead of recreating it
  const setVolumeValue = useCallback((val0to1) => {
    const v = Math.max(0, Math.min(1, Number(val0to1) || 0));
    setVolumeValueState(v);
    if (audioRef.current) {
      try {
        audioRef.current.volume = v;
      } catch (e) {
        console.warn("Failed to set volume on audio element", e);
      }
    }
  }, []);

  const setPlaybackRate = useCallback((rate) => {
    const r = Number(rate) || 1;
    setPlaybackRateState(r);
    if (audioRef.current) {
      try {
        audioRef.current.playbackRate = r;
      } catch (e) {
        console.warn("Failed to set playbackRate on audio element", e);
      }
    }
  }, []);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try {
        inflightControllerRef.current?.abort();
      } catch (e) {
        console.warn(String(e));
      }
      cleanupAudio();
    };
  }, [cleanupAudio]);

  const api = {
    queue,
    currentIndex,
    currentTrack,
    setCurrentIndex,
    isPlaying,
    setIsPlaying,
    position,
    duration,

    playIndex,
    playSong,
    playPause,
    play,
    pause,
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

    // expose cache for debugging if you want
    _streamCache: cacheRef,
    isBuffering,
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
