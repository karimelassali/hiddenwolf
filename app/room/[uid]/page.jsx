// "use client" - This directive indicates that the component will run on the client-side (in the browser), not on the server.
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
// This is the main component for the Room page, receiving `params` from the URL.
export default function Room({ params }) {
  // Destructure the room `uid` from the URL parameters.
  const { uid } = params;
  // Initialize the router for programmatic navigation.
  const router = useRouter();
  // Get the current user's data and loading status from Clerk.
  const { user, isLoaded } = useUser();

  // --- State Variables ---
  // `roomData`: Stores the data of the current room (e.g., stage, host ID).
  const [roomData, setRoomData] = useState(null);
  // `players`: Stores the list of players currently in the room.
  const [players, setPlayers] = useState([]);
  // `isLoading`: Manages the loading state for the initial data fetch.
  const [isLoading, setIsLoading] = useState(true);
  // `hasRoomBeenPlayed`: Tracks if the game has started, used to show the countdown.
  const [hasRoomBeenPlayed, setHasRoomBeenPlayed] = useState(false);
  // `quote`: Stores a random quote to display at the bottom.
  const [quote, setQuote] = useState("");

  // --- Helper Functions ---
  // This function adds a new player or updates an existing one in the database.
  const upsertPlayer = async (roomId, currentUser) => {
    // Exit if essential data is missing.
    if (!currentUser || !roomId) return;

    try {
      // Fetch additional player stats (like a custom avatar or username) from another table.
      const { data: playerStat } = await supabase
        .from("player_stats")
        .select("avatar,username")
        .eq("player_id", currentUser.id)
        .single();

      // Prepare the player data object for the database operation.
      const playerData = {
        room_id: roomId,
        name: playerStat?.username || currentUser.fullName, // Use custom name if it exists.
        profile: playerStat?.avatar || currentUser.imageUrl, // Use custom avatar if it exists.
        player_id: currentUser.id,
        is_human: true,
        last_seen: new Date().toISOString(), // Record the player's last active time.
      };
      
      // `upsert` will INSERT a new record if it doesn't exist, or UPDATE it if it does.
      // `onConflict` specifies the unique column to check for existing records.
      await supabase.from("players").upsert(playerData, {
        onConflict: 'player_id',
      });
      
    } catch (error) {
      // Log any errors that occur during the process.
      console.error("Error in upsertPlayer:", error);
    }
  };
  
  // --- useEffect Hooks ---
  // This hook handles the initial setup of the room. It runs once when the component mounts.
  useEffect(() => {
    // Don't run until the user's data has been loaded from Clerk.
    if (!isLoaded) return;

    const initializeRoom = async () => {
      // Show the loading indicator.
      setIsLoading(true);
      try {
        // 1. Fetch the room's data from the database using the UID from the URL.
        const { data: room, error: roomError } = await supabase
          .from("rooms")
          .select("*")
          .eq("code", uid)
          .single();

        // If the room is not found, throw an error to be caught below.
        if (roomError || !room) throw new Error("Room not found or failed to fetch.");
        // Store the fetched room data in the state.
        setRoomData(room);

        // 2. Fetch the list of players currently in this room.
        const { data: initialPlayers, error: playersError } = await supabase
          .from("players")
          .select("*")
          .eq("room_id", room.id)
          .order("id", { ascending: true });

        if (playersError) throw playersError;
        // Store the initial list of players in the state.
        setPlayers(initialPlayers);

        // 3. Add or update the current user in the room.
        if (user) {
          await upsertPlayer(room.id, user);
        }

      } catch (error) {
        // If any error occurs during initialization, log it and redirect the user to the home page.
        console.error("Initialization Error:", error);
        router.push("/");
      } finally {
        // Hide the loading indicator after the process is complete (whether it succeeded or failed).
        setIsLoading(false);
      }
    };

    // Call the initialization function.
    initializeRoom();
  }, [isLoaded, user, uid]); // Dependency Array: This effect will only re-run if these values change.

  // This hook sets up the real-time subscriptions with Supabase.
  useEffect(() => {
    // Don't set up subscriptions until we have a valid room ID.
    if (!roomData?.id) return;

    // Set up a channel to listen for changes to the 'players' table for this specific room.
    const playersChannel = supabase
      .channel(`public:players:room_id=eq.${roomData.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players" },
        (payload) => {
          // Handle a new player joining.
          if (payload.eventType === "INSERT") {
            JoinSound(); // Play a sound effect.
            // Use the functional update form to avoid "stale closure" issues.
            // This ensures we are always updating the most recent state.
            setPlayers(prevPlayers => [...prevPlayers, payload.new]);
          }
          // Handle updates to an existing player's data.
          if (payload.eventType === "UPDATE") {
            setPlayers(prevPlayers =>
              prevPlayers.map(p => (p.id === payload.new.id ? payload.new : p))
            );
          }
          // Handle a player leaving (record deleted).
          if (payload.eventType === "DELETE") {
            setPlayers(prevPlayers =>
              prevPlayers.filter(p => p.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe(); // Start listening for changes.

    // Set up a channel to listen for changes to the room's data itself (e.g., stage change).
    const roomChannel = supabase
      .channel(`public:rooms:id=eq.${roomData.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms" },
        (payload) => {
          // Update the room data in the state when a change is received.
          setRoomData(prevData => ({ ...prevData, ...payload.new }));
        }
      )
      .subscribe(); // Start listening for changes.

    // Cleanup function: This is called when the component unmounts.
    return () => {
      // Unsubscribe from the channels to prevent memory leaks.
      supabase.removeChannel(playersChannel);
      supabase.removeChannel(roomChannel);
    };
  }, [roomData?.id]); // Dependency Array: This effect only depends on the room's ID.

  // This hook tracks user connectivity (online/offline status).
  useEffect(() => {
    // Ensure we have the necessary data.
    if (roomData?.id && user?.id) {
      // Call the utility function that periodically updates the user's `last_seen` timestamp.
      const connectivityInterval = trackUserConnectivity(roomData.id, user.id, roomData.host_id);
      // Cleanup function to stop the interval when the component unmounts.
      return () => clearInterval(connectivityInterval);
    }
  }, [roomData?.id, user?.id, roomData?.host_id]);

  // This hook watches the game stage and updates player stats.
  useEffect(() => {
    // If the game stage changes to "night" and the game hasn't already been marked as played.
    if (roomData?.stage === "night" && !hasRoomBeenPlayed) {
      // Update the player's stats (e.g., increment total games played).
      if (user?.id) {
        updatePlayerState(user.id, { newGame: true });
      }
      // Update the state to show the countdown.
      setHasRoomBeenPlayed(true);
    }
  }, [roomData?.stage, user?.id, hasRoomBeenPlayed]);

  // This hook fetches a random quote once when the component mounts.
  useEffect(() => {
    setQuote(quotes());
  }, []); // Empty dependency array means this runs only once.

  // --- Event Handlers ---
  // This function handles the "Start Game" button click (only for the host).
  const handleStartGame = async () => {
    // Verify that the current user is the host.
    if (!user || user.id !== roomData?.host_id) return;
    
    try {
      // Add bot players if the room is not full.
      await addBotsIfNeeded(roomData.id, 4 - players.length);
      // Update the room's stage in the database to "night" to start the game.
      await supabase.from("rooms").update({ stage: "night" }).eq("id", roomData.id);

    } catch (error) {
      console.error("Error starting game:", error);
    }
  };
  
  // --- Render Logic ---
  // Show a loading screen while fetching initial data.
  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-slate-900"><Loader /></div>;
  }

  // Show the countdown screen after the game has started.
  if (hasRoomBeenPlayed) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <Countdown icon={false} number={10} target={`/game/${roomData.code}`} />
      </div>
    );
  }

  // Render the main waiting room UI.
  return (
    <div
      style={{ backgroundImage: 'url("/assets/images/waitingBackground.webp")' }}
      className="min-h-screen bg-cover bg-center bg-no-repeat flex flex-col"
    >
      {/* Display the list of players. */}
      <Players fetched_players={players} room_host_id={roomData?.host_id} />

      {/* Bottom bar with controls and information. */}
      <div className="fixed gap-y-5 flex flex-col w-full backdrop-blur-lg bg-slate-900/20 bottom-0 justify-between items-center border-t border-slate-700/50 p-6 shadow-2xl">
        <div className="flex w-full items-center justify-between space-x-4">
          {/* Display different UI depending on whether the user is the host or a guest. */}
          {roomData?.host_id !== user?.id ? (
            // UI for regular players (guests).
            <div className="text-center w-full">
              <p className="text-slate-200 font-medium text-lg">Waiting for host to start the game...</p>
              <p className="text-slate-400 text-sm">Stage: {roomData?.stage}</p>
            </div>
          ) : (
            // UI for the room host.
            <>
              <div className="flex items-center space-x-4">
                <p className="text-2xl font-bold text-white">{players.length}</p>
                <p className="text-slate-200 font-medium text-lg">Players</p>
              </div>
              <button
                onClick={handleStartGame}
                disabled={players.length < 1} // Disable the button if there aren't enough players.
                className="group relative overflow-hidden bg-gradient-to-r from-violet-600 to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed hover:from-violet-700 hover:to-violet-800 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition-all duration-200 hover:scale-105"
              >
                <span>Start Game</span>
              </button>
            </>
          )}
        </div>
        {/* Display the random quote. */}
        <p className="text-lg text-center font-bold font-['Lobster'] italic text-slate-400">
          "{quote}"
        </p>
      </div>
    </div>
  );
}