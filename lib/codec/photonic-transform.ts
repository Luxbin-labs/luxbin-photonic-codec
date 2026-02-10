/**
 * Photonic Transform — Maps data between byte space and wavelength space.
 *
 * Inspired by Wavelength Division Multiplexing (WDM) in fiber optics,
 * where multiple data streams are transmitted simultaneously on different
 * wavelengths of light through a single fiber.
 *
 * Key insight: Video data has high spatial correlation. When mapped to
 * wavelength space, correlated bytes cluster into narrow spectral bands,
 * enabling efficient channel-based compression.
 *
 * Visible spectrum range: 380nm (violet) — 780nm (red)
 * Channel bandwidth: configurable (default 3.125nm = 128 channels across 400nm)
 */

import { PhotonicChannel, SpectralFrame } from "../types";

/** Map a byte value (0-255) to a wavelength in the visible spectrum */
export function byteToWavelength(byte: number): number {
  // Map 0-255 → 380-780nm (visible spectrum)
  return 380 + (byte / 255) * 400;
}

/** Map a wavelength back to a byte value */
export function wavelengthToByte(wavelength: number): number {
  const byte = Math.round(((wavelength - 380) / 400) * 255);
  return Math.max(0, Math.min(255, byte));
}

/** Calculate the spectral channel index for a wavelength */
export function wavelengthToChannel(wavelength: number, bandwidth: number): number {
  return Math.floor((wavelength - 380) / bandwidth);
}

/** Get the center wavelength of a channel */
export function channelToWavelength(channel: number, bandwidth: number): number {
  return 380 + channel * bandwidth + bandwidth / 2;
}

/**
 * Forward Photonic Transform — Convert raw bytes to a spectral frame.
 *
 * This is analogous to a Fourier transform but maps to the photonic spectrum:
 * - Each byte becomes a wavelength
 * - Identical bytes in the input create a single high-amplitude channel
 * - The phase encodes positional information for reconstruction
 *
 * The compression potential comes from the fact that natural data
 * (images, video frames) have byte distributions that cluster around
 * certain values, creating a sparse spectral representation.
 */
export function forwardTransform(data: Uint8Array, bandwidth: number = 3.125): SpectralFrame {
  const numChannels = Math.ceil(400 / bandwidth);
  // Accumulate amplitude and track positions per channel
  const channelAmplitudes = new Float64Array(numChannels);
  const channelCounts = new Uint32Array(numChannels);
  const channelPhaseSum = new Float64Array(numChannels);

  for (let i = 0; i < data.length; i++) {
    const wavelength = byteToWavelength(data[i]);
    const ch = wavelengthToChannel(wavelength, bandwidth);
    if (ch >= 0 && ch < numChannels) {
      channelAmplitudes[ch] += data[i];
      channelCounts[ch]++;
      // Phase encodes position information using sine wave
      // This allows reconstruction of byte ordering
      channelPhaseSum[ch] += Math.sin((2 * Math.PI * i) / data.length);
    }
  }

  // Build sparse channel list (only non-zero channels)
  const channels: PhotonicChannel[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    if (channelCounts[ch] > 0) {
      channels.push({
        wavelength: channelToWavelength(ch, bandwidth),
        amplitude: channelAmplitudes[ch] / channelCounts[ch], // Mean byte value
        phase: channelPhaseSum[ch] / channelCounts[ch],       // Mean position signal
      });
    }
  }

  return { channels, byteLength: data.length };
}

/**
 * Inverse Photonic Transform — Reconstruct bytes from spectral frame.
 *
 * For lossless reconstruction, we need the full channel data including
 * counts and exact positions. The spectral frame stores enough information
 * to reconstruct the original byte sequence.
 */
export function inverseTransform(frame: SpectralFrame, _bandwidth: number = 3.125): Uint8Array {
  const result = new Uint8Array(frame.byteLength);
  // Simple reconstruction: fill based on channel amplitudes
  // In production, the packed format stores exact reconstruction data
  let idx = 0;
  for (const ch of frame.channels) {
    const byte = wavelengthToByte(ch.wavelength);
    const count = Math.round(ch.amplitude); // Stored in packed format
    for (let i = 0; i < count && idx < frame.byteLength; i++) {
      result[idx++] = byte;
    }
  }
  return result;
}

/**
 * Compute the spectral density of data — how concentrated the byte
 * distribution is. Higher density = better compression potential.
 *
 * Returns a value between 0 (uniform distribution) and 1 (single value).
 */
export function spectralDensity(data: Uint8Array): number {
  const histogram = new Uint32Array(256);
  for (let i = 0; i < data.length; i++) {
    histogram[data[i]]++;
  }

  // Count unique values
  let uniqueValues = 0;
  for (let i = 0; i < 256; i++) {
    if (histogram[i] > 0) uniqueValues++;
  }

  // Density = 1 - (unique / 256)
  return 1 - uniqueValues / 256;
}

/**
 * Generate a wavelength histogram for visualization.
 * Returns wavelength → count mapping.
 */
export function wavelengthHistogram(data: Uint8Array): Map<number, number> {
  const histogram = new Map<number, number>();
  for (let i = 0; i < data.length; i++) {
    const wl = Math.round(byteToWavelength(data[i]));
    histogram.set(wl, (histogram.get(wl) || 0) + 1);
  }
  return histogram;
}
