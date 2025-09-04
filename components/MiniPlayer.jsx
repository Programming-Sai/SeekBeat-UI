// components/MiniPlayer.js
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  PanResponder,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { Image } from "react-native";
import formatTime from "../lib/utils";
import { HEXA } from "../lib/colors";
import { PlayIcon } from "./PlayIcon";
import { PauseIcon } from "./PauseIcon";
import { PreviousIcon } from "./PreviousIcon";
import { NextIcon } from "./NextIcon";
import he from "he";
import { usePlayer } from "../contexts/PlayerContext";
import { useRouter } from "expo-router";
import { InlineMenu } from "./InlineMenu";
import { MoreIcon } from "./MoreIcon";
import SeekBar from "./SeekBar";

/**
 * Interactive MiniPlayer with click + drag seek.
 * Uses usePlayer().seek(seconds) to update playback position.
 */
export default function MiniPlayer() {
  const { theme, themeMode } = useTheme();
  const {
    currentTrack,
    position,
    isPlaying,
    playPause,
    next,
    prev,
    miniVisible,
    closeMini,
    seek,
    isBuffering,
    loadingStream,
  } = usePlayer();

  // don't render anything if mini is closed or no current track
  if (!miniVisible || !currentTrack) return null;
  const router = useRouter();
  const s = currentTrack;
  const duration = s.duration || 0;
  const playedSofar = position || 0;
  const pctFromCtx = Math.max(
    0,
    Math.min(1, (playedSofar || 0) / Math.max(1, duration))
  );

  // dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragPct, setDragPct] = useState(0); // 0..1 while dragging

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
        <TouchableOpacity
          onPress={() => {
            router.push(`/player/${s.id}`);
            closeMini(true);
          }}
          style={[styles.imgBox, { position: "relative" }]}
        >
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
          {(isBuffering || loadingStream) && (
            <View
              style={{
                zIndex: 250,
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                backgroundColor: HEXA(theme.background, 0.6),
                display: "grid",
                placeContent: "center",
              }}
            >
              <ActivityIndicator
                size={25}
                color={theme.text}
                // color={accentColors[accentKey].dark}
              />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.centerCol}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {he.decode(s.title)}
          </Text>

          <View style={styles.controlsRow}>
            <TouchableOpacity onPress={prev} accessibilityLabel="Previous">
              <PreviousIcon color={theme.accent} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={playPause}
              accessibilityLabel={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <PauseIcon color={theme.accent} size={30} />
              ) : (
                <PlayIcon color={theme.accent} size={30} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => next(false)}
              accessibilityLabel="Next"
            >
              <NextIcon color={theme.accent} />
            </TouchableOpacity>
          </View>

          <View style={styles.seekRow}>
            <Text style={[styles.time, { color: theme.textSecondary }]}>
              {formatTime(
                isDragging
                  ? Math.round((dragPct || 0) * (duration || 0))
                  : playedSofar
              )}
            </Text>

            <View style={[{ width: "90%", marginLeft: 3 }]}>
              <SeekBar
                progressPct={pctFromCtx}
                duration={duration}
                onSeek={(sec) => seek?.(sec)}
                accent={theme.accent}
                background={HEXA(
                  themeMode === "dark" ? theme.textSecondary : "#fff",
                  0.12
                )}
              />
            </View>

            <Text style={[styles.time, { color: theme.textSecondary }]}>
              {formatTime(duration)}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          {/* <Pressable onPress={() => closeMini(true)}>
            <Text style={{ color: theme.textSecondary, fontSize: 20 }}>
              &#x2715;
            </Text>
          </Pressable> */}
          <InlineMenu
            trigger={<MoreIcon color={theme.text} size={25} />}
            options={[
              {
                label: "Play",
                onPress: () => {
                  router.push(`/player/${s.id}`);
                  closeMini(true);
                },
              },
              {
                label: "Edit",
                onPress: () => {
                  router.push(`/player/${s.id}?edit=true`);
                  closeMini(true);
                },
              },
              {
                label: "Download",
                onPress: () => {
                  console.log("Downloading...");
                  closeMini(true);
                },
              },
              {
                label: "Close",
                onPress: () => closeMini(true),
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "fixed",
    bottom: 0,
    left: "16%",
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
    justifyContent: "center",
    position: "relative",
  },
  progressBar: {
    height: 4,
    borderRadius: 999,
  },
  thumb: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 999,
    top: "50%",
    marginTop: -8,
    // shadow for web/native
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  actions: {
    width: 32,
    alignItems: "center",
  },
});
