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
import "react-native-reanimated";
import { ResponsiveProvider } from "../contexts/ResponsiveContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SplashScreen from "../components/SplashScreen";
import { hasSeenSplash, markSplashSeen } from "../lib/splashSession";

const API_BASE =
  // process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
  process.env.NEXT_PUBLIC_API_BASE || "http://192.168.42.174:8000";
// process.env.NEXT_PUBLIC_API_BASE || "https://6ca6dcc3340e.ngrok-free.app";

export default function Layout() {
  // const [showSplash, setShowSplash] = useState(true);
  const [showSplashState, setShowSplashState] = useState(
    () => !hasSeenSplash()
  );
  const setShowSplash = (val) => {
    setShowSplashState(val);
    if (val === false) {
      // mark it seen now (so further navigations / re-renders won't show it)
      markSplashSeen();
    }
  };

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
                          <LayoutContent
                            showSplash={showSplashState}
                            setShowSplash={setShowSplash}
                          />
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

function LayoutContent({ showSplash, setShowSplash }) {
  const { theme } = useTheme();

  return (
    <>
      {showSplash ? (
        <SplashScreen theme={theme} setShowSplash={setShowSplash} />
      ) : (
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
      )}
    </>
  );
}
