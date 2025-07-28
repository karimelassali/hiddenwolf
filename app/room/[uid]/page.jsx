"use client";

// --- Import Core Libraries from React & Next.js ---
import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs"; // Hook to get data for the currently logged-in user via Clerk.
import { useRouter } from "next/navigation"; // Hook to control client-side navigation.

// --- Import Supabase Client ---
import { supabase } from "@/lib/supabase"; // Supabase client for database interaction.

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
  // ✅ FIX: Use React.use() to correctly unwrap params as recommended by Next.js.
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

  // ✅ FIX: Separated logic into dependent useEffects to prevent race conditions.
  // Effect 1: Fetch the core room data. This is the first and most critical step.
  useEffect(() => {
    if (!uid) return;
    
    const fetchRoom = async () => {
      setIsLoading(true);
      const { data: room, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", uid)
        .single();

      if (error || !room) {
        console.error("Room not found. Redirecting.", error);
        router.push("/");
      } else {
        setRoomData(room);
        // Note: We don't stop loading here yet. We wait for the player setup.
      }
    };

    fetchRoom();
  }, [uid, router]);

  // Effect 2: Once room data and user are available, fetch players and add the current user.
  useEffect(() => {
    // This effect waits for the roomData from Effect 1 and the user from Clerk.
    if (!roomData || !isLoaded) {
      return; // Do nothing if we don't have the room or user auth status.
    }

    // If we have the room but no logged-in user, we can stop loading.
    if (!user) {
      setIsLoading(false);
      return;
    }

    const setupPlayerInRoom = async () => {
      // 1. Fetch the current list of players.
      const { data: initialPlayers, error: playersError } = await supabase
        .from("players")
        .select("*")
        .eq("room_id", roomData.id)
        .order("id", { ascending: true });

      if (playersError) {
        console.error("Failed to fetch players", playersError);
      } else {
        setPlayers(initialPlayers);
      }

      // 2. Now that we have the room_id and user, reliably add the player to the database.
      await upsertPlayer(roomData.id, user);

      // 3. All initial setup is complete, we can now show the page.
      setIsLoading(false);
    };

    setupPlayerInRoom();
  }, [roomData, user, isLoaded]); // This dependency chain ensures correct order.


  // Effect 3: Real-time subscriptions. This depends on having a room ID.
  useEffect(() => {
    if (!roomData?.id) return;

    const playersChannel = supabase
      .channel(`public:players:room_id=eq.${roomData.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            JoinSound();
            setPlayers(prevPlayers => [...prevPlayers, payload.new]);
          }
          if (payload.eventType === "UPDATE") {
            setPlayers(prevPlayers =>
              prevPlayers.map(p => (p.id === payload.new.id ? payload.new : p))
            );
          }
          if (payload.eventType === "DELETE") {
            setPlayers(prevPlayers =>
              prevPlayers.filter(p => p.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    const roomChannel = supabase
      .channel(`public:rooms:id=eq.${roomData.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms" },
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

  // Other side effects for connectivity, game state, and quotes.
  useEffect(() => {
    if (roomData?.id && user?.id) {
      const connectivityInterval = trackUserConnectivity(roomData.id, user.id, roomData.host_id);
      return () => clearInterval(connectivityInterval);
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
