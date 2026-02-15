"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function TurnTimer({ duration, onComplete, stage }) {
    const [timeLeft, setTimeLeft] = useState(duration);

    useEffect(() => {
        setTimeLeft(duration);
    }, [duration]);

    useEffect(() => {
        if (timeLeft <= 0) {
            if (onComplete) onComplete();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, onComplete]);

    // Calculations for circular progress
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const progress = (timeLeft / duration) * circumference;
    const dashoffset = circumference - progress;

    // Determine colors based on urgency
    let strokeColor = "stroke-emerald-500";
    let textColor = "text-emerald-400";

    if (timeLeft <= 10) {
        strokeColor = "stroke-amber-500";
        textColor = "text-amber-400";
    }
    if (timeLeft <= 5) {
        strokeColor = "stroke-red-600";
        textColor = "text-red-500";
    }

    return (
        <div className="relative flex items-center justify-center w-16 h-16">
            {/* Glow effect based on stage */}
            <div className={`absolute inset-0 blur-xl opacity-30 ${stage === 'night' ? 'bg-purple-600' : 'bg-amber-600'}`} />

            <svg className="transform -rotate-90 w-full h-full drop-shadow-md">
                {/* Background Circle */}
                <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    className="text-stone-800"
                />
                {/* Progress Circle */}
                <motion.circle
                    cx="32"
                    cy="32"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashoffset}
                    strokeLinecap="round"
                    className={`${strokeColor} transition-all duration-1000 ease-linear`}
                />
            </svg>
            <div className={`absolute font-mono font-bold text-lg ${textColor}`}>
                {timeLeft}
            </div>
        </div>
    );
}
