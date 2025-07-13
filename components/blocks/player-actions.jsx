import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
  } from "@/components/ui/drawer"
  import { Button } from "@/components/ui/button";
import { useState } from "react"
import { supabase } from "@/lib/supabase";
  
export default function PlayerActions({currentPlayer,roomInfo,players,onAction}) {

    
   
    const [open, setOpen] = useState(false);


    const killPlayer = async   (player) => {
        const {error} = await supabase.from('players')
        .update({is_alive: false})
        .eq('id',player.id);
        //Update room wolf killed row
        const {error:wolfKilledError} = await supabase.from('rooms')
        .update({wolf_killed:true})
        .eq('room_id',roomInfo?.id);

        if(error){
            console.log(error);
        }
        wolfKilledError && console.log(wolfKilledError);
        console.log('wolf killed updated');
        console.log('player killed' + player.name);
        setOpen(false);
    }
    return (
        <div className="flex flex-col gap-2">
            <Drawer>
                {
                    currentPlayer && (
                        <DrawerTrigger>
                        {
                            currentPlayer?.role === 'wolf' && (roomInfo.stage === 'night' ? (
                                <Button variant="destructive" onClick={() => setOpen(true)}>Kill</Button>
                            )
                            : (
                                <Button variant="destructive" onClick={() => setOpen(true)}>Vote</Button>
                            ))
                        }
                        {
                            currentPlayer?.role === 'seer' && (roomInfo.stage === 'night' ? (
                                <Button variant="outline" onClick={() => setOpen(true)}>See</Button>
                            ) : (
                                <Button variant="destructive" onClick={() => setOpen(true)}>Vote</Button>
                            ))
                        }
                        {
                            currentPlayer?.role === 'doctor' && (roomInfo.stage === 'night' ? (
                                <Button variant="outline" onClick={() => setOpen(true)}>Save</Button>
                            ) : (
                                <Button variant="destructive" onClick={() => setOpen(true)}>Vote</Button>
                            ))
                        }
                        {
                            currentPlayer?.role === 'villager' && roomInfo.stage !== 'night' && (
                                <Button variant="outline" onClick={() => setOpen(true)}>Vote</Button>
                            )
                        }
                        </DrawerTrigger>
                    )
                }
               
                <DrawerContent>
                    <DrawerHeader>
                    <DrawerTitle>Choose a player</DrawerTitle>
                    </DrawerHeader>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {players && players.filter(player => player.role != 'wolf').map((player) => (
                            <div key={player.id} className="bg-white dark:bg-input/30 p-4 rounded-md shadow-sm">
                                <h3 className="text-lg font-semibold">{player.name}</h3>
                                {
                                    currentPlayer  && roomInfo.stage === 'night' && (
                                        <Button
                                        variant={currentPlayer.role === 'wolf' ? 'kill' : 'outline'}
                                        onClick={() => killPlayer(player)}
                                    >
                                        {currentPlayer.role === 'wolf' && 'Kill'}
                                        {currentPlayer.role === 'seer' && 'See'}
                                        {currentPlayer.role === 'doctor' && 'Save'}
                                        {currentPlayer.role === 'villager' && 'Vote'}
                                    </Button>
                                    )
                                }
                                {
                                    currentPlayer  && roomInfo.stage === 'day' && (
                                        <Button
                                        variant="outline"
                                        onClick={() => onAction(player)}
                                    >
                                        Vote
                                    </Button>
                                    )
                                }
                               
                            </div>
                        ))}
                    </div>
                    {/* <DrawerFooter>
                    <DrawerClose>
                        <Button variant="outline">Cancel</Button>
                    </DrawerClose>
                    </DrawerFooter> */}
                </DrawerContent>
                </Drawer>
        </div>
    )
}
