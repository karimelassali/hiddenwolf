"use client";
import { useUser } from "@clerk/nextjs";
import { Loader } from "@/components/ui/loader";
import LandingPage from "@/components/LandingPage";
import Lobby from "@/components/Lobby";

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-stone-950">
        <Loader />
      </div>
    );
  }

  if (!isSignedIn) {
    return <LandingPage />;
  }

  return <Lobby user={user} />;
}
