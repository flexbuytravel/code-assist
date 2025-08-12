"use client";

import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";

export default function CustomerDashboard() {
  const auth = getAuth(app);
  const db = getFirestore(app);

  const [remainingTime, setRemainingTime] = useState<string>("");

  useEffect(() => {
    const fetchTimer = async () => {
      if (!auth.currentUser) return;

      const docRef = doc(db, "customers", auth.currentUser.uid);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.timerStart) {
          const startTime = new Date(data.timerStart).getTime();
          const expiryTime = startTime + 48 * 60 * 60 * 1000; // 48 hours

          const updateCountdown = () => {
            const now = Date.now();
            const diff = expiryTime - now;

            if (diff <= 0) {
              setRemainingTime("00:00:00");
              return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setRemainingTime(
              `${hours.toString().padStart(2, "0")}:${minutes
                .toString()
                .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
            );
          };

          updateCountdown();
          const interval = setInterval(updateCountdown, 1000);
          return () => clearInterval(interval);
        }
      }
    };

    fetchTimer();
  }, [auth.currentUser]);

  return (
    <div>
      <h1>Customer Dashboard</h1>
      {remainingTime && (
        <div>
          <h2>Time left to purchase:</h2>
          <p>{remainingTime}</p>
        </div>
      )}
    </div>
  );
}