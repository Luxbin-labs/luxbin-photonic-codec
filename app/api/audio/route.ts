import { NextRequest, NextResponse } from "next/server";
import { compressAudio, decompressAudio, analyzeAudio, generateTestSignal } from "@/lib/codec/audio-compress";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, signalType, durationSec } = body;

    if (action === "generate-and-compress") {
      const type = signalType || "sine";
      const duration = Math.min(durationSec || 1, 5); // Cap at 5 seconds
      const samples = generateTestSignal(type, duration);
      const result = compressAudio(samples);

      return NextResponse.json({
        signalType: type,
        duration,
        sampleCount: samples.length,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        ratio: result.ratio,
        savings: result.savings,
      });
    }

    if (action === "analyze") {
      const type = signalType || "sine";
      const duration = Math.min(durationSec || 1, 5);
      const samples = generateTestSignal(type, duration);
      const analysis = analyzeAudio(samples);

      return NextResponse.json({
        signalType: type,
        ...analysis,
      });
    }

    if (action === "roundtrip") {
      // Compress then decompress, measure fidelity
      const type = signalType || "sine";
      const duration = Math.min(durationSec || 0.5, 2);
      const original = generateTestSignal(type, duration);
      const compressed = compressAudio(original);
      const recovered = decompressAudio(compressed.compressed);

      // Calculate error (should be zero for lossless)
      let maxError = 0;
      let mse = 0;
      const sampleCount = Math.min(original.length, recovered.length);
      for (let i = 0; i < sampleCount; i++) {
        const err = Math.abs(original[i] - recovered[i]);
        if (err > maxError) maxError = err;
        mse += err * err;
      }
      mse /= sampleCount;

      return NextResponse.json({
        signalType: type,
        originalSamples: original.length,
        recoveredSamples: recovered.length,
        originalSize: compressed.originalSize,
        compressedSize: compressed.compressedSize,
        ratio: compressed.ratio,
        savings: compressed.savings,
        maxError: Math.round(maxError * 100000) / 100000,
        mse: Math.round(mse * 1000000) / 1000000,
        lossless: maxError < 0.001,
      });
    }

    if (action === "benchmark-all") {
      const types = ["sine", "silence", "noise", "speech-like"] as const;
      const duration = Math.min(durationSec || 1, 3);
      const results = types.map((type) => {
        const samples = generateTestSignal(type, duration);
        const compressed = compressAudio(samples);
        const analysis = analyzeAudio(samples);
        return {
          signalType: type,
          sampleCount: samples.length,
          duration,
          originalSize: compressed.originalSize,
          compressedSize: compressed.compressedSize,
          ratio: compressed.ratio,
          savings: compressed.savings,
          peakAmplitude: analysis.peakAmplitude,
          rmsLevel: analysis.rmsLevel,
          silenceRatio: analysis.silenceRatio,
        };
      });

      return NextResponse.json({ results });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
