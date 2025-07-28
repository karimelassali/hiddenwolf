"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@clerk/nextjs";
import { Toaster, toast } from "react-hot-toast";
import { Loader } from "@/components/ui/loader";
import { Modal } from "@/components/modal";
import {NumberCounting} from "@/components/magicui/number-ticker";
import { BorderBeam } from "@/components/magicui/border-beam";
import {ShineBorder} from "@/components/magicui/shine-border";

export default function Home() {
  const fetchUser = useUser();

  const [user, setUser] = useState([]);
  const [roomIsCreating, setRoomIsCreating] = useState(false);
  const [revealCoins, setRevealCoins] = useState(null);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [avatar, setAvatar] = useState(null);
  const [totalGames, setTotalGames] = useState(0);
  const [username,setUsername] = useState("");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [joinRoomLoading, setJoinRoomLoading] = useState(false);
  const [joinRoomError, setJoinRoomError] = useState("");


  const backgrounds = [
    'url("/assets/images/background.png")',
    'url("/assets/images/background1.png")',
  ];

  const fullId = uuidv4();
  const shortId = fullId.slice(0, 4);
  const router = useRouter();

  const checkIfPlayerRegistred = async () => {
    try {
      if (user.id) {
        const { data, error } = await supabase
          .from("player_stats")
          .select("player_id")
          .eq("player_id", user.id);
        if (error) {
          console.error("Error fetching player data:", error);
        }
        if (data.length === 0) {
          const coins = [100, 20, 499, 900, 1000, 3000];
          const giftCoins = Math.floor(Math.random() * coins.length);
          const { data, error } = await supabase
            .from("player_stats")
            .insert({ player_id: user.id, coins: coins[giftCoins],email: user.emailAddresses[0].emailAddress });
          setRevealCoins(coins[giftCoins]);
          if (error) {
            console.error("Error fetching player data:", error);
          }
          console.log("Player data:", data);
        }
        return data;
      }
    } catch (error) {
      console.error("Error fetching player data:", error);
    }
  };

  useEffect(() => {
    if (fetchUser.isLoaded) {
      setUser(fetchUser.user);
      checkIfPlayerRegistred();
      console.log("loop");
    }
  }, [fetchUser]);

  // Background rotation every 9 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prevIndex) => (prevIndex + 1) % backgrounds.length);
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  const handleCreateRoom = () => {
    setRoomIsCreating(true);
    if (user && user.id) {
      supabase
        .from("rooms")
        .insert({
          code: shortId,
          stage: "waiting",
          round: 1,
          host_id: user.id,
        })
        .then(() => {
          router.push(`/room/${shortId}`);
        })
        .catch((error) => {
          toast.error(error.message);
          setRoomIsCreating(false);
        });
    }
  };

  const handleJoinRoom = () => {
    setShowJoinModal(true);
    setJoinRoomError("");
    setRoomCode("");
  };

  const handleJoinRoomSubmit = async () => {
    if (!roomCode.trim()) {
      setJoinRoomError("Please enter a room code");
      return;
    }

    setJoinRoomLoading(true);
    setJoinRoomError("");

    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("code, stage")
        .eq("code", roomCode.trim().toLowerCase())

      if (error || !data) {
        setJoinRoomError("Room not found. Please check the code and try again.");
        setJoinRoomLoading(false);
        return;
      }

      if (data.stage === "finished") {
        setJoinRoomError("This room has already finished.");
        setJoinRoomLoading(false);
        return;
      }

      // Room exists and is valid, navigate to it
      router.push(`/room/${roomCode.trim().toLowerCase()}`);
    } catch (error) {
      console.error("Error checking room:", error);
      setJoinRoomError("Something went wrong. Please try again.");
      setJoinRoomLoading(false);
    }
  };

  const closeJoinModal = () => {
    setShowJoinModal(false);
    setRoomCode("");
    setJoinRoomError("");
    setJoinRoomLoading(false);
  };

  useEffect(() => {
    if (fetchUser.isLoaded && user.id) {
      supabase
        .from("players")
        .delete()
        .eq("player_id", user.id)
        .then(() => console.log("removed all records of user in players table"))
        .catch((error) => console.log(error));

      (async () => {
        const { data, error } = await supabase
          .from("player_stats")
          .select("avatar,total_games,username")
          .eq("player_id", user.id)
          .single();
        if (error) {
          console.error("Error fetching player avatar:", error);
        } else {
          setAvatar(data.avatar);
          setTotalGames(data.total_games);
          setUsername(data.username);
        }
      })();
    }
  }, [fetchUser, user?.id]);

  return (
    <div
      style={{
        backgroundImage: backgrounds[currentBgIndex],
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        transition: "background-image 1s ease-in-out",
      }}
      className="w-full font-karla h-full flex flex-col relative overflow-hidden bg-gradient-to-br from-gray-950 via-slate-950 to-black"
    >
      {revealCoins && (
        <Modal
          usage="coins"
          prop={revealCoins + ""}
          onCloseModal={() => setRevealCoins(null)}
        />
      )}

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeJoinModal}
          />
          
          {/* Modal */}
          <div className="relative z-10 w-full max-w-md">
            <div className="bg-gradient-to-br from-slate-900/95 via-gray-900/90 to-black/95 backdrop-blur-xl rounded-2xl border border-gray-600/30 shadow-2xl overflow-hidden">
              {/* Animated border */}
              <div className="absolute inset-0 bg-gradient-to-r from-gray-600/20 via-slate-600/20 to-gray-700/20 rounded-2xl blur-xl animate-pulse" />
              
              <div className="relative p-8">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-600 to-slate-700 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Join Room</h2>
                  <p className="text-gray-400/80">Enter the 4-digit room code to join</p>
                </div>

                {/* Input */}
                <div className="mb-6">
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => {
                      setRoomCode(e.target.value.toUpperCase());
                      setJoinRoomError("");
                    }}
                    placeholder="ABCD"
                    maxLength={4}
                    className="w-full px-4 py-4 bg-slate-800/50 border border-gray-600/30 rounded-xl text-white placeholder-slate-400 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-400/50 transition-all duration-300"
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleJoinRoomSubmit();
                      }
                    }}
                  />
                  
                  {joinRoomError && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-red-400 text-sm text-center flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {joinRoomError}
                      </p>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={closeJoinModal}
                    disabled={joinRoomLoading}
                    className="flex-1 bg-slate-700/50 hover:bg-slate-600/60 text-slate-300 font-medium py-3 px-4 rounded-xl border border-slate-600/50 transition-all duration-300 hover:border-slate-500/70"
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    onClick={handleJoinRoomSubmit}
                    disabled={joinRoomLoading || !roomCode.trim()}
                    className="flex-1 bg-gradient-to-r from-gray-700 to-slate-700 hover:from-gray-600 hover:to-slate-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {joinRoomLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader />
                        Joining...
                      </span>
                    ) : (
                      "Join Room"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toaster />

      {/* Mysterious floating elements with enhanced colors */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gray-500/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Gradient overlay for better contrast */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950/20 via-slate-950/30 to-black/40" />

      {/* Main content - centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        {/* Profile Card - Center Square */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-6 p-8 backdrop-blur-xl bg-gradient-to-br from-slate-900/60 via-gray-900/40 to-black/50 rounded-3xl border border-gray-600/20 shadow-2xl max-w-sm w-full mb-8">
          <ShineBorder shineColor={["#64748B", "#475569", "#374151"]} />

          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-600 via-slate-600 to-gray-700 rounded-full p-1 shadow-2xl">
              <div className="w-full h-full bg-slate-800 rounded-full flex items-center justify-center text-2xl font-bold text-slate-300">
                {avatar ? (
                  <Image
                    src={avatar}
                    alt="Avatar"
                    width={88}
                    height={88}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-700 rounded-full flex items-center justify-center text-2xl font-bold text-gray-200">
                    {user?.firstName?.charAt(0) || "P"}
                  </div>
                )}
              </div>
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-full border-2 border-slate-800 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* User Info */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-200 mb-2">
              Welcome, {username || user?.firstName || "Player"}
            </h2>
            <p className="text-gray-400/70 text-sm mb-3">
              {user?.emailAddresses?.[0]?.emailAddress}
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400/80">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Online • Ready to Play</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-6 text-center">
            <div className="flex flex-col">
              <span className="text-gray-200 font-bold text-lg">
                <NumberCounting value={totalGames} />
              </span>
              <span className="text-gray-400/70 text-xs">Games</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="w-full max-w-sm space-y-4">
          <Button
            disabled={roomIsCreating}
            variant={"createRoom"}
            onClick={handleCreateRoom}
            className="w-full bg-gradient-to-r from-gray-700 via-slate-700 to-gray-800 hover:from-gray-600 hover:via-slate-600 hover:to-gray-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 border border-gray-600/30 hover:border-gray-500/50 relative overflow-hidden"
          >
            {/* Button glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-700/20 via-slate-700/20 to-gray-800/20 blur-xl animate-pulse" />
            <span className="relative flex items-center justify-center gap-2">
              {roomIsCreating ? (
                <span className="flex items-center gap-2">
                  <Loader />
                  Creating Room...
                </span>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Room
                </>
              )}
            </span>
          </Button>

          <Button
            variant={"dark"}
            onClick={handleJoinRoom}
            className="w-full bg-slate-800/40 hover:bg-slate-700/50 text-indigo-200 font-medium py-3 px-6 rounded-xl border border-indigo-500/20 transition-all duration-300 hover:border-indigo-400/40 backdrop-blur-sm hover:shadow-lg hover:shadow-indigo-500/10"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Join Existing Room
            </span>
          </Button>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 w-full z-10 bg-gradient-to-r from-slate-900/40 via-gray-900/30 to-black/40 backdrop-blur-xl border-t border-gray-600/20 p-4">
        <div className="flex items-center justify-center gap-4 max-w-lg mx-auto">
          <Button
            variant={"dark"}
            onClick={() => router.push("/rules")}
            className="flex-1 bg-slate-800/20 hover:bg-slate-700/30 text-gray-200 font-medium py-4 px-4 rounded-xl border border-gray-600/20 transition-all duration-300 hover:border-gray-500/40 backdrop-blur-sm hover:shadow-lg hover:shadow-gray-500/10"
          >
            <span className="flex flex-col items-center gap-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm">Rules</span>
            </span>
          </Button>

          <Button
            variant={"dark"}
            onClick={() => router.push("/profile")}
            className="flex-1 bg-slate-800/20 hover:bg-slate-700/30 text-gray-200 font-medium py-4 px-4 rounded-xl border border-gray-600/20 transition-all duration-300 hover:border-gray-500/40 backdrop-blur-sm hover:shadow-lg hover:shadow-gray-500/10"
          >
            <span className="flex flex-col items-center gap-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm">Profile</span>
            </span>
          </Button>

          <Button
            variant={"dark"}
            onClick={() => router.push("/store")}
            className="flex-1 bg-slate-800/20 hover:bg-slate-700/30 text-gray-200 font-medium py-4 px-4 rounded-xl border border-gray-600/20 transition-all duration-300 hover:border-gray-500/40 backdrop-blur-sm hover:shadow-lg hover:shadow-gray-500/10"
          >
            <span className="flex flex-col items-center gap-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m-2.4 0L3 3H1m6 16a2 2 0 104 0 2 2 0 00-4 0zm10 0a2 2 0 104 0 2 2 0 00-4 0z" />
              </svg>
              <span className="text-sm">Store</span>
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}