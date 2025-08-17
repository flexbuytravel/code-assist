import { NextResponse } from "next/server";

/**
 * GET /api/system/config
 * Returns frontend-safe environment variables
 */
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      config: {
        STRIPE_PUBLIC_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || "",
        FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
      },
    },
    { status: 200 }
  );
}