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
import { MenuProvider } from "react-native-popup-menu";
import MiniPlayer from "../components/MiniPlayer";
import { PlayerProvider } from "../contexts/PlayerContext";
import { Stack } from "expo-router";
import { Host } from "react-native-portalize";
import ShortcutProvider from "../contexts/ShortCutContext";
import "react-native-gesture-handler";
import { ResponsiveProvider } from "../contexts/ResponsiveContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://fc3e9f335ac4.ngrok-free.app";

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ResponsiveProvider>
          <Host>
            <ThemeProvider>
              <AppStorageProvider>
                <PlayerProvider streamBase={API_BASE}>
                  <MenuProvider>
                    <SidebarProvider>
                      <SearchProvider>
                        <ShortcutProvider>
                          <LayoutContent />
                          <Toast />
                        </ShortcutProvider>
                      </SearchProvider>
                    </SidebarProvider>
                  </MenuProvider>
                </PlayerProvider>
              </AppStorageProvider>
            </ThemeProvider>
          </Host>
        </ResponsiveProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
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
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Slot />
          </Stack>
        </View>
        <MiniPlayer />
        <SideBar />
      </View>
    </View>
  );
}
