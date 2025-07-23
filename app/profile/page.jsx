'use client';

import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react'; 
import { useUser } from '@clerk/nextjs';

export default function Page() {
    const [playerState, setPlayerState] = useState(null);
    const { isLoaded, user } = useUser();

    const fetchUserState = async (playerId) => {
        const { data, error } = await supabase
            .from('player_stats')
            .select('*')
            .eq('player_id', playerId)
            .single();

        if (error) {
            console.error('Error fetching user data:', error.message);
            return;
        }
        setPlayerState(data);
    };

    useEffect(() => {
        if (isLoaded && user) {
            fetchUserState(user.id);
        }
    }, [isLoaded, user]);

    return (
        <div className="w-full h-full flex items-center justify-center border gap-10 border-amber-300">
            <pre className="bg-gray-100 p-4 rounded-lg">
                {JSON.stringify(playerState, null, 2)}
            </pre>
        </div>
    );
}
