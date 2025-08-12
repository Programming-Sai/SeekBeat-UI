import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useRightSidebar } from "../contexts/SidebarContext";
import { useEffect } from "react";
import ColorPicker from "../components/ColorPicker";

export default function Settings() {
  const { setRightSidebarKey } = useRightSidebar();
  const { theme, accentColors, setAccent } = useTheme();
  const colors = Object.entries(accentColors).map(([key, shades]) => ({
    key,
    base: shades.base,
  }));

  useEffect(() => {
    setRightSidebarKey("settings");
    return () => setRightSidebarKey(null);
  }, []);
  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      <View
        style={[
          styles.settingsContainer,
          // { border: "2px solid red", padding: 20 },
        ]}
      >
        <Text style={[styles.heading, { color: theme.text }]}>Appearnce</Text>
        <View style={[styles.settingBox]}>
          {/* <View style={{ border: "2px solid blue", padding: 20 }}>Theme</View> */}
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
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
});
