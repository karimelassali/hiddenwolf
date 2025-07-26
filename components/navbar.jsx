import { NetworkTracking } from "./networkTracking";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { GiWolfHowl } from "react-icons/gi";
import {BackgroundSound} from "@/utils/sounds";

export const Navbar = () => {

  return (
    <header className="flex justify-between items-center overflow-hidden p-5 gap-4 h-16"> 
      {BackgroundSound()}
    <div className="flex items-center gap-2">
      <GiWolfHowl size={50} />
      <h5 className="text-xl font-bold">The Hidden Wolf</h5>
    </div>
    <div className="flex items-center gap-4">   
    <NetworkTracking />
            <SignedOut>
              <SignInButton />
              <SignUpButton>
                <button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
    </div>
          
    </header>
  );
};
