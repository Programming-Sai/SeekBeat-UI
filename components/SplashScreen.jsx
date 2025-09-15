import React, { useEffect } from "react";
import { View, StyleSheet, Image } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useResponsive } from "../contexts/ResponsiveContext";
import { HEXA } from "../lib/colors";

export default function SplashScreen({ theme, setShowSplash }) {
  const { width, height, isAtOrBelow } = useResponsive();
  const tabletAndBelow = isAtOrBelow("md", true);
  const maskOpacity = useSharedValue(1);
  const textOpacity = useSharedValue(0); // start hidden if you want to fade IN
  const borderOpacity = useSharedValue(0); // border fade IN as well

  const GLASS_SIZE = (tabletAndBelow ? 0.5 : 1) * 500; // actual image size
  const RADIUS = GLASS_SIZE * 0.2; // circle radius in px
  const NOTE = GLASS_SIZE * 0.35;
  const OFFSET_X = GLASS_SIZE * 0.07; // 5% of glass width
  const OFFSET_Y = GLASS_SIZE * 0.08;

  // animate absolute positions in PX
  const xPx = useSharedValue(200);
  const yPx = useSharedValue(200);
  const scale = useSharedValue(1);

  useEffect(() => {
    const moveRandom = () => {
      const padding = 80;
      const nextX = padding + Math.random() * (width - padding * 2);
      const nextY = padding + Math.random() * (height - padding * 2);

      xPx.value = withTiming(nextX, {
        duration: 1000,
        easing: Easing.inOut(Easing.quad),
      });
      yPx.value = withTiming(nextY, {
        duration: 1000,
        easing: Easing.inOut(Easing.quad),
      });
    };

    const interval = setInterval(moveRandom, 2000);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      xPx.value = withTiming(width / 2 + 1, { duration: 1500 });
      yPx.value = withTiming(height / 2 - (tabletAndBelow ? 20 : 35), {
        duration: 1500,
      });
      // }, 10);
    }, 10000);

    const opacityTimeout = setTimeout(() => {
      maskOpacity.value = withTiming(0, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      });
      scale.value = withTiming(0.25, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      });
      // }, 12);
    }, 12000);

    const opacityTextTimeout = setTimeout(() => {
      textOpacity.value = withTiming(1, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      });
      borderOpacity.value = withTiming(1, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      });
      // }, 12);
    }, 12050);

    const finishSplashDisplay = setTimeout(() => {
      setShowSplash(false);
    }, 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      clearTimeout(opacityTimeout);
      clearTimeout(opacityTextTimeout);
      clearTimeout(finishSplashDisplay);
    };
  }, [width, height]);

  // Mask follows the same pixel center, but converted to %
  const maskStyle = useAnimatedStyle(() => {
    const xPercent = (xPx.value / width) * 100;
    const yPercent = (yPx.value / height) * 100;
    const radius = RADIUS * scale.value;
    return {
      opacity: maskOpacity.value,
      backgroundImage: `radial-gradient(
        circle ${radius}px at ${xPercent}% ${yPercent}%,
        transparent 99%,
        ${HEXA(theme.background, maskOpacity.value)} 100%
      )`,
    };
  });

  // Glass moves by pure translate in PX
  const glassStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: xPx.value - GLASS_SIZE / 2 + OFFSET_X },
      { translateY: yPx.value - GLASS_SIZE / 2 + OFFSET_Y },
      { scale: scale.value },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const borderStyle = useAnimatedStyle(() => ({
    opacity: borderOpacity.value,
  }));

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}
    >
      <View style={styles.noteWrapper}>
        <Image
          source={require("../assets/SeekBeat_Note.png")}
          style={[
            styles.noteImage,
            { tintColor: theme.accent, width: NOTE, height: NOTE },
          ]}
        />
        <Animated.Text
          style={[
            {
              color: theme.accent,
              fontWeight: "bold",
              fontStyle: "italic",
              fontSize: (tabletAndBelow ? 0.8 : 1) * 30,
            },
            textStyle,
          ]}
        >
          SeekBeat
        </Animated.Text>
      </View>
      <Animated.View
        style={[
          styles.magBorder,
          borderStyle,
          {
            width: RADIUS * 2 * 0.35,
            height: RADIUS * 2 * 0.35,
            borderWidth: (tabletAndBelow ? 0.5 : 1) * 19,
            // borderColor: "red",
            borderColor: theme.backgroundSecondary,
            transform: [
              {
                translateX: width / 2 + (tabletAndBelow ? 15 : 28) - OFFSET_X,
              },
              { translateY: height / 2 - 3 - OFFSET_Y },
            ],
          },
        ]}
      />
      <Animated.View style={[styles.mask, maskStyle]} />

      <Animated.Image
        source={require("../assets/Seekbeat_Magnifying_Glass.png")}
        style={[
          styles.glass,
          glassStyle,
          { width: GLASS_SIZE, height: GLASS_SIZE, tintColor: theme.accent },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: "hidden" },
  mask: {
    ...StyleSheet.absoluteFillObject,
    backgroundRepeat: "no-repeat",
  },
  noteWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  noteImage: {
    resizeMode: "contain",
  },
  glass: {
    position: "absolute",
    objectFit: "cover",
  },
  magBorder: {
    borderRadius: 100,
  },
});
