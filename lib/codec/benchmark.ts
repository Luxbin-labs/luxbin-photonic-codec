/**
 * Benchmark Framework — Compare PWDC against standard compression.
 *
 * Compares:
 * 1. PWDC (Photonic Wavelength Division Compression)
 * 2. Simple RLE (Run-Length Encoding) — baseline
 * 3. Raw (no compression) — reference
 *
 * For video frame sequences, also benchmarks delta encoding modes.
 */

import { compress, decompress } from "./spectral-compress";
import { compressFrameSequence, decompressFrameSequence } from "./delta-spectral";
import type { BenchmarkResult } from "../types";

/**
 * Simple Run-Length Encoding for baseline comparison.
 */
function rleCompress(data: Uint8Array): Uint8Array {
  if (data.length === 0) return new Uint8Array(0);

  const output: number[] = [];
  let current = data[0];
  let count = 1;

  for (let i = 1; i < data.length; i++) {
    if (data[i] === current && count < 255) {
      count++;
    } else {
      output.push(count, current);
      current = data[i];
      count = 1;
    }
  }
  output.push(count, current);

  return new Uint8Array(output);
}

function rleDecompress(data: Uint8Array): Uint8Array {
  const output: number[] = [];
  for (let i = 0; i < data.length; i += 2) {
    const count = data[i];
    const value = data[i + 1];
    for (let j = 0; j < count; j++) {
      output.push(value);
    }
  }
  return new Uint8Array(output);
}

/**
 * Benchmark a single data buffer across algorithms.
 */
export function benchmarkSingle(data: Uint8Array): BenchmarkResult[] {
  const results: BenchmarkResult[] = [];

  // Raw (no compression)
  results.push({
    algorithm: "Raw (uncompressed)",
    originalSize: data.length,
    compressedSize: data.length,
    ratio: 1,
    compressTime: 0,
    decompressTime: 0,
    lossless: true,
  });

  // RLE
  {
    const start = performance.now();
    const compressed = rleCompress(data);
    const compressTime = performance.now() - start;

    const dStart = performance.now();
    const restored = rleDecompress(compressed);
    const decompressTime = performance.now() - dStart;

    let lossless = restored.length === data.length;
    if (lossless) {
      for (let i = 0; i < data.length; i++) {
        if (restored[i] !== data[i]) { lossless = false; break; }
      }
    }

    results.push({
      algorithm: "RLE (Run-Length)",
      originalSize: data.length,
      compressedSize: compressed.length,
      ratio: Math.round((compressed.length / data.length) * 1000) / 1000,
      compressTime: Math.round(compressTime * 100) / 100,
      decompressTime: Math.round(decompressTime * 100) / 100,
      lossless,
    });
  }

  // PWDC
  {
    const start = performance.now();
    const compressed = compress(data);
    const compressTime = performance.now() - start;

    const dStart = performance.now();
    const restored = decompress(compressed);
    const decompressTime = performance.now() - dStart;

    let lossless = restored.length === data.length;
    if (lossless) {
      for (let i = 0; i < data.length; i++) {
        if (restored[i] !== data[i]) { lossless = false; break; }
      }
    }

    results.push({
      algorithm: "PWDC (Photonic)",
      originalSize: data.length,
      compressedSize: compressed.length,
      ratio: Math.round((compressed.length / data.length) * 1000) / 1000,
      compressTime: Math.round(compressTime * 100) / 100,
      decompressTime: Math.round(decompressTime * 100) / 100,
      lossless,
    });
  }

  return results;
}

/**
 * Benchmark frame sequence compression.
 */
export function benchmarkFrames(frames: Uint8Array[]): BenchmarkResult[] {
  const totalOriginal = frames.reduce((sum, f) => sum + f.length, 0);
  const results: BenchmarkResult[] = [];

  // Raw
  results.push({
    algorithm: "Raw frames",
    originalSize: totalOriginal,
    compressedSize: totalOriginal,
    ratio: 1,
    compressTime: 0,
    decompressTime: 0,
    lossless: true,
  });

  // Per-frame PWDC (no delta encoding)
  {
    const start = performance.now();
    let totalCompressed = 0;
    const compressedFrames: Uint8Array[] = [];
    for (const frame of frames) {
      const c = compress(frame);
      totalCompressed += c.length;
      compressedFrames.push(c);
    }
    const compressTime = performance.now() - start;

    const dStart = performance.now();
    for (const c of compressedFrames) {
      decompress(c);
    }
    const decompressTime = performance.now() - dStart;

    results.push({
      algorithm: "PWDC per-frame",
      originalSize: totalOriginal,
      compressedSize: totalCompressed,
      ratio: Math.round((totalCompressed / totalOriginal) * 1000) / 1000,
      compressTime: Math.round(compressTime * 100) / 100,
      decompressTime: Math.round(decompressTime * 100) / 100,
      lossless: true,
    });
  }

  // Delta-spectral PWDC
  {
    const start = performance.now();
    const compressed = compressFrameSequence(frames);
    const compressTime = performance.now() - start;

    const dStart = performance.now();
    const restored = decompressFrameSequence(compressed);
    const decompressTime = performance.now() - dStart;

    let lossless = restored.length === frames.length;
    if (lossless) {
      for (let f = 0; f < frames.length; f++) {
        if (restored[f].length !== frames[f].length) { lossless = false; break; }
        for (let i = 0; i < frames[f].length; i++) {
          if (restored[f][i] !== frames[f][i]) { lossless = false; break; }
        }
        if (!lossless) break;
      }
    }

    results.push({
      algorithm: "PWDC delta-spectral",
      originalSize: totalOriginal,
      compressedSize: compressed.length,
      ratio: Math.round((compressed.length / totalOriginal) * 1000) / 1000,
      compressTime: Math.round(compressTime * 100) / 100,
      decompressTime: Math.round(decompressTime * 100) / 100,
      lossless,
    });
  }

  return results;
}

/**
 * Generate different types of test data for benchmarking.
 */
export function generateTestData(): Record<string, Uint8Array> {
  const datasets: Record<string, Uint8Array> = {};

  // Highly compressible: repeated pattern
  const repeated = new Uint8Array(4096);
  for (let i = 0; i < repeated.length; i++) {
    repeated[i] = i % 4 === 0 ? 100 : i % 4 === 1 ? 120 : i % 4 === 2 ? 100 : 130;
  }
  datasets["Repeated pattern (4KB)"] = repeated;

  // Gradient: simulates smooth video region
  const gradient = new Uint8Array(4096);
  for (let i = 0; i < gradient.length; i++) {
    gradient[i] = Math.floor((i / gradient.length) * 200) + 28;
  }
  datasets["Smooth gradient (4KB)"] = gradient;

  // Natural-like: simulates real video frame data
  const natural = new Uint8Array(4096);
  let val = 128;
  for (let i = 0; i < natural.length; i++) {
    val += Math.floor(Math.random() * 5) - 2;
    val = Math.max(0, Math.min(255, val));
    natural[i] = val;
  }
  datasets["Natural signal (4KB)"] = natural;

  // Random: incompressible baseline
  const random = new Uint8Array(4096);
  for (let i = 0; i < random.length; i++) {
    random[i] = Math.floor(Math.random() * 256);
  }
  datasets["Random noise (4KB)"] = random;

  // Sparse: mostly zeros with spikes (simulates dark video frame)
  const sparse = new Uint8Array(4096);
  for (let i = 0; i < 100; i++) {
    sparse[Math.floor(Math.random() * sparse.length)] = Math.floor(Math.random() * 200) + 55;
  }
  datasets["Sparse data (4KB)"] = sparse;

  return datasets;
}
