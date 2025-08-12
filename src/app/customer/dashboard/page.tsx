"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function CustomerDashboard() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const [packageData, setPackageData] = useState<any>(null);
  const [deposit, setDeposit] = useState(false);
  const [doubleUp, setDoubleUp] = useState(false);
  const [fullPayment, setFullPayment] = useState(false);
  const [basePrice, setBasePrice] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [trips, setTrips] = useState(0);

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    loadPackage();
  }, [user]);

  const loadPackage = async () => {
    const userDoc = await getDoc(doc(db, "users", user!.uid));
    if (!userDoc.exists()) return;

    const userData = userDoc.data();
    const pkgDoc = await getDoc(doc(db, "packages", userData.packageId));
    if (pkgDoc.exists()) {
      const pkg = pkgDoc.data();
      setPackageData(pkg);
      setBasePrice(pkg.price);
      setTotalPrice(pkg.price);
      setTrips(pkg.trips || 0);
    }
  };

  useEffect(() => {
    let price = basePrice;
    let tripCount = packageData?.trips || 0;

    if (deposit) {
      price = 200;
      tripCount += 1;
    }
    if (doubleUp) {
      price = 600;
      tripCount *= 2;
    }
    if (fullPayment) {
      price = basePrice;
    }

    setTotalPrice(price);
    setTrips(tripCount);
  }, [deposit, doubleUp, fullPayment, basePrice, packageData]);

  const handlePayment = async () => {
    if (!user) return;

    await updateDoc(doc(db, "users", user.uid), {
      paymentChoice: fullPayment
        ? "full"
        : deposit
        ? "deposit"
        : doubleUp
        ? "double-up"
        : "none",
      trips,
      paymentDue: totalPrice,
      paymentStatus: "pending",
    });

    // Send to backend to create Stripe checkout session
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: totalPrice * 100, userId: user.uid }),
    });

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Payment setup failed");
    }
  };

  if (!packageData) {
    return <p>Loading package...</p>;
  }

  return (
    <div className="max-w-lg mx-auto mt-10 p-4 border rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Your Package</h1>

      <p className="mb-2">Package: {packageData.name}</p>
      <p className="mb-2">Base Price: ${basePrice}</p>
      <p className="mb-2">Trips: {trips}</p>
      <p className="mb-4">Total Price: ${totalPrice}</p>

      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={deposit}
            onChange={() => {
              setDeposit(!deposit);
              setDoubleUp(false);
              setFullPayment(false);
            }}
            className="mr-2"
          />
          $200 Deposit (Adds 1 trip, 6-month timer)
        </label>

        <label className="flex items-center mt-2">
          <input
            type="checkbox"
            checked={doubleUp}
            onChange={() => {
              setDoubleUp(!doubleUp);
              setDeposit(false);
              setFullPayment(false);
            }}
            className="mr-2"
          />
          $600 Double-Up (Doubles trips, 54-month timer)
        </label>

        <label className="flex items-center mt-2">
          <input
            type="checkbox"
            checked={fullPayment}
            onChange={() => {
              setFullPayment(!fullPayment);
              setDeposit(false);
              setDoubleUp(false);
            }}
            className="mr-2"
          />
          Full Payment (Removes timer)
        </label>
      </div>

      <button
        onClick={handlePayment}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        Continue to Payment
      </button>
    </div>
  );
}