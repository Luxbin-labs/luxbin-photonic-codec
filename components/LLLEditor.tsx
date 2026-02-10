"use client";

import { useState } from "react";
import { Play, RotateCcw, Copy, Check } from "lucide-react";

export default function LLLEditor({
  initialCode = "",
  onRun,
  output = [],
  error = null,
  steps = 0,
  running = false,
}: {
  initialCode?: string;
  onRun: (code: string) => void;
  output?: string[];
  error?: string | null;
  steps?: number;
  running?: boolean;
}) {
  const [code, setCode] = useState(initialCode);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Editor */}
      <div className="flex flex-col rounded-lg border border-white/10 bg-black/60">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
          <span className="text-sm font-medium text-slate-400">
            LLL Script Editor
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="rounded p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
              title="Copy code"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => setCode("")}
              className="rounded p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
              title="Clear"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={() => onRun(code)}
              disabled={running || !code.trim()}
              className="flex items-center gap-1.5 rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-purple-500 disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" />
              {running ? "Running..." : "Run"}
            </button>
          </div>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="code-editor min-h-[400px] flex-1 resize-none bg-transparent p-4 text-sm text-slate-200 placeholder:text-slate-600"
          placeholder="# Write LLL code here...&#10;println(&quot;Hello from LUXBIN!&quot;)"
          spellCheck={false}
        />
      </div>

      {/* Output */}
      <div className="flex flex-col rounded-lg border border-white/10 bg-black/60">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
          <span className="text-sm font-medium text-slate-400">Output</span>
          {steps > 0 && (
            <span className="text-xs text-slate-500">
              {steps.toLocaleString()} steps
            </span>
          )}
        </div>
        <div className="code-editor min-h-[400px] flex-1 overflow-auto p-4 text-sm">
          {output.length === 0 && !error && (
            <span className="text-slate-600">
              Run a script to see output here...
            </span>
          )}
          {output.map((line, i) => (
            <div key={i} className="text-green-300">
              {line}
            </div>
          ))}
          {error && (
            <div className="mt-2 rounded border border-red-500/30 bg-red-500/10 p-3 text-red-400">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
