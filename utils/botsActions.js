import { supabase } from "@/lib/supabase";

// --- Night Actions ---

export async function kill(wolf, target, roomId) {
  if (!wolf || !target || !roomId || wolf.role !== "wolf" || wolf.is_action_done) return;
  
  await supabase.from("players").update({ is_alive: false, dying_method: "wolf" }).eq("id", target.id);
  await supabase.from("rooms").update({ wolf_killed: true }).eq("id", roomId);
  await supabase.from("players").update({ is_action_done: true }).eq("id", wolf.id);
}

// ✅ UPDATED: seePlayer now stores the role of the seen player in the new column.
export async function seePlayer(seer, target) {
  if (!seer || !target || seer.role !== "seer" || seer.is_action_done) return;

  // This update stores the role of the targeted player in the seer's own row.
  // This information will be used to generate a hint during the day.
  await supabase
    .from("players")
    .update({ is_action_done: true, last_seen_role: target.role })
    .eq("id", seer.id);
}

export async function savePlayer(doctor, target) {
  if (!doctor || !target || doctor.role !== "doctor" || doctor.is_action_done) return;

  await supabase.from("players").update({ is_saved: true }).eq("id", target.id);
  await supabase.from("players").update({ is_action_done: true }).eq("id", doctor.id);
}


// --- Day Actions ---

// ✅ UPDATED: The voting function now updates the `players` table, which is what your
// Game component expects to correctly process votes and determine who is eliminated.
export async function voting(voter, target) {

  await supabase
    .from("players")
    .update({ voted_to: target.id, is_action_done: true })
    .eq("id", voter.id);
}

// ✅ NEW: The messaging function is now much smarter and provides hints.
// It accepts the full context of the game to generate meaningful messages.
export async function messaging(bot, roomId, allPlayers, targetOfVote) {
  if (!bot || !roomId || !allPlayers || !targetOfVote) return;

  const getMessage = () => {
    switch (bot.role) {
      case 'wolf':
        // The wolf tries to deflect blame onto the innocent player they voted for.
        const wolfMessages = [
          `I'm voting for ${targetOfVote.name}. They've been acting very suspicious.`,
          `Let's focus on ${targetOfVote.name}. I'm sure they are the wolf.`,
          `I have a bad feeling about ${targetOfVote.name}. Don't trust them.`,
        ];
        return wolfMessages[Math.floor(Math.random() * wolfMessages.length)];

      case 'seer':
        // The seer gives a cryptic hint based on their last vision from the 'last_seen_role' column.
        if (bot.last_seen_role === 'wolf') {
          return "My vision last night was dark... there is evil among us.";
        } else if (bot.last_seen_role) { // Could be 'villager' or 'doctor'
          return "I saw an ally last night. We must stay strong and united.";
        } else {
          return "The spirits are cloudy today. I must be careful.";
        }

      case 'doctor':
        const doctorMessages = [
          "I'm trying my best to protect everyone. We need to be careful with our votes.",
          "Let's think logically about who to vote for. Hasty decisions are dangerous.",
        ];
        return doctorMessages[Math.floor(Math.random() * doctorMessages.length)];

      case 'villager':
      default:
        const villagerMessages = [
          `I'm not sure, but I think ${targetOfVote.name} is suspicious.`,
          "This is so stressful! I don't know who to trust.",
          "I'll follow the group's vote for now, but we need more information.",
        ];
        return villagerMessages[Math.floor(Math.random() * villagerMessages.length)];
    }
  };

  const messageContent = getMessage();

  // Insert the generated hint into your chat messages table.
  await supabase.from("chat_messages").insert({
    room_id: roomId,
    player_id: bot.player_id, // Use player_id for consistency
    player_name: bot.name,
    message: messageContent,
    is_alive: bot.is_alive,
    role: bot.role,
  });
};
