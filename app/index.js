import { View, ScrollView, StyleSheet, Text } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useRightSidebar } from "../contexts/SidebarContext";
import { useEffect } from "react";
import { useAppStorage } from "../contexts/AppStorageContext";
import PaginatedResults from "../components/PaginatedResults";
import AccordionGroup from "../components/AccordionGroup";
import { useSearch } from "../contexts/SearchContext";
import LoadingSkeleton from "../components/LoadingSkeleton";
import Toast from "react-native-toast-message";

export default function Home() {
  const { setRightSidebarKey } = useRightSidebar();
  const { viewMode, getLastSearch, setLastSearch } = useAppStorage();
  const { normalized, isLoading, error } = useSearch();
  const { theme } = useTheme();

  const lastSearch = getLastSearch();
  // Save the *normalized* result to storage when it becomes available.
  // (We intentionally DO NOT write lastSearch when it's null/undefined)
  useEffect(() => {
    if (!normalized) return;
    // do a cheap equality check — stringify is simple and enough here
    try {
      const normStr = JSON.stringify(normalized);
      const lastStr = JSON.stringify(lastSearch);
      if (normStr === lastStr) return; // no change -> don't write
    } catch (e) {
      // fallback: if stringify fails, still write once
    }
    setLastSearch(normalized);
  }, [normalized, lastSearch, setLastSearch]);

  // set right sidebar key for this page
  useEffect(() => {
    setRightSidebarKey("home");
    return () => setRightSidebarKey(null);
  }, [setRightSidebarKey]);

  // show toast when there's an error (still allow fallback rendering)
  useEffect(() => {
    if (error) {
      Toast.show({
        type: "error",
        position: "top",
        text1: "Error",
        text2: String(error),
        text2Style: { fontSize: 16 },
        visibilityTime: 4000,
        autoHide: true,
      });
    }
  }, [error]);

  // Determine source to render: prefer live normalized results, otherwise use lastSearch
  const source = normalized ?? lastSearch ?? null;
  const displayType = normalized?.type ?? lastSearch?.type ?? null;

  // Loading state (use displayType to let skeleton adjust)
  if (isLoading) {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={[styles.container]}
      >
        <LoadingSkeleton viewMode={viewMode} displayType={displayType} />
      </ScrollView>
    );
  }

  // No results at all (initial empty state)
  if (!source) {
    return (
      <View style={[styles.container, { alignItems: "center", marginTop: 40 }]}>
        <Text
          style={[
            {
              color: theme.textSecondary,
              fontWeight: "bold",
              fontSize: 40,
              letterSpacing: 3,
            },
          ]}
        >
          Your Search Results Appear Here.
        </Text>
      </View>
    );
  }

  // If we have a source (normalized or lastSearch) — render it.
  // It should match the shape you expect (bulk vs single)
  return (
    <ScrollView showsVerticalScrollIndicator={false} style={[styles.container]}>
      <View>
        {source.type === "bulk" ? (
          // bulk blocks: if lastSearch was saved it should have the same `blocks` structure
          source.blocks?.map((block) => (
            <AccordionGroup
              key={
                block.search_term?.query ??
                Math.random().toString(36).slice(2, 9)
              }
              block={block}
              pageSize={9}
              viewMode={viewMode}
            />
          ))
        ) : (
          // single search: normalized.items or lastSearch.items
          <PaginatedResults
            style={styles.searchResults}
            songs={source.items ?? []}
            pageSize={12}
            viewMode={viewMode}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingVertical: 200,
    width: "100%",
  },
  searchResults: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    gap: 20,
  },
  searchResultsGrid: {
    display: "flex",
    justifyContent: "space-evenly",
    alignItems: "flex-start",
    width: "100%",
    gap: 20,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  thumbnailImage: {
    width: 150, // give the container a size
    height: 150,
    borderRadius: 8,
    overflow: "hidden", // important for rounded corners
  },
  thumbnailImageGrid: {
    width: 200, // give the container a size
    height: 150,
    borderRadius: 8,
    overflow: "hidden", // important for rounded corners
  },
  thumbnailImg: {
    width: "100%", // make image fill the container
    height: "100%",
  },
  resultCard: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 30,
    flexDirection: "row",
    padding: 10,
    borderRadius: 20,
    width: "80%",
  },
  resultCardGrid: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 20,
    width: "15em",
    height: "25em",
  },
  details: {
    height: 100,
    width: "70%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  detailsGrid: {
    height: 100,
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
  },
  titleDurationBox: {
    display: "flex",
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  titleDurationBoxGrid: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  buttonsBox: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "90%",
  },
  buttonsBoxGrid: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    width: "100%",
  },
  buttonBox: {
    borderRadius: 7,
    width: "40%",
  },
  buttonBoxGrid: {
    borderRadius: 7,
    width: "100%",
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: "100%",
  },
});
