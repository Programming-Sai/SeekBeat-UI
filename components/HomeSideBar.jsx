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
// import Clipboard from "@react-native-clipboard/clipboard"; // install if you don't have it
import { useTheme } from "../contexts/ThemeContext";
import { getPrimaryTextColor, HEXA } from "../lib/colors";
import { HistoryIcon } from "./HistoryIcon";
import { MoreIcon } from "./MoreIcon";
import { DownloasdIcon } from "./DownloadIcon";
import he from "he";
import formatTime from "../lib/utils";
import { useAppStorage } from "../contexts/AppStorageContext";
import { useSearch } from "../contexts/SearchContext";
import { InlineMenu } from "./InlineMenu"; // <-- new

export const HomeSideBar = () => {
  const { theme, accentColors, accentKey } = useTheme();
  const { data } = useAppStorage();
  const { submitSearch } = useSearch();
  const [tab, setTab] = useState("history");

  // local state to reflect quick UI changes (delete). Replace with persistence call as needed.
  const [localHistory, setLocalHistory] = useState(data?.searchHistory ?? []);
  useEffect(() => {
    setLocalHistory(data?.searchHistory ?? []);
  }, [data?.searchHistory]);

  const searchHistory = localHistory; // keep rest of code unchanged except using this array

  const downloads = data?.downloads;

  const [openMenuIndex, setOpenMenuIndex] = useState(null);

  const openItem = (term) => {
    submitSearch(term);
    setOpenMenuIndex(null);
  };

  const copyItem = (term) => {
    try {
      Clipboard.setString(term);
      // small feedback
      Alert.alert("Copied", "Search term copied to clipboard");
    } catch (e) {
      console.warn("Clipboard error", e);
    }
    setOpenMenuIndex(null);
  };

  const deleteItem = (index) => {
    Alert.alert("Delete", "Delete this history entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const next = [...(data?.searchHistory ?? [])];
          // find correct item index relative to the sorted map: we used the raw localHistory order, so just splice index from localHistory
          next.splice(index, 1);
          setLocalHistory(next);
          // If you have a persistence API, call it here (e.g. setData or updateSearchHistory)
        },
      },
    ]);
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
              // .slice(0, 1)
              .sort((a, b) => b.when - a.when)
              .map((hist, idx) => (
                <Pressable
                  key={idx}
                  // add position: 'relative' inline so inline menu absolute positioning anchors to this item
                  style={[
                    styles.historyItemBox,
                    {
                      backgroundColor: theme.background,
                      position: "relative",
                      // zIndex: -200,
                    },
                  ]}
                  onPress={() => submitSearch(hist?.term)}
                >
                  <View style={[styles.iconText]}>
                    <HistoryIcon color={theme.text} size={20} />
                    <Text style={{ color: theme.text }}>{hist?.term}</Text>
                  </View>

                  <View>
                    <TouchableOpacity
                      onPress={() =>
                        setOpenMenuIndex(openMenuIndex === idx ? null : idx)
                      }
                    >
                      <MoreIcon color={theme.text} size={20} />
                    </TouchableOpacity>

                    {openMenuIndex === idx && (
                      <InlineMenu
                        onClose={() => setOpenMenuIndex(null)}
                        options={[
                          {
                            label: "Open",
                            onPress: () => openItem(hist?.term),
                          },
                          {
                            label: "Copy",
                            onPress: () => console.log(hist?.term),
                            // onPress: () => copyItem(hist?.term),
                          },
                          { label: "Delete", onPress: () => deleteItem(idx) },
                        ]}
                        // tweak position if you need it (kept minimal)
                        style={{ right: 6, top: 36 }}
                      />
                    )}
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
        ) : downloads && downloads.length > 0 ? (
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
                    source={{ uri: download?.largest_thumbnail }}
                  />
                </View>
                <View style={[styles.content]}>
                  <Text
                    style={[{ color: theme.text, width: 225, fontSize: 12 }]}
                    ellipsizeMode="tail"
                    numberOfLines={1}
                  >
                    {he.decode(download?.title)}
                  </Text>
                  <View style={[styles.metadata]}>
                    <Text
                      style={[{ color: theme.textSecondary, fontSize: 12 }]}
                    >
                      {formatTime(download?.duration)}
                    </Text>
                    <Text
                      style={[{ color: theme.textSecondary, fontSize: 12 }]}
                    >
                      {download?.uploader}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity>
                  <MoreIcon color={theme.text} size={25} />
                </TouchableOpacity>
              </View>
            ))
        ) : (
          <View style={styles.emptyState}>
            <DownloasdIcon color={HEXA(theme.accent, 0.3)} size={80} />
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
    width: "!00%",
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
