import Image from "next/image";
import { FaCrown } from "react-icons/fa";
import {BorderBeam} from "@/components/magicui/border-beam";

export  function Players({fetched_players,room_host_id}) {
    return (
        <div className="flex-1  flex flex-col items-center justify-center">
           
        <div className="flex rounded-md p-5 flex-col items-center gap-5">
                
                {
                    fetched_players && fetched_players.map((player) => {
                        return (
                            <div key={player.id} className="m-4 relative flex backdrop-blur-lg border-l border-b border-slate-400 justify-between items-center p-5 gap-10 rounded-lg">
                                <Image className="w-20 h-20 relative object-cover border rounded-full" width={100} height={100} src={player.profile} alt="player profile pic" />
                                <BorderBeam color={"#F59E0B"} />
                                <p className="text-2xl text-center font-karla  text-white">{player.name}</p>
                                
                                {
                                    player.player_id === room_host_id && (
                                        <div className="flex absolute top-[-30px] left-0  items-center gap-2 animate-pulse">
                                            <FaCrown className="text-amber-900 text-2xl " size={50} />
                                        </div>
                                    )
                                }
                            </div>
                        )
                    })
                }
        </div>
    </div>
    );
}