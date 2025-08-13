import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";
import { doc, setDoc, serverTimestamp } from "firebase-admin/firestore";

export async function POST(req: Request) {
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

    const { companyId, name, address, phone, email } = await req.json();

    if (!companyId || !name || !address || !phone || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await setDoc(doc(db, "companies", companyId), {
      name,
      address,
      phone,
      email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({ success: true, message: "Company created successfully" }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating company:", error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}