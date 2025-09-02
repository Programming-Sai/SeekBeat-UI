// app/player/[id].js
import { useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  TouchableOpacity,
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
import SeekBar from "../../components/SeekBar";

/**
 * Full Player Page (fixed hook ordering)
 */
export default function PlayerPage() {
  const { id } = useLocalSearchParams();
  const { edit } = useLocalSearchParams();
  const isEditor = edit === "true";
  const router = useRouter();

  console.log("Editor Page: ", isEditor);

  // call all hooks unconditionally (important!)
  const rightSidebarCtx = useRightSidebar();
  const themeCtx = useTheme();
  const searchCtx = useSearch();
  const player = usePlayer();
  const appStorage = useAppStorage();

  // safe destructuring / fallbacks
  const { setRightSidebarKey } = rightSidebarCtx ?? {};
  const { theme, themeMode } = themeCtx ?? {
    theme: {
      background: "#fff",
      text: "#000",
      textSecondary: "#666",
      accent: "#1DB954",
    },
  };
  const { getFlatItems, normalized, isLoading, error } = searchCtx ?? {
    getFlatItems: () => [],
    normalized: null,
    isLoading: false,
  };
  const { getLastSearch } = appStorage ?? {};

  // safe references to player methods (may be undefined until player exists)

  const setQueueSafe = player?.setQueue;
  const currentTrackSafe = player?.currentTrack;
  const positionSafe = player?.position;
  const durationSafe = player?.duration;

  // const queue = player?.queue;
  const {
    queue,
    isPlaying,
    playPause,
    next,
    prev,
    seek,
    setCurrentIndex,
    currentIndex,
  } = player;

  // ---- Now it's safe to declare effects and memos (they always run in same order) ----

  useEffect(() => {
    // Only perform side-effects if the functions exist.
    const last = getLastSearch?.();
    if (last?.items) {
      setQueueSafe?.(last.items);
    }
    // console.log("QUEUE: ", queue);
    setRightSidebarKey?.(isEditor ? "playerEdit" : "player");
    return () => setRightSidebarKey?.(null);
    // intentionally minimal deps; these refs are stable-ish (functions from context)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // helper for search-derived "flat" items (optional)
  const flat = useMemo(() => queue, [queue]);

  const foundIndex = useMemo(() => {
    if (!id || !Array.isArray(flat) || !flat.length) return -1;
    return flat.findIndex(
      (s) => s?.id === id || (s?.webpage_url && s.webpage_url.includes(id))
    );
  }, [flat, id]);

  const found = foundIndex >= 0 ? flat[foundIndex] : null;

  // When foundIndex changes, set the current index in player
  useEffect(() => {
    if (foundIndex >= 0) {
      setCurrentIndex?.(foundIndex);
    }
  }, [foundIndex, setCurrentIndex]);

  // pick track from found or player
  const track = found || currentTrackSafe || null;

  // duration preference: player.duration (live) or track.duration fallback
  const trackDuration = useMemo(() => {
    player?.setDuration(track?.duration);
    const n = Number(durationSafe ?? track?.duration ?? 0);
    // console.log("Duration: ", durationSafe);

    return Number.isFinite(n) ? n : 0;
  }, [durationSafe, track?.duration]);

  // compute pct from player position (safe)
  const pctFromCtx = Math.max(
    0,
    Math.min(1, (positionSafe || 0) / Math.max(1, trackDuration))
  );

  // now safe early return: we've already called hooks above
  if (!player) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text || "#000" }}>
          Player context not available — make sure PlayerProvider wraps your
          app.
        </Text>
      </View>
    );
  }

  // Now destructure live player (you can keep using the safe vars above if you prefer)

  // if track still not found, show friendly empty state
  if (!track) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>
          No track found for id: {String(id)}
        </Text>
        <Text
          style={{
            color: themeMode === "dark" ? theme.textSecondary : "white",
            marginTop: 8,
          }}
        >
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
        {/* <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text
              style={{
                color: themeMode === "dark" ? theme.textSecondary : "white",
              }}
            >
              Back
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Player
          </Text>
          <View style={{ width: 48 }} />
        </View> */}

        <View style={styles.coverWrap}>
          <Image
            source={{ uri: track.largest_thumbnail }}
            style={styles.coverImage}
          />
        </View>

        <Text style={[styles.title, { color: "white" }]} numberOfLines={2}>
          {he.decode(track.title || "Unknown")}
        </Text>
        <Text
          style={[
            styles.uploader,
            { color: themeMode === "dark" ? theme.textSecondary : "white" },
          ]}
        >
          {track.uploader}
        </Text>

        <View style={styles.seekRow}>
          <Text
            style={[
              styles.time,
              { color: themeMode === "dark" ? theme.textSecondary : "white" },
            ]}
          >
            {formatTime(
              Math.round(isNaN(trackDuration) ? 0 : pctFromCtx * trackDuration)
            )}
          </Text>
          <View style={[{ width: "85%" }]}>
            <SeekBar
              progressPct={pctFromCtx}
              duration={trackDuration}
              onSeek={(sec) => seek?.(sec)}
              accent={theme.accent}
              background={HEXA(
                themeMode === "dark" ? theme.textSecondary : "#fff",
                0.12
              )}
            />
          </View>

          <Text
            style={[
              styles.time,
              { color: themeMode === "dark" ? theme.textSecondary : "white" },
            ]}
          >
            {formatTime(Math.round(trackDuration))}
          </Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            onPress={() => {
              router.push(
                `/player/${queue[currentIndex - 1]?.id}${
                  isEditor ? "?edit=true" : ""
                }`
              );
              prev();
            }}
          >
            <PreviousIcon color={theme.accent} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={playPause}
            style={[styles.playBtn, { backgroundColor: theme.accent }]}
          >
            {isPlaying ? (
              <PauseIcon color="#fff" size={30} />
            ) : (
              <PlayIcon color="#fff" size={30} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              router.push(
                `/player/${queue[currentIndex + 1]?.id}${
                  isEditor ? "?edit=true" : ""
                }`
              );
              next();
            }}
          >
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

  coverWrap: {
    width: 320,
    height: 320,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 18,
  },
  coverImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
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
  time: { width: 60, textAlign: "center", fontSize: 12 },

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
});
