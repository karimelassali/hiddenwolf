'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';


export const Countdown = ({ number , target , usage,onComplete}) => {
  const [timeLeft, setTimeLeft] = useState(number);
const router = useRouter();


  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTimeLeft) => {
        if (prevTimeLeft > 0) {
          return prevTimeLeft - 1;
        }

        clearInterval(timer);
       if(target){
        router.push(target);
       }
       if(onComplete){
        onComplete();
       }
        return 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [number]);

  
  const seconds = timeLeft;

  return (
    <div className="flex gap-2">
      <div className="flex flex-col items-center">
        <span className="text-sm font-bold">{seconds}</span>
        <span className="text-xs">Seconds</span>
      </div>
    </div>
  );
};
