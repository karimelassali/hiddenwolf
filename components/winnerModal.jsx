import { motion } from "framer-motion";
import { FaTrophy, FaSkull, FaCrown, FaHome, FaUsers, FaArrowRight } from "react-icons/fa";
import { GiVillage } from "react-icons/gi";
import { Countdown } from "./ui/countdown";
import { updatePlayerState } from "@/utils/updatePlayerState";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "./modal";
import { WinSound, LoseSound } from "@/utils/sounds";

export default function GameWinner({
  winner,
  playerId,
  clerkId,
  currentPlayerRole,
}) {
  const isWolfWin = winner?.role?.toLowerCase().includes("wolf");
  const isVillageWin = winner?.role?.toLowerCase().includes("villager");
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'roster'
  const [playerStateUpdated, setPlayerStateUpdated] = useState(false);
  const [prize, setPrize] = useState(0);

  const router = useRouter();

  useEffect(() => {
    if (playerStateUpdated) return;
    try {
      const isCurrentUserWon =
        (winner.role === "wolf" && currentPlayerRole === "wolf") ||
        (winner.role !== "wolf" && currentPlayerRole !== "wolf");

      const prizeAmount = ['10', '20', '30', '40', '50', '60', '70', '80', '90', '100'];
      const randomPrize = prizeAmount[Math.floor(Math.random() * prizeAmount.length)];

      if (isCurrentUserWon) {
        setPrize(randomPrize);
        WinSound();
      } else {
        LoseSound();
      }

      updatePlayerState(clerkId, { win: isCurrentUserWon, prize: isCurrentUserWon ? randomPrize : null });
      setPlayerStateUpdated(true);
    } catch (error) {
      console.log("update user state from winnerModal" + error);
    }
  }, [winner]);

  // Color config based on winner
  const theme = isWolfWin
    ? {
      bg: "from-red-950 via-gray-900 to-black",
      border: "border-red-800",
      shadow: "shadow-red-900/50",
      text: "text-red-100",
      highlight: "text-red-500",
      button: "bg-red-700 hover:bg-red-600",
      gradient: "from-red-900 to-red-800"
    }
    : {
      bg: "from-emerald-950 via-gray-900 to-black",
      border: "border-emerald-800",
      shadow: "shadow-emerald-900/50",
      text: "text-emerald-100",
      highlight: "text-emerald-500",
      button: "bg-emerald-700 hover:bg-emerald-600",
      gradient: "from-emerald-900 to-emerald-800"
    };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">
      {prize > 0 && (
        <Modal usage={'coins'} prop={prize} onCloseModal={() => setPrize(0)} />
      )}

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row rounded-3xl border-2 ${theme.border} ${theme.shadow} shadow-2xl bg-gray-900`}
      >
        {/* --- LEFT SIDE: VICTORY BANNER --- */}
        <div className={`md:w-5/12 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden bg-gradient-to-br ${theme.gradient}`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>

          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="relative z-10 w-32 h-32 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center mb-6 border-4 border-white/10 shadow-xl"
          >
            {isWolfWin ? <FaSkull className="text-6xl text-red-200" /> : <FaUsers className="text-6xl text-emerald-200" />}
          </motion.div>

          <h1 className="relative z-10 text-4xl md:text-5xl font-black text-white tracking-tight leading-tight uppercase drop-shadow-lg mb-2">
            {isWolfWin ? "Wolves Win" : "Village Saved"}
          </h1>

          <p className="relative z-10 text-white/80 font-medium text-lg mb-8">
            {isWolfWin ? "Darkness consumes the village." : "The evil has been purged."}
          </p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-auto"
          >
            <button
              onClick={() => router.push("/")}
              className="group relative w-full py-4 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-xl text-white font-bold transition-all border border-white/10 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
              <span className="relative z-10 flex items-center justify-center gap-2">
                <FaHome /> Return to Lobby
              </span>
            </button>
          </motion.div>
        </div>

        {/* --- RIGHT SIDE: DETAILED STATS --- */}
        <div className="md:w-7/12 bg-gray-900 flex flex-col">
          {/* Header Tabs */}
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'overview' ? 'text-white bg-gray-800 border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("roster")}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'roster' ? 'text-white bg-gray-800 border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Player Roster
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-gray-400 text-xs font-bold uppercase mb-2">Winning Team</h3>
                  <div className="flex flex-wrap gap-2">
                    {winner.players.map(p => (
                      <div key={p.id} className="flex items-center gap-2 bg-gray-700 rounded-full px-3 py-1">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-600">
                          <img src={p.profile || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-white text-sm font-medium">{p.name}</span>
                        {p.is_alive && <FaCrown className="text-yellow-400 text-xs" />}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-gray-400 text-xs font-bold uppercase mb-2">Defeated Team</h3>
                  <div className="flex flex-wrap gap-2">
                    {winner.enemy.map(p => (
                      <div key={p.id} className="flex items-center gap-2 bg-gray-700/50 rounded-full px-3 py-1 opacity-70 grayscale">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-600">
                          <img src={p.profile || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-gray-300 text-sm font-medium">{p.name}</span>
                        {!p.is_alive && <FaSkull className="text-gray-500 text-xs" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "roster" && (
              <div className="space-y-2">
                {[...winner.players, ...winner.enemy].sort((a, b) => a.name.localeCompare(b.name)).map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-3 bg-gray-800/40 rounded-lg hover:bg-gray-800/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-700">
                        <img src={player.profile || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-white font-bold">{player.name}</p>
                        <p className="text-xs text-gray-400 uppercase tracking-widest">{player.role}</p>
                      </div>
                    </div>

                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${player.is_alive ? 'bg-green-900/50 text-green-400 border border-green-800' : 'bg-red-900/50 text-red-400 border border-red-800'}`}>
                      {player.is_alive ? "SURVIVOR" : "DECEASED"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
