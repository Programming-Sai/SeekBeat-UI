import { Link, usePathname } from "expo-router";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import Icon from "react-native-vector-icons/Ionicons";
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

export default function NavBar() {
  const { theme, themeMode, accentColors, accentKey } = useTheme();
  const pathname = usePathname();

  const pages = [
    { pageName: "Home", pageLink: "/", Icon: HomeIcon, IconBold: HomeBoldIcon },
    {
      pageName: "Local Library",
      pageLink: "/library",
      Icon: LibraryIcon,
      IconBold: LibraryBoldIcon,
    },
    { pageName: "LAN", pageLink: "/lan", Icon: LanIcon, IconBold: LanBoldIcon },
    {
      pageName: "Settings",
      pageLink: "/settings",
      Icon: SettingsIcon,
      IconBold: SettingsBoldIcon,
    },
  ];

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}
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
            href={page.pageLink}
            style={{ width: "100%" }}
            key={page.pageName}
          >
            <Pressable
              style={({ hovered, pressed }) => [
                styles.navLinkBox,
                {
                  backgroundColor: HEXA(
                    theme.accent,
                    themeMode === "light" ? 0.1 : 0.05
                  ),
                },
                hovered && { backgroundColor: HEXA(theme.accent, 0.2) },
              ]}
            >
              <IconComp color={color} size={18} />
              <Text
                style={[
                  styles.buttonText,
                  {
                    color: color,
                    fontWeight: isActive ? "bold" : "normal",
                  },
                ]}
              >
                {page.pageName}
              </Text>
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
  navLinkBox: {
    // border: "1px solid green",

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
