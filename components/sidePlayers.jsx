import { motion } from 'framer-motion';
import { FaSkull, FaCheckCircle, FaTimesCircle, FaCrown } from 'react-icons/fa';

// ✅ UPDATED: Added `currentPlayerId` and `hostId` as props
export default function SidePlayers({ players, currentPlayerId, hostId }){

   // ✅ NEW: Sort players to show alive ones first, then sort alphabetically
   const sortedPlayers = [...players].sort((a, b) => {
       if (a.is_alive && !b.is_alive) return -1;
       if (!a.is_alive && b.is_alive) return 1;
       return a.name.localeCompare(b.name);
   });

   return(
       <motion.section 
           initial={{ x: -300, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
           transition={{ duration: 0.5 }}
           className="w-full h-full flex flex-col bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/50 shadow-2xl rounded-xl overflow-hidden"
       >
           <div className="p-4 sm:p-6 border-b border-slate-700/50 flex-shrink-0">
               <h2 className="text-xl sm:text-2xl font-bold text-slate-200 flex items-center gap-3">
                   <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
                       {/* <FaUsers className="text-white text-sm" /> */}
                   </div>
                   <span>Players ({players.filter(p => p.is_alive).length}/{players.length})</span>
               </h2>
           </div>
           
           <div className="flex-grow p-2 sm:p-4 space-y-3 overflow-y-auto custom-scrollbar">
               {/* Use the new sorted array for mapping */}
               {sortedPlayers.map((player, index) => {
                   const isCurrent = player.player_id === currentPlayerId;
                   const isHost = player.player_id === hostId;

                   return (
                       <motion.div
                           key={player.id}
                           layout
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: index * 0.05 }}
                           // ✅ UPDATED: Add a special border for the current player
                           className={`relative p-3 sm:p-4 w-full rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                               isCurrent
                                   ? 'border-yellow-400 bg-yellow-900/20'
                                   : player.is_alive 
                                       ? 'bg-slate-700/50 border-slate-600/50 hover:border-slate-500/50' 
                                       : 'bg-red-900/20 border-red-800/30 opacity-70'
                           }`}
                       >
                           {!player.is_alive && (
                               <div className="absolute top-2 right-2">
                                   <FaSkull className="text-red-400 text-lg" />
                               </div>
                           )}
                           
                           {isCurrent && (
                               <div className="absolute top-2 left-2 p-1 bg-yellow-400/80 rounded-full" title="This is you">
                                   <FaUser className="text-yellow-900 text-xs" />
                               </div>
                           )}

                           <div className="flex items-center gap-3">
                               <div className="relative flex-shrink-0">
                                   <img 
                                       src={player.profile} 
                                       alt={player.name} 
                                       width={48} 
                                       height={48} 
                                       loading="lazy" 
                                       className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 transition-all ${
                                           player.is_alive 
                                               ? isCurrent ? 'border-yellow-500' : 'border-slate-500' 
                                               : 'border-red-500/50 grayscale'
                                       }`} 
                                   />
                                   <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-800 ${
                                       player.is_alive ? 'bg-green-500' : 'bg-red-500'
                                   }`}></div>
                               </div>
                               
                               <div className="flex-1 min-w-0">
                                   <div className="flex items-center gap-2">
                                       {/* ✅ NEW: Show crown icon for the host */}
                                       {isHost && <FaCrown className="text-yellow-400" title="Room Host" />}
                                       <h3 className={`font-bold text-base sm:text-lg truncate ${
                                           player.is_alive ? 'text-slate-200' : 'text-slate-400'
                                       }`}>
                                           {player.name}
                                       </h3>
                                   </div>
                                   
                                   <div className="mt-2">
                                       <div className="flex items-center w-full justify-between">
                                           <div className="flex items-center gap-2">
                                               <span className="text-slate-400 text-xs sm:text-sm">Action:</span>
                                               {player.is_action_done ? (
                                                   <div className="flex items-center gap-1 text-green-400">
                                                       <FaCheckCircle className="text-xs" />
                                                       <span className="text-xs font-medium">Done</span>
                                                   </div>
                                               ) : (
                                                   <div className="flex items-center gap-1 text-amber-400">
                                                       <FaTimesCircle className="text-xs" />
                                                       <span className="text-xs font-medium">Pending</span>
                                                   </div>
                                               )}
                                           </div>
                                       </div>
                                   </div>
                               </div>
                           </div>
                       </motion.div>
                   )
               })}
           </div>
           
           <style jsx>{`
               .custom-scrollbar::-webkit-scrollbar {
                   width: 6px;
               }
               .custom-scrollbar::-webkit-scrollbar-track {
                   background: rgba(51, 65, 85, 0.3);
               }
               .custom-scrollbar::-webkit-scrollbar-thumb {
                   background: rgba(148, 163, 184, 0.5);
                   border-radius: 3px;
               }
               .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                   background: rgba(148, 163, 184, 0.7);
               }
           `}</style>
       </motion.section>
   )
}