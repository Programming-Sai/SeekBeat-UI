// components/SeekBar.js
import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  PanResponder,
  Pressable,
  Platform,
} from "react-native";

export default function SeekBar({
  progressPct = 0, // between 0 and 1
  duration = 0, // total duration in seconds
  onSeek = () => {}, // callback (newTimeInSeconds)
  accent = "#1DB954", // Spotify green style
  height = 6,
  thumbSize = 16,
  background,
}) {
  const [dragging, setDragging] = useState(false);
  const [dragPct, setDragPct] = useState(progressPct);
  const trackRef = useRef(null);

  // Keep local drag progress synced with external progress
  useEffect(() => {
    if (!dragging) setDragPct(progressPct);
  }, [progressPct, dragging]);

  // Handle click/tap on track
  const handlePress = useCallback(
    (evt) => {
      if (!trackRef.current) return;
      trackRef.current.measure((x, y, width, height, pageX) => {
        const clickX =
          Platform.OS === "web"
            ? evt.nativeEvent.pageX
            : evt.nativeEvent.locationX;
        const relativeX = clickX - pageX;
        let pct = relativeX / width;
        pct = Math.max(0, Math.min(1, pct));
        setDragPct(pct);
        onSeek(pct * duration);
      });
    },
    [duration, onSeek]
  );

  // PanResponder for dragging thumb
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => setDragging(true),
      onPanResponderMove: (evt, gesture) => {
        if (!trackRef.current) return;
        trackRef.current.measure((x, y, width, height, pageX) => {
          const moveX =
            Platform.OS === "web" ? evt.nativeEvent.pageX : gesture.moveX;
          let pct = (moveX - pageX) / width;
          pct = Math.max(0, Math.min(1, pct));
          setDragPct(pct);
        });
      },
      onPanResponderRelease: () => {
        setDragging(false);
        onSeek(dragPct * duration);
      },
    })
  ).current;

  return (
    <Pressable
      ref={trackRef}
      style={[styles.track, { height: 30 }]}
      onPress={handlePress}
    >
      {/* Background track */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: background || "#eee",
            borderRadius: height / 2,
            height: 5,
            marginTop: 12,
          },
        ]}
      />

      {/* Filled portion */}
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: `${dragPct * 100}%`,
          height: 5,
          marginTop: 12,
          backgroundColor: accent,
          borderRadius: height / 2,
        }}
      />

      {/* Thumb */}
      <View
        style={[
          styles.thumb,
          {
            left: `${dragPct * 100}%`,
            width: thumbSize,
            height: thumbSize,
            backgroundColor: accent,
          },
        ]}
        {...panResponder.panHandlers}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    borderRadius: 3,
    // overflow: "hidden",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    // height: 20,
    // backgroundColor: "blue",
  },

  thumb: {
    position: "absolute",
    top: "50%",
    marginTop: -8, // centers thumb vertically
    borderRadius: 100,
    transform: [{ translateX: -8 }], // center horizontally
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 1.5,
  },
});
