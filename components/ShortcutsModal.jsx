import React from "react";
import { Modal, View, Text, StyleSheet, Pressable } from "react-native";
import ShortCutsTable from "./ShortCutsTable";
import { HEXA } from "../lib/colors";

export default function ShortcutsModal({
  visible,
  onClose,
  theme,
  tabletAndBelow,
}) {
  console.log(theme.background);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={[styles.overlay, { backgroundColor: HEXA(theme?.text, 0.5) }]}
      >
        <View
          style={[
            styles.modal,
            { backgroundColor: theme.background },
            tabletAndBelow && { transform: "scale(0.8)" },
          ]}
        >
          <ShortCutsTable theme={theme} onClose={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.9)",
  },
  modal: {
    // maxHeight: "80%",
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: "700" },
  closeBtn: {
    padding: 6,
    border: "2px solid red",
    width: "90%",
    textAlign: "center",
  },
  closeText: { fontSize: 20 },
});
