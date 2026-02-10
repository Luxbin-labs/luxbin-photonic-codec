"use client";

import { useState, useEffect } from "react";
import { Radio, Wifi, Tv, Satellite, Shield, Zap, Activity } from "lucide-react";

interface BandInfo {
  name: string;
  label: string;
  color: string;
  useCases: string[];
  minFrequency: string;
  maxFrequency: string;
  minWavelength: string;
  maxWavelength: string;
}

interface AppInfo {
  name: string;
  label: string;
  band: string;
  description: string;
  minFreq: string;
  maxFreq: string;
  minWavelength: string;
  maxWavelength: string;
}

interface BandMapping {
  band: string;
  label: string;
  color: string;
  wavelengthLabel: string;
  frequencyLabel: string;
}

interface QChannel {
  name: string;
  desc: string;
  wavelengthLabel: string;
  frequencyLabel: string;
  band: string;
  pwdcByte: number;
}

interface CompressResult {
  band: string;
  dataType: string;
  originalSize: number;
  compressedSize: number;
  ratio: number;
  savings: string;
}

const BAND_ICONS: Record<string, typeof Radio> = {
  radio: Radio,
  microwave: Wifi,
  infrared: Activity,
  visible: Zap,
  ultraviolet: Shield,
  xray: Shield,
  gamma: Shield,
};

export default function SpectrumPage() {
  const [bands, setBands] = useState<BandInfo[]>([]);
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [selectedByte, setSelectedByte] = useState(128);
  const [bandMappings, setBandMappings] = useState<BandMapping[]>([]);
  const [quantumChannels, setQuantumChannels] = useState<QChannel[]>([]);
  const [compressResults, setCompressResults] = useState<CompressResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/spectrum")
      .then((r) => r.json())
      .then((data) => {
        setBands(data.bands);
        setApps(data.applications);
        setLoading(false);
      });
    fetch("/api/spectrum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "quantum-internet-channels" }),
    })
      .then((r) => r.json())
      .then((data) => setQuantumChannels(data.channels));
  }, []);

  useEffect(() => {
    fetch("/api/spectrum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "map-all-bands", byte: selectedByte }),
    })
      .then((r) => r.json())
      .then((data) => setBandMappings(data.mappings));
  }, [selectedByte]);

  async function runBandCompress() {
    const bandNames = ["visible", "microwave", "radio", "infrared"];
    const results: CompressResult[] = [];
    for (const band of bandNames) {
      const res = await fetch("/api/spectrum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "compress-in-band", band, dataType: "audio-like" }),
      });
      const data = await res.json();
      results.push(data);
    }
    setCompressResults(results);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 pt-24 pb-16 flex items-center justify-center">
        <p className="text-purple-300 animate-pulse">Loading electromagnetic spectrum...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-sm text-cyan-300">
            <Radio className="h-4 w-4" />
            Full EM Spectrum
          </div>
          <h1 className="text-4xl font-bold text-white sm:text-5xl">
            Electromagnetic{" "}
            <span className="bg-gradient-to-r from-yellow-400 via-green-400 via-cyan-400 via-purple-400 to-red-400 bg-clip-text text-transparent">
              Spectrum
            </span>{" "}
            Codec
          </h1>
          <p className="mt-4 text-lg text-slate-400 max-w-3xl mx-auto">
            PWDC extended to the full electromagnetic spectrum — from radio waves to gamma rays.
            Map data to any frequency band for radio, TV, WiFi, 5G, satellite, fiber optic,
            and quantum internet transmission.
          </p>
        </div>

        {/* EM Spectrum Visual Band */}
        <div className="mb-10 rounded-xl border border-white/10 bg-white/5 p-6 overflow-hidden">
          <h2 className="mb-4 text-lg font-semibold text-white">The Electromagnetic Spectrum</h2>
          <div className="flex h-16 rounded-lg overflow-hidden mb-4">
            {bands.map((band) => (
              <div
                key={band.name}
                className="flex-1 flex items-end justify-center pb-1 relative group cursor-default"
                style={{ backgroundColor: band.color + "33" }}
              >
                <div
                  className="absolute inset-0 opacity-30"
                  style={{ backgroundColor: band.color }}
                />
                <span className="relative z-10 text-[10px] sm:text-xs font-medium text-white truncate px-1">
                  {band.label}
                </span>
              </div>
            ))}
          </div>
          <div className="flex text-[10px] text-slate-500">
            <div className="flex-1 text-left">Gamma (&lt;0.01nm)</div>
            <div className="flex-1 text-center">Visible (380-780nm)</div>
            <div className="flex-1 text-right">Radio (&gt;1m)</div>
          </div>
        </div>

        {/* Band Details */}
        <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {bands.map((band) => {
            const Icon = BAND_ICONS[band.name] || Zap;
            return (
              <div
                key={band.name}
                className="rounded-xl border border-white/10 bg-white/5 p-4 hover:border-white/20 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: band.color + "33" }}>
                    <Icon className="h-4 w-4" style={{ color: band.color }} />
                  </div>
                  <h3 className="font-semibold text-white text-sm">{band.label}</h3>
                </div>
                <div className="space-y-1 text-xs text-slate-400">
                  <div>Freq: {band.minFrequency} — {band.maxFrequency}</div>
                  <div>WL: {band.minWavelength} — {band.maxWavelength}</div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {band.useCases.map((uc) => (
                    <span key={uc} className="rounded-full px-2 py-0.5 text-[10px] border border-white/10 text-slate-400">
                      {uc}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Byte Mapper */}
        <div className="mb-10 rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Byte-to-Spectrum Mapper</h2>
          <p className="mb-4 text-sm text-slate-400">
            See how a single byte (0-255) maps to a different wavelength and frequency in each EM band.
            This is how PWDC encodes data for different transmission technologies.
          </p>
          <div className="flex items-center gap-4 mb-6">
            <label className="text-sm text-slate-400">Byte value:</label>
            <input
              type="range"
              min={0}
              max={255}
              value={selectedByte}
              onChange={(e) => setSelectedByte(parseInt(e.target.value))}
              className="w-64"
            />
            <span className="font-mono text-lg text-white">{selectedByte}</span>
            <span className="text-sm text-slate-500">(0x{selectedByte.toString(16).padStart(2, "0").toUpperCase()})</span>
          </div>
          <div className="space-y-2">
            {bandMappings.map((m) => (
              <div key={m.band} className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-2">
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: m.color }} />
                <span className="w-28 text-sm font-medium text-white">{m.label}</span>
                <span className="w-36 text-sm text-slate-300 font-mono">{m.wavelengthLabel}</span>
                <span className="flex-1 text-sm text-slate-400 font-mono">{m.frequencyLabel}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Real-World Applications */}
        <div className="mb-10 rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Application Frequency Bands</h2>
          <p className="mb-4 text-sm text-slate-400">
            PWDC can encode data for any of these real-world transmission systems.
            Each application uses a specific slice of the EM spectrum.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-slate-400">
                  <th className="pb-3 pr-4">Application</th>
                  <th className="pb-3 pr-4">Band</th>
                  <th className="pb-3 pr-4">Frequency Range</th>
                  <th className="pb-3 pr-4">Wavelength Range</th>
                  <th className="pb-3">Description</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => (
                  <tr key={app.name} className="border-b border-white/5">
                    <td className="py-2.5 pr-4 font-medium text-white">{app.label}</td>
                    <td className="py-2.5 pr-4 text-slate-300 capitalize">{app.band}</td>
                    <td className="py-2.5 pr-4 text-cyan-300 font-mono text-xs">{app.minFreq} — {app.maxFreq}</td>
                    <td className="py-2.5 pr-4 text-purple-300 font-mono text-xs">{app.minWavelength} — {app.maxWavelength}</td>
                    <td className="py-2.5 text-slate-400">{app.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quantum Internet Channels */}
        <div className="mb-10 rounded-xl border border-purple-500/20 bg-purple-500/5 p-6">
          <h2 className="mb-2 text-lg font-semibold text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-400" />
            Quantum Internet Channels
          </h2>
          <p className="mb-4 text-sm text-slate-400">
            These are the actual frequency channels used in quantum networking research.
            Each channel maps to a PWDC byte value, enabling direct photonic encoding for quantum internet infrastructure.
          </p>
          {quantumChannels.length > 0 && (
            <div className="space-y-2">
              {quantumChannels.map((ch) => (
                <div key={ch.name} className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-3">
                  <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center font-mono text-xs text-purple-300">
                    {ch.pwdcByte}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white text-sm">{ch.name}</span>
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-400 capitalize">{ch.band}</span>
                    </div>
                    <div className="text-xs text-slate-400">{ch.desc}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-cyan-300 font-mono">{ch.frequencyLabel}</div>
                    <div className="text-xs text-purple-300 font-mono">{ch.wavelengthLabel}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Band Compression Test */}
        <div className="mb-10 rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Cross-Band Compression Test</h2>
          <p className="mb-4 text-sm text-slate-400">
            Test PWDC compression across different EM bands. The compression algorithm works
            identically regardless of band — the wavelength mapping is a transport-layer concern.
          </p>
          <button
            onClick={runBandCompress}
            className="mb-4 flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500"
          >
            <Activity className="h-4 w-4" /> Run Cross-Band Test
          </button>
          {compressResults.length > 0 && (
            <div className="space-y-3">
              {compressResults.map((r) => (
                <div key={r.band} className="flex items-center gap-3">
                  <span className="w-24 text-right text-sm text-slate-400 capitalize">{r.band}</span>
                  <div className="flex-1 h-8 rounded-full bg-white/5 overflow-hidden flex items-center">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-end pr-2"
                      style={{ width: `${Math.min(r.ratio * 100, 100)}%` }}
                    >
                      <span className="text-[10px] text-white font-medium">{r.savings}</span>
                    </div>
                  </div>
                  <span className="w-24 text-xs text-slate-500">
                    {r.compressedSize}B / {r.originalSize}B
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quantum Internet Compatibility */}
        <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 to-purple-950/30 p-8">
          <h2 className="mb-6 text-2xl font-bold text-white">Quantum Internet Compatibility</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Tv,
                title: "TV & Radio Broadcast",
                status: "Ready",
                desc: "PWDC maps data to VHF/UHF (TV) and FM/AM (radio) frequency bands. The compression reduces bitrate, meaning more channels per MHz of allocated spectrum.",
              },
              {
                icon: Wifi,
                title: "WiFi & 5G",
                status: "Ready",
                desc: "Microwave band encoding for WiFi (2.4/5/6 GHz) and 5G (sub-6 & mmWave). PWDC's channel structure maps 1:1 to OFDM subcarriers used in wireless.",
              },
              {
                icon: Satellite,
                title: "Satellite (Starlink)",
                status: "Ready",
                desc: "Ku/Ka-band satellite encoding (10-40 GHz). PWDC reduces payload size for low-latency satellite internet — fewer bits per photon trip to orbit.",
              },
              {
                icon: Zap,
                title: "Fiber Optic (DWDM)",
                status: "Native",
                desc: "PWDC was designed for this. Dense Wavelength Division Multiplexing already sends 80+ wavelength channels through one fiber. PWDC is the data encoding layer.",
              },
              {
                icon: Shield,
                title: "Quantum Key Distribution",
                status: "Compatible",
                desc: "QKD protocols (BB84, E91) encode bits in photon polarization states. PWDC's byte-to-wavelength mapping provides the channel allocation layer for multi-channel QKD.",
              },
              {
                icon: Radio,
                title: "Quantum Internet",
                status: "Designed For",
                desc: "The quantum internet needs a data encoding scheme that maps efficiently to photon wavelengths. PWDC is that encoding — 256 wavelength channels carrying compressed data via entangled photon pairs.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">{item.title}</h3>
                    <span className={`text-[10px] font-medium ${
                      item.status === "Designed For" ? "text-emerald-400" :
                      item.status === "Native" ? "text-purple-400" :
                      "text-cyan-400"
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
