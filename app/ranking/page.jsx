'use client'
import { supabase } from '@/lib/supabase'
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Trophy, Crown, Medal, Star, TrendingUp, Users, Target, Award } from 'lucide-react';

export default function Page() {
    const { user, isLoaded } = useUser();
    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUserRank, setCurrentUserRank] = useState(null);

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

    const getRankIcon = (index) => {
        switch (index) {
            case 0:
                return <Crown className="text-yellow-400" size={24} />;
            case 1:
                return <Medal className="text-gray-400" size={24} />;
            case 2:
                return <Award className="text-amber-600" size={24} />;
            default:
                return <span className="text-slate-400 font-bold text-lg">#{index + 1}</span>;
        }
    };

    const getRankStyle = (index) => {
        switch (index) {
            case 0:
                return "bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border-yellow-600/30 shadow-yellow-500/20";
            case 1:
                return "bg-gradient-to-r from-gray-800/30 to-slate-800/30 border-gray-600/30 shadow-gray-500/20";
            case 2:
                return "bg-gradient-to-r from-amber-900/30 to-orange-900/30 border-amber-600/30 shadow-amber-500/20";
            default:
                return "bg-slate-900/30 border-slate-700/30";
        }
    };

    const getWinRate = (player) => {
        if (player.total_games === 0) return "0%";
        return ((player.wins / player.total_games) * 100).toFixed(1) + "%";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border-4 border-slate-600 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    return (
        <div
        style={{
            backgroundImage: "url('/assets/images/ranking_bg.webp')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
        }}
        className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden">
            {/* Mysterious floating particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-slate-400/20 rounded-full"
                        initial={{
                            x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000),
                            y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 800),
                        }}
                        animate={{
                            y: [null, Math.random() * (typeof window !== "undefined" ? window.innerHeight : 800)],
                            x: [null, Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000)],
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

            <div className="relative z-10 max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    {/* <div className="flex items-center justify-center gap-3 mb-4">
                        <Trophy className="text-slate-400" size={36} />
                        <h1 className="text-5xl font-bold text-slate-200">Leaderboard</h1>
                        <Trophy className="text-slate-400" size={36} />
                    </div>
                    <p className="text-slate-400 text-lg">
                        Hall of Fame - The Greatest Hunters
                    </p> */}
                    
                   
                </motion.div>

                {/* Top 3 Podium */}
                {ranking.length >= 3 && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="grid grid-cols-3 gap-4 mb-12 max-w-2xl mx-auto"
                    >
                        {/* 2nd Place */}
                        <div className="flex flex-col items-center order-1">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="bg-gradient-to-br from-gray-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-600/30 shadow-2xl text-center"
                            >
                                
                                <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden border-2 border-gray-500">
                                    {ranking[1]?.avatar ? (
                                        <Image
                                            src={ranking[1].avatar}
                                            alt={ranking[1].username || "Player"}
                                            width={64}
                                            height={64}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-300 font-bold">
                                            {ranking[1]?.username?.charAt(0) || "P"}
                                        </div>
                                    )}
                                </div>
                                <Medal className="text-gray-400 mx-auto mb-2" size={20} />
                                <h3 className="text-gray-200 font-semibold truncate">
                                    {ranking[1]?.username || "Anonymous"}
                                </h3>
                                <p className="text-gray-400 text-sm">{ranking[1]?.wins} wins</p>
                            </motion.div>
                            <div className="w-full flex justify-center items-center font-klara  text-2xl h-16 bg-gradient-to-t from-gray-700 to-gray-600 mt-2 rounded-t-lg">2</div>
                        </div>

                        {/* 1st Place */}
                        <div className="flex flex-col items-center order-2">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="bg-gradient-to-br from-yellow-900/50 to-amber-900/50 backdrop-blur-sm rounded-2xl p-6 border border-yellow-600/30 shadow-2xl text-center"
                            >
                                <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden border-2 border-yellow-500">
                                    {ranking[0]?.avatar ? (
                                        <Image
                                            src={ranking[0].avatar}
                                            alt={ranking[0].username || "Player"}
                                            width={80}
                                            height={80}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-yellow-700 flex items-center justify-center text-yellow-200 font-bold text-xl">
                                            {ranking[0]?.username?.charAt(0) || "P"}
                                        </div>
                                    )}
                                </div>
                                <Crown className="text-yellow-400 mx-auto mb-2" size={24} />
                                <h3 className="text-yellow-200 font-bold truncate">
                                    {ranking[0]?.username || "Anonymous"}
                                </h3>
                                <p className="text-yellow-300 text-sm">{ranking[0]?.wins} wins</p>
                            </motion.div>
                            <div className="w-full flex justify-center items-center font-klara  text-2xl h-24 bg-gradient-to-t from-yellow-700 to-yellow-600 mt-2 rounded-t-lg">1</div>
                        </div>

                        {/* 3rd Place */}
                        <div className="flex flex-col items-center order-3">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="bg-gradient-to-br from-amber-900/50 to-orange-900/50 backdrop-blur-sm rounded-2xl p-6 border border-amber-600/30 shadow-2xl text-center"
                            >
                                <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden border-2 border-amber-600">
                                    {ranking[2]?.avatar ? (
                                        <Image
                                            src={ranking[2].avatar}
                                            alt={ranking[2].username || "Player"}
                                            width={64}
                                            height={64}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-amber-700 flex items-center justify-center text-amber-200 font-bold">
                                            {ranking[2]?.username?.charAt(0) || "P"}
                                        </div>
                                    )}
                                </div>
                                <Award className="text-amber-600 mx-auto mb-2" size={20} />
                                <h3 className="text-amber-200 font-semibold truncate">
                                    {ranking[2]?.username || "Anonymous"}
                                </h3>
                                <p className="text-amber-300 text-sm">{ranking[2]?.wins} wins</p>
                            </motion.div>
                            <div className="w-full flex justify-center items-center font-klara  text-2xl h-12 bg-gradient-to-t from-amber-700 to-amber-600 mt-2 rounded-t-lg">3</div>
                        </div>
                    </motion.div>
                )}

                {/* Full Ranking List */}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="bg-slate-900/30 backdrop-blur-xl rounded-3xl border border-slate-700/30 shadow-2xl overflow-hidden"
                >
                    <div className="p-6 border-b border-slate-700/30">
                        <h2 className="text-2xl font-bold text-slate-200">Complete Rankings</h2>
                        <p className="text-slate-400 text-sm">All players ranked by victories</p>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        <AnimatePresence>
                            {ranking.map((player, index) => (
                                <motion.div
                                    key={player.player_id}
                                    initial={{ x: -100, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: index * 0.05, duration: 0.3 }}
                                    className={`flex items-center justify-between p-4 border-b border-slate-800/30 hover:bg-slate-800/20 transition-all duration-300 ${
                                        player.player_id === user?.id 
                                            ? 'bg-gradient-to-r from-blue-900/30 to-slate-900/30 border-blue-700/30' 
                                            : ''
                                    } ${getRankStyle(index)}`}
                                >
                                    {/* Rank & Avatar */}
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center w-10 h-10">
                                            {getRankIcon(index)}
                                        </div>
                                        
                                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-600/50">
                                            {player.avatar ? (
                                                <Image
                                                    src={player.avatar}
                                                    alt={player.username || "Player"}
                                                    width={48}
                                                    height={48}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold">
                                                    {player.username?.charAt(0) || "P"}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <h3 className="text-slate-200 font-semibold">
                                                {player.username || "Anonymous Hunter"}
                                                {player.player_id === user?.id && (
                                                    <span className="ml-2 text-blue-400 text-sm">(You)</span>
                                                )}
                                            </h3>
                                            <p className="text-slate-500 text-sm">
                                                {player.total_games || 0} games played
                                            </p>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-6 text-right">
                                        <div>
                                            <p className="text-slate-200 font-bold text-lg">
                                                {player.wins || 0}
                                            </p>
                                            <p className="text-slate-500 text-xs">Wins</p>
                                        </div>
                                        
                                        <div>
                                            <p className="text-slate-300 font-semibold">
                                                {getWinRate(player)}
                                            </p>
                                            <p className="text-slate-500 text-xs">Win Rate</p>
                                        </div>

                                        {index < 3 && (
                                            <div className="flex items-center">
                                                <Star className="text-yellow-400" size={16} />
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </motion.div>
                

                 {/* Stats Summary */}
                 <div className="flex  bg-slate-800 rounded  p-3 items-center justify-center gap-8 mt-8">
                        <div className="text-center">
                            <div className="flex items-center gap-2 text-slate-300">
                                <Users size={20} />
                                <span className="text-2xl font-bold">{ranking.length}</span>
                            </div>
                            <p className="text-slate-500 text-sm">Total Players</p>
                        </div>
                        {currentUserRank && (
                            <div className="text-center">
                                <div className="flex items-center gap-2 text-slate-300">
                                    <TrendingUp size={20} />
                                    <span className="text-2xl font-bold">#{currentUserRank}</span>
                                </div>
                                <p className="text-slate-500 text-sm">Your Rank</p>
                            </div>
                        )}
                    </div>
            </div>
        </div>
    );
}