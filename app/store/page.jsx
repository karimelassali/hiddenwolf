"use client";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Star,
  Gamepad2,
  Volume2,
  Zap,
  Search,
  Filter,
} from "lucide-react";
import { PiCoins } from "react-icons/pi";
import Image from "next/image";
import { MdLockOutline } from "react-icons/md";

import { useUser } from "@clerk/nextjs";

export default function Page() {
  const [chosedCategory, setChosedCategory] = useState("Avatars");
  const [chosedItem, setChosedItem] = useState(null);
  const [allItems, setAllItems] = useState([]);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState([]);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [playerState, setPlayerState] = useState([]);

  const { isLoaded, user } = useUser();

  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase.from("store").select("*");
      if (error) console.error(error);
      else {
        setItems(data);
        setAllItems(data);
      }
    };
    fetchItems();
  }, []);

  useEffect(() => {
    let filteredItems = allItems.filter(
      (item) => item.category === chosedCategory
    );

    if (searchTerm) {
      filteredItems = filteredItems.filter((item) =>
        item.item.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setItems(filteredItems);
  }, [chosedCategory, allItems, searchTerm]);

  const addToCart = (item) => {
    setCart((prev) => [...prev, item]);
    // Add a subtle shake animation or success feedback
  };

  const categoryIcons = {
    Avatars: Gamepad2,
    Sounds: Volume2,
    Power: Zap,
  };

  const categories = ["Avatars", "Sounds", "Power"];

  const fetchUserState = async (playerId) => {
    const { data, error } = await supabase
      .from("player_stats")
      .select("coins")
      .eq("player_id", playerId)
      .single();
    if (error) {
      console.error("Error fetching user data:", error.message);
      return;
    }
    setPlayerState(data);
  };

  const confirmPurchasing = async () => {
    await supabase
      .from("player_stats")
      .update({ coins: playerState.coins - chosedItem.price })
      .eq("player_id", user.id);
    await supabase.from("purchases").insert({
        user_id: user.id,
        item_id: chosedItem.id,
    });
    
    setPlayerState({ coins: playerState.coins - chosedItem.price });
    setChosedItem(null);
  };
  useEffect(() => {
    if (user && isLoaded) {
      fetchUserState(user.id);
    }
  }, [isLoaded]);

  return (
    <div
      style={{
        backgroundImage: "url('/assets/images/store.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      className="w-full h-full flex flex-col items-center justify-center gap-8 relative overflow-hidden"
    >
      {/* Animated background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-blue-900/20 to-cyan-900/30 " />

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden  pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-violet-400/30 rounded-full"
            initial={{
              x: Math.random() * Math.random(),
              y: Math.random() * Math.random(),
            }}
            animate={{
              y: [null, Math.random() * Math.random()],
              x: [null, Math.random() * Math.random()],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Header */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex items-center gap-4"
      ></motion.div>

      {/* User Info Header */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex items-center justify-between w-[80%] max-w-6xl"
      >
        <div className="flex items-center gap-4 bg-black/20 backdrop-blur-sm rounded-full px-6 py-3 border border-cyan-500/30">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center">
            {/* <User className="text-white" size={20} /> */}
          </div>
          <div className="text-white">
            <div className="font-semibold">{user?.firstName || "Player"}</div>
            {/* <div className="text-sm text-gray-300">
              {user?.emailAddresses?.[0]?.emailAddress}
            </div> */}
          </div>
        </div>

        <div className="flex items-center gap-3 bg-black/20 backdrop-blur-sm rounded-full px-6 py-3 border border-yellow-500/30">
          <PiCoins className="text-yellow-400 text-2xl" />
          <div className="text-white">
            <div className="font-bold text-xl text-yellow-400">
              {playerState.coins}
            </div>
          </div>
        </div>
      </motion.div>
      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 flex items-center  w-96"
      >
        <div className="relative ">
          <Search
            className="absolute z-30 left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-black/30 backdrop-blur-md border border-cyan-500/30 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300"
          />
        </div>
      </motion.div>

      {/* Main Store Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="w-[80%] max-w-6xl bg-black/20  rounded-3xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/10 relative backdrop-blur-sm z-10 overflow-hidden"
      >
        {/* Category Tabs */}
        <div className="flex relative justify-center p-6 border-b border-cyan-500/20">
          <div className="flex bg-black/30 rounded-full p-2 gap-2">
            {categories.map((category) => {
              const Icon = categoryIcons[category];
              return (
                <motion.button
                  key={category}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setChosedCategory(category)}
                  className={`relative px-6 py-3 rounded-full flex items-center gap-2 font-semibold transition-all duration-300 ${
                    chosedCategory === category
                      ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg"
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon size={18} />
                  {category}

                  {chosedCategory === category && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full -z-10"
                      transition={{ type: "spring", duration: 0.6 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Items Grid */}
        <div className="p-6 h-96 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={chosedCategory + searchTerm}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {items.map((item, index) => (
                <motion.div
                  key={`${item.id}-${index}`}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  onHoverStart={() => setHoveredItem(item.id)}
                  onHoverEnd={() => setHoveredItem(null)}
                  className="group relative bg-gradient-to-br  from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700/50 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer"
                >
                  {/* Item Image */}
                  <div
                    style={{
                      backgroundImage: `url("/assets/images/bg.png")`,
                      backgroundSize: "cover",
                      backgroundRepeat: "no-repeat",
                    }}
                    className="relative h-48 overflow-hidden"
                  >
                    <motion.img
                      src={item.item_url}
                      alt={item.item}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />

                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Rating stars */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
                      <Star
                        className="text-yellow-400 fill-current"
                        size={12}
                      />
                      <span className="text-white text-xs font-medium">
                        4.8
                      </span>
                    </div>
                  </div>

                  {/* Item Info */}
                  <div className="p-4">
                    <h3 className="text-white font-bold text-lg mb-2 group-hover:text-cyan-400 transition-colors duration-300">
                      {item.item}
                    </h3>

                    <div className="flex items-center justify-between">
                      <div className="text-2xl flex items-center gap-2 font-bold bg-gradient-to-r text-slate-500 bg-clip-text ">
                        <PiCoins />
                        {item.price}
                      </div>

                      {item.price <= playerState?.coins ? (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            setChosedItem(item);
                            e.stopPropagation();
                          }}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2 rounded-full font-semibold shadow-lg hover:shadow-purple-500/25 transition-all duration-300 flex items-center gap-2"
                        >
                          <ShoppingCart size={16} />
                          Buy
                        </motion.button>
                      ) : (
                        <div className="flex items-center justify-center">
                          <MdLockOutline size={30} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-2xl" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Empty state */}
          {items.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-64 text-gray-400"
            >
              <Filter size={48} className="mb-4 opacity-50" />
              <div className="text-xl font-semibold mb-2">No items found</div>
              <div>Try adjusting your search or category filter</div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Confirming dialogue */}
      {chosedItem && (
        <PurchaseConfirming
          chosedItem={chosedItem}
          currentPlayerCoins={playerState?.coins}
          oncClose={() => setChosedItem(null)}
          onConfirm={confirmPurchasing}
        />
      )}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #06b6d4, #8b5cf6);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #0891b2, #7c3aed);
        }
      `}</style>
    </div>
  );
}

export function PurchaseConfirming({
  chosedItem,
  currentPlayerCoins,
  oncClose,
  onConfirm,
}) {
  const canAfford = currentPlayerCoins >= chosedItem?.price;
  const remainingCoins = currentPlayerCoins - (chosedItem?.price || 0);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 w-96 border border-cyan-500/30 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Confirm Purchase</h3>
          <button className="text-gray-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        {/* Item Preview */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-black/30 rounded-lg">
          <img
            src={chosedItem?.item_url}
            alt={chosedItem?.item}
            className="w-16 h-16 object-cover rounded-lg"
          />
          <div className="flex-1">
            <h4 className="text-white font-semibold">{chosedItem?.item}</h4>
            <p className="text-gray-400 text-sm">{chosedItem?.category}</p>
          </div>
          <div className="flex items-center gap-1 text-yellow-400 font-bold text-lg">
            🪙 {chosedItem?.price}
          </div>
        </div>

        {/* Balance Info */}
        <div className="mb-6 p-4 bg-black/20 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300">Current Balance:</span>
            <span className="text-yellow-400 font-semibold">
              🪙 {currentPlayerCoins}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300">Item Cost:</span>
            <span className="text-red-400 font-semibold">
              -🪙 {chosedItem?.price}
            </span>
          </div>
          <hr className="border-gray-600 my-2" />
          <div className="flex justify-between items-center">
            <span className="text-white font-semibold">After Purchase:</span>
            <span
              className={`font-bold ${
                remainingCoins >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              🪙 {remainingCoins}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={oncClose}
            className="flex-1 py-3 px-4 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canAfford}
            className={`flex-1 py-3 px-4 font-semibold rounded-lg transition-colors ${
              canAfford
                ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
            }`}
          >
            {canAfford ? "Confirm Purchase" : "Insufficient Coins"}
          </button>
        </div>

        {/* Warning */}
        {!canAfford && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm text-center">
              You need {chosedItem?.price - currentPlayerCoins} more coins
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
