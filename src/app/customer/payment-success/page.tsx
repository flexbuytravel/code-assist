"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface PaymentDetails {
  status: string;
  amount_total: number;
  packageId?: string;
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("Missing session ID.");
      setLoading(false);
      return;
    }

    const fetchPaymentDetails = async () => {
      try {
        const res = await fetch(`/api/stripe/verify-payment?session_id=${sessionId}`);
        if (!res.ok) throw new Error("Failed to verify payment");
        const data = await res.json();
        setPaymentDetails(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [sessionId]);

  if (loading) return <p>Loading payment details...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Payment Successful 🎉</h1>
      <p>Status: {paymentDetails?.status}</p>
      <p>
        Amount Paid:{" "}
        {paymentDetails
          ? `$${(paymentDetails.amount_total / 100).toFixed(2)}`
          : "Unknown"}
      </p>
      {paymentDetails?.packageId && (
        <p>Package ID: {paymentDetails.packageId}</p>
      )}
      <p>
        Thank you for your payment! You can now book your trips with Monster
        Reservations.
      </p>
    </div>
  );
}