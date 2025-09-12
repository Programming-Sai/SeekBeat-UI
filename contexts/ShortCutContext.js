// ShortcutProvider.js
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { shortcuts } from "../lib/shortcuts";
import { usePlayer } from "./PlayerContext";
import { useSearch } from "./SearchContext";

export default function ShortcutProvider({ children }) {
  const router = useRouter();
  const player = usePlayer();
  const search = useSearch();

  const handleSpeedUpOrDown = (type = "") => {
    const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    const currentSpeedIndex = speeds.findIndex(
      (speed) => speed === player?.playbackRate
    );
    let newSpeedIndex = currentSpeedIndex;
    if (type === "up") {
      if (currentSpeedIndex < speeds.length - 1) {
        newSpeedIndex++;
      }
    } else if (type === "down") {
      if (currentSpeedIndex > 0) {
        newSpeedIndex--;
      }
    }
    player?.setPlaybackRate(
      speeds[Math.min(Math.max(newSpeedIndex, 0), speeds.length - 1)]
    );
  };

  const handleVolumeUpOrDown = (type = "") => {
    const volumes = [0, 0.25, 0.5, 0.75, 1];
    const currrenVolumeIndex = volumes.findIndex(
      (volume) => volume === player?.volumeValue
    );
    let newVolumeIndex = currrenVolumeIndex;
    if (type === "up") {
      if (currrenVolumeIndex < volumes.length - 1) {
        newVolumeIndex++;
      }
    } else if (type === "down") {
      if (currrenVolumeIndex > 0) {
        newVolumeIndex--;
      }
    }
    player?.setVolumeValue(
      volumes[Math.min(Math.max(newVolumeIndex, 0), volumes.length - 1)]
    );
  };

  const handleMuteToggle = () => {
    const currentVolume = player?.volumeValue;
    player?.setVolumeValue(currentVolume > 0 ? 0 : currentVolume || 1);
  };

  const toggleEditMode = () => {
    const to = `/player/${player?.queue[player?.currentIndex]?.id}?edit=true`;
    if (router.asPath?.includes("?edit=true")) {
      window.history.back();
    } else {
      player?.closeMini?.();
      router.push(to);
    }
  };

  const handleNextOrPrevSong = (type = "") => {
    if (!player?.miniVisible) {
      if (type === "prev") {
        router.push(`/player/${player?.queue[player?.currentIndex - 1]?.id}`);
        player?.prev();
      } else if (type === "next") {
        player?.next(true);
      }
    } else {
      if (type === "prev") {
        player?.prev();
      } else if (type === "next") {
        player?.next();
      }
    }
  };

  const actions = {
    togglePlay: () => player?.playPause?.(),
    speedUp: () => handleSpeedUpOrDown("up"),
    speedDown: () => handleSpeedUpOrDown("down"),
    seekForward: () =>
      player?.seek?.(
        Math.min(
          (player?.position || 0) + 10,
          player?.queue[player?.currentIndex]?.duration
        )
      ),
    seekBackward: () =>
      player?.seek?.(Math.max((player?.position || 0) - 10, 0)),
    volumeUp: () => handleVolumeUpOrDown?.("up"),
    volumeDown: () => handleVolumeUpOrDown?.("down"),
    nextSong: () => handleNextOrPrevSong("next"),
    prevSong: () => handleNextOrPrevSong("prev"),
    toggleMute: () => handleMuteToggle(),
    toggleEditMode: () => toggleEditMode(),
    focusSearch: () => search?.focusSearch(),
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
  }, [player, router.pathname, search?.focusSearch]);

  return children;
}
