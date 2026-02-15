import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GiWolfHowl, GiCrownedSkull, GiHourglass } from "react-icons/gi";
import { FaUsers } from "react-icons/fa";
import { AnimatedTooltipPeople } from "@/components/tooltip";

export default function RoleAssignmentView({
    isHost,
    players,
    onAssignRoles,
}) {
    const [isAssigning, setIsAssigning] = useState(false);
    const [suspenseText, setSuspenseText] = useState("");

    const suspenseMessages = [
        "Shuffling Fates...",
        "The Moon is High...",
        "Wolves are Awakening...",
        "Seers are Dreaming...",
        "Doctors are preparing...",
        "Destiny is Set.",
    ];

    const onAssignRolesRef = useRef(onAssignRoles);

    useEffect(() => {
        onAssignRolesRef.current = onAssignRoles;
    }, [onAssignRoles]);

    useEffect(() => {
        if (isAssigning) {
            // DEBUG: Instant assignment
            if (onAssignRolesRef.current) {
                onAssignRolesRef.current();
            }
        }
    }, [isAssigning]);

    const handleStartRitual = () => {
        setIsAssigning(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay pointer-events-none" />

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative z-10 w-full max-w-2xl bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8 flex flex-col items-center text-center shadow-2xl"
            >
                <AnimatePresence mode="wait">
                    {!isAssigning ? (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full flex flex-col items-center"
                        >
                            <div className="mb-6 p-4 rounded-full bg-slate-800/50 border border-slate-700 shadow-lg">
                                <GiCrownedSkull className="text-purple-400 text-5xl" />
                            </div>

                            <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-200 mb-2 tracking-wide">
                                {isHost ? "The Ritual Begins" : "Awaiting the Host"}
                            </h2>
                            <p className="text-slate-400 mb-8 max-w-md mx-auto font-serif italic">
                                {isHost
                                    ? "The players are gathered. It is time to assign their roles and begin the hunt."
                                    : "The host is preparing the ritual. Your fate will be decided soon."}
                            </p>

                            <div className="w-full mb-8 bg-slate-950/50 p-6 rounded-xl border border-slate-800/50">
                                <div className="flex items-center justify-center gap-2 mb-4 text-slate-500 uppercase tracking-widest text-xs font-bold">
                                    <FaUsers size={14} />
                                    <span>Gathered Souls ({players.length})</span>
                                </div>
                                <div className="flex justify-center flex-wrap gap-2">
                                    <AnimatedTooltipPeople people={players} />
                                </div>
                            </div>

                            {isHost ? (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleStartRitual}
                                    className="group relative px-8 py-4 bg-gradient-to-r from-purple-900 to-indigo-900 hover:from-purple-800 hover:to-indigo-800 rounded-lg shadow-lg shadow-purple-900/20 transition-all duration-300 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
                                    <span className="relative z-10 flex items-center gap-3 text-purple-100 font-serif font-bold text-lg tracking-wider uppercase">
                                        <GiWolfHowl className="text-2xl animate-pulse" />
                                        Begin Ritual
                                    </span>
                                </motion.button>
                            ) : (
                                <div className="flex items-center gap-3 text-slate-500 animate-pulse font-serif italic">
                                    <GiHourglass className="animate-spin duration-[3000ms]" />
                                    <span>Waiting for the ritual to start...</span>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="suspense"
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-12"
                        >
                            <div className="mb-8 relative">
                                <div className="absolute inset-0 bg-purple-500 blur-3xl opacity-20 animate-pulse" />
                                <GiWolfHowl className="relative z-10 text-6xl text-slate-200 animate-bounce duration-[2000ms]" />
                            </div>

                            <h3 className="text-2xl md:text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-indigo-200 animate-pulse tracking-widest uppercase">
                                {suspenseText}
                            </h3>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
