import { useRef, useEffect, useCallback, useState } from "react";

const MUSIC_SRC = "/audio/background-music.mp3";

export function useBackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [musicVolume, setMusicVolume] = useState(() => {
    const saved = localStorage.getItem("music-volume");
    return saved !== null ? parseFloat(saved) : 0.3;
  });
  const [musicEnabled, setMusicEnabled] = useState(() => {
    const saved = localStorage.getItem("music-enabled");
    return saved !== null ? saved === "true" : true;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const hasInteracted = useRef(false);

  // Initialize audio element once
  useEffect(() => {
    const audio = new Audio(MUSIC_SRC);
    audio.loop = true;
    audio.volume = musicVolume;
    audio.preload = "auto";
    audioRef.current = audio;

    audio.addEventListener("play", () => setIsPlaying(true));
    audio.addEventListener("pause", () => setIsPlaying(false));

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = musicVolume;
    localStorage.setItem("music-volume", String(musicVolume));
  }, [musicVolume]);

  // Sync enabled state
  useEffect(() => {
    localStorage.setItem("music-enabled", String(musicEnabled));
    if (!audioRef.current) return;
    if (musicEnabled && hasInteracted.current) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [musicEnabled]);

  // Start on first user interaction (browsers block autoplay)
  const startOnInteraction = useCallback(() => {
    if (hasInteracted.current) return;
    hasInteracted.current = true;
    if (musicEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [musicEnabled]);

  useEffect(() => {
    const handler = () => startOnInteraction();
    document.addEventListener("click", handler, { once: false });
    document.addEventListener("keydown", handler, { once: false });
    return () => {
      document.removeEventListener("click", handler);
      document.removeEventListener("keydown", handler);
    };
  }, [startOnInteraction]);

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
