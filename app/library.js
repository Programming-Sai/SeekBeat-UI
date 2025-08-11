import { View, Text } from "react-native";
import { useTheme } from "../contexts/ThemeContext";

export default function Library() {
  const { theme } = useTheme();

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
