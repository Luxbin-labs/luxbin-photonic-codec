import { NextResponse } from "next/server";
import { executeSandboxed } from "@/lib/lll/sandbox";
import { examples } from "@/lib/lll/examples";

/** GET — return available example scripts */
export async function GET() {
  return NextResponse.json({
    examples: examples.map((ex) => ({
      name: ex.name,
      description: ex.description,
      code: ex.code,
    })),
  });
}

/** POST — execute an LLL script in the sandbox */
export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (typeof code !== "string" || code.trim().length === 0) {
      return NextResponse.json(
        { error: "code must be a non-empty string" },
        { status: 400 }
      );
    }

    // Limit script size
    if (code.length > 50_000) {
      return NextResponse.json(
        { error: "Script too large (max 50KB)" },
        { status: 400 }
      );
    }

    const result = executeSandboxed(code, 5000);

    return NextResponse.json({
      output: result.output,
      steps: result.steps,
      error: result.error,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Execution failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
