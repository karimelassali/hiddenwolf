'use client'
import { useRouter } from "next/router"
import { FaLock } from "react-icons/fa";
import { IoTimerSharp } from "react-icons/io5";
import { useState , useEffect } from "react";
import { supabase } from "@/lib/supabase";


import { Countdown } from "@/components/ui/countdown";

export default function GameNavbar({uid,roomData,currentPlayerId}) {
    const [counter,setCounter] = useState(5);


    const onCountDownFinished = async()=>{
        console.log(roomData)
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
