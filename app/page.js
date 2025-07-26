"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@clerk/nextjs";
import { Toaster, toast } from "react-hot-toast";
import { GiWolfHowl } from "react-icons/gi";
import { Loader } from "@/components/ui/loader";
import { Modal } from "@/components/modal";

export default function Home() {
  const fetchUser = useUser();

  const [user, setUser] = useState([]);
  const [roomIsCreating, setRoomIsCreating] = useState(false);
  const [revealCoins, setRevealCoins] = useState(null);

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
            .insert({ player_id: user.id, coins: coins[giftCoins] });
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
    router.push(`/room/${shortId}`);
  };

  useEffect(() => {
    if (fetchUser.isLoaded && user.id) {
      supabase
        .from("players")
        .delete()
        .eq("player_id", user.id)
        .then(() => console.log("removed all records of user in players table"))
        .catch((error) => console.log(error));
    }
  }, [fetchUser, user.id]);

  const generateRandomBackground = () => {
    const backgrounds = [
      'url("/assets/images/background.png")',
      'url("/assets/images/background1.png")',
    ];
    const randomIndex = Math.floor(Math.random() * backgrounds.length);
    return backgrounds[randomIndex];
  };

  return (
    <div
      style={{
        backgroundImage: generateRandomBackground(),
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      className="w-full font-karla h-full flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
    >
      {revealCoins && (
        <Modal usage="coins" prop={revealCoins + ""} onCloseModal={() => setRevealCoins(null)} />
      )}
      <Toaster />

      {/* Main content container */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-8 p-8 backdrop-blur-md bg-black/20 rounded-3xl border border-white/10 shadow-2xl max-w-md w-full mx-4">
        {/* Welcome section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-violet-400 to-violet-500 rounded-full shadow-lg mb-4 hover:scale-110 transition-transform duration-300">
            <GiWolfHowl size={50} />
          </div>
          <h1 className="text-2xl font-bold text-white">
            Ready, {user?.firstName}?
          </h1>
        </div>

        {/* Primary action */}
        <div className="w-full">
          <Button
            disabled={roomIsCreating}
            variant={"createRoom"}
            onClick={handleCreateRoom}
            className="w-full bg-gradient-to-r from-violet-500 to-violet-700 hover:from-violet-600 hover:to-violet-800 text-white font-semibold py-4 px-8 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-violet-500/25 border-0"
          >
            <span className="flex items-center justify-center gap-2">
              {roomIsCreating ? (
                <span className="flex items-center gap-2">
                  <Loader />
                </span>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Start New Room
                </>
              )}
            </span>
          </Button>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Ready</span>
        </div>
      </div>

      <div className="fixed bottom-0 right-0 w-full backdrop-blur-lg bg-black/10 border-t border-white/10 flex justify-between items-center p-4">
        <div className="flex flex-col sm:flex-row items-center justify-center w-full gap-3">
          <Button
            variant={"dark"}
            onClick={handleJoinRoom}
            className="flex w-50 bg-white/5 hover:bg-violet-600/50 text-white font-medium py-3 px-6 rounded-xl border border-white/10 transition-all duration-300 hover:border-violet-400/50 backdrop-blur-sm hover:shadow-lg"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Join Room
            </span>
          </Button>

          <Button
            variant={"dark"}
            onClick={() => router.push("/rules")}
            className="flex w-50 bg-white/5 hover:bg-violet-600/50 text-white font-medium py-3 px-6 rounded-xl border border-white/10 transition-all duration-300 hover:border-violet-400/50 backdrop-blur-sm hover:shadow-lg"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Rules
            </span>
          </Button>

          <Button
            variant={"dark"}
            onClick={() => router.push('/profile')}
            className="flex w-50 bg-white/5 hover:bg-violet-600/50 text-white font-medium py-3 px-6 rounded-xl border border-white/10 transition-all duration-300 hover:border-violet-400/50 backdrop-blur-sm hover:shadow-lg"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </span>
          </Button>

          <Button
            variant={"dark"}
            onClick={() => router.push('/store')}
            className="flex w-50 bg-white/5 hover:bg-violet-600/50 text-white font-medium py-3 px-6 rounded-xl border border-white/10 transition-all duration-300 hover:border-violet-400/50 backdrop-blur-sm hover:shadow-lg"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m-2.4 0L3 3H1m6 16a2 2 0 104 0 2 2 0 00-4 0zm10 0a2 2 0 104 0 2 2 0 00-4 0z" />
              </svg>
              Store
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}