import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const form = await req.formData();
    const resp = await fetch("https://invoice-tool.liara.run/process", { method: "POST", body: form });
    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ error: text || "processing failed" }, { status: resp.status });
    }
    const buf = Buffer.from(await resp.arrayBuffer());
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="result.xlsx"',
        "Cache-Control": "no-store"
      }
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
