import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

/**
 * POST /api/admin/company/create
 * Creates a new company document.
 * Requires admin privileges.
 */
export async function POST(request: Request) {
  try {
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

    // ✅ Parse body
    const body = await request.json();
    const { name, address, contactEmail } = body;

    if (!name || !contactEmail) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ Create company in Firestore
    const newCompanyRef = adminDb.collection("companies").doc();
    const companyData = {
      name,
      address: address || "",
      contactEmail,
      createdAt: new Date(),
      createdBy: decoded.uid,
    };

    await newCompanyRef.set(companyData);

    return NextResponse.json(
      { success: true, companyId: newCompanyRef.id, company: companyData },
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