import { supabase } from "@/lib/supabase";

export async function kill(currentBot,players){
   const alivePlayers = players.filter((player) => player.is_alive && player.player_id !== currentBot.player_id);
   const randomToKill = Math.floor(Math.random() * alivePlayers.length); 
   if(alivePlayers.length == 1){
    return;
   }
   if(currentBot.role == 'wolf' && !currentBot.is_action_done){
   const {error} = await supabase.from('players')
   .update({is_alive: false})
   .eq('id',alivePlayers[randomToKill].id);
   if(error){
    console.log(error);
   }
   }
}

export async function seePlayer(currentBot,players){
    const alivePlayers = players.filter((player) => player.is_alive && player.player_id !== currentBot.player_id);
    const randomToSee = Math.floor(Math.random() * alivePlayers.length); 
    const chosenPlayerRole = alivePlayers[randomToSee].role;
    return chosenPlayerRole;

}

export async function savePlayer(currentBot,players){
    const alivePlayers = players.filter((player) => player.is_alive && player.player_id );
    const randomToSave = Math.floor(Math.random() * alivePlayers.length); 
    if(currentBot.role == 'doctor' && !currentBot.is_action_done){
    const {error} = await supabase.from('players')
    .update({is_saved: true})
    .eq('id',alivePlayers[randomToSave].id);
    if(error){
        console.log(error);
    }
}
}


// export async function voting(roomInfo,players){
//     const alivePlayers = players.filter((player) => player.is_alive);
//     const randomToVote = Math.floor(Math.random() * alivePlayers.length); 
//     const {error} = await supabase
//     .from('voting')
//     .insert({
//         room_id: roomInfo.id,
//         voted_id: alivePlayers[randomToVote].id
//     })
//     if(error){
//         console.log(error);
//     }
// }