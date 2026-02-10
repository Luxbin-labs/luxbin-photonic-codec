"use client";

import { useState } from "react";
import { Play, BarChart3, Film } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BenchmarkChart from "@/components/BenchmarkChart";
import type { BenchmarkResult } from "@/lib/types";

export default function BenchmarkPage() {
  const [singleResults, setSingleResults] = useState<
    Record<string, BenchmarkResult[]>
  >({});
  const [frameResults, setFrameResults] = useState<BenchmarkResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runBenchmarks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/benchmark", { method: "POST" });
      const json = await res.json();
      setSingleResults(json.singleBuffer);
      setFrameResults(json.frameSequence);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const hasResults =
    Object.keys(singleResults).length > 0 || frameResults.length > 0;

  return (
    <>
      <Navbar />
      <main className="pt-16">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-white">
                Compression Benchmarks
              </h1>
              <p className="text-slate-400">
                Compare PWDC against standard compression algorithms on
                different data types.
              </p>
            </div>
            <button
              onClick={runBenchmarks}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-500 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              {loading ? "Running..." : "Run Benchmarks"}
            </button>
          </div>

          {!hasResults && !loading && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-black/40 py-24 text-center">
              <BarChart3 className="mb-4 h-12 w-12 text-slate-600" />
              <p className="text-lg text-slate-400">
                Click &ldquo;Run Benchmarks&rdquo; to compare algorithms
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Tests run on 5 data types + a 30-frame video simulation
              </p>
            </div>
          )}

          {/* Single buffer benchmarks */}
          {Object.keys(singleResults).length > 0 && (
            <section className="mb-12">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-white">
                <BarChart3 className="h-5 w-5 text-purple-400" />
                Single Buffer Compression
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                {Object.entries(singleResults).map(([name, results]) => (
                  <BenchmarkChart
                    key={name}
                    results={results}
                    metric="ratio"
                    title={name}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Frame sequence benchmarks */}
          {frameResults.length > 0 && (
            <section>
              <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-white">
                <Film className="h-5 w-5 text-cyan-400" />
                Video Frame Sequence (30 frames, 64x48 grayscale)
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                <BenchmarkChart
                  results={frameResults}
                  metric="ratio"
                  title="Compression Ratio"
                />
                <BenchmarkChart
                  results={frameResults}
                  metric="compressTime"
                  title="Compression Speed"
                />
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
