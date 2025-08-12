// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, confirmPassword, phone, address, packageId, referralCode } = await req.json();

    if (!name || !email || !password || !confirmPassword || !packageId || !referralCode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Verify package exists and is not claimed
    const packageRef = doc(db, 'packages', packageId);
    const packageSnap = await getDoc(packageRef);

    if (!packageSnap.exists()) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    const packageData = packageSnap.data();

    if (packageData.claimedBy) {
      return NextResponse.json({ error: 'Package already claimed' }, { status: 400 });
    }

    if (packageData.referralCode !== referralCode) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
    }

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Store customer in Firestore
    await setDoc(doc(db, 'customers', uid), {
      name,
      email,
      phone: phone || null,
      address: address || null,
      packageId,
      referralCode,
      price: packageData.price,
      trips: packageData.trips || 1,
      companyId: packageData.companyId || null,
      agentId: packageData.agentId || null,
      createdAt: serverTimestamp(),
      role: 'customer',
    });

    // Mark package as claimed
    await updateDoc(packageRef, {
      claimedBy: uid,
      claimedAt: serverTimestamp(),
      status: 'claimed',
    });

    return NextResponse.json({ success: true, message: 'Customer registered and package claimed successfully' });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}