// app/player/[id].js
import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRightSidebar } from "../../contexts/SidebarContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useSearch } from "../../contexts/SearchContext";
import { usePlayer } from "../../contexts/PlayerContext";
import he from "he";
import formatTime from "../../lib/utils";
import { HEXA } from "../../lib/colors";
import { PreviousIcon } from "../../components/PreviousIcon";
import { PauseIcon } from "../../components/PauseIcon";
import { PlayIcon } from "../../components/PlayIcon";
import { NextIcon } from "../../components/NextIcon";
import { useAppStorage } from "../../contexts/AppStorageContext";
import SeekBar from "../../components/SeekBar";
import { PlayInOrder } from "../../components/PlayInOrder";
import { ShuffleIcon } from "../../components/ShufleIcon";
import { RepeatAllIcon } from "../../components/RepeatAllIcon";
import { RepeatOneIcon } from "../../components/RepeatOneIcon";
import { SpeedIcon } from "../../components/SpeedIcon";
import { VolumeIcon } from "../../components/VolumeIcon";
import { DownloadIcon } from "../../components/DownloadIcon";
import { EditIcon } from "../../components/EditIcon";
import { InlineMenu } from "../../components/InlineMenu";
import { MoreIcon } from "../../components/MoreIcon";
import { useSearchParams } from "expo-router/build/hooks";
import * as ImagePicker from "expo-image-picker";
import MultiSlider from "@ptomasroos/react-native-multi-slider";

/**
 * Full Player Page (fixed hook ordering)
 */
export default function PlayerPage() {
  const { id } = useLocalSearchParams();
  const { edit } = useLocalSearchParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  // const params = new URLSearchParams(searchParams);
  const [isEditor, setIsEditor] = useState(edit === "true");

  const [queueCommandIndex, setQueueCommandIndex] = useState(0);

  // call all hooks unconditionally (important!)
  const rightSidebarCtx = useRightSidebar();
  const themeCtx = useTheme();
  const searchCtx = useSearch();
  const player = usePlayer();
  const appStorage = useAppStorage();

  // safe destructuring / fallbacks
  const { setRightSidebarKey } = rightSidebarCtx ?? {};
  const { theme, themeMode } = themeCtx ?? {
    theme: {
      background: "#fff",
      text: "#000",
      textSecondary: "#666",
      accent: "#1DB954",
    },
  };
  const { getFlatItems, normalized, isLoading, error } = searchCtx ?? {
    getFlatItems: () => [],
    normalized: null,
    isLoading: false,
  };
  const { getLastSearch } = appStorage ?? {};

  // safe references to player methods (may be undefined until player exists)

  const setQueueSafe = player?.setQueue;
  const currentTrackSafe = player?.currentTrack;
  const positionSafe = player?.position;
  const durationSafe = player?.duration;

  // const queue = player?.queue;
  const {
    queue,
    isPlaying,
    playPause,
    next,
    prev,
    seek,
    setCurrentIndex,
    currentIndex,
  } = player;

  const queueCommands = [
    () => {
      return <PlayInOrder size={25} color={theme.text} />;
    },
    () => {
      return <ShuffleIcon size={25} color={theme.text} />;
    },
    () => {
      return <RepeatAllIcon size={25} color={theme.text} />;
    },
    () => {
      return <RepeatOneIcon size={25} color={theme.text} />;
    },
  ];

  // console.log("Is editor:", isEditor);

  // ---- Now it's safe to declare effects and memos (they always run in same order) ----

  useEffect(() => {
    // Only perform side-effects if the functions exist.
    const last = getLastSearch?.();
    if (last?.items) {
      setQueueSafe?.(last.items);
    }
    // console.log("QUEUE: ", queue);
    setRightSidebarKey?.(isEditor ? "playerEdit" : "player");
    return () => setRightSidebarKey?.(null);
    // intentionally minimal deps; these refs are stable-ish (functions from context)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // helper for search-derived "flat" items (optional)
  const flat = useMemo(() => queue, [queue]);

  const foundIndex = useMemo(() => {
    if (!id || !Array.isArray(flat) || !flat.length) return -1;
    return flat.findIndex(
      (s) => s?.id === id || (s?.webpage_url && s.webpage_url.includes(id))
    );
  }, [flat, id]);

  const found = foundIndex >= 0 ? flat[foundIndex] : null;

  // When foundIndex changes, set the current index in player
  useEffect(() => {
    if (foundIndex >= 0) {
      setCurrentIndex?.(foundIndex);
    }
  }, [foundIndex, setCurrentIndex]);

  // pick track from found or player
  const track = found || currentTrackSafe || null;

  // duration preference: player.duration (live) or track.duration fallback
  const trackDuration = useMemo(() => {
    player?.setDuration(track?.duration);
    const n = Number(durationSafe ?? track?.duration ?? 0);
    // console.log("Duration: ", durationSafe);

    return Number.isFinite(n) ? n : 0;
  }, [durationSafe, track?.duration]);

  // compute pct from player position (safe)
  const pctFromCtx = Math.max(
    0,
    Math.min(1, (positionSafe || 0) / Math.max(1, trackDuration))
  );

  const backendVolume = (percentage) => {
    // percentage: 0–100
    // Map 0–100% to 0–5 backend scale
    return Math.round((percentage / 100) * 10) / 2; // rounds to nearest 0.5
  };

  const displayPercentage = (backendValue) => {
    // backendValue: 0, 0.5, 1, ...
    return (backendValue / 5) * 100;
  };

  const onChangeQueueCommand = () => {
    setQueueCommandIndex((prev) => (prev + 1) % queueCommands.length);
  };

  const handleEdit = () => {
    const newIsEditor = !isEditor;

    if (newIsEditor) {
      // Add ?edit=true
      router.push(`/player/${id}?edit=true`, undefined, { shallow: true });
    } else {
      // Remove ?edit
      router.push(`/player/${id}`, undefined, { shallow: true });
    }

    setIsEditor(newIsEditor);
  };
  const [multiSliderWidth, setMultiSliderWidth] = useState(0);

  const loadEdits = () => {
    const stored = localStorage.getItem("@seekbeat:edits");
    return stored ? JSON.parse(stored) : null;
  };
  const potentialEdits = loadEdits();

  const [edits, setEdits] = useState(
    (track?.webpage_url === potentialEdits?.webpage_url && potentialEdits) || {
      speed: 1,
      trim: { start_time: 0, end_time: track?.duration },
      volume: 3.75,
      metadata: {
        title: track?.title,
        artist: track?.uploader,
        album: track?.uploader,
        date: track?.upload_date,
        genre: null,
        url: track?.webpage_url,
        thumbnail: track?.largest_thumbnail,
      },
    }
  );

  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(track?.duratiosn);

  const pickImage = async () => {
    // If using expo-image-picker (native + web):
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setEdits((prev) => {
        const edit = {
          ...prev,
          metadata: { ...prev.metadata, thumbnail: result.assets[0].uri },
        };
        saveEdits(edit);
        return edit;
      });
    }
  };

  const saveEdits = (edits) => {
    localStorage.setItem("@seekbeat:edits", JSON.stringify(edits));
  };

  const clearEdits = () => {
    localStorage.removeItem("@seekbeat:edits");
  };

  // now safe early return: we've already called hooks above
  if (!player) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text || "#000" }}>
          Player context not available — make sure PlayerProvider wraps your
          app.
        </Text>
      </View>
    );
  }

  // Now destructure live player (you can keep using the safe vars above if you prefer)

  // if track still not found, show friendly empty state
  if (!track) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>
          No track found for id: {String(id)}
        </Text>
        <Text
          style={{
            color: themeMode === "dark" ? theme.textSecondary : "white",
            marginTop: 8,
          }}
        >
          Make sure there's an active search or a playing track.
        </Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={{ uri: track.largest_thumbnail || track.thumbnail || "" }}
      blurRadius={60}
      style={[styles.background, { backgroundColor: theme.background }]}
      resizeMode="cover"
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.coverWrap}>
          {!isEditor ? (
            // View Mode (just show image)
            <Image
              source={{ uri: track.largest_thumbnail }}
              style={styles.coverImage}
            />
          ) : (
            // Edit Mode (image + change button)
            <View style={{ alignItems: "center", position: "relative" }}>
              <TouchableOpacity
                style={styles.changeImageBtn}
                onPress={pickImage} // function that opens picker
              >
                <Text
                  style={{
                    color: theme.text,
                    position: "absolute",
                    zIndex: 100,
                    inset: 1,
                    textAlign: "center",
                    display: "grid",
                    placeContent: "center",
                    backgroundColor: HEXA(theme.backgroundSecondary, 0.4),
                    fontWeight: "bold",
                  }}
                >
                  Select Image
                </Text>
                <Image
                  source={{
                    uri: edits?.metadata
                      ?.thumbnail /* || track?.largest_thumbnail */,
                  }}
                  style={[
                    styles.coverImage,
                    styles.coverWrap,
                    {
                      border: "1px solid",
                      borderColor: theme.accent,
                      marginTop: 0,
                    },
                  ]}
                />
                <TouchableOpacity
                  style={[
                    {
                      postion: "absolute",
                      top: "-85%",
                      right: "-85%",
                      backgroundColor: HEXA(theme.textSecondary, 0.4),

                      width: 30,
                      height: 30,
                      zIndex: 200,
                      padding: 10,
                      borderRadius: 100,

                      display: "grid",
                      placeContent: "center",
                    },
                  ]}
                  onPress={() => {
                    setEdits((prev) => {
                      const edit = {
                        ...prev,
                        metadata: {
                          ...prev.metadata,
                          thumbnail: null,
                        },
                      };
                      saveEdits(edit);
                      return edit;
                    });
                  }}
                >
                  <Text
                    style={{
                      color: theme.text,
                      fontWeight: "bold",
                    }}
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {!isEditor ? (
          <Text style={[styles.title, { color: "white" }]} numberOfLines={2}>
            {he.decode(track.title || "Unknown")}
          </Text>
        ) : (
          <TextInput
            value={edits?.metadata?.title}
            onChangeText={(text) =>
              setEdits((prev) => {
                const edit = {
                  ...prev,
                  metadata: { ...prev.metadata, title: text },
                };

                saveEdits(edit);
                return edit;
              })
            }
            style={[
              styles.editTitle,
              {
                color: theme.text,
                backgroundColor: HEXA(theme.textSecondary, 0.4),
              },
            ]}
            placeholderTextColor={theme.textSecondary}
          />
        )}
        {!isEditor ? (
          <Text
            style={[
              styles.uploader,
              { color: themeMode === "dark" ? theme.textSecondary : "white" },
            ]}
          >
            {track.uploader}
          </Text>
        ) : (
          <TextInput
            value={edits?.metadata?.artist}
            onChangeText={(text) =>
              setEdits((prev) => {
                const edit = {
                  ...prev,
                  metadata: { ...prev.metadata, artist: text },
                };
                saveEdits(edit);
                return edit;
              })
            }
            style={[
              styles.editUploader,
              {
                color: theme.text,
                backgroundColor: HEXA(theme.textSecondary, 0.4),
              },
            ]}
            placeholderTextColor={theme.textSecondary}
          />
        )}

        <View style={[styles.playControls]}>
          <View
            style={[
              styles.playControl,
              { backgroundColor: HEXA(theme.textSecondary, 0.4) },
            ]}
          >
            <InlineMenu
              trigger={<SpeedIcon size={25} color={theme.text} />}
              options={[
                { label: "0.25x", onPress: () => {} },
                { label: "0.5x", onPress: () => {} },
                { label: "0.75x", onPress: () => {} },
                { label: "1x", onPress: () => {} },
                { label: "1.25x", onPress: () => {} },
                { label: "1.5x", onPress: () => {} },
                { label: "1.75x", onPress: () => {} },
                { label: "2x", onPress: () => {} },
              ]}
            />
          </View>
          <View
            style={[
              styles.playControl,
              { backgroundColor: HEXA(theme.textSecondary, 0.4) },
            ]}
          >
            <TouchableOpacity onPress={() => {}}>
              <DownloadIcon size={25} color={theme.text} />
            </TouchableOpacity>
          </View>
          <View
            style={[
              styles.playControl,
              { backgroundColor: HEXA(theme.textSecondary, 0.4) },
            ]}
          >
            <TouchableOpacity onPress={handleEdit}>
              <EditIcon size={25} color={theme.text} />
            </TouchableOpacity>
          </View>
          <View
            style={[
              styles.playControl,
              { backgroundColor: HEXA(theme.textSecondary, 0.4) },
            ]}
          >
            <InlineMenu
              trigger={<VolumeIcon size={25} color={theme.text} />}
              options={[
                { label: `${displayPercentage(0)}%`, onPress: () => {} },
                // { label: `${displayPercentage(0.5)}%`, onPress: () => {} },
                // { label: `${displayPercentage(1)}%`, onPress: () => {} },
                { label: `${displayPercentage(1.25)}%`, onPress: () => {} },
                // { label: `${displayPercentage(1.5)}%`, onPress: () => {} },
                // { label: `${displayPercentage(2)}%`, onPress: () => {} },
                { label: `${displayPercentage(2.5)}%`, onPress: () => {} },
                // { label: `${displayPercentage(3)}%`, onPress: () => {} },
                // { label: `${displayPercentage(3.5)}%`, onPress: () => {} },
                { label: `${displayPercentage(3.75)}%`, onPress: () => {} },
                // { label: `${displayPercentage(4)}%`, onPress: () => {} },
                // { label: `${displayPercentage(4.5)}%`, onPress: () => {} },
                { label: `${displayPercentage(5)}%`, onPress: () => {} },
              ]}
            />
          </View>
        </View>

        <View style={styles.seekRow}>
          <Text
            style={[
              styles.time,
              { color: themeMode === "dark" ? theme.textSecondary : "white" },
            ]}
          >
            {formatTime(
              isEditor
                ? edits?.trim?.start_time || loopStart
                : Math.round(
                    isNaN(trackDuration) ? 0 : pctFromCtx * trackDuration
                  )
            )}
          </Text>
          <View
            style={[
              {
                width: "100%",
                // border: "2px solid red",
                flex: 1,
                paddingHorizontal: 20,
              },
            ]}
          >
            {isEditor ? (
              <View
                onLayout={(e) => {
                  // measure client width of the container
                  const w = e.nativeEvent.layout.width;
                  // deduct horizontal padding you applied to container (if any)
                  // and optionally subtract thumb size so the thumbs don't overflow
                  const thumbSize = 16; // match your markerStyle width/height
                  const paddingHoriz = 0; // if you have container padding, subtract here
                  const effective = Math.max(
                    0,
                    Math.floor(w - paddingHoriz - thumbSize)
                  );
                  setMultiSliderWidth(effective);
                }}
                style={{
                  width: "100%",
                  // keep same styling you used before:
                  // border: "2px solid red",
                  flex: 1,
                  paddingHorizontal: 0,
                }}
              >
                {/* only render slider once we know a width */}
                {multiSliderWidth > 0 && (
                  <MultiSlider
                    values={[
                      edits?.trim?.start_time || loopStart,
                      edits?.trim?.end_time || loopEnd,
                    ]}
                    min={0}
                    max={track?.duration ?? 0}
                    step={1}
                    onValuesChange={(values) => {
                      setLoopStart(values[0]);
                      setLoopEnd(values[1]);

                      setEdits((prev) => {
                        const edit = {
                          ...prev,
                          trim: {
                            start_time: values[0],
                            end_time: values[1],
                          },
                          metadata: {
                            ...prev.metadata,
                          },
                        };
                        saveEdits(edit);
                        return edit;
                      });
                    }}
                    // IMPORTANT: sliderLength is the px width to draw the track
                    sliderLength={multiSliderWidth}
                    // styling: do NOT set width: "100%" here — irrelevant
                    selectedStyle={{
                      backgroundColor: theme.accent,
                      height: 5,
                    }}
                    unselectedStyle={{
                      backgroundColor: HEXA(
                        themeMode === "dark" ? theme.textSecondary : "#fff",
                        0.12
                      ),
                      height: 5,
                    }}
                    trackStyle={{
                      height: 5,
                      borderRadius: 10,
                      marginTop: -2.5,
                    }}
                    markerStyle={{
                      backgroundColor: theme.accent,
                      borderColor: theme.accent,
                      width: 16,
                      height: 16,
                      borderRadius: 16,
                    }}
                    allowOverlap={false}
                    snapped={false}
                    minMarkerOverlapDistance={16}
                  />
                )}
              </View>
            ) : (
              <SeekBar
                progressPct={pctFromCtx}
                duration={trackDuration}
                onSeek={(sec) => seek?.(sec)}
                accent={theme.accent}
                background={HEXA(
                  themeMode === "dark" ? theme.textSecondary : "#fff",
                  0.12
                )}
              />
            )}
          </View>

          <Text
            style={[
              styles.time,
              { color: themeMode === "dark" ? theme.textSecondary : "white" },
            ]}
          >
            {formatTime(
              isEditor
                ? edits?.trim?.end_time || loopEnd || trackDuration
                : Math.round(trackDuration)
            )}
          </Text>
        </View>

        <View style={[styles.controls]}>
          <TouchableOpacity
            style={[
              styles.queueControls,
              {
                padding: 10,
                backgroundColor: HEXA(theme.textSecondary, 0.4),
                borderRadius: 100,
              },
            ]}
            onPress={onChangeQueueCommand}
          >
            {queueCommands[queueCommandIndex]()}
          </TouchableOpacity>
          <View style={[styles.controls, { width: "auto", marginTop: 0 }]}>
            <TouchableOpacity
              onPress={() => {
                router.push(
                  `/player/${queue[currentIndex - 1]?.id}${
                    isEditor ? "?edit=true" : ""
                  }`
                );
                prev();
              }}
              style={{
                opacity: isEditor ? 0.5 : 1,
                cursor: isEditor ? "not-allowed" : "pointer",
              }}
              disabled={isEditor}
            >
              <PreviousIcon color={theme.accent} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={playPause}
              style={[
                styles.playBtn,
                {
                  backgroundColor: theme.accent,
                  opacity: isEditor ? 0.5 : 1,
                  cursor: isEditor ? "not-allowed" : "pointer",
                },
              ]}
              disabled={isEditor}
            >
              {isPlaying ? (
                <PauseIcon color="#fff" size={30} />
              ) : (
                <PlayIcon color="#fff" size={30} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                router.push(
                  `/player/${queue[currentIndex + 1]?.id}${
                    isEditor ? "?edit=true" : ""
                  }`
                );
                next();
              }}
              style={{
                opacity: isEditor ? 0.5 : 1,
                cursor: isEditor ? "not-allowed" : "pointer",
              }}
              disabled={isEditor}
            >
              <NextIcon color={theme.accent} />
            </TouchableOpacity>
          </View>
          <MoreIcon size={25} color={theme.text} />
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  fullCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  background: { flex: 1, paddingTop: 60 },
  scroll: { padding: 28, alignItems: "center", paddingBottom: 120 },
  headerRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerTitle: { fontSize: 16, fontWeight: "700" },

  coverWrap: {
    width: 320,
    height: 320,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 18,
  },
  coverImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    textAlign: "center",
    width: "100%",
  },
  uploader: { fontSize: 13, marginTop: 6 },
  editUploader: {
    fontSize: 13,
    marginTop: 10,
    padding: 5,
    textAlign: "center",
  },

  seekRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    gap: 12,
  },
  time: { width: 60, textAlign: "center", fontSize: 12 },

  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 28,
    marginTop: 30,
    width: "95%",
    // border: "2px solid red",
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  playControl: {
    // backgroundColor: "red",
    padding: 10,
    borderRadius: 100,
  },
  playControls: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    // border: "2px solid red",
    width: "80%",
    flexDirection: "row",
    marginVertical: 10,
  },
  editTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    textAlign: "center",
    width: "100%",
    padding: 5,
  },
});
