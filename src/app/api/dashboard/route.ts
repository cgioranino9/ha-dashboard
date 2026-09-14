import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/ha-server";

export async function GET() {
  try {
    const data = await getDashboardData();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/dashboard]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
