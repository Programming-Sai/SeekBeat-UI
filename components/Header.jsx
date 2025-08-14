import { Link } from "expo-router";
import { StyleSheet } from "react-native";
import {
  Image,
  Text,
  TextInput,
  View,
  Pressable,
  Animated,
} from "react-native-web";
import { useTheme } from "../contexts/ThemeContext";
import { HEXA, RGBA } from "../lib/colors";
import React, { useState, useRef } from "react";
import Icon from "react-native-vector-icons/Ionicons";
import BulkSearchInput from "./BulkSearchInput";

export default function Header() {
  const { theme, toggleTheme, themeMode, accentColors, accentKey } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [hidden, setHidden] = useState(false);
  const [focused, setFocused] = useState(false);

  const onPress = () => {
    // Reset hidden to false, so element is on top at start
    setHidden(false);

    // Animate scale up
    Animated.timing(scaleAnim, {
      toValue: 9000, // huge scale up
      duration: 700,
      useNativeDriver: true,
    }).start(() => {
      // After animation ends, hide element behind by setting zIndex
      setHidden(true);

      // Reset scale for next time (optional)
      scaleAnim.setValue(1);
      toggleTheme();
    });
  };

  return (
    <View
      style={[styles.container, { backgroundColor: RGBA(theme.text, 0.1) }]}
    >
      <View>
        <Link href="/">
          <Image
            style={[
              styles.image,
              {
                tintColor:
                  themeMode === "dark"
                    ? accentColors[accentKey].light
                    : accentColors[accentKey].dark,
              },
            ]}
            source={require("../assets/icon.png")}
          />
        </Link>
      </View>
      <View>
        {/* <TextInput
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.searchInput,
            {
              color: theme.text,
              backgroundColor: RGBA(theme.background, 1),
              border: "1px solid " + RGBA(accentColors[accentKey].dark, 0.5),
            },
            focused && {
              borderColor: accentColors[accentKey].dark, // your gold color
              boxShadow: `0 0 6px ${accentColors[accentKey].dark}`, // glow effect
              outlineWidth: 0,
            },
          ]}
          placeholderTextColor={theme.textSecondary}
          placeholder="Search ..."
        /> */}
        <View style={styles.searchInput}>
          <BulkSearchInput />
        </View>
      </View>
      <View style={styles.themeToggleBox}>
        <Pressable
          onPress={onPress}
          style={[
            styles.theme,
            {
              border: `1px solid ${accentColors[accentKey].dark}`,
              backgroundColor: HEXA(accentColors[accentKey].dark, 0.3),
            },
          ]}
        >
          {themeMode === "light" ? (
            <Icon key="sun" name="sunny" size={20} color={theme.text} />
          ) : (
            <Icon key="moon" name="moon" size={20} color={theme.text} />
          )}
        </Pressable>

        <Animated.View
          style={[
            {
              backgroundColor: HEXA(theme.text, 1),
              width: "3px",
              height: "3px",
              position: "absolute",
              top: 12,
              right: 12,
              borderRadius: 100,
              transform: [{ scale: scaleAnim }],
              zIndex: hidden ? -100 : 10,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 60, // number, not string
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 20, // horizontal padding only
    position: "absolute", // works better than fixed for RN + web
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999, // keep on top
    backdropFilter: "blur(10px)", // Glassmorphism blur (web only)
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  image: {
    width: 40,
    height: 40,
  },
  searchInput: {
    height: 40,
    width: "70vh",
    borderRadius: 20,
    bordorWidth: 0,
    boxShadow: "none",
    outlineWidth: 0, // remove outline
    boxShadow: "none",
    marginTop: -8,
  },
  themeToggleBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    width: "fit-content",
    borderRadius: 100,
    gap: 10,
    padding: 2,
  },
  theme: {
    width: 30,
    height: 30,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 100,
    zIndex: 20,
  },
  themeIcon: {
    fontSize: 15,
    fontWeight: "condensedBold",
  },
});
