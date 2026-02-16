'use client'
import { supabase } from '@/lib/supabase'
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Trophy, Crown, Medal, Star, TrendingUp, Users, Target, Award } from 'lucide-react';
import { FaArrowLeft } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
export default function Page() {
    const { user, isLoaded } = useUser();
    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUserRank, setCurrentUserRank] = useState(null);
    const router = useRouter();

    const fetchTopPlayers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('player_stats')
            .select('*')
            .order('wins', { ascending: false });

        if (error) {
            console.log(error);
        } else {
            setRanking(data);
            // Find current user's rank
            const userIndex = data.findIndex(player => player.player_id === user?.id);
            if (userIndex !== -1) {
                setCurrentUserRank(userIndex + 1);
            }
        }
        setLoading(false);
    }

    useEffect(() => {
        if (isLoaded) {
            fetchTopPlayers();
        }
    }, [isLoaded, user]);



    const getTier = (wins) => {
        if (wins >= 100) return { name: "Legend", icon: Crown, color: "text-red-500" };
        if (wins >= 50) return { name: "Grandmaster", icon: Star, color: "text-yellow-500" };
        if (wins >= 20) return { name: "Master", icon: Target, color: "text-purple-500" };
        if (wins >= 10) return { name: "Elite", icon: Trophy, color: "text-blue-500" };
        return { name: "Rookie", icon: Users, color: "text-slate-500" };
    };

    const getWinRate = (player) => {
        if (player.total_games === 0) return "0.0";
        return ((player.wins / player.total_games) * 100).toFixed(1);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white/10 border-t-white/80 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden font-sans text-neutral-200 selection:bg-white/10">
            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: "url('/assets/images/ranking_bg.webp')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    filter: "grayscale(100%)", // Reduced color for matte look
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

            <div className="relative z-10 max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-4 drop-shadow-2xl">
                        LEADERBOARD
                    </h1>
                    <p className="text-neutral-400 text-lg max-w-2xl mx-auto font-medium">
                        The elite hunters of the realm.
                    </p>
                </motion.div>

                {/* Top 3 Podium - Sleek Glass Cards */}
                {ranking.length >= 3 && (
                    <div className="flex flex-col md:flex-row items-end justify-center gap-6 mb-20 px-4">
                        {/* 2nd Place */}
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="order-2 md:order-1 flex-1 max-w-[280px] w-full"
                        >
                            <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-3xl p-6 flex flex-col items-center shadow-2xl relative overflow-hidden group hover:bg-black/50 transition-colors">
                                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                <div className="w-20 h-20 rounded-full border-2 border-slate-500 shadow-[0_0_15px_rgba(100,116,139,0.3)] mb-4 relative">
                                    {ranking[1]?.avatar ? (
                                        <Image src={ranking[1].avatar} alt={ranking[1].username} fill className="object-cover rounded-full" />
                                    ) : (
                                        <div className="w-full h-full bg-neutral-800 rounded-full flex items-center justify-center font-bold text-neutral-500">{ranking[1]?.username?.charAt(0)}</div>
                                    )}
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-800 rounded-full border border-slate-600 flex items-center justify-center text-slate-300 font-bold text-sm shadow-lg">2</div>
                                </div>
                                <h3 className="text-white font-bold text-lg truncate w-full text-center">{ranking[1]?.username}</h3>
                                <p className="text-slate-400 text-sm font-medium mb-3">{ranking[1]?.wins} Wins</p>
                                <div className="px-3 py-1 bg-slate-500/10 border border-slate-500/20 rounded-full text-xs text-slate-400 font-bold uppercase tracking-wider">Silver Tier</div>
                            </div>
                        </motion.div>

                        {/* 1st Place */}
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="order-1 md:order-2 flex-1 max-w-[320px] w-full z-20 -mt-12 md:mt-0"
                        >
                            <div className="bg-neutral-900/60 backdrop-blur-xl border border-yellow-500/20 rounded-[2rem] p-8 flex flex-col items-center shadow-[0_0_50px_rgba(234,179,8,0.1)] relative overflow-hidden group hover:border-yellow-500/30 transition-colors">
                                <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 to-transparent pointer-events-none" />
                                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />

                                <div className="relative mb-6">
                                    <Crown className="absolute -top-10 left-1/2 -translate-x-1/2 text-yellow-500 drop-shadow-[0_2px_10px_rgba(234,179,8,0.5)]" size={40} />
                                    <div className="w-28 h-28 rounded-full border-4 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.3)] relative">
                                        {ranking[0]?.avatar ? (
                                            <Image src={ranking[0].avatar} alt={ranking[0].username} fill className="object-cover rounded-full" />
                                        ) : (
                                            <div className="w-full h-full bg-neutral-800 rounded-full flex items-center justify-center font-bold text-neutral-500 text-2xl">{ranking[0]?.username?.charAt(0)}</div>
                                        )}
                                        <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-yellow-900 rounded-full border border-yellow-500 flex items-center justify-center text-yellow-500 font-bold text-lg shadow-lg">1</div>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black text-white truncate w-full text-center tracking-tight mb-1">{ranking[0]?.username}</h3>
                                <p className="text-yellow-500/80 text-lg font-bold mb-4">{ranking[0]?.wins} Wins</p>
                                <div className="px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-sm text-yellow-500 font-black uppercase tracking-widest shadow-[0_0_15px_rgba(234,179,8,0.2)]">Dominator</div>
                            </div>
                        </motion.div>

                        {/* 3rd Place */}
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="order-3 md:order-3 flex-1 max-w-[280px] w-full"
                        >
                            <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-3xl p-6 flex flex-col items-center shadow-2xl relative overflow-hidden group hover:bg-black/50 transition-colors">
                                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                <div className="w-20 h-20 rounded-full border-2 border-amber-700 shadow-[0_0_15px_rgba(180,83,9,0.3)] mb-4 relative">
                                    {ranking[2]?.avatar ? (
                                        <Image src={ranking[2].avatar} alt={ranking[2].username} fill className="object-cover rounded-full" />
                                    ) : (
                                        <div className="w-full h-full bg-neutral-800 rounded-full flex items-center justify-center font-bold text-neutral-500">{ranking[2]?.username?.charAt(0)}</div>
                                    )}
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-950 rounded-full border border-amber-800 flex items-center justify-center text-amber-700 font-bold text-sm shadow-lg">3</div>
                                </div>
                                <h3 className="text-white font-bold text-lg truncate w-full text-center">{ranking[2]?.username}</h3>
                                <p className="text-amber-700 text-sm font-medium mb-3">{ranking[2]?.wins} Wins</p>
                                <div className="px-3 py-1 bg-amber-900/20 border border-amber-900/30 rounded-full text-xs text-amber-700 font-bold uppercase tracking-wider">Bronze Tier</div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* List View - Refined Glass Table */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-black/20 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 text-neutral-400 text-xs uppercase tracking-wider font-bold">
                                    <th className="p-6">Rank</th>
                                    <th className="p-6">Player</th>
                                    <th className="p-6 text-center">Tier</th>
                                    <th className="p-6 text-right">Win Rate</th>
                                    <th className="p-6 text-right">Wins</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {ranking.map((player, index) => {
                                    const tier = getTier(player.wins);
                                    const TierIcon = tier.icon;

                                    return (
                                        <tr
                                            key={player.player_id}
                                            className={`group transition-all duration-200 hover:bg-white/[0.03] ${player.player_id === user?.id ? 'bg-white/[0.05]' : ''}`}
                                        >
                                            <td className="p-6">
                                                <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-mono text-sm font-bold transition-all
                                                    ${index < 3 ? 'bg-white text-black' : 'bg-white/5 text-neutral-400 group-hover:text-white'}
                                                `}>
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden relative border border-white/10 group-hover:border-white/30 transition-colors">
                                                        {player.avatar ? (
                                                            <Image src={player.avatar} alt={player.username} fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-neutral-600">{player.username?.charAt(0)}</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white flex items-center gap-2 group-hover:text-neutral-200 transition-colors">
                                                            {player.username || "Anonymous"}
                                                            {player.player_id === user?.id && (
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-white text-black font-bold uppercase tracking-wide">You</span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-neutral-500 font-mono">
                                                            {player.total_games} games
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/5 bg-white/[0.02] ${tier.color} bg-opacity-10 shadow-sm`}>
                                                    <TierIcon size={12} />
                                                    <span className={`text-[10px] font-bold uppercase tracking-wide ${tier.color.replace('text-', 'text-opacity-90-')}`}>{tier.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-neutral-300 font-mono font-bold text-sm">{getWinRate(player)}%</span>
                                                </div>
                                            </td>
                                            <td className="p-6 text-right">
                                                <span className="text-xl font-black text-white tabular-nums tracking-tight group-hover:scale-110 inline-block transition-transform duration-200">
                                                    {player.wins}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Fixed User Stats Footer - Sleek Glass Floating Bar */}
                {currentUserRank && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        transition={{ delay: 1, type: "spring", stiffness: 200, damping: 20 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-black/60 border border-white/10 p-4 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center gap-8 backdrop-blur-xl z-50 min-w-[320px] justify-between px-8"
                    >
                        <div className="flex flex-col items-start">
                            <p className="text-neutral-500 text-[10px] uppercase tracking-widest font-bold">Your Rank</p>
                            <p className="text-2xl font-black text-white leading-none mt-1">#{currentUserRank}</p>
                        </div>
                        <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                        <div className="flex flex-col items-end">
                            <p className="text-neutral-500 text-[10px] uppercase tracking-widest font-bold">Total Players</p>
                            <p className="text-xl font-bold text-neutral-300 leading-none mt-1">{ranking.length}</p>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

// Helper component for icon
function UserIcon({ className }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
    )
}