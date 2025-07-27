"use client";
import React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { FaDice, FaArrowRight, FaHourglass } from "react-icons/fa";
import { motion } from "framer-motion";
import { FaSkull, FaEye, FaEyeSlash } from "react-icons/fa";
import { GiWolfHowl } from "react-icons/gi";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import GameNavbar from "@/components/blocks/game-navbar";
import GameActionsBar from "@/components/blocks/game-actions-bar";
import { RolesModal } from "@/components/ui/rolesModal";
import { useUser } from "@clerk/nextjs";
import { toast, Toaster } from "react-hot-toast";
import {
  kill,
  seePlayer,
  savePlayer,
  voting,
  messaging,
} from "@/utils/botsActions";
import { Countdown } from "@/components/ui/countdown";
import { trackUserConnectivity } from "@/utils/trackUserconnectivity";
import PlayersChat from "@/components/chat";
import { AnimatedTooltipPeople } from "@/components/tooltip";

import { HowlSound } from "@/utils/sounds";

import { updatePlayerState } from "@/utils/updatePlayerState";

const StageResult = dynamic(() => import("@/components/ui/stageResult"), {
  ssr: false,
});
const SidePlayers = dynamic(() => import("@/components/sidePlayers"), {
  ssr: false,
});
const GameBox = dynamic(() => import("@/components/gameBox"), { ssr: false });
const GameWinner = dynamic(() => import("@/components/winnerModal"), {
  ssr: false,
});

export default function Game({ params }) {
  const [roomId, setRoomId] = useState("");
  const [roomData, setRoomData] = useState({});
  const [players, setPlayers] = useState([]);
  const fetchUser = useUser();
  const [user, setUser] = useState(null);
  const [role_preview, setRole_preview] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [stageResultModal, setStageResultModal] = useState(false);
  const [votingData, setVotingData] = useState([]);
  const [winner, setWinner] = useState("");
  const [winnerModal, setWinnerModal] = useState(false);
  const [botsActionsStarted, setBotsActionsStarted] = useState(false);
  const [sidePlayersOpen, setSidePlayersOpen] = useState(false);
  const [rolesAssigned,setRolesAssigned] = useState(false);

  const resolvedParams = React.use(params);

  const { uid } = resolvedParams;

  useEffect(() => {
    if (fetchUser.isLoaded) {
      setUser(fetchUser.user);
    }
  }, [fetchUser]);

  useEffect(() => {
    if (user && players.length > 0) {
      const foundPlayer = players.find(
        (player) => player.player_id === user.id
      );
      if (foundPlayer) {
        setCurrentPlayer(foundPlayer);
      }
    }
  }, [user, players]);

  function roomsRealtimeListening(roomId, fetchRoomData) {
    const subscription = supabase
      .channel("room_listening_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          //i should make a filter here
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          setRoomData(payload.new);
          if(payload.new.roles_assigned){
            setRolesAssigned(true);
          }
        }
      )
      .subscribe();
    return () => {
      subscription.unsubscribe();
    };
  }

 

  const fetchRoomData = async () => {
    const { data: roomData, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("code", uid)
      .single();
    if (error) {
      console.log(error);
    }
    setRoomId(roomData?.id);
    setRoomData(roomData);
  };

  //Fetch all players
  const fetchPlayers = async () => {
    if (!roomId) {
      return;
    }
    const { data: players, error } = await supabase
      .from("players")
      .select("*")
      .eq("room_id", roomId)
      .order("joined_at", { ascending: false });
    if (error) {
      console.log(error);
    }
    // if(players.length < 4){
    //     console.log('not enough players');
    //     return;
    // }

    setPlayers(players);
  };

  const ApplyingRoles = async () => {
    const baseRoles = ["wolf", "seer", "doctor"];

    // تأكد أن عندك عدد اللاعبين
    // if (players.length < baseRoles.length) {
    //     console.warn('عدد اللاعبين أقل من عدد الأدوار الخاصة');
    //     return;
    // }

    // 1. أكمل الأدوار بالقرويين
    while (baseRoles.length < players.length) {
      baseRoles.push("villager");
    }

    // 2. خلط الأدوار
    const shuffled = baseRoles.sort(() => Math.random() - 0.5);
    console.log("Shuffled roles:", shuffled);

    // 3. ربط كل لاعب بدوره وتحديث Supabase
    for (let i = 0; i < players.length; i++) {
      const playerId = players[i].id;
      const role = shuffled[i];

      const { error } = await supabase
        .from("players")
        .update({ role })
        .eq("id", playerId);

      if (error) {
        console.log(`خطأ في تحديث اللاعب ${playerId}:`, error);
      } else {
        const { error: roomAssignedRoles } = await supabase
          .from("rooms")
          .update({ roles_assigned: true })
          .eq("id", roomId);
        if (!roomAssignedRoles) {
          // console.log('room updaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaated');
        }
      }
    }
  };

  const runBotsActions = () => {
    if (
      roomData &&
      players &&
      currentPlayer &&
      currentPlayer.player_id == roomData.host_id
    ) {
      const bots = players.filter((p) => !p.is_human);

      if (roomData.stage == "day") {
        bots.forEach(async (bot) => {
          const alivePlayers = players.filter(
            (p) => p.is_alive && p.id !== bot.id
          );
          const randomTarget =
            alivePlayers[Math.floor(Math.random() * alivePlayers.length)];

          if (bot.is_action_done) return;
          if (bot.is_alive) {
            await voting(bot, randomTarget, roomId);
            await messaging(bot, roomId);
          }
        });
      }
      if (roomData.stage == "night") {
        console.log("bots", bots);
        bots.forEach(async (bot) => {
          if (bot.is_action_done) return;

          const alivePlayers = players.filter(
            (p) => p.is_alive && p.id !== bot.id
          );
          const randomTarget =
            alivePlayers[Math.floor(Math.random() * alivePlayers.length)];

          setTimeout(async () => {
            if (roomData.stage === "night") {
              if (bot.role === "wolf") {
                await kill(bot, randomTarget, roomId);
              } else if (bot.role === "seer") {
                await seePlayer(bot, randomTarget);
              } else if (bot.role === "doctor") {
                await savePlayer(bot, randomTarget, roomId);
              }

              // ✅ Mark bot action as done
              // await supabase.from('players').update({ is_action_done: true }).eq('id', bot.id);
            }
          }, Math.floor(Math.random() * 9000) + 1000);
        });
      }
    }
  };

  useEffect(() => {
    const checkWinner = async () => {
      // **Change 1:** Filter the players array only once and store the result in a variable
      const alivePlayers = players.filter((p) => p.is_alive);

      // **Change 2:** Simplify the condition to check if only one player is alive
      if (alivePlayers.length === 1) {
        // **Change 3:** Since there is only one alive player, we can directly access it using alivePlayers[0]
        const winner = alivePlayers[0];
        console.log("wolf wins");
        // **Change 4:** Check the role of the winner and set the winner accordingly
        if (winner.role === "wolf") {
          setWinner(winner);
          await supabase
            .from("rooms")
            .update({ stage: "ended" })
            .eq("id", roomId);
        } else {
          await supabase
            .from("rooms")
            .update({ stage: "ended" })
            .eq("id", roomId);
          setWinner(winner);
        }
      }
      // **Change 5:** Simplify the condition to check if there are more than one alive players and none of them are wolves
      else if (
        alivePlayers.length > 1 &&
        !alivePlayers.some((p) => p.role === "wolf")
      ) {
          setWinner(winner);
      }
    };

    checkWinner();

    if (players && players.length !== 0) {
      console.log(
        "players alive is" + players.filter((p) => p.is_alive).length
      );
      if (
        roomData.stage === "night" &&
        currentPlayer?.player_id === roomData.host_id &&
        !botsActionsStarted
      ) {
        runBotsActions();
        setBotsActionsStarted(true); // ✅ شغّل مرة واحدة فقط في هذه المرحلة
      }

      if (
        roomData.stage === "day" &&
        currentPlayer?.player_id === roomData.host_id &&
        botsActionsStarted
      ) {
        runBotsActions();
        setBotsActionsStarted(false); // ✅ لما يرجع للنهار، خليه مستعد للجولة التالية
      }
    }
  }, [roomData.stage, currentPlayer, players]);

  useEffect(() => {
    fetchRoomData();
  }, [uid]);

  useEffect(() => {
    fetchPlayers();
    if (roomId && user?.id && roomData.host_id) {
      trackUserConnectivity(roomId, user.id, roomData.host_id);
    }
  }, [roomId, user?.id, roomData.host_id]);

  useEffect(() => {
    if (!roomData.roles_assigned || !players || !user?.id) return;

    const currentPlayer =
      players && players.find((player) => player.player_id === user.id);
    if (currentPlayer?.role) {
      setRole_preview(true);
    }
  }, [roomData.roles_assigned, players.role, user?.id]);

  useEffect(() => {
    if (roomData.stage !== "ended") {
      const savedPlayer = players
        ? players.find((player) => player.is_saved)
        : [];
      if (savedPlayer) {
        console.log("player is saved" + savedPlayer.name);
      }

      if (
        (roomData.stage === "day" && roomData.wolf_killed) ||
        players.filter((player) => player.is_saved).length > 0
      ) {
        setStageResultModal(true);
        setTimeout(() => {
          setStageResultModal(false);
        }, 5000);
      }
    }
  }, [roomData.stage]);

  //Listen to room sounds
  useEffect(() => {
    if (roomData.sound && roomData.sound === "howl") {
      HowlSound();
    }
    setTimeout(async () => {
      await supabase.from("rooms").update({ sound: null }).eq("id", roomId);
    }, 5000);
  }, [roomData.sound]);

  //Fetching the voting data from voting table

  // Listen to changes in the room and fetch the new data

  useEffect(() => {
    roomsRealtimeListening(roomId, fetchRoomData);
    playersRealtimeListening(roomId, fetchPlayers);
  }, [roomId]);

  return (
    <>
      <Toaster />
      <div className="flex gap-2">
        <button onClick={() => toast("Here is your toast.")}>
          Make me a toast
        </button>

        <button
          onClick={async () => {
            await supabase
              .from("players")
              .update({ role: "wolf" })
              .eq("id", currentPlayer?.id);
          }}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
        >
          Make me wolf
        </button>
        <button
          onClick={async () => {
            await supabase
              .from("players")
              .update({ role: "seer" })
              .eq("id", currentPlayer?.id);
          }}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full"
        >
          Make me seer
        </button>
        <button
          onClick={async () => {
            await supabase
              .from("players")
              .update({ role: "villager" })
              .eq("id", currentPlayer?.id);
          }}
          className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-full"
        >
          Make me villager
        </button>
        <button
          onClick={async () => {
            await supabase
              .from("players")
              .update({ role: "doctor" })
              .eq("id", currentPlayer?.id);
          }}
          className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-full"
        >
          Make me doctor
        </button>
        <button
          onClick={async () => {
            await supabase
              .from("players")
              .update({ is_alive: true })
              .eq("id", currentPlayer?.id);
          }}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full"
        >
          Make me alive
        </button>
      </div>
      {rolesAssigned && currentPlayer && players && (
        <GameNavbar
          roomData={roomData}
          uid={uid}
          currentPlayerId={currentPlayer && currentPlayer.player_id}
          players={players}
        />
      )}
      {/* {JSON.stringify(currentPlayer)} */}
      <div className="flex h-auto pb-30   min-h-[90%] w-full justify-between flex-col md:flex-row gap-4">
        {players
          .filter((p) => p.voted_to != null)
          .map((player) => {
            const votedTo = players.find((p) => p.id === player.voted_to);
            return (
              <p className="text-lg">
                Player {player.name} voted for {votedTo?.name}
              </p>
            );
          })}
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
                  Ready to Assign Roles?
                  {rolesAssigned ? "Roles are assigned" : 'Not yet'}
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
        {players && <SidePlayers players={players} />}

        {roomData && currentPlayer && (
          <GameBox
            roomData={roomData}
            players={players}
            currentPlayerId={currentPlayer?.id}
          />
        )}
        <div className="chat">
          {roomId && roomData.stage == "day" && currentPlayer && (
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
      <GameActionsBar
        roomId={roomId}
        roomInfo={roomData}
        playerInfo={currentPlayer}
        players={players}
      />
      {stageResultModal && (
        <StageResult
          result={
            players.filter((p) => p.is_alive).length === 1
              ? "Wolf won"
              : "Still chance"
          }
          players={players}
          status={currentPlayer?.is_alive}
        />
      )}
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


function playersRealtimeListening(roomId, fetchPlayers) {
  const subscription = supabase
    .channel("players_listening_channel")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "players",
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        fetchPlayers()
      }
    )
    .subscribe();
  return () => {
    subscription.unsubscribe();
  };
}