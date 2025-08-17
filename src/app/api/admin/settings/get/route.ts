import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * GET /api/admin/settings/get
 * Returns global platform settings
 */
export async function GET() {
  try {
    const docRef = adminDb.collection("settings").doc("global");
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { success: false, error: "Settings not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, settings: docSnap.data() });
  } catch (err: any) {
    console.error("Error fetching settings:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}