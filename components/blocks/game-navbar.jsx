"use client";
import { useRouter } from "next/router";
import { FaLock, FaCrown, FaBars, FaTimes } from "react-icons/fa"; // Added menu icons
import { IoTimerSharp, IoMoon, IoSunny } from "react-icons/io5";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Countdown } from "@/components/ui/countdown";
import { Vote } from "lucide-react";
import { Modal } from "@/components/modal";
import { toast, Toaster } from "react-hot-toast";
import {motion, AnimatePresence} from "framer-motion";
export default function GameNavbar({
  uid,
  roomData,
  currentPlayerId,
  players,
}) {
  // --- ALL YOUR EXISTING LOGIC IS UNTOUCHED ---
  const [counter, setCounter] = useState(5);
  const [votingData, setVotingData] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  // ✅ UI STATE: New state to control the mobile menu's visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const killMostVotedPlayerWhenMajority = async (roomData, players) => {
    const { data: votes, error: voteError } = await supabase
      .from("voting")
      .select("voted_id, voted_name")
      .eq("room_id", roomData.id);
    if (voteError || !votes?.length) {
      return toast.error("❌ لم يتم العثور على أي تصويت.");
    }
    const voteCounts = {};
    votes.forEach(({ voted_id }) => {
      voteCounts[voted_id] = (voteCounts[voted_id] || 0) + 1;
    });
    const sortedVotes = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
    const [topVotedId, topVoteCount] = sortedVotes[0] || [];
    const alivePlayersCount = players.filter((p) => p.is_alive).length;
    const requiredVotes = Math.ceil(alivePlayersCount / 2);
    if (topVoteCount < requiredVotes) {
      return toast.error(
        `❌ لم يتم التصويت بما يكفي ( ${topVoteCount} من ${requiredVotes} مطلوب ).`
      );
    }
    const { error: killError } = await supabase
      .from("players")
      .update({ is_alive: false })
      .eq("id", topVotedId);
    if (killError) {
      return toast.error("❌ فشل في قتل اللاعب.");
    }
    const killedPlayerName = votes.find(
      (v) => v.voted_id === topVotedId
    )?.voted_name;
    toast.success(
      `✅ تم قتل اللاعب ${killedPlayerName} (بـ ${topVoteCount} تصويت).`
    );
    await supabase.from("voting").delete().eq("room_id", roomData.id);
  };

  const onCountDownFinished = async () => {
    const { error } = await supabase
      .from("players")
      .update({ is_action_done: false, is_saved: false })
      .eq("room_id", roomData.id);
    if (error) {
      console.log(error);
    }
    if (roomData.host_id == currentPlayerId) {
      if (roomData.stage == "night") {
        const { error } = await supabase
          .from("rooms")
          .update({ stage: "day" })
          .eq("code", uid);
        if (error) {
          console.log(error);
        }
        setCounter(20);
      } else if (roomData.stage == "day") {
        const { error } = await supabase
          .from("rooms")
          .update({ stage: "night" })
          .eq("code", uid);
        const { error: wolfKilledError } = await supabase
          .from("rooms")
          .update({ wolf_killed: false })
          .eq("code", uid);
        wolfKilledError && console.log(wolfKilledError);
        if (error) {
          console.log(error);
        }
        setCounter(20);
      }
    } else {
      console.log("you are not the host");
    }
  };

  useEffect(() => {
    killMostVotedPlayerWhenMajority(roomData, players);
  }, [roomData.stage]);

  const alivePlayersCount = players?.filter((p) => p.is_alive).length || 0;
  const isHost = roomData.host_id === currentPlayerId;
  const isNight = roomData.stage === "night";

  return (
    <>
      <Toaster />
      <nav
        className={`relative w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 transition-all duration-500 shadow-lg z-40 ${
          isNight
            ? "bg-gradient-to-r from-slate-900/95 to-purple-900/95 backdrop-blur-md border-b border-purple-500/20"
            : "bg-gradient-to-r from-violet-600/95 to-indigo-700/95 backdrop-blur-md border-b border-indigo-400/20"
        }`}
      >
        {/* ================================================================== */}
        {/* DESKTOP VIEW (lg and up - 1024px+)                                */}
        {/* ================================================================== */}
        <div className="hidden lg:flex items-center justify-between gap-4">
          {/* Left Section */}
          <div className="flex items-center gap-3 xl:gap-4">
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10 shadow-lg">
              <FaLock className="w-4 h-4 text-slate-300" />
              <span className="font-semibold text-white">Room {uid}</span>
            </div>
            
            {isHost && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-yellow-900 px-3 py-2 rounded-lg font-medium shadow-lg border border-yellow-400/50">
                <FaCrown className="w-4 h-4" />
                <span>Host</span>
              </div>
            )}
          </div>
  
          {/* Center Section */}
          <div className="flex items-center gap-3 xl:gap-4">
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10 shadow-lg">
              {isNight ? (
                <IoMoon className="w-5 h-5 text-purple-300" />
              ) : (
                <IoSunny className="w-5 h-5 text-yellow-300" />
              )}
              <span className="font-semibold capitalize text-white">{roomData.stage}</span>
            </div>
            
            <div className="bg-black/30 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10 shadow-lg">
              <span className="text-white/70">Round </span>
              <span className="font-bold text-lg text-white">{roomData.round}</span>
            </div>
            
            <div className="bg-black/30 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10 shadow-lg">
              <span className="text-white/70">Alive </span>
              <span className="font-bold text-lg text-green-400">{alivePlayersCount}</span>
            </div>
          </div>
  
          {/* Right Section - Timer */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg border border-red-400/40 bg-gradient-to-r from-red-900/60 to-red-800/60 backdrop-blur-sm shadow-lg">
            <IoTimerSharp className="w-5 h-5 text-red-400 animate-pulse" />
            {counter && (
              <span className="font-mono font-bold text-xl text-red-300">
                <Countdown
                  usage="room"
                  onComplete={() => onCountDownFinished()}
                />
              </span>
            )}
          </div>
        </div>
  
        {/* ================================================================== */}
        {/* TABLET VIEW (sm to lg - 640px to 1023px)                          */}
        {/* ================================================================== */}
        <div className="hidden sm:flex lg:hidden items-center justify-between gap-2">
          {/* Left Section */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10">
              <FaLock className="w-4 h-4 text-slate-300" />
              <span className="font-semibold text-white text-sm">{uid}</span>
            </div>
            
            {isHost && (
              <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-yellow-900 px-2 py-1.5 rounded-lg font-medium text-sm">
                <FaCrown className="w-3 h-3" />
                <span className="hidden md:inline">Host</span>
              </div>
            )}
          </div>
  
          {/* Center Section */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10">
              {isNight ? (
                <IoMoon className="w-4 h-4 text-purple-300" />
              ) : (
                <IoSunny className="w-4 h-4 text-yellow-300" />
              )}
              <span className="font-semibold capitalize text-white text-sm">{roomData.stage}</span>
            </div>
            
            <div className="bg-black/30 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10">
              <span className="text-white/70 text-sm">R</span>
              <span className="font-bold text-white ml-1">{roomData.round}</span>
            </div>
            
            <div className="bg-black/30 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10">
              <span className="font-bold text-green-400">{alivePlayersCount}</span>
              <span className="text-white/70 text-sm ml-1">Alive</span>
            </div>
          </div>
  
          {/* Right Section - Timer */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-400/40 bg-gradient-to-r from-red-900/60 to-red-800/60 backdrop-blur-sm">
            <IoTimerSharp className="w-4 h-4 text-red-400" />
            {counter && (
              <span className="font-mono font-bold text-lg text-red-300">
                <Countdown
                  usage="room"
                  onComplete={() => onCountDownFinished()}
                />
              </span>
            )}
          </div>
        </div>
  
        {/* ================================================================== */}
        {/* MOBILE VIEW (< 640px)                                             */}
        {/* ================================================================== */}
        <div className="flex sm:hidden items-center justify-between gap-2">
          {/* Left: Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="z-50 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            <div className="relative w-5 h-5">
              <span className={`absolute block h-0.5 w-full bg-current transform transition-all duration-300 ${
                isMobileMenuOpen ? 'rotate-45 top-2' : 'top-1'
              }`} />
              <span className={`absolute block h-0.5 w-full bg-current transform transition-all duration-300 top-2 ${
                isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
              }`} />
              <span className={`absolute block h-0.5 w-full bg-current transform transition-all duration-300 ${
                isMobileMenuOpen ? '-rotate-45 top-2' : 'top-3'
              }`} />
            </div>
          </button>
  
          {/* Center: Essential Status */}
          <div className="flex items-center gap-2 flex-1 justify-center max-w-xs">
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-white/10">
              {isNight ? (
                <IoMoon className="w-4 h-4 text-purple-300 flex-shrink-0" />
              ) : (
                <IoSunny className="w-4 h-4 text-yellow-300 flex-shrink-0" />
              )}
              <span className="font-semibold capitalize text-white text-sm truncate">
                {roomData.stage}
              </span>
            </div>
            
            <div className="bg-black/30 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-white/10">
              <span className="font-bold text-green-400 text-sm">{alivePlayersCount}</span>
              <span className="text-white/70 text-xs ml-1">Live</span>
            </div>
          </div>
  
          {/* Right: Timer */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-red-400/40 bg-gradient-to-r from-red-900/60 to-red-800/60 backdrop-blur-sm">
            <IoTimerSharp className="w-4 h-4 text-red-400 flex-shrink-0" />
            {counter && (
              <span className="font-mono font-bold text-sm text-red-300">
                <Countdown
                  usage="room"
                  onComplete={() => onCountDownFinished()}
                />
              </span>
            )}
          </div>
        </div>
  
        {/* ================================================================== */}
        {/* MOBILE DROPDOWN MENU                                              */}
        {/* ================================================================== */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="sm:hidden absolute top-full left-0 right-0 z-40 mx-3 mt-2 p-4 bg-slate-800/95 backdrop-blur-md shadow-xl rounded-xl border border-slate-700/50"
            >
              <div className="flex flex-col gap-3">
                {/* Room Info */}
                <div className="flex items-center gap-2 bg-black/20 px-3 py-2.5 rounded-lg text-white border border-white/10">
                  <FaLock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Room Code: </span>
                    <span className="font-mono font-bold text-blue-300">{uid}</span>
                  </div>
                </div>
                
                {/* Host Status */}
                {isHost && (
                  <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/90 to-yellow-600/90 text-yellow-900 px-3 py-2.5 rounded-lg font-medium border border-yellow-400/50">
                    <FaCrown className="w-4 h-4 flex-shrink-0" />
                    <span>You are the Host</span>
                  </div>
                )}
                
                {/* Game Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/20 px-3 py-2.5 rounded-lg text-white border border-white/10">
                    <div className="text-white/70 text-xs mb-1">Current Round</div>
                    <div className="font-bold text-lg">{roomData.round}</div>
                  </div>
                  
                  <div className="bg-black/20 px-3 py-2.5 rounded-lg text-white border border-white/10">
                    <div className="text-white/70 text-xs mb-1">Total Players</div>
                    <div className="font-bold text-lg">{players?.length || 0}</div>
                  </div>
                </div>
                
                {/* Close Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full mt-2 py-2.5 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg transition-colors border border-slate-600/50"
                >
                  Close Menu
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
  
        {/* Backdrop for mobile menu */}
        {isMobileMenuOpen && (
          <div 
            className="sm:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </nav>
  
      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <Modal
            usage="voting"
            prop={votingData}
            onClose={() => setModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );}
