// HomeSideBar.js (modified parts only — full file below)
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "../contexts/ThemeContext";
import { getPrimaryTextColor, HEXA } from "../lib/colors";
import { HistoryIcon } from "./HistoryIcon";
import { MoreIcon } from "./MoreIcon";
import { DownloadIcon } from "./DownloadIcon";
import he from "he";
import formatTime from "../lib/utils";
import { useAppStorage } from "../contexts/AppStorageContext";
import { useSearch } from "../contexts/SearchContext";
import { InlineMenu } from "./InlineMenu"; // <-- new
import { useDownloader } from "../contexts/DownloaderContext";
import { usePlayer } from "../contexts/PlayerContext";
import { useResponsive } from "../contexts/ResponsiveContext";

export const HomeSideBar = ({ tab, setTab }) => {
  const { theme, accentColors, accentKey } = useTheme();
  const { data, removeSearchAt, removeDownload, getDownloadStatus } =
    useAppStorage();
  const { submitSearch } = useSearch();
  const { setQueueFromSearchResults, showMiniForIndex, playIndex } =
    usePlayer();
  const { isAtOrBelow, isBetween, isAtOrAbove } = useResponsive();
  const betweenTabletAndLaptop = isBetween("sm", "lg");
  const mobileAndBelow = isAtOrBelow("sm");
  const tabletAndAbove = isAtOrAbove("md", true);
  const laptopAndBelow = isAtOrBelow("lg");
  const laptopAndAbove = isAtOrAbove("xl", true);

  // local state to reflect quick UI changes (delete). Replace with persistence call as needed.
  const [localHistory, setLocalHistory] = useState(data?.searchHistory ?? []);
  useEffect(() => {
    setLocalHistory(data?.searchHistory ?? []);
  }, [data?.searchHistory]);

  const searchHistory = localHistory; // keep rest of code unchanged except using this array

  // const downloads = [];
  const downloads = data?.downloads || [];

  const openItem = (term) => {
    submitSearch(term);
  };

  const copyItem = (term) => {
    try {
      Clipboard.setStringAsync(term);
      // small feedback
      window.alert(`${term} copied to clipboard`);
    } catch (e) {
      console.warn("Clipboard error", e);
    }
  };

  const deleteItem = (index) => {
    const confirmed = window.confirm(`Delete "${searchHistory[index].term}"?`);
    if (confirmed) {
      removeSearchAt(index);
    }
  };

  const playDownload = (download) => {
    const idx = downloads.findIndex(
      (songs) =>
        songs?.id === download?.id ||
        songs?.webpage_url === download?.webpage_url
    );

    const downloadQueue = Object.values(downloads || {})?.map(
      (song) => song?.song
    );
    // idx = (page - 1) * pageSize + idx;
    setQueueFromSearchResults(downloadQueue, /*startIndex=*/ idx); // sets queue and currentIndex to idx
    playIndex(idx);
    showMiniForIndex(idx, true, true); // opens the mini player but doesn't auto-play
  };

  // const onPlay = (idx) => {};

  const deleteDownload = (download) => {
    const confirmed = window.confirm(`Delete "${download?.song?.title}"?`);
    if (confirmed) {
      removeDownload(download?.id || download?.song?.id || download);
    }
  };

  return (
    <View
      style={[
        styles.container,
        betweenTabletAndLaptop && { padding: 0, gap: 10 },
      ]}
    >
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: HEXA(accentColors[accentKey].light, 0.3),
            transform: [{ scale: betweenTabletAndLaptop ? 0.8 : 1 }],
          },
        ]}
      >
        <Pressable
          onPress={() => setTab("history")}
          style={[
            styles.tab,
            tab === "history" && {
              backgroundColor: accentColors[accentKey].dark,
            },
          ]}
        >
          <Text
            style={[
              {
                color:
                  tab === "history"
                    ? getPrimaryTextColor(accentColors[accentKey].dark)
                    : theme.text,
              },
            ]}
          >
            History
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab("downloads")}
          style={[
            styles.tab,
            tab === "downloads" && {
              backgroundColor: accentColors[accentKey].dark,
            },
          ]}
        >
          <Text
            style={[
              {
                color:
                  tab === "downloads"
                    ? getPrimaryTextColor(accentColors[accentKey].dark)
                    : theme.text,
              },
            ]}
          >
            Downloads
          </Text>
        </Pressable>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={[styles.tabContentContainer, {}]}
      >
        {tab === "history" ? (
          searchHistory && searchHistory.length > 0 ? (
            searchHistory
              // .slice(0, 3)
              .sort((a, b) => b.when - a.when)
              .map((hist, idx) => (
                <Pressable
                  key={idx}
                  style={[
                    styles.historyItemBox,
                    {
                      backgroundColor: theme.background,
                      position: "relative",
                    },
                  ]}
                  onPress={() => submitSearch(hist?.term)}
                >
                  <View style={[styles.iconText]}>
                    <HistoryIcon color={theme.text} size={20} />
                    <Text
                      style={{
                        color: theme.text,
                        width: laptopAndAbove
                          ? 200 // 💻 big screens first
                          : mobileAndBelow
                          ? 100 // 📱 small screens next
                          : betweenTabletAndLaptop
                          ? 80 // 🪄 tablet window
                          : 150, // default (sm to md)
                      }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {hist?.term}
                    </Text>
                  </View>

                  <View>
                    <InlineMenu
                      trigger={<MoreIcon color={theme.text} size={20} />}
                      options={[
                        {
                          label: "Open",
                          onPress: () => openItem(hist?.term),
                        },
                        {
                          label: "Copy",
                          onPress: () => copyItem(hist?.term),
                        },
                        {
                          label: "Delete",
                          onPress: () => deleteItem(idx),
                        },
                      ]}
                    />
                  </View>
                </Pressable>
              ))
          ) : (
            <View style={styles.emptyState}>
              <HistoryIcon color={HEXA(theme.accent, 0.3)} size={80} />
              <Text style={{ fontSize: 20, color: theme.textSecondary }}>
                Your Search History Appears Here
              </Text>
            </View>
          )
        ) : downloads && downloads?.length > 0 ? (
          downloads
            .sort((a, b) => b.when - a.when)
            .map((download, idx) => (
              <View
                key={idx}
                style={[
                  styles.downloadItemBox,
                  {
                    backgroundColor: theme.background,
                    justifyContent: laptopAndBelow
                      ? "flex-start"
                      : "space-between",
                    transform: [{ scale: betweenTabletAndLaptop ? 0.8 : 1 }],
                    width: "100%",
                  },
                ]}
              >
                <View style={[styles.imageBox]}>
                  {getDownloadStatus(download?.id) === "pending" && (
                    <View
                      style={{
                        zIndex: 250,
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: HEXA(theme.background, 0.6),
                        display: "grid",
                        placeContent: "center",
                      }}
                    >
                      <ActivityIndicator size={25} color={theme.text} />
                    </View>
                  )}
                  <Image
                    style={[styles.image]}
                    source={{ uri: download?.song?.largest_thumbnail }}
                  />
                </View>
                <View style={[styles.content, { gap: 10, width: "70%" }]}>
                  <Text
                    style={[
                      {
                        color: theme.text,
                        width: "100%",
                        fontSize: 12,
                      },
                    ]}
                    ellipsizeMode="tail"
                    numberOfLines={1}
                  >
                    {he.decode(download?.song?.title)}
                  </Text>
                  <View
                    style={[
                      styles.metadata,
                      {
                        justifyContent: tabletAndAbove
                          ? "flex-start"
                          : "space-between",
                      },
                    ]}
                  >
                    <Text
                      style={[{ color: theme.textSecondary, fontSize: 12 }]}
                    >
                      {formatTime(download?.song?.duration)}
                    </Text>
                    <Text
                      style={[
                        {
                          color: theme.textSecondary,
                          fontSize: 12,
                          width: "100%",
                        },
                      ]}
                      ellipsizeMode="tail"
                      numberOfLines={1}
                    >
                      {download?.song?.uploader}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity>
                  <View>
                    <InlineMenu
                      trigger={<MoreIcon color={theme.text} size={25} />}
                      options={[
                        {
                          label: "Play",
                          onPress: () => playDownload(download),
                        },
                        {
                          label: "Delete",
                          onPress: () => deleteDownload(download),
                        },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            ))
        ) : (
          <View style={styles.emptyState}>
            <DownloadIcon color={HEXA(theme.accent, 0.3)} size={80} />
            <Text style={{ fontSize: 20, color: theme.textSecondary }}>
              Your Downloads Appears Here
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// ... keep your styles exactly as they are (no changes)
const styles = StyleSheet.create({
  container: {
    padding: 16,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 50,
    flex: 1,
  },
  tabBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    width: "fit-content",
    borderRadius: 50,
    padding: 3,
  },
  tab: {
    padding: 10,
    borderRadius: 50,
    width: 100,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  tabContentContainer: {
    width: "100%",
    paddingBottom: 50,
  },
  historyItemBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginVertical: 5,
    padding: 5,
    borderRadius: 10,
  },
  iconText: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "row",
    gap: 20,
  },
  emptyState: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 25,
  },
  downloadItemBox: {
    display: "flex",
    // justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
    padding: 5,
    borderRadius: 10,
  },
  imageBox: {
    width: 50,
    height: 50,
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  metadata: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
});
