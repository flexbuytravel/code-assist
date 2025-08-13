import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { packageId, referralCode } = body;

    if (!packageId || !referralCode) {
      return NextResponse.json({ error: "Package ID and referral code are required" }, { status: 400 });
    }

    // Look up the package
    const packageDoc = await db.collection("packages").doc(packageId).get();
    if (!packageDoc.exists) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const packageData = packageDoc.data();

    // Check referral code matches agent's referral code
    const agentDoc = await db.collection("agents").doc(packageData.agentId).get();
    if (!agentDoc.exists) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const agentData = agentDoc.data();
    if (agentData.referralCode !== referralCode) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
    }

    // ✅ Package is valid - return details for registration form
    return NextResponse.json({
      packageId,
      title: packageData.title,
      description: packageData.description,
      trips: packageData.trips,
      price: packageData.price,
      agentName: agentData.name,
      companyId: packageData.companyId
    });

  } catch (error) {
    console.error("Error validating package:", error);
    return NextResponse.json({ error: "Failed to validate package" }, { status: 500 });
  }
}