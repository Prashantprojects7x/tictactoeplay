import { useEffect, useCallback, useState, useRef } from "react";

const MUSIC_SRC = "/audio/background-music.mp3";

// Module-level singleton — survives component re-mounts
let _audio: HTMLAudioElement | null = null;
let _hasInteracted = false;

function getAudio(): HTMLAudioElement {
  if (!_audio) {
    _audio = new Audio(MUSIC_SRC);
    _audio.loop = true;
    _audio.preload = "auto";
    _audio.volume = parseFloat(localStorage.getItem("music-volume") || "0.3");
  }
  return _audio;
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
  const mountedRef = useRef(true);

  // Track play state from the singleton
  useEffect(() => {
    mountedRef.current = true;
    const audio = getAudio();
    const onPlay = () => { if (mountedRef.current) setIsPlaying(true); };
    const onPause = () => { if (mountedRef.current) setIsPlaying(false); };
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    // Sync initial state
    setIsPlaying(!audio.paused);
    return () => {
      mountedRef.current = false;
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, []);

  // Sync volume
  useEffect(() => {
    const audio = getAudio();
    audio.volume = Math.max(0, Math.min(1, musicVolume));
    localStorage.setItem("music-volume", String(musicVolume));
  }, [musicVolume]);

  // Sync enabled state
  useEffect(() => {
    localStorage.setItem("music-enabled", String(musicEnabled));
    const audio = getAudio();
    if (musicEnabled && _hasInteracted) {
      if (audio.paused) audio.play().catch(() => {});
    } else if (!musicEnabled) {
      audio.pause();
    }
  }, [musicEnabled]);

  // Start on first user interaction (autoplay policy)
  useEffect(() => {
    const handler = () => {
      if (_hasInteracted) return;
      _hasInteracted = true;
      const audio = getAudio();
      if (musicEnabled && audio.paused) {
        audio.play().catch(() => {});
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
