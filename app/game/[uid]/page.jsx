"use client";

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

const GameBox = dynamic(() => import("@/components/gameBox"), {
  ssr: false,
});

const RoleRevealModal = dynamic(() => import("@/components/ui/rolesModal"), {
  ssr: false,
});

const StageResult = dynamic(() => import("@/components/ui/stageResult"), {
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

  const hasShownRoleModal = useRef(false);
  const prevStageRef = useRef();
  const playersAtStageStart = useRef([]);

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
        
        const { data: initialPlayers, error: playersError } = await supabase
          .from("players")
          .select("*")
          .eq("room_id", room.id)
          .order("id", { ascending: true });
          
        if (playersError) {
          console.error("Error fetching players", playersError);
          toast.error("Failed to load players");
          return;
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
          await voting(bot, randomTarget);
          await messaging(bot, roomData.id, currentPlayers, randomTarget);
        } else if (roomData.stage === "night") {
          setTimeout(async () => {
            const { data: updatedPlayers } = await supabase
              .from('players')
              .select('*')
              .eq('room_id', roomData.id);
              
            const currentAlivePlayers = updatedPlayers.filter((p) => p.is_alive);
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
          const savedPlayer = currentPlayers.find((p) => p.is_saved);

          if (killedPlayer) {
            setNightResult({ killed: killedPlayer.name });
          } else if (savedPlayer) {
            setNightResult({ saved: savedPlayer.name });
          } else {
            setNightResult({ quiet: true });
          }
        }

        if (prevStageRef.current === "day" && roomData.stage === "night") {
          const votedOutPlayer = playersAtStageStart.current.find(
            (p) => p.is_alive && !currentPlayers.find((p2) => p2.id === p.id)?.is_alive
          );

          if (votedOutPlayer) {
            setDayResult({ eliminated: votedOutPlayer.name });
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
                  .update({ round: roomData.round + 1 })
                  .eq("id", roomData.id);
              }
              
              const playerUpdatePromises = currentPlayers.map((p) => {
                const updateData = { is_action_done: false };
                if (roomData.stage === "night") {
                  updateData.is_saved = false;
                  updateData.voted_to = null;
                }
                return supabase.from("players").update(updateData).eq("id", p.id);
              });

              await Promise.all(playerUpdatePromises);
              runBotsActions(currentPlayers);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 lg:p-8 rounded-2xl shadow-2xl border border-slate-700/50 max-w-md w-full text-center"
        >
          {user?.id === roomData.host_id ? (
            <>
              <GiWolfHowl className="text-purple-400 text-4xl sm:text-5xl lg:text-6xl mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-200 mb-2">
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
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-colors text-sm sm:text-base"
              >
                Apply Roles & Start Game
              </motion.button>
            </>
          ) : (
            <>
              <FaHourglass className="text-amber-400 text-4xl sm:text-5xl mx-auto mb-4 animate-spin" />
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-200 mb-3">
                Please Wait
              </h3>
              <p className="text-slate-400 text-sm sm:text-base lg:text-lg">
                The host is assigning roles...
              </p>
            </>
          )}
        </motion.div>
      </div>
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
          <RoleRevealModal
            role={currentPlayer.role}
            onClose={() => setIsRoleModalOpen(false)}
          />
        )}

        {nightResult && (
          <StageResult
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
        />
      </div>

      {/* Winner Modal */}
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