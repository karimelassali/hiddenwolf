"use client";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import React from "react";
import { Players } from "@/components/Players";
import { useRouter } from "next/navigation";
import { Countdown } from "@/components/ui/countdown";
import { addBotsIfNeede } from "@/utils/addBotsIfNeeded";
import { trackUserConnectivity } from "@/utils/trackUserconnectivity";
import { updatePlayerState } from "@/utils/updatePlayerState";

import { quotes } from "@/utils/quotes";
import { JoinSound } from "@/utils/sounds";
import { Loader } from "@/components/ui/loader";

export default function Room({ params }) {
  const resolvedParams = React.use(params);

  const { uid } = resolvedParams;
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [roomData, setRoomData] = useState({});
  const [user, setUser] = useState([]);
  const fetchUser = useUser();
  const [players, setPlayers] = useState([]);
  const [hasRoomBeenPlayed, setHasRoomBeenPlayed] = useState(false);
  const [quote, setQuote] = useState("");
  const [gameStartClicked, setgameStartClicked] = useState(false);

  useEffect(() => {
    if (fetchUser.isLoaded) {
      setUser(fetchUser.user);
    }
  }, [fetchUser]);

  const fetchPlayers = async () => {
    if (roomId) {
      try {
        const { data: players, error } = await supabase
          .from("players")
          .select("*")
          .eq("room_id", roomId)
          .order("id", { ascending: true });
        if (error) {
          console.log(error);
        }
        setPlayers(players);
      } catch (error) {
        console.log(error);
      }
    }
  };

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

  const addPlayer = async () => {
    if (!user.fullName || !roomId) return;

    try {
      await fetchRoomData();

      // First, check if player exists in any room
      const { data: existingPlayer, error: findError } = await supabase
        .from("players")
        .select("id, room_id")
        .eq("player_id", user.id)
        .maybeSingle();

      if (findError) throw findError;

      const { data: playerStat, error: playerStatError } = await supabase
        .from("player_stats")
        .select("avatar,username")
        .eq("player_id", user?.id)
        .single();

      if (playerStatError) {
        console.error("Error fetching player avatar:", playerStatError);
        return;
      }

      const playerAvatar = playerStat?.avatar || user?.imageUrl;
      const playerUsername = playerStat?.username || user?.fullName;
      console.log(playerAvatar)
      const playerData = {
        room_id: roomId,
        name: playerUsername,
        role: null,
        is_alive: true,
        vote_to: null,
        player_id: user.id,
        last_seen: new Date().toISOString(),
        is_human: true,
        profile: playerAvatar,
      };

      if (existingPlayer) {
        // If player exists in a different room, delete the old record
        if (existingPlayer.room_id !== roomId) {
          const { error: deleteError } = await supabase
            .from("players")
            .delete()
            .eq("id", existingPlayer.id);

          if (deleteError) throw deleteError;
          console.log("🗑️ Removed player from previous room");

          // Insert new record in the new room
          const { error: insertError } = await supabase
            .from("players")
            .insert(playerData);

          if (insertError) throw insertError;
          console.log("✅ Player moved to new room");
        } else {
          // Update existing player in the same room
          const { error: updateError } = await supabase
            .from("players")
            .update(playerData)
            .eq("id", existingPlayer.id);

          if (updateError) throw updateError;
          console.log("🔄 Player updated in room");
        }
      } else {
        // Insert new player
        const { error: insertError } = await supabase
          .from("players")
          .insert(playerData);

        if (insertError) throw insertError;
        console.log("✅ New player added to room");
      }
      fetchPlayers();
    } catch (error) {
      console.error("Error in addPlayer:", error);
    }
  };

  const updatePlayerTotaleGames = async () => {
    const data = {
      newGame: true,
    };

    //Add A new game for the player.
    updatePlayerState(user.id, data);
  };
  useEffect(() => {
    const initialize = async () => {
      if (user.fullName) {
        await fetchRoomData();
        await addPlayer();
      }
    };
    initialize();
  }, [user.fullName, roomId]);

  useEffect(() => {
   
    const subscription = supabase
      .channel("players_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {

          if (payload.eventType === "INSERT") {
            fetchPlayers();

            JoinSound();
          }
        }
      )
      .subscribe();

    const roomsSubscription = supabase
      .channel("rooms_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          console.log("🚨 Rooms payload", payload);
          setRoomData(payload.new);
          const newStage = payload.new?.stage;
          if(newStage === 'night'){
            updatePlayerTotaleGames();
            setHasRoomBeenPlayed(true);
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(roomsSubscription);
      supabase.removeChannel(subscription);
    };
  }, [roomId]);

  //Interval for keep tracking on user if he is online or offline
  useEffect(() => {
    if (roomId && user.id) {
      trackUserConnectivity(roomId, user.id, roomData.host_id);
    }
    if (quote == "") {
      setQuote(quotes());
    }
  }, [roomId, user.id]);

  useEffect(() => {
    if (roomData.stage === "night") {
      updatePlayerTotaleGames();
      // router.push(`/game/${roomData.code}`);
      setHasRoomBeenPlayed(true);
    }
  }, [roomData?.stage]);

  return hasRoomBeenPlayed ? (
    <div className="h-screen flex items-center justify-center">
      <div className="flex items-center">
        <Countdown icon={false} number={10} target={"/game/" + roomData.code} />
      </div>
    </div>
  ) : (
    <div
      style={{
        backgroundImage: 'url("/assets/images/waitingBackground.webp")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "rgba(0, 0, 0, 0.9)",
      }}
      className="min-h-screen  scrollbar-hide flex flex-col"
    >
      <Players fetched_players={players} room_host_id={roomData?.host_id} />

      <div className="fixed  gap-y-5 flex flex-col w-full backdrop-blur-lg bg-slate-900/20 bottom-0 justify-between items-center border-t border-slate-700/50 p-6 shadow-2xl">
        <div className="flex  w-full items-center justify-between space-x-4">
          {roomData && roomData.host_id !== user?.id ? (
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full flex items-center justify-center border border-slate-600/50 shadow-lg">
                  <svg
                    className="animate-spin h-6 w-6 text-amber-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full animate-pulse"></div>
              </div>
              <div className="flex flex-col">
                <p className="text-slate-200 font-medium text-lg">
                  Waiting for host to start game
                </p>
                <p className="text-slate-400 text-sm">
                  Stage: {roomData.stage}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-violet-700 to-violet-800 rounded-full flex items-center justify-center border border-violet-600/50 shadow-lg">
                    <p className="text-2xl font-bold text-white">
                      {players.length}
                    </p>
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-violet-400 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="flex flex-col">
                  <p className="text-slate-200 font-medium text-lg">
                    Players in this room
                  </p>
                  <p className="text-slate-400 text-sm">
                    Stage: {roomData?.stage}
                  </p>
                </div>
              </div>

              <button
                onClick={async () => {
                  try {
                    setgameStartClicked(true);
                    if (roomData.stage === "night") {
                      const { data, error } = await supabase
                        .from("rooms")
                        .update({ stage: "waiting" })
                        .eq("id", roomId);
                      if (error) {
                        console.log(error);
                      }
                    } else {
                      addBotsIfNeede(roomId, 4 - players.length);
                      const { data, error } = await supabase
                        .from("rooms")
                        .update({ stage: "night" })
                        .eq("id", roomId);
                      if (error) {
                        console.log(error);
                      }
                    }
                  } catch (error) {
                    console.log(error);
                  }
                }}
                className="group relative overflow-hidden bg-gradient-to-r from-violet-600 to-violet-700 cursor-pointer hover:from-violet-700 hover:to-violet-800 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl border border-violet-500/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="relative flex items-center space-x-2">
                  {roomData?.stage === "play" ? (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Stop Game</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Start Game</span>
                    </>
                  )}
                </span>
              </button>
            </>
          )}
        </div>
        <p className="text-lg text-center font-bold font-['Lobster'] italic text-slate-400">
          "{quote}"
        </p>
      </div>
    </div>
  );
}
