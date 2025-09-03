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
 * PlayerContext - UI-first player for "mp3paw"-style streaming app.
 *
 * Contract:
 *  - queue contains search results (array of song objects, max 50)
 *  - playIndex(index) starts playback of queue[index]
 *  - playSong(song) plays a single song (optionally adding to queue)
 *  - getStreamUrl(song) returns a constructed URL you can call to request stream from your backend (if base provided)
 *
 * Note: this provider simulates playback time via RAF. Replace or remove the simulation
 * when wiring a real audio element (then call setPosition/setDuration from audio events).
 *
 * Usage:
 *  const { setQueueFromSearchResults, playIndex, getStreamUrl, currentTrack, position, isPlaying } = usePlayer();
 */

const PlayerContext = createContext(null);

export function PlayerProvider({
  children,
  streamBase = null /* optional backend base e.g. '/api/stream' */,
}) {
  // queue: array of songs (search results)
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  // playback modes
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState("none"); // "none" | "one" | "all"

  // whether the mini player UI should be visible (open)
  const [miniVisible, setMiniVisible] = useState(false);

  // position/duration are in seconds (UI expects numeric seconds)
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isEditor, setIsEditor] = useState(false);

  // raf simulation refs
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const router = useRouter();

  const audioRef = useRef(null); // holds HTMLAudioElement
  const loadIdRef = useRef(0); // incremental id to ignore stale responses
  const inflightControllerRef = useRef(null); // AbortController for fetch

  const [streamUrl, setStreamUrl] = useState(null);
  const [loadingStream, setLoadingStream] = useState(false);
  const [volumeValue, setVolumeValueState] = useState(1); // 0..1
  const [playbackRate, setPlaybackRateState] = useState(1); // e.g. 1.25

  // helper: current track
  const currentTrack =
    currentIndex >= 0 && queue[currentIndex] ? queue[currentIndex] : null;

  // cap queue to 50 items
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
    // reset index if out of bounds
    setCurrentIndex((ci) => {
      if (next.length === 0) return -1;
      return ci >= 0 && ci < next.length ? ci : 0;
    });
  }, []);

  // When currentTrack changes, reset duration/position (unless external sets)
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
      setPosition(0);
      setCurrentIndex((ci) => {
        if (shuffle && queue.length > 1) {
          let nextIdx;
          do {
            nextIdx = Math.floor(Math.random() * queue.length);
          } while (nextIdx === ci);

          if (shouldNavigate) {
            router.push(
              `/player/${queue[nextIdx]?.id}${isEditor ? "?edit=true" : ""}`
            );
          }

          return nextIdx;
        }

        if (ci + 1 >= queue.length) {
          if (repeatMode === "all") {
            if (shouldNavigate) {
              router.push(
                `/player/${queue[0]?.id}${isEditor ? "?edit=true" : ""}`
              );
            }
            return 0;
          } else {
            setIsPlaying(false);
            return ci; // stop at end
          }
        }

        if (shouldNavigate) {
          router.push(
            `/player/${queue[ci + 1]?.id}${isEditor ? "?edit=true" : ""}`
          );
        }

        return ci + 1;
      });
    },
    [queue, shuffle, repeatMode, router, isEditor]
  );

  // then update startRaf to use nextTrack (and proper deps)
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
              // restart same track
              setPosition(0);
            } else {
              nextTrack(true); // call the function (no shadowing now)
            }
          }, 0);
          return duration;
        }
        return nextPos;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [duration, currentIndex, queue.length, nextTrack, repeatMode]);

  const stopRaf = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTimeRef.current = null;
    }
  }, []);

  useEffect(() => {
    // If we have a real audio element, let it update position/time; don't run RAF.
    if (audioRef.current) {
      // make sure RAF is stopped if present
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    // if (isPlaying) startRaf();
    // else stopRaf();
    // return () => {
    // stopRaf();
    // };
  }, [isPlaying, startRaf, stopRaf, audioRef.current]);

  /* --------- Controls --------- */

  const playIndex = useCallback(
    (idx) => {
      if (!Array.isArray(queue) || queue.length === 0) return;
      if (idx < 0 || idx >= queue.length) return;
      setCurrentIndex(idx);
      setPosition(0);
      setIsPlaying(true);
    },
    [queue]
  );

  const playSong = useCallback((song, addToQueue = true) => {
    if (!song) return;
    if (addToQueue) {
      setQueue((q) => {
        const next = [...(q || [])];
        // if the song already exists, try to find it
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
          // append but trim to 50
          next.push(song);
          if (next.length > 50) next.splice(0, next.length - 50);
          setCurrentIndex(next.length - 1);
        }
        return next;
      });
    } else {
      // play isolated (not change queue)
      setQueue([song]);
      setCurrentIndex(0);
    }
    setPosition(0);
    setIsPlaying(true);
  }, []);

  const prev = useCallback(() => {
    setPosition(0);
    setCurrentIndex((ci) => Math.max(0, ci - 1));
    setIsPlaying(true);
  }, []);

  // allow external components (audio element) to set the position/duration
  const setPositionExternal = useCallback((sec) => setPosition(sec), []);
  const setDurationExternal = useCallback((sec) => setDuration(sec), []);

  /* --------- Queue management --------- */

  const setQueueFromSearchResults = useCallback(
    (results = [], startIndex = 0) => {
      const next = Array.isArray(results) ? results.slice(0, 50) : [];
      setQueue(next);
      const idx = Math.max(0, Math.min(startIndex, next.length - 1));
      setCurrentIndex(next.length ? idx : -1);
      setPosition(0);
      setIsPlaying(false);
    },
    []
  );

  const removeFromQueue = useCallback((identifier) => {
    // identifier can be index (number) or webpage_url/title (string)
    setQueue((q) => {
      if (!Array.isArray(q) || q.length === 0) return q || [];
      if (typeof identifier === "number") {
        const next = [...q];
        next.splice(identifier, 1);
        // adjust currentIndex
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

  /* --------- Mini player helpers --------- */

  // show mini and set current track by index (optionally start playing)
  const showMiniForIndex = useCallback(
    (idx, shouldPlay = false) => {
      if (!Array.isArray(queue) || queue.length === 0) {
        setMiniVisible(false);
        return;
      }
      if (typeof idx !== "number" || idx < 0 || idx >= queue.length) {
        setMiniVisible(false);
        return;
      }
      setCurrentIndex(idx);
      setPosition(0);
      setMiniVisible(true);
      if (shouldPlay) setIsPlaying(true);
    },
    [queue]
  );

  // close mini (optionally pause)
  const closeMini = useCallback((pause = false) => {
    setMiniVisible(false);
    if (pause) setIsPlaying(false);
  }, []);

  /* --------- reorder/move queue helpers --------- */

  // identity helper for songs
  const sameSong = (a, b) => {
    if (!a || !b) return false;
    if (a.webpage_url && b.webpage_url) return a.webpage_url === b.webpage_url;
    if (a.id && b.id) return a.id === b.id;
    return a.title === b.title;
  };

  // Reorder queue by providing a new array (e.g. DraggableFlatList.onDragEnd provides `data`)
  const reorderQueue = useCallback(
    (newQueue = []) => {
      if (!Array.isArray(newQueue)) return;
      const next = newQueue.slice(0, 50);

      setQueue((prev) => {
        // try to preserve currently playing track by identity
        const cur =
          prev && prev.length && currentIndex >= 0 ? prev[currentIndex] : null;
        if (!cur) {
          // no current track -> reset to sensible index
          setCurrentIndex(next.length ? 0 : -1);
          return next;
        }

        const newIndex = next.findIndex((t) => sameSong(t, cur));
        if (newIndex >= 0) {
          setCurrentIndex(newIndex);
        } else {
          // current track not present in new list: clamp or stop
          const idx = Math.max(0, Math.min(currentIndex, next.length - 1));
          setCurrentIndex(next.length ? idx : -1);
          if (!next.length) setIsPlaying(false);
        }
        return next;
      });
    },
    [currentIndex]
  );

  // Move an item within queue by indices (from -> to), updating currentIndex mapping
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

      // Update currentIndex based on move
      setCurrentIndex((ci) => {
        if (ci === fromIndex) {
          // moved the currently playing track
          return toIndex;
        }
        // if the moved item came from before current and moved after, currentIndex decreases by 1
        if (fromIndex < ci && toIndex >= ci) {
          return Math.max(0, ci - 1);
        }
        // if the moved item came from after current and moved before, currentIndex increases by 1
        if (fromIndex > ci && toIndex <= ci) {
          return Math.min(next.length - 1, ci + 1);
        }
        // otherwise unchanged
        return ci;
      });

      return next;
    });
  }, []);

  /* --------- Stream URL helper --------- */
  const getStreamUrl = useCallback(
    (song) => {
      if (!song) return null;
      // If a streamBase is provided by app, construct stream URL like `${streamBase}?url=...`
      // You can override this logic when integrating the real backend.
      if (streamBase) {
        console.log(
          "GET STREAM URL: ",
          `${streamBase}/api/stream/${encodeURIComponent(
            song.id || song.webpage_url || ""
          )}/`
        );
        return `${streamBase}/api/stream/${encodeURIComponent(
          song.id || song.webpage_url || ""
        )}/`;
      }
      return null;
    },
    [streamBase]
  );

  const toggleShuffle = useCallback(() => {
    setShuffle((s) => !s);
  }, []);

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === "none") return "all";
      if (prev === "all") return "one";
      return "none";
    });
  }, []);

  /* --------- cleanup --------- */
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const cleanupAudio = useCallback(() => {
    // abort any inflight fetch
    try {
      inflightControllerRef.current?.abort();
    } catch (e) {}

    const a = audioRef.current;
    if (!a) return;
    try {
      a.pause();
    } catch (e) {}
    // remove listeners
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
  }, []);

  const isSameOrigin = (url) => {
    try {
      const u = new URL(url, window.location.href);
      return u.origin === window.location.origin;
    } catch (e) {
      return false;
    }
  };

  // function to create and attach audio
  const createAndAttachAudio = useCallback(
    (src, { autoplay = true } = {}) => {
      // cleanup previous one
      cleanupAudio();

      if (!src) return null;

      const audio = new Audio(src);
      if (isSameOrigin(src)) {
        audio.crossOrigin = "anonymous";
      }
      audio.preload = "auto";

      // initialize audio settings
      audio.volume = Math.max(0, Math.min(1, volumeValue));
      audio.playbackRate = playbackRate;

      // events
      audio.onloadedmetadata = () => {
        setDuration(isFinite(audio.duration) ? audio.duration : 0);
      };
      audio.ontimeupdate = () => {
        setPosition(audio.currentTime);
      };
      audio.onended = () => {
        if (repeatMode === "one") {
          audio.currentTime = 0;
          // play might reject; don't rely on it to set isPlaying
          audio.play().catch(() => {});
          setIsPlaying(true);
        } else {
          nextTrack(!miniVisible);
        }
      };

      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onerror = (ev) => {
        console.warn("Audio error", ev);
        setIsPlaying(false);
      };

      audioRef.current = audio;
      setStreamUrl(src);

      if (autoplay) {
        // play returns a promise (may be blocked by browser autoplay policies)
        audio
          .play()
          .then(() => setIsPlaying(true))
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

  // function to fetch stream JSON from backend and load audio
  const loadStreamForIndex = useCallback(
    async (idx, { autoplay = true } = {}) => {
      if (!Array.isArray(queue) || idx < 0 || idx >= queue.length) return null;
      const song = queue[idx];
      const endpoint = getStreamUrl(song);
      if (!endpoint) {
        console.warn("no stream endpoint for song", song);
        return null;
      }

      // increment load id and abort prior fetch
      const myId = ++loadIdRef.current;
      try {
        inflightControllerRef.current?.abort();
      } catch (e) {}
      const controller = new AbortController();
      inflightControllerRef.current = controller;

      setLoadingStream(true);
      try {
        const res = await fetch(endpoint, { signal: controller.signal });
        // if another load started, bail out
        if (myId !== loadIdRef.current) {
          setLoadingStream(false);
          return null;
        }
        if (!res.ok) throw new Error("stream endpoint failed: " + res.status);
        const data = await res.json();
        const src = data?.stream_url ?? data?.streamUrl ?? null;
        if (!src) throw new Error("no stream_url in backend response");

        // attach audio and play if requested
        const audio = createAndAttachAudio(src, { autoplay });

        setLoadingStream(false);
        inflightControllerRef.current = null;
        return audio;
      } catch (err) {
        if (err?.name === "AbortError") {
          // expected when we abort previous request
          // console.debug("stream fetch aborted");
        } else {
          console.error("Error resolving stream:", err);
        }
        setLoadingStream(false);
        inflightControllerRef.current = null;
        return null;
      }
    },
    [queue, getStreamUrl, createAndAttachAudio]
  );

  // whenever currentIndex changes, load its stream
  useEffect(() => {
    if (currentIndex < 0) return;
    // load and autoplay when user changes currentIndex via UI
    // when autoplay is false you can call loadStreamForIndex(currentIndex, {autoplay:false})
    loadStreamForIndex(currentIndex, { autoplay: true });
    // clean up the audio when track changes or component unmounts
    return () => {
      // optional: do not immediately cleanup if you want gapless behavior
      cleanupAudio();
    };
  }, [currentIndex, loadStreamForIndex, cleanupAudio]);

  // Play / Pause wrappers to control audio instance
  const play = useCallback(() => {
    const a = audioRef.current;
    if (!a) {
      // if no audio, try to load currentIndex stream and play
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
    } catch (e) {}
    setIsPlaying(false);
  }, []);

  // override the old playPause
  const playPause = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  // seek: if audio exists, update currentTime immediately
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
        // fallback to your previous setPosition state (simulated RAF)
        const clamped = Math.max(0, Math.min(toSec, duration || 0));
        setPosition(clamped);
      }
    },
    [duration]
  );

  // set volume/ playbackRate helpers (also update existing audioRef if present)
  const setVolumeValue = useCallback((val0to1) => {
    // clamp permitted range 0..1 for playback
    const v = Math.max(0, Math.min(1, Number(val0to1) || 0));
    setVolumeValueState(v);

    const a = audioRef.current;
    if (!a) return;

    try {
      const wasPaused = a.paused;
      a.volume = v;
      // some browsers may briefly pause — if our state says we should be playing,
      // try to resume quickly.
      if (!wasPaused && a.paused) {
        a.play().catch(() => {});
      }
    } catch (err) {
      console.warn("Failed to set audio.volume:", err);
    }
  }, []);

  const setPlaybackRate = useCallback((rate) => {
    const r = Number(rate) || 1;
    setPlaybackRateState(r);

    const a = audioRef.current;
    if (!a) return;

    try {
      const wasPaused = a.paused;
      a.playbackRate = r;
      // some streams or formats could trigger a small pause — try to resume if needed
      if (!wasPaused && a.paused) {
        a.play().catch(() => {});
      }
    } catch (err) {
      console.warn("Failed to set audio.playbackRate:", err);
    }
  }, []);

  const api = {
    // state
    queue,
    currentIndex,
    currentTrack,
    setCurrentIndex,
    isPlaying,
    setIsPlaying,
    position,
    duration,

    // playback controls
    playIndex,
    playSong,
    playPause,
    play,
    pause,
    next: nextTrack,
    prev,
    seek,

    // external setters (when you wire a real player)
    setPosition: setPositionExternal,
    setDuration: setDurationExternal,

    // queue management
    setQueueFromSearchResults,
    removeFromQueue,
    setQueue: setQueueSafe,

    reorderQueue,
    moveQueueItem,
    // helpers
    getStreamUrl,

    miniVisible,
    showMiniForIndex,
    closeMini,

    shuffle,
    setShuffle,
    setRepeatMode,
    repeatMode,
    toggleShuffle,
    cycleRepeatMode,

    isEditor,
    setIsEditor,

    // audio-specific
    streamUrl,
    loadingStream,
    setVolumeValue,
    setPlaybackRate,
    loadStreamForIndex,
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
