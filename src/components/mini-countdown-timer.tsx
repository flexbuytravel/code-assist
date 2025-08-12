'use client';

import { useState, useEffect } from 'react';
import { Hourglass } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MiniCountdownTimerProps {
  packageId: string;
  className?: string;
}

export function MiniCountdownTimer({ packageId, className }: MiniCountdownTimerProps) {
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
            setIsExpired(true);
            setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
            return false; // Stop interval
        }

        const hours = Math.floor(distance / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
        return true; // Continue interval
    }

    if(updateTimer()){
        const interval = setInterval(() => {
            if(!updateTimer()){
                clearInterval(interval);
            }
        }, 1000);
        return () => clearInterval(interval);
    }
  }, [packageId]);

  if (!isClient) {
    return <div className={cn("text-xs text-muted-foreground animate-pulse", className)}>Loading...</div>;
  }

  return (
    <div className={cn("flex items-center justify-end gap-1 text-xs font-mono", isExpired ? 'text-destructive' : 'text-foreground', className)}>
      {isExpired ? (
        <span>Expired</span>
      ) : (
        <>
            <Hourglass className="h-3 w-3" />
            <span>
              {String(timeLeft.hours).padStart(2, '0')}:
              {String(timeLeft.minutes).padStart(2, '0')}:
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
        </>
      )}
    </div>
  );
}
