import React from "react";

export function InfoIcon({ size = 24, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 30 27"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g filter="url(#filter0_d_1247_70)">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M15 1C8.925 1 4 5.925 4 12C4 18.075 8.925 23 15 23C21.075 23 26 18.075 26 12C26 5.925 21.075 1 15 1ZM14.5 6C14.2348 6 13.9804 6.10536 13.7929 6.29289C13.6054 6.48043 13.5 6.73478 13.5 7C13.5 7.26522 13.6054 7.51957 13.7929 7.70711C13.9804 7.89464 14.2348 8 14.5 8H15C15.2652 8 15.5196 7.89464 15.7071 7.70711C15.8946 7.51957 16 7.26522 16 7C16 6.73478 15.8946 6.48043 15.7071 6.29289C15.5196 6.10536 15.2652 6 15 6H14.5ZM13 10C12.7348 10 12.4804 10.1054 12.2929 10.2929C12.1054 10.4804 12 10.7348 12 11C12 11.2652 12.1054 11.5196 12.2929 11.7071C12.4804 11.8946 12.7348 12 13 12H14V15H13C12.7348 15 12.4804 15.1054 12.2929 15.2929C12.1054 15.4804 12 15.7348 12 16C12 16.2652 12.1054 16.5196 12.2929 16.7071C12.4804 16.8946 12.7348 17 13 17H17C17.2652 17 17.5196 16.8946 17.7071 16.7071C17.8946 16.5196 18 16.2652 18 16C18 15.7348 17.8946 15.4804 17.7071 15.2929C17.5196 15.1054 17.2652 15 17 15H16V11C16 10.7348 15.8946 10.4804 15.7071 10.2929C15.5196 10.1054 15.2652 10 15 10H13Z"
          fill={color}
        />
      </g>
      <defs>
        <filter
          id="filter0_d_1247_70"
          x="-1"
          y="0"
          width="32"
          height="32"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_1247_70"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_1247_70"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  );
}
