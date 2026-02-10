"use client";

/**
 * BenchmarkChart — Horizontal bar chart comparing compression algorithms.
 */

import type { BenchmarkResult } from "@/lib/types";

const COLORS: Record<string, string> = {
  "Raw (uncompressed)": "#64748b",
  "Raw frames": "#64748b",
  "RLE (Run-Length)": "#f59e0b",
  "PWDC (Photonic)": "#a855f7",
  "PWDC per-frame": "#8b5cf6",
  "PWDC delta-spectral": "#7c3aed",
};

export default function BenchmarkChart({
  results,
  metric = "ratio",
  title,
}: {
  results: BenchmarkResult[];
  metric?: "ratio" | "compressTime" | "decompressTime";
  title?: string;
}) {
  if (results.length === 0) return null;

  const labels: Record<string, string> = {
    ratio: "Compression Ratio",
    compressTime: "Compress Time (ms)",
    decompressTime: "Decompress Time (ms)",
  };

  const values = results.map((r) => r[metric]);
  const maxVal = Math.max(...values, 0.001);

  return (
    <div className="rounded-lg border border-white/10 bg-black/40 p-5">
      {title && (
        <h3 className="mb-1 text-base font-semibold text-white">{title}</h3>
      )}
      <p className="mb-4 text-xs text-slate-500">{labels[metric]}</p>
      <div className="space-y-3">
        {results.map((result, i) => {
          const width = (values[i] / maxVal) * 100;
          const color = COLORS[result.algorithm] || "#a855f7";
          return (
            <div key={i}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-slate-300">{result.algorithm}</span>
                <span className="font-mono text-slate-400">
                  {metric === "ratio"
                    ? `${(result.ratio * 100).toFixed(1)}%`
                    : `${values[i].toFixed(2)}ms`}
                </span>
              </div>
              <div className="h-6 w-full overflow-hidden rounded bg-white/5">
                <div
                  className="flex h-full items-center rounded pl-2 text-xs font-medium text-white transition-all duration-500"
                  style={{
                    width: `${Math.max(width, 2)}%`,
                    backgroundColor: color,
                  }}
                >
                  {metric === "ratio" &&
                    result.compressedSize !== result.originalSize && (
                      <span className="whitespace-nowrap opacity-80">
                        {result.compressedSize.toLocaleString()}B
                      </span>
                    )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 border-t border-white/5 pt-3">
        {results.map((r, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-slate-400">
            <div
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: COLORS[r.algorithm] || "#a855f7" }}
            />
            {r.lossless ? "Lossless" : "Lossy"}
          </div>
        ))}
      </div>
    </div>
  );
}
