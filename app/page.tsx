import Link from "next/link";
import { Zap, Waves, Binary, FlaskConical, ArrowRight, Cpu, Gauge, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        {/* Hero */}
        <section className="relative overflow-hidden px-6 py-32">
          {/* Background glow */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/4 h-96 w-96 -translate-x-1/2 rounded-full bg-purple-600/20 blur-[120px]" />
            <div className="absolute right-1/4 top-1/3 h-64 w-64 rounded-full bg-cyan-500/15 blur-[100px]" />
          </div>

          <div className="relative mx-auto max-w-4xl text-center">
            {/* Spectrum line */}
            <div className="mx-auto mb-8 h-1 w-48 rounded-full spectrum-gradient" />

            <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-7xl">
              <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Photonic
              </span>{" "}
              <span className="text-white">Compression</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 md:text-xl">
              A research prototype exploring{" "}
              <span className="text-purple-300">
                Wavelength Division Multiplexing
              </span>{" "}
              for data compression. Encoding bytes as photonic wavelengths to
              achieve spectral-domain compression — a potential upgrade for
              video streaming infrastructure.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/demo"
                className="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-500"
              >
                <Zap className="h-4 w-4" />
                Try the Demo
              </Link>
              <Link
                href="/benchmark"
                className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10"
              >
                <Gauge className="h-4 w-4" />
                View Benchmarks
              </Link>
              <Link
                href="/lll-lab"
                className="flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-6 py-3 text-sm font-semibold text-purple-300 transition-colors hover:bg-purple-500/20"
              >
                <FlaskConical className="h-4 w-4" />
                LLL Scripting Lab
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-white/5 px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-4 text-center text-3xl font-bold text-white">
              How PWDC Works
            </h2>
            <p className="mx-auto mb-16 max-w-2xl text-center text-slate-400">
              Inspired by fiber optic WDM, where multiple data channels transmit
              simultaneously on different wavelengths of light.
            </p>

            <div className="grid gap-8 md:grid-cols-4">
              <StepCard
                step={1}
                icon={<Binary className="h-6 w-6" />}
                title="Byte → Wavelength"
                description="Map each byte value (0-255) to a wavelength in the visible spectrum (380-780nm). Natural data clusters around certain values."
              />
              <StepCard
                step={2}
                icon={<Waves className="h-6 w-6" />}
                title="Spectral Clustering"
                description="Group identical wavelengths into channels with amplitude (count). Video data creates sparse spectra — few channels, high amplitude."
              />
              <StepCard
                step={3}
                icon={<Cpu className="h-6 w-6" />}
                title="WDM Multiplexing"
                description="Run-length encode the channel sequence. Correlated data produces long runs of the same channel, compressing efficiently."
              />
              <StepCard
                step={4}
                icon={<Zap className="h-6 w-6" />}
                title="Delta Spectral"
                description="For video frames, encode only spectral differences between frames. 90%+ shared channels = massive compression."
              />
            </div>
          </div>
        </section>

        {/* Key differentiators */}
        <section className="border-t border-white/5 px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-4 text-center text-3xl font-bold text-white">
              Why Photonic Compression?
            </h2>
            <p className="mx-auto mb-16 max-w-2xl text-center text-slate-400">
              A novel approach with real advantages for streaming infrastructure.
            </p>

            <div className="grid gap-6 md:grid-cols-3">
              <FeatureCard
                icon={<Gauge className="h-8 w-8 text-cyan-400" />}
                title="Native to Fiber Optics"
                description="Data is already transmitted as light in fiber networks. PWDC encodes in the same wavelength domain, eliminating domain conversion overhead."
              />
              <FeatureCard
                icon={<Shield className="h-8 w-8 text-green-400" />}
                title="Lossless Reconstruction"
                description="Unlike lossy codecs (H.264, AV1), PWDC preserves every byte. Combined with lossy video codecs, it adds a lossless transport layer."
              />
              <FeatureCard
                icon={<FlaskConical className="h-8 w-8 text-purple-400" />}
                title="Programmable via LLL"
                description="LUXBIN Light Language scripts can implement custom compression strategies, making the codec programmable and extensible."
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-white/5 px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-6 h-1 w-24 rounded-full spectrum-gradient" />
            <h2 className="mb-4 text-3xl font-bold text-white">
              Explore the Research
            </h2>
            <p className="mb-8 text-slate-400">
              Try the interactive demo, run benchmarks, or write LLL scripts to
              experiment with photonic compression concepts.
            </p>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 px-8 py-3 font-semibold text-white transition-opacity hover:opacity-90"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function StepCard({
  step,
  icon,
  title,
  description,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="relative rounded-xl border border-white/10 bg-black/40 p-6">
      <div className="absolute -top-3 left-4 rounded-full bg-purple-600 px-2.5 py-0.5 text-xs font-bold text-white">
        {step}
      </div>
      <div className="mb-3 text-purple-400">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-400">{description}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-6 transition-colors hover:border-purple-500/30">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-400">{description}</p>
    </div>
  );
}
