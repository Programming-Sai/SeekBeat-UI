import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { shortcuts } from "../lib/shortcuts";
import { HEXA } from "../lib/colors";

export default function ShortCutsTable({ theme, onClose }) {
  return (
    <View style={[styles.container]}>
      <View style={[styles.header]}>
        <Text
          style={[
            {
              textAlign: "left",
              width: "100%",
              color: theme.text,
              fontSize: 25,
              fontWeight: "bold",
            },
          ]}
        >
          Keyboard Shortcuts
        </Text>
        <TouchableOpacity
          onPress={onClose}
          style={[
            styles.closeBtn,
            { backgroundColor: HEXA(theme.accent, 0.5) },
          ]}
        >
          <Text
            style={[
              styles.closeText,
              { color: theme.text, fontWeight: "bold", fontSize: 20 },
            ]}
          >
            ✕
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={shortcuts}
        keyExtractor={(item, idx) => idx.toString()}
        contentContainerStyle={styles.container}
        renderItem={({ item }) => (
          <View style={[styles.row, { borderColor: theme.textSecondary }]}>
            <Text style={[styles.keys, { color: theme.textSecondary }]}>
              {item?.display?.join(",     ")}
            </Text>
            <Text style={[styles.action, { color: theme.textSecondary }]}>
              {item.label}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  keys: {
    width: 200,
    fontWeight: "600",
  },
  action: {
    flex: 1, // fill remaining space
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 100,
    display: "grid",
    placeContent: "center",
  },
});
