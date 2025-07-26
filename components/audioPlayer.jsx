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

    audio.addEventListener("loadeddata", setAudioData);
    audio.addEventListener("timeupdate", setAudioTime);

    return () => {
      audio.removeEventListener("loadeddata", setAudioData);
      audio.removeEventListener("timeupdate", setAudioTime);
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
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-900/30 via-blue-900/40 to-cyan-900/30 backdrop-blur-sm">
      <audio ref={audioRef} src={src} />

      {/* Sound Wave Animation */}
      <div className="flex items-center gap-1 mb-4">
          {isPlaying && [...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-gradient-to-t from-cyan-400 to-purple-400 rounded-full"
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
        </div>

      {/* Track Info */}
      <div className="text-center mb-4">
        <h3 className="text-white font-semibold text-sm mb-1 truncate max-w-32">
          {itemName}
        </h3>
        <div className="text-xs text-gray-300">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Progress Bar */}
      <div
        className="w-full h-2 bg-gray-700/50 rounded-full mb-4 cursor-pointer relative overflow-hidden"
        onClick={handleSeek}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full relative"
          style={{ width: `${(currentTime / duration) * 100}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${(currentTime / duration) * 100}%` }}
        >
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-3">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={togglePlayPause}
          className="p-3 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 transition-all duration-300 shadow-lg"
        >
          {isPlaying ? (
            <Pause className="text-white" size={16} />
          ) : (
            <Play className="text-white ml-0.5" size={16} />
          )}
        </motion.button>
      </div>
    </div>
  );
}
