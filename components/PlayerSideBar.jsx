import React from "react";
import { Text, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";

export default function PlayerSideBar() {
  const { theme } = useTheme();
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ color: theme.text, fontWeight: "600" }}>
        Player Side Bar Component
      </Text>
    </View>
  );
}
