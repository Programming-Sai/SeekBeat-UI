// components/InlineMenu.js
import React from "react";
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from "react-native-popup-menu";
import { Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../contexts/ThemeContext";

export const InlineMenu = ({
  options = [],
  trigger,
  onClose,
  currentValue = "",
}) => {
  const { theme } = useTheme();

  return (
    <Menu onClose={onClose}>
      {/* Wrap trigger in a TouchableOpacity */}
      <MenuTrigger
        customStyles={{
          TriggerTouchableComponent: TouchableOpacity,
        }}
      >
        {trigger}
      </MenuTrigger>

      <MenuOptions
        customStyles={{
          optionsContainer: {
            borderRadius: 8,
            backgroundColor: theme.background,
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 6,
            elevation: 3,
          },
        }}
      >
        {options.map((opt, i) => (
          <MenuOption
            key={i}
            onSelect={() => {
              console.log("Option pressed:", opt.label);
              opt.onPress?.();
              onClose?.();
            }}
            style={[
              {
                backgroundColor:
                  opt.label === currentValue
                    ? theme.backgroundSecondary
                    : "transparent",
                borderRadius: 8,
              },
            ]}
          >
            <Text
              style={[
                styles.option,
                { color: opt.label === "Delete" ? "red" : theme.text },
              ]}
            >
              {opt.label}
            </Text>
          </MenuOption>
        ))}
      </MenuOptions>
    </Menu>
  );
};

const styles = StyleSheet.create({
  option: {
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
});
