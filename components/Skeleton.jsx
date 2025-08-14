// components/SkeletonLoader.js
import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

export const Skeleton = ({
  width = 100,
  height = 20,
  borderRadius = 4,
  backgroundColor = "#E1E9EE",
  highlightColor = "#F2F8FC",
  duration = 1200,
  style,
}) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    shimmer.setValue(0);
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration,
        // useNativeDriver: true,
      })
    ).start();
  }, [shimmer, duration]);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width], // left → right only
  });

  return (
    <View
      style={[
        { width, height, borderRadius, backgroundColor, overflow: "hidden" },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            background: `linear-gradient(90deg, ${backgroundColor}, ${highlightColor}, ${backgroundColor} )`,
            filter: "blur(8px)",
            opacity: 0.4,
            width,
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
};
