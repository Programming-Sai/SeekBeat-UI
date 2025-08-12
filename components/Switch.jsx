import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { HEXA } from "../lib/colors";
export default function Switch({
  value,
  setValue,
  theme,
  accent,
  accentLight,
  accentDark,
}) {
  return (
    <Pressable
      style={[
        styles.container,
        {
          backgroundColor: value ? HEXA(accent, 0.4) : HEXA(accent, 0.2),
          border: `1px solid ${accent}`,
          justifyContent: value ? "flex-end" : "flex-start",
        },
      ]}
      onPress={() => setValue(!value)}
    >
      <View
        style={[
          styles.thumb,
          { backgroundColor: !value ? accentDark : accentLight },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 65,
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
    width: 25,
    height: 25,
    borderRadius: "100%",
  },
});
