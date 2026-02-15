"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import {
    GiWolfHowl,
    GiHeartShield,
    GiTiedScroll,
} from "react-icons/gi";

export default function NewRoleCard({ role, onClose }) {
    const [isFlipped, setIsFlipped] = useState(false);

    // Determine role-specific styles
    const getRoleConfig = () => {
        switch (role) {
            case "wolf":
                return {
                    icon: <GiWolfHowl className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] text-9xl" />,
                    color: "text-red-500",
                    title: "The Wolf",
                    desc: "Hunt the villagers in the shadows. Survive the night.",
                    border: "border-red-900",
                    bgGradient: "from-red-950 via-black to-red-950"
                };
            case "seer":
                return {
                    icon: <div className="text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)] text-9xl">👁️</div>,
                    color: "text-blue-400",
                    title: "The Seer",
                    desc: "Unveil the truth. You can see one player's role each night.",
                    border: "border-blue-900",
                    bgGradient: "from-blue-950 via-black to-blue-950"
                };
            case "doctor":
                return {
                    icon: <GiHeartShield className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] text-9xl" />,
                    color: "text-emerald-400",
                    title: "The Doctor",
                    desc: "Heal the wounded. You can save one player each night.",
                    border: "border-emerald-900",
                    bgGradient: "from-emerald-950 via-black to-emerald-950"
                };
            default: // villager
                return {
                    icon: <div className="text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] text-9xl">👨‍🌾</div>,
                    color: "text-amber-400",
                    title: "Villager",
                    desc: "Find the wolf among you. Your voice is your only weapon.",
                    border: "border-amber-900",
                    bgGradient: "from-amber-950 via-black to-amber-950"
                };
        }
    };

    const config = getRoleConfig();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
        >
            <div className="relative w-full max-w-sm aspect-[3/4]">
                <motion.div
                    className="w-full h-full relative preserve-3d cursor-pointer"
                    initial={false}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.8, type: "spring", stiffness: 200, damping: 25 }}
                    onClick={() => !isFlipped && setIsFlipped(true)}
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    <div
                        className="absolute inset-0 backface-hidden rounded-2xl border-[3px] border-amber-500 bg-stone-800 shadow-[0_0_50px_rgba(251,191,36,0.2)] flex items-center justify-center overflow-hidden"
                        style={{ backfaceVisibility: 'hidden' }}
                    >
                        {/* Background Texture */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-20" />
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 via-stone-900 to-amber-600/20" />

                        {/* Inner Decoration */}
                        <div className="absolute inset-4 border border-amber-400/40 rounded-xl flex items-center justify-center">
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-400/10 to-transparent opacity-50" />
                        </div>

                        {/* Center Symbol */}
                        <div className="flex flex-col items-center gap-4 z-10">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-amber-500/30 blur-2xl rounded-full animate-pulse group-hover:bg-amber-500/40 transition-all duration-500" />
                                <GiTiedScroll className="relative text-8xl text-amber-400 drop-shadow-xl transform group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <p className="font-serif text-amber-400 font-bold uppercase tracking-[0.5em] text-sm mt-8 border-b border-amber-500/40 pb-2 drop-shadow-md">
                                Fate Awaits
                            </p>
                            <p className="text-amber-300/80 text-xs uppercase tracking-widest animate-pulse mt-2 font-semibold">
                                Tap to Reveal
                            </p>
                        </div>
                    </div>

                    {/* --- CARD FRONT (Face Up / Role Reveal) --- */}
                    <div
                        className={`absolute inset-0 backface-hidden rounded-2xl border-[3px] ${config.border} bg-gradient-to-br ${config.bgGradient} shadow-[0_0_80px_rgba(255,255,255,0.1)] flex flex-col items-center p-6 overflow-hidden`}
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                        {/* Background Noise/Texture */}
                        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
                        <div className="absolute inset-0 bg-white/5 mix-blend-overlay pointer-events-none" /> {/* Extra brightness */}

                        {/* Top Icon */}
                        <div className="mt-12 mb-8 relative z-10">
                            <motion.div
                                initial={{ scale: 0, opacity: 0, rotate: -180 }}
                                animate={{ scale: isFlipped ? 1 : 0, opacity: isFlipped ? 1 : 0, rotate: isFlipped ? 0 : -180 }}
                                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                            >
                                {config.icon}
                            </motion.div>
                        </div>

                        {/* Text Content */}
                        <div className="text-center space-y-4 z-10">
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: isFlipped ? 1 : 0, y: isFlipped ? 0 : 20 }}
                                transition={{ delay: 0.5 }}
                                className={`text-5xl font-serif font-black ${config.color} uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] glow-text`}
                            >
                                {config.title}
                            </motion.h2>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: isFlipped ? 1 : 0 }}
                                transition={{ delay: 0.7 }}
                                className="w-full h-px bg-gradient-to-r from-transparent via-white/40 to-transparent my-4"
                            />

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: isFlipped ? 1 : 0 }}
                                transition={{ delay: 0.8 }}
                                className="text-stone-100 font-serif text-lg md:text-xl leading-relaxed px-4 drop-shadow-md font-medium"
                            >
                                {config.desc}
                            </motion.p>
                        </div>

                        {/* Bottom Action Area */}
                        <div className="absolute bottom-8 left-6 right-6 z-20">
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: isFlipped ? 1 : 0, y: isFlipped ? 0 : 20 }}
                                transition={{ delay: 1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClose();
                                }}
                                className={`w-full py-4 bg-stone-900/80 hover:bg-stone-800 text-stone-200 border border-stone-600 hover:border-white/50 font-serif font-bold uppercase tracking-widest rounded-lg transition-all shadow-xl`}
                            >
                                I Accept
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
