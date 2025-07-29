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
      .order("created_at", { ascending: false });
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
      <motion.div
      initial={{ opacity: 0 ,x:50}}
      animate={{ opacity: 1 ,x:0}}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-screen w-full bg-gradient-to-br from-indigo-50 to-indigo-100 p-4">
        <div className="flex-1 overflow-y-auto pb-4 space-y-3">
          {messages &&
            messages.map((message) => {
              const isMe = message.player_id === playerID; // Assume you have currentPlayerName variable
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] ${
                      isMe ? "bg-indigo-500" : "bg-white"
                    } shadow-md rounded-lg`}
                  >
                    <div
                      className={`flex justify-between w-full items-center px-4 py-2 ${
                        isMe
                          ? "bg-indigo-600"
                          : "bg-gradient-to-r from-indigo-100 to-indigo-200"
                      } rounded-t-lg`}
                    >
                      <span
                        className={`font-semibold ${
                          isMe ? "text-white" : "text-indigo-800"
                        }`}
                      >
                        {message.player_name}
                      </span>
                      <p
                        className={`text-xs ${
                          isMe ? "text-indigo-200" : "text-indigo-600"
                        }`}
                      >
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <p
                      className={`px-4 py-3 text-sm ${
                        isMe ? "text-white" : "text-gray-700"
                      }`}
                    >
                      {message.message}
                    </p>
                  </div>
                </motion.div>
              );
            })}
        </div>
        <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-md border border-indigo-200">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            type="text"
            className="flex-1 px-4 py-2 border border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Type a message..."
          />
          <button
            onClick={() => {
              sendMessage();
            }}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Send
          </button>
        </div>
      </motion.div>
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
