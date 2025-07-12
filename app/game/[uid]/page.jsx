'use client'
import React from 'react'
import { useEffect , useState } from 'react'
import { supabase } from '@/lib/supabase'
import {  roomsRealtimeListening } from '@/utils/roomsRealtimeListening'
import GameNavbar  from '@/components/blocks/game-navbar'
import GameActionsBar from '@/components/blocks/game-actions-bar'
import { RolesModal } from '@/components/ui/rolesModal'
import { useUser } from '@clerk/nextjs'
import { playersRealtimeListening } from '@/utils/playersRealtimeListening'


export default function Game({ params }) {
    const [roomId,setRoomId] = useState('');
    const [roomData,setRoomData] = useState({});
    const [players, setPlayers] = useState([]);
    const fetchUser = useUser();
    const [user, setUser] = useState(null);
    const [role_preview, setRole_preview] = useState(false);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    


    const dayBackground =  'http://localhost:3000/assets/images/day.png';
    const nightBackground = 'http://localhost:3000/assets/images/night.png';


     const resolvedParams = React.use(params);
    
        const {uid} =  resolvedParams;

        useEffect(() => {
            if (fetchUser.isLoaded) {
                setUser(fetchUser.user);
            }
        }, [fetchUser]);

        useEffect(() => {
          if (user && players.length > 0) {
              const foundPlayer = players.find(player => player.player_id === user.id);
              if (foundPlayer) {
                  setCurrentPlayer(foundPlayer);
              }
          }
      }, [user, players]);

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

        //Fetch all players
        const fetchPlayers = async () => {
            if(!roomId){
                return;
            }
            const {data : players,error} = await supabase.from('players')
            .select('*')
            .eq('room_id',roomId);
            if(error){
                console.log(error);
            }
            // if(players.length < 4){
            //     console.log('not enough players');
            //     return;
            // }
            
            setPlayers(players);

        }

        const ApplyingRoles = async () => {
            const baseRoles = ['wolf', 'seer', 'doctor'];

            // تأكد أن عندك عدد اللاعبين
            // if (players.length < baseRoles.length) {
            //     console.warn('عدد اللاعبين أقل من عدد الأدوار الخاصة');
            //     return;
            // }

            // 1. أكمل الأدوار بالقرويين
            while (baseRoles.length < players.length) {
                baseRoles.push('villager');
            }

            // 2. خلط الأدوار
            const shuffled = baseRoles.sort(() => Math.random() - 0.5);
            console.log('Shuffled roles:', shuffled);

            // 3. ربط كل لاعب بدوره وتحديث Supabase
            for (let i = 0; i < players.length; i++) {
                const playerId = players[i].id;
                const role = shuffled[i];

                const { error } = await supabase
                    .from('players')
                    .update({ role })
                    .eq('id', playerId);

                if (error) {
                    console.log(`خطأ في تحديث اللاعب ${playerId}:`, error);
                } else {
                    const { error: roomAssignedRoles } = await supabase
                        .from('rooms')
                        .update({ roles_assigned: true })
                        .eq('id', roomId);
                    if (!roomAssignedRoles) {
                        // console.log('room updaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaated');
                    }
                }
            }
        }
        
        useEffect(()=>{
            fetchRoomData();
            fetchPlayers();
        },[roomId])


        // Listen to changes in the room and fetch the new data
        useEffect(()=>{
          if(uid && roomId){
            roomsRealtimeListening(uid,fetchRoomData);
            playersRealtimeListening(roomId,fetchPlayers);
          }
        },[uid,roomId])
        useEffect(()=>{
          setRole_preview(true);
        },[roomData.roles_assigned])

  return (
    <>
    
    <GameNavbar uid={uid}/>
    <div className="flex w-full justify-between flex-col md:flex-row gap-4">
      
      <section className="w-50 bg-red-300  px-4">
        <h2 className="text-2xl font-bold mb-4">Players</h2>
        {
            roomData.roles_assigned ? (
                <ul className="list-disc pl-4">
                {players.map(player => (
                    <li key={player.id} className="my-2">
                    <span className="font-bold">{player.name}</span> - {player.role}
                    </li>
                ))}
                </ul>
            ):(
                <p>No roles assigned yet</p>
            )
        }
      </section>

      <section className="w-full md:w-1/2 px-4">
        <div
          style={{
            backgroundImage: `url(${roomData.stage === 'night' ? nightBackground : dayBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
          className="h-screen grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {players.map(player => (
            <div
              key={player.id}
              className={` rounded-lg h-20 p-2 shadow-md border backdrop-blur-lg `}
            >
              <h2 className="text-sm font-bold">{player.name}</h2>
              <p className="text-xs">Role: {player.role}</p>
            </div>
          ))}
        </div>
        <div className=" flex justify-center items-center">
          {role_preview && roomData.roles_assigned && <RolesModal role={players.find(player => player.player_id === user?.id)?.role} />}
          {
            roomData.roles_assigned && setTimeout(() => {
              setRole_preview(false);
            }, 5000)
          }
        </div>

       
      </section>
      <div className="chat">
            <div className="chat-header">
                <h2 className="text-lg font-bold">Chat</h2>
            </div>
        </div>
    </div>
     {roomData.roles_assigned === false && roomData.host_id === user.id && (
        <div className="mt-4">
          <button
            onClick={ApplyingRoles}
            className="bg-blue-500 hover:bg-blue-700 text-white hover:bg-red-300 z-50 font-bold py-2 px-4 rounded-md"
          >
            Shuffle Roles
          </button>
        </div>
      )}
          <GameActionsBar 
            roomId={roomId} 
            roomInfo={roomData} 
            playerInfo={currentPlayer} 
          />
    </>
  );
}
