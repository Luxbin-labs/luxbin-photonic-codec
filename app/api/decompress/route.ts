import { NextResponse } from "next/server";
import { compress, decompress } from "@/lib/codec/spectral-compress";

export async function POST(request: Request) {
  try {
    const { data } = await request.json();

    if (typeof data !== "string" || data.length === 0) {
      return NextResponse.json(
        { error: "data must be a non-empty string" },
        { status: 400 }
      );
    }

    // Compress then decompress to verify round-trip
    const raw = new TextEncoder().encode(data);
    const compressed = compress(raw);
    const restored = decompress(compressed);
    const restoredText = new TextDecoder().decode(restored);

    const lossless =
      raw.length === restored.length &&
      raw.every((b, i) => b === restored[i]);

    return NextResponse.json({
      original: data,
      restored: restoredText,
      lossless,
      compressedSize: compressed.length,
      originalSize: raw.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Decompression failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
