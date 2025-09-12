import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { Link } from "expo-router";
import he from "he";
import formatTime, { timeAgo } from "../lib/utils"; // your existing util
import { getPrimaryTextColor, HEXA } from "../lib/colors";
import { useTheme } from "../contexts/ThemeContext";
import { usePlayer } from "../contexts/PlayerContext";
import { useDownloader } from "../contexts/DownloaderContext";
import { useAppStorage } from "../contexts/AppStorageContext";
import Toast from "react-native-toast-message";
import { useResponsive } from "../contexts/ResponsiveContext";

/**
 * Props:
 * - songs: Array (full list from backend)
 * - pageSize: number (default 10)
 * - viewMode: "list" | "grid"
 * - onPageChange?: (page) => void
 * - renderExtra?: optional render prop if you want to inject something per-item (unused here)
 *
 * IMPORTANT: this component intentionally keeps your original per-item JSX and inline styles
 * so you don't have to change visuals. It only paginates the list client-side.
 */
export default function PaginatedResults({
  songs = [],
  pageSize = 10,
  viewMode = "list",
  onPageChange,
}) {
  const { theme, themeMode, accentKey, accentColors } = useTheme();
  const [page, setPage] = useState(1);
  const {
    setQueueFromSearchResults,
    showMiniForIndex,
    isPlaying,
    stop,
    playIndex,
  } = usePlayer();
  const { download } = useDownloader(); // default streamBase baked in or pass your base
  const { getDownloadStatus } = useAppStorage();
  const { isAtOrBelow } = useResponsive();
  const tabletAndBelow = isAtOrBelow("md", true);

  // reset when songs array changes
  useEffect(() => {
    setPage(1);
  }, [songs]);

  const total = songs?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // clamp page
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  // memoize slice to avoid recompute
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return (songs || []).slice(start, start + pageSize);
  }, [songs, page, pageSize]);

  const goto = (p) => {
    const next = Math.max(1, Math.min(totalPages, p));
    setPage(next);
    onPageChange?.(next);
  };
  const goPrev = () => goto(page - 1);
  const goNext = () => goto(page + 1);

  const onDownload = async (song) => {
    if (!song) return;
    // const id = song?.id ?? song?.webpage_url;

    // optional: show immediate pending toast
    Toast.show({
      type: "info",
      position: "top",
      text1: "Downloading",
      text2: `${song?.title} — preparing download...`,
      visibilityTime: 3000,
      autoHide: true,
    });

    try {
      // wait for the download to finish (or throw)
      const { filename } = await download(song);

      Toast.show({
        type: "success",
        position: "top",
        text1: "Success",
        text2: `${song?.title} downloaded as ${filename}`,
        visibilityTime: 4000,
      });
    } catch (err) {
      Toast.show({
        type: "error",
        position: "top",
        text1: "Download failed",
        text2: String(err),
        visibilityTime: 4000,
      });
    }
  };

  const onPlay = useCallback(
    (idx) => {
      if (isPlaying) stop();
      idx = (page - 1) * pageSize + idx;

      // First, set the queue and index. Don't auto-play yet.
      setQueueFromSearchResults(songs, /*startIndex=*/ idx);

      // Then, explicitly tell the player to start playing the new song at the given index.
      playIndex(idx);

      showMiniForIndex(idx, true);
    },
    [
      isPlaying,
      stop,
      page,
      pageSize,
      songs,
      setQueueFromSearchResults,
      playIndex,
      showMiniForIndex,
    ]
  );

  return (
    <View style={[{ width: "100%" }]}>
      {/* Render the current page items using your exact markup */}
      <View
        style={[
          viewMode === "list" ? styles.searchResults : styles.searchResultsGrid,
        ]}
      >
        {pageItems.map((song, i) =>
          viewMode === "list" ? (
            <View
              key={song.webpage_url ?? `${(page - 1) * pageSize + i}`}
              style={[styles.searchResults]}
            >
              {/* Below I paste your original list-item JSX but wrapped so you can drop this file
                  into your codebase exactly. Update styles variable access if needed. */}
              <View
                style={[
                  styles?.resultCard,
                  {
                    backgroundImage: `linear-gradient(90deg, ${theme.background} 10%, ${accentColors[accentKey].dark} 30%)`,
                    border: `2px solid ${accentColors[accentKey].dark}`,
                  },
                ]}
              >
                <Link href={song?.webpage_url ?? ""} target="_blank">
                  <View
                    style={[
                      styles?.thumbnailImage,
                      { backgroundColor: "transparent" },
                      tabletAndBelow && {
                        width: 100,
                        height: 90,
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: song.largest_thumbnail }}
                      style={styles?.thumbnailImg}
                      resizeMode="contain"
                    />
                  </View>
                </Link>

                <View style={[styles?.details]}>
                  <View style={[styles?.titleDurationBox]}>
                    <Text
                      style={[
                        {
                          color:
                            themeMode === "dark"
                              ? theme.text
                              : getPrimaryTextColor(
                                  accentColors[accentKey].dark
                                ),
                        },
                        tabletAndBelow && { fontSize: 13 },
                      ]}
                    >
                      {formatTime(song.duration)}
                    </Text>
                    <Text
                      style={[
                        {
                          color:
                            themeMode === "dark"
                              ? theme.text
                              : getPrimaryTextColor(
                                  accentColors[accentKey].dark
                                ),
                        },
                        tabletAndBelow && { fontSize: 13 },
                      ]}
                    >
                      ●
                    </Text>
                    <Text
                      style={[
                        {
                          color:
                            themeMode === "dark"
                              ? theme.text
                              : getPrimaryTextColor(
                                  accentColors[accentKey].dark
                                ),
                        },
                        tabletAndBelow && { fontSize: 13, width: 180 },
                      ]}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {he.decode(song?.title ?? "")}
                    </Text>
                  </View>
                  <View style={[{ marginVertical: 10 }]}>
                    <Text
                      style={[
                        {
                          color:
                            themeMode === "dark"
                              ? theme.textSecondary
                              : HEXA(
                                  getPrimaryTextColor(
                                    accentColors[accentKey].dark
                                  ),
                                  0.6
                                ),
                        },
                        tabletAndBelow && { fontSize: 13 },
                      ]}
                    >
                      {song.uploader} {"  "} ● {"  "}{" "}
                      {timeAgo(song.upload_date)}
                    </Text>
                  </View>
                  <View style={[styles?.buttonsBox]}>
                    <View
                      style={[
                        styles?.buttonBox,
                        {
                          backgroundImage: `linear-gradient(180deg, ${HEXA(
                            accentColors[accentKey].dark,
                            0.5
                          )} , ${HEXA(theme.accent, 1)})`,
                          border: `1px solid ${theme.accent}`,
                        },
                      ]}
                    >
                      <Pressable
                        style={[
                          styles?.button,
                          {
                            paddingVertical: tabletAndBelow ? 5 : 10,
                            paddingHorizontal: tabletAndBelow ? 10 : 20,
                          },
                        ]}
                        onPress={() => onPlay(i)}
                      >
                        <Text
                          style={[
                            {
                              color:
                                themeMode === "dark"
                                  ? theme.text
                                  : getPrimaryTextColor(
                                      accentColors[accentKey].dark
                                    ),
                              textAlign: "center",
                            },
                            tabletAndBelow && { fontSize: 10 },
                          ]}
                        >
                          Play
                        </Text>
                      </Pressable>
                    </View>
                    <View
                      style={[
                        styles?.buttonBox,
                        {
                          backgroundImage: `linear-gradient(180deg, ${HEXA(
                            accentColors[accentKey].dark,
                            0.5
                          )} , ${HEXA(theme.accent, 1)})`,
                          border: `1px solid ${theme.accent}`,
                        },
                      ]}
                    >
                      <Pressable
                        onPress={() => onDownload(song)}
                        style={[
                          styles?.button,
                          {
                            paddingVertical: tabletAndBelow ? 5 : 10,
                            paddingHorizontal: tabletAndBelow ? 10 : 20,
                          },
                        ]}
                        disabled={getDownloadStatus(song?.id) === "pending"}
                      >
                        <Text
                          style={[
                            {
                              color:
                                themeMode === "dark"
                                  ? theme.text
                                  : getPrimaryTextColor(
                                      accentColors[accentKey].dark
                                    ),
                              textAlign: "center",
                            },
                            tabletAndBelow && { fontSize: 10 },
                          ]}
                        >
                          {getDownloadStatus(song?.id) === "pending"
                            ? "Preparing..."
                            : getDownloadStatus(song?.id) === "done"
                            ? "Mp3 Downloaded"
                            : getDownloadStatus(song?.id) === "error"
                            ? "Download failed — retry?"
                            : "Download Mp3"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View key={song.webpage_url ?? `${(page - 1) * pageSize + i}`}>
              <View
                key={song.webpage_url ?? `${(page - 1) * pageSize + i}`}
                style={[
                  styles?.resultCardGrid,
                  {
                    backgroundImage: `linear-gradient(180deg, ${theme.background} 20%, ${accentColors[accentKey].dark} 50%)`,
                    border: `2px solid ${accentColors[accentKey].dark}`,
                  },
                ]}
              >
                <Link href={song?.webpage_url ?? ""} target="_blank">
                  <View
                    style={[
                      styles?.thumbnailImageGrid,
                      { backgroundColor: "transparent" },
                    ]}
                  >
                    <Image
                      source={{ uri: song.largest_thumbnail }}
                      style={styles?.thumbnailImg}
                      resizeMode="contain"
                    />
                  </View>
                </Link>

                <View style={[styles?.detailsGrid]}>
                  <View style={[styles?.titleDurationBoxGrid]}>
                    <View style={[styles.uploaderTimeBox, { width: "100%" }]}>
                      <Text
                        style={[
                          {
                            color:
                              themeMode === "dark"
                                ? theme.textSecondary
                                : HEXA(
                                    getPrimaryTextColor(
                                      accentColors[accentKey].dark
                                    ),
                                    0.8
                                  ),
                          },
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {timeAgo(song.upload_date)}
                      </Text>
                      <Text
                        style={[
                          {
                            color:
                              themeMode === "dark"
                                ? theme.text
                                : getPrimaryTextColor(
                                    accentColors[accentKey].dark
                                  ),
                            textAlign: "right",
                            width: "fit-content",
                          },
                        ]}
                      >
                        {formatTime(song.duration)}
                      </Text>
                    </View>

                    <Text
                      style={[
                        {
                          color:
                            themeMode === "dark"
                              ? theme.text
                              : getPrimaryTextColor(
                                  accentColors[accentKey].dark
                                ),
                        },
                      ]}
                      numberOfLines={3}
                      ellipsizeMode="tail"
                    >
                      {he.decode(song.title ?? "")}
                    </Text>
                    <Text
                      style={[
                        {
                          color:
                            themeMode === "dark"
                              ? theme.textSecondary
                              : HEXA(
                                  getPrimaryTextColor(
                                    accentColors[accentKey].dark
                                  ),
                                  0.8
                                ),
                        },
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {song.uploader}
                    </Text>
                  </View>
                  <View style={[styles?.buttonsBoxGrid]}>
                    <View
                      style={[
                        styles?.buttonBoxGrid,
                        {
                          backgroundImage: `linear-gradient(180deg, ${HEXA(
                            accentColors[accentKey].dark,
                            0.5
                          )} , ${HEXA(theme.accent, 1)})`,
                          border: `1px solid ${theme.accent}`,
                        },
                      ]}
                    >
                      <Pressable
                        style={[styles?.button]}
                        onPress={() => onPlay(i)}
                      >
                        <Text
                          style={[
                            {
                              color:
                                themeMode === "dark"
                                  ? theme.text
                                  : getPrimaryTextColor(
                                      accentColors[accentKey].dark
                                    ),
                              textAlign: "center",
                            },
                          ]}
                        >
                          Play
                        </Text>
                      </Pressable>
                    </View>
                    <View
                      style={[
                        styles?.buttonBoxGrid,
                        {
                          backgroundImage: `linear-gradient(180deg, ${HEXA(
                            accentColors[accentKey].dark,
                            0.5
                          )} , ${HEXA(theme.accent, 1)})`,
                          border: `1px solid ${theme.accent}`,
                        },
                      ]}
                    >
                      <Pressable
                        onPress={() => onDownload(song)}
                        style={[styles?.button]}
                        disabled={getDownloadStatus(song?.id) === "pending"}
                      >
                        <Text
                          style={[
                            {
                              color:
                                themeMode === "dark"
                                  ? theme.text
                                  : getPrimaryTextColor(
                                      accentColors[accentKey].dark
                                    ),
                              textAlign: "center",
                            },
                          ]}
                        >
                          {getDownloadStatus(song?.id) === "pending"
                            ? "Preparing..."
                            : getDownloadStatus(song?.id) === "done"
                            ? "Mp3 Downloaded"
                            : getDownloadStatus(song?.id) === "error"
                            ? "Download failed — retry?"
                            : "Download Mp3"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )
        )}
      </View>

      {/* PAGINATION CONTROLS (keeps styling minimal & consistent) */}
      {songs && (
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginVertical: 50,
            gap: 8,
          }}
        >
          <View>
            <Text style={{ color: theme.textSecondary, padding: 10 }}>
              Showing {Math.min((page - 1) * pageSize + 1, total)} -{" "}
              {Math.min(page * pageSize, total)} of {total}
            </Text>
          </View>

          <View style={{ display: "flex", flexDirection: "row", gap: 8 }}>
            <Pressable onPress={() => goto(1)} disabled={page === 1}>
              <Text
                style={{
                  color: page === 1 ? theme.textSecondary : theme.accent,
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  padding: 10,
                }}
              >
                First
              </Text>
            </Pressable>

            <Pressable onPress={goPrev} disabled={page === 1}>
              <Text
                style={{
                  color: page === 1 ? theme.textSecondary : theme.accent,
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  padding: 10,
                }}
              >
                Prev
              </Text>
            </Pressable>

            <Text style={{ color: theme.text, padding: 10 }}>
              {page} / {totalPages}
            </Text>

            <Pressable onPress={goNext} disabled={page === totalPages}>
              <Text
                style={{
                  color:
                    page === totalPages ? theme.textSecondary : theme.accent,
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                  padding: 10,
                }}
              >
                Next
              </Text>
            </Pressable>

            <Pressable
              onPress={() => goto(totalPages)}
              disabled={page === totalPages}
            >
              <Text
                style={{
                  color:
                    page === totalPages ? theme.textSecondary : theme.accent,
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                  padding: 10,
                }}
              >
                Last
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchResults: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    gap: 20,
  },
  searchResultsGrid: {
    display: "flex",
    justifyContent: "space-evenly",
    alignItems: "flex-start",
    width: "100%",
    gap: 20,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  thumbnailImage: {
    width: 150, // give the container a size
    height: 150,
    borderRadius: 8,
    overflow: "hidden", // important for rounded corners
  },
  thumbnailImageGrid: {
    width: 200, // give the container a size
    height: 150,
    borderRadius: 8,
    overflow: "hidden", // important for rounded corners
  },
  thumbnailImg: {
    width: "100%", // make image fill the container
    height: "100%",
  },
  resultCard: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 30,
    flexDirection: "row",
    padding: 10,
    borderRadius: 20,
    width: "80%",
  },
  resultCardGrid: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 20,
    width: "15em",
    height: "26em",
  },
  details: {
    height: 100,
    width: "70%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  detailsGrid: {
    height: 100,
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
  },
  titleDurationBox: {
    display: "flex",
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  titleDurationBoxGrid: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    width: "100%",
  },
  uploaderTimeBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    // width: "100%",
  },
  buttonsBox: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "90%",
  },
  buttonsBoxGrid: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    width: "100%",
  },
  buttonBox: {
    borderRadius: 7,
    width: "40%",
  },
  buttonBoxGrid: {
    borderRadius: 7,
    width: "100%",
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: "100%",
  },
});
