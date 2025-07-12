import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from 'uuid';

export async function addBotsIfNeede(roomID,botCount){
    const baseRoles = ['wolf', 'seer', 'doctor'];
    const bots = [];
    for (let i = 0; i < botCount; i++) {
        bots.push({
            room_id: roomID,
            name: `bot${i+1}`,
            role: 'villager',
            is_alive: true,
            vote_to: null,
            player_id: uuidv4(),
        })
    };
    console.log('bots',bots);
    const {error} = await supabase.from('players').insert(bots);
    if(error){
        console.log('error adding bots',error);
    }
}   

        
