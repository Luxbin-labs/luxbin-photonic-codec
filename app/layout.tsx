import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LUXBIN Photonic Codec — Wavelength Division Compression",
  description:
    "Research prototype for photonic-inspired video compression using Wavelength Division Multiplexing concepts and LUXBIN Light Language.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
