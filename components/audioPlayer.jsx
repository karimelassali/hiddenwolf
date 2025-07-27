import {
  ShoppingCart,
  Star,
  Gamepad2,
  Volume2,
  Zap,
  Search,
  Filter,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume1,
} from "lucide-react";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

export function CustomAudioPlayer({ src, itemName }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const setAudioTime = () => setCurrentTime(audio.currentTime);

    const handleAudioEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadeddata", setAudioData);
    audio.addEventListener("timeupdate", setAudioTime);
    audio.addEventListener("ended", handleAudioEnded);

    return () => {
      audio.removeEventListener("loadeddata", setAudioData);
      audio.removeEventListener("timeupdate", setAudioTime);
      audio.removeEventListener("ended", handleAudioEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * duration;
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900/40 via-slate-900/50 to-black/60 backdrop-blur-sm">
      <audio ref={audioRef} src={src} />

      {/* Sound Wave Animation */}
      <div className="flex items-center gap-1 mb-4">
        {isPlaying && [...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="w-1 bg-gradient-to-t from-gray-500 to-slate-400 rounded-full"
            animate={{
              height: isPlaying ? [8, 24, 12, 32, 16, 20] : 8,
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut"
            }}
          />
        ))}
        {!isPlaying && [...Array(12)].map((_, i) => (
          <div
            key={i}
            className="w-1 h-2 bg-gray-600/50 rounded-full"
          />
        ))}
      </div>

      {/* Track Info */}
      <div className="text-center mb-4">
        <h3 className="text-gray-200 font-semibold text-sm mb-1 truncate max-w-32">
          {itemName}
        </h3>
        <div className="text-xs text-gray-400">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Progress Bar */}
      <div
        className="w-full h-2 bg-gray-800/60 rounded-full mb-4 cursor-pointer relative overflow-hidden border border-gray-700/30"
        onClick={handleSeek}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-gray-600 to-slate-500 rounded-full relative"
          style={{ width: `${(currentTime / duration) * 100}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${(currentTime / duration) * 100}%` }}
        >
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-gray-300 rounded-full shadow-lg border border-gray-600" />
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-3">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={togglePlayPause}
          className="p-3 rounded-full bg-gradient-to-r from-gray-700 to-slate-800 hover:from-gray-600 hover:to-slate-700 transition-all duration-300 shadow-lg border border-gray-600/50"
        >
          {isPlaying ? (
            <Pause className="text-gray-200" size={16} />
          ) : (
            <Play className="text-gray-200 ml-0.5" size={16} />
          )}
        </motion.button>
      </div>
    </div>
  );
}