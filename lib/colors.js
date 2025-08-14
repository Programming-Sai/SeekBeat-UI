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
  sapphire: {
    light: "#7EB6FF",
    base: "#0F52BA",
    dark: "#082567",
  },
  ruby: {
    light: "#FF6F6F",
    base: "#E0115F",
    dark: "#8B0000",
  },
  amethyst: {
    light: "#CBA6FF",
    base: "#9966CC",
    dark: "#5D3A8E",
  },
  jade: {
    light: "#9FE2BF",
    base: "#00A86B",
    dark: "#006B3C",
  },
  onyx: {
    light: "#555555",
    base: "#353839",
    dark: "#0F0F0F",
  },
  topaz: {
    light: "#FFD39B",
    base: "#FFB85F",
    dark: "#CC8400",
  },
  turquoise: {
    light: "#AFEEEE",
    base: "#40E0D0",
    dark: "#008B8B",
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

// 1. Get brightness of a hex color
export function getBrightness(hex) {
  hex = hex.replace("#", "");

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Perceived brightness formula
  return (r * 299 + g * 587 + b * 114) / 1000;
}

// 2. Get primary text color based on background
export function getPrimaryTextColor(backgroundHex, pivot = 128) {
  const brightness = getBrightness(backgroundHex);
  // Dark backgrounds → white text, Light backgrounds → black text
  return brightness > pivot ? "#000000" : "#FFFFFF";
}

// 3. Get secondary text color based on background
export function getSecondaryTextColor(backgroundHex) {
  const brightness = getBrightness(backgroundHex);

  if (brightness > 128) {
    // Light background → darker gray text
    return "rgba(0, 0, 0, 0.6)";
  } else {
    // Dark background → lighter gray text
    return "rgba(255, 255, 255, 0.7)";
  }
}
