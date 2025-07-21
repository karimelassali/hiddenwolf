'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaClock, FaHourglassHalf } from 'react-icons/fa';

export const Countdown = ({ number = 15, target, usage, onComplete }) => {
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
    <motion.div 
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="flex gap-3 items-center"
   >
    <div className="relative">
      <motion.div 
        animate={{ rotate: timeLeft <= 10 ? [0, -10, 10, -10, 0] : 0 }}
        transition={{ 
          duration: 0.5, 
          repeat: timeLeft <= 10 ? Infinity : 0,
          repeatDelay: 0.1 
        }}
        className={`w-16 h-16 rounded-full border-4 flex items-center justify-center backdrop-blur-md shadow-lg transition-all duration-300 ${
          timeLeft <= 10 
            ? 'border-red-500/70 bg-red-500/20 shadow-red-500/30' 
            : timeLeft <= 30
            ? 'border-amber-500/70 bg-amber-500/20 shadow-amber-500/30'
            : 'border-emerald-500/70 bg-emerald-500/20 shadow-emerald-500/30'
        }`}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          {timeLeft <= 10 ? (
            <FaHourglassHalf className={`text-xl ${
              timeLeft <= 10 ? 'text-red-400' : 'text-amber-400'
            }`} />
          ) : (
            <FaClock className="text-xl text-emerald-400" />
          )}
        </motion.div>
      </motion.div>
      
      {/* Pulse ring for urgency */}
      {timeLeft <= 10 && (
        <motion.div
          animate={{ scale: [1, 1.5], opacity: [0.7, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute inset-0 rounded-full border-2 border-red-500/50"
        ></motion.div>
      )}
    </div>
    
    <div className="flex flex-col items-center">
      <motion.span 
        key={timeLeft}
        initial={{ scale: 1.2, color: timeLeft <= 10 ? '#ef4444' : '#10b981' }}
        animate={{ scale: 1 }}
        className={`text-3xl font-bold tabular-nums transition-colors duration-200 ${
          timeLeft <= 10 
            ? 'text-red-400' 
            : timeLeft <= 30 
            ? 'text-amber-400' 
            : 'text-emerald-400'
        }`}
      >
        {timeLeft}
      </motion.span>
      
      <span className={`text-sm font-medium transition-colors duration-200 ${
        timeLeft <= 10 
          ? 'text-red-300' 
          : timeLeft <= 30 
          ? 'text-amber-300' 
          : 'text-emerald-300'
      }`}>
        Seconds
      </span>
      
      {/* Progress bar */}
      <div className="w-16 h-1 bg-slate-700/50 rounded-full mt-2 overflow-hidden">
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: `${(timeLeft / 60) * 100}%` }}
          className={`h-full rounded-full transition-colors duration-200 ${
            timeLeft <= 10 
              ? 'bg-red-500' 
              : timeLeft <= 30 
              ? 'bg-amber-500' 
              : 'bg-emerald-500'
          }`}
        />
      </div>
    </div>
   </motion.div>
  );
};
