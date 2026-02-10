"use client";

import { useState } from "react";
import { FlaskConical, BookOpen } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LLLEditor from "@/components/LLLEditor";

interface Example {
  name: string;
  description: string;
  code: string;
}

export default function LLLLabPage() {
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState(0);
  const [running, setRunning] = useState(false);
  const [examples, setExamples] = useState<Example[]>([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [loadedExamples, setLoadedExamples] = useState(false);

  const loadExamples = async () => {
    if (loadedExamples) return;
    try {
      const res = await fetch("/api/lll/execute", {
        method: "GET",
      });
      const json = await res.json();
      setExamples(json.examples || []);
      setLoadedExamples(true);
    } catch {
      // Ignore
    }
  };

  const handleRun = async (code: string) => {
    setRunning(true);
    setOutput([]);
    setError(null);
    setSteps(0);
    try {
      const res = await fetch("/api/lll/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      setOutput(json.output || []);
      setError(json.error || null);
      setSteps(json.steps || 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Execution failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="pt-16">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold text-white">
                <FlaskConical className="h-7 w-7 text-purple-400" />
                LLL Scripting Lab
              </h1>
              <p className="max-w-2xl text-slate-400">
                Write LUXBIN Light Language scripts to experiment with photonic
                compression concepts. The sandbox includes quantum primitives,
                photonic encoding builtins, and custom PWDC codec functions.
              </p>
            </div>
            <button
              onClick={loadExamples}
              className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-white/10"
            >
              <BookOpen className="h-4 w-4" />
              {loadedExamples ? "Examples Loaded" : "Load Examples"}
            </button>
          </div>

          {/* Example selector */}
          {examples.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {examples.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedCode(ex.code)}
                  className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-purple-500/30 hover:bg-purple-500/10"
                  title={ex.description}
                >
                  {ex.name}
                </button>
              ))}
            </div>
          )}

          {/* Builtin reference */}
          <div className="mb-6 rounded-lg border border-white/10 bg-black/40 p-4">
            <h3 className="mb-2 text-sm font-medium text-slate-300">
              Available Builtins
            </h3>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { cat: "IO", fns: "print, println" },
                { cat: "Math", fns: "abs, sqrt, pow, sin, cos, round, min, max, random" },
                { cat: "String", fns: "len, concat, slice, upper, lower, split, join, trim" },
                { cat: "Array", fns: "push, pop, sort, reverse, range, map, filter" },
                { cat: "Type", fns: "to_int, to_float, to_string, to_bool, type" },
                { cat: "Quantum", fns: "superpose, measure, entangle, hadamard" },
                { cat: "Photonic", fns: "photon_wavelength, photon_char" },
                { cat: "PWDC", fns: "pwdc_encode, pwdc_decode, spectral_analyze, wavelength, spectrum" },
              ].map((group) => (
                <span
                  key={group.cat}
                  className="rounded border border-white/10 bg-white/5 px-2 py-1"
                >
                  <span className="font-medium text-purple-300">
                    {group.cat}:
                  </span>{" "}
                  <span className="text-slate-400">{group.fns}</span>
                </span>
              ))}
            </div>
          </div>

          <LLLEditor
            key={selectedCode} // Re-mount when example changes
            initialCode={selectedCode}
            onRun={handleRun}
            output={output}
            error={error}
            steps={steps}
            running={running}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
