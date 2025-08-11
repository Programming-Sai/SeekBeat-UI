import React from "react";

export function CrescentMoonIcon({ size = 24, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* A slim crescent shape */}
      <path d="M14.5 2a9 9 0 1 0 0 20 7 7 0 0 1 0-20z" />
    </svg>
  );
}
