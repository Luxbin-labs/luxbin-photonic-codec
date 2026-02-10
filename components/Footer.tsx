import { Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/40 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-400" />
            <span className="text-sm text-slate-400">
              LUXBIN Photonic Codec — Research Prototype
            </span>
          </div>
          <div className="text-sm text-slate-500">
            Powered by LUXBIN Light Language
          </div>
        </div>
      </div>
    </footer>
  );
}
