import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";
import { doc, deleteDoc } from "firebase-admin/firestore";

export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
    }

    const idToken = authHeader.replace("Bearer ", "").trim();
    const decodedToken = await getAuth().verifyIdToken(idToken);

    if (!decodedToken.admin) {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const { companyId } = await req.json();
    if (!companyId) {
      return NextResponse.json({ error: "Missing companyId" }, { status: 400 });
    }

    await deleteDoc(doc(db, "companies", companyId));

    return NextResponse.json({ success: true, message: "Company deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting company:", error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}