import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const sampleRate = 22050;
const duration = Number(process.argv[2] ?? 28);
const totalSamples = sampleRate * duration;
const samples = new Float64Array(totalSamples);

const twoPi = Math.PI * 2;

function addPad(frequency, amplitude, phase, pulseRate) {
  for (let index = 0; index < totalSamples; index += 1) {
    const time = index / sampleRate;
    const pulse = 0.72 + 0.28 * Math.sin(twoPi * pulseRate * time + phase);
    const warmth = Math.sin(twoPi * frequency * time + phase)
      + 0.22 * Math.sin(twoPi * frequency * 2 * time + phase * 0.5);
    samples[index] += amplitude * pulse * warmth;
  }
}

function addChime(startTime, frequency, amplitude) {
  const chimeLength = 4.8;
  const startIndex = Math.floor(startTime * sampleRate);
  const endIndex = Math.min(totalSamples, startIndex + Math.floor(chimeLength * sampleRate));

  for (let index = startIndex; index < endIndex; index += 1) {
    const localTime = (index - startIndex) / sampleRate;
    const attack = Math.min(1, localTime / 0.08);
    const decay = Math.exp(-localTime * 0.78);
    const envelope = attack * decay;
    const shimmer = Math.sin(twoPi * frequency * localTime)
      + 0.36 * Math.sin(twoPi * frequency * 2.01 * localTime)
      + 0.14 * Math.sin(twoPi * frequency * 3.98 * localTime);
    samples[index] += amplitude * envelope * shimmer;
  }
}

addPad(146.83, 0.16, 0.2, 0.033);
addPad(220, 0.075, 1.1, 0.041);
addPad(293.66, 0.035, 2.2, 0.027);

[
  [0.4, 392],
  [3.2, 523.25],
  [7.4, 440],
  [11.5, 587.33],
  [15.8, 523.25],
  [20.1, 440],
  [24.0, 392],
].forEach(([time, frequency], position) => {
  addChime(time, frequency, position % 2 === 0 ? 0.13 : 0.1);
});

// Fade both ends so looping stays smooth and click-free.
const fadeSamples = Math.floor(sampleRate * 1.8);
let peak = 0;
for (let index = 0; index < totalSamples; index += 1) {
  const fadeIn = Math.min(1, index / fadeSamples);
  const fadeOut = Math.min(1, (totalSamples - index - 1) / fadeSamples);
  samples[index] *= Math.min(fadeIn, fadeOut);
  peak = Math.max(peak, Math.abs(samples[index]));
}

const dataSize = totalSamples * 2;
const wav = Buffer.alloc(44 + dataSize);
wav.write('RIFF', 0);
wav.writeUInt32LE(36 + dataSize, 4);
wav.write('WAVE', 8);
wav.write('fmt ', 12);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(sampleRate, 24);
wav.writeUInt32LE(sampleRate * 2, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write('data', 36);
wav.writeUInt32LE(dataSize, 40);

const scale = 0.88 / peak;
for (let index = 0; index < totalSamples; index += 1) {
  const value = Math.max(-1, Math.min(1, samples[index] * scale));
  wav.writeInt16LE(Math.round(value * 32767), 44 + index * 2);
}

const output = resolve(process.argv[3] ?? 'public/ambient-journey.wav');
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, wav);
console.log(`Generated ${output} (${(wav.length / 1024 / 1024).toFixed(2)} MB)`);
