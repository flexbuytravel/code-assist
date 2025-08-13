'use client';

import Link from 'next/link';

export default function PaymentSuccess() {
  return (
    <div className="max-w-lg mx-auto mt-10 p-6 border rounded-lg shadow-lg text-center">
      <h1 className="text-3xl font-bold text-green-600 mb-4">Payment Successful!</h1>
      <p className="mb-4">
        Your payment has been processed. Your package and trips have been updated.
      </p>
      <p className="mb-4">
        You can now log into your dashboard to view your updated trips and booking details.
      </p>

      <Link
        href="/customer/dashboard"
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}