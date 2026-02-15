import React, { useState } from 'react';
import PlayerActions from "@/components/blocks/player-actions";
import { FaUsers, FaGamepad, FaComments, FaSkull, FaVoteYea, FaHeart, FaEye, FaVolumeUp } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function GameActionsBar({ roomInfo, playerInfo, players, mobileView, setMobileView }) {
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);

    // Determine the primary action for the current player/phase
    const getPrimaryAction = () => {
        if (!playerInfo?.is_alive || playerInfo?.is_action_done) return null;

        const { role } = playerInfo;
        const { stage } = roomInfo;

        if (stage === 'day') return { type: 'vote', label: 'VOTE', icon: <FaVoteYea />, color: 'bg-orange-600' };

        if (stage === 'night') {
            if (role === 'wolf') return { type: 'kill', label: 'HUNT', icon: <FaSkull />, color: 'bg-red-600' };
            if (role === 'doctor') return { type: 'save', label: 'PROTECT', icon: <FaHeart />, color: 'bg-green-600' };
            if (role === 'seer') return { type: 'see', label: 'DIVINE', icon: <FaEye />, color: 'bg-purple-600' };
        }
        return null;
    };

    const action = getPrimaryAction();

    const MobileNavButton = ({ viewName, icon, label }) => {
        const isActive = mobileView === viewName;
        return (
            <button
                onClick={() => setMobileView(viewName)}
                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-2xl w-20 h-16 transition-all duration-300 ${isActive ? 'bg-purple-800/50 text-white shadow-lg shadow-purple-500/20' : 'text-purple-300 hover:bg-purple-900/30'
                    }`}
            >
                <motion.div whileTap={{ scale: 0.9 }}>{icon}</motion.div>
                <span className={`text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
            </button>
        );
    };

    return (
        <>
            {/* --- FLOATING ACTION BUTTON (FAB) --- */}
            <AnimatePresence>
                {action && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30"
                    >
                        <motion.button
                            whileHover={{ scale: 1.1, translateY: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsActionModalOpen(true)}
                            className={`flex items-center gap-3 px-8 py-4 ${action.color} text-white rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] border-2 border-white/20 backdrop-blur-md font-black tracking-widest text-lg group overflow-hidden relative`}
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {action.icon} {action.label}
                            </span>

                            {/* Pulse Effect */}
                            <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse z-0" />

                            {/* Shine Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shine" />
                        </motion.button>

                        {/* Status Text Bubble */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }}
                            className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-3 py-1 rounded-full whitespace-nowrap border border-white/10"
                        >
                            It's your turn!
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- BOTTOM NAVIGATION BAR --- */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-20">
                <nav className="flex items-center justify-between px-2 bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-2">
                    <MobileNavButton viewName="players" icon={<FaUsers size={20} />} label="PLAYERS" />
                    <MobileNavButton viewName="game" icon={<FaGamepad size={20} />} label="GAME" />
                    <MobileNavButton viewName="chat" icon={<FaComments size={20} />} label="CHAT" />
                </nav>
            </div>

            {/* --- ACTION MODAL (Reusing PlayerActions logic inside a clean modal) --- */}
            <AnimatePresence>
                {isActionModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setIsActionModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 50, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 50, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-950 rounded-3xl border border-gray-700 shadow-2xl relative"
                        >
                            <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur border-b border-gray-800 p-4 text-center">
                                <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                                    {action?.icon}
                                    <span className="tracking-wider">{action?.label} PHASE</span>
                                </h2>
                                <p className="text-gray-400 text-sm mt-1">Select a target to perform your action.</p>
                            </div>

                            <div className="p-4">
                                {/* We reuse PlayerActions but pass a prop to force it efficiently or handle logic? 
                                    Actually, PlayerActions has its own 'Drawer' logic. 
                                    We need to bypass that Drawer if we want to use THIS modal.
                                    OR, simpler: We just instantiate PlayerActions here, but we need to trick it 
                                    to NOT require a trigger button, but just show the list.
                                    
                                    Current PlayerActions logic: 
                                    - Renders trigger buttons. 
                                    - Renders Drawer.
                                    
                                    FIX: We should modify PlayerActions to accept 'isOpen' and 'defaultAction' mode 
                                    or extract the list logic.
                                    
                                    For now, let's render PlayerActions and see if we can STYLE it to be invisible
                                    triggers but auto-open the drawer? 
                                    
                                    Better approach: We'll wrap PlayerActions here, but we might need to Edit PlayerActions
                                    to support "Embedded Mode".
                                    
                                    Let's Update PlayerActions NEXT to support an 'embedded' prop that skips the 
                                    Trigger buttons and just renders the 'DrawerContent' inside a div.
                                */}
                                <PlayerActions
                                    currentPlayer={playerInfo}
                                    roomInfo={roomInfo}
                                    players={players}
                                    embedded={true} // New Prop we will implement
                                    onActionComplete={() => setIsActionModalOpen(false)}
                                />
                            </div>

                            <button
                                onClick={() => setIsActionModalOpen(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}