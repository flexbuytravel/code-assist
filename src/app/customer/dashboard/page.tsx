'use client';

import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function CustomerDashboard() {
  const auth = getAuth();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<string>('unpaid');
  const [packageData, setPackageData] = useState<any>(null);

  // Payment options
  const [deposit, setDeposit] = useState(false);
  const [doubleUp, setDoubleUp] = useState(false);
  const [insurance, setInsurance] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [trips, setTrips] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }
      setUser(currentUser);

      const userRef = doc(db, 'customers', currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setPaymentStatus(data.paymentStatus || 'unpaid');
        setPackageData(data.package || null);
        setTrips(data.trips || 0);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Recalculate total price whenever options change
  useEffect(() => {
    if (!packageData) return;

    let price = packageData.price || 0;
    let tripCount = packageData.trips || 0;

    if (deposit) {
      price = 200; // deposit fixed
      tripCount += 1;
    }
    if (doubleUp) {
      price = 600; // double-up fixed
      tripCount = tripCount * 2; // double trips
    }
    if (insurance) {
      price += 100; // example insurance price
    }

    setTotalPrice(price);
    setTrips(tripCount);
  }, [deposit, doubleUp, insurance, packageData]);

  const handlePayment = async () => {
    if (!user) return;

    // Timer logic
    let timerEnd = null;
    if (deposit) {
      timerEnd = new Date();
      timerEnd.setMonth(timerEnd.getMonth() + 6);
    } else if (doubleUp) {
      timerEnd = new Date();
      timerEnd.setMonth(timerEnd.getMonth() + 54);
    }

    const userRef = doc(db, 'customers', user.uid);
    await updateDoc(userRef, {
      paymentStatus: deposit ? 'deposit' : doubleUp ? 'doubleUp' : 'full',
      trips,
      totalPaid: totalPrice,
      ...(timerEnd ? { timerEnd: timerEnd.toISOString() } : {}),
    });

    // Redirect to Stripe checkout
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: totalPrice * 100,
        customerId: user.uid,
      }),
    });

    const { url } = await res.json();
    if (url) {
      window.location.href = url;
    }
  };

  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  // Already paid view
  if (paymentStatus !== 'unpaid') {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 bg-white shadow rounded">
        <h1 className="text-2xl font-bold mb-4">Your Booking</h1>
        <p className="mb-2">Trips available: {trips}</p>
        <p className="mb-4">Total paid: ${packageData?.totalPaid || totalPrice}</p>
        <p className="mb-4">
          To book your trip, please call Monster Reservations at{' '}
          <strong>1-800-123-4567</strong>.
        </p>
      </div>
    );
  }

  // Payment selection view
  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Complete Your Payment</h1>

      <div className="mb-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={deposit}
            onChange={() => {
              setDeposit(!deposit);
              if (!deposit) setDoubleUp(false); // can't double up with deposit
            }}
          />
          <span>Pay Deposit ($200) — Adds 1 trip, 6 months timer</span>
        </label>

        <label className="flex items-center space-x-2 mt-2">
          <input
            type="checkbox"
            checked={doubleUp}
            onChange={() => {
              setDoubleUp(!doubleUp);
              if (!doubleUp) setDeposit(false); // can't deposit with double up
            }}
          />
          <span>Double-Up ($600) — Doubles trips, 54 months timer</span>
        </label>

        <label className="flex items-center space-x-2 mt-2">
          <input
            type="checkbox"
            checked={insurance}
            onChange={() => setInsurance(!insurance)}
          />
          <span>Trip Insurance (+$100)</span>
        </label>
      </div>

      <div className="mt-4">
        <p className="font-bold">Total: ${totalPrice}</p>
        <p>Trips: {trips}</p>
      </div>

      <button
        onClick={handlePayment}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Proceed to Payment
      </button>
    </div>
  );
}