import { supabase } from "@/lib/supabase";

// --- Night Actions ---

export async function kill(wolf, target, roomId) {
  if (!supabase) return;
  if (
    !wolf ||
    !target ||
    !roomId ||
    wolf.role !== "wolf" ||
    wolf.is_action_done
  )
    return;

  await supabase
    .from("players")
    .update({ is_alive: false, dying_method: "wolf" })
    .eq("id", target.id);
  await supabase.from("rooms").update({ wolf_killed: true }).eq("id", roomId);
  await supabase
    .from("players")
    .update({ is_action_done: true })
    .eq("id", wolf.id);
}

export async function seePlayer(seer, target) {
  if (!supabase || !seer || !target || seer.role !== "seer" || seer.is_action_done) return;

  await supabase
    .from("players")
    .update({ is_action_done: true, last_seen_role: target.role })
    .eq("id", seer.id);
}

export async function savePlayer(doctor, target) {
  if (!supabase || !doctor || !target || doctor.role !== "doctor" || doctor.is_action_done)
    return;

  await supabase.from("players").update({ is_saved: true }).eq("id", target.id);
  await supabase
    .from("players")
    .update({ is_action_done: true })
    .eq("id", doctor.id);
}

// --- Day Actions ---

export async function voting(voter, target) {
  if (!supabase) return;
  console.log('im ' + voter.name + ' voting for ' + target.name);

  await supabase
    .from("players")
    .update({ voted_to: target.id, is_action_done: true })
    .eq("id", voter.id);
}

// --- AI Vote Target ---

export async function getAIVoteTarget(bot, alivePlayers) {
  const potentialTargets = alivePlayers.filter(p => p.id !== bot.id);
  if (potentialTargets.length === 0) return null;

  // Build context for wolves: don't vote fellow wolves
  let context = "";
  if (bot.role === "wolf") {
    const fellowWolves = alivePlayers.filter(p => p.role === "wolf" && p.id !== bot.id);
    if (fellowWolves.length > 0) {
      context += `You are secretly allied with: ${fellowWolves.map(w => w.name).join(", ")}. NEVER vote for them. `;
    }
  }
  if (bot.last_seen_role) {
    context += `Last night you investigated someone and found they are a ${bot.last_seen_role}. `;
  }

  // Filter player names for AI (exclude self)
  const playerNames = potentialTargets.map(p => p.name);

  try {
    const response = await fetch('/api/bot-vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: bot.role,
        players: playerNames,
        context: context || undefined,
      })
    });

    if (!response.ok) throw new Error('AI vote failed');

    const data = await response.json();

    if (data.target) {
      const matched = potentialTargets.find(
        p => p.name.toLowerCase() === data.target.toLowerCase()
      );
      if (matched) {
        console.log(`🤖 AI chose ${matched.name} for ${bot.name} (${bot.role})`);
        return matched;
      }
    }
  } catch (error) {
    console.warn("AI Vote failed, using random:", error);
  }

  // Fallback: random target
  const fallback = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
  console.log(`🎲 Fallback random target: ${fallback.name} for ${bot.name}`);
  return fallback;
}

// --- Fallback Messages ---

const getFallbackMessage = (bot, targetOfVote, isFollowUp = false) => {
  if (isFollowUp) {
    const followUps = [
      "I'm sticking with my vote. Something feels off about them.",
      "Anyone else notice how quiet they've been?",
      "We can't afford to make the wrong choice here...",
      "I've been watching everyone carefully. Trust me on this.",
      "Think about it — who's been acting the most suspicious?",
    ];
    return followUps[Math.floor(Math.random() * followUps.length)];
  }

  switch (bot.role) {
    case "wolf":
      const wolfMessages = [
        `I'm voting for ${targetOfVote.name}. They've been acting very suspicious.`,
        `Let's focus on ${targetOfVote.name}. I'm sure they are the wolf.`,
        `I have a bad feeling about ${targetOfVote.name}. Don't trust them.`,
      ];
      return wolfMessages[Math.floor(Math.random() * wolfMessages.length)];

    case "seer":
      if (bot.last_seen_role === "wolf") {
        return `I have seen the shadows... ${targetOfVote.name} is a WOLF! Trust me!`;
      } else if (bot.last_seen_role) {
        return `I gazed into the soul of a player last night... they are innocent. We must look elsewhere.`;
      } else {
        return "The spirits are cloudy today. I haven't found the evil yet.";
      }

    case "doctor":
      const doctorMessages = [
        "I'm trying my best to protect everyone. We need to be careful with our votes.",
        "Let's think logically about who to vote for. Hasty decisions are dangerous.",
      ];
      return doctorMessages[Math.floor(Math.random() * doctorMessages.length)];

    case "villager":
    default:
      const villagerMessages = [
        `I'm not sure, but I think ${targetOfVote.name} is suspicious.`,
        "This is so stressful! I don't know who to trust.",
        "I'll follow the group's vote for now, but we need more information.",
      ];
      return villagerMessages[Math.floor(Math.random() * villagerMessages.length)];
  }
};

// --- Single Message Helper ---

async function sendBotMessage(bot, roomId, targetOfVote, isFollowUp = false, previousMessage = "") {
  if (!supabase) return "";
  let channel = null;

  try {
    channel = supabase.channel(`room_${roomId}_typing_${bot.player_id}_${Date.now()}`);

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Channel timeout')), 5000);
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') { clearTimeout(timeout); resolve(); }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') { clearTimeout(timeout); reject(); }
      });
    });

    // Broadcast "Start Typing"
    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user: bot.name, isTyping: true }
    });

    // Typing simulation (1.5-3s)
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 1500));

    let messageContent = "";
    let isAI = false;

    try {
      const promptContext = isFollowUp
        ? `You already said: "${previousMessage}". Now add a follow-up reaction to the discussion. Be brief. Last seen role: ${bot.last_seen_role || 'none'}.`
        : `Last seen role: ${bot.last_seen_role || 'none'}.`;

      const response = await fetch('/api/bot-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: bot.role,
          targetName: targetOfVote.name,
          context: promptContext,
        })
      });

      if (!response.ok) throw new Error('AI chat failed');

      const data = await response.json();
      if (data.reply) {
        messageContent = data.reply;
        isAI = true;
      } else {
        throw new Error('No reply');
      }
    } catch (error) {
      console.warn("AI Chat failed, using fallback:", error);
      messageContent = getFallbackMessage(bot, targetOfVote, isFollowUp);
      isAI = false;
    }

    // Append debug suffix
    messageContent += isAI ? " [AI]" : " [FB]";

    await supabase.from("chat_messages").insert({
      room_id: roomId,
      player_id: bot.player_id,
      player_name: bot.name,
      message: messageContent,
      is_alive: bot.is_alive,
      role: bot.role,
    });

    // Broadcast "Stop Typing"
    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user: bot.name, isTyping: false }
    });

    return messageContent;

  } catch (err) {
    console.error("sendBotMessage error:", err);
    return "";
  } finally {
    if (channel) supabase.removeChannel(channel);
  }
}

// --- Bot Conversation (1-3 messages) ---

export async function botConversation(bot, roomId, allPlayers, targetOfVote) {
  if (!bot || !roomId || !allPlayers || !targetOfVote) return;

  // Initial stagger delay (0-4s) so bots don't all start at once
  await new Promise(r => setTimeout(r, Math.random() * 4000));

  // Message 1: Main message about their vote
  const msg1 = await sendBotMessage(bot, roomId, targetOfVote, false);

  // Message 2: 50% chance of follow-up after 5-10s
  if (Math.random() < 0.5) {
    await new Promise(r => setTimeout(r, 5000 + Math.random() * 5000));
    const msg2 = await sendBotMessage(bot, roomId, targetOfVote, true, msg1);

    // Message 3: 25% chance of another follow-up after 4-8s
    if (Math.random() < 0.5) {
      await new Promise(r => setTimeout(r, 4000 + Math.random() * 4000));
      await sendBotMessage(bot, roomId, targetOfVote, true, msg2);
    }
  }
}
