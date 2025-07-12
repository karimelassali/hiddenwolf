import { supabase } from "@/lib/supabase"

export async function playersRealtimeListening(roomId,fetchPlayers){
    const subscription = supabase
    .channel('players_channel')
    .on(
        'postgres_changes',
        {
            event: '*',
            schema: 'public',
            table: 'players',
            filter: `room_id=eq.${roomId}`,  
        
        },
        (payload)=>{
            console.log('🚨 payload im from ', payload);

            fetchPlayers();
        }
    )
    .subscribe();
}
