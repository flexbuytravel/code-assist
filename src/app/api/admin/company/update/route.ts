import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";
import { doc, updateDoc } from "firebase-admin/firestore";

export async function PATCH(req: Request) {
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

    const { companyId, updates } = await req.json();

    if (!companyId || !updates || typeof updates !== "object") {
      return NextResponse.json({ error: "Missing or invalid update payload" }, { status: 400 });
    }

    await updateDoc(doc(db, "companies", companyId), updates);

    return NextResponse.json({ success: true, message: "Company updated successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating company:", error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}