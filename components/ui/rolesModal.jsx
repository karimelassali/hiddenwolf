import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import {
  GiWolfHowl,
  GiHeartShield,
  GiDeathSkull,
  GiTiedScroll,
} from "react-icons/gi";
export default function RoleRevealModal({ role, onClose }){
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
  >
    <motion.div
      initial={{ scale: 0.8, y: 50 }}
      animate={{ scale: 1, y: 0 }}
      className="relative bg-gradient-to-br from-slate-800 to-slate-900 p-6 lg:p-8 rounded-2xl shadow-2xl border border-slate-700 text-center max-w-sm w-full mx-4"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1"
      >
        <FaTimes size={20} />
      </button>

      <div className="mb-4">
        {role === "wolf" && (
          <GiWolfHowl className="text-red-400 text-7xl mx-auto" />
        )}
        {role === "seer" && (
          <div className="text-blue-400 text-7xl mx-auto">👁️</div>
        )}
        {role === "doctor" && (
          <GiHeartShield className="text-green-400 text-7xl mx-auto" />
        )}
        {role === "villager" && (
          <div className="text-yellow-400 text-7xl mx-auto">👨‍🌾</div>
        )}
      </div>

      <h2 className="text-lg font-semibold text-slate-400 mb-1">
        You are the...
      </h2>
      <h1 className="text-3xl lg:text-4xl font-bold text-purple-400 capitalize mb-4">
        {role}
      </h1>

      <p className="text-slate-300 text-sm lg:text-base mb-6 leading-relaxed">
        {role === "wolf" &&
          "Your goal is to eliminate all the villagers without being caught."}
        {role === "seer" &&
          "Each night, you can discover one player's true identity."}
        {role === "doctor" &&
          "Each night, you can choose one person to save from the wolf."}
        {role === "villager" &&
          "Your goal is to find and eliminate the wolf among you."}
      </p>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClose}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors"
      >
        Got it!
      </motion.button>
    </motion.div>
  </motion.div>
};