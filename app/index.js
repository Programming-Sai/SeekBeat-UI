import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { Link } from "expo-router";
import { useTheme } from "../contexts/ThemeContext";
import { useRightSidebar } from "../contexts/SidebarContext";
import { useEffect } from "react";
import { Image } from "react-native";
import formatTime from "../lib/utils";
import { getPrimaryTextColor, HEXA } from "../lib/colors";
import { useAppStorage } from "../contexts/AppStorageContext";
import he from "he";
import BulkSearchInput from "../components/BulkSearchInput";

export default function Home() {
  const songs = [
    {
      title:
        "LEADERS OF HISTORY RAP CYPHER | RUSTAGE ft. The Stupendium, Keyblade, TOPHAMHAT-KYO &amp; More",
      duration: 643,
      uploader: "RUSTAGE",
      thumbnail: "https://i.ytimg.com/vi/PEwy4U1OkBA/hqdefault.jpg",
      webpage_url: "https://www.youtube.com/watch?v=PEwy4U1OkBA",
      upload_date: "2025-06-21T23:45:01Z",
      largest_thumbnail: "https://i.ytimg.com/vi/PEwy4U1OkBA/hqdefault.jpg",
      smallest_thumbnail: "https://i.ytimg.com/vi/PEwy4U1OkBA/default.jpg",
    },
    {
      title:
        "ALEXANDER THE GREAT RAP | &quot;TOO GREAT&quot; | RUSTAGE ft. McGwire",
      duration: 165,
      uploader: "RUSTAGE",
      thumbnail: "https://i.ytimg.com/vi/ylkIN11u8MU/hqdefault.jpg",
      webpage_url: "https://www.youtube.com/watch?v=ylkIN11u8MU",
      upload_date: "2024-12-07T17:00:53Z",
      largest_thumbnail: "https://i.ytimg.com/vi/ylkIN11u8MU/hqdefault.jpg",
      smallest_thumbnail: "https://i.ytimg.com/vi/ylkIN11u8MU/default.jpg",
    },
    {
      title: "Leaders of History Rap Cypher | Rustage | History Teacher Reacts",
      duration: 1741,
      uploader: "Mr. Terry History",
      thumbnail: "https://i.ytimg.com/vi/DhLR9GS-muo/hqdefault.jpg",
      webpage_url: "https://www.youtube.com/watch?v=DhLR9GS-muo",
      upload_date: "2025-06-27T17:00:21Z",
      largest_thumbnail: "https://i.ytimg.com/vi/DhLR9GS-muo/hqdefault.jpg",
      smallest_thumbnail: "https://i.ytimg.com/vi/DhLR9GS-muo/default.jpg",
    },
    {
      title:
        "CID KAGENOU RAP | &quot;ATOMIC&quot; | RUSTAGE ft. TSUYO [THE EMINENCE IN SHADOW]",
      duration: 172,
      uploader: "RUSTAGE",
      thumbnail: "https://i.ytimg.com/vi/i6urQLIEWBE/hqdefault.jpg",
      webpage_url: "https://www.youtube.com/watch?v=i6urQLIEWBE",
      upload_date: "2025-07-04T21:01:00Z",
      largest_thumbnail: "https://i.ytimg.com/vi/i6urQLIEWBE/hqdefault.jpg",
      smallest_thumbnail: "https://i.ytimg.com/vi/i6urQLIEWBE/default.jpg",
    },
    {
      title:
        "THOR, LOKI &amp; ODIN RAP | &quot;VALHALLA&quot; | RUSTAGE ft. Shwabadi &amp; Connor Quest!",
      duration: 234,
      uploader: "RUSTAGE",
      thumbnail: "https://i.ytimg.com/vi/M6BRcXzcP_k/hqdefault.jpg",
      webpage_url: "https://www.youtube.com/watch?v=M6BRcXzcP_k",
      upload_date: "2024-10-11T22:00:12Z",
      largest_thumbnail: "https://i.ytimg.com/vi/M6BRcXzcP_k/hqdefault.jpg",
      smallest_thumbnail: "https://i.ytimg.com/vi/M6BRcXzcP_k/default.jpg",
    },
    {
      title: "LEADERS OF HISTORY RAP CYPHER - Rustage Reaction",
      duration: 1565,
      uploader: "Vlogging Through History",
      thumbnail: "https://i.ytimg.com/vi/5NVF1eg1x6Y/hqdefault.jpg",
      webpage_url: "https://www.youtube.com/watch?v=5NVF1eg1x6Y",
      upload_date: "2025-07-24T16:23:47Z",
      largest_thumbnail: "https://i.ytimg.com/vi/5NVF1eg1x6Y/hqdefault.jpg",
      smallest_thumbnail: "https://i.ytimg.com/vi/5NVF1eg1x6Y/default.jpg",
    },
    {
      title:
        "YONKO RAP CYPHER | RUSTAGE ft. Shwabadi, Connor Quest! PE$O PETE &amp; Lex Bratcher [ONE PIECE]",
      duration: 248,
      uploader: "RUSTAGE",
      thumbnail: "https://i.ytimg.com/vi/8tCMJOYvpi4/hqdefault.jpg",
      webpage_url: "https://www.youtube.com/watch?v=8tCMJOYvpi4",
      upload_date: "2021-06-11T21:00:05Z",
      largest_thumbnail: "https://i.ytimg.com/vi/8tCMJOYvpi4/hqdefault.jpg",
      smallest_thumbnail: "https://i.ytimg.com/vi/8tCMJOYvpi4/default.jpg",
    },
    {
      title:
        "SUPERMAN RAP  | &quot;HOPE&quot; | RUSTAGE ft. JT MUSIC &amp; LongestSoloEver",
      duration: 215,
      uploader: "RUSTAGE",
      thumbnail: "https://i.ytimg.com/vi/ayA_GJV93gA/hqdefault.jpg",
      webpage_url: "https://www.youtube.com/watch?v=ayA_GJV93gA",
      upload_date: "2025-08-09T00:35:00Z",
      largest_thumbnail: "https://i.ytimg.com/vi/ayA_GJV93gA/hqdefault.jpg",
      smallest_thumbnail: "https://i.ytimg.com/vi/ayA_GJV93gA/default.jpg",
    },
    {
      title:
        "WILL OF D. RAP CYPHER | RUSTAGE ft. Shao Dow, Shwabadi &amp; More [ONE PIECE]",
      duration: 366,
      uploader: "RUSTAGE",
      thumbnail: "https://i.ytimg.com/vi/U7bp_aiVBGU/hqdefault.jpg",
      webpage_url: "https://www.youtube.com/watch?v=U7bp_aiVBGU",
      upload_date: "2023-10-14T16:00:18Z",
      largest_thumbnail: "https://i.ytimg.com/vi/U7bp_aiVBGU/hqdefault.jpg",
      smallest_thumbnail: "https://i.ytimg.com/vi/U7bp_aiVBGU/default.jpg",
    },
    {
      title: "RUSTAGE - LEADERS OF HISTORY RAP CYPHER | Reaction!",
      duration: 1398,
      uploader: "WHAT IT DO DAVE",
      thumbnail: "https://i.ytimg.com/vi/ctU9akacRCw/hqdefault.jpg",
      webpage_url: "https://www.youtube.com/watch?v=ctU9akacRCw",
      upload_date: "2025-06-22T15:00:58Z",
      largest_thumbnail: "https://i.ytimg.com/vi/ctU9akacRCw/hqdefault.jpg",
      smallest_thumbnail: "https://i.ytimg.com/vi/ctU9akacRCw/default.jpg",
    },
  ];
  const { setRightSidebarKey } = useRightSidebar();
  const { viewMode } = useAppStorage();
  const { theme, themeMode, accentKey, accentColors } = useTheme();

  useEffect(() => {
    setRightSidebarKey("home");
    return () => setRightSidebarKey(null);
  }, []);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={[styles.container]}
      // contentContainerStyle={[styles.scrollContainer]}
    >
      <View style={[styles.bulkSearchContainer]}></View>
      <View
        style={
          [
            viewMode === "list"
              ? styles.searchResults
              : styles.searchResultsGrid,
          ]
          // { display: "none" }
        }
      >
        {songs.map((song) =>
          viewMode === "list" ? (
            <View
              style={[
                styles.resultCard,
                {
                  backgroundImage: `linear-gradient(90deg, ${theme.background} 10%, ${accentColors[accentKey].dark} 30%)`,
                  border: `2px solid ${accentColors[accentKey].dark}`,
                },
              ]}
            >
              <Link href={song.webpage_url} target="_blank">
                <View
                  style={[
                    styles.thumbnailImage,
                    { backgroundColor: "transparent" },
                  ]}
                >
                  <Image
                    source={{ uri: song.largest_thumbnail }}
                    style={styles.thumbnailImg}
                    resizeMode="contain"
                  />
                </View>
              </Link>

              <View style={[styles.details]}>
                <View style={[styles.titleDurationBox]}>
                  <Text
                    style={[
                      {
                        color:
                          themeMode === "dark"
                            ? theme.text
                            : getPrimaryTextColor(accentColors[accentKey].dark),
                      },
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
                            : getPrimaryTextColor(accentColors[accentKey].dark),
                      },
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
                            : getPrimaryTextColor(accentColors[accentKey].dark),
                      },
                    ]}
                  >
                    {he.decode(song.title)}
                  </Text>
                </View>
                {/*  */}
                <View style={[styles.buttonsBox]}>
                  <View
                    style={[
                      styles.buttonBox,
                      {
                        backgroundImage: `linear-gradient(180deg, ${HEXA(
                          accentColors[accentKey].dark,
                          0.5
                        )} , ${HEXA(theme.accent, 1)})`,
                        border: `1px solid ${theme.accent}`,
                      },
                    ]}
                  >
                    <Pressable style={[styles.button]}>
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
                  </View>{" "}
                  <View
                    style={[
                      styles.buttonBox,
                      {
                        backgroundImage: `linear-gradient(180deg, ${HEXA(
                          accentColors[accentKey].dark,
                          0.5
                        )} , ${HEXA(theme.accent, 1)})`,
                        border: `1px solid ${theme.accent}`,
                      },
                    ]}
                  >
                    <Pressable style={[styles.button]}>
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
                        Download Mp3
                      </Text>
                    </Pressable>
                  </View>
                </View>
                {/*  */}
              </View>
            </View>
          ) : (
            <View
              style={[
                styles.resultCardGrid,
                {
                  backgroundImage: `linear-gradient(180deg, ${theme.background} 20%, ${accentColors[accentKey].dark} 50%)`,
                  border: `2px solid ${accentColors[accentKey].dark}`,
                },
              ]}
            >
              <Link href={song.webpage_url} target="_blank">
                <View
                  style={[
                    styles.thumbnailImageGrid,
                    { backgroundColor: "transparent" },
                  ]}
                >
                  <Image
                    source={{ uri: song.largest_thumbnail }}
                    style={styles.thumbnailImg}
                    resizeMode="contain"
                  />
                </View>
              </Link>

              <View style={[styles.detailsGrid]}>
                <View style={[styles.titleDurationBoxGrid]}>
                  <Text
                    style={[
                      {
                        color:
                          themeMode === "dark"
                            ? theme.text
                            : getPrimaryTextColor(accentColors[accentKey].dark),
                        textAlign: "right",
                        width: "100%",
                      },
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
                            : getPrimaryTextColor(accentColors[accentKey].dark),
                      },
                    ]}
                    numberOfLines={3}
                    ellipsizeMode="tail"
                  >
                    {he.decode(song.title)}
                  </Text>
                </View>
                {/*  */}
                <View style={[styles.buttonsBoxGrid]}>
                  <View
                    style={[
                      styles.buttonBoxGrid,
                      {
                        backgroundImage: `linear-gradient(180deg, ${HEXA(
                          accentColors[accentKey].dark,
                          0.5
                        )} , ${HEXA(theme.accent, 1)})`,
                        border: `1px solid ${theme.accent}`,
                      },
                    ]}
                  >
                    <Pressable style={[styles.button]}>
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
                  </View>{" "}
                  <View
                    style={[
                      styles.buttonBoxGrid,
                      {
                        backgroundImage: `linear-gradient(180deg, ${HEXA(
                          accentColors[accentKey].dark,
                          0.5
                        )} , ${HEXA(theme.accent, 1)})`,
                        border: `1px solid ${theme.accent}`,
                      },
                    ]}
                  >
                    <Pressable style={[styles.button]}>
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
                        Download Mp3
                      </Text>
                    </Pressable>
                  </View>
                </View>
                {/*  */}
              </View>
            </View>
          )
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 200,
    width: "100%",
  },
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
    height: "25em",
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
