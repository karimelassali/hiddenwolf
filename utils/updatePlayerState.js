import { supabase } from "@/lib/supabase";
export async function updatePlayerState(playerId, data) {
  try {
    //Fetch player current state
    const { data: currentPlayer, error: playerError } = await supabase
      .from("player_stats")
      .select("*")
      .eq("player_id", playerId)
      .single();
    if (playerError) {
      throw error;
    }

    //Update player state
    const playerNewStates = 
      {
        player_id: playerId,
        win: data  && data.win ? currentPlayer.wins + 1 : currentPlayer.wins,
        lose: data && !data.newGame && !data.win ? currentPlayer.losses + 1 : currentPlayer.losses,
        newGame:
          data && data.newGame
            ? currentPlayer.total_games + 1
            : currentPlayer.total_games,
      }
    ;

    console.log(playerNewStates);
    const { data: updatedPlayer, error: updateError } = await supabase
      .from("player_stats")
      .update({
        player_id: playerNewStates.player_id,
        total_games: playerNewStates.newGame,
        wins: playerNewStates.win,
        losses: playerNewStates.lose,
      })
      .eq("player_id", playerId);
    updateError && console.log(updateError);
  } catch (error) {
    throw error;
  }
}
