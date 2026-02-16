"use client";
import { supabase } from "@/lib/supabase";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Star,
  Gamepad2,
  Volume2,
  Zap,
  Search,
  Filter,
  X,
  Check,
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { PiCoins } from "react-icons/pi";
import Image from "next/image";
import { MdLockOutline } from "react-icons/md";
import { FaArrowLeft } from "react-icons/fa";
import { useRouter } from "next/navigation";

import { useUser } from "@clerk/nextjs";
import { CustomAudioPlayer } from "@/components/audioPlayer";
import { CashSound } from "@/utils/sounds";

const PAGE_SIZE = 10;

export default function Page() {
  const [chosedCategory, setChosedCategory] = useState("Avatars");
  const [chosedItem, setChosedItem] = useState(null);
  const [allItems, setAllItems] = useState([]);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [playerState, setPlayerState] = useState(null);
  const [purchasedItemIds, setPurchasedItemIds] = useState(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);
  const router = useRouter();

  const { isLoaded, user } = useUser();

  // Fetch all active items
  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from("store")
        .select("*")
        .eq("is_active", true)
        .order("id", { ascending: true });
      if (error) console.error(error);
      else {
        setAllItems(data);
      }
    };
    fetchItems();
  }, []);

  // Fetch user purchases
  useEffect(() => {
    if (!user) return;
    const fetchPurchases = async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("item_id")
        .eq("user_id", user.id);
      if (error) console.error("Error fetching purchases:", error);
      else {
        setPurchasedItemIds(new Set(data.map(p => p.item_id)));
      }
    };
    fetchPurchases();
  }, [user]);

  // Filter items by category + search
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
    setVisibleCount(PAGE_SIZE); // Reset when filter changes
  }, [chosedCategory, allItems, searchTerm]);

  // Visible items slice
  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setLoadingMore(true);
          setTimeout(() => {
            setVisibleCount(prev => Math.min(prev + PAGE_SIZE, items.length));
            setLoadingMore(false);
          }, 300);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, items.length, visibleCount]);


  const categoryIcons = {
    Avatars: Gamepad2,
    Sounds: Volume2,
    Power: Zap,
  };

  const categories = ["Avatars", "Sounds", "Power"];

  const fetchUserState = async (playerId) => {
    const { data, error } = await supabase
      .from("player_stats")
      .select("coins,avatar")
      .eq("player_id", playerId)
      .single();
    if (error) {
      console.error("Error fetching user data:", error.message);
      return;
    }
    setPlayerState(data);
  };

  const confirmPurchasing = async () => {
    if (!playerState || !chosedItem) return;

    await supabase
      .from("player_stats")
      .update({ coins: playerState.coins - chosedItem.price })
      .eq("player_id", user.id);
    await supabase.from("purchases").insert({
      user_id: user.id,
      item_id: chosedItem.id,
    });

    setPlayerState({ ...playerState, coins: playerState.coins - chosedItem.price });
    setPurchasedItemIds(prev => new Set([...prev, chosedItem.id]));
    CashSound();
    setChosedItem(null);
  };

  useEffect(() => {
    if (user && isLoaded) {
      fetchUserState(user.id);
    }
  }, [isLoaded, user]);

  return (
    <div className="min-h-screen relative overflow-hidden font-sans text-neutral-200 selection:bg-white/10">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/assets/images/store.avif')", // Keeping store bg but styling it
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter: "grayscale(100%) brightness(0.7)", // Cinematic dark look
        }}
      >
        <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
      </div>

      {/* Navigation */}
      <div className="absolute top-6 left-6 z-50">
        <button
          onClick={() => router.back()}
          className="p-3 rounded-full bg-black/40 hover:bg-black/60 border border-white/5 backdrop-blur-md transition-all duration-300 group shadow-lg"
        >
          <FaArrowLeft size={20} className="text-neutral-400 group-hover:text-white" />
        </button>
      </div>

      {/* Top Bar / User Stats */}
      {playerState && (
        <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
          <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 shadow-2xl">
            <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden relative">
              {playerState.avatar ? (
                <Image src={playerState.avatar} alt="Avatar" fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-xs font-bold">{user?.firstName?.charAt(0)}</div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-neutral-500 font-bold leading-none tracking-wider">Balance</span>
              <div className="flex items-center gap-1.5 text-yellow-500 font-bold leading-none mt-1">
                <PiCoins />
                <span>{playerState.coins?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        {/* Header Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 w-full"
        >
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-4 drop-shadow-2xl uppercase">
            Armory
          </h1>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto font-medium">
            Equip yourself for the hunt.
          </p>
        </motion.div>

        {/* Controls: Category & Search */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row items-center gap-6 mb-12 w-full justify-between max-w-5xl"
        >
          {/* Categories */}
          <div className="flex bg-black/40 backdrop-blur-lg border border-white/10 rounded-full p-1.5 gap-1 shadow-lg">
            {categories.map((category) => {
              const Icon = categoryIcons[category];
              const isActive = chosedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setChosedCategory(category)}
                  className={`
                                relative px-6 py-2.5 rounded-full flex items-center gap-2 font-bold text-sm transition-all duration-300
                                ${isActive ? 'text-black' : 'text-neutral-400 hover:text-white hover:bg-white/5'}
                            `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabStore"
                      className="absolute inset-0 bg-white rounded-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon size={16} />
                    {category}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-white transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 backdrop-blur-lg border border-white/10 rounded-full pl-12 pr-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 focus:bg-black/60 transition-all shadow-lg"
            />
          </div>
        </motion.div>

        {/* Items Grid */}
        <div className="w-full max-w-7xl">
          <AnimatePresence mode="wait">
            {items.length > 0 ? (
              <motion.div
                key={chosedCategory + searchTerm}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {visibleItems.map((item, index) => {
                  const isOwned = purchasedItemIds.has(item.id);
                  return (
                    <motion.div
                      key={`${item.id}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (index % PAGE_SIZE) * 0.05 }}
                      whileHover={{ y: -5 }}
                      className={`group relative bg-black/40 backdrop-blur-xl border rounded-3xl overflow-hidden hover:bg-black/60 transition-all duration-300 shadow-xl ${isOwned ? 'border-green-500/20' : 'border-white/10 hover:border-white/20'}`}
                    >
                      {/* Owned Badge */}
                      {isOwned && (
                        <div className="absolute top-4 left-4 z-20 bg-green-500/20 backdrop-blur-md border border-green-500/30 rounded-full px-3 py-1 flex items-center gap-1.5">
                          <CheckCircle2 className="text-green-400" size={12} />
                          <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Owned</span>
                        </div>
                      )}

                      {/* Item Visual */}
                      <div className="h-48 relative overflow-hidden bg-neutral-900/50">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {item.category === "Sounds" ? (
                          <div className="w-full h-full p-6 flex flex-col items-center justify-center relative z-10">
                            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                              <Volume2 size={32} />
                            </div>
                            <div className="mt-4 w-full">
                              <CustomAudioPlayer src={item.item_url} itemName={item.item} minimal={true} />
                            </div>
                          </div>
                        ) : (
                          <div className="relative w-full h-full">
                            <div className="absolute inset-0 opacity-10 bg-[url('/assets/images/bg.png')] bg-cover bg-center" />
                            <div className="relative w-full h-full p-8 transition-transform duration-500 group-hover:scale-110">
                              <Image
                                src={item.item_url}
                                alt={item.item}
                                fill
                                className="object-contain drop-shadow-2xl"
                              />
                            </div>
                          </div>
                        )}

                        {/* Rating badge */}
                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/5 rounded-full px-2.5 py-1 flex items-center gap-1">
                          <Star className="text-yellow-500 fill-yellow-500" size={10} />
                          <span className="text-[10px] font-bold text-neutral-300">4.8</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-white font-bold text-lg leading-tight group-hover:text-neutral-200 transition-colors">{item.item}</h3>
                            <p className="text-neutral-500 text-xs font-medium uppercase tracking-wider mt-1">{item.category}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 md:mt-6">
                          <div className="flex items-center gap-1.5 text-yellow-500 font-bold text-lg">
                            <PiCoins />
                            <span>{item.price}</span>
                          </div>

                          {isOwned ? (
                            <div className="px-5 py-2 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-sm font-bold flex items-center gap-2">
                              <CheckCircle2 size={14} />
                              Owned
                            </div>
                          ) : playerState && item.price <= playerState.coins ? (
                            <button
                              onClick={() => setChosedItem(item)}
                              className="px-5 py-2 rounded-full bg-white text-black text-sm font-bold hover:bg-neutral-200 transition-colors flex items-center gap-2 transform active:scale-95"
                            >
                              <ShoppingCart size={14} />
                              Buy
                            </button>
                          ) : (
                            <button disabled className="px-5 py-2 rounded-full bg-white/5 text-neutral-500 border border-white/5 text-sm font-bold flex items-center gap-2 cursor-not-allowed">
                              <MdLockOutline size={14} />
                              Locked
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-neutral-500"
              >
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  <Filter size={32} />
                </div>
                <h3 className="text-white font-bold text-xl mb-2">No items found</h3>
                <p>Try adjusting your search or filters.</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Infinite Scroll Sentinel */}
          <div ref={sentinelRef} className="w-full py-8 flex justify-center">
            {loadingMore && (
              <div className="flex items-center gap-2 text-neutral-500 text-sm">
                <Loader2 size={16} className="animate-spin" />
                Loading more items...
              </div>
            )}
            {!hasMore && items.length > PAGE_SIZE && (
              <p className="text-neutral-600 text-xs">You&apos;ve seen all items</p>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {chosedItem && (
          <PurchaseConfirming
            chosedItem={chosedItem}
            currentPlayerCoins={playerState?.coins || 0}
            oncClose={() => setChosedItem(null)}
            onConfirm={confirmPurchasing}
          />
        )}
      </AnimatePresence>
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-[#121212] border border-white/10 rounded-3xl p-8 w-full max-w-sm shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Confirm Purchase</h3>
          <button onClick={oncClose} className="text-neutral-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Item Preview */}
        <div className="flex items-center gap-5 p-4 bg-white/5 rounded-2xl border border-white/5 mb-6">
          <div className="w-16 h-16 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
            {chosedItem.category == "Sounds" ? (
              <Volume2 className="text-neutral-400" />
            ) : (
              <Image
                src={chosedItem?.item_url}
                alt={chosedItem?.item}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">{chosedItem?.category}</div>
            <h4 className="text-white font-bold text-lg truncate">{chosedItem?.item}</h4>
            <div className="flex items-center gap-1.5 text-yellow-500 font-bold text-sm mt-1">
              <PiCoins size={14} />
              {chosedItem?.price}
            </div>
          </div>
        </div>

        {/* Balance Preview */}
        <div className="space-y-3 mb-8">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">Current Balance</span>
            <span className="text-white font-mono">{currentPlayerCoins}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">Cost</span>
            <span className="text-red-400 font-mono">-{chosedItem?.price}</span>
          </div>
          <div className="h-px bg-white/5 my-2" />
          <div className="flex justify-between text-sm font-bold">
            <span className="text-white">New Balance</span>
            <span className={`font-mono ${canAfford ? 'text-green-400' : 'text-red-500'}`}>
              {remainingCoins}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={oncClose}
            className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-colors border border-white/5"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canAfford}
            className={`py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${canAfford
              ? "bg-white text-black hover:bg-neutral-200 shadow-lg shadow-white/5"
              : "bg-white/5 text-neutral-500 cursor-not-allowed border border-white/5"
              }`}
          >
            {canAfford ? (
              <>
                <Check size={16} /> Confirm
              </>
            ) : (
              "Insufficient Funds"
            )}
          </button>
        </div>

        {!canAfford && (
          <div className="mt-4 flex items-center gap-2 text-red-400 text-xs font-medium justify-center bg-red-500/10 py-2 rounded-lg border border-red-500/10">
            <AlertCircle size={12} />
            Missing {chosedItem?.price - currentPlayerCoins} coins
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
