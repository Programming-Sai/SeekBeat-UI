import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

export default function ColorPicker({ colors, setColor, theme }) {
  // console.log(colors);

  return (
    <View style={[styles.container]}>
      <View style={[styles.currentColor, { backgroundColor: theme.accent }]} />

      <View style={[styles.colorsContainer]}>
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
    width: "80%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
  },
  colorsContainer: {
    width: "40%",
    height: "fit-content",
    display: "flex",
    justifyContent: "flex-start",
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
