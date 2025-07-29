"use client";

// --- Import Core Libraries ---
import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";

// --- Import Icons & Utils ---
import {
  FaHourglass,
  FaTimes,
  FaGavel,
  FaUsers,
  FaGamepad,
} from "react-icons/fa";
import { GiWolfHowl, GiHeartShield, GiDeathSkull } from "react-icons/gi";
import { supabase } from "@/lib/supabase";
import {
  kill,
  seePlayer,
  savePlayer,
  voting,
  messaging,
} from "@/utils/botsActions";
import { trackUserConnectivity } from "@/utils/trackUserconnectivity";
import { HowlSound } from "@/utils/sounds";

// --- Import UI Components ---
import GameNavbar from "@/components/blocks/game-navbar";
import GameActionsBar from "@/components/blocks/game-actions-bar";
import PlayersChat from "@/components/chat";
import { AnimatedTooltipPeople } from "@/components/tooltip";

// --- Dynamically Import Components ---
const SidePlayers = dynamic(() => import("@/components/sidePlayers"), {
  ssr: false,
});
const GameWinner = dynamic(() => import("@/components/winnerModal"), {
  ssr: false,
});

// --- Enhanced Game Box Component ---
const EnhancedGameBox = ({ roomData, players, currentPlayerId }) => {
  const [positions, setPositions] = useState({});
  const containerRef = useRef(null);

  const dayBackground = "/assets/images/day.png";
  const nightBackground = "/assets/images/night.png";

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

    return () => clearInterval(interval);
  }, [roomData.stage, players]);

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
        {/* Overlay for better contrast */}
        <div
          className={`absolute inset-0 transition-colors duration-1000 ${
            isNight ? "bg-black/40" : "bg-blue-300/10"
          }`}
        />

        {/* Stage indicator */}
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

        {/* Players count indicator */}
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

                  {/* Death overlay */}
                  {!player.is_alive && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <GiDeathSkull className="text-red-400 text-3xl" />
                    </div>
                  )}
                </div>

                {/* Player name */}
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

                {/* Action indicators */}
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

        {/* Center game info */}
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

// --- Enhanced Role Reveal Modal ---
const RoleRevealModal = ({ role, onClose }) => (
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
  const [dayResult, setDayResult] = useState(null);

  const hasShownRoleModal = useRef(false);
  const prevStageRef = useRef();
  const playersRef = useRef(players);
  const prevPlayersRef = useRef(players);

  // ✅ NEW STATE: Manages which view ('game', 'players', or 'chat') is active on mobile
  const [mobileView, setMobileView] = useState("game");

  // --- Side Effects to keep refs updated ---
  useEffect(() => {
    prevPlayersRef.current = playersRef.current;
    playersRef.current = players;
  }, [players]);

  const upsertPlayer = async (roomId, currentUser) => {
    if (!currentUser || !roomId) return;
    try {
      const { data: playerStat } = await supabase
        .from("player_stats")
        .select("avatar,username")
        .eq("player_id", currentUser.id)
        .single();
      const playerData = {
        room_id: roomId,
        name: playerStat?.username || currentUser.fullName,
        profile: playerStat?.avatar || currentUser.imageUrl,
        player_id: currentUser.id,
        is_human: true,
        last_seen: new Date().toISOString(),
      };
      await supabase
        .from("players")
        .upsert(playerData, { onConflict: "player_id" });
    } catch (error) {
      console.error("Error in upsertPlayer on Game page:", error);
    }
  };

  // --- Data Fetching and Initialization ---
  useEffect(() => {
    const initializeGame = async () => {
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", uid)
        .single();
      if (roomError || !room) {
        console.error("Error fetching room", roomError);
        return;
      }
      setRoomData(room);
      if (user) {
        await upsertPlayer(room.id, user);
      }
      const { data: initialPlayers, error: playersError } = await supabase
        .from("players")
        .select("*")
        .eq("room_id", room.id)
        .order("id", { ascending: true });
      if (playersError) {
        console.error("Error fetching players", playersError);
        return;
      }
      setPlayers(initialPlayers);
    };
    if (isLoaded) {
      initializeGame();
    }
  }, [uid, isLoaded, user]);

  // --- Real-time Subscriptions ---
  useEffect(() => {
    if (!roomData?.id) return;
    const playersSubscription = supabase
      .channel(`game-players-${roomData.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${roomData.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT")
            setPlayers((p) => [...p, payload.new]);
          if (payload.eventType === "UPDATE")
            setPlayers((p) =>
              p.map((player) =>
                player.id === payload.new.id ? payload.new : player
              )
            );
          if (payload.eventType === "DELETE")
            setPlayers((p) =>
              p.filter((player) => player.id !== payload.old.id)
            );
        }
      )
      .subscribe();

    const roomSubscription = supabase
      .channel(`game-room-${roomData.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomData.id}`,
        },
        (payload) => {
          setRoomData((prev) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(playersSubscription);
      supabase.removeChannel(roomSubscription);
    };
  }, [roomData?.id]);

  // --- Derived State ---
  useEffect(() => {
    if (user && players.length > 0)
      setCurrentPlayer(players.find((p) => p.player_id === user.id) || null);
  }, [user, players]);

  useEffect(() => {
    if (roomData?.id && user?.id) {
      const interval = trackUserConnectivity(
        roomData.id,
        user.id,
        roomData.host_id
      );
      return () => clearInterval(interval);
    }
  }, [roomData?.id, user?.id]);

  useEffect(() => {
    if (roomData?.sound === "howl") {
      HowlSound();
      const timer = setTimeout(() => {
        supabase
          .from("rooms")
          .update({ sound: null })
          .eq("id", roomData.id)
          .then();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [roomData?.sound, roomData?.id]);

  const runBotsActions = () => {
    const bots = playersRef.current.filter((p) => !p.is_human);
    bots.forEach(async (bot) => {
      if (bot.is_action_done || !bot.is_alive) return;
      const alivePlayers = playersRef.current.filter((p) => p.is_alive);
      const potentialTargets = alivePlayers.filter((p) => p.id !== bot.id);
      if (potentialTargets.length === 0) return;
      const randomTarget =
        potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
      if (roomData.stage === "day") {
        await voting(bot, randomTarget, roomData.id);
        await messaging(bot, roomData.id, playersRef.current, randomTarget);
      } else if (roomData.stage === "night") {
        setTimeout(async () => {
          const currentPlayers = playersRef.current;
          const currentAlivePlayers = currentPlayers.filter((p) => p.is_alive);
          const currentTargets = currentAlivePlayers.filter(
            (p) => p.id !== bot.id
          );
          if (currentTargets.length === 0) return;
          const finalTarget =
            currentTargets[Math.floor(Math.random() * currentTargets.length)];
          if (bot.role === "wolf") await kill(bot, finalTarget, roomData.id);
          else if (bot.role === "seer") await seePlayer(bot, finalTarget);
          else if (bot.role === "doctor") await savePlayer(bot, finalTarget);
        }, Math.floor(Math.random() * 7000) + 1000);
      }
    });
  };

  // --- Game Logic ---
  useEffect(() => {
    if (!players.length || !roomData) return;
    if (
      roomData.roles_assigned &&
      !hasShownRoleModal.current &&
      currentPlayer?.role
    ) {
      setIsRoleModalOpen(true);
      hasShownRoleModal.current = true;
    }

    if (roomData.stage !== prevStageRef.current) {
      if (prevStageRef.current === "night" && roomData.stage === "day") {
        const previouslyAlive = prevPlayersRef.current.filter(
          (p) => p.is_alive
        );
        const nowAlive = playersRef.current.filter((p) => p.is_alive);
        const killedPlayer = previouslyAlive.find(
          (p) => !nowAlive.some((ap) => ap.id === p.id)
        );
        const savedPlayer = playersRef.current.find((p) => p.is_saved);

        if (killedPlayer && savedPlayer && killedPlayer.id === savedPlayer.id) {
          setNightResult({ saved: savedPlayer.name });
        } else if (killedPlayer) {
          setNightResult({ killed: killedPlayer.name });
        } else {
          setNightResult({ quiet: true });
        }
      }

      if (prevStageRef.current === "day" && roomData.stage === "night") {
        const votes = {};
        prevPlayersRef.current.forEach((p) => {
          if (p.voted_to) {
            votes[p.voted_to] = (votes[p.voted_to] || 0) + 1;
          }
        });

        let maxVotes = 0;
        let votedOutId = null;
        for (const playerId in votes) {
          if (votes[playerId] > maxVotes) {
            maxVotes = votes[playerId];
            votedOutId = playerId;
          }
        }

        const votedOutPlayer = prevPlayersRef.current.find(
          (p) => p.id === parseInt(votedOutId)
        );
        if (votedOutPlayer) {
          supabase
            .from("players")
            .update({ is_alive: false })
            .eq("id", votedOutPlayer.id)
            .then();
          setDayResult({ eliminated: votedOutPlayer.name });
        } else {
          setDayResult({ noOneEliminated: true });
        }
      }

      if (currentPlayer?.player_id === roomData.host_id) {
        const handleNewTurn = async () => {
          if (roomData.stage === "night") {
            await supabase
              .from("rooms")
              .update({ round: roomData.round + 1 })
              .eq("id", roomData.id);
          }
          const updates = playersRef.current.map((p) => ({
            id: p.id,
            is_action_done: false,
            is_saved: false,
            voted_to: null,
          }));
          await supabase.from("players").upsert(updates);
          runBotsActions();
        };
        handleNewTurn();
      }
    }
    prevStageRef.current = roomData.stage;

    const isGameActive = roomData.stage === "day" || roomData.stage === "night";
    const rolesAreSet = players.every((p) => p.role !== null);

    if (isGameActive && rolesAreSet && roomData.round > 0) {
      const alivePlayers = players.filter((p) => p.is_alive);
      const allWolves = players.filter((p) => p.role === "wolf");
      const allNonWolves = players.filter((p) => p.role !== "wolf");
      const aliveWolves = alivePlayers.filter((p) => p.role === "wolf");
      const aliveNonWolves = alivePlayers.filter((p) => p.role !== "wolf");

      if (alivePlayers.length > 0 && roomData.stage !== "ended") {
        if (aliveWolves.length === 0) {
          setWinner({
            team: "Villagers",
            name: "The Villagers",
            role: "villager",
            players: alivePlayers,
            enemy: allWolves,
          });
          supabase
            .from("rooms")
            .update({ stage: "ended" })
            .eq("id", roomData.id)
            .then();
        } else if (aliveNonWolves.length === 0) {
          const wolfNames = aliveWolves.map((w) => w.name).join(", ");
          setWinner({
            team: "Wolves",
            name: wolfNames,
            role: "wolf",
            players: aliveWolves,
            enemy: allNonWolves,
          });
          supabase
            .from("rooms")
            .update({ stage: "ended" })
            .eq("id", roomData.id)
            .then();
        }
      }
    }
  }, [roomData?.stage, players, currentPlayer]);

  // --- Core Game Functions ---
  const ApplyingRoles = async () => {
    const baseRoles = ["wolf", "seer", "doctor"];
    while (baseRoles.length < players.length) {
      baseRoles.push("villager");
    }
    const shuffled = baseRoles.sort(() => Math.random() - 0.5);
    const playerUpdates = players.map((player, i) => ({
      ...player,
      role: shuffled[i],
    }));
    const { error: playerError } = await supabase
      .from("players")
      .upsert(playerUpdates);
    if (playerError) {
      toast.error("Failed to assign roles.");
      return;
    }
    await supabase
      .from("rooms")
      .update({ roles_assigned: true, stage: "night", sound: "howl", round: 1 })
      .eq("id", roomData.id);
    setRoomData((prev) => ({ ...prev, roles_assigned: true, stage: "night" }));
  };

  // --- Loading State ---
  if (!roomData || !isLoaded || !players.length) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-lg font-semibold">Loading Game...</p>
        <p className="text-slate-400">Please wait a moment.</p>
      </div>
    );
  }

  // --- Role Assignment Screen ---
  if (!roomData.roles_assigned) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 lg:p-8 rounded-2xl shadow-2xl border border-slate-700/50 max-w-md w-full text-center"
        >
          {user?.id === roomData.host_id ? (
            <>
              <GiWolfHowl className="text-purple-400 text-6xl mx-auto mb-4" />
              <h3 className="text-xl lg:text-2xl font-bold text-slate-200 mb-2">
                Ready to Assign Roles?
              </h3>
              <p className="text-slate-400 mb-6 text-sm lg:text-base">
                Distribute roles to all players to begin the game.
              </p>
              <div className="mb-6">
                <AnimatedTooltipPeople people={players} />
              </div>
              <motion.button
                onClick={ApplyingRoles}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
              >
                Apply Roles & Start Game
              </motion.button>
            </>
          ) : (
            <>
              <FaHourglass className="text-amber-400 text-5xl mx-auto mb-4 animate-spin" />
              <h3 className="text-xl lg:text-2xl font-bold text-slate-200 mb-3">
                Please Wait
              </h3>
              <p className="text-slate-400 text-base lg:text-lg">
                The host is assigning roles...
              </p>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  // --- Result Modals ---
  const ResultModal = ({ title, children, onClose }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-slate-800 p-6 lg:p-8 rounded-xl shadow-2xl text-center border border-slate-700 max-w-sm w-full"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors p-1"
        >
          <FaTimes size={20} />
        </button>
        <h2 className="text-xl lg:text-2xl font-bold text-slate-200 mb-6">
          {title}
        </h2>
        {children}
      </motion.div>
    </motion.div>
  );

  // --- Main Game UI ---
  return (
    <div className="min-h-screen z-30 bg-slate-900 text-white flex flex-col">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1f2937", // slate-800
            color: "#fff",
            borderRadius: "8px",
            border: "1px solid #334155", // slate-700
          },
        }}
      />

      {/* Role Modal */}
      {isRoleModalOpen && currentPlayer?.role && (
        <RoleRevealModal
          role={currentPlayer.role}
          onClose={() => setIsRoleModalOpen(false)}
        />
      )}

      {/* Night Result Modal */}
      {nightResult && (
        <ResultModal
          title="The Night Is Over..."
          onClose={() => setNightResult(null)}
        >
          {nightResult.killed ? (
            <div className="flex flex-col items-center justify-center gap-4 text-red-400">
              <GiDeathSkull size={50} />
              <p className="text-xl font-semibold">
                {nightResult.killed} was killed.
              </p>
            </div>
          ) : nightResult.saved ? (
            <div className="flex flex-col items-center justify-center gap-4 text-green-400">
              <GiHeartShield size={50} />
              <p className="text-xl font-semibold">
                {nightResult.saved} was attacked, but saved!
              </p>
            </div>
          ) : (
            <p className="text-xl text-slate-300">
              The night was quiet. No one was attacked.
            </p>
          )}
        </ResultModal>
      )}

      {/* Day Result Modal */}
      {dayResult && (
        <ResultModal
          title="The Village Has Spoken..."
          onClose={() => setDayResult(null)}
        >
          {dayResult.eliminated ? (
            <div className="flex flex-col items-center justify-center gap-4 text-amber-400">
              <FaGavel size={45} />
              <p className="text-xl font-semibold">
                {dayResult.eliminated} has been voted out.
              </p>
            </div>
          ) : (
            <p className="text-xl text-slate-300">
              The vote was tied. No one was eliminated.
            </p>
          )}
        </ResultModal>
      )}

      <GameNavbar
        roomData={roomData}
        uid={uid}
        currentPlayerId={currentPlayer?.player_id}
        players={players}
      />

      <main className="flex-grow w-full flex relative overflow-hidden">
        {/* Left Side: Players List (Visible on larger screens) */}
        <div className="w-full order-2 lg:order-1 lg:w-64 xl:w-72 flex-shrink-0">
          <SidePlayers players={players} />
        </div>

        {/* Center: Game Board */}
        <div className="flex-grow min-w-0 order-1 lg:order-2 h-[50vh] lg:h-auto">
          <EnhancedGameBox
            roomData={roomData}
            players={players}
            currentPlayerId={currentPlayer?.id}
          />
        </div>

        {/* Right Side: Chat */}
        <div className="w-full order-3 lg:w-72 xl:w-80 flex-shrink-0 flex flex-col h-64 lg:h-auto">
          {roomData.stage === "day" && currentPlayer?.is_alive ? (
            <PlayersChat
              roomID={roomData.id}
              playerID={currentPlayer?.id}
              playerName={currentPlayer?.name}
              is_alive={currentPlayer?.is_alive}
              player_role={currentPlayer?.role}
            />
          ) : (
            <div className="h-full w-full bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-400 p-4 text-center">
              <p className="text-sm">
                Chat is only available for alive players during the day.
              </p>
            </div>
          )}
        </div>
      </main>

       {/* ✅ UPDATED: The action bar now gets the state and setter for the mobile view */}
       <GameActionsBar
        roomId={roomData.id}
        roomInfo={roomData}
        playerInfo={currentPlayer}
        players={players}
        mobileView={mobileView}
        setMobileView={setMobileView}
      />

      {winner && (
        <GameWinner
          winner={winner}
          playerID={currentPlayer?.id}
          clerkId={user?.id}
          currentPlayerRole={currentPlayer?.role}
        />
      )}
    </div>
  );
}
