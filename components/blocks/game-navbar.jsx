'use client'
import { useRouter } from "next/router"
import { FaLock, FaCrown } from "react-icons/fa";
import { IoTimerSharp, IoMoon, IoSunny } from "react-icons/io5";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Countdown } from "@/components/ui/countdown";
import { Vote } from "lucide-react";
import { Modal } from "@/components/modal";
import { toast, Toaster } from "react-hot-toast";

export default function GameNavbar({ uid, roomData, currentPlayerId, players }) {
    const [counter, setCounter] = useState(5);
    const [votingData, setVotingData] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);

    const killMostVotedPlayerWhenMajority = async (roomData, players) => {
        // اجلب كل التصويتات لهذا الروم
        const { data: votes, error: voteError } = await supabase
            .from("voting")
            .select("voted_id, voted_name")
            .eq("room_id", roomData.id);

        if (voteError || !votes?.length) {
            return toast.error("❌ لم يتم العثور على أي تصويت.");
        }

        // احسب عدد الأصوات لكل لاعب
        const voteCounts = {};
        votes.forEach(({ voted_id }) => {
            voteCounts[voted_id] = (voteCounts[voted_id] || 0) + 1;
        });

        // حدد اللاعب الذي حصل على أكبر عدد من الأصوات
        const sortedVotes = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
        const [topVotedId, topVoteCount] = sortedVotes[0] || [];

        // احسب عدد اللاعبين الأحياء
        const alivePlayersCount = players.filter(p => p.is_alive).length;

        // شرط: إذا لم يحصل اللاعب على نصف عدد الأحياء أو أكثر لا تقتله
        const requiredVotes = Math.ceil(alivePlayersCount / 2);
        if (topVoteCount < requiredVotes) {
            return toast.error(`❌ لم يتم التصويت بما يكفي ( ${topVoteCount} من ${requiredVotes} مطلوب ).`);
        }

        // اقتل اللاعب
        const { error: killError } = await supabase
            .from("players")
            .update({ is_alive: false })
            .eq("id", topVotedId);

        if (killError) {
            return toast.error("❌ فشل في قتل اللاعب.");
        }

        // احصل على اسم اللاعب المقتول من التصويتات
        const killedPlayerName = votes.find(v => v.voted_id === topVotedId)?.voted_name;
        toast.success(`✅ تم قتل اللاعب ${killedPlayerName} (بـ ${topVoteCount} تصويت).`);

        // حذف التصويتات بعد القتل
        await supabase.from("voting").delete().eq("room_id", roomData.id);
    };

    const onCountDownFinished = async () => {
        //Reset that is_action_done to false to all players in the room exept the seer
        const { error } = await supabase.from('players')
            .update({ is_action_done: false, is_saved: false })
            .eq('room_id', roomData.id)
        if (error) {
            console.log(error);
        }

        if (roomData.host_id == currentPlayerId) {
            if (roomData.stage == 'night') {
                const { error } = await supabase.from('rooms')
                    .update({ stage: 'day' })
                    .eq('code', uid);
                if (error) {
                    console.log(error);
                }
                setCounter(20)
            } else if (roomData.stage == 'day') {
                const { error } = await supabase.from('rooms')
                    .update({ stage: 'night' })
                    .eq('code', uid);

                const { error: wolfKilledError } = await supabase.from('rooms')
                    .update({ wolf_killed: false })
                    .eq('code', uid);
                wolfKilledError && console.log(wolfKilledError);

                if (error) {
                    console.log(error);
                }
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
            <nav className={`w-full px-6 py-4 transition-all duration-500 ${
                isNight 
                    ? 'bg-gradient-to-r from-slate-900 to-purple-900 text-white' 
                    : 'bg-gradient-to-r from-violet-600 to-indigo-700 text-white'
            }`}>
                <div className="flex items-center justify-between">
                    
                    {/* Left - Room Info */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm">
                            <FaLock className="w-4 h-4" />
                            <span className="font-semibold">Room {uid}</span>
                        </div>
                        
                        {isHost && (
                            <div className="flex items-center gap-2 bg-yellow-500 text-yellow-900 px-3 py-2 rounded-lg font-medium">
                                <FaCrown className="w-4 h-4" />
                                <span>Host</span>
                            </div>
                        )}
                    </div>

                    {/* Center - Game Status */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                            {isNight ? <IoMoon className="w-4 h-4 text-purple-300" /> : <IoSunny className="w-4 h-4 text-yellow-300" />}
                            <span className="font-semibold capitalize">{roomData.stage}</span>
                        </div>
                        
                        <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                            <span className="text-white/70">Round </span>
                            <span className="font-bold text-lg">{roomData.round}</span>
                        </div>
                        
                        <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                            <span className="text-white/70">Alive </span>
                            <span className="font-bold text-lg text-green-400">{alivePlayersCount}</span>
                        </div>
                    </div>

                    {/* Right - Timer */}
                    <div className="flex items-center gap-3  px-4 py-2 rounded-lg border border-red-400/30">
                        <IoTimerSharp className="w-5 h-5 text-red-400 animate-pulse" />
                        {counter && (
                            <span className="font-mono font-bold text-xl text-red-300">
                                <Countdown 
                                    usage="room" 
                                    onComplete={() => {
                                        console.log('countdown finished');
                                        onCountDownFinished();
                                    }} 
                                />
                            </span>
                        )}
                    </div>
                </div>
            </nav>

            {modalOpen && (
                <Modal 
                    usage="voting" 
                    prop={votingData} 
                    onClose={() => { setModalOpen(false); }} 
                />
            )}
        </>
    )
}