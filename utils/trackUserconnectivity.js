import { supabase } from '@/lib/supabase';

export async function trackUserConnectivity(roomId, userId, roomHosterId) {
  const interval = setInterval(async () => {
    // ✅ تحديث آخر ظهور للمستخدم الحالي
    await supabase
      .from('players')
      .update({ last_seen: new Date().toISOString() })
      .eq('player_id', userId);

    console.log('last seen updated');

    // ✅ الحصول على اللاعبين غير النشطين
    const { data: inactivePlayers, error } = await supabase
      .from('players')
      .select('id, player_id, is_human')
      .eq('room_id', roomId)
      .lt('last_seen', new Date(Date.now() - 10000).toISOString());

    if (inactivePlayers?.length) {
      const idsToRemove = inactivePlayers.map((p) => p.id);

      // ✅ تحقق هل أحدهم هو الـ Host الحالي
      const isHostKicked = inactivePlayers.some((p) => p.player_id === roomHosterId);

      // ✅ حذف اللاعبين غير النشطين
      await supabase.from('players').delete().in('id', idsToRemove);
      console.log('🧹 removed inactive players:', idsToRemove);

      // ✅ تغيير المالك إذا كان قد تم طرده
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
}
