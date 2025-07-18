import { supabase } from "@/lib/supabase";

export async function kill(currentBot,randomTarget,roomId){
    console.log('bot is' + JSON.stringify(currentBot))
   if(currentBot.role == 'wolf' && !currentBot.is_action_done){
   const {error} = await supabase.from('players')
   .update({is_alive: false,dying_method:'wolf'})
   .eq('id',randomTarget.id);
   if(error){
    console.log(error);
   }

   const {error:roomWolfKilledError} = await supabase.from('rooms')
   .update({wolf_killed:true})
   .eq('id',roomId);
   if(roomWolfKilledError){
    console.log(roomWolfKilledError);
   }
   await supabase.from('players').update({is_action_done:true}).eq('id',currentBot.id)
}
}

export async function seePlayer(currentBot,randomTarget){
    const chosenPlayerRole = randomTarget.role;
    console.log('bot see' + chosenPlayerRole.name + 'is' + chosenPlayerRole.role)
    // return chosenPlayerRole;
    await supabase.from('players').update({is_action_done:true}).eq('id',currentBot.id)

}

export async function savePlayer(currentBot,randomTarget){
    if(currentBot.role == 'doctor' && !currentBot.is_action_done){
    const {error} = await supabase.from('players')
    .update({is_saved: true})
    .eq('id',randomTarget.id);
    if(error){
        console.log(error);
    }
   await supabase.from('players').update({is_action_done:true}).eq('id',currentBot.id)

}
}


export async function voting(currentBot,randomTarget,roomId){
    console.log('Im ' + currentBot.name + ' and I voted ' + randomTarget.name)
    const {error} = await supabase
    .from('voting')
    .insert({
        room_id:roomId,
            round:1,
            voter_id:currentBot.id,
            voter_name:currentBot.name,
            voter_img:currentBot.img,
            voted_name:randomTarget.name,
            voted_id:randomTarget.id,
            voted_img:randomTarget.img
    })
    if(error){
        console.log(error);
    }
    await supabase.from('players').update({is_action_done:true}).eq('id',currentBot.id)
}