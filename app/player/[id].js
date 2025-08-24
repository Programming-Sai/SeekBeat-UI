// app/player/[id].js
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  TouchableOpacity,
  Platform,
  Pressable,
  PanResponder,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRightSidebar } from "../../contexts/SidebarContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useSearch } from "../../contexts/SearchContext";
import { usePlayer } from "../../contexts/PlayerContext";
import he from "he";
import formatTime from "../../lib/utils";
import { HEXA } from "../../lib/colors";
import { PreviousIcon } from "../../components/PreviousIcon";
import { PauseIcon } from "../../components/PauseIcon";
import { PlayIcon } from "../../components/PlayIcon";
import { NextIcon } from "../../components/NextIcon";
import { useAppStorage } from "../../contexts/AppStorageContext";

/**
 * Full Player Page
 */
export default function PlayerPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { setRightSidebarKey } = useRightSidebar?.() ?? {};
  const { theme } = useTheme?.() ?? {
    theme: { background: "#fff", text: "#000" },
  };
  const { getFlatItems, normalized, isLoading, error } = useSearch?.() ?? {
    getFlatItems: () => [],
    normalized: null,
    isLoading: false,
  };

  const player = usePlayer?.();
  if (!player) {
    // Show a friendly placeholder if PlayerProvider is not mounted
    return (
      <View style={[styles.fullCenter, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text || "#000" }}>
          Player context not available — make sure PlayerProvider wraps your
          app.
        </Text>
      </View>
    );
  }

  const {
    queue,
    setQueue,
    currentIndex,
    currentTrack,
    isPlaying,
    position,
    duration,
    playIndex,
    playSong,
    play,
    pause,
    playPause,
    next,
    prev,
    seek,
    getStreamUrl,
    setPosition,
    setDuration,
  } = player;

  const { viewMode, getLastSearch, setLastSearch } = useAppStorage();

  // find track in search results first (we expect augmentation with `id`)
  // const flat = getFlatItems && typeof getFlatItems === "function" ? getFlatItems() : [];
  const flat = getLastSearch()?.items;
  const found = useMemo(() => {
    if (!id || !flat || !flat.length) return null;
    return flat.find(
      (s) => s?.id === id || (s?.webpage_url && s.webpage_url.includes(id))
    );
  }, [flat, id]);

  // prefer found, then currentTrack
  const track = found || currentTrack || null;

  // keep right sidebar key
  useEffect(() => {
    setRightSidebarKey?.("player");
    setQueue?.(getLastSearch()?.items);
    console.log("Current Track: ", queue);

    return () => setRightSidebarKey?.(null);
  }, [setRightSidebarKey]);

  // Web audio wiring
  const audioRef = useRef(null);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    // lazily create audio element
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "metadata";
      audioRef.current.crossOrigin = "anonymous";
    }
    const audio = audioRef.current;

    const onTime = () => setPosition?.(audio.currentTime || 0);
    const onDur = () =>
      setDuration?.(isFinite(audio.duration) ? audio.duration : 0);
    const onEnded = () => next?.();
    const onWaiting = () => {};
    const onPlaying = () => {};

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("durationchange", onDur);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("durationchange", onDur);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
    };
  }, [next, setDuration, setPosition]);

  // when track changes, set audio.src (web)
  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (!audioRef.current) return;
    const audio = audioRef.current;
    const url = getStreamUrl?.(track) ?? null;
    if (url) {
      // update src
      audio.src = url;
      // if context is playing, try to play audio too
      if (isPlaying) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
    } else {
      audio.src = "";
    }
  }, [track?.webpage_url, getStreamUrl, isPlaying]);

  // keep play/pause in sync with audio on web
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.play().catch(() => {});
    else audio.pause();
  }, [isPlaying]);

  // Seekbar mechanics
  const [isDragging, setIsDragging] = useState(false);
  const [dragPct, setDragPct] = useState(0);
  const progressRef = useRef(null);
  const rectRef = useRef({ left: 0, width: 0, measured: false });

  const measure = useCallback(() => {
    const n = progressRef.current;
    if (!n) return null;
    try {
      if (n.getBoundingClientRect) {
        const r = n.getBoundingClientRect();
        rectRef.current = { left: r.left, width: r.width, measured: true };
        return rectRef.current;
      }
    } catch (e) {}
    return null;
  }, []);

  const clientXToRatio = useCallback((clientX) => {
    const { left = 0, width = 0 } = rectRef.current;
    if (!width) return 0;
    const offset = clientX - left;
    return Math.max(0, Math.min(1, offset / width));
  }, []);

  // PanResponder for native
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gesture) => {
        setIsDragging(true);
        measure();
        const native = evt.nativeEvent || {};
        const clientX = native.pageX ?? gesture.x0 ?? native.locationX;
        setDragPct(clientXToRatio(clientX));
      },
      onPanResponderMove: (evt, gesture) => {
        const native = evt.nativeEvent || {};
        const clientX = native.pageX ?? gesture.moveX ?? native.locationX;
        setDragPct(clientXToRatio(clientX));
      },
      onPanResponderRelease: (evt, gesture) => {
        const native = evt.nativeEvent || {};
        const clientX = native.pageX ?? gesture.moveX ?? native.locationX;
        const ratio = clientXToRatio(clientX);
        seek?.(ratio * (track?.duration || duration || 0));
        setIsDragging(false);
      },
      onPanResponderTerminate: () => setIsDragging(false),
    })
  ).current;

  const onBarPress = useCallback(
    (evt) => {
      const native = evt.nativeEvent || {};
      const clientX = native.clientX ?? native.pageX ?? native.locationX ?? 0;
      if (!rectRef.current.measured) measure();
      const ratio = clientXToRatio(clientX);
      seek?.(ratio * (track?.duration || duration || 0));
    },
    [measure, clientXToRatio, seek, track, duration]
  );

  const curPosition = position || 0;
  const curDuration = track?.duration || duration || 0;
  const pct = isDragging
    ? dragPct
    : curDuration
    ? Math.max(0, Math.min(1, curPosition / curDuration))
    : 0;

  // Play button handler: if track found in search and has index in queue, use playIndex; otherwise playSong
  const handlePlay = useCallback(() => {
    // if track exists in queue find index
    const inQueueIndex = queue?.findIndex?.(
      (t) =>
        (t?.id && track?.id && t.id === track.id) ||
        (t?.webpage_url &&
          track?.webpage_url &&
          t.webpage_url === track.webpage_url)
    );
    if (inQueueIndex >= 0 && typeof playIndex === "function") {
      playIndex(inQueueIndex);
    } else if (typeof playSong === "function") {
      playSong(track, true);
    } else if (typeof play === "function") {
      play();
    }
  }, [queue, track, playIndex, playSong, play]);

  const handlePrev = useCallback(() => {
    if (typeof prev === "function") prev();
  }, [prev]);
  const handleNext = useCallback(() => {
    if (typeof next === "function") next();
  }, [next]);
  const handlePlayPause = useCallback(() => {
    if (typeof playPause === "function") playPause();
  }, [playPause]);

  // queue rendering and click-to-play
  const onQueueItemPress = useCallback(
    (idx) => {
      if (typeof playIndex === "function") playIndex(idx);
      else if (typeof playSong === "function") playSong(queue[idx], true);
    },
    [playIndex, playSong, queue]
  );

  // If no track at all show friendly message
  if (!track) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>
          No track found for id: {String(id)}
        </Text>
        <Text style={{ color: theme.textSecondary, marginTop: 8 }}>
          Make sure there's an active search or a playing track.
        </Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={{ uri: track.largest_thumbnail || track.thumbnail || "" }}
      blurRadius={60}
      style={[styles.background, { backgroundColor: theme.background }]}
      resizeMode="cover"
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: theme.textSecondary }}>Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Player
          </Text>
          <View style={{ width: 48 }} />
        </View>

        <View style={styles.thumbWrap}>
          <Image
            source={{ uri: track.largest_thumbnail }}
            style={styles.thumb}
          />
        </View>

        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {he.decode(track.title || "Unknown")}
        </Text>
        <Text style={[styles.uploader, { color: theme.textSecondary }]}>
          {track.uploader}
        </Text>

        <View style={styles.seekRow}>
          <Text style={[styles.time, { color: theme.textSecondary }]}>
            {formatTime(
              isDragging
                ? Math.round((dragPct || 0) * (curDuration || 0))
                : curPosition
            )}
          </Text>

          <View
            ref={progressRef}
            style={[
              styles.progressContainer,
              { backgroundColor: HEXA(theme.textSecondary, 0.12) },
            ]}
            {...(Platform.OS !== "web" ? panResponder.panHandlers : {})}
          >
            {Platform.OS === "web" ? (
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={onBarPress}
                onPointerDown={(e) => {
                  // start drag sequence on web
                  measure();
                  setIsDragging(true);
                  setDragPct(clientXToRatio(e.clientX));
                  const onMove = (ev) => setDragPct(clientXToRatio(ev.clientX));
                  const onUp = (ev) => {
                    const ratio = clientXToRatio(ev.clientX);
                    seek?.(ratio * (curDuration || 0));
                    setIsDragging(false);
                    window.removeEventListener("pointermove", onMove);
                    window.removeEventListener("pointerup", onUp);
                  };
                  window.addEventListener("pointermove", onMove);
                  window.addEventListener("pointerup", onUp);
                }}
              />
            ) : (
              <Pressable style={StyleSheet.absoluteFill} onPress={onBarPress} />
            )}

            {/* active bar */}
            <View style={styles.activeBarWrapper}>
              <View
                style={[
                  styles.activeBar,
                  { width: `${pct * 100}%`, backgroundColor: theme.accent },
                ]}
              />
            </View>

            {/* thumb */}
            <View
              style={[
                styles.thumbDot,
                { left: `${pct * 100}%`, backgroundColor: theme.accent },
              ]}
            />
          </View>

          <Text style={[styles.time, { color: theme.textSecondary }]}>
            {formatTime(curDuration)}
          </Text>
        </View>

        {/* controls */}
        <View style={styles.controls}>
          <TouchableOpacity onPress={handlePrev}>
            <PreviousIcon color={theme.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handlePlayPause}
            style={[styles.playBtn, { backgroundColor: theme.accent }]}
          >
            {isPlaying ? (
              <PauseIcon color="#fff" size={30} />
            ) : (
              <PlayIcon color="#fff" size={30} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNext}>
            <NextIcon color={theme.accent} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  fullCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  background: { flex: 1, paddingTop: 60 },
  scroll: { padding: 28, alignItems: "center", paddingBottom: 120 },
  headerRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  thumbWrap: {
    width: 320,
    height: 320,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 18,
  },
  thumb: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderRadius: "100%",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    textAlign: "center",
    width: "100%",
  },
  uploader: { fontSize: 13, marginTop: 6 },
  seekRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    gap: 12,
  },
  time: { width: 48, textAlign: "center", fontSize: 12 },
  progressContainer: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    position: "relative",
    justifyContent: "center",
  },
  activeBarWrapper: {
    position: "absolute",
    left: 12,
    right: 12,
    height: "100%",
    justifyContent: "center",
  },
  activeBar: { height: 4, borderRadius: 999 },
  thumbDot: {
    position: "absolute",
    top: "50%",
    right: 0,
    marginTop: -8,
    width: 16,
    height: 16,
    borderRadius: 999,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 28,
    marginTop: 20,
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  metaRow: { width: "100%", marginTop: 20, display: "flex" },
  queue: { width: "100%", marginTop: 12 },
  queueItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#00000012",
    display: "flex",
    justifyContent: "space-between",
  },
});
