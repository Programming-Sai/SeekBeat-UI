// components/SeekBar.js
import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  PanResponder,
  Pressable,
  Platform,
} from "react-native";
import { HEXA } from "../lib/colors";
import Thumb from "./Thumb";

export default function SeekBar({
  progressPct = 0, // global progress fraction across whole track (0..1)
  duration = 0, // total duration in seconds (full track)
  onSeek = () => {}, // callback (newTimeInSeconds)
  accent = "#1DB954",
  height = 6,
  thumbSize = 16,
  background,
  width, // pixel width of the visual track (optional; you already compute)
  start = 0, // start seconds of trimmed region
  end = null, // end seconds of trimmed region; if null -> use duration
  setThumbState,
  splitThumb = false,
}) {
  const [dragging, setDragging] = useState(false);
  const [dragFullPct, setDragFullPct] = useState(progressPct); // full-track pct 0..1
  const trackRef = useRef(null);
  const pendingSeekRef = useRef(null);
  const lastFullPctRef = useRef(null);

  const [measured, setMeasured] = useState({ left: 0, width: width || 0 });

  // Keep local drag progress synced with external progress (unless dragging)
  useEffect(() => {
    // If user is dragging, let local drag state drive the thumb
    if (dragging) return;

    // If there's a pending seek, wait for the player to confirm
    if (pendingSeekRef.current != null) {
      const pending = pendingSeekRef.current;
      const EPS = 0.02; // tolerance: 2% of full track (tune if needed)

      // If player progress is close enough to the pending target, treat as confirmed
      if (Math.abs(progressPct - pending) <= EPS) {
        pendingSeekRef.current = null;
        setDragFullPct(progressPct);
      } else {
        // keep visual at the pending value until confirmation (prevents snap-back)
        setDragFullPct(pending);
      }

      return;
    }

    // Normal case: no drag, no pending seek -> follow authoritative progress
    setDragFullPct(progressPct);
  }, [progressPct, dragging]);

  const safeDuration = Math.max(0, Number(duration) || 0);
  const startSec = Math.max(0, Number(start) || 0);
  const endSec =
    end == null
      ? safeDuration
      : Math.min(Math.max(Number(end) || 0, 0), safeDuration);

  // compute percentages (0..1)
  const startPct = safeDuration > 0 ? startSec / safeDuration : 0;
  const endPct = safeDuration > 0 ? endSec / safeDuration : 1;
  const regionWidthPct = Math.max(0, endPct - startPct);

  // If width was provided by parent use it, else measure on mount (and on layout)
  useEffect(() => {
    if (width && width > 0) {
      setMeasured((m) => ({ ...m, width }));
      // we don't have left in this branch (pageX) — measure later if needed
    } else if (
      trackRef.current &&
      typeof trackRef.current.measure === "function"
    ) {
      // measure once to get left & width
      trackRef.current.measure((x, y, w, h, pageX) => {
        setMeasured({ left: pageX, width: w });
      });
    }
  }, [width]);

  // helper: clamp
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // compute fullPct and clamped time from an event (or pageX)
  const computeFromPageX = async (pageX) =>
    new Promise((resolve) => {
      const trackLeft = measured.left;
      const trackWidth = measured.width || 1;
      if (!trackLeft || !trackWidth) {
        // fallback: try measuring
        if (
          trackRef.current &&
          typeof trackRef.current.measure === "function"
        ) {
          trackRef.current.measure((x, y, w, h, px) => {
            const left = px;
            const w2 = w || 1;
            const relX = pageX - left;
            const pct = clamp(relX / w2, 0, 1);
            const time = pct * safeDuration;
            const clampedTime = clamp(time, startSec, endSec);
            const fullPct = safeDuration > 0 ? clampedTime / safeDuration : 0;
            resolve({ fullPct, clampedTime });
          });
          return;
        }
      }
      const relX = pageX - trackLeft;
      const pct = clamp(relX / trackWidth, 0, 1);
      const time = pct * safeDuration;
      const clampedTime = clamp(time, startSec, endSec);
      const fullPct = safeDuration > 0 ? clampedTime / safeDuration : 0;
      resolve({ fullPct, clampedTime });
    });

  // Handle click/tap on track
  const handlePress = useCallback(
    async (evt) => {
      // Obtain pageX depending on platform
      const pageX =
        Platform.OS === "web"
          ? evt.nativeEvent.pageX
          : // on native, measure gives us pageX baseline; use locationX relative to element
            // We convert locationX to pageX by measuring element left first
            evt.nativeEvent.pageX ??
            evt.nativeEvent.locationX + (measured.left || 0);

      const { fullPct, clampedTime } = await computeFromPageX(pageX);
      if (fullPct == null) return;
      setDragFullPct(fullPct);
      onSeek(clampedTime);
    },
    [onSeek, measured.left, measured.width, startSec, endSec, safeDuration]
  );

  // PanResponder for dragging thumb
  /* ---------- improvements to measurement + panResponder ---------- */

  // helper for safe measure (ensures measured.left & width are fresh)
  const measureTrackOnce = (cb) => {
    if (
      trackRef.current &&
      typeof trackRef.current.measureInWindow === "function"
    ) {
      try {
        trackRef.current.measureInWindow((left, top, w, h) => {
          const measuredWidth = w || measured.width || 0;
          const leftPx = typeof left === "number" ? left : measured.left || 0;
          setMeasured((m) => ({ left: leftPx, width: measuredWidth }));
          if (typeof cb === "function")
            cb({ left: leftPx, width: measuredWidth });
        });
        return;
      } catch (err) {
        // fallback to measure below
      }
    }

    if (trackRef.current && typeof trackRef.current.measure === "function") {
      try {
        trackRef.current.measure((x, y, w, h, pageX) => {
          const measuredWidth = w || measured.width || 0;
          const leftPx = typeof pageX === "number" ? pageX : measured.left || 0;
          setMeasured((m) => ({ left: leftPx, width: measuredWidth }));
          if (typeof cb === "function")
            cb({ left: leftPx, width: measuredWidth });
        });
        return;
      } catch (err) {
        // fallback to state
      }
    }

    if (typeof cb === "function") cb(measured);
  };

  // compute fullPct/time given a pageX but robustly re-measure if width is missing
  const computeFromPageXRobust = async (pageX) =>
    new Promise((resolve) => {
      // if we don't have a valid width, measure
      if (!measured || !measured.width || measured.width <= 0) {
        measureTrackOnce(({ left = 0, width = 1 } = {}) => {
          const relX = pageX - left;
          const pct = clamp(relX / (width || 1), 0, 1);
          const time = pct * safeDuration;
          const clampedTime = clamp(time, startSec, endSec);
          const fullPct = safeDuration > 0 ? clampedTime / safeDuration : 0;
          resolve({ fullPct, clampedTime });
        });
        return;
      }

      // otherwise compute directly
      const relX = pageX - measured.left;
      const pct = clamp(relX / (measured.width || 1), 0, 1);
      const time = pct * safeDuration;
      const clampedTime = clamp(time, startSec, endSec);
      const fullPct = safeDuration > 0 ? clampedTime / safeDuration : 0;
      resolve({ fullPct, clampedTime });
    });

  // create a stable panResponder that uses robust pageX calculations
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        // measure track so subsequent moves are accurate
        measureTrackOnce();
        setDragging(true);
      },
      onPanResponderMove: async (evt, gesture) => {
        const pageX =
          Platform.OS === "web"
            ? evt?.nativeEvent?.pageX ?? gesture?.moveX
            : gesture?.moveX ??
              evt?.nativeEvent?.pageX ??
              evt?.nativeEvent?.locationX + (measured.left || 0);

        if (pageX == null) return;

        const { fullPct } = await computeFromPageXRobust(pageX);
        if (fullPct == null) return;

        // store last value in a ref (synchronous)
        lastFullPctRef.current = fullPct;
        setDragFullPct(fullPct);
      },

      onPanResponderRelease: async (evt, gesture) => {
        // try to use the lastFullPct we stored during move (most reliable)
        let finalFullPct =
          typeof lastFullPctRef.current === "number"
            ? lastFullPctRef.current
            : dragFullPct;

        // fallback: attempt to compute from pageX if we have one (keeps previous behavior)
        const pageX =
          Platform.OS === "web"
            ? evt?.nativeEvent?.pageX ?? gesture?.moveX
            : gesture?.moveX ??
              evt?.nativeEvent?.pageX ??
              evt?.nativeEvent?.locationX + (measured.left || 0);

        if (pageX != null && lastFullPctRef.current == null) {
          const r = await computeFromPageXRobust(pageX);
          if (r && typeof r.fullPct === "number") finalFullPct = r.fullPct;
        }

        // clamp & compute time
        finalFullPct = clamp(finalFullPct, startPct, endPct);
        const time = clamp(finalFullPct * safeDuration, startSec, endSec);

        // optimistic visual update & pending seek
        setDragFullPct(finalFullPct);
        pendingSeekRef.current = finalFullPct;

        // cleanup
        lastFullPctRef.current = null;
        setDragging(false);

        try {
          onSeek(time);
        } catch (err) {
          console.warn("onSeek error:", err);
        }
      },
      onPanResponderTerminationRequest: () => true,
      onPanResponderTerminate: () => {
        // if another view steals the responder, we still want to end dragging gracefully
        setDragging(false);
      },
    })
  ).current;

  // Visual positions (use pixel math when measured.width available)
  const trackWidth = measured.width || 0;
  const startPx = startPct * trackWidth;
  const endPx = endPct * trackWidth;
  const thumbCenterPx = clamp(dragFullPct * trackWidth, startPx, endPx);
  const filledWidthPx = Math.max(0, thumbCenterPx - startPx);
  const thumbLeftPx = thumbCenterPx - thumbSize / 2;

  // Fallback percent calc if trackWidth is 0 (shouldn't happen if parent passed width)
  const fullPctForThumb = clamp(dragFullPct, startPct, endPct);
  const filledPercentFallback =
    regionWidthPct > 0
      ? clamp((fullPctForThumb - startPct) / regionWidthPct, 0, 1)
      : 0;

  // keep parent-updated thumb-state in sync whenever position/handlers change
  useEffect(() => {
    if (typeof setThumbState !== "function") return;

    const leftValue =
      trackWidth > 0 ? thumbLeftPx : `${fullPctForThumb * 100}%`;

    setThumbState({
      left: leftValue,
      size: thumbSize,
      // color: "black",
      color: accent,
      panHandlers: panResponder?.panHandlers || {},
      dragging,
      fullPct: fullPctForThumb,
      clampedTime: clamp(fullPctForThumb * safeDuration, startSec, endSec),
    });
    // dependencies: everything that controls the visual/interaction of the thumb
  }, [
    thumbLeftPx,
    fullPctForThumb,
    thumbSize,
    accent,
    panResponder, // stable ref but safe to include
    dragging,
    trackWidth,
    safeDuration,
    startSec,
    endSec,
    setThumbState,
  ]);

  return (
    <Pressable
      ref={trackRef}
      style={[styles.track, { height: 30, width: width ? width : "100%" }]}
      onPress={handlePress}
      onLayout={(e) => {
        // keep measured left/width updated for native events if width not passed
        if (!width && e?.nativeEvent?.layout) {
          const { x, width: w } = e.nativeEvent.layout;
          // can't get pageX here; keep width; left remains 0 for many RN environments
          setMeasured((m) => ({ left: m.left || 0, width: w }));
        } else if (width && !measured.left) {
          // try to measure pageX if possible (only on web will measure provide pageX)
          if (
            trackRef.current &&
            typeof trackRef.current.measure === "function"
          ) {
            trackRef.current.measure((x, y, w, h, pageX) => {
              setMeasured({ left: pageX, width: width });
            });
          } else {
            setMeasured((m) => ({ left: m.left || 0, width }));
          }
        }
      }}
    >
      {/* Background track (full) */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: background || "#eee",
            borderRadius: height / 2,
            height,
            marginTop: (30 - height) / 2,
            width: width ? width : "100%",
          },
        ]}
      />

      {/* Region overlay (the trimmed area background) */}
      {trackWidth > 0 ? (
        <View
          style={{
            position: "absolute",
            left: startPx,
            width: Math.max(0, endPx - startPx),
            top: (30 - height) / 2,
            height,
            borderRadius: height / 2,
            backgroundColor: `${accent}22`, // translucent accent
          }}
        />
      ) : (
        <View
          style={{
            position: "absolute",
            left: `${startPct * 100}%`,
            width: `${regionWidthPct * 100}%`,
            top: (30 - height) / 2,
            height,
            borderRadius: height / 2,
            backgroundColor: `${accent}22`,
          }}
        />
      )}

      {/* Filled portion inside region: from start -> current */}
      {trackWidth > 0 ? (
        <View
          style={{
            position: "absolute",
            left: startPx,
            top: (30 - height) / 2,
            height,
            width: filledWidthPx,
            backgroundColor: accent,
            borderRadius: height / 2,
          }}
        />
      ) : (
        <View
          style={{
            position: "absolute",
            left: `${startPct * 100}%`,
            top: (30 - height) / 2,
            height,
            width: `${filledPercentFallback * 100}%`,
            backgroundColor: accent,
            borderRadius: height / 2,
          }}
        />
      )}

      {/* Thumb (playhead) */}
      {!splitThumb &&
        (trackWidth > 0 ? (
          <Thumb
            left={thumbLeftPx}
            size={thumbSize}
            color={accent}
            panHandlers={panResponder.panHandlers}
          />
        ) : (
          // fallback percent-based thumb (keeps previous behavior)
          <Thumb
            left={`${fullPctForThumb * 100}%`}
            size={thumbSize}
            color={accent}
            panHandlers={panResponder.panHandlers}
          />
        ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    borderRadius: 3,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  thumb: {
    position: "absolute",
    top: "-10%",
    marginTop: -8,
    borderRadius: 100,
    // no translateX; we compute left as center - halfThumb
    elevation: 2000,
    zIndex: 2000, // 🔑 iOS/web
  },
});
