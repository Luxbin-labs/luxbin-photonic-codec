/**
 * LLL Sandbox — Safe execution of LUXBIN Light Language scripts.
 *
 * Constructs a custom environment with ONLY safe builtins, excluding
 * fs_*, net_*, os_* for security. Also adds custom PWDC codec builtins.
 */

import {
  Lexer,
  Parser,
  interpret,
  Environment,
} from "luxbin-lang";
import type { LuxValue, BuiltinFunction } from "luxbin-lang";
import { compress, decompress, analyzeCompressibility } from "../codec/spectral-compress";
import { byteToWavelength } from "../codec/photonic-transform";

const SAFE_BUILTINS = new Set([
  "print", "println", "input",
  "abs", "sqrt", "pow", "sin", "cos", "tan", "floor", "ceil", "round", "min", "max", "random",
  "len", "concat", "slice", "upper", "lower", "split", "join", "trim", "contains", "replace",
  "push", "pop", "sort", "reverse", "range", "map", "filter", "indexOf",
  "to_int", "to_float", "to_string", "to_bool", "type",
  "superpose", "measure", "entangle", "hadamard", "photon_wavelength", "photon_char",
]);

const BLOCKED_PREFIXES = ["fs_", "net_", "os_"];

function isAllowed(name: string): boolean {
  if (BLOCKED_PREFIXES.some((p) => name.startsWith(p))) return false;
  return SAFE_BUILTINS.has(name);
}

function createCodecBuiltins(): Record<string, (args: LuxValue[], env: Environment) => LuxValue> {
  return {
    pwdc_encode: (args) => {
      const input = String(args[0] ?? "");
      const data = new TextEncoder().encode(input);
      const compressed = compress(data);
      return Array.from(compressed) as LuxValue[];
    },

    pwdc_decode: (args) => {
      if (!Array.isArray(args[0])) throw new Error("pwdc_decode: expected array of numbers");
      const data = new Uint8Array((args[0] as number[]).map(Number));
      const decompressed = decompress(data);
      return new TextDecoder().decode(decompressed);
    },

    spectral_analyze: (args) => {
      const input = String(args[0] ?? "");
      const data = new TextEncoder().encode(input);
      const analysis = analyzeCompressibility(data);
      const result: LuxValue[] = [
        `Unique bytes: ${analysis.uniqueBytes}`,
        `Entropy: ${analysis.entropyBits} bits`,
        `Spectral density: ${analysis.spectralDensity}`,
        `Estimated ratio: ${analysis.estimatedRatio}`,
      ];
      for (const wl of analysis.dominantWavelengths.slice(0, 5)) {
        result.push(`  ${wl.wavelength}nm: ${wl.frequency} occurrences`);
      }
      return result;
    },

    wavelength: (args) => {
      if (typeof args[0] !== "number") throw new Error("wavelength: expected a number (0-255)");
      return byteToWavelength(Math.max(0, Math.min(255, Math.floor(args[0] as number))));
    },

    spectrum: (args) => {
      const input = String(args[0] ?? "");
      const data = new TextEncoder().encode(input);
      const histogram = new Map<number, number>();
      for (let i = 0; i < data.length; i++) {
        const wl = Math.round(byteToWavelength(data[i]));
        histogram.set(wl, (histogram.get(wl) || 0) + 1);
      }
      const entries = Array.from(histogram.entries()).sort((a, b) => a[0] - b[0]);
      return entries.map(([wl, count]) => [wl, count] as LuxValue[]) as LuxValue[];
    },
  };
}

export interface SandboxResult {
  output: string[];
  steps: number;
  error: string | null;
}

/**
 * Execute an LLL script in the sandbox.
 */
export function executeSandboxed(code: string, timeout: number = 5000): SandboxResult {
  const output: string[] = [];

  try {
    // Parse the script
    const lexer = new Lexer(code, "<sandbox>");
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens, "<sandbox>");
    const program = parser.parse();

    // Get full stdlib by interpreting an empty program with our output array
    // This ensures print/println builtins capture the correct output array
    const emptyProgram = new Parser(new Lexer("", "<init>").tokenize(), "<init>").parse();
    const initResult = interpret(emptyProgram, { output });

    // Build sandboxed env with only safe builtins
    const safeEnv = new Environment();
    for (const name of initResult.env.getOwnNames()) {
      if (isAllowed(name)) {
        safeEnv.define(name, initResult.env.get(name), true);
      }
    }

    // Add custom codec builtins
    const codecBuiltins = createCodecBuiltins();
    for (const [name, fn] of Object.entries(codecBuiltins)) {
      safeEnv.define(name, { __type: "builtin", name, fn } as BuiltinFunction, true);
    }

    // Execute with the sandboxed environment
    const startTime = Date.now();
    const result = interpret(program, { output, globalEnv: safeEnv });
    const elapsed = Date.now() - startTime;

    if (elapsed > timeout) {
      return {
        output: result.output,
        steps: result.steps,
        error: `Execution timeout: script took ${elapsed}ms (limit: ${timeout}ms)`,
      };
    }

    return { output: result.output, steps: result.steps, error: result.error };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { output, steps: 0, error: message };
  }
}
