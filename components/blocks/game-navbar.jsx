'use client'
import { useRouter } from "next/router"
import { FaLock } from "react-icons/fa";
import { IoTimerSharp } from "react-icons/io5";
import { useState , useEffect } from "react";
import { supabase } from "@/lib/supabase";


import { Countdown } from "@/components/ui/countdown";
import { Vote } from "lucide-react";

export default function GameNavbar({uid,roomData,currentPlayerId}) {
    const [counter,setCounter] = useState(5);


    const onCountDownFinished = async()=>{


        //Reset that is_action_done to false to all players in the room exept the seer
        const {error} = await supabase.from('players')
        .update({is_action_done:false,is_saved:false})
        .eq('room_id',roomData.id)
        if(error){
            console.log(error);
        }
        //Reset voting table
        const {error:votingError} = await supabase.from('voting')
        .delete()
        .eq('room_id',roomData.id)
        if(votingError){
            console.log(votingError);
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


  return (
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
  )
}
