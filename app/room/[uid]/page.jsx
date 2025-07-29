"use client";

// --- Import Core Libraries from React & Next.js ---
import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

// --- Import Supabase Client ---
import { supabase } from "@/lib/supabase";

// --- Import UI Components ---
import { Players } from "@/components/Players";
import { Countdown } from "@/components/ui/countdown";
import { Loader } from "@/components/ui/loader"; 

// --- Import Utility Functions ---
import { addBotsIfNeeded } from "@/utils/addBotsIfNeeded";
import { trackUserConnectivity } from "@/utils/trackUserconnectivity";
import { updatePlayerState } from "@/utils/updatePlayerState";
import { quotes } from "@/utils/quotes";
import { JoinSound } from "@/utils/sounds";

// --- Component Definition ---
export default function Room({ params }) {
  const { uid } = React.use(params);
  const router = useRouter();
  const { user, isLoaded } = useUser();

  // --- State Variables ---
  const [roomData, setRoomData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasRoomBeenPlayed, setHasRoomBeenPlayed] = useState(false);
  const [quote, setQuote] = useState("");

  // --- Helper Functions ---
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
      
      await supabase.from("players").upsert(playerData, { onConflict: 'player_id' });
      
    } catch (error) {
      console.error("Error in upsertPlayer:", error);
    }
  };
  
  // --- useEffect Hooks ---
  useEffect(() => {
    if (!uid) return;
    
    const initializeRoom = async () => {
      setIsLoading(true);
      // 1. Fetch room data
      const { data: room, error: roomError } = await supabase.from("rooms").select("*").eq("code", uid).single();
      if (roomError || !room) {
        console.error("Room not found. Redirecting.", roomError);
        router.push("/");
        return;
      }
      setRoomData(room);

      // 2. Ensure user is upserted before fetching players
      if (isLoaded && user) {
        await upsertPlayer(room.id, user);
      }

      // 3. Fetch initial players
      const { data: initialPlayers, error: playersError } = await supabase.from("players").select("*").eq("room_id", room.id).order("id", { ascending: true });
      if (playersError) {
        console.error("Failed to fetch players", playersError);
      } else {
        setPlayers(initialPlayers);
      }
      
      setIsLoading(false);
    };

    initializeRoom();
  }, [uid, isLoaded, user, router]);

  // Real-time subscriptions
  useEffect(() => {
    if (!roomData?.id) return;

    // ✅ FIX: Added a filter to the players subscription to only listen for changes in the CURRENT room.
    // This solves the "nuclear problem" where players from different rooms could see each other.
    const playersChannel = supabase
      .channel(`room-players-${roomData.id}`) // Unique channel name
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `room_id=eq.${roomData.id}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            JoinSound();
            setPlayers(prevPlayers => [...prevPlayers, payload.new]);
          }
          if (payload.eventType === "UPDATE") {
            setPlayers(prevPlayers => prevPlayers.map(p => (p.id === payload.new.id ? payload.new : p)));
          }
          if (payload.eventType === "DELETE") {
            setPlayers(prevPlayers => prevPlayers.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const roomChannel = supabase
      .channel(`room-data-${roomData.id}`) // Unique channel name
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomData.id}` },
        (payload) => {
          setRoomData(prevData => ({ ...prevData, ...payload.new }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(playersChannel);
      supabase.removeChannel(roomChannel);
    };
  }, [roomData?.id]);

  // Other side effects
  useEffect(() => {
    if (roomData?.id && user?.id) {
      const interval = trackUserConnectivity(roomData.id, user.id, roomData.host_id);
      return () => clearInterval(interval);
    }
  }, [roomData?.id, user?.id, roomData?.host_id]);

  useEffect(() => {
    if (roomData?.stage === "night" && !hasRoomBeenPlayed) {
      if (user?.id) {
        updatePlayerState(user.id, { newGame: true });
      }
      setHasRoomBeenPlayed(true);
    }
  }, [roomData?.stage, user?.id, hasRoomBeenPlayed]);

  useEffect(() => {
    setQuote(quotes());
  }, []);

  // --- Event Handlers ---
  const handleStartGame = async () => {
    if (!user || user.id !== roomData?.host_id) return;
    try {
      await addBotsIfNeeded(roomData.id, 4 - players.length);
      await supabase.from("rooms").update({ stage: "night" }).eq("id", roomData.id);
    } catch (error) {
      console.error("Error starting game:", error);
    }
  };
  
  // --- Render Logic ---
  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-slate-900"><Loader /></div>;
  }

  if (hasRoomBeenPlayed) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <Countdown icon={false} number={10} target={`/game/${roomData.code}`} />
      </div>
    );
  }

  return (
    <div
      style={{ backgroundImage: 'url("/assets/images/waitingBackground.webp")' }}
      className="min-h-screen bg-cover bg-center bg-no-repeat flex flex-col"
    >
      <Players fetched_players={players} room_host_id={roomData?.host_id} />
      <div className="fixed gap-y-5 flex flex-col w-full backdrop-blur-lg bg-slate-900/20 bottom-0 justify-between items-center border-t border-slate-700/50 p-6 shadow-2xl">
        <div className="flex w-full items-center justify-between space-x-4">
          {roomData?.host_id !== user?.id ? (
            <div className="text-center w-full">
              <p className="text-slate-200 font-medium text-lg">Waiting for host to start the game...</p>
              <p className="text-slate-400 text-sm">Stage: {roomData?.stage}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-4">
                <p className="text-2xl font-bold text-white">{players.length}</p>
                <p className="text-slate-200 font-medium text-lg">Players</p>
              </div>
              <button
                onClick={handleStartGame}
                disabled={players.length < 1}
                className="group relative overflow-hidden bg-gradient-to-r from-violet-600 to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed hover:from-violet-700 hover:to-violet-800 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition-all duration-200 hover:scale-105"
              >
                <span>Start Game</span>
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