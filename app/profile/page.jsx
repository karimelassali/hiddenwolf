"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Target,
  Crown,
  Star,
  Calendar,
  Package,
  TrendingUp,
  Award,
  Gamepad2,
  Volume2,
  Zap,
  Filter,
  Grid3X3,
  List,
  ArrowRight,
  Medal,
  MoveLeft,
  Play,
  Pause,
  Edit2,
} from "lucide-react";
import { PiCoins } from "react-icons/pi";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CustomAudioPlayer } from "@/components/audioPlayer";
import { NumberCounting } from "@/components/magicui/number-ticker";
import { ClickSound } from "@/utils/sounds";
import { getLevelProgress, getLevelTitle, getLevelColor, getLevelBgColor } from "@/utils/levelSystem";

export default function Page() {
  const [playerState, setPlayerState] = useState([]);
  const [playerInventory, setPlayerInventory] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState("grid");
  const [playingAudio, setPlayingAudio] = useState(null);
  const { isLoaded, user } = useUser();
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const router = useRouter();

  const fetchUserState = async (playerId) => {
    const { data, error } = await supabase
      .from("player_stats")
      .select("*")
      .eq("player_id", playerId)
      .single();

    if (error) {
      console.error("Error fetching user data:", error.message);
      return;
    }
    setPlayerState(data);
  };

  const fetchUserInventory = async (playerId) => {
    const { data, error } = await supabase
      .from("purchases")
      .select("*, store(*)")
      .eq("user_id", playerId)
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching user data:", error.message);
      return;
    }

    //Remove Duplicated items
    const seenStoreIds = new Set();
    const uniquePurchases = [];

    for (const purchase of data) {
      const storeId = purchase.store.id;

      if (!seenStoreIds.has(storeId)) {
        seenStoreIds.add(storeId);
        uniquePurchases.push(purchase);
      }
    }

    setPlayerInventory(uniquePurchases);
  };

  useEffect(() => {
    if (isLoaded && user) {
      fetchUserState(user.id);
      fetchUserInventory(user?.id);
    }
  }, [isLoaded, user]);

  const getRarityColor = (rarity) => {
    switch (rarity?.toLowerCase()) {
      case "common":
        return "from-stone-800 to-stone-900";
      case "rare":
        return "from-slate-800 to-slate-900";
      case "epic":
        return "from-neutral-800 to-neutral-900";
      case "legendary":
        return "from-zinc-800 to-zinc-900";
      default:
        return "from-stone-800 to-stone-900";
    }
  };

  const getRarityGlow = (rarity) => {
    switch (rarity?.toLowerCase()) {
      case "common":
        return "shadow-none";
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Avatars":
        return Gamepad2;
      case "Sounds":
        return Volume2;
      case "Power":
        return Zap;
      default:
        return Package;
    }
  };

  const filteredInventory =
    selectedCategory === "All"
      ? playerInventory
      : playerInventory.filter(
        (item) => item.store?.category === selectedCategory
      );

  const categories = [
    "All",
    ...new Set(
      playerInventory.map((item) => item.store?.category).filter(Boolean)
    ),
  ];

  const winRate = playerState
    ? playerState.total_games > 0
      ? ((playerState.wins / playerState.total_games) * 100).toFixed(1)
      : 0
    : 0;

  const levelInfo = playerState ? getLevelProgress(playerState.xp || 0) : null;

  if (!isLoaded || !user || !playerState) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full"
        />
      </div>
    );
  }

  const equipAvatar = async (item) => {
    ClickSound();
    const { error } = await supabase
      .from("player_stats")
      .update({ avatar: item.store.item_url })
      .eq("player_id", user.id);
    if (error) {
      console.log(error);
    }
    setPlayerState((prevState) => ({
      ...prevState,
      avatar: item.store.item_url,
    }));
  };

  const changePlayerUserName = async (id, newUsername) => {
    try {
      const { data, error } = await supabase
        .from("player_stats")
        .update({ username: newUsername })
        .eq("player_id", id);
      if (error) {
        console.log(error);
      }
      setPlayerState((prevState) => ({ ...prevState, username: newUsername }));
      setEditingUsername(false);
      setNewUsername("");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div
      className="w-full relative h-full bg-[#0a0a0a] overflow-auto font-sans text-neutral-200 selection:bg-white/10"
    >
      {/* Background Image with Overlay */}
      <div
        className="fixed inset-0 z-0 opacity-20 pointer-events-none grayscale"
        style={{
          backgroundImage: "url('/assets/images/profile_bg.avif')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="fixed inset-0 z-0 bg-neutral-950/90 pointer-events-none" />

      <motion.div
        onClick={() => router.push("/")}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        className="fixed z-50 top-6 left-6 p-3 rounded-full bg-neutral-900/50 hover:bg-neutral-800 border border-white/5 backdrop-blur-md transition-all duration-300 group cursor-pointer"
      >
        <MoveLeft size={24} className="text-neutral-400 group-hover:text-white transition-colors" />
      </motion.div>

      <div className="max-w-7xl mx-auto p-6 space-y-8 relative z-10">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative bg-neutral-900/40 backdrop-blur-md rounded-[2rem] border border-white/5 p-8 lg:p-10 shadow-2xl overflow-hidden"
        >

          <div className="flex flex-col lg:flex-row items-center gap-8 relative z-10">
            {/* Avatar Section */}
            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="w-32 h-32 lg:w-40 lg:h-40 relative rounded-full p-1 bg-neutral-800 shadow-xl"
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-[#151621] relative group">
                  {playerState?.avatar ? (
                    <Image
                      src={playerState?.avatar}
                      alt="Avatar"
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}

                  {/* Fallback / Default Avatar */}
                  <div className={`w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-400 ${playerState?.avatar ? 'hidden' : 'flex'}`}>
                    <span className="text-4xl font-bold">{user.firstName?.charAt(0) || "P"}</span>
                  </div>
                </div>
              </motion.div>

              {/* Status indicator */}
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-red-600 rounded-full border-4 border-gray-900 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 flex flex-col items-center lg:items-start">
              <motion.div
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3 mb-3"
              >
                <h1 className="text-3xl lg:text-5xl font-bold text-white tracking-tight flex items-center gap-3">
                  <span className="text-white">
                    {playerState.username || "Anonymous"}
                  </span>
                  {levelInfo && (
                    <span className={`px-3 py-1 rounded-lg border text-sm font-black ${getLevelBgColor(levelInfo.level)} ${getLevelColor(levelInfo.level)}`}>
                      Lv.{levelInfo.level}
                    </span>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setEditingUsername(true)}
                    className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  >
                    <Edit2 size={18} />
                  </motion.button>
                </h1>

                <p className="text-slate-400 text-sm lg:text-base mt-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                  Online • {user.firstName} {user.lastName}
                </p>

                {user.username && (
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                    onClick={() => setEditingUsername(true)}
                    className="group relative p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 backdrop-blur-sm border border-transparent hover:border-white/10 transition-all duration-300"
                    title="Edit username (100 coins)"
                  >
                    <svg
                      className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </motion.button>
                )}
              </motion.div>

              {!playerState.username && (
                <motion.button
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => setEditingUsername(true)}
                  className="group relative text-neutral-400 text-lg mb-3 hover:text-white transition-all duration-300 px-4 py-2 rounded-lg hover:bg-white/5 border border-white/5 hover:border-white/10"
                >
                  <span className="flex items-center gap-2">
                    Set Username
                    <svg
                      className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </span>
                </motion.button>
              )}

              {editingUsername && (
                <motion.div
                  initial={{ x: -30, opacity: 0, scale: 0.95 }}
                  animate={{ x: 0, opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                  className="flex flex-col items-center lg:items-start gap-3 w-full max-w-xs"
                >
                  {playerState.username && (
                    <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Costs 100 coins to change username</span>
                    </div>
                  )}

                  <div className="relative w-full">
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder={
                        playerState.username
                          ? "Enter new username..."
                          : "Choose your username..."
                      }
                      className="w-full p-3 rounded-xl border border-white/10 bg-neutral-900/50 backdrop-blur-sm text-white placeholder-neutral-500 focus:border-white/20 focus:ring-2 focus:ring-white/5 focus:outline-none transition-all duration-300 hover:bg-neutral-800/50"
                    />
                  </div>

                  <div className="flex gap-2 w-full">
                    <button
                      onClick={async () =>
                        changePlayerUserName(user.id, newUsername)
                      }
                      className="flex-1 bg-white text-black p-3 rounded-xl hover:bg-neutral-200 transition-all duration-300 font-medium shadow-lg shadow-white/5 hover:scale-105 active:scale-95"
                    >
                      {playerState.username
                        ? "Change Username"
                        : "Set Username"}
                    </button>

                    <button
                      onClick={() => setEditingUsername(false)}
                      className="px-4 py-3 rounded-xl border border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 transition-all duration-300"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Coins Display */}
            <div className="flex flex-col items-center lg:items-end gap-1">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xl shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                <PiCoins size={24} />
                <NumberCounting className="text-amber-400" value={playerState?.coins || 0} />
              </div>
              <span className="text-xs text-amber-500/40 uppercase tracking-widest font-semibold">Balance</span>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {/* Total Games */}
          <div className="bg-neutral-900/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 hover:bg-neutral-800/40 transition-all duration-300 group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-400 group-hover:text-white transition-colors">
                <Gamepad2 size={24} />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">
                  {playerState?.total_games}
                </p>
                <p className="text-slate-400 text-xs uppercase tracking-wider font-medium">Played</p>
              </div>
            </div>
          </div>

          {/* Wins */}
          <div className="bg-neutral-900/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 hover:bg-neutral-800/40 transition-all duration-300 group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center text-emerald-500/80 group-hover:text-emerald-400 transition-colors">
                <Trophy size={24} />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">
                  {playerState?.wins}
                </p>
                <p className="text-slate-400 text-xs uppercase tracking-wider font-medium">Won</p>
              </div>
            </div>
          </div>

          {/* Losses */}
          <div className="bg-neutral-900/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 hover:bg-neutral-800/40 transition-all duration-300 group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center text-red-500/80 group-hover:text-red-400 transition-colors">
                <Target size={24} />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">
                  {playerState?.losses}
                </p>
                <p className="text-slate-400 text-xs uppercase tracking-wider font-medium">Lost</p>
              </div>
            </div>
          </div>

          {/* Win Rate */}
          <div className="bg-neutral-900/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 hover:bg-neutral-800/40 transition-all duration-300 group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-400 group-hover:text-white transition-colors">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{winRate}%</p>
                <p className="text-slate-400 text-xs uppercase tracking-wider font-medium">Win Rate</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Level & XP Progress */}
        {
          levelInfo && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="bg-neutral-900/40 backdrop-blur-md rounded-2xl border border-white/5 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`px-4 py-2 rounded-xl border font-black text-2xl ${getLevelBgColor(levelInfo.level)} ${getLevelColor(levelInfo.level)}`}>
                    Lv.{levelInfo.level}
                  </div>
                  <div>
                    <p className={`font-bold text-lg ${getLevelColor(levelInfo.level)}`}>{levelInfo.title}</p>
                    <p className="text-neutral-500 text-sm">{levelInfo.xpIntoLevel} / {levelInfo.xpNeeded} XP to next level</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-neutral-300 font-bold text-lg">{levelInfo.totalXp}</p>
                  <p className="text-neutral-500 text-xs uppercase tracking-wider">Total XP</p>
                </div>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${levelInfo.progress}%` }}
                  transition={{ delay: 0.5, duration: 1.5, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-500 shadow-[0_0_10px_rgba(147,51,234,0.5)]"
                />
              </div>
              <p className="text-right text-neutral-600 text-xs mt-1">{levelInfo.progress}%</p>
            </motion.div>
          )
        }

        {/* Inventory Section */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}

          className="bg-neutral-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden min-h-[500px]"
        >
          {/* Inventory Header */}
          <div className="p-8 border-b border-white/5 bg-white/[0.01]">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                  My Collection
                  <span className="text-sm font-normal text-slate-500 bg-white/5 px-2 py-1 rounded-full border border-white/5">{filteredInventory.length} Items</span>
                </h2>
                <p className="text-slate-400">
                  Customize your character and show off your achievements
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Category Filter */}
                <div className="flex items-center gap-2 bg-black/40 rounded-full p-1 border border-white/5">
                  {categories.map((category) => {
                    const Icon =
                      category === "All" ? Filter : getCategoryIcon(category);
                    return (
                      <motion.button
                        key={category}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-all duration-300 ${selectedCategory === category
                          ? "bg-white text-black shadow-lg shadow-white/10"
                          : "text-neutral-500 hover:text-white hover:bg-white/5"
                          }`}
                      >
                        <Icon size={16} />
                        {category}
                      </motion.button>
                    );
                  })}
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center bg-black/40 rounded-full p-1 border border-white/5">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-full transition-all duration-300 ${viewMode === "grid"
                      ? "bg-white text-black shadow-lg shadow-white/10"
                      : "text-neutral-500 hover:text-white"
                      }`}
                  >
                    <Grid3X3 size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-full transition-all duration-300 ${viewMode === "list"
                      ? "bg-white text-black shadow-lg shadow-white/10"
                      : "text-neutral-500 hover:text-white"
                      }`}
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Grid/List */}
          <div className="p-6">
            {filteredInventory.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-neutral-500"
              >
                <Package size={64} className="mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No Items Found</h3>
                <p>You don't have any items in this category yet.</p>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={viewMode + selectedCategory}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                      : "space-y-4"
                  }
                >
                  {filteredInventory.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -2 }}
                      className={`group relative bg-neutral-900/40 hover:bg-neutral-800/60 backdrop-blur-sm rounded-xl overflow-hidden border border-white/5 hover:border-white/10 transition-all duration-200 cursor-pointer ${viewMode === "list" ? "flex items-center p-4 gap-4" : "p-4"
                        }`}
                    >

                      {viewMode === "grid" ? (
                        <>
                          {/* Item Media */}
                          <div className="relative aspect-square mb-4 rounded-xl overflow-hidden bg-black/20">
                            {item.store?.category === "Sounds" ? (
                              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                <Volume2 size={32} className="mb-2 opacity-50" />
                                <div className="scale-75 origin-center w-full">
                                  <CustomAudioPlayer
                                    src={item.store?.item_url}
                                    itemName={item.store?.item}
                                  />
                                </div>
                              </div>
                            ) : (
                              <Image
                                src={item.store?.item_url}
                                alt={item.store?.item}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentNode.innerHTML = `<div class="w-full h-full flex items-center justify-center text-slate-600"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>`
                                }}
                              />
                            )}

                            <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/40 text-white backdrop-blur-sm border border-white/10`}>
                              {item.store?.rarity}
                            </div>
                          </div>

                          {/* Item Details */}
                          <div className="relative z-10">
                            <h3 className="text-white font-bold text-lg mb-1 truncate group-hover:text-neutral-300 transition-colors">
                              {item.store?.item}
                            </h3>

                            <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
                              <span className="capitalize">{item.store?.category}</span>
                              <span>{new Date(item.bought_at).toLocaleDateString()}</span>
                            </div>
                            {item?.store?.category === "Avatars" &&
                              (item?.store?.item_url ===
                                playerState?.avatar ? (
                                <button
                                  disabled
                                  className="w-full py-2 bg-neutral-800 text-neutral-400 text-sm rounded-lg font-medium border border-white/5"
                                >
                                  Equipped
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    equipAvatar(item);
                                  }}
                                  className="w-full py-2 bg-white text-black hover:bg-neutral-200 text-sm rounded-lg font-medium transition-colors"
                                >
                                  Equip
                                </button>
                              ))}
                          </div>
                        </>
                      ) : (
                        <>
                          {/* List View */}
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-black/20 flex-shrink-0">
                            {item.store?.category === "Sounds" ? (
                              <div className="w-full h-full flex items-center justify-center text-slate-500">
                                <Volume2 size={24} />
                              </div>
                            ) : (
                              <Image
                                src={item.store?.item_url}
                                alt={item.store?.item}
                                fill
                                className="object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentNode.innerHTML = `<div class="w-full h-full flex items-center justify-center text-slate-600"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>`
                                }}
                              />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-white font-bold text-lg truncate">{item.store?.item}</h4>
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/5`}>
                                {item.store?.rarity}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                              <span className="capitalize">{item.store?.category}</span>
                              <span>•</span>
                              <span>Purchased {new Date(item.bought_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </>
                      )}


                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div >
    </div >
  );
}
