"use client";

// Import necessary dependencies and components
import React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { FaDice, FaArrowRight, FaHourglass, FaSkull, FaEye, FaEyeSlash } from "react-icons/fa";
import { GiWolfHowl } from "react-icons/gi";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import GameNavbar from "@/components/blocks/game-navbar";
import GameActionsBar from "@/components/blocks/game-actions-bar";
import { RolesModal } from "@/components/ui/rolesModal";
import { useUser } from "@clerk/nextjs";
import { toast, Toaster } from "react-hot-toast";
import { kill, seePlayer, savePlayer, voting, messaging } from "@/utils/botsActions";
import { Countdown } from "@/components/ui/countdown";
import { trackUserConnectivity } from "@/utils/trackUserconnectivity";
import PlayersChat from "@/components/chat";
import { AnimatedTooltipPeople } from "@/components/tooltip";
import { HowlSound } from "@/utils/sounds";
import { updatePlayerState } from "@/utils/updatePlayerState";

// Dynamically import components to optimize performance (disable SSR)
const StageResult = dynamic(() => import("@/components/ui/stageResult"), { ssr: false });
const SidePlayers = dynamic(() => import("@/components/sidePlayers"), { ssr: false });
const GameBox = dynamic(() => import("@/components/gameBox"), { ssr: false });
const GameWinner = dynamic(() => import("@/components/winnerModal"), { ssr: false });

// Main Game component
export default function Game({ params }) {
  // State declarations
  const [roomId, setRoomId] = useState(""); // Stores the current room ID
  const [roomData, setRoomData] = useState({}); // Stores room data from Supabase
  const [players, setPlayers] = useState([]); // List of players in the room
  const fetchUser = useUser(); // Clerk hook to get authenticated user
  const [user, setUser] = useState(null); // Current authenticated user
  const [role_preview, setRole_preview] = useState(false); // Controls role preview modal visibility
  const [currentPlayer, setCurrentPlayer] = useState(null); // Current player's data
  const [stageResultModal, setStageResultModal] = useState(false); // Controls stage result modal visibility
  const [votingData, setVotingData] = useState([]); // Stores voting data
  const [winner, setWinner] = useState(""); // Stores the game winner
  const [winnerModal, setWinnerModal] = useState(false); // Controls winner modal visibility
  const [botsActionsStarted, setBotsActionsStarted] = useState(false); // Tracks if bot actions have started
  const [sidePlayersOpen, setSidePlayersOpen] = useState(false); // Toggles side players panel
  const [rolesAssigned, setRolesAssigned] = useState(false); // Tracks if roles are assigned

  const resolvedParams = React.use(params); // Resolve params for room code
  const { uid } = resolvedParams; // Extract room code (uid) from params

  // Set user when Clerk authentication is loaded
  useEffect(() => {
    if (fetchUser.isLoaded) {
      setUser(fetchUser.user);
    }
  }, [fetchUser]);

  // Update current player when user or players change
  useEffect(() => {
    if (user && players.length > 0) {
      const foundPlayer = players.find((player) => player.player_id === user.id);
      if (foundPlayer) {
        setCurrentPlayer(foundPlayer);
      }
    }
  }, [user, players]);

  // Subscribe to real-time room updates
  function roomsRealtimeListening(roomId) {
    const subscription = supabase
      .channel("room_listening_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`, // Filter by room ID
        },
        (payload) => {
          setRoomData(payload.new); // Update room data on change
          setRolesAssigned(payload.new.roles_assigned); // Update rolesAssigned state
        }
      )
      .subscribe();
    return () => {
      subscription.unsubscribe(); // Cleanup subscription on unmount
    };
  }

  // Fetch room data by room code
  const fetchRoomData = async () => {
    const { data: roomData, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("code", uid)
      .single();
    if (error) {
      console.log(error); // Log any errors
    }
    setRoomId(roomData?.id); // Set room ID
    setRoomData(roomData); // Set room data
    setRolesAssigned(roomData.roles_assigned); // Set rolesAssigned state
  };

  // Fetch all players in the room
  const fetchPlayers = async () => {
    if (!roomId) {
      return; // Exit if no room ID
    }
    const { data: players, error } = await supabase
      .from("players")
      .select("*")
      .eq("room_id", roomId)
      .order("joined_at", { ascending: false });
    if (error) {
      console.log(error); // Log any errors
    }
    setPlayers(players); // Update players state
  };

  // Assign roles to players
  const ApplyingRoles = async () => {
    const baseRoles = ["wolf", "seer", "doctor"]; // Base roles for the game

    // Fill remaining roles with villagers
    while (baseRoles.length < players.length) {
      baseRoles.push("villager");
    }

    // Shuffle roles randomly
    const shuffled = baseRoles.sort(() => Math.random() - 0.5);
    console.log("Shuffled roles:", shuffled);

    // Assign roles to players and update in Supabase
    for (let i = 0; i < players.length; i++) {
      const playerId = players[i].id;
      const role = shuffled[i];

      const { error } = await supabase
        .from("players")
        .update({ role })
        .eq("id", playerId);

      if (error) {
        console.log(`Error updating player ${playerId}:`, error);
      } else {
        const { error: roomAssignedRoles } = await supabase
          .from("rooms")
          .update({ roles_assigned: true })
          .eq("id", roomId);
        if (!roomAssignedRoles) {
          // console.log('Room roles updated');
        }
      }
    }
  };

  // Handle bot actions based on game stage
  const runBotsActions = () => {
    if (
      roomData &&
      players &&
      currentPlayer &&
      currentPlayer.player_id === roomData.host_id
    ) {
      const bots = players.filter((p) => !p.is_human); // Filter bot players

      if (roomData.stage === "day") {
        bots.forEach(async (bot) => {
          const alivePlayers = players.filter((p) => p.is_alive && p.id !== bot.id);
          const randomTarget = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];

          if (bot.is_action_done) return; // Skip if bot action is done
          if (bot.is_alive) {
            await voting(bot, randomTarget, roomId); // Bot votes for a random player
            await messaging(bot, roomId); // Bot sends a message
          }
        });
      }
      if (roomData.stage === "night") {
        bots.forEach(async (bot) => {
          if (bot.is_action_done) return; // Skip if bot action is done

          const alivePlayers = players.filter((p) => p.is_alive && p.id !== bot.id);
          const randomTarget = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];

          setTimeout(async () => {
            if (roomData.stage === "night") {
              if (bot.role === "wolf") {
                await kill(bot, randomTarget, roomId); // Wolf kills a random player
              } else if (bot.role === "seer") {
                await seePlayer(bot, randomTarget); // Seer sees a random player's role
              } else if (bot.role === "doctor") {
                await savePlayer(bot, randomTarget, roomId); // Doctor saves a random player
              }
            }
          }, Math.floor(Math.random() * 9000) + 1000); // Random delay for realism
        });
      }
    }
  };

  // Check for game winner and update game stage
  useEffect(() => {
    const checkWinner = async () => {
      const alivePlayers = players.filter((p) => p.is_alive); // Get alive players

      if (alivePlayers.length === 1) {
        const winner = alivePlayers[0]; // Single remaining player is the winner
        if (winner.role === "wolf") {
          setWinner(winner); // Set winner if wolf
          await supabase.from("rooms").update({ stage: "ended" }).eq("id", roomId);
        } else {
          await supabase.from("rooms").update({ stage: "ended" }).eq("id", roomId);
          setWinner(winner); // Set winner for non-wolf
        }
      } else if (alivePlayers.length > 1 && !alivePlayers.some((p) => p.role === "wolf")) {
        setWinner(winner); // Set winner if no wolves remain
      }
    };

    checkWinner();

    if (players && players.length !== 0) {
      if (
        roomData.stage === "night" &&
        currentPlayer?.player_id === roomData.host_id &&
        !botsActionsStarted
      ) {
        runBotsActions(); // Run bot actions for night phase
        setBotsActionsStarted(true); // Prevent multiple runs
      }

      if (
        roomData.stage === "day" &&
        currentPlayer?.player_id === roomData.host_id &&
        botsActionsStarted
      ) {
        runBotsActions(); // Run bot actions for day phase
        setBotsActionsStarted(false); // Reset for next cycle
      }
    }
  }, [roomData.stage, currentPlayer, players]);

  // Fetch room data on room code change
  useEffect(() => {
    fetchRoomData();
  }, [uid]);

  // Fetch players and track user connectivity
  useEffect(() => {
    fetchPlayers();
    if (roomId && user?.id && roomData.host_id) {
      trackUserConnectivity(roomId, user.id, roomData.host_id); // Track user presence
    }
  }, [roomId, user?.id, roomData.host_id]);

  // Show role preview when roles are assigned
  useEffect(() => {
    if (!roomData.roles_assigned || !players || !user?.id) return;

    const currentPlayer = players.find((player) => player.player_id === user.id);
    if (currentPlayer?.role) {
      setRole_preview(true); // Show role preview modal
    }
  }, [roomData.roles_assigned, players, user?.id]);

  // Handle stage result modal display
  useEffect(() => {
    if (roomData.stage !== "ended") {
      const savedPlayer = players.find((player) => player.is_saved);
      if (savedPlayer) {
        console.log("Player is saved: " + savedPlayer.name);
      }

      if (
        (roomData.stage === "day" && roomData.wolf_killed) ||
        players.filter((player) => player.is_saved).length > 0
      ) {
        setStageResultModal(true); // Show stage result modal
        setTimeout(() => {
          setStageResultModal(false); // Hide after 5 seconds
        }, 5000);
      }
    }
  }, [roomData.stage, players]);

  // Play sound effects and reset sound state
  useEffect(() => {
    if (roomData.sound && roomData.sound === "howl") {
      HowlSound(); // Play howl sound
    }
    setTimeout(async () => {
      await supabase.from("rooms").update({ sound: null }).eq("id", roomId); // Reset sound
    }, 5000);
  }, [roomData.sound]);

  // Subscribe to real-time player updates
  useEffect(() => {
    roomsRealtimeListening(roomId, fetchRoomData);
    playersRealtimeListening(roomId, fetchPlayers);

    // Subscribe to room updates
  const cleanupRoom = roomsRealtimeListening(roomId);
  // Subscribe to players updates
  const cleanupPlayers = playersRealtimeListening(roomId, fetchPlayers);

  // Cleanup on unmount or roomId change
  return () => {
    if (cleanupRoom) cleanupRoom();
    if (cleanupPlayers) cleanupPlayers();
  };
  }, [roomId]);

  // Render the game UI
  return (
    <>
      <Toaster /> {/* Toast notification container */}
      <div className="flex gap-2">
        {/* Debug buttons for testing roles and player state */}
        <button onClick={() => toast("Here is your toast.")}>
          Make me a toast
        </button>
        <button
          onClick={async () => {
            await supabase.from("players").update({ role: "wolf" }).eq("id", currentPlayer?.id);
          }}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
        >
          Make me wolf
        </button>
        <button
          onClick={async () => {
            await supabase.from("players").update({ role: "seer" }).eq("id", currentPlayer?.id);
          }}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full"
        >
          Make me seer
        </button>
        <button
          onClick={async () => {
            await supabase.from("players").update({ role: "villager" }).eq("id", currentPlayer?.id);
          }}
          className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-full"
        >
          Make me villager
        </button>
        <button
          onClick={async () => {
            await supabase.from("players").update({ role: "doctor" }).eq("id", currentPlayer?.id);
          }}
          className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-full"
        >
          Make me doctor
        </button>
        <button
          onClick={async () => {
            await supabase.from("players").update({ is_alive: true }).eq("id", currentPlayer?.id);
          }}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full"
        >
          Make me alive
        </button>
      </div>

      {/* Render game navbar if roles are assigned */}
      {rolesAssigned && currentPlayer && players && (
        <GameNavbar
          roomData={roomData}
          uid={uid}
          currentPlayerId={currentPlayer?.player_id}
          players={players}
        />
      )}

      <div className="flex h-auto pb-30 min-h-[90%] w-full justify-between flex-col md:flex-row gap-4">
        {/* Display voting information */}
        {players
          .filter((p) => p.voted_to != null)
          .map((player) => {
            const votedTo = players.find((p) => p.id === player.voted_to);
            return (
              <p className="text-lg" key={player.id}>
                Player {player.name} voted for {votedTo?.name}
              </p>
            );
          })}

        {/* Role assignment prompt for host */}
        {!rolesAssigned && user?.id === roomData.host_id ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-0 left-0 w-full h-full bg-slate-900 backdrop-blur-lg z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-700/50 max-w-md mx-4"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <GiWolfHowl className="text-2xl text-white" size={50} />
                </div>
                <AnimatedTooltipPeople people={players} />
                <h3 className="text-2xl font-bold text-slate-200 mb-2">
                  Ready to Assign Roles? {rolesAssigned ? "Roles are assigned" : "Not yet"}
                </h3>
                <p className="text-slate-400">
                  Distribute roles to all players to begin the game
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={ApplyingRoles}
                className="w-full group relative overflow-hidden bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 border border-purple-500/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="relative flex items-center justify-center space-x-3">
                  <FaDice className="text-lg" />
                  <span className="text-lg">Apply Roles</span>
                  <FaArrowRight className="text-sm group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.button>
            </motion.div>
          </motion.div>
        ) : (
          // Waiting prompt for non-host players
          !rolesAssigned &&
          user?.id !== roomData.host_id && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed top-0 left-0 w-full h-full bg-slate-900 backdrop-blur-lg z-50 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-700/50 max-w-md mx-4"
              >
                <div className="text-center">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full flex items-center justify-center mx-auto shadow-lg">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <FaHourglass className="text-2xl text-white" />
                      </motion.div>
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full"
                    ></motion.div>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-200 mb-3">
                    Please Wait
                  </h3>
                  <AnimatedTooltipPeople people={players} />
                  <p className="text-slate-400 text-lg leading-relaxed">
                    The host is preparing to assign roles to all players...
                  </p>
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="flex justify-center items-center space-x-1 mt-4"
                  >
                    <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )
        )}

        {/* Toggle side players panel */}
        <motion.button
          onClick={() => setSidePlayersOpen(!sidePlayersOpen)}
          className="fixed top-4 right-4 z-10 bg-white p-2 rounded-full shadow-lg"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          Open
          <GiWolfHowl className="text-2xl" />
        </motion.button>

        {/* Render side players panel */}
        {players && <SidePlayers players={players} />}

        {/* Render main game box */}
        {roomData && currentPlayer && (
          <GameBox
            roomData={roomData}
            players={players}
            currentPlayerId={currentPlayer?.id}
          />
        )}

        {/* Render chat for day phase */}
        <div className="chat">
          {roomId && roomData.stage === "day" && currentPlayer && (
            <PlayersChat
              roomID={roomId}
              playerID={currentPlayer?.id}
              playerName={currentPlayer?.name}
              is_alive={currentPlayer?.is_alive}
              player_role={currentPlayer?.role}
            />
          )}
        </div>
      </div>

      {/* Render game actions bar */}
      <GameActionsBar
        roomId={roomId}
        roomInfo={roomData}
        playerInfo={currentPlayer}
        players={players}
      />

      {/* Render stage result modal */}
      {stageResultModal && (
        <StageResult
          result={players.filter((p) => p.is_alive).length === 1 ? "Wolf won" : "Still chance"}
          players={players}
          status={currentPlayer?.is_alive}
        />
      )}

      {/* Render winner modal */}
      {winner && (
        <GameWinner
          winner={winner}
          playerID={currentPlayer?.id}
          clerkId={user?.id}
          currentPlayerRole={currentPlayer?.role}
        />
      )}
    </>
  );
}

// Subscribe to real-time player updates
function playersRealtimeListening(roomId, fetchPlayers) {
  const subscription = supabase
    .channel("players_listening_channel")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "players",
        filter: `room_id=eq.${roomId}`, // Filter by room ID
      },
      (payload) => {
        fetchPlayers(); // Refresh players on change
      }
    )
    .subscribe();
  return () => {
    subscription.unsubscribe(); // Cleanup subscription on unmount
  };
}