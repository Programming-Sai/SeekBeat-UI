import { transform } from "@babel/core";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { Image } from "react-native";
import formatTime from "../lib/utils";
import { HEXA } from "../lib/colors";
import { PauseIcon } from "./PauseIcon";
import { PreviousIcon } from "./PreviousIcon";
import { NextIcon } from "./NextIcon";

export default function MiniPlayer() {
  const playedSofar = 643;
  const { theme, accentColors, accentKey, themeMode } = useTheme();
  const song = {
    title:
      "LEADERS OF HISTORY RAP CYPHER | RUSTAGE ft. The Stupendium, Keyblade, TOPHAMHAT-KYO &amp; More",
    duration: 643,
    uploader: "RUSTAGE",
    thumbnail: "https://i.ytimg.com/vi/PEwy4U1OkBA/hqdefault.jpg",
    webpage_url: "https://www.youtube.com/watch?v=PEwy4U1OkBA",
    upload_date: "2025-06-21T23:45:01Z",
    largest_thumbnail: "https://i.ytimg.com/vi/PEwy4U1OkBA/hqdefault.jpg",
    smallest_thumbnail: "https://i.ytimg.com/vi/PEwy4U1OkBA/default.jpg",
  };
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundSecondary,
          borderTopColor: theme.accent,
        },
      ]}
    >
      <View style={[styles.miniPlayerContentBox]}>
        <View style={[styles.imgBox]}>
          <Image
            style={[styles.img]}
            source={{ uri: song.largest_thumbnail }}
          />
        </View>
        <View style={[styles.controlBox]}>
          <Text
            style={[
              {
                width: "100%",
                color: theme.text,
                fontSize: 12,
                textAlign: "center",
              },
            ]}
            numberOfLines={1}
          >
            {song?.title}
          </Text>
          <View style={[styles.controls, styles.flat]}>
            <TouchableOpacity>
              <PreviousIcon color={theme.accent} />
            </TouchableOpacity>
            <TouchableOpacity>
              <PauseIcon color={theme.accent} size={30} />
            </TouchableOpacity>
            <TouchableOpacity>
              <NextIcon color={theme.accent} />
            </TouchableOpacity>
          </View>
          <View style={[styles.seekers, styles.flat]}>
            <Text style={[{ color: theme.textSecondary, fontSize: 10 }]}>
              {formatTime(playedSofar)}
            </Text>
            <View
              style={[
                styles.progress,
                {
                  backgroundColor: HEXA(theme.textSecondary, 0.2),
                  //   borderWidth: 0.5,
                },
              ]}
            >
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${(playedSofar / song?.duration) * 100}%`,
                    backgroundColor: theme.accent,
                  },
                ]}
              >
                <Pressable
                  style={[
                    styles.progressThumb,
                    { backgroundColor: theme.accent },
                  ]}
                />
              </View>
            </View>
            <Text style={[{ color: theme.textSecondary, fontSize: 10 }]}>
              {formatTime(song?.duration)}
            </Text>
          </View>
        </View>
        {/* <View>Actions</View> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "58%",
    height: 100,
    position: "fixed",
    bottom: 0,
    transform: "translate(27.5%)",
    zIndex: 100,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 50,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderTopWidth: 1,
  },
  miniPlayerContentBox: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    width: "100%",
    gap: 20,
  },
  imgBox: {
    width: 70,
    height: 70,
  },
  img: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  flat: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
  },
  controlBox: {
    // border: "2px solid red"  ,
    display: "flex",
    width: "9   0%",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
  },
  controls: {
    gap: 20,
    width: "fit-content",
    // border: "2px solid red",
    transform: "translate(25%)",
  },
  seekers: {
    gap: 20,
    // border: "2px solid red",

    // width: "100%",
  },
  progress: {
    width: 550,
    height: 3,
    borderRadius: 100,
  },
  progressBar: {
    height: 3,
    borderRadius: 100,
    position: "relative",
  },
  progressThumb: {
    width: 15,
    height: 15,
    borderRadius: 100,
    position: "absolute",
    top: "-200%",
    right: 0,
    // cursor: "pointer",
  },
});
