// shortcuts.js
export const shortcuts = [
  { keys: [" "], action: "togglePlay" }, // space
  { keys: ["k"], action: "togglePlay" },
  { keys: [">"], shift: true, action: "speedUp" },
  { keys: ["<"], shift: true, action: "speedDown" },
  { keys: ["l", "ArrowRight"], action: "seekForward" },
  { keys: ["j", "ArrowLeft"], action: "seekBackward" },
  { keys: ["ArrowUp"], action: "volumeUp" },
  { keys: ["ArrowDown"], action: "volumeDown" },
  { keys: ["n"], shift: true, action: "nextSong" },
  { keys: ["p"], shift: true, action: "prevSong" },
  { keys: ["m"], action: "toggleMute" },
  { keys: ["e"], action: "toggleEditMode" },
  { keys: ["/"], action: "focusSearch" }, // we can later make it ctrl+/
];
