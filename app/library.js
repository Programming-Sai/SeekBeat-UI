// app/library/index.jsx (or wherever)
import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useRightSidebar } from "../contexts/SidebarContext";

export default function Library() {
  const { setRightSidebarKey } = useRightSidebar();

  const { theme } = useTheme();

  useEffect(() => {
    setRightSidebarKey("library");
    return () => setRightSidebarKey(null);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme.background,
      }}
    >
      <Text style={{ color: theme.text }}>🎶 Your Music Library</Text>
    </View>
  );
}
