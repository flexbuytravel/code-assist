import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

/**
 * PATCH /api/admin/company/update
 * Updates an existing company’s details.
 * Requires admin privileges.
 */
export async function PATCH(request: Request) {
  try {
    const { companyId, updates } = await request.json();

    if (!companyId || !updates) {
      return NextResponse.json(
        { success: false, error: "Missing companyId or updates" },
        { status: 400 }
      );
    }

    // ✅ Verify auth & role
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(idToken);

    if (decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // ✅ Get company ref
    const companyRef = adminDb.collection("companies").doc(companyId);
    const companySnap = await companyRef.get();

    if (!companySnap.exists) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 }
      );
    }

    // ✅ Update company
    await companyRef.update(updates);

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