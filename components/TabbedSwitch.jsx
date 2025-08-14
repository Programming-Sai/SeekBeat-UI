import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { getPrimaryTextColor, HEXA } from "../lib/colors";
import Icon from "react-native-vector-icons/Ionicons";

export default function TabbedSwitch({
  viewMode,
  setViewMode,
  theme,
  themeMode,
  accent,
  accentLight,
  accentDark,
}) {
  console.log("TabbedSwitch", viewMode);
  return (
    <Pressable
      style={[
        styles.container,
        {
          backgroundColor:
            themeMode == "light" ? HEXA(accent, 0.4) : HEXA(accent, 0.2),
          border: `1px solid ${accent}`,
          justifyContent: viewMode ? "flex-end" : "flex-start",
        },
      ]}
      onPress={() => setViewMode()}
    >
      <View
        style={[
          styles.thumb,
          {
            backgroundColor: viewMode === "list" ? accentDark : "transparent",
          },
        ]}
      >
        <Icon
          size={25}
          color={
            themeMode === "dark"
              ? theme.text
              : viewMode === "list"
              ? getPrimaryTextColor(accentDark)
              : theme.text
          }
          name={"list"}
        />
      </View>
      <View
        style={[
          styles.thumb,
          {
            backgroundColor: viewMode === "grid" ? accentDark : "transparent",
          },
        ]}
      >
        <Icon
          size={20}
          color={
            themeMode === "dark"
              ? theme.text
              : viewMode === "grid"
              ? getPrimaryTextColor(accentDark)
              : theme.text
          }
          name={"grid"}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "fit-content",
    // height: 30,
    borderRadius: 100,
    display: "flex",
    // justifyContent: "flex-start",
    alignItems: "center",
    gap: 10,
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 5,
    cursor: "pointer",
  },
  thumb: {
    width: 30,
    height: 30,
    display: "grid",
    placeContent: "center",
    padding: 10,
    borderRadius: "100%",
  },
});
