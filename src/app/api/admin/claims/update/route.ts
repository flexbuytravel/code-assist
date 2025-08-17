import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * POST /api/admin/claims/update
 * Admin updates a claim (e.g., mark as approved/denied).
 */
export async function POST(request: Request) {
  try {
    const { claimId, status } = await request.json();

    if (!claimId || !status) {
      return NextResponse.json(
        { success: false, error: "Missing claimId or status" },
        { status: 400 }
      );
    }

    if (!["approved", "denied"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    const claimRef = adminDb.collection("claims").doc(claimId);
    const claimSnap = await claimRef.get();

    if (!claimSnap.exists) {
      return NextResponse.json(
        { success: false, error: "Claim not found" },
        { status: 404 }
      );
    }

    await claimRef.update({ status });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating claim (admin):", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}