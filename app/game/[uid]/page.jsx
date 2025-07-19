'use client'
import React from 'react'
import dynamic from 'next/dynamic';

import { useEffect , useState } from 'react'
import { supabase } from '@/lib/supabase'
import GameNavbar  from '@/components/blocks/game-navbar'
import GameActionsBar from '@/components/blocks/game-actions-bar'
import { RolesModal } from '@/components/ui/rolesModal'
import { useUser } from '@clerk/nextjs'
import { toast, Toaster } from 'react-hot-toast';
import {kill,seePlayer,savePlayer,voting} from '@/utils/botsActions'
import { Countdown } from '@/components/ui/countdown';
import {trackUserConnectivity} from '@/utils/trackUserconnectivity'
import PlayersChat from '@/components/chat'

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
    const [winner,setWinner] = useState('');
    const [winnerModal,setWinnerModal] = useState(false);
    const [botsActionsStarted, setBotsActionsStarted] = useState(false);

    


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
            .eq('room_id',roomId)
            .order('joined_at', { ascending: false })
            ;
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



        const runBotsActions = ()=>{
          if(roomData && players && currentPlayer && currentPlayer.player_id == roomData.host_id){

            const bots = players.filter(p => !p.is_human);

            if(roomData.stage == 'day'){
              bots.forEach(async (bot)=>{
                const alivePlayers = players.filter(p => p.is_alive && p.id !== bot.id);
                const randomTarget = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
                
                if (bot.is_action_done) return;
                  if(bot.is_alive){
                    await voting(bot,randomTarget,roomId);
                  }
              })
            }
            if(roomData.stage == 'night'){

              console.log('bots',bots);
              bots.forEach(async (bot) => {
                if (bot.is_action_done) return;
              
                const alivePlayers = players.filter(p => p.is_alive && p.id !== bot.id);
                const randomTarget = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
              
                setTimeout(async () => {
                  if (roomData.stage === 'night') {
                    if (bot.role === 'wolf') {
                      await kill(bot, randomTarget, roomId);
                    } else if (bot.role === 'seer') {
                      await seePlayer(bot, randomTarget);
                    } else if (bot.role === 'doctor') {
                      await savePlayer(bot, randomTarget, roomId);
                    }
              
                    // ✅ Mark bot action as done
                    // await supabase.from('players').update({ is_action_done: true }).eq('id', bot.id);
                  }
                  
                  
                }, Math.floor(Math.random() * 5) + 1000);
              });
              
            }
          }
        }

        

        
        useEffect(()=>{
          if(players && players.length !== 0){
          if (roomData.stage === 'night' && currentPlayer?.player_id === roomData.host_id && !botsActionsStarted) {
            runBotsActions();
            setBotsActionsStarted(true); // ✅ شغّل مرة واحدة فقط في هذه المرحلة
          }
        
          if (roomData.stage === 'day' && currentPlayer?.player_id === roomData.host_id && botsActionsStarted) {
            runBotsActions();
            setBotsActionsStarted(false); // ✅ لما يرجع للنهار، خليه مستعد للجولة التالية
          }
        }

        },[roomData.stage,currentPlayer])

        
        useEffect(()=>{
          fetchRoomData();
        },[uid])

        useEffect(()=>{
            fetchPlayers();
            if(roomId && user?.id && roomData.host_id){
              trackUserConnectivity(roomId,user.id,roomData.host_id);
            }
          },[roomId,user?.id,roomData.host_id])


       
       
        
          
        
      useEffect(() => {
        if (!roomData.roles_assigned || !players || !user?.id) return;
      
        const currentPlayer = players && players.find(player => player.player_id === user.id);
        if (currentPlayer?.role) {
          setRole_preview(true);
        }
      }, [roomData.roles_assigned, players.role, user?.id]);

       useEffect(()=>{
        const savedPlayer = players ? players.find(player => player.is_saved) : [];
        if(savedPlayer){
          console.log('player is saved' + savedPlayer.name);
        }
       
        if(roomData.stage === 'day' && roomData.wolf_killed){
          setStageResultModal(true);
          setTimeout(()=>{
            setStageResultModal(false);
          },3000)
          
        }

        if ((roomData.stage === 'day' && players.filter(player => player.is_alive).length === 1) || 
            (players.some(player => player.role === 'wolf') && !players.find(player => player.role === 'wolf').is_alive)) {
            setWinnerModal(true);
            setWinner('Villager Won');
        } else {
            setWinner('Wolf Won');
        }

       },[roomData.stage])

       //Fetching the voting data from voting table
     
       
      

       // Listen to changes in the room and fetch the new data

       useEffect(()=>{
        roomsRealtimeListening(roomId,fetchRoomData);
        playersRealtimeListening(roomId,fetchPlayers);
      },[roomId])



       


  return (
    <>
     <Toaster />
    <div className="flex gap-2">
      <button onClick={()=>toast('Here is your toast.')}>Make me a toast</button>
     

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
      roomData.roles_assigned && currentPlayer && players &&(
        <GameNavbar roomData={roomData} uid={uid} currentPlayerId={currentPlayer && currentPlayer.player_id} players={players}/>
      )
    }
    {/* {JSON.stringify(currentPlayer)} */}
    <div className="flex w-full justify-between flex-col md:flex-row gap-4">

      //Players voted 
      {JSON.stringify(votingData)}
    {
      
       
        players
          .filter(p => p.voted_to != null)
          .map(player => {
            const votedTo = players.find(p => p.id === player.voted_to);
            return (
              <p className="text-lg">
                Player {player.name} voted for {votedTo?.name}
              </p>
            );
          })
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
      
      <section className="w-50 bg-slate-300  px-4">
        <h2 className="text-2xl font-bold mb-4">Players</h2>
        <ul className="list-disc pl-4">
          {players.map(player => (
            <li key={player.id} className="my-2">
              <span className="font-bold">{player.name}</span>
              <br />
              Role: {player.role}
              <br />
              Alive: {player.is_alive ? <span className="text-green-600">Yes</span> : <span className="text-red-600">No</span>}
              <br />
              Action done: {player.is_action_done ? <span className="text-green-600">Yes</span> : <span className="text-red-600">No</span>}
            </li>
          ))}
        </ul>
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
            {
              roomId && currentPlayer && (
                <PlayersChat roomID={roomId} playerID={currentPlayer?.id} playerName={currentPlayer?.name} is_alive={currentPlayer?.is_alive} />
              )
            }
        </div>
        

    </div>
          <GameActionsBar 
            roomId={roomId} 
            roomInfo={roomData} 
            playerInfo={currentPlayer} 
            players={players}
          />
          {
            
            stageResultModal && <StageResult result={players.filter(p => p.is_alive).length === 1 ? 'Wolf won' : 'Still chance'}  players={players} status={currentPlayer?.is_alive} />
          }
          {
           winnerModal && <WinnerModal winner={winner}/>
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




export function WinnerModal({winner}) {
  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-10 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg"> 
        Game Ended .
        <h1 className="text-2xl font-bold">{winner}</h1>
        <p className="text-lg">{winner}</p>
        <Countdown number='5' target='/' />
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={() => window.location.href = '/'}>Go back to home</button>
      </div>
    </div>
    
  );
};


function roomsRealtimeListening(roomId,fetchRoomData){
  const subscription =  supabase
  .channel('room_listening_channel')
  .on(
      'postgres_changes',
      {
          event: '*',
          schema: 'public',
          table: 'rooms',
              //i should make a filter here
          filter: `id=eq.${roomId}`,    
      },
      (payload)=>{
          fetchRoomData();
      }
  )
  .subscribe();
  return () => {
      subscription.unsubscribe();
  };
}


function playersRealtimeListening(roomId,fetchPlayers){
  const subscription =  supabase
  .channel('players_listening_channel')
  .on(
      'postgres_changes',
      {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${roomId}`,
      
      },
      (payload)=>{
          fetchPlayers();
      }
  )
  .subscribe();
  return () => {
      subscription.unsubscribe();
  };
}




