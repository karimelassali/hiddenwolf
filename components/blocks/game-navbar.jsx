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


export default function GameNavbar({uid,roomData,currentPlayerId}) {
    const [counter,setCounter] = useState(5);
    const [votingData,setVotingData] = useState([]);
    const [modalOpen,setModalOpen] = useState(false);

    //  const killMostVotedPlayer = async (roomData) => {
    //     const { data: votes, error: voteError } = await supabase
    //       .from("voting")
    //       .select("voted_id")
    //       .eq("room_id", roomData.id);
      
    //     if (voteError || !votes?.length) return toast.error("❌ لم يتم العثور على تصويت.");
      
    //     const counts = votes.reduce((acc, { voted_id }) => {
    //       acc[voted_id] = (acc[voted_id] || 0) + 1;
    //       return acc;
    //     }, {});
       
    //     const playerToKill = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    //     if (!playerToKill) return toast.error("❌ لا يوجد لاعب للقتل.");
      
    //     const { error: killError } = await supabase
    //       .from("players")
    //       .update({ is_alive: false })
    //       .eq("player_id", playerToKill)
      
    //     if (killError) return toast.error("❌ فشل قتل اللاعب.");
    //     toast.success("✅ اللاعب تم قتله.");
      
    //     await supabase.from("voting").delete().eq("room_id", roomData.id);
    //   };
      
      
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

    // useEffect(()=>{
    //     if(roomData.stage === 'night'){
    //         killMostVotedPlayer(roomData);
    //     }
    // },[roomData.stage])

  return (
    <>
    <Toaster />
    <nav className='w-full p-5 flex justify-between items-center bg-[#6c47ff] text-white'>

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
