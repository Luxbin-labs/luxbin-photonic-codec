/**
 * Pre-built LLL example scripts demonstrating photonic compression concepts.
 */

export interface LLLExample {
  name: string;
  description: string;
  code: string;
}

export const examples: LLLExample[] = [
  {
    name: "Photonic Encoding Basics",
    description: "Map characters to visible light wavelengths using LUXBIN photonic primitives",
    code: `# Photonic Encoding — Characters as Light
# Each character maps to a wavelength in the visible spectrum (380-780nm)

println("=== Photonic Character Encoding ===")
println("")

let message = "LUXBIN"
println("Message: " + message)
println("")

# Encode each character to its wavelength
println("Character → Wavelength mapping:")
for i in range(len(message)) do
  let ch = slice(message, i, i + 1)
  let wl = photon_wavelength(ch)
  let color = ""
  if wl < 450 then
    color = "violet"
  else if wl < 490 then
    color = "blue"
  else if wl < 570 then
    color = "green"
  else if wl < 590 then
    color = "yellow"
  else if wl < 620 then
    color = "orange"
  else
    color = "red"
  end
  println("  '" + ch + "' → " + to_string(round(wl)) + "nm (" + color + ")")
end

# Round-trip: wavelength back to character
println("")
println("Reverse: wavelength → character")
let wl = photon_wavelength("L")
let restored = photon_char(wl)
println("  " + to_string(round(wl)) + "nm → '" + restored + "'")`,
  },
  {
    name: "PWDC Compression Demo",
    description: "Compress text using Photonic Wavelength Division Compression",
    code: `# PWDC Compression — Photonic Wavelength Division
# Demonstrates the custom PWDC codec builtins

println("=== PWDC Compression Demo ===")
println("")

# Test with repetitive data (high compressibility)
let data1 = "AAAAABBBBBCCCCC"
println("Input 1: " + data1 + " (" + to_string(len(data1)) + " bytes)")
let compressed1 = pwdc_encode(data1)
println("Compressed: " + to_string(len(compressed1)) + " bytes")
let ratio1 = round(len(compressed1) / len(data1) * 100)
println("Ratio: " + to_string(ratio1) + "%")
let restored1 = pwdc_decode(compressed1)
println("Restored: " + restored1)
println("Lossless: " + to_string(data1 == restored1))
println("")

# Test with varied data (lower compressibility)
let data2 = "Hello World! This is a photonic compression test."
println("Input 2: " + data2)
println("  Size: " + to_string(len(data2)) + " bytes")
let compressed2 = pwdc_encode(data2)
println("  Compressed: " + to_string(len(compressed2)) + " bytes")
let restored2 = pwdc_decode(compressed2)
println("  Lossless: " + to_string(data2 == restored2))`,
  },
  {
    name: "Spectral Analysis",
    description: "Analyze the wavelength spectrum of data to predict compression potential",
    code: `# Spectral Analysis — Data as a Light Spectrum
# Examines how data distributes across the photonic spectrum

println("=== Spectral Analysis ===")
println("")

# Analyze different types of data
let samples = [
  "aaaaaaaaaa",
  "abcdefghij",
  "Hello World"
]

let labels = [
  "Uniform (all 'a')",
  "Sequential (a-j)",
  "Natural text"
]

for i in range(len(samples)) do
  println("--- " + labels[i] + " ---")
  println("Data: " + samples[i])
  let analysis = spectral_analyze(samples[i])
  for line in analysis do
    println("  " + to_string(line))
  end
  println("")
end

# Show wavelength mapping for bytes
println("--- Byte → Wavelength Map ---")
let bytes = [0, 32, 64, 96, 128, 160, 192, 224, 255]
for b in bytes do
  let wl = wavelength(b)
  println("  Byte " + to_string(b) + " → " + to_string(round(wl)) + "nm")
end`,
  },
  {
    name: "Quantum Superposition Encoding",
    description: "Use quantum superposition to explore multiple encoding strategies simultaneously",
    code: `# Quantum Superposition Encoding
# Explore multiple compression strategies using quantum concepts

println("=== Quantum Compression Explorer ===")
println("")

# Create a superposition of encoding strategies
let strategies = superpose([
  "spectral-cluster",
  "wavelength-delta",
  "photon-multiplex",
  "quantum-entangle"
])

println("Superposition of strategies:")
for s in strategies do
  println("  |" + to_string(s) + "⟩")
end

# Measure (collapse) to select one
println("")
println("Measuring... (collapsing superposition)")
let chosen = measure(strategies)
println("Selected strategy: " + to_string(chosen))

# Simulate entanglement between encoder and decoder
println("")
println("Entangling encoder ↔ decoder:")
let pair = entangle("encoder", "decoder")
println("  " + to_string(pair[0]) + " ⟷ " + to_string(pair[1]))
println("  (Entangled pair ensures synchronized encoding/decoding)")

# Hadamard gate for probabilistic quality selection
println("")
println("Hadamard quality gate (50/50 high/standard):")
for i in range(5) do
  let quality = hadamard(0)
  if quality == 0 then
    println("  Trial " + to_string(i+1) + ": High quality (lossless)")
  else
    println("  Trial " + to_string(i+1) + ": Standard quality (lossy)")
  end
end`,
  },
  {
    name: "Wavelength Spectrum Visualizer",
    description: "Generate a text-based visualization of data's wavelength distribution",
    code: `# Wavelength Spectrum Visualizer
# Creates a text histogram of photonic distribution

println("=== Photonic Spectrum Visualizer ===")
println("")

let data = "The quick brown fox jumps over the lazy dog"
println("Data: " + data)
println("")

# Get the wavelength spectrum
let spec = spectrum(data)

# Find max count for scaling
let maxCount = 0
for entry in spec do
  if entry[1] > maxCount then
    maxCount = entry[1]
  end
end

# Draw spectrum
println("Wavelength Distribution:")
println("nm     Count  Spectrum")
println("─────  ─────  " + "────────────────────────────────")
for entry in spec do
  let wl = to_string(entry[0])
  let count = entry[1]
  # Pad wavelength to 5 chars
  let padding = ""
  for p in range(5 - len(wl)) do
    padding = padding + " "
  end
  # Scale bar to max 30 chars
  let barLen = round(count / maxCount * 30)
  let bar = ""
  for b in range(barLen) do
    bar = bar + "█"
  end
  let countStr = to_string(count)
  let countPad = ""
  for p in range(5 - len(countStr)) do
    countPad = countPad + " "
  end
  println(padding + wl + "  " + countPad + countStr + "  " + bar)
end`,
  },
];
