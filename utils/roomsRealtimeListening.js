import { supabase } from "@/lib/supabase"


export async function roomsRealtimeListening(roomId,fetchRoomData){
    const subscription = supabase
    .channel('players_channel')
    .on(
        'postgres_changes',
        {
            event: '*',
            schema: 'public',
            table: 'rooms',
            filter: `code=eq.${roomId}`,  
        
        },
        (payload)=>{
            console.log('🚨 payload', payload);

            fetchRoomData();
        }
    )
    .subscribe();
}