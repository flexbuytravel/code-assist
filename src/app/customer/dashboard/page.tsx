"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function CustomerDashboard() {
  const router = useRouter();
  const auth = getAuth();
  const [loading, setLoading] = useState(true);
  const [packageData, setPackageData] = useState<any>(null);
  const [deposit, setDeposit] = useState(false);
  const [doubleUp, setDoubleUp] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [tripCount, setTripCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) {
        router.push("/auth/login");
        return;
      }

      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (!userDoc.exists()) return;

      const data = userDoc.data();
      if (!data.packageId) {
        router.push("/home");
        return;
      }

      const pkgDoc = await getDoc(doc(db, "packages", data.packageId));
      if (pkgDoc.exists()) {
        const pkg = pkgDoc.data();
        setPackageData(pkg);
        setTotalPrice(pkg.price);
        setTripCount(pkg.trips || 1);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!packageData) return;
    let price = packageData.price;
    let trips = packageData.trips || 1;

    if (deposit) {
      price = 200;
      trips += 1;
    }

    if (doubleUp) {
      price += 600;
      trips *= 2;
    }

    setTotalPrice(price);
    setTripCount(trips);
  }, [deposit, doubleUp, packageData]);

  const handleCheckout = async () => {
    const res = await fetch("/api/customer/checkout", {
      method: "POST",
      body: JSON.stringify({
        packageId: packageData.id,
        deposit,
        doubleUp
      })
    });
    const { url } = await res.json();
    router.push(url);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-lg mx-auto mt-10 p-4 border rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Your Package</h1>
      <p>Package: {packageData?.name}</p>
      <p>Trips: {tripCount}</p>
      <p>Total Price: ${totalPrice}</p>

      <div className="mt-4">
        <label>
          <input
            type="checkbox"
            checked={deposit}
            onChange={(e) => setDeposit(e.target.checked)}
          />
          Pay Deposit Only ($200, adds 1 trip, 6-month window)
        </label>
      </div>

      <div className="mt-2">
        <label>
          <input
            type="checkbox"
            checked={doubleUp}
            onChange={(e) => setDoubleUp(e.target.checked)}
          />
          Double Up ($600, doubles trips, 54-month window)
        </label>
      </div>

      <button
        onClick={handleCheckout}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Continue to Payment
      </button>
    </div>
  );
}