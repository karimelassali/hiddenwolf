import {supabase} from "@/lib/supabase";
import { useState } from "react";
import { useEffect } from "react";


export default function PlayersChat({roomID,playerID,playerName,is_alive}){
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    
    const fetchMessages = async () => {
        const { data: messages, error } = await supabase.from('chat_messages').select('*')
        .eq('room_id', roomID)
        .order('created_at', { ascending: true });
        if (error) {
            console.error('Error fetching messages:', error);
        }
        setMessages(messages);
    };

    const sendMessage = async () => {

        if (!newMessage) return;
        const { error } = await supabase.from('chat_messages').insert({ room_id: roomID,player_id:playerID,player_name:playerName, message: newMessage , is_alive:is_alive});
        if (error) {
            console.error('Error sending message:', error);
        }
        setNewMessage('');
    }
    
    useEffect(() => {
        if(roomID){
            fetchMessages();
            const cleanup = playersChatRealTimeListening(roomID,fetchMessages);
            return () => {
                cleanup();
            };
        }
    }, [roomID]);
    
    return (
        <>
            <div className="flex flex-col w-full h-full p-4">
                <div className="h-full overflow-y-auto">
                    {messages && messages.map((message) => (
                        <div key={message.id} className="flex items-center py-2">
                            <div className="w-12 h-12 bg-gray-300 rounded-full" />
                            <p className="ml-4 text-sm">{message.message}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-4">
                    <input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        type="text"
                        className="w-full px-4 py-2 border rounded-md"
                        placeholder="Type a message..."
                    />
                    <button onClick={() => {sendMessage()}} className="bg-blue-500 text-white px-4 py-2 rounded-md ml-2">Send </button>
                </div>
            </div>
        </>
    )
}



function playersChatRealTimeListening(roomId,fetchMessages){
    console.log('im live chat');
    const subscription =  supabase
    .channel('players_chat_listening_channel')
    .on(
        'postgres_changes',
        {
            event: '*',
            schema: 'public',
            table: 'chat_messages',
            filter: `room_id=eq.${roomId}`,
        
        },
        (payload)=>{
            console.log('🚨 payload im from ', payload);
            fetchMessages();
        }
    )
    .subscribe();
    return () => {
        subscription.unsubscribe();
    };
  }
  
  
  
  
  