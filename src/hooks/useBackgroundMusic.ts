import { useRef, useEffect, useCallback, useState } from "react";

const MUSIC_SRC = "/audio/background-music.mp3";

export function useBackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasInteracted = useRef(false);

  const [musicVolume, setMusicVolume] = useState(() => {
    const saved = localStorage.getItem("music-volume");
    return saved !== null ? parseFloat(saved) : 0.3;
  });
  const [musicEnabled, setMusicEnabled] = useState(() => {
    const saved = localStorage.getItem("music-enabled");
    return saved !== null ? saved === "true" : true;
  });
  const [isPlaying, setIsPlaying] = useState(false);

  // Create audio element once via ref
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio(MUSIC_SRC);
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = parseFloat(localStorage.getItem("music-volume") || "0.3");
      audioRef.current = audio;
      audio.addEventListener("play", () => setIsPlaying(true));
      audio.addEventListener("pause", () => setIsPlaying(false));
    }
    return () => {
      // Don't destroy on unmount to survive HMR
    };
  }, []);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, musicVolume));
    }
    localStorage.setItem("music-volume", String(musicVolume));
  }, [musicVolume]);

  // Sync enabled state
  useEffect(() => {
    localStorage.setItem("music-enabled", String(musicEnabled));
    const audio = audioRef.current;
    if (!audio) return;
    if (musicEnabled && hasInteracted.current) {
      audio.play().catch(() => {});
    } else if (!musicEnabled) {
      audio.pause();
    }
  }, [musicEnabled]);

  // Start on first user click (autoplay policy)
  useEffect(() => {
    const handler = () => {
      if (hasInteracted.current) return;
      hasInteracted.current = true;
      if (musicEnabled && audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    };
    document.addEventListener("click", handler);
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("click", handler);
      document.removeEventListener("keydown", handler);
    };
  }, [musicEnabled]);

  const toggleMusic = useCallback(() => {
    setMusicEnabled((prev) => !prev);
  }, []);

  return {
    musicVolume,
    setMusicVolume,
    musicEnabled,
    setMusicEnabled,
    toggleMusic,
    isPlaying,
  };
}
