'use client'
import { useRouter } from "next/router"
import { FaLock, FaCrown, FaBars, FaTimes } from "react-icons/fa"; // Added menu icons
import { IoTimerSharp, IoMoon, IoSunny } from "react-icons/io5";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Countdown } from "@/components/ui/countdown";
import { Vote } from "lucide-react";
import { Modal } from "@/components/modal";
import { toast, Toaster } from "react-hot-toast";

export default function GameNavbar({ uid, roomData, currentPlayerId, players }) {
    // --- ALL YOUR EXISTING LOGIC IS UNTOUCHED ---
    const [counter, setCounter] = useState(5);
    const [votingData, setVotingData] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    
    // ✅ UI STATE: New state to control the mobile menu's visibility
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const killMostVotedPlayerWhenMajority = async (roomData, players) => {
        const { data: votes, error: voteError } = await supabase.from("voting").select("voted_id, voted_name").eq("room_id", roomData.id);
        if (voteError || !votes?.length) { return toast.error("❌ لم يتم العثور على أي تصويت."); }
        const voteCounts = {};
        votes.forEach(({ voted_id }) => { voteCounts[voted_id] = (voteCounts[voted_id] || 0) + 1; });
        const sortedVotes = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
        const [topVotedId, topVoteCount] = sortedVotes[0] || [];
        const alivePlayersCount = players.filter(p => p.is_alive).length;
        const requiredVotes = Math.ceil(alivePlayersCount / 2);
        if (topVoteCount < requiredVotes) { return toast.error(`❌ لم يتم التصويت بما يكفي ( ${topVoteCount} من ${requiredVotes} مطلوب ).`); }
        const { error: killError } = await supabase.from("players").update({ is_alive: false }).eq("id", topVotedId);
        if (killError) { return toast.error("❌ فشل في قتل اللاعب."); }
        const killedPlayerName = votes.find(v => v.voted_id === topVotedId)?.voted_name;
        toast.success(`✅ تم قتل اللاعب ${killedPlayerName} (بـ ${topVoteCount} تصويت).`);
        await supabase.from("voting").delete().eq("room_id", roomData.id);
    };

    const onCountDownFinished = async () => {
        const { error } = await supabase.from('players').update({ is_action_done: false, is_saved: false }).eq('room_id', roomData.id)
        if (error) { console.log(error); }
        if (roomData.host_id == currentPlayerId) {
            if (roomData.stage == 'night') {
                const { error } = await supabase.from('rooms').update({ stage: 'day' }).eq('code', uid);
                if (error) { console.log(error); }
                setCounter(20)
            } else if (roomData.stage == 'day') {
                const { error } = await supabase.from('rooms').update({ stage: 'night' }).eq('code', uid);
                const { error: wolfKilledError } = await supabase.from('rooms').update({ wolf_killed: false }).eq('code', uid);
                wolfKilledError && console.log(wolfKilledError);
                if (error) { console.log(error); }
                setCounter(20)
            }
        } else {
            console.log('you are not the host');
        }
    }

    useEffect(() => {
        killMostVotedPlayerWhenMajority(roomData, players);
    }, [roomData.stage])

    const alivePlayersCount = players?.filter(p => p.is_alive).length || 0;
    const isHost = roomData.host_id === currentPlayerId;
    const isNight = roomData.stage === 'night';

    return (
        <>
            <Toaster />
            <nav className={`relative w-full px-4 py-3 transition-all duration-500 shadow-md ${
                isNight 
                    ? 'bg-gradient-to-r from-slate-900/90 to-purple-900/90 backdrop-blur-sm' 
                    : 'bg-gradient-to-r from-violet-600/90 to-indigo-700/90 backdrop-blur-sm'
            }`}>
                
                {/* ================================================================== */}
                {/* ✅ PROFESSIONAL UI: DESKTOP VIEW (> 640px)                      */}
                {/* This is hidden on mobile and shown on small screens and up.      */}
                {/* ================================================================== */}
                <div className="hidden sm:flex items-center justify-between gap-2">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-lg">
                            <FaLock className="w-4 h-4" /> <span className="font-semibold">Room {uid}</span>
                        </div>
                        {isHost && (
                            <div className="flex items-center gap-2 bg-yellow-500 text-yellow-900 px-3 py-2 rounded-lg font-medium">
                                <FaCrown className="w-4 h-4" /> <span>Host</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-lg">
                            {isNight ? <IoMoon className="w-5 h-5 text-purple-300" /> : <IoSunny className="w-5 h-5 text-yellow-300" />}
                            <span className="font-semibold capitalize">{roomData.stage}</span>
                        </div>
                        <div className="bg-black/20 px-3 py-2 rounded-lg">
                            <span className="text-white/70">Round </span>
                            <span className="font-bold text-lg">{roomData.round}</span>
                        </div>
                        <div className="bg-black/20 px-3 py-2 rounded-lg">
                            <span className="text-white/70">Alive </span>
                            <span className="font-bold text-lg text-green-400">{alivePlayersCount}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2 rounded-lg border border-red-400/30 bg-red-900/40">
                        <IoTimerSharp className="w-5 h-5 text-red-400 animate-pulse" />
                        {counter && <span className="font-mono font-bold text-xl text-red-300"><Countdown usage="room" onComplete={() => onCountDownFinished()} /></span>}
                    </div>
                </div>

                {/* ================================================================== */}
                {/* ✅ PROFESSIONAL UI: MOBILE VIEW (< 640px)                       */}
                {/* This is shown only on mobile and hidden on larger screens.       */}
                {/* ================================================================== */}
                <div className="flex sm:hidden items-center justify-between gap-2">
                    {/* Left: Hamburger Menu Button */}
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="z-20 p-2 text-white">
                        {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
                    </button>

                    {/* Center: Essential Status */}
                    <div className="flex items-center gap-2">
                         <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg">
                            {isNight ? <IoMoon className="w-5 h-5 text-purple-300" /> : <IoSunny className="w-5 h-5 text-yellow-300" />}
                            <span className="font-semibold capitalize text-sm">{roomData.stage}</span>
                        </div>
                        <div className="bg-black/20 px-3 py-1.5 rounded-lg">
                            <span className="font-bold text-base text-green-400">{alivePlayersCount}</span>
                            <span className="text-white/70 text-sm"> Alive</span>
                        </div>
                    </div>
                    
                    {/* Right: Timer */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-400/30 bg-red-900/40">
                        <IoTimerSharp className="w-5 h-5 text-red-400" />
                        {counter && <span className="font-mono font-bold text-lg text-red-300"><Countdown usage="room" onComplete={() => onCountDownFinished()} /></span>}
                    </div>
                </div>

                {/* Dropdown Mobile Menu Content */}
                {isMobileMenuOpen && (
                    <div className="sm:hidden absolute top-full z-5 0 left-0 w-full p-4 bg-slate-800 shadow-xl rounded-b-lg border-t border-slate-700">
                        <div className="flex z-50 flex-col gap-3">
                             <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-lg text-white">
                                <FaLock className="w-4 h-4 text-slate-400" />
                                <span className="font-semibold">Room: {uid}</span>
                            </div>
                            {isHost && (
                                <div className="flex items-center gap-2 bg-yellow-500 text-yellow-900 px-3 py-2 rounded-lg font-medium">
                                    <FaCrown className="w-4 h-4" />
                                    <span>You are the Host</span>
                                </div>
                            )}
                             <div className="bg-black/20 px-3 py-2 rounded-lg text-white">
                                <span className="text-white/70">Current Round: </span>
                                <span className="font-bold text-lg">{roomData.round}</span>
                            </div>
                        </div>
                    </div>
                )}

            </nav>

            {modalOpen && <Modal usage="voting" prop={votingData} onClose={() => { setModalOpen(false); }} />}
        </>
    )
}