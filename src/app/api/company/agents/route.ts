import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { db } from "@/lib/firebase-admin";
import { authMiddleware } from "@/lib/auth-middleware";

export const GET = authMiddleware(async (req, user) => {
  try {
    if (user.role !== "company") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const agentsRef = db.collection("agents").where("companyId", "==", user.companyId);
    const snapshot = await agentsRef.get();

    const agents = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(agents);
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
  }
});