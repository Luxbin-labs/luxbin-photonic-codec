// Core types for the Photonic Wavelength Division Compression system

/** A single wavelength channel in the photonic spectrum (380-780nm visible range) */
export interface PhotonicChannel {
  wavelength: number;   // Center wavelength in nm
  amplitude: number;    // Signal amplitude (0-255 for byte data)
  phase: number;        // Phase offset for multiplexing
}

/** Spectral frame — one "snapshot" of data encoded in wavelength space */
export interface SpectralFrame {
  channels: PhotonicChannel[];
  byteLength: number;  // Original data length in bytes
}

/** Delta between two spectral frames */
export interface SpectralDelta {
  addedChannels: PhotonicChannel[];
  removedIndices: number[];
  modifiedChannels: { index: number; amplitude: number; phase: number }[];
}

/** Compressed output from the PWDC encoder */
export interface PWDCCompressed {
  magic: "PWDC";
  version: 1;
  originalSize: number;
  frameCount: number;
  channelBandwidth: number;      // nm per channel
  frames: CompressedFrame[];
}

/** A single compressed frame (either keyframe or delta) */
export interface CompressedFrame {
  type: "key" | "delta";
  data: number[];  // Packed channel data
}

/** Benchmark result comparing algorithms */
export interface BenchmarkResult {
  algorithm: string;
  originalSize: number;
  compressedSize: number;
  ratio: number;
  compressTime: number;    // ms
  decompressTime: number;  // ms
  lossless: boolean;
}

/** LLL script execution result */
export interface LLLResult {
  output: string[];
  steps: number;
  error: string | null;
}
