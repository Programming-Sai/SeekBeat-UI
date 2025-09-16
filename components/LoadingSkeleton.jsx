import React from "react";
import { Skeleton } from "./Skeleton";
import { useTheme } from "../contexts/ThemeContext";
import { HEXA } from "../lib/colors";
import { View } from "react-native";

export default function LoadingSkeleton({
  viewMode,
  displayType,
  tabletAndBelow,
}) {
  const { theme, themeMode, accentKey, accentColors } = useTheme();

  return (
    <View
      style={[
        displayType === "bulk"
          ? {
              justifyContent: "space-between",
              alignItems: "center",
              flexDirection: "column",
            }
          : viewMode === "list"
          ? {
              justifyContent: "space-between",
              alignItems: "center",
              flexDirection: "column",
            }
          : {
              justifyContent: "center",
              alignItems: "flex-start",
              flexDirection: "row",
              flexWrap: "wrap",
            },
        { width: "100%", display: "flex", gap: 30 },
      ]}
    >
      {Array.from({ length: displayType === "bulk" ? 3 : 6 }).map((_, id) => (
        <Skeleton
          key={id}
          backgroundColor={HEXA(theme.accent, 0.1)}
          highlightColor={HEXA(
            themeMode === "dark"
              ? accentColors[accentKey].light
              : accentColors[accentKey].dark,
            0.3
          )}
          width={
            displayType === "bulk"
              ? tabletAndBelow
                ? "90%"
                : 800
              : viewMode === "list"
              ? tabletAndBelow
                ? "90%"
                : 800
              : 250
          }
          height={
            displayType === "bulk"
              ? 50
              : viewMode === "list"
              ? tabletAndBelow
                ? 150
                : 210
              : 380
          }
          borderRadius={10}
        />
      ))}
    </View>
  );
}
