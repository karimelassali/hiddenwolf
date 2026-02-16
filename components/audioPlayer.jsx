import {
  Play,
  Pause,
} from "lucide-react";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

export function CustomAudioPlayer({ src, itemName, minimal = false }) {
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

  const togglePlayPause = (e) => {
    e?.stopPropagation();
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    e.stopPropagation();
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

  if (minimal) {
    return (
      <div className="w-full flex items-center justify-between gap-3 bg-black/40 border border-white/5 rounded-full p-2 pr-4 backdrop-blur-md">
        <audio ref={audioRef} src={src} />

        <button
          onClick={togglePlayPause}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-black hover:bg-neutral-200 transition-colors shrink-0"
        >
          {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
        </button>

        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden cursor-pointer" onClick={handleSeek}>
          <div
            className="h-full bg-white rounded-full relative"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>

        <div className="text-[10px] font-mono text-neutral-400 tabular-nums shrink-0">
          {formatTime(currentTime)}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 bg-black/40 backdrop-blur-sm border border-white/5 rounded-xl">
      <audio ref={audioRef} src={src} />

      {/* Sound Wave Animation */}
      <div className="flex items-center gap-1 mb-4 h-8 justify-center">
        {isPlaying ? [...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="w-1 bg-white/80 rounded-full"
            animate={{
              height: [8, 24, 12, 32, 16, 20],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut"
            }}
          />
        )) : (
          <div className="flex gap-1 h-2 items-center">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="w-1 h-1 bg-white/20 rounded-full" />
            ))}
          </div>
        )}
      </div>

      {/* Track Info */}
      <div className="text-center mb-4">
        <h3 className="text-white font-bold text-sm mb-1 truncate max-w-[150px]">
          {itemName}
        </h3>
        <div className="text-xs text-neutral-500 font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Progress Bar */}
      <div
        className="w-full h-1 bg-white/10 rounded-full mb-4 cursor-pointer relative group"
        onClick={handleSeek}
      >
        <motion.div
          className="h-full bg-white rounded-full relative"
          style={{ width: `${(currentTime / duration) * 100}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${(currentTime / duration) * 100}%` }}
        >
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={togglePlayPause}
          className="p-3 rounded-full bg-white text-black hover:bg-neutral-200 transition-all duration-300 shadow-lg"
        >
          {isPlaying ? (
            <Pause size={18} fill="currentColor" />
          ) : (
            <Play size={18} fill="currentColor" className="ml-0.5" />
          )}
        </motion.button>
      </div>
    </div>
  );
}