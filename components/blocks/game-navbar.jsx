'use client'
import { useRouter } from "next/router"
import { FaLock } from "react-icons/fa";
import { IoTimerSharp } from "react-icons/io5";
import { useState , useEffect } from "react";
import { supabase } from "@/lib/supabase";


import { Countdown } from "@/components/ui/countdown";
import { Vote } from "lucide-react";
import { Modal } from "@/components/modal";
import { toast , Toaster } from "react-hot-toast";


export default function GameNavbar({uid,roomData,currentPlayerId,players}) {
    const [counter,setCounter] = useState(5);
    const [votingData,setVotingData] = useState([]);
    const [modalOpen,setModalOpen] = useState(false);

    
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
      
    const onCountDownFinished = async()=>{
        //Reset that is_action_done to false to all players in the room exept the seer
        const {error} = await supabase.from('players')
        .update({is_action_done:false,is_saved:false})
        .eq('room_id',roomData.id)
        if(error){
            console.log(error);
        }



        if(roomData.host_id == currentPlayerId){
            if(roomData.stage== 'night'){
                const {error} = await supabase.from('rooms')
                .update({stage: 'day'})
                .eq('code',uid);
                if(error){
                    console.log(error);
                }
                setCounter(20)
            }else if(roomData.stage == 'day'){

                
                const {error} = await supabase.from('rooms')
                .update({stage: 'night'})
                .eq('code',uid);


                const {error:wolfKilledError} = await supabase.from('rooms')
                .update({wolf_killed: false})
                .eq('code',uid);
                wolfKilledError && console.log(wolfKilledError);

                if(error){
                    console.log(error);
                }
                setCounter(20)
            }
        }else{
            console.log('you are not the host');
        }
        
    }

    useEffect(()=>{
        killMostVotedPlayerWhenMajority(roomData,players);
    },[roomData.stage])

  return (
    <>
    <Toaster />
    <nav className='w-full p-5 flex justify-between items-center bg-[#6c47ff] text-white'>
{
    roomData.host_id == currentPlayerId && ('hello host')
}
        <div className="room-name flex items-center gap-2">
            <FaLock className="text-white" />
            Room {uid}
        </div>

        <div className="flex items-center gap-5">
            <div className="stage">
                Stage: {roomData.stage}
            </div>
        </div>

        <div className="timer flex items-center gap-2">
            <IoTimerSharp className="text-white" />
            {
                counter && (
                    <Countdown  usage="room" onComplete={() => {console.log('countdown finished');onCountDownFinished();}} />
                )
            }
        </div>
    </nav>

    {/* {
        modalOpen && (
            <Modal usage="voting" prop={votingData} onClose={()=>{setModalOpen(false);}} />
        )
    } */}
    </>
  )
}
