import { Link, usePathname } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { HEXA } from "../lib/colors";

// icon components (ensure they are default exports or adjust imports)
import { HomeIcon } from "./HomeIcon";
import { HomeBoldIcon } from "./HomeBoldIcon";
import { LibraryIcon } from "./LibraryIcon";
import { LibraryBoldIcon } from "./LibraryBoldIcon";
import { LanIcon } from "./LanIcon";
import { LanBoldIcon } from "./LanBoldIcon";
import { SettingsIcon } from "./SettingsIcon";
import { SettingsBoldIcon } from "./SettingsBoldIcon";
import { useResponsive } from "../contexts/ResponsiveContext";
import { DownloadIcon } from "./DownloadIcon";
import { HistoryIcon } from "./HistoryIcon";
import { useAppStorage } from "../contexts/AppStorageContext";
import { PlayListIcon } from "./PlayListIcon";

export default function NavBar() {
  const { theme, themeMode, accentColors, accentKey } = useTheme();
  const pathname = usePathname();
  const { setSheetTab, setMobileSheetVisible } = useAppStorage();
  const { isAtOrBelow, isAtOrAbove } = useResponsive();
  const tabletAndBelow = isAtOrBelow("md", true);
  const showMobileSheets = tabletAndBelow && pathname === "/";

  const pages = [
    { pageName: "Home", pageLink: "/", Icon: HomeIcon, IconBold: HomeBoldIcon },
    showMobileSheets && {
      pageName: "Downloads",
      func: () => {
        setSheetTab("downloads");
        setMobileSheetVisible(true);
      },
      Icon: DownloadIcon,
      IconBold: DownloadIcon,
    },
    showMobileSheets && {
      pageName: "History",
      func: () => {
        setSheetTab("history");
        setMobileSheetVisible(true);
      },
      Icon: HistoryIcon,
      IconBold: HistoryIcon,
    },
    tabletAndBelow &&
      pathname?.includes("/player/") && {
        pageName: "Playlist",
        func: () => {
          // setSheetTab("history");
          setMobileSheetVisible(true);
        },
        Icon: PlayListIcon,
        IconBold: PlayListIcon,
      },
    {
      pageName: "Settings",
      pageLink: "/settings",
      Icon: SettingsIcon,
      IconBold: SettingsBoldIcon,
    },
  ].filter(Boolean);

  return (
    <View
      style={[
        ,
        { backgroundColor: theme.backgroundSecondary },
        tabletAndBelow && { borderColor: theme.accent },
        tabletAndBelow ? styles.resContainer : styles.container,
      ]}
    >
      {/* <LibraryIcon color={theme.text} /> */}
      {pages.map((page, i) => {
        const isActive =
          pathname === page.pageLink ||
          (page.pageLink !== "/" && pathname?.startsWith(page.pageLink));
        const IconComp = isActive ? page.IconBold ?? page.Icon : page.Icon;
        const color =
          themeMode === "dark"
            ? accentColors[accentKey].light
            : accentColors[accentKey].dark;

        return (
          <Link
            href={page?.pageLink || "#"}
            style={{
              width: tabletAndBelow ? "fit-content" : "100%",
              borderRightColor: !tabletAndBelow ? theme.accent : "transparent",
              borderRightWidth: !tabletAndBelow && isActive ? 5 : 0,
              margin: tabletAndBelow ? 10 : 0,
            }}
            key={page.pageName}
            title={page.pageName}
          >
            <Pressable
              onPress={() => {
                // call the page.func only when pressed
                if (typeof page?.func === "function") page.func();
              }}
              style={({ hovered, pressed }) => [
                tabletAndBelow ? styles.resNavLinkBox : styles.navLinkBox,
                {
                  backgroundColor: isActive
                    ? HEXA(theme.accent, 0.2)
                    : !tabletAndBelow
                    ? HEXA(theme.accent, themeMode === "light" ? 0.1 : 0.05)
                    : "transparent",
                },

                hovered && { backgroundColor: HEXA(theme.accent, 0.2) },
              ]}
            >
              <IconComp color={color} size={tabletAndBelow ? 30 : 18} />
              {!tabletAndBelow && (
                <Text
                  style={[
                    styles.buttonText,
                    {
                      color: color,
                      fontWeight: isActive ? "bold" : "normal",
                    },
                    tabletAndBelow && { fontSize: 10 },
                  ]}
                >
                  {page.pageName}
                </Text>
              )}
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    flexDirection: "column",
    gap: 20,
    width: "15%",
    paddingTop: 30,
  },
  resContainer: {
    position: "fixed",
    bottom: 0,
    zIndex: 100,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
  },
  resNavLinkBox: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    gap: 10,
    borderRadius: 10,
  },
  navLinkBox: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    width: "calc(100% - 20px)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopRightRadius: 100,
    borderBottomRightRadius: 100,
  },
});
