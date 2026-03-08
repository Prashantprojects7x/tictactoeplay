import { useRef, useEffect, useCallback, useState } from "react";

const MUSIC_SRC = "/audio/background-music.mp3";

// Singleton audio element to survive re-renders and React strict mode
let _bgAudio: HTMLAudioElement | null = null;
function getBgAudio(): HTMLAudioElement {
  if (!_bgAudio) {
    _bgAudio = new Audio(MUSIC_SRC);
    _bgAudio.loop = true;
    _bgAudio.preload = "auto";
  }
  return _bgAudio;
}

export function useBackgroundMusic() {
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

  const audio = getBgAudio();

  // Sync volume immediately on every change
  useEffect(() => {
    audio.volume = Math.max(0, Math.min(1, musicVolume));
    localStorage.setItem("music-volume", String(musicVolume));
  }, [musicVolume, audio]);

  // Sync play/pause on enabled change
  useEffect(() => {
    localStorage.setItem("music-enabled", String(musicEnabled));
    if (musicEnabled && hasInteracted.current) {
      audio.play().catch(() => {});
      setIsPlaying(true);
    } else if (!musicEnabled) {
      audio.pause();
      setIsPlaying(false);
    }
  }, [musicEnabled, audio]);

  // Start on first user interaction (browsers block autoplay)
  const startOnInteraction = useCallback(() => {
    if (hasInteracted.current) return;
    hasInteracted.current = true;
    if (musicEnabled) {
      audio.volume = musicVolume;
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [musicEnabled, musicVolume, audio]);

  useEffect(() => {
    const handler = () => startOnInteraction();
    document.addEventListener("click", handler);
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("click", handler);
      document.removeEventListener("keydown", handler);
    };
  }, [startOnInteraction]);

  // Track play state
  useEffect(() => {
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [audio]);

  return {
    musicVolume,
    setMusicVolume,
    musicEnabled,
    setMusicEnabled,
    toggleMusic: useCallback(() => setMusicEnabled((prev) => !prev), []),
    isPlaying,
  };
}
