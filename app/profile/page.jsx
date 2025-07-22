'use client'
import {supabase} from '@/lib/supabase'
import { useEffect,useState } from 'react'; 
import { useUser } from '@clerk/nextjs';
export default function Page() {
    const [playerState, setPlayerState] = useState([]);
    const [user,setUser] = useState(null);

    const player = useUser();

    const fetchUserState = async (playerId) => {
        const { data: userData, error } = await supabase.from('player_stats').select('*');
        if (error) {
            console.error('Error fetching user data:', error);
        }
        setPlayerState(userData);
        return userData;
    };



    useEffect(()=>{
        if(player.isLoaded){
            setUser(player.user);
            fetchUserState(player.user.id)
        }
    },[])
    return (
        <div className="w-full h-full flex items-center justify-center border gap-10 border-amber-300">
                {JSON.stringify(playerState)}   
        </div>
    );
}