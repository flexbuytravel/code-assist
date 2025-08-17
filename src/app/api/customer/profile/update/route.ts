import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

/**
 * POST /api/customer/profile/update
 * Allows a logged-in customer to update their profile information
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(idToken);
    const userId = decoded.uid;

    const body = await request.json();
    const { name, phone, address } = body;

    if (!name && !phone && !address) {
      return NextResponse.json(
        { success: false, error: "No fields provided for update" },
        { status: 400 }
      );
    }

    const userRef = adminDb.collection("users").doc(userId);

    await userRef.set(
      {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(address && { address }),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, message: "Profile updated successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}