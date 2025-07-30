import React, { useEffect, useRef, useState } from "react";
import { FaUsers } from "react-icons/fa";
import {motion} from "framer-motion";
import { GiWolfHowl, GiDeathSkull } from "react-icons/gi";
import {FaGamepad} from "react-icons/fa";
export default function GameBox({ roomData, players, currentPlayerId }) {
  const [positions, setPositions] = useState({});
  const containerRef = useRef(null);

  const dayBackground = "/assets/images/day.png";
  const nightBackground = "/assets/images/night.png";

  const endPageRef = useRef(null);

  // Initialize player positions in a circle
  useEffect(() => {
    if (players.length === 0) return;
    const initialPositions = {};
    const alivePlayers = players.filter((p) => p.is_alive);
    const count = alivePlayers.length;

    alivePlayers.forEach((player, index) => {
      const angle = (index / count) * 2 * Math.PI;
      const radius = Math.min(35, 10 + count * 2); // Radius adjusts with player count
      initialPositions[player.id] = {
        x: 50 + radius * Math.cos(angle),
        y: 50 + radius * Math.sin(angle),
      };
    });
    // Position dead players at the bottom
    players
      .filter((p) => !p.is_alive)
      .forEach((player, index) => {
        initialPositions[player.id] = { x: 20 + index * 15, y: 90 };
      });

    setPositions(initialPositions);
  }, [players.length, roomData.stage]); // Re-calculate on stage change to reset positions

  // Handle random movement during night
  useEffect(() => {
    if (roomData.stage !== "night") return;

    const interval = setInterval(() => {
      setPositions((prevPositions) => {
        const newPositions = { ...prevPositions };
        players.forEach((player) => {
          if (!player.is_alive) return;
          const currentPos = prevPositions[player.id] || { x: 50, y: 50 };
          newPositions[player.id] = {
            x: Math.max(
              10,
              Math.min(90, currentPos.x + (Math.random() * 6 - 3))
            ),
            y: Math.max(
              10,
              Math.min(90, currentPos.y + (Math.random() * 6 - 3))
            ),
          };
        });
        return newPositions;
      });
    }, 2500);
    endPageRef.current?.scrollIntoView({ behavior: 'smooth' });

    return () => clearInterval(interval);
  }, [roomData.stage, players]);

  const isNight = roomData.stage === "night";
  const alivePlayers = players.filter((p) => p.is_alive);

  return (
    <div className="flex-1 w-full h-full relative">
      <div
        ref={containerRef}
        className="relative w-full h-full min-h-[300px] max-sm:min-h-screen lg:min-h-screen rounded-xl overflow-hidden transition-all duration-1000 bg-cover bg-center"
        style={{
          backgroundImage: `url(${isNight ? nightBackground : dayBackground})`,
        }}
      >
        {/* Overlay for better contrast */}
        <div
          className={`absolute inset-0 transition-colors duration-1000 ${
            isNight ? "bg-black/40" : "bg-blue-300/10"
          }`}
        />
  
        {/* Stage indicator */}
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10">
          <div
            className={`px-2 sm:px-3 py-1 sm:py-2 rounded-lg backdrop-blur-sm border text-xs sm:text-sm ${
              isNight
                ? "bg-purple-900/80 border-purple-500/50 text-purple-100"
                : "bg-blue-900/80 border-blue-500/50 text-blue-100"
            }`}
          >
            <span className="font-medium capitalize">
              {roomData.stage}
            </span>
          </div>
        </div>
  
        {/* Players count indicator */}
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10">
          <div className="px-2 sm:px-3 py-1 sm:py-2 rounded-lg bg-black/50 backdrop-blur-sm border border-white/20 text-white">
            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <FaUsers className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>
                {alivePlayers.length} / {players.length} Alive
              </span>
            </div>
          </div>
        </div>
  
        {/* Players */}
        {players.map((player) => {
          const position = positions[player.id] || { x: 50, y: 50 };
          const isCurrentPlayer = player.id === currentPlayerId;
  
          return (
            <motion.div
              key={player.id}
              className="absolute z-20"
              animate={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                opacity: player.is_alive ? 1 : 0.4,
              }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            >
              <div
                className="relative group"
                style={{ transform: "translate(-50%, -50%)" }}
              >
                {/* Player avatar */}
                <div
                  className={`relative w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden border-2 sm:border-4 transition-all duration-300 ${
                    isCurrentPlayer
                      ? "border-yellow-400 shadow-lg shadow-yellow-400/50"
                      : player.is_alive
                      ? "border-white/80 hover:border-white"
                      : "border-red-500/50"
                  }`}
                >
                  <img
                    src={player.profile}
                    alt={player.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
  
                  {/* Death overlay */}
                  {!player.is_alive && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <GiDeathSkull className="text-red-400 text-lg sm:text-2xl lg:text-3xl" />
                    </div>
                  )}
                </div>
  
                {/* Player name */}
                <div className="absolute -bottom-5 sm:-bottom-7 left-1/2 transform -translate-x-1/2 whitespace-nowrap max-w-[80px] sm:max-w-none">
                  <span
                    className={`text-xs lg:text-sm font-medium px-1 sm:px-2 py-0.5 sm:py-1 rounded-md backdrop-blur-sm truncate block ${
                      isCurrentPlayer
                        ? "bg-yellow-500/90 text-yellow-900"
                        : "bg-black/70 text-white"
                    }`}
                    title={player.name}
                  >
                    {player.name}
                  </span>
                </div>
  
                {/* Action indicators */}
                {player.is_action_done && player.is_alive && (
                  <div
                    className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 w-3 h-3 sm:w-5 sm:h-5 bg-green-500 rounded-full border border-slate-800 sm:border-2 animate-pulse"
                    title="Action Taken"
                  />
                )}
              </div>
            </motion.div>
          );
        })}
  
        {/* Center game info */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center px-4">
            <div
              className={`inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 rounded-xl backdrop-blur-md border ${
                isNight
                  ? "bg-purple-900/40 border-purple-500/30 text-purple-100"
                  : "bg-blue-900/40 border-blue-500/30 text-blue-100"
              }`}
            >
              {isNight ? (
                <GiWolfHowl className="text-xl sm:text-2xl" />
              ) : (
                <FaGamepad className="text-xl sm:text-2xl" />
              )}
              <div>
                <div className="text-base sm:text-lg font-bold">Round {roomData.round}</div>
                <div className="text-xs sm:text-sm opacity-80">
                  {isNight ? "Night Phase" : "Day Phase"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div ref={endPageRef} ></div>
    </div>
  );
};