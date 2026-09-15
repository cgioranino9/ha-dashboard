import { NextResponse } from "next/server";
import { getCameraImage } from "@/lib/ha-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entityId: string }> }
) {
  const { entityId } = await params;
  try {
    const { body, contentType } = await getCameraImage(`camera.${entityId}`);
    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[api/camera]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
