'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

type AmbientAudioContextValue = {
  enabled: boolean;
  started: boolean;
  start: () => Promise<void>;
  toggle: () => Promise<void>;
};

const AmbientAudioContext = createContext<AmbientAudioContextValue | null>(null);

export function AmbientAudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [started, setStarted] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const start = useCallback(async () => {
    const audio = audioRef.current ?? new Audio('/ambient-journey.wav');
    if (!audioRef.current) {
      audio.loop = true;
      audio.preload = 'auto';
      audioRef.current = audio;
    }
    audio.muted = false;
    audio.volume = 0.48;
    await audio.play();
    setStarted(true);
    setEnabled(true);
  }, []);

  const toggle = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!started) {
      await start();
      return;
    }
    if (enabled) {
      audio.pause();
      setEnabled(false);
    } else {
      await audio.play();
      setEnabled(true);
    }
  }, [enabled, start, started]);

  useEffect(() => () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.removeAttribute('src');
  }, []);

  return (
    <AmbientAudioContext.Provider value={{ enabled, started, start, toggle }}>
      {children}
      {started && (
        <button className="audio-control" onClick={() => void toggle()} aria-pressed={enabled}>
          {enabled ? <Volume2 /> : <VolumeX />}
          <span>{enabled ? 'Audio hidup' : 'Audio mati'}</span>
        </button>
      )}
    </AmbientAudioContext.Provider>
  );
}

export function useAmbientAudio() {
  const context = useContext(AmbientAudioContext);
  if (!context) throw new Error('useAmbientAudio must be used inside AmbientAudioProvider');
  return context;
}
