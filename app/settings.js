import { View, Text } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useRightSidebar } from "../contexts/SidebarContext";
import { useEffect } from "react";

export default function Settings() {
  const { setRightSidebarKey } = useRightSidebar();

  const { theme } = useTheme();

  useEffect(() => {
    setRightSidebarKey("settings");
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
      <Text style={{ color: theme.text }}>⚙️ App Settings</Text>
    </View>
  );
}
