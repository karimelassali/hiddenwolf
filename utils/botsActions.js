import { supabase } from "@/lib/supabase";

export async function kill(currentBot, randomTarget, roomId) {
  console.log("bot is" + JSON.stringify(currentBot));
  if (currentBot.role == "wolf" && !currentBot.is_action_done) {
    const { error } = await supabase
      .from("players")
      .update({ is_alive: false, dying_method: "wolf" })
      .eq("id", randomTarget.id);
    if (error) {
      console.log(error);
    }

    const { error: roomWolfKilledError } = await supabase
      .from("rooms")
      .update({ wolf_killed: true })
      .eq("id", roomId);
    if (roomWolfKilledError) {
      console.log(roomWolfKilledError);
    }
    await supabase
      .from("players")
      .update({ is_action_done: true })
      .eq("id", currentBot.id);
  }
}

export async function seePlayer(currentBot, randomTarget) {
  const chosenPlayerRole = randomTarget.role;
  console.log("bot see" + chosenPlayerRole.name + "is" + chosenPlayerRole.role);
  // return chosenPlayerRole;
  await supabase
    .from("players")
    .update({ is_action_done: true })
    .eq("id", currentBot.id);
}

export async function savePlayer(currentBot, randomTarget) {
  if (currentBot.role == "doctor" && !currentBot.is_action_done) {
    const { error } = await supabase
      .from("players")
      .update({ is_saved: true })
      .eq("id", randomTarget.id);
    if (error) {
      console.log(error);
    }
    await supabase
      .from("players")
      .update({ is_action_done: true })
      .eq("id", currentBot.id);
  }
}

export async function voting(currentBot, randomTarget, roomId) {
  console.log("Im " + currentBot.name + " and I voted " + randomTarget.name);
  const { error } = await supabase.from("voting").insert({
    room_id: roomId,
    round: 1,
    voter_id: currentBot.id,
    voter_name: currentBot.name,
    voter_img: currentBot.img,
    voted_name: randomTarget.name,
    voted_id: randomTarget.id,
    voted_img: randomTarget.img,
  });
  if (error) {
    console.log(error);
  }
  await supabase
    .from("players")
    .update({ is_action_done: true })
    .eq("id", currentBot.id);
}

export async function messaging(currentBot, roomId) {
  const data = {
    message:BotsMessages(currentBot.role) || 'hello',
  };
  setTimeout(async ()=>{
    const { error } = await supabase
    .from("chat_messages")
    .insert({
      room_id: roomId,
      player_id: currentBot.player_id,
      player_name: currentBot.name,
      message:data.message,
      is_alive:currentBot.is_alive,
      role:currentBot.role
    });
  },Math.floor(Math.random() * 3000) + 1000)
 
}

export function BotsMessages(role) {
  const botDialogues = {
    wolf: [
      "Silence hides more than words... Some use speech as a veil.",
      "Everyone’s acting strange lately—who’s even trustworthy?",
      "The night hides too many secrets... Doubt feeds on itself.",
      "I can’t read anyone’s intentions anymore. Masks everywhere.",
      "Betrayal comes from where you least expect... That’s the game.",
      "Sometimes silence speaks louder... Patience has a bitter taste.",
      "The only truth? No one here is completely clean.",
      "Every step here... like walking through a minefield.",
      "Fear makes people accuse even their own shadows.",
    ],
    seer: [
      "Gut feelings never lie... Something’s off beneath the surface.",
      "Can you feel the tension? Like something terrible is coming.",
      "Eyes reveal too much... if you know where to look.",
      "Everything’s shrouded... I’m just trying to piece it together.",
      "Blind trust might be our downfall.",
      "Instinct is a curse and a gift... especially in the dark.",
      "Every word here carries weight... I’m watching them all.",
      "Time will reveal everything... But will it be too late?",
    ],
    doctor: [
      "Hard choices are our fate... Who can bear that weight?",
      "I wish I could protect everyone... But life isn’t fair.",
      "Regret is bitter... especially when you misjudge.",
      "True strength is staying human in this nightmare.",
      "In the dark... we see who we really are.",
      "Death stalks us all... Who’s next?",
      "I try to be fair... but fairness is impossible here.",
      "Hearts are trembling... Fear lives in their eyes.",
    ],
    villager: [
      "The weak might be stronger than they seem... and vice versa.",
      "Why would the innocent fear? Because doubt is a blade.",
      "Every night stretches longer... The nightmare repeats.",
      "Loneliness kills here... but trust kills faster.",
      "Are we living to play, or playing to live?",
      "Truth is a mirage... The closer you think you are, the further it slips.",
      "I’m stuck in a spiral... Everything spins but never moves.",
      "Faces smile... but what’s beneath them?",
      "We search for salvation... while digging our graves.",
    ],
  };
  const botMessage = botDialogues[role][
    Math.floor(Math.random() * botDialogues[role].length)
  ];
  return botMessage;
}
