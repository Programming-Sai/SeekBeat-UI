import React from "react";

export function ShortCutIcon({ size = 24, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21 11L15 5V10H8C5.24 10 3 12.24 3 15V19H5V15C5 13.35 6.35 12 8 12H15V17L21 11Z"
        fill={color}
      />
    </svg>
  );
}
