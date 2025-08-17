import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * GET /api/admin/company/get?id=COMPANY_ID
 * Returns company details
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("id");

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "Missing company ID" },
        { status: 400 }
      );
    }

    const companyRef = adminDb.collection("companies").doc(companyId);
    const companySnap = await companyRef.get();

    if (!companySnap.exists) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, company: companySnap.data() });
  } catch (err) {
    console.error("Error fetching company:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}