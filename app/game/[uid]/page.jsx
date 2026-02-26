"use client";

export const dynamic = "force-dynamic";

// --- Import Core Libraries ---
import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";

// --- Import Icons & Utils ---
import {
  FaHourglass,
  FaTimes,
  FaGavel,
  FaUsers,
  FaGamepad,
  FaSun,
  FaMoon,
} from "react-icons/fa";

import {
  GiWolfHowl,
  GiHeartShield,
  GiDeathSkull,
  GiTiedScroll,
} from "react-icons/gi";

import { supabase } from "@/lib/supabase";
import {
  kill,
  seePlayer,
  savePlayer,
  voting,
  getAIVoteTarget,
  botConversation,
} from "@/utils/botsActions";
import { trackUserConnectivity } from "@/utils/trackUserconnectivity";
import { HowlSound, HeavyPainSound } from "@/utils/sounds";

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

const GameBox = dynamic(() => import("@/components/gameBox"), {
  ssr: false,
});

const NewRoleCard = dynamic(() => import("@/components/ui/NewRoleCard"), {
  ssr: false,
});

const TurnTimer = dynamic(() => import("@/components/ui/TurnTimer"), {
  ssr: false,
});

const StageResult = dynamic(() => import("@/components/ui/stageResult"), {
  ssr: false,
});

const CheatMenu = dynamic(() => import("@/components/CheatMenu"), {
  ssr: false,
});

const RoleAssignmentView = dynamic(() => import("@/components/RoleAssignmentView"), {
  ssr: false,
});

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
  const [gameStartCountdown, setGameStartCountdown] = useState(0);
  const [showDeathEffect, setShowDeathEffect] = useState(false);

  const hasShownRoleModal = useRef(false);
  const prevStageRef = useRef();
  const playersAtStageStart = useRef([]);
  const rolesAssignedTime = useRef(0);

  // Enhanced mobile view state with better breakpoint handling
  const [mobileView, setMobileView] = useState("game");
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [isMobile, setIsMobile] = useState(false);

  // Window size tracking for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setWindowSize({ width, height });
      setIsMobile(width < 1024); // lg breakpoint
    };

    // Initial call
    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const upsertPlayer = async (roomId, currentUser) => {
    if (!supabase || !currentUser || !roomId) return;
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
      if (!supabase) return;
      try {
        const { data: room, error: roomError } = await supabase
          .from("rooms")
          .select("*")
          .eq("code", uid)
          .single();

        if (roomError || !room) {
          console.error("Error fetching room", roomError);
          toast.error("Failed to load game room");
          return;
        }

        setRoomData(room);
        prevStageRef.current = room.stage;

        if (user) {
          await upsertPlayer(room.id, user);
        }

        let { data: initialPlayers, error: playersError } = await supabase
          .from("players")
          .select("*")
          .eq("room_id", room.id)
          .order("id", { ascending: true });

        if (playersError) {
          console.error("Error fetching players", playersError);
          toast.error("Failed to load players");
          return;
        }

        // Enrich players with level data from player_stats
        const humanPlayerIds = initialPlayers.filter(p => p.is_human && p.player_id).map(p => p.player_id);
        if (humanPlayerIds.length > 0) {
          const { data: stats } = await supabase
            .from("player_stats")
            .select("player_id, level")
            .in("player_id", humanPlayerIds);

          if (stats) {
            const levelMap = {};
            stats.forEach(s => { levelMap[s.player_id] = s.level || 1; });
            initialPlayers = initialPlayers.map(p => ({
              ...p,
              level: levelMap[p.player_id] || 1,
            }));
          }
        }

        setPlayers(initialPlayers);
        playersAtStageStart.current = initialPlayers;
      } catch (error) {
        console.error("Initialization error:", error);
        toast.error("Failed to initialize game");
      }
    };

    if (isLoaded) {
      initializeGame();
    }
  }, [uid, isLoaded, user]);

  // --- Real-time Subscriptions ---
  useEffect(() => {
    if (!roomData?.id || !supabase) return;

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
          try {
            if (payload.eventType === "INSERT") {
              setPlayers((p) => [...p, payload.new]);
            }
            if (payload.eventType === "UPDATE") {
              setPlayers((p) =>
                p.map((player) =>
                  player.id === payload.new.id ? payload.new : player
                )
              );
            }
            if (payload.eventType === "DELETE") {
              setPlayers((p) =>
                p.filter((player) => player.id !== payload.old.id)
              );
            }
          } catch (error) {
            console.error("Players subscription error:", error);
          }
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
          try {
            setRoomData((prev) => ({ ...prev, ...payload.new }));
          } catch (error) {
            console.error("Room subscription error:", error);
          }
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
    if (user && players.length > 0) {
      const player = players.find((p) => p.player_id === user.id);
      setCurrentPlayer(player || null);
    }
  }, [user, players]);

  // --- Instant Death Detection (via real-time subscription) ---
  const wasAliveRef = useRef(true);
  useEffect(() => {
    if (!currentPlayer) return;

    const wasAlive = wasAliveRef.current;
    const isNowDead = currentPlayer.is_alive === false;

    if (wasAlive && isNowDead && roomData?.stage === "night") {
      // Player just died during the night — show effect immediately
      setShowDeathEffect(true);
      HeavyPainSound();
      setTimeout(() => setShowDeathEffect(false), 5000);
    }

    wasAliveRef.current = currentPlayer.is_alive;
  }, [currentPlayer?.is_alive, roomData?.stage]);

  useEffect(() => {
    if (roomData?.id && user?.id) {
      const interval = trackUserConnectivity(
        roomData.id,
        user.id,
        roomData.host_id
      );
      return () => clearInterval(interval);
    }
  }, [roomData?.id, user?.id, roomData?.host_id]);

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

  const runBotsActions = (currentPlayers) => {
    const bots = currentPlayers.filter((p) => !p.is_human);
    bots.forEach(async (bot) => {
      if (bot.is_action_done || !bot.is_alive) return;

      const alivePlayers = currentPlayers.filter((p) => p.is_alive);
      const potentialTargets = alivePlayers.filter((p) => p.id !== bot.id);

      if (potentialTargets.length === 0) return;

      const randomTarget =
        potentialTargets[Math.floor(Math.random() * potentialTargets.length)];

      try {
        if (roomData.stage === "day") {
          // AI picks the vote target
          const aiTarget = await getAIVoteTarget(bot, alivePlayers);
          const finalDayTarget = aiTarget || randomTarget;
          await voting(bot, finalDayTarget);
          // Bot sends 1-3 messages with delays
          botConversation(bot, roomData.id, currentPlayers, finalDayTarget);
        } else if (roomData.stage === "night") {
          // --- Timer: Doctor/Seer act early, Wolf acts after them ---
          const OTHER_BOT_DELAY = Math.floor(Math.random() * 3000) + 2000; // 2-5s
          const WOLF_DELAY = 7000; // 7s — gives doctor time to save first

          const timeSinceAssignment = Date.now() - rolesAssignedTime.current;
          const SAFETY_BUFFER = 15000;

          let actionDelay = bot.role === "wolf" ? WOLF_DELAY : OTHER_BOT_DELAY;

          if (timeSinceAssignment < SAFETY_BUFFER && roomData.round === 1) {
            const remainingSafety = SAFETY_BUFFER - timeSinceAssignment;
            actionDelay = Math.max(actionDelay, remainingSafety + 1000);
          }
          console.log(`🤖 Bot ${bot.role} scheduled in ${actionDelay}ms`);

          setTimeout(async () => {
            const { data: updatedPlayers } = await supabase
              .from('players')
              .select('*')
              .eq('room_id', roomData.id);

            if (!updatedPlayers) return;

            const currentAlivePlayers = updatedPlayers.filter((p) => p.is_alive);
            let currentTargets = currentAlivePlayers.filter(
              (p) => p.id !== bot.id
            );

            if (currentTargets.length === 0) return;

            const finalTarget =
              currentTargets[Math.floor(Math.random() * currentTargets.length)];

            if (bot.role === "wolf") {
              // Wolf ALWAYS attacks. If doctor saved the target, the kill() 
              // function still fires but the night->day transition will detect 
              // is_saved and report "saved" instead of "killed".
              console.log(`🐺 Wolf attacking ${finalTarget.name}`);
              await kill(bot, finalTarget, roomData.id);
            }
            else if (bot.role === "seer") await seePlayer(bot, finalTarget);
            else if (bot.role === "doctor") await savePlayer(bot, finalTarget);
          }, actionDelay);
        }
      } catch (error) {
        console.error("Bot action error:", error);
      }
    });
  };

  // --- REVISED AND FIXED STAGE CHANGE LOGIC ---
  useEffect(() => {
    const processStageChange = async () => {
      if (!roomData || roomData.stage === prevStageRef.current) {
        return;
      }

      try {
        const { data: currentPlayers, error } = await supabase
          .from("players")
          .select("*")
          .eq("room_id", roomData.id);

        if (error) {
          console.error("Failed to fetch players on stage change:", error);
          return;
        }

        if (prevStageRef.current === "night" && roomData.stage === "day") {
          const killedPlayer = playersAtStageStart.current.find(
            (p) => p.is_alive && !currentPlayers.find((p2) => p2.id === p.id)?.is_alive
          );

          console.log("☠️ Death Check:", { killedPlayer, prevStage: prevStageRef.current, currentStage: roomData.stage });

          const savedPlayer = currentPlayers.find((p) => p.is_saved);

          if (killedPlayer) {
            setNightResult({ killed: { name: killedPlayer.name } });
          } else if (savedPlayer) {
            // Need to find who the wolf targeted (victim) to show "Wolf attacked X, but Doctor saved X"
            // Since we don't store "who wolf attacked" in a separate column if they were saved, 
            // and the wolf attack technically "failed", we might infer it or just show the saved player's name.
            // For now, we'll assume the saved player was the target.
            setNightResult({ saved: { victim: savedPlayer.name, savior: "Doctor" } });
          } else {
            setNightResult({ quiet: true });
          }
        }

        if (prevStageRef.current === "day" && roomData.stage === "night") {
          // --- NEW LOGIC: Calculate votes client-side to ensure immediate feedback ---
          const votes = {};
          currentPlayers.forEach(p => {
            if (p.voted_to) {
              votes[p.voted_to] = (votes[p.voted_to] || 0) + 1;
            }
          });

          // Find max votes
          let maxVotes = 0;
          let candidateId = null;
          let isTie = false;
          let tiedPlayersIds = [];

          for (const [pid, count] of Object.entries(votes)) {
            if (count > maxVotes) {
              maxVotes = count;
              candidateId = pid;
              isTie = false;
              tiedPlayersIds = [pid];
            } else if (count === maxVotes) {
              isTie = true;
              tiedPlayersIds.push(pid);
            }
          }

          if (maxVotes > 0) {
            if (isTie) {
              const tiedNames = tiedPlayersIds.map(id => currentPlayers.find(p => p.id === parseInt(id))?.name).filter(Boolean);
              setDayResult({ tie: { tiedPlayers: tiedNames, count: maxVotes } });
            } else {
              const eliminated = currentPlayers.find(p => p.id === parseInt(candidateId));
              if (eliminated) {
                setDayResult({ eliminated: { name: eliminated.name, count: maxVotes } });

                if (user?.id === roomData.host_id) {
                  supabase.from("players").update({ is_alive: false, dying_method: "vote" }).eq("id", eliminated.id).then();
                }
              }
            }
          } else {
            setDayResult({ noOneEliminated: true });
          }
        }

        if (user?.id === roomData.host_id) {
          const handleNewTurn = async () => {
            try {
              if (roomData.stage === "night") {
                await supabase
                  .from("rooms")
                  .update({
                    round: roomData.round + 1,
                    wolf_killed: false
                  })
                  .eq("id", roomData.id);
              }

              const playerUpdatePromises = currentPlayers.map((p) => {
                const updateData = { is_action_done: false, voted_to: null };
                if (roomData.stage === "night") {
                  updateData.is_saved = false;
                }
                return supabase.from("players").update(updateData).eq("id", p.id);
              });

              await Promise.all(playerUpdatePromises);

              // update local players to reflect the DB change so bots know they can act
              const nextTurnPlayers = currentPlayers.map(p => ({
                ...p,
                is_action_done: false,
                voted_to: null,
                is_saved: roomData.stage === "night" ? false : p.is_saved,
              }));

              runBotsActions(nextTurnPlayers);
            } catch (error) {
              console.error("Handle new turn error:", error);
            }
          };
          handleNewTurn();
        }

        prevStageRef.current = roomData.stage;
        playersAtStageStart.current = currentPlayers;
      } catch (error) {
        console.error("Process stage change error:", error);
      }
    };

    processStageChange();
  }, [roomData?.stage, roomData?.id, roomData?.host_id, user?.id, roomData?.round]);

  useEffect(() => {
    // Game start countdown logic removed to fix stuck screen issue
  }, []);

  // --- Main Game Logic (Winner Check & Role Modal) ---
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

    const isGameActive = roomData.stage === "day" || roomData.stage === "night";

    // --- AUTO-END DAY PHASE ---
    if (roomData.stage === "day" && user?.id === roomData.host_id) {
      const alivePlayers = players.filter(p => p.is_alive);
      // Only check if everyone has actually voted (voted_to is set)
      const allVoted = alivePlayers.every(p => p.voted_to);

      if (allVoted && alivePlayers.length > 0) {
        // Everyone has voted. End the day immediately.
        console.log("⚡ All players have voted. Auto-ending Day phase.");
        supabase
          .from("rooms")
          .update({ stage: "night" })
          .eq("id", roomData.id)
          .then();
      }
    }
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
  }, [players, currentPlayer, roomData?.stage, roomData?.round]);

  // --- Core Game Functions ---
  const ApplyingRoles = async () => {
    try {
      const baseRoles = ["wolf", "seer", "doctor"];
      while (baseRoles.length < players.length) {
        baseRoles.push("villager");
      }
      const shuffled = baseRoles.sort(() => Math.random() - 0.5);
      const playerUpdates = players.map((player, i) => {
        const { level, ...dbPlayer } = player; // strip client-only fields not in players table
        return {
          ...dbPlayer,
          role: shuffled[i],
          is_alive: true,
          is_action_done: false,
          is_saved: false,
          dying_method: null,
          voted_to: null,
          last_seen_role: null,
        };
      });

      // Optimistic update for players — must include ALL reset fields, not just role
      setPlayers(prev => prev.map((player, i) => ({
        ...player,
        role: shuffled[i],
        is_alive: true,
        is_action_done: false,
        is_saved: false,
        dying_method: null,
        voted_to: null,
        last_seen_role: null,
      })));

      // --- Track assignment time for bot safety ---
      rolesAssignedTime.current = Date.now();
      console.log(`🎲 Roles Assigned at ${rolesAssignedTime.current} (Safety until ${rolesAssignedTime.current + 15000})`);

      const { error: playerError } = await supabase
        .from("players")
        .upsert(playerUpdates);

      if (playerError) {
        toast.error("Failed to assign roles.");
        return;
      }

      // Add a small delay to ensure DB propagation and bot subscription catch-up
      await new Promise(r => setTimeout(r, 500));

      // Optimistic update for room data - force UI transition immediately
      setRoomData((prev) => ({ ...prev, roles_assigned: true, stage: "night", round: 1 }));
      setShowDeathEffect(false); // Reset death effect on new game
      wasAliveRef.current = true; // Reset alive tracking for new game

      await supabase
        .from("rooms")
        .update({ roles_assigned: true, stage: "night", sound: "howl", round: 1 })
        .eq("id", roomData.id);
    } catch (error) {
      console.error("Apply roles error:", error);
      toast.error("Failed to apply roles");
    }
  };

  // --- Loading State ---
  if (!roomData || !isLoaded || !players.length) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white px-4">
        <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-lg sm:text-xl font-semibold">Loading Game...</p>
        <p className="text-slate-400 text-sm sm:text-base">Please wait a moment.</p>
      </div>
    );
  }

  // --- Role Assignment Screen ---
  if (!roomData.roles_assigned) {
    return (
      <RoleAssignmentView
        isHost={user?.id === roomData.host_id}
        players={players}
        onAssignRoles={ApplyingRoles}
      />
    );
  }

  // --- Main Game UI ---
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col relative overflow-hidden">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1f2937",
            color: "#fff",
            borderRadius: "8px",
            border: "1px solid #334155",
            fontSize: "14px",
          },
        }}
      />

      <AnimatePresence>
        {isRoleModalOpen && currentPlayer?.role && (
          <NewRoleCard
            key="role-reveal-modal"
            role={currentPlayer.role}
            onClose={() => setIsRoleModalOpen(false)}
          />
        )}

        {nightResult && (
          <StageResult
            key="stage-result-modal"
            result={nightResult}
            onClose={() => setNightResult(null)}
            type="night"
          />
        )}



        {dayResult && (
          <StageResult
            result={dayResult}
            onClose={() => setDayResult(null)}
            type="day"
          />
        )}

        {/* Death Effect Overlay */}
        <AnimatePresence>
          {showDeathEffect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
            >
              {/* Blood Vignette */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(180,0,0,0.6)_80%,rgba(100,0,0,0.9)_100%)] mix-blend-multiply" />

              {/* Red Flash */}
              <motion.div
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute inset-0 bg-red-600 mix-blend-overlay"
              />

              {/* Text */}
              <motion.div
                initial={{ scale: 2, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="relative z-10 flex flex-col items-center"
              >
                <GiDeathSkull className="text-9xl text-red-600 drop-shadow-[0_0_30px_rgba(255,0,0,0.8)] mb-4" />
                <h1 className="text-8xl font-black text-red-600 tracking-widest uppercase drop-shadow-[0_0_10px_rgba(0,0,0,1)]"
                  style={{ fontFamily: 'serif' }}>
                  KILLED
                </h1>
                <p className="text-2xl text-red-200 mt-2 font-serif italic opacity-80">
                  The Wolf has claimed your soul
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </AnimatePresence>

      {/* Navbar */}
      <div className="flex-shrink-0">
        <GameNavbar
          roomData={roomData}
          uid={uid}
          currentPlayerId={currentPlayer?.player_id}
          players={players}
        />
      </div>

      {/* Main Game Content */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0 relative">
        {/* Mobile Layout */}
        {isMobile ? (
          <>
            {/* Mobile Game Area */}
            <div className="flex-1 min-h-0 order-1">
              {mobileView === "game" && (
                <div className="h-full">
                  <GameBox
                    roomData={roomData}
                    players={players}
                    currentPlayerId={currentPlayer?.id}
                  />
                </div>
              )}

              {mobileView === "players" && (
                <div className="h-full overflow-hidden">
                  <SidePlayers players={players} />
                </div>
              )}

              {mobileView === "chat" && (
                <div className="h-full flex flex-col">
                  {roomData.stage === "day" && currentPlayer?.is_alive ? (
                    <PlayersChat
                      roomID={roomData.id}
                      playerID={currentPlayer?.id}
                      playerName={currentPlayer?.name}
                      is_alive={currentPlayer?.is_alive}
                      player_role={currentPlayer?.role}
                    />
                  ) : (
                    <div className="h-full w-full bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-400 p-4 text-center mx-2 my-2">
                      <p className="text-sm">
                        Chat is only available for alive players during the day.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Desktop Layout */
          <>
            {/* Left Sidebar - Players */}
            <div className="w-64 xl:w-72 flex-shrink-0 border-r border-slate-700/50">
              <SidePlayers players={players} />
            </div>

            {/* Center - Game Board */}
            <div className="flex-1 min-w-0">
              <GameBox
                roomData={roomData}
                players={players}
                currentPlayerId={currentPlayer?.id}
              />
            </div>

            {/* Right Sidebar - Chat */}
            <div className="w-72 xl:w-80 flex-shrink-0 border-l border-slate-700/50 flex flex-col">
              {roomData.stage === "day" && currentPlayer?.is_alive ? (
                <PlayersChat
                  roomID={roomData.id}
                  playerID={currentPlayer?.id}
                  playerName={currentPlayer?.name}
                  is_alive={currentPlayer?.is_alive}
                  player_role={currentPlayer?.role}
                />
              ) : (
                <div className="h-full w-full bg-slate-800/50 flex items-center justify-center text-slate-400 p-4 text-center m-2 rounded-lg">
                  <p className="text-sm">
                    Chat is only available for alive players during the day.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Actions Bar */}
      <div className="flex-shrink-0">
        <GameActionsBar
          roomId={roomData.id}
          roomInfo={roomData}
          playerInfo={currentPlayer}
          players={players}
          mobileView={mobileView}
          setMobileView={setMobileView}
          isRoleModalOpen={isRoleModalOpen}
        />
      </div>

      {/* Winner Modal */}
      {winner && (
        <GameWinner
          winner={winner}
          playerID={currentPlayer?.id}
          clerkId={user?.id}
          currentPlayerRole={currentPlayer?.role}
          currentPlayerAlive={currentPlayer?.is_alive}
          roomCode={uid}
          rounds={roomData?.round || 1}
          playerCount={players.length}
        />
      )}

      {/* Dev Cheat Menu */}
      <CheatMenu
        roomData={roomData}
        players={players}
        currentPlayer={currentPlayer}
        setShowDeathEffect={setShowDeathEffect}
        setIsRoleModalOpen={setIsRoleModalOpen}
        setWinner={setWinner}
      />
    </div>
  );
}