import { Text, View } from "react-native";
import formatTime from "../lib/utils";

export default function Thumb({
  left,
  size = 16,
  color = "#1DB954",
  panHandlers = {},
  pointerEvents = "auto",
  currentValue = 0,
  textColor = "white",
  tooltipColor = "black",
}) {
  const leftStyle = typeof left === "number" ? { left } : { left };

  return (
    <View
      pointerEvents={pointerEvents}
      style={[
        {
          position: "absolute",
          top: "45%",
          transform: [{ translateY: -size / 2 }],
          zIndex: 99999,
        },
        leftStyle,
        { width: size, height: size },
      ]}
      {...(panHandlers || {})}
    >
      {/* Thumb circle */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "white",
          borderWidth: 5,
          borderColor: color,
          cursor: "pointer",
        }}
      />

      {currentValue > 0 && (
        <View
          pointerEvents="none" // ⬅ prevents blocking drags
          style={{
            position: "absolute",
            top: size + 15, // space below thumb
            left: "160%",
            transform: [{ translateX: -40 }], // center tooltip
            backgroundColor: tooltipColor,
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}
        >
          <Text style={{ color: textColor, fontSize: 12 }}>
            {formatTime(currentValue)}
          </Text>

          {/* Tooltip arrow */}
          <View
            style={{
              position: "absolute",
              top: -4,
              left: "50%",
              marginLeft: -4,
              width: 8,
              height: 8,
              backgroundColor: tooltipColor,
              transform: [{ rotate: "45deg" }],
            }}
          />
        </View>
      )}
    </View>
  );
}
