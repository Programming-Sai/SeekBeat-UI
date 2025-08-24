// components/MiniPlayer.js
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { Image } from "react-native";
import formatTime from "../lib/utils";
import { HEXA } from "../lib/colors";
import { PauseIcon } from "./PauseIcon";
import { PreviousIcon } from "./PreviousIcon";
import { NextIcon } from "./NextIcon";
import he from "he";
import { usePlayer } from "../contexts/PlayerContext";

/**
 * Props:
 *  - song: { title, duration, largest_thumbnail, ... }
 *  - position: number (seconds or ms depending on your format)
 *  - onPlayPause, onNext, onPrev, onOpenPlayer
 */
export default function MiniPlayer({}) {
  const { theme } = useTheme();
  const {
    currentTrack,
    position,
    isPlaying,
    playPause,
    next,
    prev,
    miniVisible,
    closeMini,
  } = usePlayer();

  // don't render anything if mini is closed or no current track
  if (!miniVisible || !currentTrack) return null;
  const playedSofar = position;

  // defensive song default
  const s = currentTrack || {
    title: "Unkonwn Track",
    duration: 1,
    largest_thumbnail: null,
  };

  const onPlayPause = () => {};
  const onNext = () => {};
  const onPrev = () => {};
  const onOpenPlayer = () => {};

  //     const song = {
  //     title:
  //       "LEADERS OF HISTORY RAP CYPHER | RUSTAGE ft. The Stupendium, Keyblade, TOPHAMHAT-KYO &amp; More",
  //     duration: 643,
  //     uploader: "RUSTAGE",
  //     thumbnail: "https://i.ytimg.com/vi/PEwy4U1OkBA/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=PEwy4U1OkBA",
  //     upload_date: "2025-06-21T23:45:01Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/PEwy4U1OkBA/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/PEwy4U1OkBA/default.jpg",
  //   };

  const pct = Math.max(0, Math.min(1, (playedSofar || 0) / (s.duration || 1)));

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundSecondary,
          borderTopColor: theme.accent,
        },
      ]}
      accessibilityRole="complementary"
      accessibilityLabel="Mini player"
    >
      <View style={styles.inner}>
        <TouchableOpacity onPress={() => onOpenPlayer()} style={styles.imgBox}>
          {s.largest_thumbnail ? (
            <Image style={styles.img} source={{ uri: s.largest_thumbnail }} />
          ) : (
            <View
              style={[
                styles.placeholder,
                { backgroundColor: HEXA(theme.accent, 0.12) },
              ]}
            />
          )}
        </TouchableOpacity>

        <View style={styles.centerCol}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {he.decode(s.title)}
          </Text>

          <View style={styles.controlsRow}>
            <TouchableOpacity onPress={onPrev} accessibilityLabel="Previous">
              <PreviousIcon color={theme.accent} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onPlayPause}
              accessibilityLabel={isPlaying ? "Pause" : "Play"}
            >
              <PauseIcon color={theme.accent} size={30} />
            </TouchableOpacity>

            <TouchableOpacity onPress={onNext} accessibilityLabel="Next">
              <NextIcon color={theme.accent} />
            </TouchableOpacity>
          </View>

          <View style={styles.seekRow}>
            <Text style={[styles.time, { color: theme.textSecondary }]}>
              {formatTime(playedSofar)}
            </Text>

            <View
              style={[
                styles.progress,
                { backgroundColor: HEXA(theme.textSecondary, 0.18) },
              ]}
            >
              <View
                style={[
                  styles.progressBar,
                  { width: `${pct * 100}%`, backgroundColor: theme.accent },
                ]}
              >
                <Pressable
                  style={[
                    styles.progressThumb,
                    { backgroundColor: theme.accent },
                  ]}
                />
              </View>
            </View>

            <Text style={[styles.time, { color: theme.textSecondary }]}>
              {formatTime(s.duration)}
            </Text>
          </View>
        </View>

        {/* optional right-side actions (bookmark/share etc) */}
        <View style={styles.actions}>
          <Pressable
            onPress={() => {
              /* future actions */
            }}
          >
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
              •••
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "fixed",
    bottom: 0,
    left: "16%", // center by left/right percentages (works well on web)
    right: "26%",
    height: 100,
    zIndex: 9999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    display: "flex",
    justifyContent: "center",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    width: "100%",
  },
  imgBox: {
    width: 64,
    height: 64,
    borderRadius: 6,
    overflow: "hidden",
    flexShrink: 0,
  },
  placeholder: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
  },
  img: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  centerCol: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 13,
    width: "100%",
    textAlign: "center",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    marginTop: 2,
  },
  seekRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: -5,
    width: "100%",
  },
  time: {
    fontSize: 11,
    width: 40,
    textAlign: "center",
  },
  progress: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    // overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    position: "relative",
  },
  progressThumb: {
    width: 15,
    height: 15,
    borderRadius: 100,
    position: "absolute",
    top: "-150%",
    right: 0,
    // cursor: "pointer",
  },
  actions: {
    width: 32,
    alignItems: "center",
  },
});
