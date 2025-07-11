'use client'
import {useUser} from '@clerk/nextjs'
import { useEffect , useState } from 'react'
import { supabase } from '@/lib/supabase'
import React from 'react'
import {Players} from '@/components/Players'
import { useRouter } from 'next/navigation'
import {Countdown} from '@/components/ui/countdown'
import { addBotsIfNeede } from '@/utils/addBotsIfNeeded'







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
        console.log(user.fullName);
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
    useEffect(() => {

        const addPlayer = async () => {
            try {
                fetchRoomData();
                if(user.fullName && roomId){
                const { data: existingPlayers } = await supabase
                .from('players')
                .select('id')
                .eq('room_id', roomId)
                .eq('player_id', user.id);

  
                if (existingPlayers && existingPlayers.length > 0) {
                    console.log('🟡 Player already exists, skipping insert');
                    return;
                }
                }

        if(roomId && user.fullName){
            supabase.from('players').upsert({'room_id': roomId, 'name': user.fullName,role:'wolf',is_alive:true,vote_to:null,'player_id':user.id},{
               onConflict:'player_id'
            })
            .then(() => {
                console.log('Player added to room');
            })
            .catch((error) => {
                console.log(error);
            })
        }
            } catch (error) {
                console.log(error);
            }
        }
        addPlayer();
       

    },[user.fullName,roomId])

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
            filter: `room_id=eq.${roomId}`,  // إضافي: اشتراك فقط على هذه الغرفة
        
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
            filter: `id=eq.${roomId}`,  // إضافي: اشتراك فقط على هذه الغرفة
        
        },
        (payload)=>{
            console.log('🚨 Rooms payload', payload);
            fetchRoomData();
            
        }
    )
    .subscribe();
    return () => {
        supabase.removeChannel(subscription);
        }
    },[roomId])

    //Interval for keep tracking on user if he is online or offline
    useEffect(()=>{
        const interval = setInterval(async () => {
              await supabase.from('players').update({last_seen:new Date().toISOString()}).eq('player_id',user.id);
            console.log('last seen updated');
            const { data: inactivePlayers, error } = await supabase
                .from('players')
                .select('id, last_seen')
                .eq('room_id', roomId)
                .lt('last_seen', new Date(Date.now() - 30000).toISOString());

                if (inactivePlayers?.length) {
                const ids = inactivePlayers.map((p) => p.id);
                await supabase.from('players').delete().in('id', ids);
                console.log('🧹 removed inactive players:', ids);
                }
        },10000)
        return () => clearInterval(interval);
       
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
                                        if(players.length < 4){
                                            addBotsIfNeede(roomId,4);   
                                        }
                                        
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