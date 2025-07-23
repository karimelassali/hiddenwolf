import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Notification } from "@/utils/sounds";
export default function PlayersChat({
  roomID,
  playerID,
  playerName,
  is_alive,
  player_role,
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const fetchMessages = async () => {
    const { data: messages, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("room_id", roomID)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("Error fetching messages:", error);
    }
    setMessages(messages);
  };

  const sendMessage = async () => {
    if (!newMessage) return;
    const { error } = await supabase.from("chat_messages").insert({
      room_id: roomID,
      player_id: playerID,
      player_name: playerName,
      message: newMessage,
      is_alive: is_alive,
      role: player_role,
    });
    if (error) {
      console.error("Error sending message:", error);
    }
    setNewMessage("");
  };

  useEffect(() => {
    if (roomID) {
      fetchMessages();
      const cleanup = playersChatRealTimeListening(roomID, fetchMessages);
      return () => {
        cleanup();
      };
    }
  }, [roomID]);

  return (
    <>
      <div className="flex flex-col overflow-hidden w-full h-full p-4">
        <div className="max-h-[90%] overflow-y-auto">
          {messages &&
            messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col py-3 bg-white shadow-md rounded-lg mb-3"
              >
                <div className="flex justify-between items-center px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded-t-lg">
                  <span className="font-semibold text-gray-800">{message.player_name}</span>
                  <p className="text-xs text-gray-600">
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <p className="px-4 py-3 text-sm text-gray-700">{message.message}</p>
              </motion.div>
            ))}
        </div>
        <div className="mt-4 flex justify-between items-center p-2 ">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            type="text"
            className="w-full px-4 py-2 border rounded-md"
            placeholder="Type a message..."
          />
          <button
            onClick={() => {
              sendMessage();
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-md ml-2"
          >
            Send{" "}
          </button>
        </div>
      </div>
    </>
  );
}

function playersChatRealTimeListening(roomId, fetchMessages) {
  console.log("im live chat");
  const subscription = supabase
    .channel("players_chat_listening_channel")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "chat_messages",
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        console.log("🚨 payload im from ", payload);
        fetchMessages();
        Notification();
      }
    )
    .subscribe();
  return () => {
    subscription.unsubscribe();
  };
}
