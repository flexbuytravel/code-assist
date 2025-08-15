import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin"; // Correct import

/**
 * POST /api/admin/company/create
 * Creates a new company in Firestore.
 * Requires the user to be authenticated as an admin.
 */
export async function POST(request: Request) {
  try {
    const { name, details, authToken } = await request.json();

    if (!name || !authToken) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(authToken);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check admin role
    if (decodedToken.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Create new company document
    const newCompanyRef = adminDb.collection("companies").doc();
    await newCompanyRef.set({
      name,
      details: details || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: true, companyId: newCompanyRef.id },
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