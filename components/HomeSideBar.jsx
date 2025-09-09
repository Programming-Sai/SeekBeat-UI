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
  Alert,
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

export const HomeSideBar = () => {
  const { theme, accentColors, accentKey } = useTheme();
  const { data, removeSearchAt, removeDownload, getLastSearch } =
    useAppStorage();
  const { submitSearch } = useSearch();
  const { getQueueIndex } = useDownloader();
  const [tab, setTab] = useState("history");
  const { setQueueFromSearchResults, showMiniForIndex, queue } = usePlayer();

  // local state to reflect quick UI changes (delete). Replace with persistence call as needed.
  const [localHistory, setLocalHistory] = useState(data?.searchHistory ?? []);
  useEffect(() => {
    setLocalHistory(data?.searchHistory ?? []);
  }, [data?.searchHistory]);

  const searchHistory = localHistory; // keep rest of code unchanged except using this array

  // const downloads = [];
  const downloads = data?.downloads || [];
  // console.log("DOWNLOADS: ", downloads);
  // const downloads = [
  //   {
  //     title:
  //       "LEADERS OF HISTORY RAP CYPHER | RUSTAGE ft. The Stupendium, Keyblade, TOPHAMHAT-KYO &amp; More",
  //     duration: 643,
  //     uploader: "RUSTAGE",
  //     thumbnail: "https://i.ytimg.com/vi/PEwy4U1OkBA/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=PEwy4U1OkBA",
  //     upload_date: "2025-06-21T23:45:01Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/PEwy4U1OkBA/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/PEwy4U1OkBA/default.jpg",
  //   },
  //   {
  //     title:
  //       "ALEXANDER THE GREAT RAP | &quot;TOO GREAT&quot; | RUSTAGE ft. McGwire",
  //     duration: 165,
  //     uploader: "RUSTAGE",
  //     thumbnail: "https://i.ytimg.com/vi/ylkIN11u8MU/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=ylkIN11u8MU",
  //     upload_date: "2024-12-07T17:00:53Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/ylkIN11u8MU/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/ylkIN11u8MU/default.jpg",
  //   },
  //   {
  //     title: "Leaders of History Rap Cypher | Rustage | History Teacher Reacts",
  //     duration: 1741,
  //     uploader: "Mr. Terry History",
  //     thumbnail: "https://i.ytimg.com/vi/DhLR9GS-muo/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=DhLR9GS-muo",
  //     upload_date: "2025-06-27T17:00:21Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/DhLR9GS-muo/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/DhLR9GS-muo/default.jpg",
  //   },
  //   {
  //     title:
  //       "CID KAGENOU RAP | &quot;ATOMIC&quot; | RUSTAGE ft. TSUYO [THE EMINENCE IN SHADOW]",
  //     duration: 172,
  //     uploader: "RUSTAGE",
  //     thumbnail: "https://i.ytimg.com/vi/i6urQLIEWBE/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=i6urQLIEWBE",
  //     upload_date: "2025-07-04T21:01:00Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/i6urQLIEWBE/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/i6urQLIEWBE/default.jpg",
  //   },
  //   {
  //     title:
  //       "THOR, LOKI &amp; ODIN RAP | &quot;VALHALLA&quot; | RUSTAGE ft. Shwabadi &amp; Connor Quest!",
  //     duration: 234,
  //     uploader: "RUSTAGE",
  //     thumbnail: "https://i.ytimg.com/vi/M6BRcXzcP_k/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=M6BRcXzcP_k",
  //     upload_date: "2024-10-11T22:00:12Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/M6BRcXzcP_k/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/M6BRcXzcP_k/default.jpg",
  //   },
  //   {
  //     title: "LEADERS OF HISTORY RAP CYPHER - Rustage Reaction",
  //     duration: 1565,
  //     uploader: "Vlogging Through History",
  //     thumbnail: "https://i.ytimg.com/vi/5NVF1eg1x6Y/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=5NVF1eg1x6Y",
  //     upload_date: "2025-07-24T16:23:47Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/5NVF1eg1x6Y/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/5NVF1eg1x6Y/default.jpg",
  //   },
  //   {
  //     title:
  //       "YONKO RAP CYPHER | RUSTAGE ft. Shwabadi, Connor Quest! PE$O PETE &amp; Lex Bratcher [ONE PIECE]",
  //     duration: 248,
  //     uploader: "RUSTAGE",
  //     thumbnail: "https://i.ytimg.com/vi/8tCMJOYvpi4/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=8tCMJOYvpi4",
  //     upload_date: "2021-06-11T21:00:05Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/8tCMJOYvpi4/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/8tCMJOYvpi4/default.jpg",
  //   },
  //   {
  //     title:
  //       "SUPERMAN RAP  | &quot;HOPE&quot; | RUSTAGE ft. JT MUSIC &amp; LongestSoloEver",
  //     duration: 215,
  //     uploader: "RUSTAGE",
  //     thumbnail: "https://i.ytimg.com/vi/ayA_GJV93gA/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=ayA_GJV93gA",
  //     upload_date: "2025-08-09T00:35:00Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/ayA_GJV93gA/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/ayA_GJV93gA/default.jpg",
  //   },
  //   {
  //     title:
  //       "WILL OF D. RAP CYPHER | RUSTAGE ft. Shao Dow, Shwabadi &amp; More [ONE PIECE]",
  //     duration: 366,
  //     uploader: "RUSTAGE",
  //     thumbnail: "https://i.ytimg.com/vi/U7bp_aiVBGU/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=U7bp_aiVBGU",
  //     upload_date: "2023-10-14T16:00:18Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/U7bp_aiVBGU/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/U7bp_aiVBGU/default.jpg",
  //   },
  //   {
  //     title: "RUSTAGE - LEADERS OF HISTORY RAP CYPHER | Reaction!",
  //     duration: 1398,
  //     uploader: "WHAT IT DO DAVE",
  //     thumbnail: "https://i.ytimg.com/vi/ctU9akacRCw/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=ctU9akacRCw",
  //     upload_date: "2025-06-22T15:00:58Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/ctU9akacRCw/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/ctU9akacRCw/default.jpg",
  //   },
  // ];

  const [openMenuIndex, setOpenMenuIndex] = useState(null);

  const openItem = (term) => {
    submitSearch(term);
    setOpenMenuIndex(null);
  };

  const copyItem = (term) => {
    try {
      Clipboard.setStringAsync(term);
      // small feedback
      window.alert(`${term} copied to clipboard`);
    } catch (e) {
      console.warn("Clipboard error", e);
    }
    setOpenMenuIndex(null);
  };

  const deleteItem = (index) => {
    const confirmed = window.confirm(`Delete "${searchHistory[index].term}"?`);
    if (confirmed) {
      removeSearchAt(index);
    }
    setOpenMenuIndex(null);
  };

  const playDownload = (download) => {
    const idx = download?.queueIndex ?? getQueueIndex(download?.id);
    console.log(
      `Playing: ${download?.song?.title} at index: ${idx}, ${
        getLastSearch()?.items?.length
      }`
    );

    // idx = (page - 1) * pageSize + idx;
    setQueueFromSearchResults([download?.song], /*startIndex=*/ 0); // sets queue and currentIndex to idx
    showMiniForIndex(0, true); // opens the mini player but doesn't auto-play
    setOpenMenuIndex(null);
  };

  // const onPlay = (idx) => {};

  const deleteDownload = (download) => {
    const confirmed = window.confirm(`Delete "${download?.song?.title}"?`);
    if (confirmed) {
      removeDownload(download?.id || download?.song?.id || download);
    }
    setOpenMenuIndex(null);
  };

  return (
    <View style={[styles.container, {}]}>
      <View
        style={[
          styles.tabBar,
          { backgroundColor: HEXA(accentColors[accentKey].light, 0.3) },
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
                      style={{ color: theme.text, width: 250 }}
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
                  { backgroundColor: theme.background },
                ]}
              >
                <View style={[styles.imageBox]}>
                  <Image
                    style={[styles.image]}
                    source={{ uri: download?.song?.largest_thumbnail }}
                  />
                </View>
                <View style={[styles.content, { gap: 10 }]}>
                  <Text
                    style={[{ color: theme.text, width: 225, fontSize: 12 }]}
                    ellipsizeMode="tail"
                    numberOfLines={1}
                  >
                    {he.decode(download?.song?.title)}
                  </Text>
                  <View style={[styles.metadata]}>
                    <Text
                      style={[{ color: theme.textSecondary, fontSize: 12 }]}
                    >
                      {formatTime(download?.song?.duration)}
                    </Text>
                    <Text
                      style={[{ color: theme.textSecondary, fontSize: 12 }]}
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
    justifyContent: "space-between",
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
    justifyContent: "space-between",
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
