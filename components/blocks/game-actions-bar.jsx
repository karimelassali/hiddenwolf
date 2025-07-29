import PlayerActions from "@/components/blocks/player-actions";
import { FaUsers, FaGamepad, FaComments } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function GameActionsBar({ roomInfo, playerInfo, players, mobileView, setMobileView }) {
    
    const MobileNavButton = ({ viewName, icon, label }) => {
        const isActive = mobileView === viewName;
        return (
            <button
                onClick={() => setMobileView(viewName)}
                className={`flex flex-col items-center justify-center gap-1 transition-all p-2 rounded-lg w-20 h-full ${
                    isActive ? 'text-white scale-110' : 'text-purple-300'
                }`}
            >
                {icon}
                <span className="text-xs font-bold">{label}</span>
            </button>
        );
    };

    // This logic determines if the action buttons should be visible
    const shouldShowActions = playerInfo && playerInfo.is_alive && !playerInfo.is_action_done;

    return (
        // The main container is now relative to position the floating action button
        <div className="relative z-20">

            {/* ✅ NEW: Floating Action Button Container */}
            {/* This appears ONLY on mobile and ONLY when the player has an action */}
            <AnimatePresence>
                {shouldShowActions && (
                    <motion.div
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 lg:hidden"
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    >
                        <PlayerActions 
                            currentPlayer={playerInfo} 
                            roomInfo={roomInfo} 
                            players={players} 
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Footer Bar */}
            <footer className="flex w-full bottom-0 items-center justify-center bg-purple-900/90 backdrop-blur-sm border-t border-purple-700/50 h-16">
                
                {/* --- DESKTOP VIEW --- */}
                {/* On desktop, actions are always centered in the bar */}
                <div className="hidden lg:flex">
                    <PlayerActions 
                        currentPlayer={playerInfo} 
                        roomInfo={roomInfo} 
                        players={players} 
                    />
                </div>

                {/* --- MOBILE VIEW --- */}
                {/* On mobile, we ALWAYS show the 3 navigation buttons for clarity */}
                <div className="flex lg:hidden items-center justify-between w-full h-full">
                    <MobileNavButton viewName="players" icon={<FaUsers size={20} />} label="Players" />
                    <MobileNavButton viewName="game" icon={<FaGamepad size={20} />} label="Game" />
                    <MobileNavButton viewName="chat" icon={<FaComments size={20} />} label="Chat" />
                </div>
            </footer>
        </div>
    );
}