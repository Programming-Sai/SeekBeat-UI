// PlayerSideBar.js
import React, { useEffect, useRef, useState, useCallback } from "react";
import { StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { useTheme } from "../contexts/ThemeContext";
import { usePlayer } from "../contexts/PlayerContext";
import he from "he";
import formatTime, { timeAgo } from "../lib/utils";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAppStorage } from "../contexts/AppStorageContext";
import { HEXA } from "../lib/colors";

const ITEM_HEIGHT = 70;

export const PlayerSideBar = ({ edit }) => {
  const { theme } = useTheme();
  const {
    queue = [],
    currentIndex,
    playIndex,
    reorderQueue,
    setCurrentIndex,
    setQueue,
    cleanupAudio,
    setPosition,
  } = usePlayer();
  const { getLastSearch } = useAppStorage();
  const router = useRouter();
  const [localData, setLocalData] = useState(queue || []);
  const listRef = useRef(null);
  const mountedRef = useRef(false);
  const layoutReadyRef = useRef(false);
  const { id } = useLocalSearchParams();
  const isEditor = !!edit;

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

  useEffect(() => {
    const last = getLastSearch?.();
    if ((!queue || queue.length === 0) && last?.items) {
      setQueue?.(last.items);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onContainerLayout = useCallback(() => {
    layoutReadyRef.current = true;
  }, []);

  const scrollToIndexSafe = useCallback((index) => {
    if (!listRef.current || typeof index !== "number" || index < 0) return;
    const fnIndex = listRef.current?.scrollToIndex;
    const fnOffset = listRef.current?.scrollToOffset;
    const offset = index * ITEM_HEIGHT;
    try {
      if (typeof fnIndex === "function") {
        fnIndex.call(listRef.current, { index, animated: true });
        return;
      }
    } catch (err) {}
    try {
      if (typeof fnOffset === "function") {
        fnOffset.call(listRef.current, { offset, animated: true });
        return;
      }
    } catch (err) {
      try {
        const inner = listRef.current?.getNode
          ? listRef.current.getNode()
          : listRef.current;
        inner?.scrollToOffset?.({ offset, animated: true });
      } catch (e) {
        console.warn("scroll fallback failed", e);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof currentIndex !== "number" || currentIndex < 0) return;
    const delay = layoutReadyRef.current ? 50 : 250;
    const t = setTimeout(() => scrollToIndexSafe(currentIndex), delay);
    return () => clearTimeout(t);
  }, [currentIndex, scrollToIndexSafe]);

  const keyExtractor = useCallback((item, index) => {
    return item?.webpage_url ?? item?.id?.toString() ?? `${index}`;
  }, []);

  // derive canonical selected id (prefer currentIndex if available)
  const selectedId =
    (typeof currentIndex === "number" && queue[currentIndex]?.id) || id;

  const renderItem = useCallback(
    ({ item, drag, isActive, getIndex }) => {
      const index = getIndex?.();
      const isPlaying = index === currentIndex;
      const isSelected = String(selectedId) === String(item?.id);
      // console.log("Values Passed in: ", drag, isActive, index);

      return (
        <ScaleDecorator>
          <TouchableOpacity
            onPress={() => {
              router.push?.(
                `/player/${item?.id ?? index}${isEditor ? "?edit=true" : ""}`
              );
              // cleanupAudio();
              // setPosition(0);
              // setCurrentIndex(index);
              console.log("Index to be played: ", index, currentIndex);
              playIndex(index);
              console.log("Index to be played: ", index, currentIndex);
            }}
            onLongPress={drag}
            disabled={isActive}
            style={[
              styles.item,
              {
                backgroundColor: isActive
                  ? theme.accent
                  : isSelected
                  ? HEXA(theme.accent, 0.2)
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
                {formatTime(item?.duration ?? 0)} ·{" "}
                {timeAgo(item?.upload_date) ?? ""} · {item?.uploader ?? ""}
              </Text>
            </View>

            <View
              style={{ width: 20, height: 20, opacity: 0.6, marginLeft: 8 }}
            >
              <Text style={{ color: theme.textSecondary, fontSize: 20 }}>
                ≡
              </Text>
            </View>
          </TouchableOpacity>
        </ScaleDecorator>
      );
    },
    // include selectedId/currentIndex/id so renderItem gets recreated when they change
    [selectedId, currentIndex, playIndex, router, theme, isEditor]
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
      onLayout={onContainerLayout}
      style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}
    >
      <DraggableFlatList
        ref={listRef}
        data={localData}
        extraData={[id, currentIndex, isEditor]}
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
        style={{ height: "90vh", paddingBottom: 100 }}
        initialNumToRender={12}
        windowSize={5}
        autoscrollSpeed={50}
        autoscrollThreshold={50}
        scrollEnabled
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 12, height: "90vh" },
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
