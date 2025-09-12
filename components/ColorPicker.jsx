import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

export default function ColorPicker({
  colors,
  setColor,
  theme,
  tabletAndBelow,
}) {
  // console.log(colors);

  return (
    <View
      style={[
        styles.container,
        {
          flexDirection: tabletAndBelow ? "column" : "row",
          width: tabletAndBelow ? "auto" : "80%",
          marginVertical: tabletAndBelow ? 20 : 0,
          gap: tabletAndBelow ? 50 : "auto",
        },
      ]}
    >
      <View style={[styles.currentColor, { backgroundColor: theme.accent }]} />

      <View
        style={[
          styles.colorsContainer,
          {
            width: tabletAndBelow ? "100%" : "40%",
            justifyContent: tabletAndBelow ? "center" : "flex-start",
          },
        ]}
      >
        {colors.map((c) => (
          <Pressable
            title={c.key}
            key={c.key}
            onPress={() => setColor(c.key)} // pass the key, not the hex
            accessibilityLabel={`Choose ${c.key}`}
            style={[styles.color, { backgroundColor: c.base }]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  colorsContainer: {
    width: "40%",
    height: "fit-content",
    display: "flex",
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  color: {
    width: 40,
    height: 40,
    borderRadius: "100%",
  },
  currentColor: {
    width: 100,
    height: 100,
    borderRadius: "100%",
  },
});
