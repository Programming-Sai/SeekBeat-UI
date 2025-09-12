import React, { createContext, useContext } from "react";
import { useWindowDimensions } from "react-native";

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

const ResponsiveContext = createContext(null);

export function ResponsiveProvider({ children }) {
  const { width, height } = useWindowDimensions();

  const isAtOrBelow = (name, at = false) => {
    const bp = breakpoints[name];
    if (typeof bp !== "number") {
      console.warn(`Responsive: unknown breakpoint "${name}"`);
      return false;
    }
    if (at) return width <= bp;
    return width < bp;
  };

  const isAtOrAbove = (name, at = false) => {
    const bp = breakpoints[name];
    if (typeof bp !== "number") {
      console.warn(`Responsive: unknown breakpoint "${name}"`);
      return false;
    }
    if (at) return width >= bp;
    return width > bp;
  };

  const isBetween = (loName, hiName) => {
    const lo = breakpoints[loName];
    const hi = breakpoints[hiName];
    if (typeof lo !== "number" || typeof hi !== "number") {
      console.warn(`Responsive: unknown breakpoint "${loName}" or "${hiName}"`);
      return false;
    }
    return width >= lo && width < hi;
  };

  const value = {
    width,
    height,
    breakpoints, // export the raw numbers too
    isMobile: width < breakpoints.sm,
    isTablet: width >= breakpoints.sm && width < breakpoints.lg,
    isDesktop: width >= breakpoints.lg,
    breakpoint:
      width < breakpoints.sm
        ? "mobile"
        : width < breakpoints.lg
        ? "tablet"
        : "desktop",

    // new helpers
    isAtOrBelow,
    isAtOrAbove,
    isBetween,
  };

  return (
    <ResponsiveContext.Provider value={value}>
      {children}
    </ResponsiveContext.Provider>
  );
}

export function useResponsive() {
  const ctx = useContext(ResponsiveContext);
  if (!ctx) {
    throw new Error("useResponsive must be used within ResponsiveProvider");
  }
  return ctx;
}
