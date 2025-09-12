// app/player/[id].js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useRightSidebar } from "../../contexts/SidebarContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useSearch } from "../../contexts/SearchContext";
import { usePlayer } from "../../contexts/PlayerContext";
import he from "he";
import formatTime, { timeAgo } from "../../lib/utils";
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
import { OpenIcon } from "../../components/OpenIcon";
import Toast from "react-native-toast-message";
import { useDownloader } from "../../contexts/DownloaderContext";
import Thumb from "../../components/Thumb";
import { MutedIcon } from "../../components/MutedIcon";
import { useResponsive } from "../../contexts/ResponsiveContext";

/**
 * Full Player Page (fixed hook ordering)
 */
export default function PlayerPage() {
  const { id, edit } = useLocalSearchParams();
  const { isAtOrBelow } = useResponsive();
  const tabletAndBelow = isAtOrBelow("md", true);

  // const { id } = useLocalSearchParams();
  // const { edit } = useLocalSearchParams();
  const router = useRouter();
  const lastRequestedIndexRef = useRef(null);
  // const params = new URLSearchParams(searchParams);

  const loadQueueCommandIndex = () => {
    const stored = localStorage.getItem("@seekbeat:queueCommandIndex");
    return stored ? JSON.parse(stored) : null;
  };

  const saveQueueCommandIndex = (index) => {
    localStorage.setItem("@seekbeat:queueCommandIndex", JSON.stringify(index));
  };

  let potentialCommandIndex = loadQueueCommandIndex();
  if (potentialCommandIndex === null) {
    saveQueueCommandIndex(0);
    potentialCommandIndex = loadQueueCommandIndex();
  }

  const [queueCommandIndex, setQueueCommandIndex] = useState(
    potentialCommandIndex
  );

  // call all hooks unconditionally (important!)
  const rightSidebarCtx = useRightSidebar();
  const themeCtx = useTheme();
  const searchCtx = useSearch();
  const player = usePlayer();
  const appStorage = useAppStorage();

  // safe destructuring / fallbacks
  const { setRightSidebarKey } = rightSidebarCtx ?? {};
  const { theme, themeMode, accentColors, accentKey } = themeCtx ?? {
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
  const { getLastSearch, getDownloadStatus } = appStorage ?? {};

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
    shuffle,
    setShuffle,
    setRepeatMode,
    repeatMode,
    isEditor,
    setIsEditor,
    setIsPlaying,
    setVolumeValue,
    loadingStream,
    isBuffering,
    setPlaybackRate,
    volumeValue,
    playbackRate,
    _streamCache,
  } = player;

  // sync URL -> player context once (use URL as source of truth)
  useEffect(() => {
    // compute new value from URL param
    const newIsEditor = edit === "true";

    // update player context once, based on URL
    setIsEditor(newIsEditor);

    // if entering editor mode, pause; if leaving, resume (or your desired behaviour)
    if (newIsEditor) {
      player.pause();
    }
    // console.log("STREAMING CACHE: ", _streamCache());
  }, [edit, setIsEditor]);

  const queueCommands = [
    {
      icon: () => {
        return <PlayInOrder size={25} color={theme.text} />;
      },
      func: () => {
        setShuffle(false);
        setRepeatMode("none");
      },
    },
    {
      icon: () => {
        return <ShuffleIcon size={25} color={theme.text} />;
      },
      func: () => {
        setShuffle(true);
        setRepeatMode("none");
      },
    },
    {
      icon: () => {
        return <RepeatAllIcon size={25} color={theme.text} />;
      },
      func: () => {
        setShuffle(false);
        setRepeatMode("all");
      },
    },
    {
      icon: () => {
        return <RepeatOneIcon size={25} color={theme.text} />;
      },
      func: () => {
        setShuffle(false);
        setRepeatMode("one");
      },
    },
  ];

  // apply persisted queue command behaviour on mount / when index changes
  useEffect(() => {
    // only apply if the function exists
    const fn = queueCommands[queueCommandIndex]?.func;
    if (typeof fn === "function") fn();
    // run when queueCommandIndex changes (and when setShuffle/setRepeatMode become available)
  }, [queueCommandIndex, queueCommands]);

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
  // helper to get the song key from a queue item (same logic as context)
  const keyForItem = (item) => item?.id ?? item?.webpage_url ?? null;

  // small ref so we don't re-request same index while loading

  // console.log("What is FoundIndex: ", id, edit, foundIndex);

  // Refs to avoid repeated handling
  const lastRequestedKeyRef = lastRequestedIndexRef; // existing
  const lastHandledKeyRef = useRef(null);
  const pendingIndexRef = useRef(null);

  // Sync URL -> player (compute foundIndex inside the effect and run only when id or queue length changes)
  useEffect(() => {
    if (!id) return;

    const q = Array.isArray(queue) ? queue : [];
    const idx = q.findIndex(
      (s) => s?.id === id || (s?.webpage_url && s.webpage_url.includes(id))
    );

    if (idx < 0) return;

    const item = q[idx] ?? null;
    const foundKey = keyForItem(item) || id;
    if (!foundKey) return;

    if (lastHandledKeyRef.current === foundKey) return;

    // current playing key (if any)
    const currentItem =
      Array.isArray(queue) && typeof player?.currentIndex === "number"
        ? queue[player.currentIndex] ?? null
        : null;
    const currentKey = keyForItem(currentItem);

    if (currentKey === foundKey && !player?.loadingStream) {
      lastRequestedKeyRef.current = foundKey;
      lastHandledKeyRef.current = foundKey;
      return;
    }

    // Update UI index immediately
    setCurrentIndex?.(idx);

    // Mark requested key and set pending index
    lastRequestedKeyRef.current = foundKey;
    pendingIndexRef.current = idx;

    // Ask player to prepare this index (don't force play)
    (async () => {
      try {
        if (player && typeof player.playIndex === "function") {
          await player.playIndex(idx);
        }
        // Loaded/prepared: clear pending; mark handled
        pendingIndexRef.current = null;
        lastHandledKeyRef.current = foundKey;
      } catch (err) {
        console.warn("URL->player sync: playIndex failed", err);
        // avoid infinite retry loop — mark handled so effect won't keep reprocessing
        pendingIndexRef.current = null;
        lastHandledKeyRef.current = foundKey;
      }
    })();
  }, [id, Array.isArray(queue) ? queue.length : 0]);

  const handlePlayPress = async () => {
    try {
      // Determine the desired index to play:
      // prefer the foundIndex (URL), fall back to currentIndex
      const desiredIdx =
        typeof foundIndex === "number" && foundIndex >= 0
          ? foundIndex
          : typeof currentIndex === "number"
          ? currentIndex
          : null;

      // If nothing meaningful, just toggle
      if (desiredIdx == null) {
        playPause?.();
        return;
      }

      // If player is already at that index and ready, just toggle play/pause
      const currentItem =
        Array.isArray(queue) && typeof player?.currentIndex === "number"
          ? queue[player.currentIndex] ?? null
          : null;
      const currentKey = keyForItem(currentItem);
      const desiredItem = Array.isArray(queue) ? queue[desiredIdx] : null;
      const desiredKey = keyForItem(desiredItem);

      // If the desired and current keys match and player not loading: toggle
      if (currentKey === desiredKey && !player?.loadingStream) {
        playPause?.();
        return;
      }

      // If we have a pending prepare for the desired index, wait for it
      if (pendingIndexRef.current === desiredIdx) {
        // wait until pending clears (poll with small timeout)
        const start = Date.now();
        while (
          pendingIndexRef.current === desiredIdx &&
          Date.now() - start < 3000
        ) {
          // small sleep
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 50));
        }
        // then toggle play (player should be ready)
        playPause?.();
        return;
      }

      // Otherwise, ensure the player prepares the desired index then play
      lastRequestedKeyRef.current = desiredKey;
      pendingIndexRef.current = desiredIdx;

      if (player && typeof player.playIndex === "function") {
        await player.playIndex(desiredIdx);
      } else {
        // Make sure context's current index reflects desired
        setCurrentIndex?.(desiredIdx);
      }
      pendingIndexRef.current = null;

      // Start playback (best-effort)
      if (player && typeof player.play === "function") {
        try {
          await player.play();
        } catch (e) {
          // fallback: flip the isPlaying flag
          setIsPlaying?.(true);
        }
      } else {
        // If play() isn't available, toggle via playPause
        playPause?.();
      }
    } catch (err) {
      console.warn("handlePlayPress error", err);
      // fallback to normal toggle
      playPause?.();
    }
  };

  // pick track from found or player
  const track = found || currentTrackSafe || null;

  // pure derived value — no side effects inside render
  const trackDuration = useMemo(() => {
    const n = Number(durationSafe ?? track?.duration ?? 0);
    return Number.isFinite(n) ? n : 0;
  }, [durationSafe, track?.duration]);

  // sync the provider state from an effect (side-effect area)
  useEffect(() => {
    if (!player || !track) return;
    // only set when a concrete duration is available (avoid no-op spam)
    if (typeof track?.duration === "number") {
      player.setDuration?.(track.duration);
    } else if (typeof durationSafe === "number") {
      player.setDuration?.(durationSafe);
    }
    // only run when track changes or when provider reference changes
  }, [player, track, durationSafe]);

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
    const newIndex = (queueCommandIndex + 1) % queueCommands.length;
    saveQueueCommandIndex(newIndex);
    setQueueCommandIndex(newIndex);
    queueCommands[newIndex]?.func?.();
  };

  useEffect(() => {
    console.log("🔄 ID actually changed:", id);
  }, [id]);

  const [thumbState, setThumbState] = useState({
    left: 0,
    size: 16,
    color: "#1DB954",
    panHandlers: {},
  });

  useEffect(() => {
    console.log("🎯 FoundIndex recalculated:", foundIndex);
  }, [foundIndex]);

  const handleEdit = () => {
    const newIsEditor = !isEditor;

    if (newIsEditor) {
      // Add ?edit=true
      router.push(`/player/${id}?edit=true`);
    } else {
      // Remove ?edit
      router.push(`/player/${id}`, undefined, { shallow: true });
    }
    console.log("Pushing to this id: ", id);

    setIsEditor(newIsEditor);
  };
  const [multiSliderWidth, setMultiSliderWidth] = useState(0);

  const loadEdits = () => {
    const stored = localStorage.getItem("@seekbeat:edits");
    return stored ? JSON.parse(stored) : null;
  };

  const potentialEdits = loadEdits();

  const [edits, setEdits] = useState(
    (track?.webpage_url === potentialEdits?.metadata?.url &&
      potentialEdits) || {
      speed: playbackRate,
      trim: { start_time: 0, end_time: track?.duration },
      volume: volumeValue,
      metadata: {
        title: track?.title,
        artist: track?.uploader,
        // album: track?.uploader,
        date: track?.upload_date,
        // genre: "Good Shit",
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
    console.log("Saving: ", edits);
    localStorage.setItem("@seekbeat:edits", JSON.stringify(edits));
  };

  const clearEdits = () => {
    localStorage.removeItem("@seekbeat:edits");
  };

  const computeNextIndexForUI = () => {
    if (!Array.isArray(queue) || queue.length === 0) return null;

    if (shuffle && queue.length > 1) {
      // choose a random different index
      let nextIdx;
      do {
        nextIdx = Math.floor(Math.random() * queue.length);
      } while (nextIdx === currentIndex);
      return nextIdx;
    }

    // normal forward
    if (currentIndex + 1 >= queue.length) {
      if (repeatMode === "all") return 0;
      return null; // no next
    }
    return currentIndex + 1;
  };

  const { download } = useDownloader();
  const status = getDownloadStatus(track?.id);

  const onDownload = useCallback(async () => {
    if (!track) return;
    const id = track?.id ?? track?.webpage_url;

    // // prevent duplicate clicks
    if (status === "pending") return;

    // optional immediate toast
    Toast.show({
      type: "info",
      position: "top",
      text1: "Preparing download",
      text2: `${track.title} — preparing...`,
      visibilityTime: 2000,
      autoHide: true,
    });

    try {
      const { filename } = await download(track, null, edits);
      Toast.show({
        type: "success",
        position: "top",
        text1: "Download complete",
        text2: filename ?? track.title,
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
      console.warn(String(err));
    }
  }, [track, status, download, edits]);

  // Helper: apply an edits patch only when allowed, merge & persist properly
  const applyEditsIfAllowed = (patchOrUpdater) => {
    // only apply if in editor mode OR user chose to have downloads follow playback settings
    if (!isEditor && !appStorage?.downloadUsePlaybackSettings) return;

    setEdits((prev) => {
      // compute merged edits (support function or object)
      const merged =
        typeof patchOrUpdater === "function"
          ? patchOrUpdater(prev)
          : { ...prev, ...patchOrUpdater };

      // ensure metadata exists and contains track url (so saved edits are associated with the track)
      const mergedWithUrl = {
        ...merged,
        metadata: {
          ...(merged.metadata || {}),
          url: track?.webpage_url ?? merged?.metadata?.url ?? null,
        },
      };

      // persist using your existing saver
      try {
        saveEdits(mergedWithUrl);
      } catch (err) {
        console.warn("saveEdits failed", err);
      }

      return mergedWithUrl;
    });
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
      style={[
        styles.background,
        { backgroundColor: theme.background, flex: 1 },
      ]}
      resizeMode="cover"
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            backgroundColor: HEXA(theme.background, 0.5),
            height: "100%",
            paddingVertical: 100,
            paddingBottom: 800,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.coverWrap,
            {
              position: "relative",
              width: tabletAndBelow ? 200 : 320,
              height: tabletAndBelow ? 200 : 320,
            },
          ]}
        >
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
                    uri: edits?.metadata?.thumbnail || track?.largest_thumbnail,
                  }}
                  style={[
                    styles.coverImage,
                    // styles.coverWrap,
                    {
                      border: "1px solid",
                      borderColor: theme.accent,
                      marginTop: 0,
                      width: tabletAndBelow ? 200 : 320,
                      height: tabletAndBelow ? 200 : 320,
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
          {(isBuffering || loadingStream) && (
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
              <ActivityIndicator
                size={100}
                color={theme.text}
                // color={accentColors[accentKey].dark}
              />
            </View>
          )}
        </View>

        {!isEditor ? (
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
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
                width: "90%",
              },
            ]}
            placeholderTextColor={theme.textSecondary}
          />
        )}
        {!isEditor ? (
          <Text
            style={[
              styles.uploader,
              {
                color: theme.textSecondary,
                fontWeight: "bold",
              },
            ]}
          >
            {track.uploader}
            {"  "} ● {"  "}
            {timeAgo(track.upload_date)}
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
              currentValue={`${
                appStorage?.downloadUsePlaybackSettings
                  ? edits?.speed
                  : isEditor
                  ? edits?.speed
                  : playbackRate
              }x`}
              options={[
                {
                  label: "0.25x",
                  onPress: () => {
                    setPlaybackRate(0.25);
                    applyEditsIfAllowed({ speed: 0.25 });
                  },
                },
                {
                  label: "0.5x",
                  onPress: () => {
                    setPlaybackRate(0.5);
                    applyEditsIfAllowed({ speed: 0.5 });
                  },
                },
                {
                  label: "0.75x",
                  onPress: () => {
                    setPlaybackRate(0.75);
                    applyEditsIfAllowed({ speed: 0.75 });
                  },
                },
                {
                  label: "1x",
                  onPress: () => {
                    setPlaybackRate(1);
                    applyEditsIfAllowed({ speed: 1 });
                  },
                },
                {
                  label: "1.25x",
                  onPress: () => {
                    setPlaybackRate(1.25);
                    applyEditsIfAllowed({ speed: 1.25 });
                  },
                },
                {
                  label: "1.5x",
                  onPress: () => {
                    setPlaybackRate(1.5);
                    applyEditsIfAllowed({ speed: 1.5 });
                  },
                },
                {
                  label: "1.75x",
                  onPress: () => {
                    setPlaybackRate(1.75);
                    applyEditsIfAllowed({ speed: 1.75 });
                  },
                },
                {
                  label: "2x",
                  onPress: () => {
                    setPlaybackRate(2);
                    applyEditsIfAllowed({ speed: 2 });
                  },
                },
              ]}
            />
          </View>
          <View
            style={[
              styles.playControl,
              { backgroundColor: HEXA(theme.textSecondary, 0.4) },
            ]}
          >
            <TouchableOpacity
              onPress={onDownload}
              disabled={status === "pending"}
            >
              {status === "pending" ? (
                <ActivityIndicator color={theme.background} />
              ) : (
                <DownloadIcon size={25} color={theme.text} />
              )}
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
              trigger={
                volumeValue === 0 ? (
                  <MutedIcon size={25} color={theme.text} />
                ) : (
                  <VolumeIcon size={25} color={theme.text} />
                )
              }
              currentValue={`${displayPercentage(
                appStorage?.downloadUsePlaybackSettings
                  ? edits?.volume
                  : isEditor
                  ? edits?.volume
                  : volumeValue
              )}%`}
              options={[
                {
                  label: `${displayPercentage(0)}%`,
                  onPress: () => {
                    setVolumeValue(0 / 5);
                    applyEditsIfAllowed({ volume: 0 });
                  },
                },
                {
                  label: `${displayPercentage(1.25)}%`,
                  onPress: () => {
                    setVolumeValue(1.25 / 5);
                    applyEditsIfAllowed({ volume: 1.25 });
                  },
                },
                {
                  label: `${displayPercentage(2.5)}%`,
                  onPress: () => {
                    setVolumeValue(2.5 / 5);
                    applyEditsIfAllowed({ volume: 2.5 });
                  },
                },
                {
                  label: `${displayPercentage(3.75)}%`,
                  onPress: () => {
                    setVolumeValue(3.75 / 5);
                    applyEditsIfAllowed({ volume: 3.75 });
                  },
                },
                {
                  label: `${displayPercentage(5)}%`,
                  onPress: () => {
                    setVolumeValue(5 / 5);
                    applyEditsIfAllowed({ volume: 5 });
                  },
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.seekRow}>
          <Text style={[styles.time, { color: theme.textSecondary }]}>
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
                  position: "relative",
                  // paddingRight: -50,
                }}
              >
                <View
                  style={[
                    {
                      position: "absolute",
                      inset: 0,
                      top: "18.5%",
                      // zIndex: -1,
                    },
                  ]}
                >
                  <SeekBar
                    progressPct={pctFromCtx}
                    duration={trackDuration}
                    onSeek={(sec) => seek?.(sec)}
                    accent={theme.accent}
                    background={HEXA(theme.textSecondary, 0.3)}
                    width={multiSliderWidth}
                    start={edits?.trim?.start_time || loopStart}
                    end={edits?.trim?.end_time || loopEnd}
                    thumbSize={20}
                    setThumbState={setThumbState}
                    splitThumb={true}
                  />
                </View>

                {/* only render slider once we know a width */}
                {multiSliderWidth > 0 && (
                  <MultiSlider
                    values={[
                      edits?.trim?.start_time || loopStart,
                      edits?.trim?.end_time || loopEnd,
                      // loopEnd,
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
                      backgroundColor: HEXA(theme.accent, 0.1),
                      height: 6,
                    }}
                    unselectedStyle={{
                      backgroundColor: HEXA(
                        themeMode === "dark" ? theme.textSecondary : "#fff",
                        0.3
                      ),
                      height: 6,
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
                      // zIndex: 200,
                    }}
                    allowOverlap={false}
                    snapped={false}
                    minMarkerOverlapDistance={16}
                  />
                )}

                {/* IMPORTANT: Overlay that *receives* pan handlers from SeekBar.
      It must come AFTER MultiSlider so it can capture touches when needed,
      but we use pointerEvents carefully so it doesn't block everything. */}
                <View
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: "43.9%", // match SeekBar vertical placement
                    height: 30, // same height as SeekBar container
                    zIndex: -1, // above MultiSlider visually for handlers
                  }}
                  pointerEvents="box-none"
                >
                  {/* full-width invisible capture area — it will receive touches only where the inner view is present */}
                  <View
                    // Spread the handlers SeekBar exposed via setThumbState
                    {...(thumbState?.panHandlers || {})}
                    style={{
                      position: "absolute",
                      left: 0,
                      width: multiSliderWidth || "100%",
                      // height: 100,
                      height: 5,
                      backgroundColor: "rgba(255,0,0,0)", // debug visual
                    }}
                    pointerEvents="auto" // this inner view will receive pointer events along the track
                  />
                </View>

                <View
                  style={{ position: "absolute", inset: 0, top: "0%" }}
                  pointerEvents="box-none"
                >
                  <Thumb
                    {...thumbState}
                    currentValue={Math.round(
                      isNaN(trackDuration) ? 0 : pctFromCtx * trackDuration
                    )}
                    textColor={theme.text}
                    tooltipColor={"grey"}
                    // tooltipColor={HEXA(theme.textSecondary, 0.3)}
                  />
                </View>
              </View>
            ) : (
              <SeekBar
                progressPct={pctFromCtx}
                duration={trackDuration}
                onSeek={(sec) => seek?.(sec)}
                accent={theme.accent}
                background={HEXA(theme.textSecondary, 0.3)}
              />
            )}
          </View>

          <Text style={[styles.time, { color: theme.textSecondary }]}>
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
            {queueCommands[queueCommandIndex]?.icon()}
          </TouchableOpacity>
          <View style={[styles.controls, { width: "auto", marginTop: 0 }]}>
            <TouchableOpacity
              onPress={() => {
                if (currentIndex > 0) {
                  router.push(
                    `/player/${queue[currentIndex - 1]?.id}${
                      isEditor ? "?edit=true" : ""
                    }`
                  );
                }
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
              onPress={handlePlayPress}
              style={[
                styles.playBtn,
                {
                  backgroundColor: theme.accent,
                  // opacity: isEditor ? 0.5 : 1,
                  // cursor: isEditor ? "not-allowed" : "pointer",
                },
              ]}
              // disabled={isEditor}
            >
              {isPlaying ? (
                <PauseIcon color="#fff" size={30} />
              ) : (
                <PlayIcon color="#fff" size={30} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                next(true);
              }}
              style={{
                opacity: isEditor || computeNextIndexForUI() === null ? 0.5 : 1,
                cursor:
                  isEditor || computeNextIndexForUI() === null
                    ? "not-allowed"
                    : "pointer",
              }}
              disabled={isEditor || computeNextIndexForUI() === null}
            >
              <NextIcon color={theme.accent} />
            </TouchableOpacity>
          </View>
          <Link
            style={[
              styles.queueControls,
              {
                padding: 10,
                backgroundColor: HEXA(theme.textSecondary, 0.4),
                borderRadius: 100,
              },
            ]}
            href={track?.webpage_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <OpenIcon size={25} color={theme.text} />
          </Link>
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
  scroll: { paddin: 28, alignItems: "center", paddingBottom: 100 },
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
