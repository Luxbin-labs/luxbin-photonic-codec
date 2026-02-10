"use client";

/**
 * SpectrumVisualizer — Renders a wavelength spectrum as a visual bar chart.
 *
 * Each bar represents a wavelength channel, colored to match its position
 * in the visible spectrum (violet → red).
 */

interface SpectrumBar {
  wavelength: number;
  count: number;
}

function wavelengthToColor(nm: number): string {
  // Map wavelength to approximate visible color
  if (nm < 380) return "#7c3aed";
  if (nm < 440) return `rgb(${Math.round(((440 - nm) / 60) * 180)}, 0, 255)`;
  if (nm < 490) return `rgb(0, ${Math.round(((nm - 440) / 50) * 255)}, 255)`;
  if (nm < 510) return `rgb(0, 255, ${Math.round(((510 - nm) / 20) * 255)})`;
  if (nm < 580) return `rgb(${Math.round(((nm - 510) / 70) * 255)}, 255, 0)`;
  if (nm < 645) return `rgb(255, ${Math.round(((645 - nm) / 65) * 255)}, 0)`;
  if (nm < 780) return `rgb(255, 0, 0)`;
  return "#ef4444";
}

export default function SpectrumVisualizer({
  data,
  height = 200,
  label,
}: {
  data: SpectrumBar[];
  height?: number;
  label?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-white/10 bg-black/40 p-8 text-slate-500">
        No spectral data to display
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <div className="rounded-lg border border-white/10 bg-black/40 p-4">
      {label && (
        <h3 className="mb-3 text-sm font-medium text-slate-400">{label}</h3>
      )}
      <div className="flex items-end gap-px" style={{ height }}>
        {data.map((bar, i) => {
          const barHeight = (bar.count / maxCount) * height;
          const color = wavelengthToColor(bar.wavelength);
          return (
            <div
              key={i}
              className="group relative flex-1 min-w-[2px] transition-opacity hover:opacity-80"
              style={{
                height: barHeight,
                backgroundColor: color,
                borderRadius: "2px 2px 0 0",
              }}
              title={`${bar.wavelength}nm: ${bar.count}`}
            >
              <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/90 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                {bar.wavelength}nm ({bar.count})
              </div>
            </div>
          );
        })}
      </div>
      {/* Wavelength axis labels */}
      <div className="mt-1 flex justify-between text-xs text-slate-500">
        <span>380nm (violet)</span>
        <span>580nm (green)</span>
        <span>780nm (red)</span>
      </div>
    </div>
  );
}
