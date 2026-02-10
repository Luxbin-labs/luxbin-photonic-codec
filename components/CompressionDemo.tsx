"use client";

import { useState } from "react";
import { ArrowRight, Zap, BarChart3 } from "lucide-react";
import SpectrumVisualizer from "./SpectrumVisualizer";

interface CompressResult {
  originalSize: number;
  compressedSize: number;
  ratio: number;
  savings: string;
  spectrum: Array<{ wavelength: number; count: number }>;
  analysis: {
    uniqueBytes: number;
    entropyBits: number;
    spectralDensity: number;
  };
}

export default function CompressionDemo() {
  const [input, setInput] = useState("LUXBIN photonic codec compresses data using wavelength division multiplexing!");
  const [result, setResult] = useState<CompressResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCompress = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/compress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: input }),
      });
      const json = await res.json();
      setResult(json);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="rounded-lg border border-white/10 bg-black/40 p-5">
        <label className="mb-2 block text-sm font-medium text-slate-400">
          Input Data
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full rounded-md border border-white/10 bg-black/60 p-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-purple-500/50 focus:outline-none"
          rows={4}
          placeholder="Enter text data to compress..."
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {new TextEncoder().encode(input).length} bytes
          </span>
          <button
            onClick={handleCompress}
            disabled={loading || !input.trim()}
            className="flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500 disabled:opacity-50"
          >
            <Zap className="h-4 w-4" />
            {loading ? "Compressing..." : "Compress with PWDC"}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              label="Original"
              value={`${result.originalSize}B`}
              sub="input size"
            />
            <StatCard
              label="Compressed"
              value={`${result.compressedSize}B`}
              sub="PWDC output"
              highlight
            />
            <StatCard
              label="Ratio"
              value={`${(result.ratio * 100).toFixed(1)}%`}
              sub="of original"
            />
            <StatCard
              label="Savings"
              value={result.savings}
              sub="space saved"
              highlight
            />
          </div>

          {/* Analysis */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-black/40 p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
                <BarChart3 className="h-4 w-4 text-purple-400" />
                Spectral Analysis
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Unique byte values</span>
                  <span className="font-mono text-slate-200">
                    {result.analysis.uniqueBytes} / 256
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Shannon entropy</span>
                  <span className="font-mono text-slate-200">
                    {result.analysis.entropyBits} bits/byte
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Spectral density</span>
                  <span className="font-mono text-slate-200">
                    {(result.analysis.spectralDensity * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Pipeline visualization */}
            <div className="rounded-lg border border-white/10 bg-black/40 p-5">
              <h3 className="mb-3 text-sm font-medium text-slate-300">
                PWDC Pipeline
              </h3>
              <div className="flex items-center justify-between text-xs">
                <PipelineStep label="Raw Bytes" size={result.originalSize} />
                <ArrowRight className="h-4 w-4 text-purple-400" />
                <PipelineStep label="Wavelength Map" size={null} />
                <ArrowRight className="h-4 w-4 text-purple-400" />
                <PipelineStep label="Spectral Cluster" size={null} />
                <ArrowRight className="h-4 w-4 text-purple-400" />
                <PipelineStep
                  label="PWDC Output"
                  size={result.compressedSize}
                  highlight
                />
              </div>
            </div>
          </div>

          {/* Spectrum */}
          <SpectrumVisualizer
            data={result.spectrum}
            height={180}
            label="Wavelength Distribution (input data mapped to visible spectrum)"
          />
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight
          ? "border-purple-500/30 bg-purple-500/10"
          : "border-white/10 bg-black/40"
      }`}
    >
      <div className="text-xs text-slate-500">{label}</div>
      <div
        className={`mt-1 text-2xl font-bold ${
          highlight ? "text-purple-300" : "text-white"
        }`}
      >
        {value}
      </div>
      <div className="text-xs text-slate-500">{sub}</div>
    </div>
  );
}

function PipelineStep({
  label,
  size,
  highlight = false,
}: {
  label: string;
  size: number | null;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded px-2 py-1.5 text-center ${
        highlight ? "bg-purple-500/20 text-purple-300" : "bg-white/5 text-slate-400"
      }`}
    >
      <div className="font-medium">{label}</div>
      {size !== null && (
        <div className="mt-0.5 font-mono text-[10px] opacity-70">
          {size}B
        </div>
      )}
    </div>
  );
}
