import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useRightSidebar } from "../contexts/SidebarContext";
import { useEffect, useState } from "react";
import ColorPicker from "../components/ColorPicker";
import Switch from "../components/Switch";
import { useAppStorage } from "../contexts/AppStorageContext";

export default function Settings() {
  const { setRightSidebarKey } = useRightSidebar();
  const { theme, accentColors, setAccent, accentKey, themeMode } = useTheme();
  const colors = Object.entries(accentColors).map(([key, shades]) => ({
    key,
    base: shades.base,
  }));
  const [isEnabled, setIsEnabled] = useState(true);
  const { saveSearchHistory, setSaveSearchHistory, clearSearchHistory } =
    useAppStorage();

  const handleClear = () => {
    if (confirm("Permanently delete all search history?")) {
      clearSearchHistory();
      // optionally show toast/snackbar
    }
  };
  useEffect(() => {
    setRightSidebarKey("settings");
    return () => setRightSidebarKey(null);
  }, []);
  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.settingsContainer]}>
        <Text style={[styles.heading, { color: theme.text }]}>Appearnce</Text>
        <View style={[styles.settingBox]}>
          <View
            style={[
              styles.settingBoxContainer,
              { border: `1px solid ${theme.textSecondary}`, padding: 20 },
            ]}
          >
            <View style={[styles.settingDescSet, { alignItems: "flex-start" }]}>
              <Text style={[styles.settingHeading, { color: theme.text }]}>
                Set Accent Color
              </Text>
              <Text
                style={[
                  styles.settingSecondary,
                  { color: theme.textSecondary },
                ]}
              >
                Pick the accent used across the app (buttons, highlights, and
                active states).
              </Text>
            </View>
            <View style={styles.settingDescSet}>
              <ColorPicker colors={colors} setColor={setAccent} theme={theme} />
            </View>
          </View>
        </View>
        <Text style={[styles.heading, { color: theme.text }]}>
          Search & History
        </Text>
        <View style={[styles.settingBox]}>
          <View
            style={[
              styles.settingBoxContainer,
              { border: `1px solid ${theme.textSecondary}`, padding: 20 },
              { borderBottomWidth: 0 },
            ]}
          >
            <View style={[styles.settingDescSet, { alignItems: "flex-start" }]}>
              <Text style={[styles.settingHeading, { color: theme.text }]}>
                Save Search History
              </Text>
              <Text
                style={[
                  styles.settingSecondary,
                  { color: theme.textSecondary },
                ]}
              >
                When enabled, your recent searches will be stored.
              </Text>
            </View>
            <View style={styles.settingDescSet}>
              <Switch
                value={saveSearchHistory}
                setValue={(v) => setSaveSearchHistory(v)}
                theme={themeMode}
                accent={theme.accent}
                accentLight={accentColors[accentKey].light}
                accentDark={accentColors[accentKey].dark}
              />
            </View>
          </View>
        </View>
        <View style={[styles.settingBox]}>
          <View
            style={[
              styles.settingBoxContainer,
              { border: `1px solid ${theme.textSecondary}`, padding: 20 },
            ]}
          >
            <View style={[styles.settingDescSet, { alignItems: "flex-start" }]}>
              <Text style={[styles.settingHeading, { color: theme.text }]}>
                Clear Search History
              </Text>
              <Text
                style={[
                  styles.settingSecondary,
                  { color: theme.textSecondary },
                ]}
              >
                Permanently delete all stored search history.
              </Text>
            </View>
            <View style={styles.settingDescSet}>
              <TouchableOpacity
                onPress={handleClear}
                style={[styles.clearButton]}
              >
                <Text style={[{ color: theme.text, fontWeight: "bold" }]}>
                  Clear History
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1, // full height so ScrollView knows its bounds
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 100, // leave room for the Header (adjust if your header height differs)
    paddingBottom: 48,
    flexGrow: 1, // ensures content pushes to fill and allows scrolling
    alignItems: "center",
  },
  settingsContainer: {
    width: "100%",
  },
  heading: {
    fontSize: "1.5rem",
    fontWeight: 500,
    marginVertical: 20,
  },
  settingBox: {},
  settingBoxContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
  },
  settingDescSet: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-end",
    width: "fit-content",
  },
  settingHeading: {
    fontWeight: "500",
    fontSize: "1.3rem",
    textAlign: "left",
    width: "100%",
    marginVertical: 20,
  },
  settingSecondary: {
    textAlign: "left",
    width: "50%",
  },
  clearButton: {
    border: "1px solid red",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,0,0,0.5)",
  },
});
