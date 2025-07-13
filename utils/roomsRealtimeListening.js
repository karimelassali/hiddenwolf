import { supabase } from "@/lib/supabase"


export async function roomsRealtimeListening(roomId,fetchRoomData){
    console.log('room id',roomId);
    const subscription = await supabase
    .channel('room_listening_channel')
    .on(
        'postgres_changes',
        {
            event: '*',
            schema: 'public',
            table: 'rooms',
        
        },
        (payload)=>{
            console.log('🚨 payload im from', payload);

            fetchRoomData();
        }
    )
    .subscribe();
    return () => {
        subscription.unsubscribe();
    };
}