"use client";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Toaster, toast } from "react-hot-toast";
import { Loader } from "@/components/ui/loader";
import { Modal } from "@/components/modal";
import { NumberCounting } from "@/components/magicui/number-ticker";
import { motion, AnimatePresence } from "framer-motion";
import { getLevelTitle, getLevelColor } from "@/utils/levelSystem";
import {
    GiCrownedSkull,
    GiWolfHead,
    GiCrossedSwords
} from "react-icons/gi";
import {
    Users,
    Trophy,
    ShoppingBag,
    BookOpen
} from "lucide-react";
import { CreateRoomModal } from "@/components/CreateRoomModal";

export default function Lobby({ user }) {
    const router = useRouter();

    const [roomIsCreating, setRoomIsCreating] = useState(false);
    const [revealCoins, setRevealCoins] = useState(null);
    const [currentBgIndex, setCurrentBgIndex] = useState(0);
    const [avatar, setAvatar] = useState(null);
    const [totalGames, setTotalGames] = useState(0);
    const [level, setLevel] = useState(1);
    const [username, setUsername] = useState("");
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [roomCode, setRoomCode] = useState("");
    const [joinRoomLoading, setJoinRoomLoading] = useState(false);
    const [joinRoomError, setJoinRoomError] = useState("");

    const backgrounds = [
        'url("/assets/images/background1.avif")', // Keeping original BG, can be swapped for darker one
    ];

    const checkIfPlayerRegistred = async (currentUser) => {
        try {
            if (currentUser?.id) {
                const { data: existingData, error: fetchError } = await supabase
                    .from("player_stats")
                    .select("player_id")
                    .eq("player_id", currentUser.id);

                if (fetchError) {
                    console.error("Error fetching player data:", fetchError);
                    return null;
                }

                if (existingData && existingData.length === 0) {
                    const coins = [100, 20, 499, 900, 1000, 3000];
                    const giftCoins = Math.floor(Math.random() * coins.length);
                    const { data: insertedData, error: insertError } = await supabase
                        .from("player_stats")
                        .insert({
                            player_id: currentUser.id,
                            coins: coins[giftCoins],
                            email: currentUser.emailAddresses[0].emailAddress,
                        })
                        .select();

                    setRevealCoins(coins[giftCoins]);
                    if (insertError) {
                        console.error("Error creating player data:", insertError);
                        return null;
                    }
                    return insertedData;
                }
                return existingData;
            }
        } catch (error) {
            console.error("Error in checkIfPlayerRegistred:", error);
        }
        return null;
    };

    const fetchPlayerDetails = async (currentUser) => {
        // Clean up any stale player rows (fire and forget)
        await supabase.from("players").delete().eq("player_id", currentUser.id);
        const { data, error } = await supabase
            .from("player_stats")
            .select("*")
            .eq("player_id", currentUser.id)
            .single();

        if (error) {
            console.error("[Lobby] Error fetching player_stats:", error);
        }

        if (data) {
            setAvatar(data.avatar || null);
            setTotalGames(data.total_games || 0);
            setUsername(data.username || "");
            setLevel(data.level || 1);
        }
    };

    useEffect(() => {
        if (user) {
            const initUser = async () => {
                await checkIfPlayerRegistred(user);
                await fetchPlayerDetails(user);
            };
            initUser();
        }
    }, [user]);

    useEffect(() => {
        setCurrentBgIndex((prevIndex) => (prevIndex + 1) % backgrounds.length);
    }, []);

    const handleCreateRoom = () => {
        setShowCreateModal(true);
    };

    const handleCreateRoomSubmit = (settings) => {
        setRoomIsCreating(true);
        const fullId = uuidv4();
        const shortId = fullId.slice(0, 4);

        if (user && user.id) {
            supabase
                .from("rooms")
                .insert({
                    code: shortId,
                    stage: "waiting",
                    round: 1,
                    host_id: user.id,
                    max_players: settings.maxPlayers,
                    round_duration: settings.roundDuration,
                    total_rounds: settings.totalRounds
                })
                .select()
                .then(({ data, error }) => {
                    if (error) throw error;
                    router.push(`/room/${shortId}`);
                })
                .catch((error) => {
                    console.error("Error creating room:", error);
                    toast.error(error.message);
                    setRoomIsCreating(false);
                    setShowCreateModal(false);
                });
        }
    };

    const handleJoinRoom = () => {
        setShowJoinModal(true);
        setJoinRoomError("");
        setRoomCode("");
    };

    const handleJoinRoomSubmit = async () => {
        if (!roomCode.trim()) {
            setJoinRoomError("Please enter a room code");
            return;
        }
        setJoinRoomLoading(true);
        setJoinRoomError("");

        try {
            const { data, error } = await supabase
                .from("rooms")
                .select("code, stage")
                .eq("code", roomCode.trim().toLowerCase());

            if (error || !data) {
                setJoinRoomError("Room not found. Check the code.");
                setJoinRoomLoading(false);
                return;
            }
            if (data.stage === "finished") {
                setJoinRoomError("This room has ended.");
                setJoinRoomLoading(false);
                return;
            }
            router.push(`/room/${roomCode.trim().toLowerCase()}`);
        } catch (error) {
            setJoinRoomError("Connection error.");
            setJoinRoomLoading(false);
        }
    };

    const closeJoinModal = () => {
        setShowJoinModal(false);
        setRoomCode("");
        setJoinRoomError("");
        setJoinRoomLoading(false);
    };

    // Thematic Icons for the Dark Fantasy Dock
    const dockItems = [
        { label: "Rules", route: "/rules", icon: BookOpen }, // Scroll/Book
        { label: "Profile", route: "/profile", icon: Users }, // Skull/User
        { label: "Store", route: "/store", icon: ShoppingBag }, // Potion/Bag
        { label: "Ranking", route: "/ranking", icon: Trophy }, // Crown/Trophy
    ];

    return (
        <div className="relative w-full h-screen overflow-hidden bg-stone-950 font-serif selection:bg-red-900/40 selection:text-red-100">
            <Toaster />

            {/* Background Layer - Darker & Grittier */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentBgIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2 }}
                    style={{
                        backgroundImage: backgrounds[currentBgIndex],
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                    className="absolute inset-0 z-0 opacity-50 grayscale-[30%] contrast-110 saturate-75"
                />
            </AnimatePresence>

            {/* Vignette & Texture Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-stone-950/80 via-stone-900/40 to-stone-950/85 z-0" />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay z-0 pointer-events-none" />

            {/* Reveal Coins Modal */}
            {revealCoins && (
                <Modal
                    usage="coins"
                    prop={revealCoins + ""}
                    onCloseModal={() => setRevealCoins(null)}
                />
            )}

            {/* Content Container */}
            <div className="relative z-10 flex flex-col h-full p-6 md:p-8">

                {/* Top HUD - Minimalist Stats Only (No duplicate Branding) */}
                <header className="flex justify-end items-start mb-4">
                    {/* Only showing User Stats to avoid duplicate logo */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-4 bg-black/40 backdrop-blur-md border border-stone-700/50 p-2 pr-6 rounded-full shadow-2xl hover:border-red-900/50 transition-colors duration-500"
                    >
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-stone-600 shadow-inner">
                                {avatar ? (
                                    <img src={avatar} alt="Avatar" className="object-cover w-full h-full" />
                                ) : (
                                    <div className="w-full h-full bg-stone-800 flex items-center justify-center text-stone-400 font-bold font-serif">
                                        {user?.firstName?.charAt(0) || "P"}
                                    </div>
                                )}
                            </div>
                            {/* Status Indicator (Green -> Red/Dim for theme) */}
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-600/80 border-2 border-black rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-base font-bold text-stone-200 leading-none mb-1 font-serif tracking-wide">
                                {username || user?.firstName || "Traveler"}
                            </span>
                            <div className="flex items-center gap-3 text-xs font-mono">
                                <span className={`font-bold ${getLevelColor(level)}`}>LVL {level}</span>
                                <span className="w-px h-3 bg-stone-600" />
                                <span className="text-stone-300">{getLevelTitle(level)}</span>
                                <span className="w-px h-3 bg-stone-600" />
                                <span className="text-stone-300"><NumberCounting value={totalGames} /> Hunts</span>
                            </div>
                        </div>
                    </motion.div>
                </header>

                {/* Main Action Area - Tarot Cards Layout */}
                <main className="flex-1 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 max-w-4xl mx-auto w-full pb-24 px-4">

                    {/* Card 1: Create Room (The Creator/Host) */}
                    <motion.button
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        onClick={handleCreateRoom}
                        disabled={roomIsCreating}
                        className="group relative w-full max-w-[260px] md:max-w-[300px] aspect-[3/3.5] bg-stone-900 rounded-lg overflow-hidden border border-stone-700/60 shadow-[0_0_0_1px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(220,38,38,0.2)] transition-all duration-500"
                    >
                        {/* Card Frame/Border Graphic */}
                        <div className="absolute inset-2 border border-stone-700/30 rounded flex flex-col items-center justify-between p-2 z-20 pointer-events-none group-hover:border-red-900/40 transition-colors duration-500">
                            <div className="w-full h-px bg-gradient-to-r from-transparent via-stone-700/30 to-transparent" />
                            <div className="w-full h-px bg-gradient-to-r from-transparent via-stone-700/30 to-transparent" />
                        </div>

                        {/* Background Image / Texture */}
                        <div className="absolute inset-0 bg-stone-900">
                            <div className="absolute inset-0 bg-gradient-to-t from-red-950/40 to-stone-900/90 mix-blend-multiply opacity-80" />
                            {/* Animated Fog/Smoke effect could go here */}
                        </div>

                        {/* Center Icon/Art */}
                        <div className="relative z-10 flex flex-col items-center justify-center h-full gap-6 p-6 group-hover:-translate-y-2 transition-transform duration-500">
                            <div className="p-5 rounded-full border border-stone-700/50 bg-stone-950 shadow-2xl group-hover:border-red-900/50 transition-colors duration-500">
                                {roomIsCreating ? <Loader className="text-stone-400" /> : <GiWolfHead className="w-12 h-12 text-stone-200 group-hover:text-red-600 transition-colors duration-500" />}
                            </div>

                            <div className="text-center space-y-2">
                                <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-200 tracking-widest uppercase group-hover:text-red-100 transition-colors">
                                    New Hunt
                                </h2>
                                <p className="text-stone-500 text-xs md:text-sm font-serif italic max-w-[180px] mx-auto leading-relaxed group-hover:text-stone-400 transition-colors">
                                    "Gather the pack. The moon is high."
                                </p>
                            </div>
                        </div>

                        {/* Bottom Label (Tarot Style) */}
                        <div className="absolute bottom-4 left-0 w-full text-center z-20">
                            <span className="text-[10px] font-mono text-stone-600 tracking-[0.15em] uppercase group-hover:text-stone-500 transition-colors">IV. The Host</span>
                        </div>
                    </motion.button>

                    {/* Card 2: Join Room (The Traveler/Guest) */}
                    <motion.button
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        onClick={handleJoinRoom}
                        className="group relative w-full max-w-[260px] md:max-w-[300px] aspect-[3/3.5] bg-stone-900 rounded-lg overflow-hidden border border-stone-700/60 shadow-[0_0_0_1px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(217,119,6,0.15)] transition-all duration-500"
                    >
                        {/* Card Frame */}
                        <div className="absolute inset-2 border border-stone-700/30 rounded flex flex-col items-center justify-between p-2 z-20 pointer-events-none group-hover:border-amber-900/30 transition-colors duration-500">
                            <div className="w-full h-px bg-gradient-to-r from-transparent via-stone-700/30 to-transparent" />
                            <div className="w-full h-px bg-gradient-to-r from-transparent via-stone-700/30 to-transparent" />
                        </div>

                        {/* Background Texture */}
                        <div className="absolute inset-0 bg-stone-900">
                            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 to-stone-900/80 mix-blend-multiply opacity-80" />
                        </div>

                        {/* Center Icon/Art */}
                        <div className="relative z-10 flex flex-col items-center justify-center h-full gap-6 p-6 group-hover:-translate-y-2 transition-transform duration-500">
                            <div className="p-5 rounded-full border border-stone-700/50 bg-stone-950 shadow-2xl group-hover:border-amber-900/40 transition-colors duration-500">
                                <GiCrossedSwords className="w-12 h-12 text-stone-200 group-hover:text-amber-600 transition-colors duration-500" />
                            </div>

                            <div className="text-center space-y-2">
                                <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-200 tracking-widest uppercase group-hover:text-amber-100 transition-colors">
                                    Join Pack
                                </h2>
                                <p className="text-stone-500 text-xs md:text-sm font-serif italic max-w-[180px] mx-auto leading-relaxed group-hover:text-stone-400 transition-colors">
                                    "Answer the call. Your fate awaits."
                                </p>
                            </div>
                        </div>

                        {/* Bottom Label */}
                        <div className="absolute bottom-4 left-0 w-full text-center z-20">
                            <span className="text-[10px] font-mono text-stone-600 tracking-[0.15em] uppercase group-hover:text-stone-500 transition-colors">VII. The Pack</span>
                        </div>
                    </motion.button>
                </main>

                {/* Bottom Navigation - "Inventory/Rune" Style */}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg"
                >
                    <div className="flex items-center justify-center gap-6 md:gap-8 p-4 bg-stone-900/90 backdrop-blur-md border border-stone-600/50 rounded-full shadow-2xl">
                        {dockItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => router.push(item.route)}
                                className="group relative flex flex-col items-center justify-center gap-1 min-w-[3rem] transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="text-stone-300 group-hover:text-white transition-colors duration-300">
                                    <item.icon size={22} />
                                </div>
                                <span className="text-[10px] font-serif tracking-wider text-stone-400 group-hover:text-stone-200 uppercase transition-colors">
                                    {item.label}
                                </span>
                                {/* Glow dot on hover */}
                                <div className="absolute -bottom-2 w-1 h-1 rounded-full bg-red-900/0 group-hover:bg-red-500/80 transition-all duration-300" />
                            </button>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Join Room Modal - Thematic Update */}
            <AnimatePresence>
                {showJoinModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={closeJoinModal} />

                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-md bg-stone-900 border border-stone-700/50 rounded-lg p-8 shadow-2xl"
                        >
                            <div className="text-center mb-8">
                                <GiCrownedSkull className="w-12 h-12 text-stone-500 mx-auto mb-4" />
                                <h3 className="text-2xl font-serif font-bold text-stone-200 uppercase tracking-widest">Enter Code</h3>
                                <p className="text-stone-500 font-serif italic text-sm">"Speak the cipher to enter."</p>
                            </div>

                            <div className="space-y-6">
                                <input
                                    type="text"
                                    value={roomCode}
                                    onChange={(e) => {
                                        setRoomCode(e.target.value.toUpperCase());
                                        setJoinRoomError("");
                                    }}
                                    placeholder="ABCD"
                                    maxLength={4}
                                    className="w-full bg-stone-950 border-b-2 border-stone-800 text-stone-200 text-center text-3xl font-mono tracking-[0.5em] py-4 focus:outline-none focus:border-red-900 transition-colors uppercase placeholder:text-stone-800"
                                    autoFocus
                                    onKeyPress={(e) => e.key === "Enter" && handleJoinRoomSubmit()}
                                />

                                {joinRoomError && (
                                    <div className="text-red-800/80 text-sm font-serif text-center italic">
                                        {joinRoomError}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        onClick={closeJoinModal}
                                        className="bg-transparent hover:bg-stone-800 text-stone-500 border border-stone-800 hover:text-stone-300 font-serif uppercase tracking-wider"
                                    >
                                        Retreat
                                    </Button>
                                    <Button
                                        onClick={handleJoinRoomSubmit}
                                        disabled={joinRoomLoading || !roomCode}
                                        className="bg-stone-800 hover:bg-red-950 text-stone-300 hover:text-red-100 border border-stone-700/50 font-serif uppercase tracking-wider"
                                    >
                                        {joinRoomLoading ? <Loader /> : "Enter"}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create Room Modal */}
            <CreateRoomModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreate={handleCreateRoomSubmit}
            />
        </div >
    );
}
