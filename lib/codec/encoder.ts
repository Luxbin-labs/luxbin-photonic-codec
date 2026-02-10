/**
 * PWDC Encoder — Full encoding pipeline.
 *
 * Usage:
 *   import { encode, decode } from './encoder';
 *   const compressed = encode(rawData);
 *   const restored = decode(compressed);
 *   assert(deepEqual(rawData, restored));
 */

import { compress, decompress, analyzeCompressibility } from "./spectral-compress";
import { compressFrameSequence, decompressFrameSequence, analyzeDeltaEfficiency } from "./delta-spectral";

export interface EncodeResult {
  compressed: Uint8Array;
  stats: {
    originalSize: number;
    compressedSize: number;
    ratio: number;
    savings: string;
  };
}

/**
 * Encode a single data buffer using PWDC.
 */
export function encode(data: Uint8Array): EncodeResult {
  const compressed = compress(data);
  const ratio = compressed.length / data.length;
  return {
    compressed,
    stats: {
      originalSize: data.length,
      compressedSize: compressed.length,
      ratio: Math.round(ratio * 1000) / 1000,
      savings: `${Math.round((1 - ratio) * 100)}%`,
    },
  };
}

/**
 * Decode PWDC compressed data.
 */
export function decode(compressed: Uint8Array): Uint8Array {
  return decompress(compressed);
}

/**
 * Encode a sequence of frames (video mode).
 */
export function encodeFrames(frames: Uint8Array[], keyframeInterval?: number): EncodeResult {
  const totalOriginal = frames.reduce((sum, f) => sum + f.length, 0);
  const compressed = compressFrameSequence(frames, keyframeInterval);
  const ratio = compressed.length / totalOriginal;
  return {
    compressed,
    stats: {
      originalSize: totalOriginal,
      compressedSize: compressed.length,
      ratio: Math.round(ratio * 1000) / 1000,
      savings: `${Math.round((1 - ratio) * 100)}%`,
    },
  };
}

/**
 * Decode a frame sequence.
 */
export function decodeFrames(compressed: Uint8Array): Uint8Array[] {
  return decompressFrameSequence(compressed);
}

/**
 * Generate synthetic video-like frame data for testing and demos.
 *
 * Simulates a video stream where:
 * - Each frame is a flat array of bytes (like a grayscale image)
 * - Frames have spatial correlation (adjacent pixels are similar)
 * - Consecutive frames have temporal correlation (small changes)
 * - Occasional scene changes cause larger deltas
 */
export function generateSyntheticFrames(options: {
  frameWidth?: number;
  frameHeight?: number;
  frameCount?: number;
  changeRate?: number;  // 0-1, how much each frame changes
  sceneChangeEvery?: number;
} = {}): Uint8Array[] {
  const {
    frameWidth = 64,
    frameHeight = 48,
    frameCount = 30,
    changeRate = 0.05,
    sceneChangeEvery = 15,
  } = options;

  const frameSize = frameWidth * frameHeight;
  const frames: Uint8Array[] = [];

  // Generate initial frame with spatial correlation
  let currentFrame = new Uint8Array(frameSize);
  let baseValue = Math.floor(Math.random() * 128) + 64;

  for (let y = 0; y < frameHeight; y++) {
    for (let x = 0; x < frameWidth; x++) {
      // Spatial gradient with noise
      const gradient = Math.floor((x / frameWidth) * 64 + (y / frameHeight) * 64);
      const noise = Math.floor(Math.random() * 16) - 8;
      currentFrame[y * frameWidth + x] = Math.max(0, Math.min(255, baseValue + gradient + noise));
    }
  }
  frames.push(new Uint8Array(currentFrame));

  // Generate subsequent frames with temporal correlation
  for (let f = 1; f < frameCount; f++) {
    const nextFrame = new Uint8Array(currentFrame);

    if (f % sceneChangeEvery === 0) {
      // Scene change — significant difference
      baseValue = Math.floor(Math.random() * 128) + 64;
      for (let y = 0; y < frameHeight; y++) {
        for (let x = 0; x < frameWidth; x++) {
          const gradient = Math.floor((x / frameWidth) * 64 + (y / frameHeight) * 64);
          const noise = Math.floor(Math.random() * 16) - 8;
          nextFrame[y * frameWidth + x] = Math.max(0, Math.min(255, baseValue + gradient + noise));
        }
      }
    } else {
      // Normal frame — small changes
      const numChanges = Math.floor(frameSize * changeRate);
      for (let i = 0; i < numChanges; i++) {
        const pos = Math.floor(Math.random() * frameSize);
        const delta = Math.floor(Math.random() * 10) - 5;
        nextFrame[pos] = Math.max(0, Math.min(255, nextFrame[pos] + delta));
      }
    }

    frames.push(nextFrame);
    currentFrame = nextFrame;
  }

  return frames;
}

export { analyzeCompressibility, analyzeDeltaEfficiency };
