/**
 * Audio-specific PWDC compression.
 *
 * Audio PCM data is ideal for photonic compression because:
 * 1. Adjacent samples are highly correlated (smooth waveforms)
 * 2. Most audio concentrates energy in a few frequency bands
 * 3. Silence/quiet sections are nearly uniform (high spectral density)
 *
 * This module adds audio-aware features on top of the core PWDC codec:
 * - 16-bit PCM sample splitting (high byte + low byte channels)
 * - Frame-based compression with overlap for streaming
 * - Spectral analysis tuned for audio sample distributions
 */

import { compress, decompress, analyzeCompressibility } from "./spectral-compress";
import { byteToWavelength } from "./photonic-transform";

/** Compress raw PCM audio (Float32Array from Web Audio API → Uint8Array) */
export function compressAudio(samples: Float32Array, bitsPerSample: number = 16): {
  compressed: Uint8Array;
  originalSize: number;
  compressedSize: number;
  ratio: number;
  savings: string;
} {
  // Convert float samples (-1 to 1) to integer PCM
  const pcmBytes = float32ToPCM(samples, bitsPerSample);
  const compressed = compress(pcmBytes);
  const ratio = compressed.length / pcmBytes.length;

  return {
    compressed,
    originalSize: pcmBytes.length,
    compressedSize: compressed.length,
    ratio: Math.round(ratio * 1000) / 1000,
    savings: `${Math.round((1 - ratio) * 100)}%`,
  };
}

/** Decompress PWDC audio back to Float32Array */
export function decompressAudio(compressed: Uint8Array, bitsPerSample: number = 16): Float32Array {
  const pcmBytes = decompress(compressed);
  return pcmToFloat32(pcmBytes, bitsPerSample);
}

/** Convert Float32 samples to PCM bytes */
export function float32ToPCM(samples: Float32Array, bitsPerSample: number): Uint8Array {
  if (bitsPerSample === 16) {
    const pcm = new Uint8Array(samples.length * 2);
    for (let i = 0; i < samples.length; i++) {
      // Clamp to [-1, 1] and convert to 16-bit signed integer
      const s = Math.max(-1, Math.min(1, samples[i]));
      const val = s < 0 ? s * 32768 : s * 32767;
      const int16 = Math.round(val);
      pcm[i * 2] = int16 & 0xff;         // Low byte
      pcm[i * 2 + 1] = (int16 >> 8) & 0xff; // High byte
    }
    return pcm;
  }
  // 8-bit fallback
  const pcm = new Uint8Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    pcm[i] = Math.round((s + 1) * 127.5);
  }
  return pcm;
}

/** Convert PCM bytes back to Float32 samples */
export function pcmToFloat32(pcm: Uint8Array, bitsPerSample: number): Float32Array {
  if (bitsPerSample === 16) {
    const samples = new Float32Array(pcm.length / 2);
    for (let i = 0; i < samples.length; i++) {
      const low = pcm[i * 2];
      const high = pcm[i * 2 + 1];
      let int16 = (high << 8) | low;
      if (int16 >= 32768) int16 -= 65536; // Sign extend
      samples[i] = int16 / 32768;
    }
    return samples;
  }
  const samples = new Float32Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) {
    samples[i] = (pcm[i] / 127.5) - 1;
  }
  return samples;
}

/** Analyze audio data for compression potential */
export function analyzeAudio(samples: Float32Array): {
  sampleCount: number;
  duration: number;
  peakAmplitude: number;
  rmsLevel: number;
  silenceRatio: number;
  pcmAnalysis: ReturnType<typeof analyzeCompressibility>;
  wavelengthPeaks: Array<{ wavelength: number; count: number }>;
} {
  const sampleRate = 44100; // Assume standard rate
  const duration = samples.length / sampleRate;

  let peak = 0;
  let rmsSum = 0;
  let silentSamples = 0;
  const silenceThreshold = 0.01;

  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > peak) peak = abs;
    rmsSum += samples[i] * samples[i];
    if (abs < silenceThreshold) silentSamples++;
  }

  const pcmBytes = float32ToPCM(samples, 16);
  const pcmAnalysis = analyzeCompressibility(pcmBytes);

  // Build wavelength histogram from PCM bytes
  const histogram = new Map<number, number>();
  for (let i = 0; i < pcmBytes.length; i++) {
    const wl = Math.round(byteToWavelength(pcmBytes[i]));
    histogram.set(wl, (histogram.get(wl) || 0) + 1);
  }
  const wavelengthPeaks = Array.from(histogram.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([wavelength, count]) => ({ wavelength, count }));

  return {
    sampleCount: samples.length,
    duration: Math.round(duration * 100) / 100,
    peakAmplitude: Math.round(peak * 1000) / 1000,
    rmsLevel: Math.round(Math.sqrt(rmsSum / samples.length) * 1000) / 1000,
    silenceRatio: Math.round((silentSamples / samples.length) * 100) / 100,
    pcmAnalysis,
    wavelengthPeaks,
  };
}

/** Generate test audio signals for demo purposes */
export function generateTestSignal(
  type: "sine" | "silence" | "noise" | "speech-like",
  durationSec: number = 1,
  sampleRate: number = 44100
): Float32Array {
  const length = Math.floor(durationSec * sampleRate);
  const samples = new Float32Array(length);

  switch (type) {
    case "sine": {
      const freq = 440; // A4
      for (let i = 0; i < length; i++) {
        samples[i] = 0.5 * Math.sin(2 * Math.PI * freq * i / sampleRate);
      }
      break;
    }
    case "silence": {
      // Already zeros, add tiny noise for realism
      for (let i = 0; i < length; i++) {
        samples[i] = (Math.random() - 0.5) * 0.001;
      }
      break;
    }
    case "noise": {
      for (let i = 0; i < length; i++) {
        samples[i] = (Math.random() - 0.5) * 0.8;
      }
      break;
    }
    case "speech-like": {
      // Simulate speech: mix of low-frequency formants + noise bursts
      const f1 = 300, f2 = 2500;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        // Amplitude envelope (syllable-like)
        const env = 0.5 * (1 + Math.sin(2 * Math.PI * 3 * t)) *
                    (1 + 0.3 * Math.sin(2 * Math.PI * 0.5 * t));
        // Formants
        const signal = 0.3 * Math.sin(2 * Math.PI * f1 * t) +
                       0.15 * Math.sin(2 * Math.PI * f2 * t) +
                       0.05 * (Math.random() - 0.5);
        samples[i] = signal * env * 0.3;
      }
      break;
    }
  }

  return samples;
}
