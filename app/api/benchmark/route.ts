import { NextResponse } from "next/server";
import { benchmarkSingle, benchmarkFrames, generateTestData } from "@/lib/codec/benchmark";
import { generateSyntheticFrames } from "@/lib/codec/encoder";

export async function POST() {
  try {
    // Run single-buffer benchmarks
    const testData = generateTestData();
    const singleBuffer: Record<string, ReturnType<typeof benchmarkSingle>> = {};
    for (const [name, data] of Object.entries(testData)) {
      singleBuffer[name] = benchmarkSingle(data);
    }

    // Run frame sequence benchmark
    const frames = generateSyntheticFrames({
      frameWidth: 64,
      frameHeight: 48,
      frameCount: 30,
      changeRate: 0.05,
    });
    const frameSequence = benchmarkFrames(frames);

    return NextResponse.json({
      singleBuffer,
      frameSequence,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Benchmark failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
