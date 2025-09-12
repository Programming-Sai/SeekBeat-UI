// components/SideBar.jsx
import React, { Children, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useRightSidebar } from "../contexts/SidebarContext";
import { HomeSideBar } from "./HomeSideBar";
import { PlayerSideBar } from "./PlayerSideBar";
import { useResponsive } from "../contexts/ResponsiveContext";
import BottomSheet from "./BottomSheetModal";
import { useAppStorage } from "../contexts/AppStorageContext";

export default function SideBar() {
  const { rightSidebarKey } = useRightSidebar();
  const { theme } = useTheme();
  const { isAtOrBelow } = useResponsive();
  const tabletAndBelow = isAtOrBelow("md", true);
  const {
    getSheetTab,
    setSheetTab,
    setMobileSheetVisible,
    getMobileSheetVisible,
  } = useAppStorage();

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
    home: () => <HomeSideBar tab={getSheetTab?.()} setTab={setSheetTab} />,
    player: () => <PlayerSideBar />,
    playerEdit: () => <PlayerSideBar edit={true} />,
  };

  // const [sheetVisible, setSheetVisible] = useState(true);

  const SidebarComponent = rightSidebarKey
    ? sidebarComponents[rightSidebarKey]
    : null;

  if (rightSidebarKey === "settings") return null;

  return tabletAndBelow ? (
    <BottomSheet
      theme={theme}
      visible={getMobileSheetVisible?.()}
      onClose={() => setMobileSheetVisible?.(false)}
      snapPoints={["90%"]}
    >
      {SidebarComponent && <SidebarComponent />}
    </BottomSheet>
  ) : (
    // </View>
    <View
      style={[
        tabletAndBelow ? styles.mobileContainer : styles.container,
        { backgroundColor: theme.backgroundSecondary },
      ]}
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
  resContainer: {},
});
