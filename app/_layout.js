// app/_layout.js
import { Slot } from "expo-router";
import { useState } from "react";
import { View, StyleSheet } from "react-native";
import Header from "../components/Header";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { AppStorageProvider } from "../contexts/AppStorageContext";
import NavBar from "../components/NavBar";

export default function Layout() {
  return (
    <ThemeProvider>
      <AppStorageProvider>
        <LayoutContent />
      </AppStorageProvider>
    </ThemeProvider>
  );
}

function LayoutContent() {
  const [rightSidebarContent, setRightSidebarContent] = useState(null);
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Header />
      <View style={{ flex: 1, flexDirection: "row" }}>
        <NavBar />
        <View style={{ flex: 1 }}>
          <Slot context={{ setRightSidebarContent }} />
        </View>
      </View>
    </View>
  );
}
