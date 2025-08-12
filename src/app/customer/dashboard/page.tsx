"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function CustomerDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [packageData, setPackageData] = useState<any>(null);
  const [paymentType, setPaymentType] = useState<"deposit" | "full">("deposit");
  const [insurance, setInsurance] = useState<"none" | "standard" | "doubleUp">(
    "none"
  );
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const packageId = searchParams.get("packageId");

  // Load package details
  useEffect(() => {
    if (!packageId) return;

    const fetchPackage = async () => {
      try {
        const ref = doc(db, "packages", packageId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          setPackageData(data);
        }
      } catch (err) {
        console.error("Error loading package:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPackage();
  }, [packageId]);

  // Update total price
  useEffect(() => {
    if (!packageData) return;

    let price = 0;

    if (paymentType === "deposit") {
      price = 200;
    } else {
      price = packageData.price || 0;
    }

    if (insurance === "standard") {
      price += 200;
    } else if (insurance === "doubleUp") {
      price += 600;
    }

    setTotal(price);
  }, [packageData, paymentType, insurance]);

  // Start Stripe checkout
  const handleCheckout = async () => {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, paymentType, insurance }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Error starting checkout.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    }
  };

  if (loading) return <p>Loading package...</p>;
  if (!packageData) return <p>Package not found.</p>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Customer Dashboard</h1>

      {searchParams.get("success") && (
        <div className="bg-green-100 p-3 mb-4 text-green-700">
          ✅ Payment successful! You can now book your trips.
        </div>
      )}

      {searchParams.get("canceled") && (
        <div className="bg-red-100 p-3 mb-4 text-red-700">
          ❌ Payment canceled.
        </div>
      )}

      <div className="mb-4">
        <h2 className="font-semibold">Package Name:</h2>
        <p>{packageData.name}</p>
      </div>

      <div className="mb-4">
        <h2 className="font-semibold">Base Price:</h2>
        <p>${packageData.price}</p>
      </div>

      <div className="mb-4">
        <h2 className="font-semibold">Payment Type:</h2>
        <label className="block">
          <input
            type="radio"
            name="paymentType"
            value="deposit"
            checked={paymentType === "deposit"}
            onChange={() => setPaymentType("deposit")}
          />{" "}
          Pay Deposit ($200)
        </label>
        <label className="block">
          <input
            type="radio"
            name="paymentType"
            value="full"
            checked={paymentType === "full"}
            onChange={() => setPaymentType("full")}
          />{" "}
          Pay in Full (${packageData.price})
        </label>
      </div>

      <div className="mb-4">
        <h2 className="font-semibold">Insurance:</h2>
        <label className="block">
          <input
            type="radio"
            name="insurance"
            value="none"
            checked={insurance === "none"}
            onChange={() => setInsurance("none")}
          />{" "}
          No Insurance
        </label>
        <label className="block">
          <input
            type="radio"
            name="insurance"
            value="standard"
            checked={insurance === "standard"}
            onChange={() => setInsurance("standard")}
          />{" "}
          Standard Insurance (+$200)
        </label>
        <label className="block">
          <input
            type="radio"
            name="insurance"
            value="doubleUp"
            checked={insurance === "doubleUp"}
            onChange={() => setInsurance("doubleUp")}
          />{" "}
          Double Up (+$600)
        </label>
      </div>

      <div className="mb-4">
        <h2 className="font-semibold">Total:</h2>
        <p className="text-xl font-bold">${total}</p>
      </div>

      <button
        onClick={handleCheckout}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Pay Now
      </button>
    </div>
  );
}