'use client'
import {useUser} from '@clerk/nextjs'
import { useEffect , useState } from 'react'
import { supabase } from '@/lib/supabase'
import React from 'react'
import {Players} from '@/components/Players'
import { useRouter } from 'next/navigation'
import {Countdown} from '@/components/ui/countdown'
import { addBotsIfNeede } from '@/utils/addBotsIfNeeded'
import {trackUserConnectivity} from '@/utils/trackUserconnectivity'






export default function Room({params}) {
    const resolvedParams = React.use(params);

    const {uid} =  resolvedParams;
    const router = useRouter();
    const [roomId,setRoomId] = useState('');
    const [roomData,setRoomData] = useState({});
    const [user, setUser] = useState([]);
    const fetchUser = useUser();
    const [players, setPlayers] = useState([]);
    const [hasRoomBeenPlayed, setHasRoomBeenPlayed] = useState(false);


    useEffect(()=>{
        if(fetchUser.isLoaded){
            setUser(fetchUser.user);
            

        }
    },[fetchUser])

    const fetchRoomData = async () => {
        const {data : roomData,error} = await supabase.from('rooms')
        .select('*')
        .eq('code',uid)
        .single();
        if(error){
            console.log(error);
        }
        setRoomId(roomData?.id);
        setRoomData(roomData);
    }
  
    const addPlayer = async () => {
        if (!user.fullName || !roomId) return;
    
        try {
            await fetchRoomData();
            
            // First, check if player exists in any room
            const { data: existingPlayer, error: findError } = await supabase
                .from('players')
                .select('id, room_id')
                .eq('player_id', user.id)
                .maybeSingle();
    
            if (findError) throw findError;
    
            const playerData = {
                room_id: roomId,
                name: user.fullName,
                role: null,
                is_alive: true,
                vote_to: null,
                player_id: user.id,
                last_seen: new Date().toISOString(),
                is_human:true,
                profile:user.imageUrl,

            };
    
            if (existingPlayer) {
                // If player exists in a different room, delete the old record
                if (existingPlayer.room_id !== roomId) {
                    const { error: deleteError } = await supabase
                        .from('players')
                        .delete()
                        .eq('id', existingPlayer.id);
                    
                    if (deleteError) throw deleteError;
                    console.log('🗑️ Removed player from previous room');
                    
                    // Insert new record in the new room
                    const { error: insertError } = await supabase
                        .from('players')
                        .insert(playerData);
                    
                    if (insertError) throw insertError;
                    console.log('✅ Player moved to new room');
                } else {
                    // Update existing player in the same room
                    const { error: updateError } = await supabase
                        .from('players')
                        .update(playerData)
                        .eq('id', existingPlayer.id);
                    
                    if (updateError) throw updateError;
                    console.log('🔄 Player updated in room');
                }
            } else {
                // Insert new player
                const { error: insertError } = await supabase
                    .from('players')
                    .insert(playerData);
                
                if (insertError) throw insertError;
                console.log('✅ New player added to room');
            }
        } catch (error) {
            console.error('Error in addPlayer:', error);
        }
    };


    useEffect(() => {
        const initialize = async () => {
            if (user.fullName) {
                await fetchRoomData();
                await addPlayer();
            }   
        };
        initialize();
    }, [user.fullName, roomId]);

    useEffect(()=>{ 
        if (!roomId){
            return;
        }
        const fetchPlayers = async () => {
            console.log(roomId+'from id');
            if(roomId){
            try {
                const { data: players, error } = await supabase
                .from('players')
                .select('*')
                .eq('room_id', roomId)
                .order('id', { ascending: true });
                if (error) {
                    console.log(error);
                }
                setPlayers(players);
            } catch (error) {
                console.log(error);
            }
        }
    }
    fetchPlayers();
    console.log('✅ filter used:', `room_id=eq.${roomId}`)

    const subscription = supabase
    .channel('players_channel')
    .on(
        'postgres_changes',
        {
            event: '*',
            schema: 'public',
            table: 'players',
            filter: `room_id=eq.${roomId}`,  
        
        },
        (payload)=>{
            console.log('🚨 payload', payload);

            fetchPlayers();
        }
    )
    .subscribe();


    const roomsSubscription = supabase
    .channel('rooms_channel')
    .on(
        'postgres_changes',
        {
            event: '*',
            schema: 'public',
            table: 'rooms',
            filter: `id=eq.${roomId}`,  
        
        },
        (payload)=>{
            console.log('🚨 Rooms payload', payload);
            fetchRoomData();
            
        }
    )
    .subscribe();
    return () => {
        supabase.removeChannel(roomsSubscription);
        supabase.removeChannel(subscription);
        }
    },[roomId])

    //Interval for keep tracking on user if he is online or offline
    useEffect(()=>{

        if(roomId && user.id){
            trackUserConnectivity(roomId,user.id,roomData.host_id);
        }
       
    },[roomId,user.id])



    useEffect(()=>{
        if(roomData.stage === 'night'){
            // router.push(`/game/${roomData.code}`);
           setHasRoomBeenPlayed(true);

        }
    },[roomData.stage])
    
    return (
        hasRoomBeenPlayed ? (
            <div className="h-screen flex items-center justify-center">
                <div className="flex items-center">
                    <Countdown number={10} target={'/game/'+roomData.code} />
                </div>
            </div>
        ) : (
            <div className="h-screen flex p-5 flex-col">
            <Players fetched_players={players}/>
            <div className="fixed flex w-full  bottom-0 justify-between items-end border-t border-gray-200 p-4 ">
            {roomData.stage}
                {
                    roomData && roomData.host_id !== user?.id ?(
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                            <p className="ml-2">Waiting for host to start game</p>
                        </div>
                    ) : (
                        <>
                                <div className="flex items-center">
                                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                    <p className="text-2xl">{players.length}</p>
                                </div>
                                <p className="ml-2">Players in this room</p>
                            </div>
                            
                            <button onClick={async ()=>{
                                try {
                                    if (roomData.stage === 'night') {
                                        const { data, error } = await supabase
                                            .from('rooms')
                                            .update({stage: 'waiting'})
                                            .eq('id', roomId);
                                        if (error) {
                                            console.log(error);
                                        }
                                    } else {
                                        
                                            addBotsIfNeede(roomId, 4 - players.length)
                                        
                                        
                                        const { data, error } = await supabase
                                            .from('rooms')
                                            .update({stage: 'night'})
                                            .eq('id', roomId);
                                        if (error) {
                                            console.log(error);
                                        }
                                    }
                                } catch (error) {
                                    console.log(error);
                                }
                            }} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full">
                                {roomData.stage === 'play' ? 'Stop' : 'Start Game'}
                            </button>
                        </>
                    )
                        
                    
                }
               
            </div>
        </div>
        )
     
    )
}