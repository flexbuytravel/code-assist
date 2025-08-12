import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const { name, price, referralId, agentId } = await req.json();

    if (!name || !price || !referralId || !agentId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // TODO: Add auth validation (role: 'agent' or 'company')

    // Get agent data to link companyId
    const agentRef = doc(firestore, "agents", agentId);
    const agentSnap = await getDoc(agentRef);
    if (!agentSnap.exists()) {
      return NextResponse.json(
        { success: false, message: "Agent not found" },
        { status: 404 }
      );
    }

    const agentData = agentSnap.data();
    const companyId = agentData.companyId;
    if (!companyId) {
      return NextResponse.json(
        { success: false, message: "Agent is not linked to a company" },
        { status: 400 }
      );
    }

    // Create package with UUID
    const packageId = uuidv4();
    await setDoc(doc(firestore, "packages", packageId), {
      packageId,
      name,
      price,
      referralId,
      agentId,
      companyId,
      createdAt: new Date().toISOString(),
      claimed: false,
      depositPaid: false,
    });

    return NextResponse.json({
      success: true,
      message: "Package created successfully",
      data: { packageId, name, price, referralId, agentId, companyId },
    });
  } catch (error: any) {
    console.error("Error creating package:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}