"use client";

// --- Import Core Libraries ---
import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";

// --- Import Icons & Utils ---
import { FaDice, FaArrowRight, FaHourglass, FaTimes } from "react-icons/fa";
import { GiWolfHowl, GiHeartShield, GiDeathSkull } from "react-icons/gi";
import { supabase } from "@/lib/supabase";
import { kill, seePlayer, savePlayer, voting, messaging } from "@/utils/botsActions";
import { trackUserConnectivity } from "@/utils/trackUserconnectivity";
import { HowlSound } from "@/utils/sounds";

// --- Import UI Components ---
import GameNavbar from "@/components/blocks/game-navbar";
import GameActionsBar from "@/components/blocks/game-actions-bar";
import PlayersChat from "@/components/chat";
import { AnimatedTooltipPeople } from "@/components/tooltip";

// --- Dynamically Import Components ---
const StageResult = dynamic(() => import("@/components/ui/stageResult"), { ssr: false });
const SidePlayers = dynamic(() => import("@/components/sidePlayers"), { ssr: false });
const GameBox = dynamic(() => import("@/components/gameBox"), { ssr: false });
const GameWinner = dynamic(() => import("@/components/winnerModal"), { ssr: false });

// --- Simple Role Reveal Modal Component ---
const RoleRevealModal = ({ role, onClose }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center">
    <motion.div initial={{ scale: 0.7, y: 50 }} animate={{ scale: 1, y: 0 }} className="relative bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-700 text-center max-w-sm">
      <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><FaTimes size={20} /></button>
      <h2 className="text-lg font-semibold text-slate-400 mb-2">You are the...</h2>
      <h1 className="text-4xl font-bold text-purple-400 capitalize mb-6">{role}</h1>
      <p className="text-slate-300 mb-6">
        {role === 'wolf' && 'Your goal is to eliminate all the villagers.'}
        {role === 'seer' && 'Each night, you can discover one player\'s true identity.'}
        {role === 'doctor' && 'Each night, you can choose one person to save from the wolf.'}
        {role === 'villager' && 'Your goal is to find and eliminate the wolf among you.'}
      </p>
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onClose} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg">Got it</motion.button>
    </motion.div>
  </motion.div>
);

// --- Main Game Component ---
export default function Game({ params }) {
  // --- State Declarations ---
  const { uid } = React.use(params);
  const { user, isLoaded } = useUser();

  const [roomData, setRoomData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [winner, setWinner] = useState(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [nightResult, setNightResult] = useState(null);

  const hasShownRoleModal = useRef(false);
  const prevStageRef = useRef();
  const playersRef = useRef(players);

  // --- Side Effects to keep refs updated ---
  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  const upsertPlayer = async (roomId, currentUser) => {
    if (!currentUser || !roomId) return;
    try {
      const { data: playerStat } = await supabase.from("player_stats").select("avatar,username").eq("player_id", currentUser.id).single();
      const playerData = {
        room_id: roomId,
        name: playerStat?.username || currentUser.fullName,
        profile: playerStat?.avatar || currentUser.imageUrl,
        player_id: currentUser.id,
        is_human: true,
        last_seen: new Date().toISOString(),
      };
      await supabase.from("players").upsert(playerData, { onConflict: 'player_id' });
    } catch (error) {
      console.error("Error in upsertPlayer on Game page:", error);
    }
  };

  // --- Data Fetching and Initialization ---
  useEffect(() => {
    const initializeGame = async () => {
      const { data: room, error: roomError } = await supabase.from("rooms").select("*").eq("code", uid).single();
      if (roomError || !room) { console.error("Error fetching room", roomError); return; }
      setRoomData(room);
      if (user) {
        await upsertPlayer(room.id, user);
      }
      const { data: initialPlayers, error: playersError } = await supabase.from("players").select("*").eq("room_id", room.id).order("id", { ascending: true });
      if (playersError) { console.error("Error fetching players", playersError); return; }
      setPlayers(initialPlayers);
    };
    if(isLoaded) {
      initializeGame();
    }
  }, [uid, isLoaded, user]);

  // --- Real-time Subscriptions ---
  useEffect(() => {
    if (!roomData?.id) return;
    const playersSubscription = supabase.channel(`game-players-${roomData.id}`).on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `room_id=eq.${roomData.id}` }, (payload) => {
        if (payload.eventType === 'UPDATE') {
            const oldPlayer = payload.old;
            const newPlayer = payload.new;
            if (oldPlayer.is_alive && !newPlayer.is_alive) setNightResult(prev => ({ ...prev, killed: newPlayer.name }));
            if (!oldPlayer.is_saved && newPlayer.is_saved) setNightResult(prev => ({ ...prev, saved: newPlayer.name }));
        }
        if (payload.eventType === 'INSERT') setPlayers(p => [...p, payload.new]);
        if (payload.eventType === 'UPDATE') setPlayers(p => p.map(player => player.id === payload.new.id ? payload.new : player));
        if (payload.eventType === 'DELETE') setPlayers(p => p.filter(player => player.id !== payload.old.id));
    }).subscribe();
    const roomSubscription = supabase.channel(`game-room-${roomData.id}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomData.id}` }, (payload) => setRoomData(prev => ({ ...prev, ...payload.new }))).subscribe();
    return () => { supabase.removeChannel(playersSubscription); supabase.removeChannel(roomSubscription); };
  }, [roomData?.id]);

  // --- Derived State ---
  useEffect(() => {
    if (user && players.length > 0) setCurrentPlayer(players.find((p) => p.player_id === user.id) || null);
  }, [user, players]);

  useEffect(() => {
    if (roomData?.id && user?.id) {
      const interval = trackUserConnectivity(roomData.id, user.id, roomData.host_id);
      return () => clearInterval(interval);
    }
  }, [roomData?.id, user?.id]);
  
  const runBotsActions = () => {
    const bots = playersRef.current.filter((p) => !p.is_human);
    bots.forEach(async (bot) => {
      if (bot.is_action_done || !bot.is_alive) return;
      const alivePlayers = playersRef.current.filter((p) => p.is_alive);
      const potentialTargets = alivePlayers.filter(p => p.id !== bot.id);
      if (potentialTargets.length === 0) return;
      const randomTarget = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
      if (roomData.stage === "day") {
        await voting(bot, randomTarget, roomData.id);
        await messaging(bot, roomData.id);
      } else if (roomData.stage === "night") {
        setTimeout(async () => {
          const currentPlayers = playersRef.current;
          const currentAlivePlayers = currentPlayers.filter((p) => p.is_alive);
          const currentTargets = currentAlivePlayers.filter(p => p.id !== bot.id);
          if (currentTargets.length === 0) return;
          const finalTarget = currentTargets[Math.floor(Math.random() * currentTargets.length)];
          if (bot.role === "wolf") await kill(bot, finalTarget, roomData.id);
          else if (bot.role === "seer") await seePlayer(bot, finalTarget);
          else if (bot.role === "doctor") await savePlayer(bot, finalTarget, roomData.id);
        }, Math.floor(Math.random() * 7000) + 1000);
      }
    });
  };

  // --- Game Logic ---
  useEffect(() => {
    if (!players.length || !roomData) return;
    if (roomData.roles_assigned && !hasShownRoleModal.current && currentPlayer?.role) {
      setIsRoleModalOpen(true);
      hasShownRoleModal.current = true;
    }

    if (roomData.stage !== prevStageRef.current) {
      if (currentPlayer?.player_id === roomData.host_id) {
        const handleNewTurn = async () => {
          const updates = playersRef.current.map(p => ({ id: p.id, is_action_done: false }));
          await supabase.from("players").upsert(updates);
          runBotsActions();
        };
        handleNewTurn();
      }
    }
    
    prevStageRef.current = roomData.stage;

    const isGameActive = roomData.stage === 'day' || roomData.stage === 'night';
    const rolesAreSet = players.every(p => p.role !== null);
    if (isGameActive && rolesAreSet) {
      const alivePlayers = players.filter(p => p.is_alive);
      const aliveWolves = alivePlayers.filter(p => p.role === 'wolf');
      const aliveNonWolves = alivePlayers.filter(p => p.role !== 'wolf');
      if (alivePlayers.length > 0 && roomData.stage !== 'ended') {
        if (aliveWolves.length === 0) {
          setWinner({ team: 'Villagers', name: 'The Villagers', role: 'villager', players: alivePlayers });
          supabase.from("rooms").update({ stage: "ended" }).eq("id", roomData.id).then();
        } else if (aliveNonWolves.length === 0) {
          const wolfNames = aliveWolves.map(w => w.name).join(', ');
          setWinner({ team: 'Wolves', name: wolfNames, role: 'wolf', players: alivePlayers });
          supabase.from("rooms").update({ stage: "ended" }).eq("id", roomData.id).then();
        }
      }
    }
  // ✅ FIX: Use optional chaining (?.) to safely access `roomData.stage`.
  // This prevents the app from crashing if `roomData` is `null` during the initial render.
  }, [roomData?.stage, players, currentPlayer]);

  useEffect(() => {
    if (roomData?.stage) {
      if (prevStageRef.current === 'night' && roomData.stage === 'day') {
        if (!nightResult) {
          setNightResult({ killed: null, saved: null });
        }
      }
    }
  }, [roomData?.stage, nightResult]);

  // --- Core Game Functions ---
  const ApplyingRoles = async () => {
    const baseRoles = ["wolf", "seer", "doctor"];
    while (baseRoles.length < players.length) { baseRoles.push("villager"); }
    const shuffled = baseRoles.sort(() => Math.random() - 0.5);
    const playerUpdates = players.map((player, i) => ({ ...player, role: shuffled[i] }));
    const { error: playerError } = await supabase.from("players").upsert(playerUpdates);
    if (playerError) { toast.error("Failed to assign roles."); return; }
    await supabase.from("rooms").update({ roles_assigned: true, stage: 'night' }).eq("id", roomData.id);
    setRoomData(prev => ({ ...prev, roles_assigned: true, stage: 'night' }));
  };

  // --- Render Logic ---
  if (!roomData || !isLoaded || !players.length) {
    return <div className="h-screen w-full flex items-center justify-center bg-slate-900">Loading Game...</div>;
  }

  if (!roomData.roles_assigned) {
    // Role Assignment Screen
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-slate-900/80 backdrop-blur-lg z-50 flex items-center justify-center">
        <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-700/50 max-w-md mx-4 text-center">
          {user?.id === roomData.host_id ? (
            <>
              <GiWolfHowl className="text-purple-400 text-6xl mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-200 mb-2">Ready to Assign Roles?</h3>
              <p className="text-slate-400 mb-4">Distribute roles to all players to begin.</p>
              <AnimatedTooltipPeople people={players} />
              <motion.button onClick={ApplyingRoles} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full mt-4 bg-purple-600 text-white font-bold py-3 px-6 rounded-xl">
                Apply Roles & Start Game
              </motion.button>
            </>
          ) : (
            <>
              <FaHourglass className="text-amber-400 text-5xl mx-auto mb-4 animate-spin" />
              <h3 className="text-2xl font-bold text-slate-200 mb-3">Please Wait</h3>
              <p className="text-slate-400 text-lg">The host is assigning roles...</p>
            </>
          )}
        </motion.div>
      </motion.div>
    );
  }

  // --- Main Game UI ---
  return (
    <>
      <Toaster />
      {isRoleModalOpen && currentPlayer?.role && (
        <RoleRevealModal role={currentPlayer.role} onClose={() => setIsRoleModalOpen(false)} />
      )}
      {nightResult && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={() => setNightResult(null)}>
          <div onClick={(e) => e.stopPropagation()} className="relative bg-slate-800 p-8 rounded-lg shadow-lg text-center border border-slate-700">
            <button onClick={() => setNightResult(null)} className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors"><FaTimes size={22} /></button>
            <h2 className="text-2xl font-bold text-slate-200 mb-4">The Night Is Over...</h2>
            {nightResult.killed ? (
              <div className="flex items-center justify-center gap-4 text-red-400"><GiDeathSkull size={40} /><p className="text-xl">{nightResult.killed} was killed.</p></div>
            ) : nightResult.saved ? (
              <div className="flex items-center justify-center gap-4 text-green-400"><GiHeartShield size={40} /><p className="text-xl">{nightResult.saved} was attacked, but the Doctor saved them!</p></div>
            ) : (
              <p className="text-xl text-slate-300">The night was quiet. No one was attacked.</p>
            )}
          </div>
        </motion.div>
      )}
      <GameNavbar roomData={roomData} uid={uid} currentPlayerId={currentPlayer?.player_id} players={players} />
      <div className="flex h-auto pb-30 min-h-[90%] w-full justify-between flex-col md:flex-row gap-4">
        <SidePlayers players={players} />
        <GameBox roomData={roomData} players={players} currentPlayerId={currentPlayer?.id} />
        <div className="chat">
          {roomData.stage === "day" && currentPlayer && (
            <PlayersChat roomID={roomData.id} playerID={currentPlayer?.id} playerName={currentPlayer?.name} is_alive={currentPlayer?.is_alive} player_role={currentPlayer?.role} />
          )}
        </div>
      </div>
      <GameActionsBar roomId={roomData.id} roomInfo={roomData} playerInfo={currentPlayer} players={players} />
      {winner && <GameWinner winner={winner} playerID={currentPlayer?.id} clerkId={user?.id} currentPlayerRole={currentPlayer?.role} />}
    </>
  );
}
