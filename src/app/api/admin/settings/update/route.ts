import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * PATCH /api/admin/settings/update
 * Updates global platform settings
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, error: "No settings provided" },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection("settings").doc("global");
    await docRef.set(body, { merge: true });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error updating settings:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}