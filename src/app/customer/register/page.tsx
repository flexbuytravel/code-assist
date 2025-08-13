'use client';

import { useState } from 'react';

export default function CustomerRegisterPage() {
  const [packageId, setPackageId] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [packageData, setPackageData] = useState<any>(null);
  const [error, setError] = useState('');

  const validatePackage = async () => {
    setError('');
    try {
      const res = await fetch('/api/customer/package/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId, referralCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Validation failed');
        return;
      }
      setPackageData(data.package);
    } catch (err) {
      console.error('Error validating package:', err);
      setError('Something went wrong.');
    }
  };

  const goToPayment = async (amountType: string) => {
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId, amountType }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Unable to start payment');
      }
    } catch (err) {
      console.error('Error creating checkout session:', err);
      setError('Something went wrong.');
    }
  };

  return (
    <div className="max-w-lg mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Register for Your Package</h1>

      {!packageData ? (
        <>
          <input
            type="text"
            placeholder="Package ID"
            value={packageId}
            onChange={(e) => setPackageId(e.target.value)}
            className="border p-2 w-full mb-4"
          />
          <input
            type="text"
            placeholder="Referral Code"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            className="border p-2 w-full mb-4"
          />
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button
            onClick={validatePackage}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Load Package
          </button>
        </>
      ) : (
        <>
          <h2 className="text-xl mb-4">{packageData.name}</h2>
          <p className="mb-4">Price: ${packageData.price}</p>
          <p className="mb-4">Trips: {packageData.trips}</p>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <div className="space-y-4">
            <button
              onClick={() => goToPayment('deposit')}
              className="bg-yellow-500 text-white px-4 py-2 rounded"
            >
              Pay Deposit ($200)
            </button>
            <button
              onClick={() => goToPayment('double')}
              className="bg-purple-600 text-white px-4 py-2 rounded"
            >
              Double Up ($600)
            </button>
            <button
              onClick={() => goToPayment('full')}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Pay Full Amount
            </button>
          </div>
        </>
      )}
    </div>
  );
}