import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

/**
 * POST /api/admin/company/create
 * Creates a new company in Firestore.
 * Requires admin privileges.
 */
export async function POST(request: Request) {
  try {
    const { companyId, data } = await request.json();

    if (!companyId || !data) {
      return NextResponse.json(
        { success: false, error: "Missing companyId or data" },
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

    // ✅ Ensure company doesn’t already exist
    const companyRef = adminDb.collection("companies").doc(companyId);
    const companySnap = await companyRef.get();

    if (companySnap.exists) {
      return NextResponse.json(
        { success: false, error: "Company already exists" },
        { status: 409 }
      );
    }

    // ✅ Create company
    await companyRef.set({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: true, message: "Company created successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}