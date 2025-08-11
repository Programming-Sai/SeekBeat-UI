// app/_layout.js
import { Slot } from "expo-router";
import { useState } from "react";
import { View, StyleSheet } from "react-native";
import Header from "../components/Header";
import { ThemeProvider } from "../contexts/ThemeContext";
import { AppStorageProvider } from "../contexts/AppStorageContext";

export default function Layout() {
  const [rightSidebarContent, setRightSidebarContent] = useState(null);

  return (
    <View style={styles.container}>
      <ThemeProvider>
        <AppStorageProvider>
          {/* Header */}
          <Header />

          {/* Main body with sidebars */}
          <View style={styles.body}>
            {/* <LeftSidebar /> */}

            {/* Main content */}
            <View style={styles.mainContent}>
              <Slot context={{ setRightSidebarContent }} />
            </View>

            {/* <RightSidebar content={rightSidebarContent} /> */}
          </View>
        </AppStorageProvider>
      </ThemeProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
    flexDirection: "row",
  },
  mainContent: {
    flex: 1,
    backgroundColor: "#fff", // temp
  },
});
