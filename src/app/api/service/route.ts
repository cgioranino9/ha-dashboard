import { NextResponse } from "next/server";
import { callService } from "@/lib/ha-server";

type ServiceRequestBody = {
  domain: string;
  service: string;
  entityId: string;
  data?: Record<string, unknown>;
};

function isValidBody(body: unknown): body is ServiceRequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.domain === "string" &&
    typeof b.service === "string" &&
    typeof b.entityId === "string"
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isValidBody(body)) {
    return NextResponse.json(
      { error: "Body must include domain, service, entityId" },
      { status: 400 }
    );
  }

  try {
    await callService(body.domain, body.service, body.entityId, body.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/service]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
