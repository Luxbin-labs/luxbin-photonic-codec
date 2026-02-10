"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap } from "lucide-react";

const links = [
  { href: "/", label: "Home" },
  { href: "/demo", label: "Demo" },
  { href: "/audio", label: "Audio" },
  { href: "/spectrum", label: "Spectrum" },
  { href: "/benchmark", label: "Benchmarks" },
  { href: "/lll-lab", label: "LLL Lab" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <Zap className="h-6 w-6 text-purple-400" />
          <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            LUXBIN Photonic Codec
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "bg-purple-500/20 text-purple-300"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
