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
import { Button } from "@/components/ui/button";

// --- Import Utility Functions ---
import { addBotsIfNeeded } from "@/utils/addBotsIfNeeded";
import { trackUserConnectivity } from "@/utils/trackUserconnectivity";
import { updatePlayerState } from "@/utils/updatePlayerState";
import { quotes } from "@/utils/quotes";
import { JoinSound } from "@/utils/sounds";

// --- Icons ---
import { GiWolfHowl, GiHourglass } from "react-icons/gi";

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
        console.error(`Room not found for code: ${uid}. Redirecting. Error:`, roomError);
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

    const playersChannel = supabase
      .channel(`room-players-${roomData.id}`)
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
      .channel(`room-data-${roomData.id}`)
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
  const handleKickPlayer = async (playerId) => {
    if (!roomData?.id || user.id !== roomData.host_id) return;

    // 1. Optimistic Update: Remove from UI immediately
    const previousPlayers = [...players];
    setPlayers((prev) => prev.filter((p) => p.player_id !== playerId));

    try {
      // 2. Perform Backend Operation
      const { error } = await supabase.from("players").delete().eq("player_id", playerId).eq("room_id", roomData.id);

      if (error) {
        console.error("Supabase delete error:", error);
        // 3. Rollback on failure
        setPlayers(previousPlayers);
        alert("Failed to kick player. Please try again."); // Simple error feedback
      } else {
        console.log("Player kicked successfully");
      }
    } catch (error) {
      console.error("Error kicking player:", error);
      // Rollback on unexpected error
      setPlayers(previousPlayers);
    }
  };

  const handleAddBot = async () => {
    if (!roomData?.id) return;
    try {
      await addBotsIfNeeded(roomData.id, 1);
    } catch (error) {
      console.error("Error adding bot:", error);
    }
  };

  const handleStartGame = async () => {
    if (!user || user.id !== roomData?.host_id) return;
    try {
      // If fewer than 4 players, auto-fill remaining spots (optional, can be removed if user wants FULL manual control)
      // User asked to "add as many bots as I want", but standard game might need minimums.
      // Let's keep the minimum check but allow manual addition beyond that.
      // Actually, user said: "live add as how many bots as i want ... before i start".
      // So if I have 1 player and add 10 bots, I start with 11.
      // If I start with 1 player, I should probably enforce a minimum of 4 total.

      const currentCount = players.length;
      if (currentCount < 4) {
        // Auto-fill to minimum 4 if they haven't added enough manually
        await addBotsIfNeeded(roomData.id, 4 - currentCount);
      }

      await supabase.from("rooms").update({ stage: "night" }).eq("id", roomData.id);
    } catch (error) {
      console.error("Error starting game:", error);
    }
  };

  // --- Render Logic ---
  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-stone-950"><Loader /></div>;
  }

  if (hasRoomBeenPlayed) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-950">
        <Countdown icon={false} number={10} target={`/game/${roomData.code}`} />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-stone-950 font-serif overflow-hidden selection:bg-red-900/40 selection:text-red-100">

      {/* Background Layers - Matches Lobby Theme */}
      <div
        className="absolute inset-0 bg-cover bg-center grayscale-[40%] contrast-125 opacity-40 z-0"
        style={{ backgroundImage: 'url("/assets/images/waitingBackground.avif")' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-stone-950/90 via-stone-900/60 to-stone-950/95 z-0" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay z-0 pointer-events-none" />

      {/* Top Header - Ritual Code */}
      <div className="relative z-10 w-full pt-12 pb-4 text-center space-y-2">
        <h1 className="text-stone-500 font-mono tracking-[0.5em] text-sm uppercase">Ritual Code</h1>
        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-red-900/50" />
          <span className="text-5xl md:text-6xl font-black text-stone-200 tracking-wider shadow-red-900/20 drop-shadow-lg" style={{ fontFamily: 'Cinzel, serif' }}>
            {roomData?.code?.toUpperCase()}
          </span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-red-900/50" />
        </div>
      </div>

      {/* Main Player Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-start pt-8 pb-32 overflow-y-auto scrollbar-hide">
        <Players
          fetched_players={players}
          room_host_id={roomData?.host_id}
          isHost={roomData?.host_id === user?.id}
          onKick={handleKickPlayer}
        />
      </div>

      {/* Bottom Control Bar */}
      <div className="fixed bottom-0 w-full z-20 bg-stone-950/90 backdrop-blur-md border-t border-stone-800 p-4 sm:p-6 pb-6 sm:pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
        <div className="max-w-4xl mx-auto flex flex-col gap-4 sm:gap-6">

          {/* Controls */}
          <div className="flex flex-col sm:flex-row w-full items-center justify-between gap-4 sm:gap-0">
            {/* Status Text */}
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-2xl sm:text-3xl font-bold text-stone-200 font-serif">{players.length}</span>
                <span className="text-xs sm:text-sm font-mono text-stone-500 uppercase tracking-widest mt-1">Souls Gathered</span>
              </div>
              <p className="text-xs text-stone-600 italic">
                {roomData?.host_id === user?.id ? "You hold the power to begin." : "Awaiting the host's command..."}
              </p>
            </div>

            {/* Action Buttons */}
            {roomData?.host_id === user?.id && (
              <div className="flex flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto justify-center">
                {/* Add Bot Button */}
                <button
                  onClick={handleAddBot}
                  className="group relative overflow-hidden bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-amber-700/50 text-stone-400 hover:text-amber-100 font-serif font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-sm shadow-lg transition-all duration-300 flex-1 sm:flex-none justify-center"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2 tracking-widest uppercase text-[10px] sm:text-xs whitespace-nowrap">
                    + Summon Bot
                  </span>
                </button>

                {/* Start Game Button */}
                <button
                  onClick={handleStartGame}
                  disabled={players.length < 1}
                  className="group relative overflow-hidden bg-stone-900 hover:bg-red-950 border border-stone-700 hover:border-red-900/50 text-stone-300 hover:text-red-100 font-serif font-bold py-2 sm:py-3 px-6 sm:px-8 rounded-sm shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none justify-center"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2 tracking-widest uppercase text-xs sm:text-sm whitespace-nowrap">
                    <GiWolfHowl className="text-base sm:text-lg" />
                    Begin Hunt
                  </span>
                  {/* Inner Glow */}
                  <div className="absolute inset-0 bg-red-900/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              </div>
            )}
          </div>

          {/* Quotes Section - "Whispers from the Void" */}
          <div className="w-full text-center border-t border-stone-800/50 pt-2 sm:pt-4">
            <p className="text-sm sm:text-lg md:text-xl font-serif italic text-stone-500/80 drop-shadow-md">
              "{quote}"
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}