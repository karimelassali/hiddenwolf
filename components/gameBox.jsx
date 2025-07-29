import { useState, useEffect } from 'react';
import Image from 'next/image';

// --- Enhanced Game Box Component ---
export default function GameBox ({ roomData, players, currentPlayerId }) {
  const [positions, setPositions] = useState({});
  const containerRef = useRef(null);

  const dayBackground = "/assets/images/day.png";
  const nightBackground = "/assets/images/night.png";

  useEffect(() => {
    if (players.length === 0) return;
    const initialPositions = {};
    const alivePlayers = players.filter((p) => p.is_alive);
    const count = alivePlayers.length;

    alivePlayers.forEach((player, index) => {
      const angle = (index / count) * 2 * Math.PI;
      
      // ✅ FIX: Changed the circle to an ellipse and moved it down.
      const radiusX = 40; // Horizontal radius (makes it wide)
      const radiusY = 12; // Vertical radius (makes it short, like a ground plane)
      const centerY = 80; // Vertical center (80% from the top, moving it down)

      initialPositions[player.id] = {
        x: 50 + radiusX * Math.cos(angle),
        y: centerY + radiusY * Math.sin(angle),
      };
    });
    
    // Position dead players at the bottom, out of the way
    players.filter((p) => !p.is_alive).forEach((player, index) => {
      // Spreads dead players out at the very bottom
      initialPositions[player.id] = { x: 15 + index * 15, y: 95 };
    });

    setPositions(initialPositions);
  }, [players.length, roomData.stage]);

  // The rest of your EnhancedGameBox component remains the same...
  const isNight = roomData.stage === "night";
  const alivePlayers = players.filter((p) => p.is_alive);

  return (
    <div className="flex-1 w-full h-full min-h-[400px] lg:min-h-0 relative">
      <div
        ref={containerRef}
        className="relative w-full h-full rounded-xl overflow-hidden transition-all duration-1000 bg-cover bg-center"
        style={{
          backgroundImage: `url(${isNight ? nightBackground : dayBackground})`,
        }}
      >
        <div
          className={`absolute inset-0 transition-colors duration-1000 ${
            isNight ? "bg-black/40" : "bg-blue-300/10"
          }`}
        />
        <div className="absolute top-4 left-4 z-10">
          <div
            className={`px-3 py-2 rounded-lg backdrop-blur-sm border ${
              isNight
                ? "bg-purple-900/80 border-purple-500/50 text-purple-100"
                : "bg-blue-900/80 border-blue-500/50 text-blue-100"
            }`}
          >
            <span className="text-sm font-medium capitalize">
              {roomData.stage}
            </span>
          </div>
        </div>
        <div className="absolute top-4 right-4 z-10">
          <div className="px-3 py-2 rounded-lg bg-black/50 backdrop-blur-sm border border-white/20 text-white">
            <div className="flex items-center gap-2 text-sm">
              <FaUsers className="w-4 h-4" />
              <span>
                {alivePlayers.length} / {players.length} Alive
              </span>
            </div>
          </div>
        </div>

        {/* Players */}
        {players.map((player) => {
          const position = positions[player.id] || { x: 50, y: 80 };
          const isCurrentPlayer = player.id === currentPlayerId;

          return (
            <motion.div
              key={player.id}
              className="absolute z-20"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                opacity: player.is_alive ? 1 : 0.4,
                scale: 1,
              }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} // A smoother "springy" animation
            >
              <div
                className="relative group"
                style={{ transform: "translate(-50%, -50%)" }}
              >
                <div
                  className={`relative w-16 h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden border-4 transition-all duration-300 ${
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
                  />
                  {!player.is_alive && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <GiDeathSkull className="text-red-400 text-3xl" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <span
                    className={`text-xs lg:text-sm font-medium px-2 py-1 rounded-md backdrop-blur-sm ${
                      isCurrentPlayer
                        ? "bg-yellow-500/90 text-yellow-900"
                        : "bg-black/70 text-white"
                    }`}
                  >
                    {player.name}
                  </span>
                </div>
                {player.is_action_done && player.is_alive && (
                  <div
                    className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full border-2 border-slate-800 animate-pulse"
                    title="Action Taken"
                  />
                )}
              </div>
            </motion.div>
          );
        })}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div
              className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl backdrop-blur-md border ${
                isNight
                  ? "bg-purple-900/40 border-purple-500/30 text-purple-100"
                  : "bg-blue-900/40 border-blue-500/30 text-blue-100"
              }`}
            >
              {isNight ? (
                <GiWolfHowl className="text-2xl" />
              ) : (
                <FaGamepad className="text-2xl" />
              )}
              <div>
                <div className="text-lg font-bold">Round {roomData.round}</div>
                <div className="text-sm opacity-80">
                  {isNight ? "Night Phase" : "Day Phase"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};