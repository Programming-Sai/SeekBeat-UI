// components/SideBar.jsx
import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useRightSidebar } from "../contexts/SidebarContext";
import { HomeSideBar } from "./HomeSideBar";
import { PlayerSideBar } from "./PlayerSideBar";
// import LibrarySidebar from "./sidebar/LibrarySidebar";
// import SettingsSidebar from "./sidebar/SettingsSidebar";

export default function SideBar() {
  const { rightSidebarKey } = useRightSidebar();
  const { theme } = useTheme();

  const sidebarComponents = {
    library: () => (
      <View style={{ padding: 16 }}>
        <Text style={{ color: theme.text, fontWeight: "600" }}>
          Library Side Bar Component
        </Text>
      </View>
    ),
    settings: () => (
      <View style={{ padding: 16 }}>
        <Text style={{ color: theme.text, fontWeight: "600" }}>
          Settings Side Bar Component
        </Text>
      </View>
    ),
    home: () => <HomeSideBar />,
    player: () => <PlayerSideBar />,
    playerEdit: () => <PlayerSideBar edit={true} />,
  };

  const SidebarComponent = rightSidebarKey
    ? sidebarComponents[rightSidebarKey]
    : null;

  if (rightSidebarKey === "settings") return null;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}
    >
      {SidebarComponent && <SidebarComponent />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    flexDirection: "column",
    gap: 20,
    width: "25%",
    paddingTop: 30,
    position: "relative",
  },
});
