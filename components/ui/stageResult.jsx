import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { FaSkull, FaHeart, FaShieldAlt, FaMoon } from "react-icons/fa";

export default function StageResult({ result, players, status }) {
 const deadPlayers = players.filter(p => !p.is_alive);
 const savedPlayer = players.find(p => p.is_saved);
 
 return (
   <motion.div 
     initial={{ opacity: 0 }}
     animate={{ opacity: 1 }}
     exit={{ opacity: 0 }}
     className="fixed w-full h-full bottom-0 left-0 bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex justify-center flex-col items-center gap-8 z-50"
   >
     {/* Atmospheric overlay */}
     <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
     
     {/* Floating particles */}
     <div className="absolute inset-0 overflow-hidden">
       {[...Array(30)].map((_, i) => (
         <motion.div
           key={i}
           initial={{ opacity: 0, y: 100, x: Math.random() * window.innerWidth }}
           animate={{ 
             opacity: [0, 1, 0], 
             y: -100, 
             x: Math.random() * window.innerWidth,
             rotate: Math.random() * 360
           }}
           transition={{ 
             duration: 4, 
             delay: Math.random() * 3, 
             repeat: Infinity,
             repeatDelay: Math.random() * 5
           }}
           className="absolute w-2 h-2 bg-red-400/30 rounded-full"
         />
       ))}
     </div>

     {/* Header Section */}
     <motion.div 
       initial={{ y: -50, opacity: 0 }}
       animate={{ y: 0, opacity: 1 }}
       transition={{ delay: 0.3 }}
       className="text-center relative z-10"
     >
       <div className="flex items-center justify-center gap-4 mb-4">
         <FaMoon className="text-4xl text-slate-300" />
         <h2 className="text-5xl font-bold text-white drop-shadow-lg">
           Night Results
         </h2>
         <FaMoon className="text-4xl text-slate-300" />
       </div>
       
       <motion.div
         initial={{ scale: 0 }}
         animate={{ scale: 1 }}
         transition={{ delay: 0.5, type: "spring" }}
         className="w-16 h-1 bg-red-500 mx-auto rounded-full"
       />
     </motion.div>

     {/* Wolf Image */}
     <motion.div
       initial={{ scale: 0, rotate: -180 }}
       animate={{ scale: 1, rotate: 0 }}
       transition={{ delay: 0.7, type: "spring", damping: 15 }}
       className="relative z-10"
     >
       <div className="relative">
         <div className="absolute inset-0 bg-red-600/30 rounded-full blur-xl scale-110 animate-pulse" />
         <Image
           src={`/assets/images/wolf.png`}
           alt={result}
           width={250}
           height={250}
           className="relative z-10 drop-shadow-2xl"
         />
       </div>
     </motion.div>

     {/* Results Section */}
     <motion.div 
       initial={{ y: 50, opacity: 0 }}
       animate={{ y: 0, opacity: 1 }}
       transition={{ delay: 0.9 }}
       className="text-center relative z-10 max-w-2xl mx-4"
     >
       {/* Death notifications */}
       {deadPlayers.length > 0 && (
         <div className="mb-6">
           <h3 className="text-2xl font-bold text-red-300 mb-4 flex items-center justify-center gap-2">
             <FaSkull className="text-xl" />
             The Darkness Claims Its Victims
             <FaSkull className="text-xl" />
           </h3>
           
           <div className="space-y-3">
             {deadPlayers.map((player, index) => (
               <motion.div
                 key={player.id}
                 initial={{ x: -100, opacity: 0 }}
                 animate={{ x: 0, opacity: 1 }}
                 transition={{ delay: 1.1 + (index * 0.2) }}
                 className="flex items-center justify-center gap-4 bg-black/30 backdrop-blur-md rounded-xl p-4 border border-red-500/30"
               >
                 <div className="relative">
                   <img 
                     src={player.profile || '/default-avatar.png'} 
                     alt={player.name}
                     className="w-12 h-12 rounded-full border-2 border-red-500 grayscale"
                   />
                   <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                     <FaSkull className="text-white text-xs" />
                   </div>
                 </div>
                 <div className="text-left">
                   <p className="text-xl font-bold text-white">{player.name}</p>
                   <p className="text-red-300 text-sm">Eliminated by the {player.dying_method == 'wolf' ? 'wolf' : 'Voting'}</p>
                 </div>
               </motion.div>
             ))}
           </div>
         </div>
       )}

       {/* Saved player notification */}
       <AnimatePresence>
         {savedPlayer && (
           <motion.div
             initial={{ scale: 0, y: 20 }}
             animate={{ scale: 1, y: 0 }}
             exit={{ scale: 0, y: -20 }}
             transition={{ delay: 1.5, type: "spring" }}
             className="bg-gradient-to-r from-emerald-800/80 to-emerald-700/80 backdrop-blur-md rounded-xl p-6 border border-emerald-500/50 shadow-2xl"
           >
             <h3 className="text-2xl font-bold text-emerald-300 mb-4 flex items-center justify-center gap-2">
               <FaShieldAlt className="text-xl" />
               Divine Protection
               <FaHeart className="text-xl text-pink-400" />
             </h3>
             
             <div className="flex items-center justify-center gap-4">
               <div className="relative">
                 <img 
                   src={savedPlayer.profile || '/default-avatar.png'} 
                   alt={savedPlayer.name}
                   className="w-16 h-16 rounded-full border-4 border-emerald-400 shadow-lg shadow-emerald-500/50"
                 />
                 <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                   <FaHeart className="text-white text-sm" />
                 </div>
               </div>
               <div className="text-left">
                 <p className="text-2xl font-bold text-white">{savedPlayer.name}</p>
                 <p className="text-emerald-300">was saved by the Doctor!</p>
               </div>
             </div>
           </motion.div>
         )}
       </AnimatePresence>

       {/* General result message */}
       {!status && (
         <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 1.7 }}
           className="mt-6 bg-black/50 backdrop-blur-md rounded-xl p-4 border border-red-500/30"
         >
           <p className="text-xl text-red-300 font-medium">
             {result || "The wolves prowled through the night..."}
           </p>
         </motion.div>
       )}
     </motion.div>

     {/* Decorative elements */}
     <motion.div
       animate={{ rotate: 360 }}
       transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
       className="absolute top-10 right-10 w-24 h-24 border-4 border-red-500/20 rounded-full"
     />
     <motion.div
       animate={{ rotate: -360 }}
       transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
       className="absolute bottom-10 left-10 w-32 h-32 border-2 border-red-600/10 rounded-full"
     />
   </motion.div>
 );
}