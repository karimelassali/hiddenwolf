import { supabase } from "@/lib/supabase";
// Correctly import React and its hooks
import React, { useState, useEffect, useRef } from "react"; 
import { motion } from "framer-motion";
import { Notification } from "@/utils/sounds";
// Consolidate react-icons imports and add the missing FaSkull
import { FaPaperPlane, FaComments, FaSkull } from 'react-icons/fa'; 

export default function PlayersChat({
  roomID,
  playerID,
  playerName,
  is_alive,
  player_role,
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  // Now you can use useRef directly or as React.useRef because React is correctly imported
  const messagesEndRef = useRef(null); 

  const fetchMessages = async () => {
    const { data: messages, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("room_id", roomID)
      .order("created_at", { ascending: true });
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
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-full w-full bg-gradient-to-b from-slate-800 to-slate-900 rounded-none lg:rounded-xl border border-slate-700 shadow-lg text-white overflow-hidden"
    >
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-slate-700/50 flex-shrink-0 bg-slate-800/50">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base sm:text-lg text-slate-200 flex items-center gap-2">
            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
              <FaComments className="text-white text-xs sm:text-sm" />
            </div>
            <span>Village Chat</span>
          </h3>
          
          {/* Online indicator */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="hidden sm:inline">Live</span>
          </div>
        </div>
      </div>

      {/* Messages display area */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 custom-scrollbar min-h-[500px] max-h-[550px]">
        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-32 text-slate-400">
            <div className="text-center">
              <FaComments className="text-2xl mx-auto mb-2 opacity-50" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs opacity-75">Be the first to say something!</p>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((message, index) => {
          const isMe = message.player_id === playerID;
          const prevMessage = messages[index - 1];
          const showAvatar = !prevMessage || prevMessage.player_id !== message.player_id;
          
          return (
            <motion.div 
              key={message.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-2 sm:gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar placeholder or spacer */}
              <div className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                {showAvatar && !isMe && (
                  <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-slate-300">
                      {message.player_name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Message content */}
              <div className={`flex flex-col max-w-[75%] sm:max-w-[80%] ${isMe ? "items-end" : "items-start"}`}>
                {/* Sender info (only show if new sender or significant time gap) */}
                {showAvatar && (
                  <div className={`flex items-center gap-2 mb-1 text-xs ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className={`font-medium ${
                      isMe ? 'text-purple-300' : 'text-amber-300'
                    }`}>
                      {isMe ? 'You' : message.player_name}
                    </span>
                    <span className="text-slate-500">
                      {new Date(message.created_at).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className={`relative px-3 py-2 sm:px-4 sm:py-3 rounded-2xl break-words shadow-lg transition-all duration-200 hover:shadow-xl ${
                    isMe 
                      ? "bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-br-md" 
                      : "bg-gradient-to-br from-slate-700 to-slate-800 text-slate-100 rounded-bl-md border border-slate-600/50"
                  }`}
                >
                  <p className="text-sm sm:text-base leading-relaxed">{message.message}</p>
                  
                  {/* Message tail */}
                  <div className={`absolute bottom-0 w-3 h-3 ${
                    isMe 
                      ? "right-0 bg-purple-700 rounded-tl-full" 
                      : "left-0 bg-slate-800 rounded-tr-full border-l border-t border-slate-600/50"
                  }`} style={{
                    clipPath: isMe 
                      ? 'polygon(0 0, 100% 0, 0 100%)' 
                      : 'polygon(100% 0, 100% 100%, 0 0)'
                  }} />
                </div>
              </div>
            </motion.div>
          );
        })}
        
        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator (optional - if you have typing state) */}
      {/* {isTyping && (
        <div className="px-4 py-2 text-xs text-slate-400">
          <span className="animate-pulse">Someone is typing...</span>
        </div>
      )} */}

      {/* Message input area */}
      <div className="flex-shrink-0 bg-slate-900/70 border-t border-slate-700/50">
        <div className="flex items-center gap-2 p-2 sm:p-3">
          <div className="flex-1 relative">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              type="text"
              maxLength={500}
              className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-slate-800 border border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base transition-all"
              placeholder={is_alive ? "Type your message..." : "You are eliminated from the game"}
              disabled={!is_alive}
            />
            
            {/* Character counter */}
            {newMessage.length > 400 && (
              <div className="absolute -top-6 right-2 text-xs text-slate-400">
                {newMessage.length}/500
              </div>
            )}
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!is_alive || !newMessage.trim()}
            className="p-2 sm:p-3 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-all duration-200 hover:shadow-lg disabled:shadow-none group"
            title={!is_alive ? "You cannot chat while eliminated" : "Send message"}
          >
            <FaPaperPlane className={`text-sm sm:text-base transition-transform ${
              !is_alive || !newMessage.trim() ? '' : 'group-hover:translate-x-0.5'
            }`} />
          </button>
        </div>
        
        {/* Status bar */}
        {!is_alive && (
          <div className="px-3 py-2 bg-red-900/20 border-t border-red-800/30">
            <div className="flex items-center gap-2 text-red-400 text-xs sm:text-sm">
              <FaSkull className="text-xs" />
              <span>You have been eliminated and cannot participate in chat</span>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.5) rgba(51, 65, 85, 0.3);
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(51, 65, 85, 0.2);
          border-radius: 2px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.4);
          border-radius: 2px;
          transition: background 0.2s ease;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.6);
        }
        
        @media (max-width: 640px) {
          .custom-scrollbar::-webkit-scrollbar {
            width: 3px;
          }
        }
      `}</style>
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