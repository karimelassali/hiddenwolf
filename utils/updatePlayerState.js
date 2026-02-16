import { supabase } from "@/lib/supabase";
import { calculateXpGain, getLevelFromXp } from "@/utils/levelSystem";

export async function updatePlayerState(playerId, data) {
  try {
    // Fetch player current state
    const { data: currentPlayer, error: playerError } = await supabase
      .from("player_stats")
      .select("*")
      .eq("player_id", playerId)
      .single();
    if (playerError) {
      throw playerError;
    }

    // Calculate XP gain
    const xpGained = calculateXpGain({
      won: !!data.win,
      role: data.role || "villager",
      survived: !!data.survived,
    });

    const newTotalXp = (currentPlayer.xp || 0) + xpGained;
    const prevLevel = currentPlayer.level || 1;
    const newLevel = getLevelFromXp(newTotalXp);

    // Update player state
    const updates = {
      player_id: playerId,
      total_games: data && data.newGame
        ? currentPlayer.total_games + 1
        : currentPlayer.total_games,
      wins: data && data.win ? currentPlayer.wins + 1 : currentPlayer.wins,
      losses:
        data && !data.newGame && !data.win
          ? currentPlayer.losses + 1
          : currentPlayer.losses,
      coins:
        data && data.prize
          ? (currentPlayer.coins || 0) + Number(data.prize)
          : currentPlayer.coins || 0,
      xp: newTotalXp,
      level: newLevel,
    };

    const { error: updateError } = await supabase
      .from("player_stats")
      .update(updates)
      .eq("player_id", playerId);

    if (updateError) {
      console.error("Update player state error:", updateError);
    }

    // Return level info for the modal
    return {
      xpGained,
      newTotalXp,
      prevLevel,
      newLevel,
      leveledUp: newLevel > prevLevel,
    };
  } catch (error) {
    console.error("updatePlayerState error:", error);
    return { xpGained: 0, newTotalXp: 0, prevLevel: 1, newLevel: 1, leveledUp: false };
  }
}
