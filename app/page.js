'use client'
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useEffect , useState } from "react";
import {v4 as uuidv4} from 'uuid'
import {useRouter} from "next/navigation";
import { supabase } from "@/lib/supabase";
import {useUser} from "@clerk/nextjs"
import { Toaster , toast } from "react-hot-toast";

export default function Home() {

  const fetchUser = useUser();

  const [user, setUser] = useState([]);
  
  const fullId = uuidv4();
  const shortId = fullId.slice(0, 4);
  const router = useRouter();


  useEffect(() => {
    if (fetchUser.isLoaded ) {
      setUser(fetchUser.user);
    }
  }, [fetchUser]);
    

  const handleCreateRoom = () => {
    if(user && user.id){
      supabase.from('rooms').insert({
        code: shortId,
        stage: 'waiting',
        round: 1,
        host_id: user.id,
      })
      .then(() => {
        toast.success(`Room ${shortId} created successfully`);
        router.push(`/room/${shortId}`);
      })
      .catch((error) => {
        toast.error(error.message);
      }) 
    }
      
    
 

  }
  const handleJoinRoom = () => {
    router.push(`/room/${shortId}`);
  }

  useEffect(() => {
    if (fetchUser.isLoaded && user.id) {
      supabase
        .from('players')
        .delete()
        .eq('player_id', user.id)
        .then(() => console.log('removed all records of user in players table'))
        .catch((error) => console.log(error));
    }
  }, [fetchUser, user.id]);


  return (

    <div className="w-full h-full flex items-center justify-center border gap-10 border-amber-300">
      <Toaster />
      <Button onClick={handleCreateRoom} >
        Create room
        </Button>
      <Button onClick={handleJoinRoom}>
        Join room
      </Button>
    </div>
  );
}
