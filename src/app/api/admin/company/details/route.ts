import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { doc, getDoc } from "firebase-admin/firestore";

export async function POST(request: Request) {
  try {
    const { companyId } = await request.json();

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "Missing companyId" },
        { status: 400 }
      );
    }

    const companyRef = doc(adminDb, "companies", companyId);
    const companySnap = await getDoc(companyRef);

    if (!companySnap.exists) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, company: companySnap.data() },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching company details:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}