import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin"; // Corrected import
import { getAuth } from "firebase-admin/auth";

/**
 * PATCH /api/admin/company/update
 * Updates company details in Firestore.
 * Requires the user to be authenticated as an admin.
 */
export async function PATCH(request: Request) {
  try {
    const { companyId, updates, authToken } = await request.json();

    if (!companyId || !updates || !authToken) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Verify the Firebase ID token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(authToken);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if the user has admin role
    if (decodedToken.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Update company document in Firestore
    const companyRef = adminDb.collection("companies").doc(companyId);
    await companyRef.update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: true, message: "Company updated successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating company:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}