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

/**
 * Interactive MiniPlayer with click + drag seek.
 * Uses usePlayer().seek(seconds) to update playback position.
 */
export default function MiniPlayer() {
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
    seek,
  } = usePlayer();

  // don't render anything if mini is closed or no current track
  if (!miniVisible || !currentTrack) return null;

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

  // ref to progress container (host element on web, RN view on native)
  const progressRef = useRef(null);
  // cached bounding rect for calculations (web) or latest layout (native)
  const containerRectRef = useRef({ left: 0, width: 0 });

  // helper to measure container rect (web or native)
  const measureContainer = useCallback(async () => {
    const node = progressRef.current;
    if (!node) return null;

    // Web: DOM node likely exposes getBoundingClientRect()
    if (node.getBoundingClientRect) {
      const r = node.getBoundingClientRect();
      containerRectRef.current = { left: r.left, width: r.width };
      return containerRectRef.current;
    }

    // Native: try measureInWindow (supported by RN)
    if (node.measureInWindow) {
      return new Promise((resolve) => {
        try {
          node.measureInWindow((x, y, width, height) => {
            containerRectRef.current = { left: x, width };
            resolve(containerRectRef.current);
          });
        } catch (e) {
          resolve(null);
        }
      });
    }

    return null;
  }, []);

  // compute displayed pct (either dragging or current context)
  const displayedPct = isDragging ? dragPct : pctFromCtx;

  // convert clientX into ratio using cached or measured rect
  const computeRatioFromClientX = useCallback(
    async (clientX) => {
      // ensure we have rect
      if (!containerRectRef.current.width) {
        await measureContainer();
      }
      const { left, width } = containerRectRef.current;
      if (!width || width <= 0) return 0;
      const offsetX = clientX - left;
      const ratio = offsetX / width;
      return Math.max(0, Math.min(1, ratio));
    },
    [measureContainer]
  );

  /********** Mouse / Touch handlers **********/

  // PanResponder for native (and works on web too as fallback)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: async (evt, gestureState) => {
        // start dragging
        setIsDragging(true);
        // determine clientX (native: gestureState.x0 / pageX; web: nativeEvent.clientX)
        const native = evt.nativeEvent || {};
        const clientX = native.pageX ?? native.locationX ?? gestureState.x0;
        const ratio = await computeRatioFromClientX(clientX);
        setDragPct(ratio);
      },
      onPanResponderMove: async (evt, gestureState) => {
        const native = evt.nativeEvent || {};
        const clientX = native.pageX ?? gestureState.moveX ?? native.clientX;
        const ratio = await computeRatioFromClientX(clientX);
        setDragPct(ratio);
      },
      onPanResponderRelease: async (evt, gestureState) => {
        const native = evt.nativeEvent || {};
        const clientX = native.pageX ?? gestureState.moveX ?? native.clientX;
        const ratio = await computeRatioFromClientX(clientX);
        // seek to final position and stop dragging
        const toSec = ratio * (duration || 0);
        seek(toSec);
        setIsDragging(false);
      },
      onPanResponderTerminationRequest: () => true,
      onPanResponderTerminate: () => {
        // cancelled
        setIsDragging(false);
      },
    })
  ).current;

  // click-to-seek handler: receives DOM/mouse event on web or RN Pressable event
  const onBarPress = useCallback(
    async (evt) => {
      // evt.nativeEvent has clientX / locationX depending on platform
      const native = evt.nativeEvent || {};
      const clientX = native.clientX ?? native.pageX ?? native.locationX ?? 0;
      const ratio = await computeRatioFromClientX(clientX);
      const to = ratio * (duration || 0);
      seek(to);
    },
    [computeRatioFromClientX, duration, seek]
  );

  // style for thumb position
  const thumbLeftStyle = useMemo(
    () => ({
      left: `${displayedPct * 100}%`,
      transform: [{ translateX: -8 }],
    }),
    [displayedPct]
  );

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
            /* open full player later */
          }}
          style={styles.imgBox}
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

            <TouchableOpacity onPress={next} accessibilityLabel="Next">
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

            {/* progress bar container */}
            <View
              ref={progressRef}
              // Pressable allows click; attach PanResponder handlers to inner view
              style={[
                styles.progress,
                { backgroundColor: HEXA(theme.textSecondary, 0.12) },
              ]}
            >
              {/* clickable overlay */}
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={onBarPress}
                {...(Platform.OS !== "web" ? panResponder.panHandlers : {})}
                // On web, PanResponder can still work but we'll also add pointer handlers below
              />

              {/* active bar */}
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${(isDragging ? dragPct : pctFromCtx) * 100}%`,
                    backgroundColor: theme.accent,
                  },
                ]}
              />

              {/* Thumb (overlay) */}
              <View
                style={[
                  styles.thumb,
                  { backgroundColor: theme.accent },
                  thumbLeftStyle,
                ]}
                {...(Platform.OS === "web" ? panResponder.panHandlers : {})}
              />
            </View>

            <Text style={[styles.time, { color: theme.textSecondary }]}>
              {formatTime(duration)}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={() => closeMini(true)}>
            <Text style={{ color: theme.textSecondary, fontSize: 20 }}>
              &#x2715;
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
