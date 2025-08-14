import { View, ScrollView, StyleSheet, Text } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useRightSidebar } from "../contexts/SidebarContext";
import { useEffect } from "react";
import { useAppStorage } from "../contexts/AppStorageContext";
import PaginatedResults from "../components/PaginatedResults";
import AccordionGroup from "../components/AccordionGroup";
import Icon from "react-native-vector-icons/Ionicons";
import { useSearch } from "../contexts/SearchContext";
import { Skeleton } from "../components/Skeleton";
import { HEXA } from "../lib/colors";
import LoadingSkeleton from "../components/LoadingSkeleton";

export default function Home() {
  const { setRightSidebarKey } = useRightSidebar();
  const { viewMode } = useAppStorage();
  const { normalized, isLoading, error, setIsLoading } = useSearch();

  useEffect(() => {
    setRightSidebarKey("home");
    return () => setRightSidebarKey(null);
  }, []);

  // setIsLoading(true);

  if (!isLoading && !error && !normalized) {
    return (
      <View style={[styles.container, { alignItems: "center", marginTop: 40 }]}>
        <Icon name="search-off" size={48} color="#999" />
        <Text>Begin Search</Text>
      </View>
    );
  }
  return (
    <ScrollView showsVerticalScrollIndicator={false} style={[styles.container]}>
      {}
      {}
      {isLoading ? (
        <LoadingSkeleton viewMode={viewMode} displayType={normalized?.type} />
      ) : error ? (
        <Text style={{ color: "red" }}>{error}</Text>
      ) : !isLoading && !normalized ? (
        <Text>Enter a query and press Enter</Text>
      ) : (
        <View>
          {/* <ScrollView style={{ padding: 16 }}> */}

          {normalized?.type === "bulk" ? (
            normalized?.blocks.map((block) => (
              <AccordionGroup
                key={block.search_term.query}
                block={block}
                pageSize={9}
                viewMode={viewMode}
              />
            ))
          ) : (
            <PaginatedResults
              style={styles.searchResults}
              songs={normalized?.items}
              pageSize={12}
              viewMode={viewMode}
            />
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 200,
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
