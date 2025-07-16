'use client'
import React from 'react'
import dynamic from 'next/dynamic';

import { useEffect , useState } from 'react'
import { supabase } from '@/lib/supabase'
import GameNavbar  from '@/components/blocks/game-navbar'
import GameActionsBar from '@/components/blocks/game-actions-bar'
import { RolesModal } from '@/components/ui/rolesModal'
import { useUser } from '@clerk/nextjs'

const StageResult = dynamic(()=>import('@/components/ui/stageResult'),{ssr:false});


export default function Game({ params }) {
    const [roomId,setRoomId] = useState('');
    const [roomData,setRoomData] = useState({});
    const [players, setPlayers] = useState([]);
    const fetchUser = useUser();
    const [user, setUser] = useState(null);
    const [role_preview, setRole_preview] = useState(false);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [stageResultModal,setStageResultModal] = useState(false);
    const [votingData,setVotingData] = useState([]);
    


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


        const fetchVotingData = async()=>{
          const {data,error} = await supabase.from('voting').select('*').eq('room_id',roomId);
          if(error){
            console.log(error);
          }
          if(data){
            setVotingData(data);
          }
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
        },[uid])

        useEffect(()=>{
            fetchPlayers();
            fetchVotingData();
          },[roomId])



        // Listen to changes in the room and fetch the new data

        useEffect(()=>{
          roomsRealtimeListening(roomId,fetchRoomData);
          playersRealtimeListening(roomId,fetchPlayers);
          votingRealtimeListening(roomId,fetchVotingData);
        },[roomId])

       
        
          
        
      useEffect(() => {
        if (!roomData.roles_assigned || !players || !user?.id) return;
      
        const currentPlayer = players.find(player => player.player_id === user.id);
        if (currentPlayer?.role) {
          setRole_preview(true);
        }
      }, [roomData.roles_assigned, players.role, user?.id]);

       useEffect(()=>{
        if(roomData.stage === 'day' && roomData.wolf_killed){
          setStageResultModal(true);
          setTimeout(()=>{
            setStageResultModal(false);
          },5000)
        }

       },[roomData.stage])

       //Fetching the voting data from voting table
     
       
       


  return (
    <>
    
    <div className="flex gap-2">
      <button
        onClick={async () => {
          await supabase
            .from('players')
            .update({ role: 'wolf' })
            .eq('id', currentPlayer?.id)
            ;
        }}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
      >
        Make me wolf
      </button>
      <button
        onClick={async () => {
          await supabase
            .from('players')
            .update({ role: 'seer' })
            .eq('id', currentPlayer?.id)
            ;
        }}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full"
      >
        Make me seer
      </button>
      <button
        onClick={async () => {
          await supabase
            .from('players')
            .update({ role: 'villager' })
            .eq('id', currentPlayer?.id)
            ;
        }}
        className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-full"
      >
        Make me villager
      </button>
      <button
        onClick={async () => {
          await supabase
            .from('players')
            .update({ role: 'doctor' })
            .eq('id', currentPlayer?.id)
            ;
        }}
        className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-full"
      >
        Make me doctor
      </button>
      <button
        onClick={async () => {
          await supabase
            .from('players')
            .update({ is_alive: true })
            .eq('id', currentPlayer?.id)
            ;
        }}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full"
      >
        Make me alive
      </button>
      
    </div>
    {
      roomData.roles_assigned && currentPlayer &&(
        <GameNavbar roomData={roomData} uid={uid} currentPlayerId={currentPlayer && currentPlayer.player_id}/>
      )
    }
    {/* {JSON.stringify(currentPlayer)} */}
    <div className="flex w-full justify-between flex-col md:flex-row gap-4">

      //Players voted 
    {
      
      roomData.stage !== null && (
        votingData.map(player => (
          <p className="text-lg">Player {player.voter_name} voted for {player.voted_name}</p>
        ))
      )
    }

      {
        !roomData.roles_assigned && user?.id === roomData.host_id ? (
          <div className="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-8 shadow-lg">
              {!roomData.roles_assigned && user?.id === roomData.host_id && (
                <button
                  onClick={ApplyingRoles}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
                >
                  Apply Roles 
                </button>
              )}
            </div>
          </div>
        ):
        
          !roomData.roles_assigned && user?.id !== roomData.host_id && (
            <div className="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center">
              <div className="bg-white rounded-lg p-8 shadow-lg">
                <p className="text-center font-bold">
                  Waiting for the host to assign roles...
                </p>
              </div>
            </div>
          )
        

      }
      
      <section className="w-50 bg-red-300  px-4">
        
        <h2 className="text-2xl font-bold mb-4">Players</h2>
        {
            roomData.roles_assigned ? (
                <ul className="list-disc pl-4">
                {players.map(player => (
                    <li key={player.id} className="my-2">
                    <span className="font-bold">{player.name}</span> - {player.role} - {player.is_alive ? ('alive') : ('dead')}

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
          {role_preview && roomData.roles_assigned && players.find(player => player.player_id === user?.id) && <RolesModal role={players.find(player => player.player_id === user?.id)?.role} />}
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
          <GameActionsBar 
            roomId={roomId} 
            roomInfo={roomData} 
            playerInfo={currentPlayer} 
            players={players}
          />
          {
            
            stageResultModal && <StageResult result={players.filter(p => !p.is_alive).length >= players.length  / 3 ? 'Wolf won' : 'Still chance'}  players={players} status={currentPlayer?.is_alive} />
          }
          {
            // !currentPlayer.is_alive && (

            // )
          }
          {
            currentPlayer?.is_alive ? (
              <h1>
                You aare alive
              </h1>
            ):(
              <h1>
                You are dead
              </h1>
            )
          }
    </>
  );
}


function roomsRealtimeListening(roomId,fetchRoomData){
  console.log('room id',roomId);
  const subscription =  supabase
  .channel('room_listening_channel')
  .on(
      'postgres_changes',
      {
          event: '*',
          schema: 'public',
          table: 'rooms',
          //i should make a filter here
      
      },
      (payload)=>{
          console.log('🚨 payload im from', payload);
          fetchRoomData();
      }
  )
  .subscribe();
  return () => {
      subscription.unsubscribe();
  };
}


function playersRealtimeListening(roomId,fetchPlayers){
  console.log('room id',roomId);
  const subscription =  supabase
  .channel('players_listening_channel')
  .on(
      'postgres_changes',
      {
          event: '*',
          schema: 'public',
          table: 'players',
      
      },
      (payload)=>{
          console.log('🚨 payload im from pla', payload);
          fetchPlayers();
      }
  )
  .subscribe();
  return () => {
      subscription.unsubscribe();
  };
}



function votingRealtimeListening(roomId,fetchVotingData){
  console.log('room id',roomId);
  const subscription =  supabase
  .channel('voting_listening_channel')
  .on(
      'postgres_changes',
      {
          event: '*',
          schema: 'public',
          table: 'voting',
      
      },
      (payload)=>{
          console.log('🚨 payload im from pla', payload);
          fetchVotingData();
      }
  )
  .subscribe();
  return () => {
      subscription.unsubscribe();
  };
}


