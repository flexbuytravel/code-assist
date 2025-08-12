// src/app/api/packages/claim/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

export async function POST(req: NextRequest) {
  try {
    const { packageId, referralCode, customerId } = await req.json();

    if (!packageId || !referralCode || !customerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch package
    const packageRef = doc(db, 'packages', packageId);
    const packageSnap = await getDoc(packageRef);

    if (!packageSnap.exists()) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    const packageData = packageSnap.data();

    // Check if package is already claimed
    if (packageData.claimedBy) {
      return NextResponse.json({ error: 'Package already claimed' }, { status: 400 });
    }

    // Check referral code matches
    if (packageData.referralCode !== referralCode) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
    }

    // Attach package to customer
    await updateDoc(packageRef, {
      claimedBy: customerId,
      claimedAt: serverTimestamp(),
      status: 'claimed',
    });

    // Create customer record linked to package
    const customerRef = doc(db, 'customers', customerId);
    await setDoc(customerRef, {
      packageId,
      referralCode,
      price: packageData.price, // locked from Firestore
      trips: packageData.trips || 1,
      companyId: packageData.companyId || null,
      agentId: packageData.agentId || null,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: 'Package claimed successfully',
      package: {
        id: packageId,
        price: packageData.price,
        trips: packageData.trips || 1,
      },
    });

  } catch (error: any) {
    console.error('Error claiming package:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}