// components/SkeletonLoader.js
import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

/**
 * Skeleton shimmer. Starts/stops based on `isLoading`.
 *
 * Keep using the same props as before. Use it like:
 *   <Skeleton width={300} height={18} isLoading={isLoading} />
 */
export const Skeleton = ({
  width = 100,
  height = 20,
  borderRadius = 4,
  backgroundColor = "#E1E9EE",
  highlightColor = "#F2F8FC",
  duration = 1200,
  style,
  isLoading = true, // pass your search-context isLoading here
}) => {
  const shimmer = useRef(new Animated.Value(0)).current;
  const loopRef = useRef(null);

  // highlight bar width (bigger than container so it sweeps fully)
  const highlightWidth = Math.max(width * 1.6, 80);

  useEffect(() => {
    // helper to start the infinite loop
    const startLoop = () => {
      // reset to 0 so animation always starts at left
      shimmer.setValue(0);

      const timing = Animated.timing(shimmer, {
        toValue: 1,
        duration: Math.max(300, duration),
        useNativeDriver: false, // explicitly false for web compatibility
      });

      // store the loop so we can stop it later
      loopRef.current = Animated.loop(timing);
      loopRef.current.start();
    };

    // helper to stop the loop
    const stopLoop = () => {
      if (loopRef.current && typeof loopRef.current.stop === "function") {
        try {
          loopRef.current.stop();
        } catch (e) {
          /* ignore */
        }
        loopRef.current = null;
      }
      // reset shimmer position visually
      try {
        shimmer.setValue(0);
      } catch (e) {
        /* ignore */
      }
    };

    if (isLoading) startLoop();
    else stopLoop();

    return () => {
      // cleanup on unmount
      stopLoop();
    };
  }, [isLoading, duration, shimmer, width, highlightWidth]);

  // translate from -highlightWidth to +width (left -> right)
  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-highlightWidth, width],
  });

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
          overflow: "hidden",
        },
        style,
      ]}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            background: `linear-gradient(90deg, ${backgroundColor}, ${highlightColor}, ${backgroundColor} )`,
            filter: "blur(8px)",
            opacity: 0.4,
            highlightWidth,
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
};

export default Skeleton;
