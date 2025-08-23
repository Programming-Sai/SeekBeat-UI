import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useTheme } from "../contexts/ThemeContext";

/**
 * options: [{ label: string, icon?: ReactNode, onPress: () => void }]
 * style: extra style to position the menu relative to parent
 */
export const InlineMenu = ({ options = [], onClose = () => {}, style }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background, shadowColor: theme.accent },
        style,
      ]}
    >
      {options.map((opt, i) => (
        <TouchableOpacity
          key={i}
          onPress={() => {
            opt.onPress?.();
            onClose();
          }}
          style={styles.option}
        >
          {opt.icon}
          <Text style={[styles.label, { color: theme.text }]}>{opt.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 8,
    top: 40,
    minWidth: 140,
    borderRadius: 8,
    zIndex: 9999,
    // elevation: 20,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  label: {
    marginLeft: 8,
    fontSize: 14,
  },
});
