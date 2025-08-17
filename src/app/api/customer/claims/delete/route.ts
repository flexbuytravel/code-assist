import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * POST /api/customer/claims/delete
 * Deletes a claim (only allowed if still pending).
 */
export async function POST(request: Request) {
  try {
    const { claimId } = await request.json();

    if (!claimId) {
      return NextResponse.json(
        { success: false, error: "Missing claimId" },
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

    const claimData = claimSnap.data();
    if (claimData?.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "Only pending claims can be deleted" },
        { status: 403 }
      );
    }

    await claimRef.delete();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting claim:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}