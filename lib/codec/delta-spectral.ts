/**
 * Delta-Spectral Encoding — Frame-to-frame compression for video streams.
 *
 * In video streaming, consecutive frames share 85-95% of their data.
 * Instead of compressing each frame independently, we encode the
 * spectral difference between frames.
 *
 * This is conceptually similar to P-frames in H.264/HEVC, but operates
 * in wavelength space rather than pixel space:
 *
 * - Keyframe: Full spectral representation (like an I-frame)
 * - Delta frame: Only the spectral channels that changed
 *
 * The photonic advantage: Wavelength-space deltas are naturally sparser
 * than pixel-space deltas because the histogram changes less than
 * individual pixel values across frames.
 */

import { compress, decompress } from "./spectral-compress";

/** Encoded delta between two frames */
interface DeltaFrame {
  // Positions where bytes differ
  positions: Uint32Array;
  // New values at those positions
  values: Uint8Array;
}

/**
 * Compute the delta between two frames.
 * Returns only the changed positions and their new values.
 */
export function computeDelta(previous: Uint8Array, current: Uint8Array): DeltaFrame {
  const positions: number[] = [];
  const values: number[] = [];

  const minLen = Math.min(previous.length, current.length);
  for (let i = 0; i < minLen; i++) {
    if (previous[i] !== current[i]) {
      positions.push(i);
      values.push(current[i]);
    }
  }

  // Handle size difference
  for (let i = minLen; i < current.length; i++) {
    positions.push(i);
    values.push(current[i]);
  }

  return {
    positions: new Uint32Array(positions),
    values: new Uint8Array(values),
  };
}

/**
 * Apply a delta to a previous frame to reconstruct the current frame.
 */
export function applyDelta(previous: Uint8Array, delta: DeltaFrame, newLength: number): Uint8Array {
  const result = new Uint8Array(newLength);
  result.set(previous.slice(0, newLength));

  for (let i = 0; i < delta.positions.length; i++) {
    result[delta.positions[i]] = delta.values[i];
  }

  return result;
}

/**
 * Compress a sequence of frames using delta-spectral encoding.
 *
 * Strategy:
 * - Every `keyframeInterval` frames, emit a full keyframe
 * - Between keyframes, emit delta frames
 * - Delta frames are themselves PWDC-compressed for additional savings
 *
 * Returns a packed binary stream.
 */
export function compressFrameSequence(
  frames: Uint8Array[],
  keyframeInterval: number = 10
): Uint8Array {
  if (frames.length === 0) return new Uint8Array(0);

  const chunks: Uint8Array[] = [];
  const header = new Uint8Array(8);
  const headerView = new DataView(header.buffer);
  headerView.setUint32(0, frames.length, true);
  headerView.setUint32(4, keyframeInterval, true);
  chunks.push(header);

  let referenceFrame: Uint8Array | null = null;

  for (let i = 0; i < frames.length; i++) {
    const isKeyframe = i % keyframeInterval === 0;

    if (isKeyframe) {
      // Keyframe: full PWDC compression
      const compressed = compress(frames[i]);
      const frameHeader = new Uint8Array(9);
      const fhView = new DataView(frameHeader.buffer);
      frameHeader[0] = 0x4b; // 'K' for keyframe
      fhView.setUint32(1, compressed.length, true);
      fhView.setUint32(5, frames[i].length, true);
      chunks.push(frameHeader);
      chunks.push(compressed);
      referenceFrame = frames[i];
    } else {
      // Delta frame
      const delta = computeDelta(referenceFrame!, frames[i]);
      const changeRatio = delta.positions.length / frames[i].length;

      // If more than 50% changed, send as keyframe instead
      if (changeRatio > 0.5) {
        const compressed = compress(frames[i]);
        const frameHeader = new Uint8Array(9);
        const fhView = new DataView(frameHeader.buffer);
        frameHeader[0] = 0x4b; // 'K'
        fhView.setUint32(1, compressed.length, true);
        fhView.setUint32(5, frames[i].length, true);
        chunks.push(frameHeader);
        chunks.push(compressed);
        referenceFrame = frames[i];
      } else {
        // Pack delta: positions + values, then PWDC compress the values
        const compressedValues = compress(delta.values);
        // Pack positions as uint32 array
        const posBytes = new Uint8Array(delta.positions.buffer);

        const frameHeader = new Uint8Array(13);
        const fhView = new DataView(frameHeader.buffer);
        frameHeader[0] = 0x44; // 'D' for delta
        fhView.setUint32(1, delta.positions.length, true); // number of changes
        fhView.setUint32(5, posBytes.length, true);
        fhView.setUint32(9, compressedValues.length, true);
        chunks.push(frameHeader);
        chunks.push(posBytes);
        chunks.push(compressedValues);
      }
    }
  }

  // Concatenate all chunks
  const totalSize = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalSize);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

/**
 * Decompress a delta-spectral frame sequence.
 */
export function decompressFrameSequence(data: Uint8Array): Uint8Array[] {
  if (data.length === 0) return [];

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let offset = 0;

  const frameCount = view.getUint32(offset, true);
  offset += 4;
  offset += 4; // keyframeInterval (not needed for decompression)

  const frames: Uint8Array[] = [];
  let referenceFrame: Uint8Array | null = null;

  for (let i = 0; i < frameCount; i++) {
    const type = data[offset];
    offset += 1;

    if (type === 0x4b) {
      // Keyframe
      const compressedSize = view.getUint32(offset, true);
      offset += 4;
      offset += 4; // skip originalSize

      const compressed = data.slice(offset, offset + compressedSize);
      offset += compressedSize;

      const frame = decompress(compressed);
      frames.push(frame);
      referenceFrame = frame;
    } else if (type === 0x44) {
      // Delta frame
      const numChanges = view.getUint32(offset, true);
      offset += 4;
      const posSize = view.getUint32(offset, true);
      offset += 4;
      const valSize = view.getUint32(offset, true);
      offset += 4;

      const posBytes = data.slice(offset, offset + posSize);
      offset += posSize;

      const compressedValues = data.slice(offset, offset + valSize);
      offset += valSize;

      const positions = new Uint32Array(
        posBytes.buffer,
        posBytes.byteOffset,
        numChanges
      );
      const values = decompress(compressedValues);

      const frame = applyDelta(
        referenceFrame!,
        { positions, values },
        referenceFrame!.length
      );
      frames.push(frame);
    }
  }

  return frames;
}

/**
 * Calculate the delta compression ratio for a frame sequence.
 */
export function analyzeDeltaEfficiency(frames: Uint8Array[]): {
  frameCount: number;
  avgChangeRatio: number;
  peakChangeRatio: number;
  estimatedDeltaSavings: number;
} {
  if (frames.length < 2) {
    return { frameCount: frames.length, avgChangeRatio: 1, peakChangeRatio: 1, estimatedDeltaSavings: 0 };
  }

  let totalChanges = 0;
  let peakRatio = 0;

  for (let i = 1; i < frames.length; i++) {
    const delta = computeDelta(frames[i - 1], frames[i]);
    const ratio = delta.positions.length / frames[i].length;
    totalChanges += ratio;
    peakRatio = Math.max(peakRatio, ratio);
  }

  const avgRatio = totalChanges / (frames.length - 1);

  return {
    frameCount: frames.length,
    avgChangeRatio: Math.round(avgRatio * 1000) / 1000,
    peakChangeRatio: Math.round(peakRatio * 1000) / 1000,
    estimatedDeltaSavings: Math.round((1 - avgRatio) * 100),
  };
}
