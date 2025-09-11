// ShortcutProvider.js
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { shortcuts } from "../lib/shortcuts";
import { usePlayer } from "./PlayerContext";

export default function ShortcutProvider({ children }) {
  const router = useRouter();
  const player = usePlayer();

  const actions = {
    togglePlay: () => console.log("play/pause"),
    speedUp: () => console.log("speed up"),
    speedDown: () => console.log("speed down"),
    seekForward: () => console.log("seek forward 10s"),
    seekBackward: () => console.log("seek backward 10s"),
    volumeUp: () => console.log("volume up"),
    volumeDown: () => console.log("volume down"),
    nextSong: () => console.log("next song"),
    prevSong: () => console.log("prev song"),
    toggleMute: () => console.log("mute"),
    toggleEditMode: () => console.log("edit mode"),
    focusSearch: () => {
      console.log("Focusing on Search");
    },
  };

  useEffect(() => {
    function handleKey(e) {
      // Disable when typing in input/textar
      // ea

      const tag = e.target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || e.target.isContentEditable) {
        return;
      }

      const key = e.key.toLowerCase();
      const isShift = e.shiftKey;
      console.log(tag + " key Pressed");

      for (let sc of shortcuts) {
        if (sc.keys.map((k) => k.toLowerCase()).includes(key)) {
          if ((sc.shift && !isShift) || (!sc.shift && isShift)) continue;

          // Disable in settings route
          if (router.pathname?.includes("/settings")) return;

          e.preventDefault();

          // Look up action from player context
          const fn = actions[sc.action];
          if (fn) fn();
          break;
        }
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [player, router.pathname]);

  return children;
}
