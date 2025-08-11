export const themes = {
  light: {
    background: "#FFFFFF",
    backgroundSecondary: "#F5F5F5",
    text: "#000000",
    textSecondary: "#555555",
  },
  dark: {
    background: "#101010",
    backgroundSecondary: "#1A1A1A",
    text: "#FFFFFF",
    textSecondary: "#AAAAAA",
  },
};

export const accentColors = {
  gold: {
    light: "#FFD700",
    base: "#FFC107",
    dark: "#B8860B",
  },
  silver: {
    light: "#C0C0C0",
    base: "#A9A9A9",
    dark: "#696969",
  },
  bronze: {
    light: "#CD7F32",
    base: "#B87333",
    dark: "#8B4513",
  },
  platinum: {
    light: "#E5E4E2",
    base: "#BCC6CC",
    dark: "#9A9A9A",
  },
  copper: {
    light: "#B87333",
    base: "#B4632C",
    dark: "#7C3F1D",
  },
};

export function RGBA(hex, alpha) {
  // Ensure hex starts with #
  hex = hex.replace("#", "");

  if (hex.length === 3) {
    // Convert shorthand #RGB to #RRGGBB
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Adds alpha to a hex color (e.g., "#FF0000", alpha from 0 to 1)
 */
export function HEXA(hex, alpha) {
  // Ensure hex is clean
  let cleanHex = hex.replace("#", "");

  // If shorthand (#FFF), expand
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split("")
      .map((c) => c + c)
      .join("");
  }

  const alphaHex = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${cleanHex}${alphaHex}`;
}
