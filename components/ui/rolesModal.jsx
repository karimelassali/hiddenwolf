import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import {
  GiWolfHowl,
  GiHeartShield,
  GiDeathSkull,
  GiTiedScroll,
} from "react-icons/gi";

export default function RoleRevealModal({ role, onClose }) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Determine role-specific styles
  const getRoleConfig = () => {
    switch (role) {
      case "wolf":
        return {
          icon: <GiWolfHowl className="text-red-500 drop-shadow-lg text-8xl" />,
          color: "text-red-400",
          title: "You are the Wolf",
          desc: "Hunt the villagers in the shadows. Survive.",
          border: "border-red-900/50",
          bgInfo: "bg-red-950/30"
        };
      case "seer":
        return {
          icon: <div className="text-blue-400 drop-shadow-lg text-8xl">👁️</div>,
          color: "text-blue-400",
          title: "You are the Seer",
          desc: "Unveil the truth. Find the wolves.",
          border: "border-blue-900/50",
          bgInfo: "bg-blue-950/30"
        };
      case "doctor":
        return {
          icon: <GiHeartShield className="text-emerald-500 drop-shadow-lg text-8xl" />,
          color: "text-emerald-400",
          title: "You are the Doctor",
          desc: "Heal the wounded. Save lives.",
          border: "border-emerald-900/50",
          bgInfo: "bg-emerald-950/30"
        };
      default: // villager
        return {
          icon: <div className="text-amber-400 drop-shadow-lg text-8xl">👨‍🌾</div>,
          color: "text-amber-400",
          title: "You are a Villager",
          desc: "Find the wolf among you. Use your voice.",
          border: "border-amber-900/50",
          bgInfo: "bg-amber-950/30"
        };
    }
  };

  const config = getRoleConfig();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 perspective-1000"
    >
      <div className="relative w-full max-w-sm aspect-[2/3] perspective-1000">
        <motion.div
          className="w-full h-full relative preserve-3d cursor-pointer"
          initial={false}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 260, damping: 20 }}
          onClick={() => !isFlipped && setIsFlipped(true)}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front of Card (The Back Design) */}
          <div
            className="absolute inset-0 backface-hidden bg-[#1a1614] border-[3px] border-amber-600/40 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden group"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Inner Border & Texture */}
            <div className="absolute inset-3 border border-amber-500/20 rounded-lg flex flex-col items-center justify-between p-4 z-10">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
              <div className="h-full w-px bg-gradient-to-b from-transparent via-amber-500/40 to-transparent" />
              <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
            </div>

            {/* Rich Texture Background */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-20 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-transparent to-black/80" />

            {/* Center Symbol */}
            <div className="flex flex-col items-center gap-6 z-20 transform transition-transform duration-700 hover:scale-105">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full animate-pulse" />
                <GiTiedScroll className="relative text-7xl text-amber-500/80 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
              </div>

              <div className="text-center">
                <p className="font-serif text-amber-500/60 font-bold uppercase tracking-[0.4em] text-lg border-b border-amber-500/20 pb-2 mb-2">Destiny</p>
                <p className="text-amber-700/50 text-[10px] uppercase tracking-widest animate-pulse">Touch to Unveil</p>
              </div>
            </div>
          </div>

          {/* Back of Card (The Role Reveal) */}
          <div
            className={`absolute inset-0 backface-hidden bg-stone-900 border-2 ${config.border} rounded-xl shadow-2xl flex flex-col items-center justify-between p-6 overflow-hidden`}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full mt-8">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: isFlipped ? 1 : 0, opacity: isFlipped ? 1 : 0 }}
                transition={{ delay: 0.4, type: "spring" }}
              >
                {config.icon}
              </motion.div>

              <div className="text-center space-y-2">
                <h2 className={`text-2xl font-serif font-bold ${config.color} uppercase tracking-widest`}>
                  {config.title}
                </h2>
                <div className={`p-4 rounded-lg ${config.bgInfo} border ${config.border}`}>
                  <p className="text-stone-300 font-serif italic text-sm">
                    "{config.desc}"
                  </p>
                </div>
              </div>
            </div>

            {/* Spacer for button area */}
            <div className="h-16 w-full" />
          </div>
        </motion.div>

        {/* Buttons - Outside 3D context for reliability */}
        <AnimatePresence>
          {isFlipped && (
            <>
              <motion.button
                key="close-button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.5 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="absolute top-4 right-4 text-stone-500 hover:text-stone-200 transition-colors z-[200] p-2 hover:bg-stone-800 rounded-full cursor-pointer pointer-events-auto shadow-lg bg-stone-900/50 backdrop-blur-sm"
              >
                <FaTimes size={20} />
              </motion.button>

              <motion.button
                key="accept-button"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="absolute bottom-6 left-6 right-6 py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-serif font-bold uppercase tracking-wider rounded border border-stone-600/50 transition-colors text-sm cursor-pointer pointer-events-auto shadow-xl z-[200]"
              >
                I Accept My Fate
              </motion.button>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}