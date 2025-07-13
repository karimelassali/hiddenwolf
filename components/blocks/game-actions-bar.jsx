import PlayerActions from "@/components/blocks/player-actions"
import { Button } from "@/components/ui/button"
export default function GameActionsBar({roomId,roomInfo,playerInfo,players}) {
    const onAction = async (player) => {
        console.log('from uysgcusygduysguycgdsi'+player.id);
        const {error} = await supabase.from('players')
        
    }
    
    return (
        <div className="flex items-center justify-between gap-5 bg-purple-600 p-5">
            <PlayerActions currentPlayer={playerInfo} roomInfo={roomInfo} players={players} onAction={onAction}/>
        </div>
    )
}
