"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function CustomerDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [packageData, setPackageData] = useState<any>(null);
  const [insurance, setInsurance] = useState(false);
  const [paymentType, setPaymentType] = useState<"deposit" | "double" | "full" | null>(null);
  const [price, setPrice] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      fetchPackageData();
    }
  }, [user]);

  const fetchPackageData = async () => {
    try {
      const res = await axios.get(`/api/customers/package`);
      setPackageData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load package");
    }
  };

  const calculatePrice = () => {
    if (!packageData) return;

    let base = 0;

    if (paymentType === "deposit") base = 200;
    if (paymentType === "double") base = 600;
    if (paymentType === "full") base = packageData.remainingBalance;

    if (insurance) {
      // Insurance doubles trips but does not change price for deposit/double
      // You could add cost logic here if insurance had a cost
    }

    setPrice(base);
  };

  useEffect(() => {
    calculatePrice();
  }, [paymentType, insurance, packageData]);

  const handlePayment = async () => {
    if (!paymentType) {
      setError("Please choose a payment option.");
      return;
    }

    try {
      const res = await axios.post("/api/payments/checkout", {
        paymentType,
        insurance,
      });
      window.location.href = res.data.url; // Stripe redirect
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to initiate payment");
    }
  };

  if (loading || !packageData) {
    return <p className="text-center mt-6">Loading dashboard...</p>;
  }

  return (
    <div className="max-w-3xl mx-auto mt-8 p-6 border rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Your Travel Package</h1>

      {error && <p className="text-red-500">{error}</p>}

      <div className="mb-6">
        <p><strong>Package ID:</strong> {packageData.id}</p>
        <p><strong>Trips Included:</strong> {packageData.trips}</p>
        <p><strong>Price Remaining:</strong> ${packageData.remainingBalance}</p>
        {packageData.bookingDeadline && (
          <p><strong>Booking Deadline:</strong> {new Date(packageData.bookingDeadline).toLocaleDateString()}</p>
        )}
        <p><strong>Status:</strong> {packageData.status}</p>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Choose Payment Option</h2>
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="paymentType"
              value="deposit"
              checked={paymentType === "deposit"}
              onChange={() => setPaymentType("deposit")}
            />
            <span>Pay Deposit ($200) - Adds 1 Trip, +6 months booking</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="paymentType"
              value="double"
              checked={paymentType === "double"}
              onChange={() => setPaymentType("double")}
            />
            <span>Double Up ($600) - Doubles Trips, +54 months booking</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="paymentType"
              value="full"
              checked={paymentType === "full"}
              onChange={() => setPaymentType("full")}
            />
            <span>Pay Full Amount - Removes Timer</span>
          </label>
        </div>
      </div>

      <div className="mb-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={insurance}
            onChange={(e) => setInsurance(e.target.checked)}
          />
          <span>Add Trip Insurance - Doubles Trips</span>
        </label>
      </div>

      <div className="mb-6">
        <p className="text-lg font-bold">Total: ${price}</p>
      </div>

      <button
        onClick={handlePayment}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
      >
        Proceed to Payment
      </button>
    </div>
  );
}