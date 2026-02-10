/**
 * Spectral Compression — The core PWDC compression engine.
 *
 * Two encoding modes, automatically selected:
 *
 * Mode 0 (Symbol Table): When data has few unique bytes but low runs.
 *   Store a symbol table + packed indices (reduced bit-width per symbol).
 *   With N unique bytes, each position needs ceil(log2(N)) bits instead of 8.
 *
 * Mode 1 (RLE): When data has long runs of repeated values.
 *   Run-length encode the symbol index stream.
 *
 * The encoder tries both and picks whichever is smaller.
 * If neither beats raw data, falls back to raw passthrough (Mode 255).
 */

import { byteToWavelength } from "./photonic-transform";

const MAGIC = [0x50, 0x57, 0x44, 0x43]; // "PWDC"
const VERSION = 2;

/**
 * Compress data using Photonic Wavelength Division Compression.
 */
export function compress(data: Uint8Array): Uint8Array {
  if (data.length === 0) {
    return new Uint8Array([...MAGIC, VERSION, 0, 0, 0, 0, 0, 0]);
  }

  // Build frequency histogram
  const histogram = new Map<number, number>();
  for (let i = 0; i < data.length; i++) {
    histogram.set(data[i], (histogram.get(data[i]) || 0) + 1);
  }

  // Sort unique bytes by wavelength
  const uniqueBytes = Array.from(histogram.keys()).sort(
    (a, b) => byteToWavelength(a) - byteToWavelength(b)
  );

  const byteToIndex = new Map<number, number>();
  uniqueBytes.forEach((b, i) => byteToIndex.set(b, i));

  const bitsPerIndex = Math.max(1, Math.ceil(Math.log2(uniqueBytes.length || 1)));

  // Try Mode 0: Symbol table + packed indices (bit-packed)
  const mode0 = encodeMode0(data, uniqueBytes, byteToIndex, histogram, bitsPerIndex);

  // Try Mode 1: Symbol table + RLE
  const mode1 = encodeMode1(data, uniqueBytes, byteToIndex, histogram, bitsPerIndex);

  // Pick the smallest
  const best = mode0.length <= mode1.length ? mode0 : mode1;

  // If compressed is larger than raw, use passthrough
  if (best.length >= data.length + 10) {
    return encodeRaw(data);
  }

  return best;
}

/** Mode 0: Symbol table + bit-packed index stream */
function encodeMode0(
  data: Uint8Array,
  uniqueBytes: number[],
  byteToIndex: Map<number, number>,
  _histogram: Map<number, number>,
  bitsPerIndex: number
): Uint8Array {
  // Header: 4(magic) + 1(version) + 1(mode) + 4(origSize) + 2(uniqueCount)
  // Channel table: uniqueCount * 1 (just the byte value)
  // Packed data: ceil(data.length * bitsPerIndex / 8)
  const headerSize = 4 + 1 + 1 + 4 + 2;
  const channelTableSize = uniqueBytes.length;
  const packedDataSize = Math.ceil((data.length * bitsPerIndex) / 8);
  const totalSize = headerSize + channelTableSize + packedDataSize;

  const output = new Uint8Array(totalSize);
  const view = new DataView(output.buffer);
  let offset = 0;

  // Header
  output.set(MAGIC, 0); offset = 4;
  output[offset++] = VERSION;
  output[offset++] = 0; // Mode 0
  view.setUint32(offset, data.length, true); offset += 4;
  view.setUint16(offset, uniqueBytes.length, true); offset += 2;

  // Channel table (just byte values — lightweight)
  for (const byte of uniqueBytes) {
    output[offset++] = byte;
  }

  // Bit-pack the index stream
  let bitPos = 0;
  const packedStart = offset;
  for (let i = 0; i < data.length; i++) {
    const idx = byteToIndex.get(data[i])!;
    // Write bitsPerIndex bits at current position
    const byteOffset = packedStart + Math.floor(bitPos / 8);
    const bitOffset = bitPos % 8;

    // Write bits across potentially 2 bytes
    output[byteOffset] |= (idx << bitOffset) & 0xff;
    if (bitOffset + bitsPerIndex > 8) {
      output[byteOffset + 1] |= (idx >> (8 - bitOffset)) & 0xff;
    }
    if (bitOffset + bitsPerIndex > 16) {
      output[byteOffset + 2] |= (idx >> (16 - bitOffset)) & 0xff;
    }
    bitPos += bitsPerIndex;
  }

  return output;
}

/** Mode 1: Symbol table + RLE */
function encodeMode1(
  data: Uint8Array,
  uniqueBytes: number[],
  byteToIndex: Map<number, number>,
  _histogram: Map<number, number>,
  bitsPerIndex: number
): Uint8Array {
  // Build RLE runs
  const rleRuns: Array<{ index: number; count: number }> = [];
  let currentIndex = byteToIndex.get(data[0])!;
  let runCount = 1;

  for (let i = 1; i < data.length; i++) {
    const idx = byteToIndex.get(data[i])!;
    if (idx === currentIndex && runCount < 65535) {
      runCount++;
    } else {
      rleRuns.push({ index: currentIndex, count: runCount });
      currentIndex = idx;
      runCount = 1;
    }
  }
  rleRuns.push({ index: currentIndex, count: runCount });

  const runBytesPerIndex = Math.ceil(bitsPerIndex / 8);
  const headerSize = 4 + 1 + 1 + 4 + 2;
  const channelTableSize = uniqueBytes.length;
  const rleDataSize = 4 + rleRuns.length * (runBytesPerIndex + 2);
  const totalSize = headerSize + channelTableSize + rleDataSize;

  const output = new Uint8Array(totalSize);
  const view = new DataView(output.buffer);
  let offset = 0;

  // Header
  output.set(MAGIC, 0); offset = 4;
  output[offset++] = VERSION;
  output[offset++] = 1; // Mode 1
  view.setUint32(offset, data.length, true); offset += 4;
  view.setUint16(offset, uniqueBytes.length, true); offset += 2;

  // Channel table
  for (const byte of uniqueBytes) {
    output[offset++] = byte;
  }

  // RLE data
  view.setUint32(offset, rleRuns.length, true); offset += 4;
  for (const run of rleRuns) {
    if (runBytesPerIndex === 1) {
      output[offset++] = run.index;
    } else {
      view.setUint16(offset, run.index, true);
      offset += 2;
    }
    view.setUint16(offset, run.count, true);
    offset += 2;
  }

  return output.slice(0, offset);
}

/** Mode 255: Raw passthrough (when compression would expand data) */
function encodeRaw(data: Uint8Array): Uint8Array {
  const headerSize = 4 + 1 + 1 + 4;
  const output = new Uint8Array(headerSize + data.length);
  const view = new DataView(output.buffer);
  let offset = 0;

  output.set(MAGIC, 0); offset = 4;
  output[offset++] = VERSION;
  output[offset++] = 255; // Raw passthrough mode
  view.setUint32(offset, data.length, true); offset += 4;
  output.set(data, offset);

  return output;
}

/**
 * Decompress PWDC data back to original bytes.
 */
export function decompress(compressed: Uint8Array): Uint8Array {
  if (compressed.length < 10) {
    throw new Error("Invalid PWDC data: too short");
  }

  const view = new DataView(compressed.buffer, compressed.byteOffset, compressed.byteLength);
  let offset = 0;

  // Verify magic
  if (compressed[0] !== 0x50 || compressed[1] !== 0x57 || compressed[2] !== 0x44 || compressed[3] !== 0x43) {
    throw new Error("Invalid PWDC data: bad magic");
  }
  offset = 4;

  const version = compressed[offset++];
  if (version !== VERSION && version !== 1) {
    throw new Error(`Unsupported PWDC version: ${version}`);
  }

  // Version 1 compat (old format) — treat as mode 1 with bitsPerIndex field
  if (version === 1) {
    return decompressV1(compressed);
  }

  const mode = compressed[offset++];
  const originalSize = view.getUint32(offset, true); offset += 4;

  if (originalSize === 0) return new Uint8Array(0);

  if (mode === 255) {
    // Raw passthrough
    return compressed.slice(offset, offset + originalSize);
  }

  const uniqueCount = view.getUint16(offset, true); offset += 2;

  // Read channel table
  const uniqueBytes: number[] = [];
  for (let i = 0; i < uniqueCount; i++) {
    uniqueBytes.push(compressed[offset++]);
  }

  if (mode === 0) {
    // Bit-packed index stream
    return decompressMode0(compressed, offset, originalSize, uniqueBytes);
  } else if (mode === 1) {
    // RLE
    return decompressMode1(compressed, view, offset, originalSize, uniqueBytes);
  }

  throw new Error(`Unknown PWDC mode: ${mode}`);
}

function decompressMode0(
  compressed: Uint8Array,
  packedStart: number,
  originalSize: number,
  uniqueBytes: number[]
): Uint8Array {
  const bitsPerIndex = Math.max(1, Math.ceil(Math.log2(uniqueBytes.length || 1)));
  const mask = (1 << bitsPerIndex) - 1;
  const output = new Uint8Array(originalSize);
  let bitPos = 0;

  for (let i = 0; i < originalSize; i++) {
    const byteOffset = packedStart + Math.floor(bitPos / 8);
    const bitOffset = bitPos % 8;

    let idx = (compressed[byteOffset] >> bitOffset) & mask;
    if (bitOffset + bitsPerIndex > 8 && byteOffset + 1 < compressed.length) {
      idx |= ((compressed[byteOffset + 1] << (8 - bitOffset)) & mask);
      // Need to re-mask after OR
      idx &= mask;
    }
    if (bitOffset + bitsPerIndex > 16 && byteOffset + 2 < compressed.length) {
      idx |= ((compressed[byteOffset + 2] << (16 - bitOffset)) & mask);
      idx &= mask;
    }

    output[i] = uniqueBytes[idx];
    bitPos += bitsPerIndex;
  }

  return output;
}

function decompressMode1(
  compressed: Uint8Array,
  view: DataView,
  offset: number,
  originalSize: number,
  uniqueBytes: number[]
): Uint8Array {
  const bitsPerIndex = Math.max(1, Math.ceil(Math.log2(uniqueBytes.length || 1)));
  const runBytesPerIndex = Math.ceil(bitsPerIndex / 8);
  const numRuns = view.getUint32(offset, true); offset += 4;

  const output = new Uint8Array(originalSize);
  let outIdx = 0;

  for (let r = 0; r < numRuns; r++) {
    let index: number;
    if (runBytesPerIndex === 1) {
      index = compressed[offset++];
    } else {
      index = view.getUint16(offset, true);
      offset += 2;
    }
    const count = view.getUint16(offset, true); offset += 2;

    const byteVal = uniqueBytes[index];
    for (let i = 0; i < count && outIdx < originalSize; i++) {
      output[outIdx++] = byteVal;
    }
  }

  return output;
}

/** Decompress version 1 format (backward compat) */
function decompressV1(compressed: Uint8Array): Uint8Array {
  const view = new DataView(compressed.buffer, compressed.byteOffset, compressed.byteLength);
  let offset = 5; // skip magic + version

  const originalSize = view.getUint32(offset, true); offset += 4;
  if (originalSize === 0) return new Uint8Array(0);

  const uniqueCount = view.getUint16(offset, true); offset += 2;
  const bitsPerIndex = compressed[offset++];

  const uniqueBytes: number[] = [];
  for (let i = 0; i < uniqueCount; i++) {
    uniqueBytes.push(compressed[offset++]);
    offset += 4; // skip count
  }

  const runBytesPerIndex = Math.ceil(bitsPerIndex / 8);
  const numRuns = view.getUint32(offset, true); offset += 4;

  const output = new Uint8Array(originalSize);
  let outIdx = 0;

  for (let r = 0; r < numRuns; r++) {
    let index: number;
    if (runBytesPerIndex === 1) {
      index = compressed[offset++];
    } else {
      index = view.getUint16(offset, true);
      offset += 2;
    }
    const count = view.getUint16(offset, true); offset += 2;
    const byteVal = uniqueBytes[index];
    for (let i = 0; i < count && outIdx < originalSize; i++) {
      output[outIdx++] = byteVal;
    }
  }

  return output;
}

/**
 * Get compression statistics without performing full compression.
 */
export function analyzeCompressibility(data: Uint8Array): {
  uniqueBytes: number;
  entropyBits: number;
  spectralDensity: number;
  estimatedRatio: number;
  dominantWavelengths: Array<{ wavelength: number; frequency: number }>;
} {
  const histogram = new Uint32Array(256);
  for (let i = 0; i < data.length; i++) {
    histogram[data[i]]++;
  }

  let uniqueBytes = 0;
  let entropy = 0;
  const wavelengthFreqs: Array<{ wavelength: number; frequency: number }> = [];

  for (let i = 0; i < 256; i++) {
    if (histogram[i] > 0) {
      uniqueBytes++;
      const p = histogram[i] / data.length;
      entropy -= p * Math.log2(p);
      wavelengthFreqs.push({
        wavelength: Math.round(byteToWavelength(i)),
        frequency: histogram[i],
      });
    }
  }

  wavelengthFreqs.sort((a, b) => b.frequency - a.frequency);

  const spectralDensity = 1 - uniqueBytes / 256;
  const estimatedRatio = entropy / 8;

  return {
    uniqueBytes,
    entropyBits: Math.round(entropy * 100) / 100,
    spectralDensity: Math.round(spectralDensity * 1000) / 1000,
    estimatedRatio: Math.round(estimatedRatio * 1000) / 1000,
    dominantWavelengths: wavelengthFreqs.slice(0, 10),
  };
}
