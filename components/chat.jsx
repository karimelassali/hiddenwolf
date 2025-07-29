import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Notification } from "@/utils/sounds";
import { FaPaperPlane } from 'react-icons/fa'; // Added send icon
import {React} from "react";

export default function PlayersChat({
  roomID,
  playerID,
  playerName,
  is_alive,
  player_role,
}) {
  // --- ALL YOUR EXISTING LOGIC IS UNTOUCHED ---
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const fetchMessages = async () => {
    const { data: messages, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("room_id", roomID)
      .order("created_at", { ascending: true }); // Keep ascending to map correctly
    if (error) {
      console.error("Error fetching messages:", error);
    }
    setMessages(messages || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !is_alive) return;
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
  
  // Auto-scroll to bottom when new messages arrive
  // const messagesEndRef = React.useRef(null);
  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [messages]);


  return (
    // ✅ UI FIX: Replaced `h-screen` and light theme with `h-full` and a dark theme that matches your app.
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-full w-full bg-slate-800/80 rounded-xl border border-slate-700 shadow-lg text-white"
    >
      <div className="p-4 border-b border-slate-700 flex-shrink-0">
        <h3 className="font-bold text-lg text-slate-200 text-center">Village Chat</h3>
      </div>

      {/* Message display area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isMe = message.player_id === playerID;
          return (
            <div key={message.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              {/* Sender's name and time */}
              <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                <span className={`text-sm font-semibold ${isMe ? 'text-purple-300' : 'text-amber-300'}`}>
                  {message.player_name}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {/* Message bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] p-3 rounded-xl break-words ${
                  isMe ? "bg-purple-600 rounded-br-none" : "bg-slate-700 rounded-bl-none"
                }`}
              >
                <p className="text-sm">{message.message}</p>
              </div>
            </div>
          );
        })}
        {/* <div ref={messagesEndRef} /> */}
      </div>

      {/* Message input area */}
      <div className="flex items-center gap-2 p-3 bg-slate-900/70 border-t border-slate-700 mt-auto flex-shrink-0">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          // ✅ UX FIX: Allow sending with Enter key
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          type="text"
          className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-slate-400 disabled:opacity-50"
          placeholder={is_alive ? "Say something..." : "You are eliminated"}
          // ✅ UX FIX: Disable input if not alive
          disabled={!is_alive}
        />
        <button
          onClick={sendMessage}
          // ✅ UX FIX: Disable button if not alive
          disabled={!is_alive}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        >
            <FaPaperPlane />
        </button>
      </div>
    </motion.div>
  );
}

// --- LOGIC REMAINS UNTOUCHED ---
function playersChatRealTimeListening(roomId, fetchMessages) {
  const subscription = supabase
    .channel("players_chat_listening_channel")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "chat_messages", filter: `room_id=eq.${roomId}` },
      (payload) => {
        fetchMessages();
        Notification();
      }
    )
    .subscribe();
  return () => {
    subscription.unsubscribe();
  };
}