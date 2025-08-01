import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from 'uuid';
import {faker} from '@faker-js/faker';

export async function addBotsIfNeeded(roomID,botCount){
    const baseRoles = ['wolf', 'seer', 'doctor'];
    const bots = [];
    for (let i = 0; i < botCount; i++) {
        const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${faker.person.firstName()}`;

        bots.push({
            room_id: roomID,
            name: faker.person.firstName(),
            role: null,
            is_alive: true,
            voted_to: null,
            player_id: uuidv4(),
            is_human:false,
            profile:avatarUrl,
        })
    };
    console.log('bots',bots);
    const {error} = await supabase.from('players').insert(bots);
    if(error){
        console.log('error adding bots',error);
    }
}   

        
