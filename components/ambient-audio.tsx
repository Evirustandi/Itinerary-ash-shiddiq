'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

type AmbientAudioContextValue = {
  enabled: boolean;
  started: boolean;
  start: () => Promise<void>;
  toggle: () => Promise<void>;
};

type AudioEngine = {
  context: AudioContext;
  master: GainNode;
  oscillators: OscillatorNode[];
  interval: number;
};

const AmbientAudioContext = createContext<AmbientAudioContextValue | null>(null);

function createTone(context: AudioContext, destination: AudioNode, frequency: number, volume: number) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gain.gain.value = volume;
  oscillator.connect(gain).connect(destination);
  oscillator.start();
  return oscillator;
}

function playChime(context: AudioContext, destination: AudioNode) {
  const notes = [392, 440, 523.25];
  const frequency = notes[Math.floor(Math.random() * notes.length)];
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.008, now + 2.4);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.055, now + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
  oscillator.connect(gain).connect(destination);
  oscillator.start(now);
  oscillator.stop(now + 2.6);
}

export function AmbientAudioProvider({ children }: { children: React.ReactNode }) {
  const engineRef = useRef<AudioEngine | null>(null);
  const [started, setStarted] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const start = useCallback(async () => {
    if (engineRef.current) {
      await engineRef.current.context.resume();
      engineRef.current.master.gain.setTargetAtTime(0.032, engineRef.current.context.currentTime, 0.35);
      setEnabled(true);
      return;
    }

    const context = new AudioContext();
    const master = context.createGain();
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 720;
    master.gain.setValueAtTime(0.0001, context.currentTime);
    master.gain.exponentialRampToValueAtTime(0.032, context.currentTime + 1.8);
    master.connect(filter).connect(context.destination);

    const oscillators = [
      createTone(context, master, 146.83, 0.24),
      createTone(context, master, 220, 0.10),
      createTone(context, master, 293.66, 0.035),
    ];

    playChime(context, master);
    const interval = window.setInterval(() => playChime(context, master), 7800);
    engineRef.current = { context, master, oscillators, interval };
    setStarted(true);
    setEnabled(true);
  }, []);

  const toggle = useCallback(async () => {
    if (!engineRef.current) {
      await start();
      return;
    }
    const engine = engineRef.current;
    if (enabled) {
      engine.master.gain.setTargetAtTime(0.0001, engine.context.currentTime, 0.25);
      setEnabled(false);
    } else {
      await engine.context.resume();
      engine.master.gain.setTargetAtTime(0.032, engine.context.currentTime, 0.35);
      setEnabled(true);
    }
  }, [enabled, start]);

  useEffect(() => () => {
    const engine = engineRef.current;
    if (!engine) return;
    window.clearInterval(engine.interval);
    engine.oscillators.forEach((oscillator) => oscillator.stop());
    void engine.context.close();
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
