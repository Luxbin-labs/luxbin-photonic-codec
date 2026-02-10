"use client";

import { useState } from "react";

function byteToWavelength(byte: number): number {
  return 380 + (byte / 255) * 400;
}

function wavelengthToRGB(nm: number): string {
  if (nm < 380) return "rgb(100, 0, 180)";
  if (nm < 440) {
    const t = (nm - 380) / (440 - 380);
    return `rgb(${Math.round((1 - t) * 180)}, 0, 255)`;
  }
  if (nm < 490) {
    const t = (nm - 440) / (490 - 440);
    return `rgb(0, ${Math.round(t * 255)}, 255)`;
  }
  if (nm < 510) {
    const t = (nm - 490) / (510 - 490);
    return `rgb(0, 255, ${Math.round((1 - t) * 255)})`;
  }
  if (nm < 580) {
    const t = (nm - 510) / (580 - 510);
    return `rgb(${Math.round(t * 255)}, 255, 0)`;
  }
  if (nm < 645) {
    const t = (nm - 580) / (645 - 580);
    return `rgb(255, ${Math.round((1 - t) * 255)}, 0)`;
  }
  return "rgb(255, 0, 0)";
}

export default function WavelengthMapper() {
  const [text, setText] = useState("LUXBIN");

  const bytes = new TextEncoder().encode(text);

  return (
    <div className="rounded-lg border border-white/10 bg-black/40 p-5">
      <h3 className="mb-3 text-sm font-medium text-slate-400">
        Live Wavelength Mapper
      </h3>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="mb-4 w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-purple-500/50 focus:outline-none"
        placeholder="Type to see wavelength mapping..."
        maxLength={50}
      />
      <div className="flex flex-wrap gap-2">
        {Array.from(bytes).map((byte, i) => {
          const wl = byteToWavelength(byte);
          const color = wavelengthToRGB(wl);
          const char = text[i] || "?";
          return (
            <div
              key={i}
              className="flex flex-col items-center rounded-md border border-white/10 bg-black/40 p-2 transition-transform hover:scale-105"
            >
              <div
                className="mb-1 h-8 w-8 rounded"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs font-mono text-white">{char}</span>
              <span className="text-[10px] text-slate-500">
                {Math.round(wl)}nm
              </span>
            </div>
          );
        })}
      </div>
      {bytes.length > 0 && (
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full spectrum-gradient opacity-60" />
      )}
    </div>
  );
}
