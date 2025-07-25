import { motion } from 'framer-motion';
import { FaSkull, FaCheckCircle, FaTimesCircle, FaCrown } from 'react-icons/fa';

export default function SidePlayers({players}){
   return(
       <motion.section 
           initial={{ x: -300, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
           transition={{ duration: 0.5 }}
           className="w-80 bg-gradient-to-b  from-slate-800 to-slate-900 border-r border-slate-700/50 shadow-2xl"
       >
           <div className="p-6 border-b border-slate-700/50">
               <h2 className="text-2xl font-bold text-slate-200 flex items-center gap-3">
                   <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                       <FaCrown className="text-white text-sm" />
                   </div>
                   Players ({players.length})
               </h2>
           </div>
           
           <div className="p-4 space-y-3 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
               {players.map((player, index) => (
                   <motion.div
                       key={player.id}
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: index * 0.1 }}
                       className={`relative p-4 w-full rounded-xl border transition-all duration-300 hover:shadow-lg ${
                           player.is_alive 
                               ? 'bg-gradient-to-r from-slate-700/50 to-slate-800/50 border-slate-600/50 hover:border-slate-500/50' 
                               : 'bg-gradient-to-r from-red-900/20 to-red-800/20 border-red-800/30 opacity-75'
                       }`}
                   >
                       {!player.is_alive && (
                           <div className="absolute top-2 right-2">
                               <FaSkull className="text-red-400 text-lg" />
                           </div>
                       )}
                       
                       <div className="flex items-start gap-3">
                           <div className="relative">
                               <img 
                                   src={player.profile} 
                                   alt={player.name} 
                                   width={48} 
                                   height={48} 
                                   loading="lazy" 
                                   className={`rounded-full border-2 transition-all ${
                                       player.is_alive 
                                           ? 'border-slate-500' 
                                           : 'border-red-500/50 grayscale'
                                   }`} 
                               />
                               <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-800 ${
                                   player.is_alive ? 'bg-green-500' : 'bg-red-500'
                               }`}></div>
                           </div>
                           
                           <div className="flex-1 min-w-0">
                               <h3 className={`font-bold text-lg truncate ${
                                   player.is_alive ? 'text-slate-200' : 'text-slate-400'
                               }`}>
                                   {player.name}
                               </h3>
                               
                               <div className="space-y-2 mt-2">
                                   <div className="flex items-center gap-2">
                                       <span className="text-slate-400 text-sm">Role:</span>
                                       <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                           player.role === 'wolf' 
                                               ? 'bg-red-600/20 text-red-400 border border-red-600/30'
                                               : player.role === 'Doctor'
                                               ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                                               : player.role === 'Detective'
                                               ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                                               : 'bg-slate-600/20 text-slate-400 border border-slate-600/30'
                                       }`}>
                                           {player.role}
                                       </span>
                                   </div>
                                   
                                   <div className="flex items-center w-full justify-between">
                                       
                                       
                                       <div className="flex items-center gap-2">
                                           <span className="text-slate-400 text-sm">Action:</span>
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
               ))}
           </div>
           
           <style jsx>{`
               .custom-scrollbar::-webkit-scrollbar {
                   width: 6px;
               }
               .custom-scrollbar::-webkit-scrollbar-track {
                   background: rgba(51, 65, 85, 0.3);
                   border-radius: 3px;
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