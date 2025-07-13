import { useRouter } from "next/router"
import { FaLock } from "react-icons/fa";
import { IoTimerSharp } from "react-icons/io5";
import { supabase } from "@/lib/supabase";


import { Countdown } from "@/components/ui/countdown";

export default function GameNavbar({uid,roomData,currentPlayerId}) {


    const onCountDownFinished = async()=>{
        console.log(roomData)
        if(roomData['host_id']== currentPlayerId){
            const {error} = await supabase.from('rooms')
            .update({stage: 'day'})
            .eq('code',uid);
            if(error){
                console.log(error);
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
                Stage: {roomData['stage']}
            </div>
        </div>

        <div className="timer flex items-center gap-2">
            <IoTimerSharp className="text-white" />
            <Countdown number={50} usage="room" onComplete={() => {console.log('countdown finished');onCountDownFinished();}} />
        </div>
    </nav>
  )
}
