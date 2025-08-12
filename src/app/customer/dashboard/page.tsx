'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [packageId, setPackageId] = useState<string>('');
  const [packageName, setPackageName] = useState<string>('');
  const [basePrice, setBasePrice] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<'deposit' | 'full'>('deposit');
  const [insurance, setInsurance] = useState<'none' | 'double-up'>('none');
  const [totalPrice, setTotalPrice] = useState<number>(0);

  useEffect(() => {
    // Fetch package data from Firestore (or server)
    async function fetchPackage() {
      const res = await fetch(`/api/customer/package-data`);
      const data = await res.json();
      setPackageId(data.id);
      setPackageName(data.name);
      setBasePrice(data.price);
    }
    fetchPackage();
  }, []);

  useEffect(() => {
    let price = 0;
    if (paymentType === 'deposit') {
      price = 200; // $200 deposit
    } else if (paymentType === 'full') {
      price = basePrice; // full package price
    }

    if (insurance === 'double-up') {
      price += 600; // insurance add-on
    }

    setTotalPrice(price);
  }, [paymentType, insurance, basePrice]);

  const handlePayment = async () => {
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId, paymentType, insurance }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to create checkout session.');
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong starting payment.');
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Customer Dashboard</h1>

      <div className="bg-white shadow rounded p-4">
        <h2 className="text-lg font-semibold mb-2">{packageName}</h2>
        <p>Base Price: ${basePrice}</p>

        <div className="mt-4">
          <label className="block mb-2 font-semibold">Choose Payment Type:</label>
          <div>
            <label className="inline-flex items-center mr-4">
              <input
                type="radio"
                checked={paymentType === 'deposit'}
                onChange={() => setPaymentType('deposit')}
              />
              <span className="ml-2">Deposit ($200)</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                checked={paymentType === 'full'}
                onChange={() => setPaymentType('full')}
              />
              <span className="ml-2">Full Payment (${basePrice})</span>
            </label>
          </div>
        </div>

        <div className="mt-4">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={insurance === 'double-up'}
              onChange={() =>
                setInsurance(insurance === 'double-up' ? 'none' : 'double-up')
              }
            />
            <span className="ml-2">Add Double-Up Insurance (+$600)</span>
          </label>
        </div>

        <div className="mt-4 font-bold text-lg">
          Total: ${totalPrice}
        </div>

        <button
          onClick={handlePayment}
          className="mt-6 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Pay Now
        </button>
      </div>
    </div>
  );
}