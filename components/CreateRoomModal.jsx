import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Clock, Hash, Skull } from 'lucide-react';
import { GiWolfHead } from 'react-icons/gi';

export function CreateRoomModal({ isOpen, onClose, onCreate }) {
    const [maxPlayers, setMaxPlayers] = useState(15);
    const [roundDuration, setRoundDuration] = useState(30);
    const [totalRounds, setTotalRounds] = useState(5);

    if (!isOpen) return null;

    const handleSubmit = () => {
        onCreate({
            maxPlayers,
            roundDuration,
            totalRounds
        });
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md bg-stone-900 border border-stone-700/50 rounded-lg shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="relative p-6 pb-2 text-center border-b border-stone-800">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-stone-500 hover:text-stone-300 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex justify-center mb-4">
                            <div className="p-3 rounded-full border border-stone-700/50 bg-stone-950 shadow-lg">
                                <GiWolfHead className="w-8 h-8 text-red-800" />
                            </div>
                        </div>

                        <h2 className="text-2xl font-serif font-bold text-stone-200 uppercase tracking-widest">
                            Ritual Settings
                        </h2>
                        <p className="text-stone-500 font-serif italic text-sm mt-1">
                            "Define the rules of the hunt."
                        </p>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6">

                        {/* Max Players */}
                        <div className="space-y-2">
                            <label className="flex items-center justify-between text-sm font-serif text-stone-400 uppercase tracking-wider">
                                <span className="flex items-center gap-2"><Users size={16} /> Max Players</span>
                                <span className="text-stone-200 bg-stone-800 px-2 py-0.5 rounded text-xs">{maxPlayers}</span>
                            </label>
                            <input
                                type="range"
                                min="4"
                                max="30"
                                value={maxPlayers}
                                onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                                className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-red-900 hover:accent-red-700"
                            />
                            <div className="flex justify-between text-[10px] text-stone-600 font-mono">
                                <span>4</span>
                                <span>30</span>
                            </div>
                        </div>

                        {/* Round Duration */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-serif text-stone-400 uppercase tracking-wider">
                                <Clock size={16} /> Round Duration
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {[30, 60, 90, 120].map((duration) => (
                                    <button
                                        key={duration}
                                        onClick={() => setRoundDuration(duration)}
                                        className={`
                      py-2 px-1 text-xs font-mono border rounded transition-all duration-300
                      ${roundDuration === duration
                                                ? 'bg-red-900/20 border-red-900/50 text-red-100 shadow-[0_0_10px_rgba(127,29,29,0.2)]'
                                                : 'bg-stone-950 border-stone-800 text-stone-500 hover:border-stone-600 hover:text-stone-300'}
                    `}
                                    >
                                        {duration}s
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Total Rounds */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-serif text-stone-400 uppercase tracking-wider">
                                <Hash size={16} /> Total Rounds
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {[3, 5, 7, 10].map((rounds) => (
                                    <button
                                        key={rounds}
                                        onClick={() => setTotalRounds(rounds)}
                                        className={`
                      py-2 px-1 text-xs font-mono border rounded transition-all duration-300
                      ${totalRounds === rounds
                                                ? 'bg-amber-900/20 border-amber-900/50 text-amber-100 shadow-[0_0_10px_rgba(180,83,9,0.2)]'
                                                : 'bg-stone-950 border-stone-800 text-stone-500 hover:border-stone-600 hover:text-stone-300'}
                    `}
                                    >
                                        {rounds}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Footer */}
                    <div className="p-6 pt-2 grid grid-cols-2 gap-4">
                        <button
                            onClick={onClose}
                            className="py-3 px-4 bg-transparent hover:bg-stone-800 text-stone-500 border border-stone-800 hover:text-stone-300 font-serif uppercase tracking-wider rounded transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="py-3 px-4 bg-stone-800 hover:bg-red-950 text-stone-300 hover:text-red-100 border border-stone-700/50 font-serif uppercase tracking-wider rounded transition-all shadow-lg text-sm flex items-center justify-center gap-2 group"
                        >
                            <Skull className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                            Create Ritual
                        </button>
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    );
}
