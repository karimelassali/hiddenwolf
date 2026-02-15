import React, { useEffect, useRef, useState, useMemo } from "react";
import { FaUsers } from "react-icons/fa";
import { motion } from "framer-motion";
import { GiWolfHowl, GiDeathSkull } from "react-icons/gi";
import { FaGamepad } from "react-icons/fa";

// --- Movement Pattern Generators ---
// Each returns a { moveX, moveY } delta per tick

function wolfMovement(currentPos, tick, allPositions, playerId, players) {
  // Predatory: longer deliberate arcs toward a random alive target
  // Occasionally pauses (hesitation)
  if (Math.random() < 0.12) return { moveX: 0, moveY: 0 }; // hesitation pause

  // Pick a "prey" — the closest non-wolf alive player
  const nonWolves = players.filter(p => p.is_alive && p.role !== "wolf" && p.id !== playerId);
  if (nonWolves.length === 0) return { moveX: (Math.random() - 0.5) * 6, moveY: (Math.random() - 0.5) * 6 };

  const prey = nonWolves[tick % nonWolves.length]; // cycles through targets
  const preyPos = allPositions[prey.id];
  if (!preyPos) return { moveX: (Math.random() - 0.5) * 6, moveY: (Math.random() - 0.5) * 6 };

  const dirX = preyPos.x - currentPos.x;
  const dirY = preyPos.y - currentPos.y;
  const dist = Math.sqrt(dirX * dirX + dirY * dirY);

  if (dist < 12) {
    // Close enough — circle around prey
    const angle = Math.atan2(dirY, dirX) + Math.PI / 2;
    return {
      moveX: Math.cos(angle) * 3.5 + (Math.random() - 0.5) * 2,
      moveY: Math.sin(angle) * 3.5 + (Math.random() - 0.5) * 2,
    };
  }

  // Move toward prey with slight arc
  const arcAngle = Math.sin(tick * 0.3) * 0.4;
  const normX = dirX / dist;
  const normY = dirY / dist;
  return {
    moveX: (normX * Math.cos(arcAngle) - normY * Math.sin(arcAngle)) * 4 + (Math.random() - 0.5),
    moveY: (normX * Math.sin(arcAngle) + normY * Math.cos(arcAngle)) * 4 + (Math.random() - 0.5),
  };
}

function seerMovement(currentPos, tick, allPositions, playerId, players) {
  // Curious orbiting: approaches a player, pauses briefly, then drifts away
  const others = players.filter(p => p.is_alive && p.id !== playerId);
  if (others.length === 0) return { moveX: (Math.random() - 0.5) * 4, moveY: (Math.random() - 0.5) * 4 };

  const phase = Math.floor(tick / 8) % others.length;
  const target = others[phase];
  const targetPos = allPositions[target.id];
  if (!targetPos) return { moveX: (Math.random() - 0.5) * 4, moveY: (Math.random() - 0.5) * 4 };

  const subPhase = tick % 8;
  const dirX = targetPos.x - currentPos.x;
  const dirY = targetPos.y - currentPos.y;
  const dist = Math.sqrt(dirX * dirX + dirY * dirY);

  if (subPhase < 4) {
    // Approach
    if (dist < 8) return { moveX: 0, moveY: 0 }; // pause when close (observing)
    return {
      moveX: (dirX / dist) * 2.5 + (Math.random() - 0.5) * 1.5,
      moveY: (dirY / dist) * 2.5 + (Math.random() - 0.5) * 1.5,
    };
  } else {
    // Drift away to edge
    return {
      moveX: -(dirX / dist) * 2 + (Math.random() - 0.5) * 3,
      moveY: -(dirY / dist) * 2 + (Math.random() - 0.5) * 3,
    };
  }
}

function doctorMovement(currentPos, tick, allPositions, playerId, players, patientId) {
  // Protective hovering: stays near one player (the "patient"), small tight movements
  const patientPos = allPositions[patientId];
  if (!patientPos) return { moveX: (Math.random() - 0.5) * 3, moveY: (Math.random() - 0.5) * 3 };

  const dirX = patientPos.x - currentPos.x;
  const dirY = patientPos.y - currentPos.y;
  const dist = Math.sqrt(dirX * dirX + dirY * dirY);

  if (dist > 15) {
    // Too far — move closer
    return {
      moveX: (dirX / dist) * 3 + (Math.random() - 0.5),
      moveY: (dirY / dist) * 3 + (Math.random() - 0.5),
    };
  }

  // Orbit tightly around patient
  const angle = Math.atan2(dirY, dirX) + Math.PI / 2;
  return {
    moveX: Math.cos(angle) * 1.5 + (Math.random() - 0.5) * 2,
    moveY: Math.sin(angle) * 1.5 + (Math.random() - 0.5) * 2,
  };
}

function villagerMovement() {
  // Nervous jittery wandering — small random movements
  return {
    moveX: (Math.random() - 0.5) * 5,
    moveY: (Math.random() - 0.5) * 5,
  };
}

// --- Main Component ---
export default function GameBox({ roomData, players, currentPlayerId }) {
  const [positions, setPositions] = useState({});
  const containerRef = useRef(null);
  const endPageRef = useRef(null);
  const movementTick = useRef(0);
  const doctorPatientRef = useRef(null);

  const dayBackground = "/assets/images/day.png";
  const nightBackground = "/assets/images/night.png";

  // Pick doctor's patient for this night
  useEffect(() => {
    if (roomData.stage === "night") {
      movementTick.current = 0;
      const otherAlive = players.filter(p => p.is_alive && p.role !== "doctor");
      if (otherAlive.length > 0) {
        doctorPatientRef.current = otherAlive[Math.floor(Math.random() * otherAlive.length)].id;
      }
    } else {
      doctorPatientRef.current = null;
    }
  }, [roomData.stage, roomData.round]);

  // Initialize positions
  useEffect(() => {
    if (players.length === 0) return;
    const initialPositions = {};
    const alivePlayers = players.filter((p) => p.is_alive);
    alivePlayers.forEach((player, index) => {
      const angle = (index / alivePlayers.length) * 2 * Math.PI;
      const radius = Math.min(35, 10 + alivePlayers.length * 2);
      initialPositions[player.id] = { x: 50 + radius * Math.cos(angle), y: 50 + radius * Math.sin(angle) };
    });
    players.filter((p) => !p.is_alive).forEach((player, index) => {
      initialPositions[player.id] = { x: 20 + index * 15, y: 90 };
    });
    setPositions(initialPositions);
  }, [players.length, roomData.stage]);

  // Movement logic
  useEffect(() => {
    if (roomData.stage !== "night") return;

    const interval = setInterval(() => {
      movementTick.current += 1;
      const tick = movementTick.current;

      setPositions((prev) => {
        const next = { ...prev };

        players.forEach((player) => {
          if (!player.is_alive) return;
          const currentPos = prev[player.id] || { x: 50, y: 50 };
          let delta;

          switch (player.role) {
            case "wolf":
              delta = wolfMovement(currentPos, tick, prev, player.id, players);
              break;
            case "seer":
              delta = seerMovement(currentPos, tick, prev, player.id, players);
              break;
            case "doctor":
              delta = doctorMovement(currentPos, tick, prev, player.id, players, doctorPatientRef.current);
              break;
            default:
              delta = villagerMovement();
              break;
          }

          next[player.id] = {
            x: Math.max(8, Math.min(92, currentPos.x + delta.moveX)),
            y: Math.max(8, Math.min(92, currentPos.y + delta.moveY)),
          };
        });
        return next;
      });
    }, 350);

    endPageRef.current?.scrollIntoView({ behavior: "smooth" });
    return () => clearInterval(interval);
  }, [roomData.stage, players, currentPlayerId]);

  const isNight = roomData.stage === "night";

  return (
    <div className="flex-1 w-full h-full flex items-center justify-center relative">
      <div
        ref={containerRef}
        className="relative w-full h-full min-h-[600px] max-sm:min-h-[700px] lg:min-h-full rounded-xl overflow-hidden transition-all duration-1000 bg-cover bg-center"
        style={{ backgroundImage: `url(${isNight ? nightBackground : dayBackground})` }}
      >
        <div className={`absolute inset-0 transition-colors duration-1000 ${isNight ? "bg-black/40" : "bg-blue-300/10"}`} />

        {/* Top-left stage badge */}
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10">
          <div className={`px-2 sm:px-3 py-1 sm:py-2 rounded-lg backdrop-blur-sm border text-xs sm:text-sm ${isNight ? "bg-purple-900/80 border-purple-500/50 text-purple-100" : "bg-blue-900/80 border-blue-500/50 text-blue-100"}`}>
            <span className="font-medium capitalize">{roomData.stage}</span>
          </div>
        </div>

        {/* Top-right alive count */}
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10">
          <div className="px-2 sm:px-3 py-1 sm:py-2 rounded-lg bg-black/50 backdrop-blur-sm border border-white/20 text-white">
            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <FaUsers className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{players.filter(p => p.is_alive).length} / {players.length} Alive</span>
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
              animate={{ left: `${position.x}%`, top: `${position.y}%`, opacity: player.is_alive ? 1 : 0.4 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            >
              <div className="relative group" style={{ transform: "translate(-50%, -50%)" }}>
                <div
                  className={`relative w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden border-2 sm:border-4 transition-colors duration-300 ${isCurrentPlayer ? "border-yellow-400" : player.is_alive ? "border-white/80" : "border-gray-600/50"}`}
                >
                  <img src={player.profile} alt={player.name} className="w-full h-full object-cover" loading="lazy" />
                  {!player.is_alive && <div className="absolute inset-0 bg-black/70 flex items-center justify-center"><GiDeathSkull className="text-red-400 text-lg sm:text-2xl lg:text-3xl" /></div>}
                </div>
                <div className="absolute -bottom-5 sm:-bottom-7 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <span className={`text-xs lg:text-sm font-medium px-1 sm:px-2 py-0.5 sm:py-1 rounded-md backdrop-blur-sm truncate block ${isCurrentPlayer ? "bg-yellow-500/90 text-yellow-900" : "bg-black/70 text-white"}`} title={player.name}>
                    {player.name}
                  </span>
                </div>
                {player.is_action_done && player.is_alive && <div className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 w-3 h-3 sm:w-5 sm:h-5 bg-green-500 rounded-full border border-slate-800 sm:border-2" title="Action Taken" />}
              </div>
            </motion.div>
          );
        })}

        {/* Center phase indicator */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center px-4">
            <div className={`inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 rounded-xl backdrop-blur-md border ${isNight ? "bg-purple-900/40 border-purple-500/30 text-purple-100" : "bg-blue-900/40 border-blue-500/30 text-blue-100"}`}>
              {isNight ? <GiWolfHowl className="text-xl sm:text-2xl" /> : <FaGamepad className="text-xl sm:text-2xl" />}
              <div>
                <div className="text-base sm:text-lg font-bold">Round {roomData.round}</div>
                <div className="text-xs sm:text-sm opacity-80">{isNight ? "Night Phase" : "Day Phase"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div ref={endPageRef}></div>
    </div>
  );
}