import { NextResponse } from "next/server";
import { compress } from "@/lib/codec/spectral-compress";
import { analyzeCompressibility } from "@/lib/codec/spectral-compress";
import { byteToWavelength } from "@/lib/codec/photonic-transform";

export async function POST(request: Request) {
  try {
    const { data } = await request.json();

    if (typeof data !== "string" || data.length === 0) {
      return NextResponse.json(
        { error: "data must be a non-empty string" },
        { status: 400 }
      );
    }

    // Limit input size for the demo
    if (data.length > 100_000) {
      return NextResponse.json(
        { error: "Input too large (max 100KB)" },
        { status: 400 }
      );
    }

    const raw = new TextEncoder().encode(data);
    const compressed = compress(raw);
    const analysis = analyzeCompressibility(raw);

    // Build spectrum data for visualization
    const histogram = new Map<number, number>();
    for (let i = 0; i < raw.length; i++) {
      const wl = Math.round(byteToWavelength(raw[i]));
      histogram.set(wl, (histogram.get(wl) || 0) + 1);
    }
    const spectrum = Array.from(histogram.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([wavelength, count]) => ({ wavelength, count }));

    const ratio = compressed.length / raw.length;

    return NextResponse.json({
      originalSize: raw.length,
      compressedSize: compressed.length,
      ratio: Math.round(ratio * 1000) / 1000,
      savings: `${Math.round((1 - ratio) * 100)}%`,
      spectrum,
      analysis: {
        uniqueBytes: analysis.uniqueBytes,
        entropyBits: analysis.entropyBits,
        spectralDensity: analysis.spectralDensity,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Compression failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
