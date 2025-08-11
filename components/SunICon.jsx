import React from "react";

export function SunIcon({ size = 24, color = "currentColor" }) {
  return (
    <svg
      width={30}
      height={30}
      viewBox="0 0 24 24"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Center circle */}
      <circle cx="12" cy="12" r="5" />
      {/* Rays */}
      <path d="M12 1v3" />
      <path d="M12 20v3" />
      <path d="M4.22 4.22l2.12 2.12" />
      <path d="M17.66 17.66l2.12 2.12" />
      <path d="M1 12h3" />
      <path d="M20 12h3" />
      <path d="M4.22 19.78l2.12-2.12" />
      <path d="M17.66 6.34l2.12-2.12" />
    </svg>
  );
}
