"use client";
import { useState, useEffect, useRef } from "react";
import { FaCrown } from "react-icons/fa";
import { IoMoon, IoSunny } from "react-icons/io5";
import { supabase } from "@/lib/supabase";
import { toast, Toaster } from "react-hot-toast";
import { motion } from "framer-motion";

export default function GameNavbar({
  uid,
  roomData,
  currentPlayerId,
  players,
}) {
  const timerDuration = roomData.round_duration || 30;
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const timerRef = useRef(null);

  const isHost = roomData.host_id === currentPlayerId;
  const isNight = roomData.stage === "night";
  const aliveCount = players?.filter((p) => p.is_alive).length || 0;

  // --- Refs to hold latest values (avoids stale closures in setInterval) ---
  const roomDataRef = useRef(roomData);
  const currentPlayerIdRef = useRef(currentPlayerId);
  const uidRef = useRef(uid);
  useEffect(() => {
    roomDataRef.current = roomData;
    currentPlayerIdRef.current = currentPlayerId;
    uidRef.current = uid;
  });

  const hasTriggeredRef = useRef(false);

  const onTimerEnd = async () => {
    const rd = roomDataRef.current;
    const cpId = currentPlayerIdRef.current;
    const code = uidRef.current;

    console.log("⏱️ onTimerEnd fired", { stage: rd.stage, host: rd.host_id, me: cpId });

    if (rd.host_id !== cpId) {
      console.log("⏱️ Not host, skipping transition");
      return;
    }

    try {
      // Reset player action flags
      await supabase
        .from("players")
        .update({ is_action_done: false, is_saved: false })
        .eq("room_id", rd.id);

      // Transition phase
      const nextStage = rd.stage === "night" ? "day" : "night";
      const updatePayload = { stage: nextStage };
      if (rd.stage === "day") {
        updatePayload.wolf_killed = false;
      }

      console.log(`⏱️ Transitioning: ${rd.stage} → ${nextStage}`);
      await supabase.from("rooms").update(updatePayload).eq("code", code);
    } catch (e) {
      console.error("Timer end error:", e);
      toast.error("Failed to change phase.");
    }
  };

  // Combined timer: reset + countdown, keyed ONLY on stage/round
  useEffect(() => {
    if (roomData.stage === "ended") return;

    // Reset for this new phase
    hasTriggeredRef.current = false;
    setTimeLeft(timerDuration);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (!hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            setTimeout(() => onTimerEnd(), 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [roomData.stage, roomData.round]);

  // Timer bar progress (0 to 1)
  const progress = Math.max(0, timeLeft / timerDuration);

  // Color: green → amber → red
  let barColor = "bg-emerald-500";
  let glowColor = "shadow-emerald-500/40";
  if (progress < 0.5) {
    barColor = "bg-amber-500";
    glowColor = "shadow-amber-500/40";
  }
  if (progress < 0.2) {
    barColor = "bg-red-500";
    glowColor = "shadow-red-500/40";
  }

  return (
    <>
      <Toaster />
      <nav
        className={`relative w-full px-3 sm:px-5 py-2.5 sm:py-3 transition-all duration-700 z-40 border-b ${isNight
          ? "bg-gray-950/90 backdrop-blur-xl border-purple-900/30"
          : "bg-indigo-950/90 backdrop-blur-xl border-indigo-700/30"
          }`}
      >
        {/* Main row */}
        <div className="flex items-center justify-between gap-3">
          {/* Left: Stage + Round */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all ${isNight
              ? "bg-purple-950/60 border-purple-800/40"
              : "bg-amber-950/40 border-amber-700/30"
              }`}>
              {isNight ? (
                <IoMoon className="w-4 h-4 text-purple-400" />
              ) : (
                <IoSunny className="w-4 h-4 text-amber-400" />
              )}
              <span className="text-white text-sm font-semibold capitalize hidden sm:inline">
                {roomData.stage}
              </span>
            </div>

            <div className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <span className="text-white/50 text-xs">R</span>
              <span className="text-white font-bold text-sm ml-0.5">{roomData.round}</span>
            </div>
          </div>

          {/* Center: Visual Timer Bar */}
          <div className="flex-1 max-w-xs sm:max-w-sm mx-2 sm:mx-4">
            <div className="relative h-2 sm:h-2.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className={`absolute inset-y-0 left-0 rounded-full ${barColor} ${glowColor} shadow-lg`}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.8, ease: "linear" }}
              />
              {/* Pulse on critical */}
              {progress < 0.2 && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-red-500/30"
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              )}
            </div>
          </div>

          {/* Right: Alive + Host */}
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <span className="text-green-400 font-bold text-sm">{aliveCount}</span>
              <span className="text-white/40 text-xs ml-1 hidden sm:inline">Alive</span>
            </div>

            {isHost && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-yellow-600/20 border border-yellow-600/30">
                  <FaCrown className="w-3 h-3 text-yellow-500" />
                  <span className="text-yellow-400 text-xs font-bold hidden sm:inline">HOST</span>
                </div>


              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
