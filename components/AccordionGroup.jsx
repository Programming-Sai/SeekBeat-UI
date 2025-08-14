// components/AccordionGroupClient.jsx
import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import PaginatedResults from "./PaginatedResults";

export default function AccordionGroup({
  block, // the bulk response block: { search_term, results, count }
  pageSize = 10,
  viewMode = "list",
  initiallyExpanded = false,
}) {
  console.log("Accordion: ", block);
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const { theme } = useTheme();
  const termText = block?.search_term?.query ?? "Search";

  return (
    <View style={[styles.wrapper, { borderColor: theme.textSecondary }]}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={[styles.header, { backgroundColor: theme.backgroundSecondary }]}
      >
        <Text style={{ color: theme.text, fontWeight: "700" }}>{termText}</Text>
        <Text style={{ color: theme.textSecondary }}>
          {block?.count ?? block?.results?.length ?? 0}
        </Text>
      </Pressable>

      {expanded && (
        <View style={styles.body}>
          <PaginatedResults
            style={styles.searchResults}
            songs={block?.results ?? []}
            pageSize={pageSize}
            viewMode={viewMode}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderWidth: 1, borderRadius: 10, marginBottom: 12 },
  header: {
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 10,
  },
  body: { padding: 8 },
});
