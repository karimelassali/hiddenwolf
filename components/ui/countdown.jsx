'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const Countdown = ({ number = 20, target, usage, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(number);
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev > 1) {
          return prev - 1;
        }

        if (target) {
          router.push(target);
        }

        if (onComplete) {
          onComplete(); //
        }

        return number; //  reset to number
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [number, onComplete, target, router]);

  return (
    <div className="flex gap-2">
      <div className="flex flex-col items-center">
        <span className="text-sm font-bold">{timeLeft}</span>
        <span className="text-xs">Seconds</span>
      </div>
    </div>
  );
};
