import { NextRequest, NextResponse } from "next/server";
import {
  EM_BANDS,
  APP_FREQUENCIES,
  byteToEMWavelength,
  emWavelengthToByte,
  wavelengthToFrequency,
  frequencyToWavelength,
  formatFrequency,
  formatWavelength,
  identifyBand,
  type EMBandName,
} from "@/lib/codec/photonic-transform";
import { compress, decompress, analyzeCompressibility } from "@/lib/codec/spectral-compress";

export async function GET() {
  return NextResponse.json({
    bands: EM_BANDS.map((b) => ({
      name: b.name,
      label: b.label,
      color: b.color,
      useCases: b.useCases,
      minFrequency: formatFrequency(b.minFrequency),
      maxFrequency: formatFrequency(b.maxFrequency),
      minWavelength: formatWavelength(b.minWavelength || 1e-15),
      maxWavelength: formatWavelength(b.maxWavelength),
    })),
    applications: APP_FREQUENCIES.map((a) => ({
      name: a.name,
      label: a.label,
      band: a.band,
      description: a.description,
      minFreq: formatFrequency(a.minFreq),
      maxFreq: formatFrequency(a.maxFreq),
      minWavelength: formatWavelength(frequencyToWavelength(a.maxFreq)),
      maxWavelength: formatWavelength(frequencyToWavelength(a.minFreq)),
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "map-byte") {
      const { byte, band } = body;
      const b = Math.max(0, Math.min(255, Math.round(byte || 0)));
      const bandName = (band || "visible") as EMBandName;
      const wl = byteToEMWavelength(b, bandName);
      const freq = wavelengthToFrequency(wl);
      return NextResponse.json({
        byte: b,
        band: bandName,
        wavelength: wl,
        wavelengthLabel: formatWavelength(wl),
        frequency: freq,
        frequencyLabel: formatFrequency(freq),
      });
    }

    if (action === "map-all-bands") {
      const { byte } = body;
      const b = Math.max(0, Math.min(255, Math.round(byte || 0)));
      const results = EM_BANDS.map((band) => {
        const wl = byteToEMWavelength(b, band.name);
        const freq = wavelengthToFrequency(wl);
        return {
          band: band.name,
          label: band.label,
          color: band.color,
          wavelength: wl,
          wavelengthLabel: formatWavelength(wl),
          frequency: freq,
          frequencyLabel: formatFrequency(freq),
        };
      });
      return NextResponse.json({ byte: b, mappings: results });
    }

    if (action === "compress-in-band") {
      // Compress test data using a specific EM band mapping
      const { band, dataType } = body;
      const bandName = (band || "visible") as EMBandName;

      // Generate test data
      let testData: Uint8Array;
      switch (dataType || "gradient") {
        case "gradient": {
          testData = new Uint8Array(1024);
          for (let i = 0; i < 1024; i++) testData[i] = i % 256;
          break;
        }
        case "repeated": {
          testData = new Uint8Array(1024);
          for (let i = 0; i < 1024; i++) testData[i] = i % 16;
          break;
        }
        case "random": {
          testData = new Uint8Array(1024);
          for (let i = 0; i < 1024; i++) testData[i] = Math.floor(Math.random() * 256);
          break;
        }
        case "audio-like": {
          testData = new Uint8Array(1024);
          for (let i = 0; i < 1024; i++) testData[i] = Math.round(128 + 100 * Math.sin(2 * Math.PI * i / 44));
          break;
        }
        default:
          testData = new Uint8Array(1024).fill(42);
      }

      const compressed = compress(testData);
      const analysis = analyzeCompressibility(testData);

      // Map first 32 bytes to the band for visualization
      const channelSamples = Array.from(testData.slice(0, 32)).map((b) => {
        const wl = byteToEMWavelength(b, bandName);
        return {
          byte: b,
          wavelength: wl,
          wavelengthLabel: formatWavelength(wl),
          frequency: wavelengthToFrequency(wl),
          frequencyLabel: formatFrequency(wavelengthToFrequency(wl)),
        };
      });

      return NextResponse.json({
        band: bandName,
        dataType: dataType || "gradient",
        originalSize: testData.length,
        compressedSize: compressed.length,
        ratio: Math.round((compressed.length / testData.length) * 1000) / 1000,
        savings: `${Math.round((1 - compressed.length / testData.length) * 100)}%`,
        analysis,
        channelSamples,
      });
    }

    if (action === "quantum-internet-channels") {
      // Show how PWDC maps to quantum internet infrastructure
      const channels = [
        { name: "QKD-BB84", freq: 384.23e12, desc: "Quantum Key Distribution (BB84 protocol)" },
        { name: "QKD-E91", freq: 430.5e12, desc: "Entanglement-based QKD" },
        { name: "Telecom-C", freq: 193.1e12, desc: "ITU-T C-band DWDM (fiber backbone)" },
        { name: "Telecom-L", freq: 186.4e12, desc: "ITU-T L-band DWDM (extended fiber)" },
        { name: "Free-space", freq: 550e12, desc: "Free-space optical quantum link" },
        { name: "Satellite-QKD", freq: 351e12, desc: "Satellite quantum key relay (850nm)" },
        { name: "Entangle-IR", freq: 282e12, desc: "Entangled photon pair source (1064nm)" },
        { name: "Ion-trap", freq: 755e12, desc: "Trapped-ion quantum network node (397nm)" },
      ];

      const mapped = channels.map((ch) => {
        const wl = frequencyToWavelength(ch.freq);
        const band = identifyBand(wl);
        const byte = emWavelengthToByte(wl, band);
        return {
          ...ch,
          wavelength: wl,
          wavelengthLabel: formatWavelength(wl),
          frequencyLabel: formatFrequency(ch.freq),
          band,
          pwdcByte: byte,
        };
      });

      return NextResponse.json({ channels: mapped });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
