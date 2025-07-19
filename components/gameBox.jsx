import { useState } from "react";
import { RolesModal } from "@/components/ui/rolesModal";

export default function gamebox({roomData,players,currentPlayerId}){
        const [role_preview, setRole_preview] = useState(false);
    
     const dayBackground =  'http://localhost:3000/assets/images/day.png';
        const nightBackground = 'http://localhost:3000/assets/images/night.png';
    return(
          <section className="w-full md:w-1/2 px-4">
                <div
                  style={{
                    backgroundImage: `url(${roomData.stage === 'night' ? nightBackground : dayBackground})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                  className="h-screen grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {players.map(player => (
                    <div
                      key={player.id}
                      className={` rounded-lg h-20 p-2 shadow-md border backdrop-blur-lg `}
                    >
                      <h2 className="text-sm font-bold">{player.name}</h2>
                      <p className="text-xs">Role: {player.role}</p>
                    </div>
                  ))}
                </div>
                <div className=" flex justify-center items-center">
                  {role_preview && roomData.roles_assigned && players.find(player => player.player_id === currentPlayerId) && <RolesModal role={players.find(player => player.player_id === currentPlayerId)?.role} />}
                  {
                    roomData.roles_assigned && setTimeout(() => {
                      setRole_preview(false);
                    }, 5000)
                    
                  }
                </div>
               
              </section>
    )
}