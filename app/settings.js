import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useRightSidebar } from "../contexts/SidebarContext";
import { useEffect, useState } from "react";
import ColorPicker from "../components/ColorPicker";
import Switch from "../components/Switch";
import { useAppStorage } from "../contexts/AppStorageContext";
import TabbedSwitch from "../components/TabbedSwitch";
import Toast from "react-native-toast-message";
import ShortCutsTable from "../components/ShortCutsTable";
import { InfoIcon } from "../components/InfoIcon";
import { useShortcuts } from "../contexts/ShortCutContext";
import { useResponsive } from "../contexts/ResponsiveContext";
import { useBackendUrl } from "../hooks/useBackendUrl";
import { HEXA } from "../lib/colors";

export default function Settings() {
  const { setRightSidebarKey } = useRightSidebar();
  const { theme, accentColors, setAccent, accentKey, themeMode } = useTheme();
  const colors = Object.entries(accentColors).map(([key, shades]) => ({
    key,
    base: shades.base,
  }));
  const [inputUrl, setInputUrl] = useState("");
  const { setShowShortcuts } = useShortcuts();
  const {
    saveSearchHistory,
    setSaveSearchHistory,
    clearSearchHistory,
    viewMode,
    setViewMode,
    clearDownloads,
    downloadUsePlaybackSettings,
    setDownloadUsePlaybackSettings,
    forceProxy,
    setForceProxy,
  } = useAppStorage();
  const { isAtOrBelow } = useResponsive();
  const mobileAndBelow = isAtOrBelow("sm");
  const tabletAndBelow = isAtOrBelow("md", true);
  const {
    backendUrl,
    setBackendUrl, // async normalization/validation
    resetBackendUrl,
    clearBackendUrl,
  } = useBackendUrl();

  const handleClear = () => {
    if (confirm("Permanently delete all search history?")) {
      try {
        clearSearchHistory();
        // optionally show toast/snackbar
        Toast.show({
          type: "success",
          position: "top",
          text1: "Success",
          text2: "History Cleared",
          text2Style: { fontSize: 16 },
          visibilityTime: 4000,
          autoHide: true,
        });
      } catch (e) {
        Toast.show({
          type: "error",
          position: "top",
          text1: "Error",
          text2: String(e),
          text2Style: { fontSize: 16 },
          visibilityTime: 4000,
          autoHide: true,
        });
      }
    }
  };

  const handleClearDownload = () => {
    if (confirm("Permanently delete all download history?")) {
      try {
        clearDownloads();
        // optionally show toast/snackbar
        Toast.show({
          type: "success",
          position: "top",
          text1: "Success",
          text2: "Downloads Cleared",
          text2Style: { fontSize: 16 },
          visibilityTime: 4000,
          autoHide: true,
        });
      } catch (e) {
        Toast.show({
          type: "error",
          position: "top",
          text1: "Error",
          text2: String(e),
          text2Style: { fontSize: 16 },
          visibilityTime: 4000,
          autoHide: true,
        });
      }
    }
  };

  const handleResetURL = () => {
    if (confirm("Restore the default URL (http://127.0.0.1:8000)?")) {
      try {
        resetBackendUrl();
        // optionally show toast/snackbar
        Toast.show({
          type: "success",
          position: "top",
          text1: "Success",
          text2: "URL Reset Successful",
          text2Style: { fontSize: 16 },
          visibilityTime: 4000,
          autoHide: true,
        });
      } catch (e) {
        Toast.show({
          type: "error",
          position: "top",
          text1: "Error",
          text2: String(e),
          text2Style: { fontSize: 16 },
          visibilityTime: 4000,
          autoHide: true,
        });
      }
    }
  };

  const handleClearBackendURL = () => {
    if (confirm("Permanently delete backend url?")) {
      try {
        clearBackendUrl();
        // optionally show toast/snackbar
        Toast.show({
          type: "success",
          position: "top",
          text1: "Success",
          text2: "URL deleted Successfully",
          text2Style: { fontSize: 16 },
          visibilityTime: 4000,
          autoHide: true,
        });
      } catch (e) {
        Toast.show({
          type: "error",
          position: "top",
          text1: "Error",
          text2: String(e),
          text2Style: { fontSize: 16 },
          visibilityTime: 4000,
          autoHide: true,
        });
      }
    }
  };

  const handleSaveUrl = (inputUrl) => {
    if (confirm(`Save ${inputUrl} as the new backend connection URL?`)) {
      try {
        setBackendUrl(inputUrl);
        // optionally show toast/snackbar
        Toast.show({
          type: "success",
          position: "top",
          text1: "Success",
          text2: "URL changed Successfully",
          text2Style: { fontSize: 16 },
          visibilityTime: 4000,
          autoHide: true,
        });
        setInputUrl("");
      } catch (e) {
        Toast.show({
          type: "error",
          position: "top",
          text1: "Error",
          text2: String(e),
          text2Style: { fontSize: 16 },
          visibilityTime: 4000,
          autoHide: true,
        });
      }
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
              tabletAndBelow && { flexDirection: "column" },
              { border: `1px solid ${theme.textSecondary}`, padding: 20 },
            ]}
          >
            <View
              style={[
                styles.settingDescSet,
                { alignItems: "flex-start" },
                tabletAndBelow && { width: "50%" },
              ]}
            >
              <Text
                style={[
                  styles.settingHeading,
                  { color: theme.text },
                  tabletAndBelow && { textAlign: "center", width: "100%" },
                ]}
              >
                Set Accent Color
              </Text>
              <Text
                style={[
                  styles.settingSecondary,
                  { color: theme.textSecondary },
                  tabletAndBelow && { textAlign: "center", width: "100%" },
                ]}
              >
                Pick the accent used across the app (buttons, highlights, and
                active states).
              </Text>
            </View>
            <View style={styles.settingDescSet}>
              <ColorPicker
                colors={colors}
                setColor={setAccent}
                theme={theme}
                tabletAndBelow={tabletAndBelow}
              />
            </View>
          </View>
        </View>

        <Text style={[styles.heading, { color: theme.text }]}>
          Search Results Display
        </Text>
        <View style={[styles.settingBox]}>
          <View
            style={[
              styles.settingBoxContainer,
              { border: `1px solid ${theme.textSecondary}`, padding: 20 },
            ]}
          >
            <View
              style={[
                styles.settingDescSet,
                { alignItems: "flex-start" },
                tabletAndBelow && { width: "50%" },
              ]}
            >
              <Text style={[styles.settingHeading, { color: theme.text }]}>
                Set Search Results Display View
              </Text>
              <Text
                style={[
                  styles.settingSecondary,
                  { color: theme.textSecondary },
                ]}
              >
                Select the view with which to display search Results
              </Text>
            </View>
            <View style={styles.settingDescSet}>
              <TabbedSwitch
                viewMode={viewMode}
                setViewMode={setViewMode}
                themeMode={themeMode}
                theme={theme}
                accent={theme.accent}
                accentLight={accentColors[accentKey].light}
                accentDark={accentColors[accentKey].dark}
              />
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
            <View
              style={[
                styles.settingDescSet,
                { alignItems: "flex-start" },
                tabletAndBelow && { width: "50%" },
              ]}
            >
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
            <View
              style={[
                styles.settingDescSet,
                { alignItems: "flex-start" },
                tabletAndBelow && { width: "50%" },
              ]}
            >
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

        <Text style={[styles.heading, { color: theme.text }]}>
          Downloads & Edits
        </Text>
        <View style={[styles.settingBox]}>
          <View
            style={[
              styles.settingBoxContainer,
              { border: `1px solid ${theme.textSecondary}`, padding: 20 },
              { borderBottomWidth: 0 },
            ]}
          >
            <View
              style={[
                styles.settingDescSet,
                { alignItems: "flex-start" },
                tabletAndBelow && { width: "50%" },
              ]}
            >
              <Text style={[styles.settingHeading, { color: theme.text }]}>
                Mirror Playback Speed/Volume
              </Text>
              <Text
                style={[
                  styles.settingSecondary,
                  { color: theme.textSecondary },
                ]}
              >
                When enabled, Downloads automatically mirror the current speed
                and volume outside the edit mode.
              </Text>
            </View>
            <View style={styles.settingDescSet}>
              <Switch
                value={downloadUsePlaybackSettings}
                setValue={(v) => setDownloadUsePlaybackSettings(v)}
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
            <View
              style={[
                styles.settingDescSet,
                { alignItems: "flex-start" },
                tabletAndBelow && { width: "50%" },
              ]}
            >
              <Text style={[styles.settingHeading, { color: theme.text }]}>
                Clear Download History
              </Text>
              <Text
                style={[
                  styles.settingSecondary,
                  { color: theme.textSecondary },
                ]}
              >
                Permanently delete all stored download history.
              </Text>
            </View>
            <View style={styles.settingDescSet}>
              <TouchableOpacity
                onPress={handleClearDownload}
                style={[styles.clearButton]}
              >
                <Text style={[{ color: theme.text, fontWeight: "bold" }]}>
                  Clear Downloads
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={[styles.heading, { color: theme.text }]}>
          Backend Connection
        </Text>
        <View style={[styles.settingBox]}>
          <View
            style={[
              styles.settingBoxContainer,
              { border: `1px solid ${theme.textSecondary}`, padding: 20 },
              { borderBottomWidth: 0 },
            ]}
          >
            <View
              style={[
                styles.settingDescSet,
                { alignItems: "flex-start" },
                tabletAndBelow && { width: "50%" },
              ]}
            >
              <Text style={[styles.settingHeading, { color: theme.text }]}>
                Always proxy streams
              </Text>
              <Text
                style={[
                  styles.settingSecondary,
                  { color: theme.textSecondary, maxWidth: "50rem" },
                ]}
              >
                {
                  "When enabled the app uses the backend as a streaming proxy (backend/api/stream/<id>/?stream=1). Useful if upstream URLs expire, CORS blocks direct playback, or you need auth. May increase latency and bandwidth usage."
                }
              </Text>
            </View>
            <View style={styles.settingDescSet}>
              <Switch
                value={forceProxy}
                setValue={(v) => setForceProxy(v)}
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
              { borderBottomWidth: 0 },
              mobileAndBelow && { flexDirection: "column", gap: 30 },
            ]}
          >
            <View
              style={[
                styles.settingDescSet,
                { alignItems: "flex-start" },
                tabletAndBelow && { width: "50%" },
              ]}
            >
              <Text style={[styles.settingHeading, { color: theme.text }]}>
                Set Backend Connection URL
              </Text>
              <Text
                style={[
                  styles.settingSecondary,
                  { color: theme.textSecondary },
                  mobileAndBelow ? { width: "100%" } : { maxWidth: "50rem" },
                ]}
              >
                {
                  "This URL is used for search, streaming, and downloads. You can set a local IP, a public tunnel (ngrok/localtunnel) or a remote server. Press 'Test' to verify connectivity."
                }
              </Text>
            </View>
            <View style={[styles.settingDescSet]}>
              <View
                style={{
                  flexDirection: tabletAndBelow ? "column" : "row",
                  alignItems: "center",
                  gap: 10, // RN 0.71+ supports gap; otherwise use margin
                }}
              >
                <TextInput
                  value={inputUrl}
                  onChangeText={setInputUrl}
                  onSubmitEditing={() => handleSaveUrl(inputUrl)}
                  returnKeyType="done"
                  blurOnSubmit={true}
                  style={{
                    flex: 1,
                    borderColor: theme.accent,
                    borderWidth: 1,
                    borderRadius: 100,
                    paddingHorizontal: 20,
                    backgroundColor: theme.backgroundSecondary,
                    padding: 10,
                    color: theme.text,
                  }}
                  placeholderTextColor={theme.textSecondary}
                  placeholder={backendUrl || "http://localhost:8000"}
                />

                <TouchableOpacity
                  onPress={() => handleSaveUrl(inputUrl)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 100,
                    backgroundColor: HEXA(theme.accent, 0.5),
                  }}
                >
                  <Text style={{ color: theme.text, fontWeight: "600" }}>
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.settingBox]}>
          <View
            style={[
              styles.settingBoxContainer,
              { border: `1px solid ${theme.textSecondary}`, padding: 20 },
              { borderBottomWidth: 0 },
            ]}
          >
            <View
              style={[
                styles.settingDescSet,
                { alignItems: "flex-start" },
                tabletAndBelow && { width: "50%" },
              ]}
            >
              <Text style={[styles.settingHeading, { color: theme.text }]}>
                Reset Backend onnection URL to default
              </Text>
              <Text
                style={[
                  styles.settingSecondary,
                  { color: theme.textSecondary },
                ]}
              >
                {
                  "Reset stored backend URL to the app default. This does not delete downloads or other local data."
                }
              </Text>
            </View>
            <View style={styles.settingDescSet}>
              <TouchableOpacity
                onPress={handleResetURL}
                style={[
                  styles.clearButton,
                  {
                    backgroundColor: HEXA(theme.accent, 0.5),
                    borderColor: theme.accent,
                  },
                ]}
              >
                <Text style={[{ color: theme.text, fontWeight: "bold" }]}>
                  Reset URL
                </Text>
              </TouchableOpacity>
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
            <View
              style={[
                styles.settingDescSet,
                { alignItems: "flex-start" },
                tabletAndBelow && { width: "50%" },
              ]}
            >
              <Text style={[styles.settingHeading, { color: theme.text }]}>
                Clear Backend Connection URL
              </Text>
              <Text
                style={[
                  styles.settingSecondary,
                  { color: theme.textSecondary },
                ]}
              >
                Deletes the stored backend URL from local storage. Use this to
                forget a previously configured server.
              </Text>
            </View>
            <View style={styles.settingDescSet}>
              <TouchableOpacity
                onPress={handleClearBackendURL}
                style={[styles.clearButton]}
              >
                <Text style={[{ color: theme.text, fontWeight: "bold" }]}>
                  Clear URL
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={[styles.heading, { color: theme.text }]}>
          Keyboard Shortcuts
        </Text>
        <View style={[styles.settingBox]}>
          <View
            style={[
              styles.settingBoxContainer,
              { border: `1px solid ${theme.textSecondary}`, padding: 20 },
              { borderBottomWidth: 1 },
            ]}
          >
            <View
              style={[
                styles.settingDescSet,
                { alignItems: "flex-start" },
                tabletAndBelow && { width: "50%" },
              ]}
            >
              <Text style={[styles.settingHeading, { color: theme.text }]}>
                Open Keyboard Shortcuts.
              </Text>
              <Text
                style={[
                  styles.settingSecondary,
                  { color: theme.textSecondary },
                ]}
              >
                Opens the keyboard shortcut cheat sheet.
              </Text>
            </View>
            <View style={styles.settingDescSet}>
              <TouchableOpacity onPress={() => setShowShortcuts(true)}>
                <InfoIcon size={50} color={theme.accent} />
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
    paddingVertical: 200, // leave room for the Header (adjust if your header height differs)
  },
  contentContainer: {
    paddingHorizontal: 20,
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
    // width: "50%",
    // width: "fit-content",
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
