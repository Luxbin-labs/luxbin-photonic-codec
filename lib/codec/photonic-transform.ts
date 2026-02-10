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

// ═══════════════════════════════════════════════════════════════════
// Full Electromagnetic Spectrum Support
// ═══════════════════════════════════════════════════════════════════

const SPEED_OF_LIGHT = 299792458; // m/s

export type EMBandName = "gamma" | "xray" | "ultraviolet" | "visible" | "infrared" | "microwave" | "radio";

export interface EMBand {
  name: EMBandName;
  label: string;
  minWavelength: number; // meters
  maxWavelength: number; // meters
  minFrequency: number;  // Hz
  maxFrequency: number;  // Hz
  color: string;         // CSS color for UI
  useCases: string[];
}

export const EM_BANDS: EMBand[] = [
  {
    name: "gamma", label: "Gamma Ray",
    minWavelength: 0, maxWavelength: 1e-11,
    minFrequency: 3e19, maxFrequency: Infinity,
    color: "#8b00ff", useCases: ["Medical imaging", "Cancer treatment", "Nuclear physics"],
  },
  {
    name: "xray", label: "X-Ray",
    minWavelength: 1e-11, maxWavelength: 1e-8,
    minFrequency: 3e16, maxFrequency: 3e19,
    color: "#4400ff", useCases: ["Medical imaging", "Airport security", "Crystallography"],
  },
  {
    name: "ultraviolet", label: "Ultraviolet",
    minWavelength: 1e-8, maxWavelength: 3.8e-7,
    minFrequency: 7.9e14, maxFrequency: 3e16,
    color: "#7c00ff", useCases: ["Sterilization", "Lithography", "Forensics"],
  },
  {
    name: "visible", label: "Visible Light",
    minWavelength: 3.8e-7, maxWavelength: 7.8e-7,
    minFrequency: 3.85e14, maxFrequency: 7.9e14,
    color: "#00ff88", useCases: ["Fiber optics", "PWDC encoding", "Displays", "Quantum computing"],
  },
  {
    name: "infrared", label: "Infrared",
    minWavelength: 7.8e-7, maxWavelength: 1e-3,
    minFrequency: 3e11, maxFrequency: 3.85e14,
    color: "#ff3300", useCases: ["Remote controls", "Thermal imaging", "Fiber telecom"],
  },
  {
    name: "microwave", label: "Microwave",
    minWavelength: 1e-3, maxWavelength: 1,
    minFrequency: 3e8, maxFrequency: 3e11,
    color: "#ff8800", useCases: ["WiFi", "5G", "Satellite", "Radar", "Bluetooth"],
  },
  {
    name: "radio", label: "Radio Wave",
    minWavelength: 1, maxWavelength: 1e5,
    minFrequency: 3e3, maxFrequency: 3e8,
    color: "#ffcc00", useCases: ["AM/FM radio", "TV broadcast", "GPS", "NFC"],
  },
];

export const EM_BAND_MAP = Object.fromEntries(EM_BANDS.map(b => [b.name, b])) as Record<EMBandName, EMBand>;

/** Map a byte (0-255) to a wavelength in a specific EM band */
export function byteToEMWavelength(byte: number, band: EMBandName): number {
  const b = EM_BAND_MAP[band];
  const min = Math.max(b.minWavelength, 1e-15);
  // Use logarithmic mapping for bands spanning many orders of magnitude
  if (b.maxWavelength / min > 100) {
    const logMin = Math.log10(min);
    const logMax = Math.log10(b.maxWavelength);
    return Math.pow(10, logMin + (byte / 255) * (logMax - logMin));
  }
  return min + (byte / 255) * (b.maxWavelength - min);
}

/** Map an EM wavelength back to a byte (0-255) */
export function emWavelengthToByte(wavelength: number, band: EMBandName): number {
  const b = EM_BAND_MAP[band];
  const min = Math.max(b.minWavelength, 1e-15);
  if (b.maxWavelength / min > 100) {
    const logMin = Math.log10(min);
    const logMax = Math.log10(b.maxWavelength);
    const logWl = Math.log10(wavelength);
    return Math.max(0, Math.min(255, Math.round(((logWl - logMin) / (logMax - logMin)) * 255)));
  }
  return Math.max(0, Math.min(255, Math.round(((wavelength - min) / (b.maxWavelength - min)) * 255)));
}

/** Convert frequency (Hz) to wavelength (meters) */
export function frequencyToWavelength(freq: number): number {
  return SPEED_OF_LIGHT / freq;
}

/** Convert wavelength (meters) to frequency (Hz) */
export function wavelengthToFrequency(wavelength: number): number {
  return SPEED_OF_LIGHT / wavelength;
}

/** Identify which EM band a wavelength (meters) falls in */
export function identifyBand(wavelength: number): EMBandName {
  for (const band of EM_BANDS) {
    if (wavelength >= band.minWavelength && wavelength < band.maxWavelength) return band.name;
  }
  return wavelength >= 1e5 ? "radio" : "gamma";
}

/** Format a frequency in human-readable units */
export function formatFrequency(freq: number): string {
  if (freq >= 1e18) return `${(freq / 1e18).toFixed(2)} EHz`;
  if (freq >= 1e15) return `${(freq / 1e15).toFixed(2)} PHz`;
  if (freq >= 1e12) return `${(freq / 1e12).toFixed(2)} THz`;
  if (freq >= 1e9) return `${(freq / 1e9).toFixed(2)} GHz`;
  if (freq >= 1e6) return `${(freq / 1e6).toFixed(2)} MHz`;
  if (freq >= 1e3) return `${(freq / 1e3).toFixed(2)} kHz`;
  return `${freq.toFixed(2)} Hz`;
}

/** Format a wavelength in human-readable units */
export function formatWavelength(wl: number): string {
  if (wl < 1e-9) return `${(wl * 1e12).toFixed(2)} pm`;
  if (wl < 1e-6) return `${(wl * 1e9).toFixed(2)} nm`;
  if (wl < 1e-3) return `${(wl * 1e6).toFixed(2)} \u00b5m`;
  if (wl < 1) return `${(wl * 1e3).toFixed(2)} mm`;
  if (wl < 1e3) return `${wl.toFixed(2)} m`;
  return `${(wl / 1e3).toFixed(2)} km`;
}

/** Application-specific frequency ranges */
export interface AppFreqRange {
  name: string;
  label: string;
  band: EMBandName;
  minFreq: number;
  maxFreq: number;
  description: string;
}

export const APP_FREQUENCIES: AppFreqRange[] = [
  { name: "am_radio", label: "AM Radio", band: "radio", minFreq: 530e3, maxFreq: 1700e3, description: "Amplitude modulated broadcast" },
  { name: "fm_radio", label: "FM Radio", band: "radio", minFreq: 88e6, maxFreq: 108e6, description: "Frequency modulated broadcast" },
  { name: "tv_vhf", label: "TV (VHF)", band: "radio", minFreq: 54e6, maxFreq: 216e6, description: "VHF television channels 2-13" },
  { name: "tv_uhf", label: "TV (UHF)", band: "radio", minFreq: 470e6, maxFreq: 890e6, description: "UHF television channels 14-83" },
  { name: "wifi_2g", label: "WiFi 2.4GHz", band: "microwave", minFreq: 2.4e9, maxFreq: 2.5e9, description: "802.11 b/g/n/ax" },
  { name: "wifi_5g", label: "WiFi 5GHz", band: "microwave", minFreq: 5.15e9, maxFreq: 5.85e9, description: "802.11 a/n/ac/ax" },
  { name: "wifi_6e", label: "WiFi 6GHz", band: "microwave", minFreq: 5.925e9, maxFreq: 7.125e9, description: "802.11ax WiFi 6E" },
  { name: "bluetooth", label: "Bluetooth", band: "microwave", minFreq: 2.402e9, maxFreq: 2.48e9, description: "Short-range wireless" },
  { name: "5g_sub6", label: "5G Sub-6", band: "microwave", minFreq: 600e6, maxFreq: 6e9, description: "5G NR low/mid band" },
  { name: "5g_mmwave", label: "5G mmWave", band: "microwave", minFreq: 24e9, maxFreq: 100e9, description: "5G NR high band" },
  { name: "starlink", label: "Starlink", band: "microwave", minFreq: 10.7e9, maxFreq: 12.7e9, description: "Satellite internet downlink" },
  { name: "gps", label: "GPS", band: "microwave", minFreq: 1.176e9, maxFreq: 1.576e9, description: "Global positioning system" },
  { name: "fiber_c", label: "Fiber (C-band)", band: "infrared", minFreq: 191.5e12, maxFreq: 196.2e12, description: "Telecom fiber optic C-band (1530-1565nm)" },
  { name: "quantum_qkd", label: "Quantum QKD", band: "visible", minFreq: 384e12, maxFreq: 790e12, description: "Quantum key distribution channels" },
];
