import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CompressionDemo from "@/components/CompressionDemo";
import WavelengthMapper from "@/components/WavelengthMapper";

export default function DemoPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h1 className="mb-2 text-3xl font-bold text-white">
            Interactive Compression Demo
          </h1>
          <p className="mb-8 text-slate-400">
            Enter text data and see how PWDC compresses it using photonic
            wavelength encoding. Watch the spectral analysis in real-time.
          </p>

          <CompressionDemo />

          <div className="mt-8">
            <WavelengthMapper />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
