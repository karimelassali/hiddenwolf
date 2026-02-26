import { supabase } from '@/lib/supabase';

// Remove async from the exported function so it returns the interval ID synchronously
export function trackUserConnectivity(roomId, userId, roomHosterId) {
  const interval = setInterval(async () => {
    if (!supabase) return;
    // ✅ Update last seen for current user
    await supabase
      .from('players')
      .update({ last_seen: new Date().toISOString() })
      .eq('player_id', userId);

    console.log('last seen updated');

    // ✅ Get inactive players
    const { data: inactivePlayers, error } = await supabase
      .from('players')
      .select('id, player_id, is_human')
      .eq('room_id', roomId)
      .lt('last_seen', new Date(Date.now() - 10000).toISOString());

    if (inactivePlayers?.length) {
      const idsToRemove = inactivePlayers.map((p) => p.id);

      // ✅ Check if host is kicked
      const isHostKicked = inactivePlayers.some((p) => p.player_id === roomHosterId);

      // ✅ Remove inactive players
      await supabase.from('players').delete().in('id', idsToRemove);
      console.log('🧹 removed inactive players:', idsToRemove);

      // ✅ Reassign host if needed
      if (isHostKicked) {
        const { data: remainingPlayers } = await supabase
          .from('players')
          .select('player_id')
          .eq('room_id', roomId)
          .eq('is_human', true)
          .order('joined_at', { ascending: true })
          .limit(1);

        if (remainingPlayers?.length) {
          const newHostId = remainingPlayers[0].player_id;

          const { error: updateRoomError } = await supabase
            .from('rooms')
            .update({ host_id: newHostId })
            .eq('id', roomId);

          if (!updateRoomError) {
            console.log(`👑 New host assigned: ${newHostId}`);
          } else {
            console.error('❌ Failed to assign new host', updateRoomError);
          }
        }
      }
    }
  }, 5000);

  return interval; // CRITICAL: Return interval ID for cleanup
}
