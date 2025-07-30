import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { FaSkull, FaCheckCircle, FaTimesCircle, FaCrown } from 'react-icons/fa';
import { FaUsers } from 'react-icons/fa';
// ✅ UPDATED: Added `currentPlayerId` and `hostId` as props
export default function SidePlayers({ players, currentPlayerId, hostId }){

    const endPageRef = useRef(null);

   // ✅ NEW: Sort players to show alive ones first, then sort alphabetically
   const sortedPlayers = [...players].sort((a, b) => {
       if (a.is_alive && !b.is_alive) return -1;
       if (!a.is_alive && b.is_alive) return 1;
       return a.name.localeCompare(b.name);
   });

   useEffect(()=>{
    endPageRef.current?.scrollIntoView({ behavior: 'smooth' });

   },[])
   return (
    <motion.section 
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full h-full flex flex-col bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/50 shadow-2xl rounded-none lg:rounded-xl overflow-hidden"
    >
        {/* Header */}
        <div className="p-3 sm:p-4 lg:p-6 border-b border-slate-700/50 flex-shrink-0">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-200 flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FaUsers className="text-white text-xs sm:text-sm" />
                </div>
                <span className="truncate">Players ({players.filter(p => p.is_alive).length}/{players.length})</span>
            </h2>
        </div>
        
        {/* Players List */}
        <div className="flex-1 p-2 sm:p-3 lg:p-4 space-y-2 sm:space-y-3 overflow-y-auto custom-scrollbar min-h-0">
            {/* Empty state */}
            {sortedPlayers.length === 0 && (
                <div className="flex items-center justify-center h-32 text-slate-400">
                    <div className="text-center">
                        <FaUsers className="text-2xl mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No players yet</p>
                    </div>
                </div>
            )}

            {/* Players mapping */}
            {sortedPlayers.map((player, index) => {
                const isCurrent = player.player_id === currentPlayerId;
                const isHost = player.player_id === hostId;

                return (
                    <motion.div
                        key={player.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        className={`relative p-2 sm:p-3 lg:p-4 w-full rounded-lg sm:rounded-xl border-2 transition-all duration-300 hover:shadow-lg group ${
                            isCurrent
                                ? 'border-yellow-400 bg-gradient-to-r from-yellow-900/30 to-yellow-800/20 shadow-yellow-400/20'
                                : player.is_alive 
                                    ? 'bg-slate-700/30 border-slate-600/40 hover:border-slate-500/60 hover:bg-slate-700/50' 
                                    : 'bg-red-900/15 border-red-800/25 opacity-75 hover:opacity-90'
                        }`}
                    >
                        {/* Death indicator */}
                        {!player.is_alive && (
                            <div className="absolute top-1 sm:top-2 right-1 sm:right-2 z-10">
                                <div className="p-1 bg-red-500/20 rounded-full">
                                    <FaSkull className="text-red-400 text-sm sm:text-base" />
                                </div>
                            </div>
                        )}
                        
                        {/* Current player indicator */}
                        {isCurrent && (
                            <div className="absolute top-1 sm:top-2 left-1 sm:left-2 z-10">
                                <div className="p-1 bg-yellow-400/90 rounded-full shadow-lg" title="This is you">
                                    <FaUser className="text-yellow-900 text-xs sm:text-sm" />
                                </div>
                            </div>
                        )}

                        {/* Main content */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                                <img 
                                    src={player.profile} 
                                    alt={player.name} 
                                    width={48} 
                                    height={48} 
                                    loading="lazy" 
                                    className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full border-2 object-cover transition-all duration-300 ${
                                        player.is_alive 
                                            ? isCurrent 
                                                ? 'border-yellow-400 shadow-lg shadow-yellow-400/30' 
                                                : 'border-slate-400 group-hover:border-slate-300' 
                                            : 'border-red-500/50 grayscale'
                                    }`} 
                                />
                                {/* Status indicator */}
                                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-slate-800 transition-colors ${
                                    player.is_alive ? 'bg-green-500' : 'bg-red-500'
                                }`}></div>
                            </div>
                            
                            {/* Player info */}
                            <div className="flex-1 min-w-0">
                                {/* Name and host indicator */}
                                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                                    {isHost && (
                                        <FaCrown className="text-yellow-400 text-xs sm:text-sm flex-shrink-0" title="Room Host" />
                                    )}
                                    <h3 className={`font-semibold text-sm sm:text-base lg:text-lg truncate transition-colors ${
                                        player.is_alive 
                                            ? isCurrent ? 'text-yellow-100' : 'text-slate-200' 
                                            : 'text-slate-400'
                                    }`}>
                                        {player.name}
                                    </h3>
                                </div>
                                
                                {/* Action status */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <span className="text-slate-400 text-xs">Action:</span>
                                        {player.is_alive ? (
                                            player.is_action_done ? (
                                                <div className="flex items-center gap-1 text-green-400">
                                                    <FaCheckCircle className="text-xs flex-shrink-0" />
                                                    <span className="text-xs font-medium">Done</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-amber-400">
                                                    <FaTimesCircle className="text-xs flex-shrink-0" />
                                                    <span className="text-xs font-medium">Pending</span>
                                                </div>
                                            )
                                        ) : (
                                            <div className="flex items-center gap-1 text-slate-500">
                                                <FaSkull className="text-xs flex-shrink-0" />
                                                <span className="text-xs font-medium">Dead</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Connection status (optional) */}
                                    {player.is_human && (
                                        <div className={`w-2 h-2 rounded-full ${
                                            player.is_online ? 'bg-green-400' : 'bg-slate-500'
                                        }`} title={player.is_online ? 'Online' : 'Offline'} />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Hover effects */}
                        <div ref={endPageRef} className="absolute inset-0 rounded-lg sm:rounded-xl border border-transparent group-hover:border-slate-500/20 transition-colors pointer-events-none" />
                    </motion.div>
                );
            })}
        </div>
        
        {/* Enhanced custom scrollbar styles */}
        <style jsx>{`
            .custom-scrollbar {
                scrollbar-width: thin;
                scrollbar-color: rgba(148, 163, 184, 0.5) rgba(51, 65, 85, 0.3);
            }
            
            .custom-scrollbar::-webkit-scrollbar {
                width: 4px;
            }
            
            .custom-scrollbar::-webkit-scrollbar-track {
                background: rgba(51, 65, 85, 0.2);
                border-radius: 2px;
            }
            
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(148, 163, 184, 0.4);
                border-radius: 2px;
                transition: background 0.2s ease;
            }
            
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(148, 163, 184, 0.6);
            }
            
            @media (max-width: 640px) {
                .custom-scrollbar::-webkit-scrollbar {
                    width: 3px;
                }
            }
        `}</style>
    </motion.section>
);
}