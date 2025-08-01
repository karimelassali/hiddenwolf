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
        return "from-gray-600 to-gray-800";
      case "rare":
        return "from-slate-600 to-slate-800";
      case "epic":
        return "from-purple-800 to-purple-900";
      case "legendary":
        return "from-amber-700 to-orange-800";
      default:
        return "from-gray-600 to-gray-800";
    }
  };

  const getRarityGlow = (rarity) => {
    switch (rarity?.toLowerCase()) {
      case "common":
        return "shadow-gray-700/20";
      case "rare":
        return "shadow-slate-700/25";
      case "epic":
        return "shadow-purple-700/30";
      case "legendary":
        return "shadow-amber-600/35";
      default:
        return "shadow-gray-700/20";
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

  if (!isLoaded || !user || !playerState) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-black">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-gray-600 border-t-transparent rounded-full"
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
      style={{
        backgroundImage: "url('/assets/images/profile_bg.avif')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      className="w-full relative h-full bg-gradient-to-br from-gray-900 via-slate-900 to-black overflow-auto"
    >
      <motion.div
        onClick={() => router.push("/")}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.1 }}
        className="absolute z-40 bg-gradient-to-br from-gray-800 to-slate-900 rounded-full p-3 top-4 left-4 border border-gray-700"
      >
        <MoveLeft size={40} className="text-gray-300 cursor-pointer" />
      </motion.div>

      {/* Mysterious floating particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-gray-600/20 rounded-full"
            initial={{
              x:
                Math.random() *
                (typeof window !== "undefined" ? window.innerWidth : 1000),
              y:
                Math.random() *
                (typeof window !== "undefined" ? window.innerHeight : 800),
            }}
            animate={{
              y: [
                null,
                Math.random() *
                  (typeof window !== "undefined" ? window.innerHeight : 800),
              ],
              x: [
                null,
                Math.random() *
                  (typeof window !== "undefined" ? window.innerWidth : 1000),
              ],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: Math.random() * 20 + 15,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8 relative z-10">
        {/* Profile Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-black/30 backdrop-blur-xl rounded-3xl border border-gray-700/30 p-8 shadow-2xl"
        >
          <div className="flex flex-col lg:flex-row items-center gap-6">
            {/* Avatar Section */}
            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-32 h-32 bg-gradient-to-r from-gray-700 to-slate-800 rounded-full p-1 shadow-2xl shadow-gray-800/50"
              >
                <div className="w-full h-full bg-gray-900 rounded-full flex items-center justify-center text-4xl font-bold text-gray-300">
                  {playerState?.avatar ? (
                    <Image
                      src={playerState?.avatar}
                      alt="Avatar"
                      width={100}
                      height={100}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-900 rounded-full flex items-center justify-center text-4xl font-bold text-gray-300">
                      {user.firstName?.charAt(0) || "P"}
                    </div>
                  )}
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
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-300 via-slate-300 to-gray-400 bg-clip-text text-transparent hover:scale-105 transition-transform duration-300 hover:from-gray-200 hover:via-slate-200 hover:to-gray-300">
                  {user.username || `${user.firstName} ${user.lastName}`}-
                  {playerState.username}
                </h1>

                {user.username && (
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                    onClick={() => setEditingUsername(true)}
                    className="group relative p-2 rounded-lg text-gray-400 hover:text-gray-300 hover:bg-gray-800/30 backdrop-blur-sm border border-transparent hover:border-gray-600/40 transition-all duration-300"
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
                  className="group relative text-gray-400 text-lg mb-3 hover:text-gray-300 transition-all duration-300 px-4 py-2 rounded-lg hover:bg-gray-800/30 backdrop-blur-sm border border-transparent hover:border-gray-600/40"
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
                      className="w-full p-3 rounded-xl border border-gray-700/50 bg-gray-900/40 backdrop-blur-sm text-gray-200 placeholder-gray-500 focus:border-gray-500/70 focus:ring-2 focus:ring-gray-600/20 focus:outline-none transition-all duration-300 hover:bg-gray-800/50"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-gray-700/10 via-slate-600/10 to-gray-700/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>

                  <div className="flex gap-2 w-full">
                    <button
                      onClick={async () =>
                        changePlayerUserName(user.id, newUsername)
                      }
                      className="flex-1 bg-gradient-to-r from-gray-700 to-gray-600 text-white p-3 rounded-xl hover:from-gray-600 hover:to-gray-500 transition-all duration-300 font-medium shadow-lg hover:shadow-gray-700/25 hover:scale-105 active:scale-95"
                    >
                      {playerState.username
                        ? "Change Username"
                        : "Set Username"}
                    </button>

                    <button
                      onClick={() => setEditingUsername(false)}
                      className="px-4 py-3 rounded-xl border border-gray-700/50 text-gray-400 hover:text-gray-300 hover:bg-gray-800/40 hover:border-gray-600/60 transition-all duration-300"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Coins Display */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 rounded-2xl p-2 border border-amber-800/30"
            >
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-3xl font-bold text-amber-500 mb-1">
                  <PiCoins size={32} />
                  <NumberCounting value={playerState?.coins || 0} />
                </div>
                {/* <p className="text-white-400 text-sm">Total Coins</p> */}
              </div>
            </motion.div>
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
          <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-gray-700/30 p-6 hover:border-gray-600/50 transition-all duration-300 hover:scale-105">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-gray-700 to-slate-800 rounded-xl flex items-center justify-center">
                <Gamepad2 className="text-gray-300" size={24} />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-200">
                  {playerState?.total_games}
                </p>
                <p className="text-gray-500 text-sm">Total Games</p>
              </div>
            </div>
          </div>

          {/* Wins */}
          <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-gray-700/30 p-6 hover:border-gray-600/50 transition-all duration-300 hover:scale-105">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-800 to-emerald-900 rounded-xl flex items-center justify-center">
                <Trophy className="text-green-400" size={24} />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-200">
                  {playerState?.wins}
                </p>
                <p className="text-gray-500 text-sm">Victories</p>
              </div>
            </div>
          </div>

          {/* Losses */}
          <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-gray-700/30 p-6 hover:border-gray-600/50 transition-all duration-300 hover:scale-105">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-red-800 to-red-900 rounded-xl flex items-center justify-center">
                <Target className="text-red-400" size={24} />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-200">
                  {playerState?.losses}
                </p>
                <p className="text-gray-500 text-sm">Defeats</p>
              </div>
            </div>
          </div>

          {/* Win Rate */}
          <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-gray-700/30 p-6 hover:border-gray-600/50 transition-all duration-300 hover:scale-105">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-800 to-purple-900 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-purple-400" size={24} />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-200">{winRate}%</p>
                <p className="text-gray-500 text-sm">Win Rate</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Inventory Section */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="bg-black/30 backdrop-blur-xl rounded-3xl border border-gray-700/30 shadow-2xl overflow-hidden"
        >
          {/* Inventory Header */}
          <div className="p-6 border-b border-gray-700/30">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-200 mb-2">
                  My Inventory
                </h2>
                <p className="text-gray-500">
                  Manage your collected items and achievements
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Category Filter */}
                <div className="flex items-center gap-2 bg-black/40 rounded-full p-1">
                  {categories.map((category) => {
                    const Icon =
                      category === "All" ? Filter : getCategoryIcon(category);
                    return (
                      <motion.button
                        key={category}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-all duration-300 ${
                          selectedCategory === category
                            ? "bg-gradient-to-r from-gray-700 to-slate-800 text-gray-200"
                            : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                        }`}
                      >
                        <Icon size={16} />
                        {category}
                      </motion.button>
                    );
                  })}
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center bg-black/40 rounded-full p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-full transition-all duration-300 ${
                      viewMode === "grid"
                        ? "bg-gray-700 text-gray-200"
                        : "text-gray-500 hover:text-gray-200"
                    }`}
                  >
                    <Grid3X3 size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-full transition-all duration-300 ${
                      viewMode === "list"
                        ? "bg-gray-700 text-gray-200"
                        : "text-gray-500 hover:text-gray-200"
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
                className="flex flex-col items-center justify-center py-16 text-gray-500"
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
                      whileHover={{ y: -5, scale: 1.02 }}
                      className={`group relative bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-800/50 hover:border-gray-700/50 transition-all duration-300 cursor-pointer ${getRarityGlow(
                        item.store?.rarity
                      )} ${
                        viewMode === "list" ? "flex items-center p-4" : "p-4"
                      }`}
                    >
                      {/* Rarity Border */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-r ${getRarityColor(
                          item.store?.rarity
                        )} opacity-10 rounded-2xl`}
                      />

                      {viewMode === "grid" ? (
                        <>
                          {/* Item Content */}
                          <div className="relative h-48 mb-4 rounded-xl overflow-hidden">
                            {item.store?.category === "Sounds" ? (
                              <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center text-gray-400">
                                <CustomAudioPlayer
                                  src={item.store?.item_url}
                                  itemName={item.store?.item}
                                />
                              </div>
                            ) : (
                              <img
                                src={item.store?.item_url}
                                alt={item.store?.item}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              />
                            )}

                            {/* Rarity Badge */}
                            <div
                              className={`absolute top-3 right-3 px-2 py-1 bg-gradient-to-r ${getRarityColor(
                                item.store?.rarity
                              )} rounded-full text-gray-200 text-xs font-bold capitalize`}
                            >
                              {item.store?.rarity}
                            </div>
                          </div>

                          {/* Item Info */}
                          <div className="relative z-10">
                            <h3 className="text-gray-200 font-bold text-lg mb-2 group-hover:text-gray-100 transition-colors duration-300">
                              {item.store?.item}
                            </h3>

                            <div className="flex items-center justify-between mb-3">
                              <span className="text-gray-500 text-sm capitalize">
                                {item.store?.category}
                              </span>
                              {item?.store?.category === "Avatars" &&
                                (item?.store?.item_url ===
                                playerState?.avatar ? (
                                  <motion.button
                                    disabled="true"
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => equipAvatar(item)}
                                    className="px-3 py-1 bg-slate-800 hover:bg-amber-700 text-amber-200 text-sm rounded-md transition-colors"
                                  >
                                    Equiped
                                  </motion.button>
                                ) : (
                                  <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => equipAvatar(item)}
                                    className="px-3 py-1 bg-amber-800 hover:bg-amber-700 text-amber-200 text-sm rounded-md transition-colors"
                                  >
                                    Equip
                                  </motion.button>
                                ))}
                            </div>

                            <div className="text-gray-600 text-xs">
                              Purchased{" "}
                              {new Date(item.bought_at).toLocaleDateString()}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* List View */}
                          {item.store?.category === "Sounds" ? (
                            <div className="w-16 h-16 bg-gray-800 rounded-xl flex items-center justify-center">
                              <Volume2 size={24} className="text-gray-500" />
                            </div>
                          ) : (
                            <img
                              src={item.store?.item_url}
                              alt={item.store?.item}
                              className="w-16 h-16 object-cover rounded-xl"
                            />
                          )}

                          <div className="flex-1 ml-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-gray-200 font-bold text-lg">
                                {item.store?.item}
                              </h3>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`px-2 py-1 bg-gradient-to-r ${getRarityColor(
                                    item.store?.rarity
                                  )} rounded-full text-gray-200 text-xs font-bold capitalize`}
                                >
                                  {item.store?.rarity}
                                </div>
                                <ArrowRight
                                  className="text-gray-500 group-hover:text-gray-300 transition-colors"
                                  size={20}
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-2">
                              <span className="text-gray-500 text-sm capitalize">
                                {item.store?.category}
                              </span>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1 text-amber-500 font-bold">
                                  <PiCoins size={16} />
                                  <span>{item.store?.price}</span>
                                </div>
                                <span className="text-gray-600 text-xs">
                                  {new Date(
                                    item.bought_at
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Hover Glow Effect */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div
                          className={`absolute inset-0 bg-gradient-to-r ${getRarityColor(
                            item.store?.rarity
                          )} opacity-5 rounded-2xl`}
                        />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
