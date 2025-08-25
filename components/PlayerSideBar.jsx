// PlayerSideBar.js (improved for scrolling + robust auto-scroll)
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Platform,
  ScrollView,
} from "react-native";
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { useTheme } from "../contexts/ThemeContext";
import { usePlayer } from "../contexts/PlayerContext";
import he from "he";
import formatTime from "../lib/utils";
import { useRouter } from "expo-router";
import { useAppStorage } from "../contexts/AppStorageContext";
import { HEXA } from "../lib/colors";

const ITEM_HEIGHT = 72; // must match visual row height

export const PlayerSideBar = () => {
  const { theme } = useTheme();
  const {
    queue = [],
    currentIndex,
    playIndex,
    reorderQueue,
    setQueue,
  } = usePlayer();
  const { getLastSearch } = useAppStorage();
  const router = useRouter();

  const [localData, setLocalData] = useState(queue || []);
  const listRef = useRef(null);
  const mountedRef = useRef(false);
  const layoutReadyRef = useRef(false);

  // Keep localData in sync with queue (but don't stomp if user is actively dragging)
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      setLocalData(queue.slice());
      return;
    }
    setLocalData((prev) => {
      if (!queue) return [];
      if (
        prev.length === queue.length &&
        prev.every(
          (p, i) =>
            (p?.webpage_url ?? p?.id ?? p?.title) ===
            (queue[i]?.webpage_url ?? queue[i]?.id ?? queue[i]?.title)
        )
      ) {
        return prev;
      }
      return queue.slice();
    });
  }, [queue]);

  // seed from last search (only if empty)
  useEffect(() => {
    const last = getLastSearch?.();
    if ((!queue || queue.length === 0) && last?.items) {
      setQueue?.(last.items);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Called when layout is ready (list container measured)
  const onContainerLayout = useCallback(() => {
    layoutReadyRef.current = true;
  }, []);

  // Robust scroll helper: prefers scrollToIndex, falls back to scrollToOffset
  const scrollToIndexSafe = useCallback((index) => {
    if (!listRef.current || typeof index !== "number" || index < 0) return;
    const fnIndex = listRef.current?.scrollToIndex;
    const fnOffset = listRef.current?.scrollToOffset;

    // If getItemLayout is provided, we can compute offset deterministically
    const offset = index * ITEM_HEIGHT;

    try {
      if (typeof fnIndex === "function") {
        fnIndex.call(listRef.current, { index, animated: true });
        return;
      }
    } catch (err) {
      // fallthrough to offset
    }

    try {
      if (typeof fnOffset === "function") {
        fnOffset.call(listRef.current, { offset, animated: true });
        return;
      }
    } catch (err) {
      // final fallback: try to access internal scroll responder
      try {
        const inner = listRef.current?.getNode
          ? listRef.current.getNode()
          : listRef.current;
        inner?.scrollToOffset?.({ offset, animated: true });
      } catch (e) {
        // give up silently
        // console.warn("scroll fallback failed", e);
      }
    }
  }, []);

  // Auto-scroll to currentIndex when it changes — wait for layoutReady first
  useEffect(() => {
    if (typeof currentIndex !== "number" || currentIndex < 0) return;

    // If layout isn't ready, wait a bit longer
    const delay = layoutReadyRef.current ? 50 : 250;

    const t = setTimeout(() => {
      scrollToIndexSafe(currentIndex);
    }, delay);

    return () => clearTimeout(t);
  }, [currentIndex, scrollToIndexSafe]);

  const keyExtractor = useCallback((item, index) => {
    return item?.webpage_url ?? item?.id?.toString() ?? `${index}`;
  }, []);

  const renderItem = useCallback(
    ({ item, drag, isActive, index }) => {
      const isPlaying = index === currentIndex;

      return (
        <ScaleDecorator>
          <TouchableOpacity
            onPress={() => {
              playIndex(index);
              router.push?.(`/player/${item?.id ?? index}`);
            }}
            onLongPress={drag}
            disabled={isActive}
            style={[
              styles.item,
              {
                backgroundColor: isActive
                  ? theme.accent
                  : isPlaying
                  ? HEXA(theme.accent, 0.12)
                  : theme.background,
                borderColor: isPlaying ? theme.accent : "transparent",
                borderWidth: isPlaying ? 1 : 0,
                marginVertical: 5,
              },
            ]}
          >
            <Image
              source={{ uri: item?.largest_thumbnail ?? item?.thumbnail }}
              style={styles.thumbnail}
            />
            <View style={styles.meta}>
              <Text
                style={[styles.title, { color: theme.text }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {he.decode(item?.title ?? "Unknown")}
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {formatTime(item?.duration ?? 0)} · {item?.uploader ?? ""}
              </Text>
            </View>

            <View
              style={{ width: 20, height: 20, opacity: 0.6, marginLeft: 8 }}
            >
              <Text style={{ color: theme.textSecondary }}>≡</Text>
            </View>
          </TouchableOpacity>
        </ScaleDecorator>
      );
    },
    [currentIndex, playIndex, router, theme]
  );

  if (!Array.isArray(localData) || localData.length === 0) {
    return (
      <View
        onLayout={onContainerLayout}
        style={[styles.empty, { backgroundColor: theme.background }]}
      >
        <Text style={{ color: theme.textSecondary }}>Queue is empty</Text>
      </View>
    );
  }

  return (
    <View
      // <View
      onLayout={onContainerLayout}
      ref={listRef}
      // style={[styles.container, { backgroundColor: "red" }]}
      style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}
    >
      <DraggableFlatList
        data={localData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onDragEnd={({ data }) => {
          setLocalData(data);
          reorderQueue?.(data);
        }}
        getItemLayout={(data, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        activationDistance={10}
        containerStyle={{ paddingBottom: 40 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        style={{ height: "90vh", paddingBottom: 100 }} // important: minHeight:0 helps RN-web flex
        // Helpful performance props:
        initialNumToRender={12}
        windowSize={5}
        autoscrollSpeed={50} // try increasing this
        autoscrollThreshold={50} // smaller threshold triggers earlier
        scrollEnabled
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 12, height: "10rem" }, // minHeight:0 important on web
  item: {
    height: ITEM_HEIGHT - 6,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  thumbnail: { width: 50, height: 50, borderRadius: 6, marginRight: 8 },
  meta: { flex: 1, justifyContent: "center" },
  title: { fontSize: 14, fontWeight: "500" },
  subtitle: { fontSize: 12 },
  empty: { padding: 16, alignItems: "center", justifyContent: "center" },
});
