"use client";

import { useState } from "react";
import { Volume2, Play, BarChart3, RefreshCw, CheckCircle, XCircle } from "lucide-react";

type SignalType = "sine" | "silence" | "noise" | "speech-like";

interface CompressResult {
  signalType: string;
  duration: number;
  sampleCount: number;
  originalSize: number;
  compressedSize: number;
  ratio: number;
  savings: string;
}

interface AnalysisResult {
  signalType: string;
  sampleCount: number;
  duration: number;
  peakAmplitude: number;
  rmsLevel: number;
  silenceRatio: number;
  wavelengthPeaks: Array<{ wavelength: number; count: number }>;
}

interface RoundtripResult {
  signalType: string;
  originalSamples: number;
  recoveredSamples: number;
  originalSize: number;
  compressedSize: number;
  ratio: number;
  savings: string;
  maxError: number;
  mse: number;
  lossless: boolean;
}

interface BenchmarkItem {
  signalType: string;
  sampleCount: number;
  duration: number;
  originalSize: number;
  compressedSize: number;
  ratio: number;
  savings: string;
  peakAmplitude: number;
  rmsLevel: number;
  silenceRatio: number;
}

const SIGNAL_DESCRIPTIONS: Record<SignalType, string> = {
  sine: "Pure 440Hz tone (A4 note) — highly compressible due to repeating waveform pattern",
  silence: "Near-silence with micro noise — extremely compressible (almost uniform data)",
  noise: "Random white noise — worst case for compression (maximum entropy)",
  "speech-like": "Simulated speech with formants — moderate compressibility",
};

function wavelengthToColor(wl: number): string {
  if (wl < 440) return `rgb(${Math.round(100 + (440 - wl) / 60 * 155)}, 0, 255)`;
  if (wl < 490) return `rgb(0, ${Math.round((wl - 440) / 50 * 255)}, 255)`;
  if (wl < 510) return `rgb(0, 255, ${Math.round(255 - (wl - 490) / 20 * 255)})`;
  if (wl < 580) return `rgb(${Math.round((wl - 510) / 70 * 255)}, 255, 0)`;
  if (wl < 645) return `rgb(255, ${Math.round(255 - (wl - 580) / 65 * 255)}, 0)`;
  return `rgb(255, 0, 0)`;
}

export default function AudioPage() {
  const [selectedSignal, setSelectedSignal] = useState<SignalType>("sine");
  const [duration, setDuration] = useState(1);
  const [compressResult, setCompressResult] = useState<CompressResult | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [roundtrip, setRoundtrip] = useState<RoundtripResult | null>(null);
  const [benchmark, setBenchmark] = useState<BenchmarkItem[] | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function runCompress() {
    setLoading("compress");
    const res = await fetch("/api/audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate-and-compress", signalType: selectedSignal, durationSec: duration }),
    });
    setCompressResult(await res.json());
    setLoading(null);
  }

  async function runAnalysis() {
    setLoading("analyze");
    const res = await fetch("/api/audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "analyze", signalType: selectedSignal, durationSec: duration }),
    });
    setAnalysis(await res.json());
    setLoading(null);
  }

  async function runRoundtrip() {
    setLoading("roundtrip");
    const res = await fetch("/api/audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "roundtrip", signalType: selectedSignal, durationSec: Math.min(duration, 2) }),
    });
    setRoundtrip(await res.json());
    setLoading(null);
  }

  async function runBenchmark() {
    setLoading("benchmark");
    const res = await fetch("/api/audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "benchmark-all", durationSec: duration }),
    });
    const data = await res.json();
    setBenchmark(data.results);
    setLoading(null);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 pt-24 pb-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-300">
            <Volume2 className="h-4 w-4" />
            Audio Compression
          </div>
          <h1 className="text-4xl font-bold text-white sm:text-5xl">
            PWDC{" "}
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Audio Codec
            </span>
          </h1>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            Photonic Wavelength Division Compression applied to audio PCM data.
            Audio waveforms are ideal for spectral compression — adjacent samples
            are highly correlated and silence maps to uniform wavelength channels.
          </p>
        </div>

        {/* Controls */}
        <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Signal Generator</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(["sine", "silence", "noise", "speech-like"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedSignal(type)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  selectedSignal === type
                    ? "border-purple-500 bg-purple-500/20 text-white"
                    : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-300"
                }`}
              >
                <div className="mb-1 font-medium capitalize">{type}</div>
                <div className="text-xs opacity-70">{SIGNAL_DESCRIPTIONS[type]}</div>
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-4">
            <label className="text-sm text-slate-400">Duration:</label>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={duration}
              onChange={(e) => setDuration(parseFloat(e.target.value))}
              className="w-48"
            />
            <span className="text-sm text-white">{duration}s ({Math.floor(duration * 44100).toLocaleString()} samples)</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={runCompress} disabled={loading !== null}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500 disabled:opacity-50">
              <Play className="h-4 w-4" /> Compress
            </button>
            <button onClick={runAnalysis} disabled={loading !== null}
              className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-500 disabled:opacity-50">
              <BarChart3 className="h-4 w-4" /> Analyze
            </button>
            <button onClick={runRoundtrip} disabled={loading !== null}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50">
              <RefreshCw className="h-4 w-4" /> Roundtrip Test
            </button>
            <button onClick={runBenchmark} disabled={loading !== null}
              className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50">
              <BarChart3 className="h-4 w-4" /> Benchmark All
            </button>
          </div>
          {loading && <p className="mt-2 text-sm text-purple-300 animate-pulse">Running {loading}...</p>}
        </div>

        {/* Results Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Compress Result */}
          {compressResult && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">Compression Result</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Signal</span>
                  <span className="text-white capitalize">{compressResult.signalType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Duration</span>
                  <span className="text-white">{compressResult.duration}s ({compressResult.sampleCount.toLocaleString()} samples)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Original PCM</span>
                  <span className="text-white">{(compressResult.originalSize / 1024).toFixed(1)} KB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">PWDC Compressed</span>
                  <span className="text-purple-300">{(compressResult.compressedSize / 1024).toFixed(1)} KB</span>
                </div>
                <div className="h-px bg-white/10" />
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-slate-400">Compression Ratio</span>
                  <span className="text-cyan-300">{compressResult.ratio}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-slate-400">Space Savings</span>
                  <span className={parseInt(compressResult.savings) > 0 ? "text-emerald-400" : "text-red-400"}>
                    {compressResult.savings}
                  </span>
                </div>
                {/* Visual bar */}
                <div className="mt-2">
                  <div className="mb-1 text-xs text-slate-500">Original vs Compressed</div>
                  <div className="h-6 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all"
                      style={{ width: `${Math.min(compressResult.ratio * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Roundtrip Result */}
          {roundtrip && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h3 className="mb-4 text-lg font-semibold text-white flex items-center gap-2">
                Roundtrip Fidelity
                {roundtrip.lossless ? (
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Signal</span>
                  <span className="text-white capitalize">{roundtrip.signalType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Original Samples</span>
                  <span className="text-white">{roundtrip.originalSamples.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Recovered Samples</span>
                  <span className="text-white">{roundtrip.recoveredSamples.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Savings</span>
                  <span className="text-purple-300">{roundtrip.savings}</span>
                </div>
                <div className="h-px bg-white/10" />
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Max Sample Error</span>
                  <span className={roundtrip.maxError < 0.001 ? "text-emerald-400" : "text-yellow-400"}>
                    {roundtrip.maxError}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Mean Squared Error</span>
                  <span className={roundtrip.mse < 0.0001 ? "text-emerald-400" : "text-yellow-400"}>
                    {roundtrip.mse}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-slate-400">Verdict</span>
                  <span className={roundtrip.lossless ? "text-emerald-400" : "text-yellow-400"}>
                    {roundtrip.lossless ? "Lossless (PCM-accurate)" : "Minor quantization noise"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Analysis Result */}
          {analysis && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 lg:col-span-2">
              <h3 className="mb-4 text-lg font-semibold text-white">Spectral Analysis</h3>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Signal</span>
                    <span className="text-white capitalize">{analysis.signalType}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Samples</span>
                    <span className="text-white">{analysis.sampleCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Duration</span>
                    <span className="text-white">{analysis.duration}s</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Peak Amplitude</span>
                    <span className="text-white">{analysis.peakAmplitude}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">RMS Level</span>
                    <span className="text-white">{analysis.rmsLevel}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Silence Ratio</span>
                    <span className="text-white">{(analysis.silenceRatio * 100).toFixed(1)}%</span>
                  </div>
                </div>

                {/* Wavelength Peaks Visualization */}
                <div>
                  <h4 className="mb-2 text-sm font-medium text-slate-300">Dominant Wavelength Channels</h4>
                  <div className="space-y-1.5">
                    {analysis.wavelengthPeaks.slice(0, 12).map((peak, i) => {
                      const maxCount = analysis.wavelengthPeaks[0]?.count || 1;
                      const pct = (peak.count / maxCount) * 100;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-14 text-right text-xs text-slate-500">{peak.wavelength}nm</span>
                          <div className="flex-1 h-4 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: wavelengthToColor(peak.wavelength),
                                opacity: 0.8,
                              }}
                            />
                          </div>
                          <span className="w-16 text-right text-xs text-slate-500">{peak.count.toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Benchmark All */}
          {benchmark && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 lg:col-span-2">
              <h3 className="mb-4 text-lg font-semibold text-white">Audio Compression Benchmark</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-slate-400">
                      <th className="pb-3 pr-4">Signal Type</th>
                      <th className="pb-3 pr-4">Samples</th>
                      <th className="pb-3 pr-4">PCM Size</th>
                      <th className="pb-3 pr-4">PWDC Size</th>
                      <th className="pb-3 pr-4">Ratio</th>
                      <th className="pb-3 pr-4">Savings</th>
                      <th className="pb-3 pr-4">Peak</th>
                      <th className="pb-3">Silence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {benchmark.map((item) => (
                      <tr key={item.signalType} className="border-b border-white/5">
                        <td className="py-3 pr-4 font-medium text-white capitalize">{item.signalType}</td>
                        <td className="py-3 pr-4 text-slate-300">{item.sampleCount.toLocaleString()}</td>
                        <td className="py-3 pr-4 text-slate-300">{(item.originalSize / 1024).toFixed(1)} KB</td>
                        <td className="py-3 pr-4 text-purple-300">{(item.compressedSize / 1024).toFixed(1)} KB</td>
                        <td className="py-3 pr-4 text-cyan-300">{item.ratio}</td>
                        <td className={`py-3 pr-4 font-medium ${parseInt(item.savings) > 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {item.savings}
                        </td>
                        <td className="py-3 pr-4 text-slate-300">{item.peakAmplitude}</td>
                        <td className="py-3 text-slate-300">{(item.silenceRatio * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Visual bars */}
              <div className="mt-6 space-y-3">
                {benchmark.map((item) => (
                  <div key={item.signalType} className="flex items-center gap-3">
                    <span className="w-24 text-right text-xs text-slate-400 capitalize">{item.signalType}</span>
                    <div className="flex-1 h-6 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all"
                        style={{ width: `${Math.min(item.ratio * 100, 100)}%` }}
                      />
                    </div>
                    <span className="w-14 text-right text-xs text-slate-400">{item.savings}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="mt-12 rounded-xl border border-white/10 bg-white/5 p-8">
          <h2 className="mb-6 text-2xl font-bold text-white">How Audio PWDC Works</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "1",
                title: "Float to PCM",
                desc: "Web Audio Float32 samples (-1 to 1) are converted to 16-bit signed PCM bytes (high byte + low byte channels).",
              },
              {
                step: "2",
                title: "Wavelength Map",
                desc: "Each PCM byte is mapped to a wavelength in the visible spectrum (380-780nm), creating a spectral representation.",
              },
              {
                step: "3",
                title: "Spectral Compress",
                desc: "PWDC groups bytes by wavelength channel. Adjacent audio samples cluster into few channels, enabling high compression.",
              },
              {
                step: "4",
                title: "Lossless Decode",
                desc: "Decompress wavelength channels back to PCM bytes, then convert to Float32. Zero loss — bit-perfect roundtrip.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 text-lg font-bold text-purple-300">
                  {item.step}
                </div>
                <h3 className="mb-2 font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
