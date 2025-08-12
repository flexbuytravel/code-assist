'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Hourglass } from 'lucide-react';

interface CountdownTimerProps {
  packageId: string;
  onExpire?: () => void;
}

export function CountdownTimer({ packageId, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const storageKey = `flexbuy_expiry_${packageId}`;
    let expiryTime: number;
    const savedExpiry = localStorage.getItem(storageKey);

    if (savedExpiry) {
      expiryTime = parseInt(savedExpiry, 10);
    } else {
      expiryTime = new Date().getTime() + 48 * 60 * 60 * 1000;
      localStorage.setItem(storageKey, expiryTime.toString());
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = expiryTime - now;

      if (distance < 0) {
        if (!isExpired) {
          setIsExpired(true);
          onExpire?.();
        }
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return false; // Stop interval
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds });
      return true; // Continue interval
    };

    if (updateTimer()) {
        const interval = setInterval(() => {
            if (!updateTimer()) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }
  }, [packageId, onExpire, isExpired]);

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <span className="text-3xl font-bold font-mono tracking-tighter text-destructive">{value.toString().padStart(2, '0')}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );

  if (!isClient) {
    return (
        <Card className="bg-destructive/10 border-destructive/50">
            <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                    <Hourglass className="h-4 w-4 text-destructive" />
                    <p className="text-sm font-semibold text-destructive">Loading Offer...</p>
                </div>
            </CardContent>
        </Card>
    );
  }
  
  if (isExpired) {
      return (
         <Card className="bg-destructive/10 border-destructive/50">
            <CardContent className="p-4 text-center">
                <p className="text-destructive font-bold text-xl">This offer has expired!</p>
            </CardContent>
         </Card>
      )
  }


  return (
    <Card className="bg-destructive/10 border-destructive/50">
      <CardContent className="p-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 mb-2">
              <Hourglass className="h-4 w-4 text-destructive" />
              <p className="text-sm font-semibold text-destructive">Offer Ends In:</p>
            </div>
            <div className="flex justify-center items-center gap-4">
              <TimeBlock value={timeLeft.hours} label="Hours" />
              <span className="text-3xl font-bold text-destructive">:</span>
              <TimeBlock value={timeLeft.minutes} label="Minutes" />
              <span className="text-3xl font-bold text-destructive">:</span>
              <TimeBlock value={timeLeft.seconds} label="Seconds" />
            </div>
          </div>
      </CardContent>
    </Card>
  );
}
