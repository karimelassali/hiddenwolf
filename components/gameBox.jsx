import React, { useEffect, useRef, useState } from "react";
import { FaUsers } from "react-icons/fa";
import { motion } from "framer-motion";
import { GiWolfHowl, GiDeathSkull } from "react-icons/gi";
import { FaGamepad } from "react-icons/fa";

export default function GameBox({ roomData, players, currentPlayerId }) {
  const [positions, setPositions] = useState({});
  const [activeWolfHint, setActiveWolfHint] = useState(null);
  const containerRef = useRef(null);
  const endPageRef = useRef(null);

  // Refs لإدارة الحالات المعقدة
  const nightStartDelay = useRef(null);
  const movementTick = useRef(0);
  const doctorTarget = useRef(null); // لتخزين هدف الطبيب

  const dayBackground = "/assets/images/day.png";
  const nightBackground = "/assets/images/night.png";

  const wolfHintOptions = ['hesitation', 'smooth', 'delayed', 'aversion', 'restless'];

  useEffect(() => {
    if (roomData.stage === 'night') {
      // اختيار تلميح عشوائي للذئب
      const randomHint = wolfHintOptions[Math.floor(Math.random() * wolfHintOptions.length)];
      setActiveWolfHint(randomHint);
      console.log('active hint is '  +  randomHint);

      // الطبيب يختار هدفاً ليحميه
      const doctorPlayer = players.find(p => p.role === 'doctor');
      if (doctorPlayer) {
        const otherPlayers = players.filter(p => p.is_alive && p.id !== doctorPlayer.id);
        if (otherPlayers.length > 0) {
          doctorTarget.current = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
        }
      }

      // إعادة تعيين العدادات
      movementTick.current = 0;
      nightStartDelay.current = Date.now();
    } else {
      setActiveWolfHint(null);
      doctorTarget.current = null;
      nightStartDelay.current = null;
    }
  }, [roomData.stage, roomData.round]);

  // تهيئة أماكن اللاعبين
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

  // منطق الحركة المحسّن لجميع الأدوار الخاصة
  useEffect(() => {
    if (roomData.stage !== "night") return;

    const interval = setInterval(() => {
      movementTick.current += 1;
      setPositions((prevPositions) => {
        const newPositions = { ...prevPositions };
        const myPos = prevPositions[currentPlayerId];

        players.forEach((player) => {
          if (!player.is_alive) return;
          const currentPos = prevPositions[player.id] || { x: 50, y: 50 };
          let moveX = (Math.random() * 8 - 4);
          let moveY = (Math.random() * 8 - 4);

          // منطق الذئب
          if (player.role === 'wolf' && activeWolfHint) {
            if (activeWolfHint === 'delayed' && Date.now() - nightStartDelay.current < 500) return;
            const isRestlessTick = activeWolfHint === 'restless' && movementTick.current % 4 === 0;
            const isNormalTick = movementTick.current % 5 === 0;
            if (!isNormalTick && !isRestlessTick) return;
            if (activeWolfHint === 'hesitation' && Math.random() < 0.15) return;
            if (activeWolfHint === 'aversion' && myPos) {
              const dirX = myPos.x - currentPos.x;
              const dirY = myPos.y - currentPos.y;
              if (Math.abs(dirX) > 0) moveX -= Math.sign(dirX) * 2;
              if (Math.abs(dirY) > 0) moveY -= Math.sign(dirY) * 2;
            }
          }
          // منطق الطبيب
          else if (player.role === 'doctor') {
            if (doctorTarget.current && prevPositions[doctorTarget.current.id]) {
              const targetPos = prevPositions[doctorTarget.current.id];
              const dirX = targetPos.x - currentPos.x;
              const dirY = targetPos.y - currentPos.y;
              if (Math.abs(dirX) > 0) moveX += Math.sign(dirX) * 1.5;
              if (Math.abs(dirY) > 0) moveY += Math.sign(dirY) * 1.5;
            }
          }
          // منطق الرائي
          else if (player.role === 'seer') {
            let isNearSomeone = false;
            for (const otherPlayer of players) {
              if (player.id === otherPlayer.id || !prevPositions[otherPlayer.id]) continue;
              const otherPos = prevPositions[otherPlayer.id];
              const distance = Math.sqrt(Math.pow(currentPos.x - otherPos.x, 2) + Math.pow(currentPos.y - otherPos.y, 2));
              if (distance < 20) {
                isNearSomeone = true;
                break;
              }
            }
            if (isNearSomeone && Math.random() < 0.25) {
              return; 
            }
          }
          
          newPositions[player.id] = {
            x: Math.max(10, Math.min(90, currentPos.x + moveX)),
            y: Math.max(10, Math.min(90, currentPos.y + moveY)),
          };
        });
        return newPositions;
      });
    }, 300);

    endPageRef.current?.scrollIntoView({ behavior: 'smooth' });
    return () => clearInterval(interval);
  }, [roomData.stage, players, activeWolfHint, currentPlayerId]);

  const isNight = roomData.stage === "night";

  return (
    <div className="flex-1 w-full h-full flex items-center justify-center relative">
      <div
        ref={containerRef}
        className="relative w-full h-full min-h-[600px] max-sm:min-h-[700px] lg:min-h-full rounded-xl overflow-hidden transition-all duration-1000 bg-cover bg-center"
        style={{ backgroundImage: `url(${isNight ? nightBackground : dayBackground})` }}
      >
        <div className={`absolute inset-0 transition-colors duration-1000 ${isNight ? "bg-black/40" : "bg-blue-300/10"}`} />
        
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10">
          <div className={`px-2 sm:px-3 py-1 sm:py-2 rounded-lg backdrop-blur-sm border text-xs sm:text-sm ${isNight ? "bg-purple-900/80 border-purple-500/50 text-purple-100" : "bg-blue-900/80 border-blue-500/50 text-blue-100"}`}>
            <span className="font-medium capitalize">{roomData.stage}</span>
          </div>
        </div>
  
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10">
          <div className="px-2 sm:px-3 py-1 sm:py-2 rounded-lg bg-black/50 backdrop-blur-sm border border-white/20 text-white">
            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <FaUsers className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{players.filter(p => p.is_alive).length} / {players.length} Alive</span>
            </div>
          </div>
        </div>
  
        {players.map((player) => {
          const position = positions[player.id] || { x: 50, y: 50 };
          const isCurrentPlayer = player.id === currentPlayerId;
          const isWolf = player.role === 'wolf';

          return (
            <motion.div
              key={player.id}
              className="absolute z-20"
              animate={{ left: `${position.x}%`, top: `${position.y}%`, opacity: player.is_alive ? 1 : 0.4 }}
              transition={
                isNight && isWolf && activeWolfHint === 'smooth'
                  ? { duration: 1.5, ease: "linear" }
                  : { duration: 1.5, ease: "easeInOut" }
              }
            >
              <div className="relative group" style={{ transform: "translate(-50%, -50%)" }}>
                <div
                  className={`relative w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden border-2 sm:border-4 transition-colors duration-300 ${isCurrentPlayer ? "border-yellow-400" : player.is_alive ? "border-white/80" : "border-gray-600/50"}`}
                >
                  {player.role}
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
      <div ref={endPageRef} ></div>
    </div>
  );
}