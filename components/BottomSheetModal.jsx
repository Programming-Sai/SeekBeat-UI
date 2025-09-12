// components/BottomSheet.jsx
import React, { useEffect, useMemo, useRef } from "react";
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  useAnimatedScrollHandler,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";

/**
 * Props:
 *  - visible (bool)
 *  - onClose (fn)
 *  - children
 *  - theme (object) // pass theme or call useTheme inside
 *  - snapPoints = ["30%", "70%"]
 *  - initialSnapIndex = 0
 *  - enablePanDownToClose = true
 */
export default function BottomSheet({
  visible = false,
  onClose = () => {},
  children,
  theme,
  snapPoints = ["70%", "50%", "30%"].reverse(),
  initialSnapIndex = 0,
  enablePanDownToClose = true,
}) {
  const { height: SCREEN_HEIGHT } = useWindowDimensions();

  // --- compute px heights for snaps (visible portion of sheet)
  const snapHeights = useMemo(
    () =>
      snapPoints.map((p) =>
        typeof p === "string" && p.includes("%")
          ? (parseFloat(p) / 100) * (SCREEN_HEIGHT - 100)
          : Number(p)
      ),
    [snapPoints, SCREEN_HEIGHT]
  );

  // sheet height = max visible height (so sheet can expand to largest snap)
  const sheetHeight = Math.max(...snapHeights, 0);

  // translate range: 0 => sheet fully up; sheetHeight => sheet fully hidden
  const closedTranslation = sheetHeight;
  const snapTranslations = snapHeights.map((h) => Math.max(0, sheetHeight - h));

  // shared animated values
  const translateY = useSharedValue(closedTranslation);
  const scrollOffset = useSharedValue(0); // track inner ScrollView vertical offset

  // overlay opacity derived from translateY (more open => more opaque)
  const overlayStyle = useAnimatedStyle(() => {
    const minY = snapTranslations[0] ?? closedTranslation;
    const opacity = interpolate(
      translateY.value,
      [minY, closedTranslation],
      [0.45, 0],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // --- find nearest snap (or closed)
  const findNearest = (y) => {
    const candidates = [...snapTranslations, closedTranslation];
    let nearest = candidates[0];
    let best = Math.abs(candidates[0] - y);
    for (let i = 1; i < candidates.length; i++) {
      const d = Math.abs(candidates[i] - y);
      if (d < best) {
        best = d;
        nearest = candidates[i];
      }
    }
    return nearest;
  };

  // --- scroll handler for inner ScrollView (updates scrollOffset)
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollOffset.value = event.contentOffset.y;
    },
  });

  // --- gesture handler for pan (works everywhere on sheet)
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.startY = translateY.value;
      // allow drag only when scrollOffset <= 0 (at top) OR if sheet already is pulling
      ctx.allow = scrollOffset.value <= 0;
    },
    onActive: (event, ctx) => {
      // if scroll not at top and not already dragging, ignore so ScrollView handles it
      if (!ctx.allow) {
        // however, if the user drags up when sheet is not fully opened and sheet is not at top
        // we still should not fight the scroll. So we ignore active moves.
        return;
      }
      const next = ctx.startY + event.translationY;
      translateY.value = Math.min(Math.max(next, 0), closedTranslation);
    },
    onEnd: (event, ctx) => {
      if (!ctx.allow) {
        // nothing to do: let scroll continue
        return;
      }
      const velocity = event.velocityY;
      const projected = translateY.value + velocity * 0.2;
      const nearest = findNearest(projected);

      if (nearest === closedTranslation && enablePanDownToClose) {
        translateY.value = withSpring(
          closedTranslation,
          { damping: 18 },
          () => {
            runOnJS(onClose)();
          }
        );
        return;
      }
      translateY.value = withSpring(nearest, { damping: 18 });
    },
  });

  // --- react to `visible` prop: open/close
  useEffect(() => {
    if (!sheetHeight) return;
    if (visible && snapTranslations[initialSnapIndex] != null) {
      translateY.value = withSpring(snapTranslations[initialSnapIndex], {
        damping: 18,
      });
    } else {
      translateY.value = withSpring(closedTranslation, { damping: 18 }, () => {
        runOnJS(onClose)();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, sheetHeight]);

  if (!sheetHeight) return null; // guard
  console.log(visible);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.rootOverlay]}>
      {/* overlay */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}
        // pointerEvents={visible ? "auto" : "none"}
      >
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: "transparent" }]}
          onPress={() => {
            translateY.value = withSpring(
              closedTranslation,
              { damping: 18 },
              () => {
                runOnJS(onClose)();
              }
            );
          }}
        />
      </Animated.View>

      {/* sheet container: PanGestureHandler wraps the whole sheet so drag-from-anywhere works */}
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View
          style={[
            styles.sheet,
            { height: sheetHeight, backgroundColor: theme.backgroundSecondary },
            sheetStyle,
          ]}
        >
          {/* handle - still visible but the entire sheet is draggable */}
          <Pressable style={styles.handleWrap} onPress={onClose}>
            <View
              style={[
                styles.handle,
                Platform.OS === "web" && { cursor: "grab" },
              ]}
            />
          </Pressable>

          {/* inner ScrollView: attach animated scroll handler */}
          <Animated.ScrollView
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ width: "100%" }}>{children}</View>
          </Animated.ScrollView>
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  rootOverlay: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    zIndex: 100,
    justifyContent: "flex-end",
  },
  overlay: {
    backgroundColor: "black",
    zIndex: 101,
  },
  sheet: {
    width: "100%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
    zIndex: 102,
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 8,
  },
  handle: {
    width: 48,
    height: 6,
    borderRadius: 6,
    backgroundColor: "#ccc",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexGrow: 2,
    // height: 300,
  },
});
