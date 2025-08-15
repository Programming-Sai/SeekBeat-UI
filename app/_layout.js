// app/_layout.js
import { Slot } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import Header from "../components/Header";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { AppStorageProvider } from "../contexts/AppStorageContext";
import NavBar from "../components/NavBar";
import SideBar from "../components/SideBar";
import { SidebarProvider } from "../contexts/SidebarContext";
import { SearchProvider } from "../contexts/SearchContext";
import Toast from "react-native-toast-message";

export default function Layout() {
  return (
    <ThemeProvider>
      <AppStorageProvider>
        <SidebarProvider>
          <SearchProvider>
            <LayoutContent />
            <Toast />
          </SearchProvider>
        </SidebarProvider>
      </AppStorageProvider>
    </ThemeProvider>
  );
}

function LayoutContent() {
  // Theme hook is ok here
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Header />
      <View style={{ flex: 1, flexDirection: "row" }}>
        <NavBar />
        <View style={{ flex: 1 }}>
          <Slot />
        </View>
        <SideBar />
      </View>
    </View>
  );
}
