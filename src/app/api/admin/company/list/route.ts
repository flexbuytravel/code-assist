import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";
import { collection, getDocs } from "firebase-admin/firestore";

export async function GET(req: Request) {
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

    const companiesSnapshot = await getDocs(collection(db, "companies"));
    const companies = companiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ companies }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching companies:", error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}