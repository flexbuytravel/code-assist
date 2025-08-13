"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface PaymentDetails {
  status: string;
  amount: number;
  currency: string;
  packageId: string;
  paymentOption: string;
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) return;

    const fetchPayment = async () => {
      try {
        const res = await fetch(`/api/stripe/verify-payment?session_id=${sessionId}`);
        const data = await res.json();

        if (res.ok) {
          setPayment(data);
        } else {
          console.error("Payment verification failed:", data.error);
        }
      } catch (err) {
        console.error("Error verifying payment:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [sessionId]);

  if (loading) {
    return <div className="p-6 text-lg">Verifying payment...</div>;
  }

  if (!payment) {
    return <div className="p-6 text-lg text-red-500">Payment verification failed.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-green-600">Payment Successful!</h1>
      <p className="mt-4">
        You paid{" "}
        <strong>
          ${(payment.amount / 100).toFixed(2)} {payment.currency.toUpperCase()}
        </strong>{" "}
        for package ID <strong>{payment.packageId}</strong>.
      </p>
      <p className="mt-2">Payment Option: <strong>{payment.paymentOption}</strong></p>
      <p className="mt-4 text-gray-600">
        You can now proceed to book your trips with Monster Reservations!
      </p>
    </div>
  );
}