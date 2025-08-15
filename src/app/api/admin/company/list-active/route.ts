import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { collection, getDocs, query, where } from "firebase-admin/firestore";

export async function GET() {
  try {
    const q = query(collection(adminDb, "companies"), where("status", "==", "active"));
    const snapshot = await getDocs(q);

    const companies = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, companies }, { status: 200 });
  } catch (error: any) {
    console.error("Error listing active companies:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}