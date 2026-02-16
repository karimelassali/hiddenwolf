import { motion, AnimatePresence } from "framer-motion";
import { FaTrophy, FaSkull, FaCrown, FaHome, FaUsers, FaArrowUp, FaChevronRight } from "react-icons/fa";
import { updatePlayerState } from "@/utils/updatePlayerState";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WinSound, LoseSound } from "@/utils/sounds";
import { getLevelProgress, getLevelTitle, getLevelColor, getLevelBgColor } from "@/utils/levelSystem";
import { PiCoins } from "react-icons/pi";
import Image from "next/image";

export default function GameWinner({
  winner,
  playerId,
  clerkId,
  currentPlayerRole,
  currentPlayerAlive,
}) {
  const isWolfWin = winner?.role?.toLowerCase().includes("wolf");
  const [playerStateUpdated, setPlayerStateUpdated] = useState(false);
  const [prize, setPrize] = useState(0);
  const [xpData, setXpData] = useState(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const router = useRouter();

  // Logic to handle XP and DB updates
  useEffect(() => {
    if (playerStateUpdated) return;
    const run = async () => {
      try {
        const isCurrentUserWon =
          (winner.role === "wolf" && currentPlayerRole === "wolf") ||
          (winner.role !== "wolf" && currentPlayerRole !== "wolf");

        const prizeAmount = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
        const randomPrize = isCurrentUserWon
          ? prizeAmount[Math.floor(Math.random() * prizeAmount.length)]
          : 0;

        if (isCurrentUserWon) {
          setPrize(randomPrize);
          WinSound();
        } else {
          LoseSound();
        }

        const result = await updatePlayerState(clerkId, {
          win: isCurrentUserWon,
          prize: isCurrentUserWon ? randomPrize : null,
          role: currentPlayerRole,
          survived: !!currentPlayerAlive,
        });

        if (result) {
          setXpData(result);
          if (result.leveledUp) {
            setTimeout(() => setShowLevelUp(true), 1500);
          }
        }

        setPlayerStateUpdated(true);
      } catch (error) {
        console.log("update user state from winnerModal: " + error);
      }
    };
    run();
  }, [winner]);

  const isCurrentUserWon =
    (winner.role === "wolf" && currentPlayerRole === "wolf") ||
    (winner.role !== "wolf" && currentPlayerRole !== "wolf");

  const levelInfo = xpData ? getLevelProgress(xpData.newTotalXp) : null;

  // Calculate XP breakdown for display
  const xpBreakdown = [];
  if (xpData) {
    xpBreakdown.push({ label: "Match Completed", value: 50 });
    if (isCurrentUserWon) xpBreakdown.push({ label: "Victory Bonus", value: 100 });
    const roleXp = currentPlayerRole === "wolf" ? 20 : ["doctor", "seer"].includes(currentPlayerRole) ? 15 : 10;
    xpBreakdown.push({ label: `Role: ${currentPlayerRole}`, value: roleXp });
    if (currentPlayerAlive) xpBreakdown.push({ label: "Survival Bonus", value: 30 });
  }

  // Formatting helper
  const formatRole = (role) => role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300 font-sans">

      {/* Celebration Overlay for Level Up */}
      <AnimatePresence>
        {showLevelUp && xpData?.leveledUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md"
            onClick={() => setShowLevelUp(false)}
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="text-center"
            >
              <h2 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-yellow-600 mb-4 drop-shadow-2xl">
                LEVEL UP!
              </h2>
              <div className="inline-flex items-center gap-4 bg-neutral-900 border border-neutral-800 px-8 py-4 rounded-full shadow-2xl">
                <span className="text-2xl text-neutral-400 font-bold">Level {xpData.prevLevel}</span>
                <FaChevronRight className="text-neutral-600" />
                <span className="text-4xl text-yellow-400 font-black">Level {xpData.newLevel}</span>
              </div>
              <p className="mt-8 text-neutral-500 text-sm uppercase tracking-widest cursor-pointer hover:text-white transition-colors">Click anywhere to close</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-neutral-950 w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 flex flex-col md:flex-row max-h-[90vh]"
      >

        {/* --- LEFT PANEL: RESULT --- */}
        <div className={`
          md:w-1/3 p-8 md:p-12 flex flex-col items-center justify-center text-center relative
          ${isCurrentUserWon ? 'bg-gradient-to-b from-neutral-900 to-neutral-950' : 'bg-neutral-950'}
          border-b md:border-b-0 md:border-r border-neutral-800
        `}>
          {/* Status Icon */}
          <div className={`
            w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-lg border-2
            ${isCurrentUserWon ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-400' : 'bg-red-900/20 border-red-500/30 text-red-400'}
          `}>
            {isCurrentUserWon ? <FaTrophy size={40} /> : <FaSkull size={40} />}
          </div>

          <h2 className={`text-4xl font-black tracking-tighter mb-2 uppercase ${isCurrentUserWon ? 'text-white' : 'text-neutral-400'}`}>
            {isCurrentUserWon ? "Victory" : "Defeat"}
          </h2>

          <p className="text-neutral-500 font-medium text-sm uppercase tracking-widest mb-8">
            {isWolfWin ? "Wolves Dominated" : "Village Survived"}
          </p>

          {/* Winner Team Badge */}
          <div className={`px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider mb-auto
             ${isWolfWin
              ? 'bg-red-950/50 border-red-900/50 text-red-500'
              : 'bg-emerald-950/50 border-emerald-900/50 text-emerald-500'
            }
           `}>
            Winning Team: {winner?.role === 'wolf' ? 'THE HIDDEN WOLF' : 'Villagers'}
          </div>

          {/* Return Button */}
          <button
            onClick={() => router.push('/')}
            className="mt-8 group flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
          >
            <FaHome />
            <span className="text-sm font-semibold uppercase tracking-wide group-hover:underline decoration-neutral-700 underline-offset-4">Return to Lobby</span>
          </button>
        </div>

        {/* --- RIGHT PANEL: DETAILED STATS --- */}
        <div className="md:w-2/3 bg-neutral-900 flex flex-col">

          {/* Header */}
          <div className="p-6 md:p-8 border-b border-neutral-800 flex justify-between items-center">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-1 h-6 bg-purple-500 rounded-full block"></span>
              Match Report
            </h3>
            {/* Coins Badge (Only if won) */}
            {isCurrentUserWon && prize > 0 && (
              <div className="flex items-center gap-2 bg-yellow-900/20 border border-yellow-700/30 px-3 py-1.5 rounded-lg">
                <PiCoins className="text-yellow-400" />
                <span className="text-yellow-200 font-bold">+{prize} Coins</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">

            {/* XP PROGRESSION */}
            <section>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h4 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-1">Progression</h4>
                  {levelInfo && (
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl font-black ${getLevelColor(levelInfo.level)}`}>Level {levelInfo.level}</span>
                      <span className="text-neutral-500 font-medium text-sm">{levelInfo.title}</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-white">+{xpData?.xpGained || 0}</span>
                  <span className="text-sm text-purple-400 font-bold ml-1">XP</span>
                </div>
              </div>

              {/* XP Bar */}
              {levelInfo && (
                <div className="relative w-full h-4 bg-neutral-800 rounded-full overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${levelInfo.progress}%` }}
                    transition={{ duration: 1, ease: "circOut", delay: 0.5 }}
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 to-indigo-500"
                  />
                </div>
              )}
              <div className="flex justify-between text-xs text-neutral-600 font-mono">
                <span>{levelInfo?.xpIntoLevel || 0} XP</span>
                <span>To Next: {levelInfo?.xpNeeded || 0} XP</span>
              </div>
            </section>

            {/* XP BREAKDOWN LIST */}
            <section className="bg-neutral-800/30 rounded-xl p-4 border border-neutral-800/50">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">XP Breakdown</h4>
              <div className="space-y-2">
                {xpBreakdown.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-neutral-300">{item.label}</span>
                    <span className="font-mono text-neutral-400">+{item.value}</span>
                  </div>
                ))}
                <div className="pt-2 mt-2 border-t border-neutral-700/50 flex justify-between items-center font-bold">
                  <span className="text-white">Total Earned</span>
                  <span className="text-purple-400 font-mono">+{xpData?.xpGained || 0} XP</span>
                </div>
              </div>
            </section>

            {/* ROSTER / PLAYERS */}
            <section>
              <h4 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-4">Match Roster</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...winner.players, ...winner.enemy].sort((a, b) => (a.is_alive === b.is_alive) ? 0 : a.is_alive ? -1 : 1).map((player) => (
                  <div key={player.id} className="flex items-center gap-3 p-2 rounded-lg bg-neutral-800/40 border border-neutral-800 hover:border-neutral-700 transition-colors">
                    <div className={`w-8 h-8 rounded-full overflow-hidden border ${player.role === 'wolf' ? 'border-red-900/50' : 'border-neutral-700'}`}>
                      <img
                        src={player.profile || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`}
                        alt={player.name}
                        className="w-full h-full object-cover grayscale-[30%]"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${player.id === playerId ? 'text-yellow-400' : 'text-neutral-300'}`}>
                        {player.name} {player.id === playerId && "(You)"}
                      </p>
                      <p className="text-xs text-neutral-500 capitalize">{player.role}</p>
                    </div>
                    <div>
                      {player.is_alive ? (
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-900/20 px-2 py-0.5 rounded border border-emerald-900/30">ALIVE</span>
                      ) : (
                        <FaSkull className="text-neutral-600" size={12} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
