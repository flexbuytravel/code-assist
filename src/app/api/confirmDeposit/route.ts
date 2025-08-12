import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";

// Expected request body: { customerId: string }
export async function POST(request: Request) {
  try {
    const { customerId } = await request.json();
    if (!customerId) {
      return NextResponse.json({ error: "Missing customerId" }, { status: 400 });
    }

    const customerRef = doc(db, "customers", customerId);
    const customerSnap = await getDoc(customerRef);
    if (!customerSnap.exists()) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

    await updateDoc(customerRef, {
      depositPaid: true,
      expiresAt: sixMonthsFromNow
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error confirming deposit:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}