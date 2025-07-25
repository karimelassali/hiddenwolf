import { motion } from "framer-motion";
import { FaTrophy, FaSkull, FaCrown, FaHome, FaUsers } from "react-icons/fa";
import { GiVillage } from "react-icons/gi";
import { Countdown } from "./ui/countdown";
import { updatePlayerState } from "@/utils/updatePlayerState";
import { useEffect, useState } from "react";

export default function GameWinner({
  winner,
  playerId,
  clerkId,
  currentPlayerRole,
}) {
  const isWolfWin = winner?.role.toLowerCase().includes("wolf");
  const isVillageWin = winner?.role.toLowerCase().includes("villager");

  const [playerStateUpdated, setPlayerStateUpdated] = useState(false);

  useEffect(() => {
    if (playerStateUpdated) return;
    try {

      const isCurrentUserWon =
        (winner.role === "wolf" && currentPlayerRole === "wolf") ||
        (winner.role !== "wolf" && currentPlayerRole !== "wolf");
        
      console.log(
        "--------- winner is" + isCurrentUserWon + JSON.stringify(winner)
      );
      updatePlayerState(clerkId, { win: isCurrentUserWon });
      setPlayerStateUpdated(true);
    } catch (error) {
      console.log("update user state from winnerModal" + error);
    }
  }, [winner]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed top-0 left-0 w-full h-full  backdrop-blur-lg z-50 flex items-center justify-center"
    >
      {console.log("hello world")}
      <motion.div
        initial={{ scale: 0.5, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 15, stiffness: 300 }}
        className={`relative max-w-[50%] lg:max-w-[30%] mx-4 p-8 rounded-2xl shadow-2xl border overflow-hidden ${
          isWolfWin
            ? "bg-gradient-to-br from-red-900 to-red-800 border-red-600/50"
            : isVillageWin
            ? "bg-gradient-to-br from-emerald-900 to-emerald-800 border-emerald-600/50"
            : "bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600/50"
        }`}
      >
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 100, x: Math.random() * 400 }}
              animate={{
                opacity: [0, 1, 0],
                y: -100,
                x: Math.random() * 400,
              }}
              transition={{
                duration: 3,
                delay: Math.random() * 2,
                repeat: Infinity,
                repeatDelay: Math.random() * 3,
              }}
              className={`absolute w-1 h-1 rounded-full ${
                isWolfWin ? "bg-red-400" : "bg-emerald-400"
              }`}
            />
          ))}
        </div>

        {/* Header Section */}
        <div className="text-center mb-6 relative z-10">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring" }}
            className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg ${
              isWolfWin
                ? "bg-gradient-to-br from-red-600 to-red-700 shadow-red-500/50"
                : isVillageWin
                ? "bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-emerald-500/50"
                : "bg-gradient-to-br from-amber-600 to-amber-700 shadow-amber-500/50"
            }`}
          >
            {isWolfWin ? (
              <FaSkull className="text-3xl text-white" />
            ) : isVillageWin ? (
              <FaUsers className="text-3xl text-white" />
            ) : (
              <FaTrophy className="text-3xl text-white" />
            )}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-3xl font-bold text-white mb-2"
          >
            Game Over!
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className={`inline-flex items-center min-w-[50%] gap-2 px-4 py-2 rounded-full font-bold text-lg ${
              isWolfWin
                ? "bg-red-600/30 text-red-200 border border-red-500/50"
                : isVillageWin
                ? "bg-emerald-600/30 text-emerald-200 border border-emerald-500/50"
                : "bg-amber-600/30 text-amber-200 border border-amber-500/50"
            }`}
          >
            <FaCrown className="text-sm" />
            {winner.role == "wolf"
              ? "Wolf Wins" + "(" + winner.name + ")"
              : "Villagers Wins"}
          </motion.div>
        </div>

        {/* Countdown Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center mb-6"
        >
          <p className="text-slate-300 mb-3">Redirecting to home in:</p>
          {/* <Countdown number='90' target='/' /> */}
        </motion.div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="text-center"
        >
          <button
            onClick={() => (window.location.href = "/")}
            className="group w-full relative overflow-hidden bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 border border-slate-600/50 hover:shadow-xl hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <span className="relative flex items-center justify-center gap-3">
              <FaHome className="text-lg" />
              <span className="text-lg">Return Home</span>
            </span>
          </button>
        </motion.div>

        {/* Decorative elements */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className={`absolute -top-10 -right-10 w-20 h-20 rounded-full opacity-20 ${
            isWolfWin ? "bg-red-500" : "bg-emerald-500"
          }`}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className={`absolute -bottom-10 -left-10 w-16 h-16 rounded-full opacity-20 ${
            isWolfWin ? "bg-red-600" : "bg-emerald-600"
          }`}
        />
      </motion.div>
    </motion.div>
  );
}
