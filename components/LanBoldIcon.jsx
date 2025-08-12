import React from "react";

export function LanBoldIcon({ size = 24, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 22V15H6V11H11V9H8V2H16V9H13V11H18V15H21V22H13V15H16V13H8V15H11V22H3Z"
        fill={color}
      />
    </svg>
  );
}
