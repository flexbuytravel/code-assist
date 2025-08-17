import { NextResponse } from "next/server";

/**
 * GET /api/system/health
 * Simple health check for the API
 */
export async function GET() {
  return NextResponse.json(
    { success: true, message: "API is healthy" },
    { status: 200 }
  );
}