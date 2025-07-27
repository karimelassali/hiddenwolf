import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import React from "react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Modal } from "@/components/modal";
import { HowlSound } from "@/utils/sounds";
import { motion, AnimatePresence } from "framer-motion";
import {
  Skull,
  Eye,
  Shield,
  Vote,
  Moon,
  Sun,
  Users,
  Target,
  Heart,
  Search,
  Crown,
  Zap,
  X,
  CheckCircle,
  AlertTriangle,
  Volume2
} from "lucide-react";

export default function PlayerActions({
  currentPlayer,
  roomInfo,
  players,
  onAction,
}) {
  const [open, setOpen] = useState(false);
  const [savedPlayer, setSavedPlayer] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [playerToSeeRole, setPlayerToSeeRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const killPlayer = async (player) => {
    setIsLoading(true);
    
    //Check if the target is saved
    const { data: savedPlayer, error: savedError } = await supabase
      .from("players")
      .select("id,name")
      .eq("id", player.id)
      .eq("is_saved", true)
      .single();

    if (savedPlayer) {
      setOpen(false);
      setSavedPlayer(savedPlayer);
      setModalOpen(true);
      setIsLoading(false);
      return;
    }

    //Kill the player in the room
    const { error } = await supabase
      .from("players")
      .update({ is_alive: false })
      .eq("id", player.id);
    //Update room wolf killed row
    const { error: wolfKilledError } = await supabase
      .from("rooms")
      .update({ wolf_killed: true })
      .eq("id", roomInfo?.id);

    if (error) {
      console.log(error);
    }
    wolfKilledError && console.log(wolfKilledError);
    console.log("wolf killed updated");
    console.log("player killed" + player.name);
    setOpen(false);
    setIsLoading(false);
  };

  const voting = async (player) => {
    setIsLoading(true);
    const { error } = await supabase.from("voting").insert({
      room_id: roomInfo.id,
      round: 1,
      voter_id: currentPlayer.id,
      voter_name: currentPlayer.name,
      voter_img: currentPlayer.img,
      voted_name: player.name,
      voted_id: player.id,
      voted_img: player.img,
    });

    if (error) {
      console.log(error);
    }
    console.log("voting updated");
    setOpen(false);
    setIsLoading(false);
  };

  const savePlayer = async (player) => {
    setIsLoading(true);
    const { error } = await supabase
      .from("players")
      .update({ is_saved: true })
      .eq("id", player.id);
    if (error) {
      console.log(error);
    }
    console.log("player saved updated");
    setOpen(false);
    setIsLoading(false);
  };

  const seePlayer = async (player) => {
    setIsLoading(true);
    const selectedPlayer = players.find((p) => p.id === player.id);
    setPlayerToSeeRole(selectedPlayer);
    setModalOpen(true);
    setOpen(false);
    setIsLoading(false);
  };

  //Apply that the player has done his action in is_action_done
  const applyActionDone = async () => {
    const closeDrawer = document.getElementById("close-drawer");
    closeDrawer?.click();
    const { error } = await supabase
      .from("players")
      .update({ is_action_done: true })
      .eq("id", currentPlayer.id);
    if (error) {
      console.log(error);
    }
  };

  const howlSound = async () => {
    try {
      setOpen(false);
      const { error } = await supabase
        .from("rooms")
        .update({ sound: "howl" })
        .eq("id", roomInfo.id);
      if (error) {
        console.log(error);
      }
    } catch (error) {
      console.log("error");
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "wolf": return Skull;
      case "seer": return Eye;
      case "doctor": return Shield;
      default: return Users;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "wolf": return "from-red-600 to-red-800";
      case "seer": return "from-purple-600 to-purple-800";
      case "doctor": return "from-green-600 to-green-800";
      default: return "from-blue-600 to-blue-800";
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case "kill": return "from-red-500 to-red-700";
      case "see": return "from-purple-500 to-purple-700";
      case "save": return "from-green-500 to-green-700";
      case "vote": return "from-orange-500 to-orange-700";
      case "howl": return "from-gray-600 to-gray-800";
      default: return "from-blue-500 to-blue-700";
    }
  };

  const getStageIcon = () => {
    return roomInfo.stage === "night" ? Moon : Sun;
  };

  const filteredPlayers = players?.filter((player) => {
    if (!player.is_alive) return false;

    if (currentPlayer?.role === "wolf" && roomInfo.stage === "night") {
      return player.id !== currentPlayer.id;
    }

    if (currentPlayer?.role === "seer" && roomInfo.stage === "night") {
      return player.id !== currentPlayer.id;
    }

    if (roomInfo.stage === "day" && currentPlayer?.id === player.id) {
      return false;
    }

    return true;
  }) || [];

  const handlePlayerAction = async (player, action) => {
    setSelectedPlayer(player);
    
    switch (action) {
      case "kill":
        await killPlayer(player);
        break;
      case "see":
        await seePlayer(player);
        break;
      case "save":
        await savePlayer(player);
        break;
      case "vote":
        await voting(player);
        break;
    }
    
    await applyActionDone();
    setSelectedPlayer(null);
  };

  const shouldShowActions = currentPlayer && currentPlayer.is_alive && !currentPlayer.is_action_done;

  return (
    <div className="flex flex-col gap-4">
      <Drawer open={open} onOpenChange={setOpen}>
        {shouldShowActions && (
          <div className="flex flex-wrap gap-3 justify-center">
            {/* Wolf Actions */}
            {currentPlayer?.role === "wolf" && roomInfo.stage === "night" && (
              <>
                <DrawerTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative px-6 py-3 bg-gradient-to-r ${getActionColor("kill")} text-white rounded-xl font-semibold shadow-lg hover:shadow-red-500/25 transition-all duration-300 flex items-center gap-2 overflow-hidden group`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <Skull size={20} className="relative z-10" />
                    <span className="relative z-10">Kill Target</span>
                    <div className="absolute -right-2 -top-2 w-6 h-6 bg-red-400 rounded-full opacity-30 animate-pulse" />
                  </motion.button>
                </DrawerTrigger>
                
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    howlSound();
                  }}
                  className={`relative px-6 py-3 bg-gradient-to-r ${getActionColor("howl")} text-white rounded-xl font-semibold shadow-lg hover:shadow-gray-500/25 transition-all duration-300 flex items-center gap-2 overflow-hidden group`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-400/20 to-gray-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Volume2 size={20} className="relative z-10" />
                  <span className="relative z-10">Howl</span>
                </motion.button>
              </>
            )}

            {/* Seer Actions */}
            {currentPlayer?.role === "seer" && roomInfo.stage === "night" && (
              <DrawerTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative px-6 py-3 bg-gradient-to-r ${getActionColor("see")} text-white rounded-xl font-semibold shadow-lg hover:shadow-purple-500/25 transition-all duration-300 flex items-center gap-2 overflow-hidden group`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Eye size={20} className="relative z-10" />
                  <span className="relative z-10">Divine Truth</span>
                  <div className="absolute -right-2 -top-2 w-6 h-6 bg-purple-400 rounded-full opacity-30 animate-pulse" />
                </motion.button>
              </DrawerTrigger>
            )}

            {/* Doctor Actions */}
            {currentPlayer?.role === "doctor" && roomInfo.stage === "night" && (
              <DrawerTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative px-6 py-3 bg-gradient-to-r ${getActionColor("save")} text-white rounded-xl font-semibold shadow-lg hover:shadow-green-500/25 transition-all duration-300 flex items-center gap-2 overflow-hidden group`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-green-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Shield size={20} className="relative z-10" />
                  <span className="relative z-10">Protect</span>
                  <div className="absolute -right-2 -top-2 w-6 h-6 bg-green-400 rounded-full opacity-30 animate-pulse" />
                </motion.button>
              </DrawerTrigger>
            )}

            {/* Vote Actions */}
            {roomInfo.stage === "day" && (
              <DrawerTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative px-6 py-3 bg-gradient-to-r ${getActionColor("vote")} text-white rounded-xl font-semibold shadow-lg hover:shadow-orange-500/25 transition-all duration-300 flex items-center gap-2 overflow-hidden group`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-orange-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Vote size={20} className="relative z-10" />
                  <span className="relative z-10">Cast Vote</span>
                  <div className="absolute -right-2 -top-2 w-6 h-6 bg-orange-400 rounded-full opacity-30 animate-pulse" />
                </motion.button>
              </DrawerTrigger>
            )}
          </div>
        )}

        <DrawerContent className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto w-full"
          >
            <DrawerHeader className="text-center border-b border-gray-700/50 pb-6">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="flex items-center justify-center gap-3 mb-4"
              >
                {React.createElement(getStageIcon(), { 
                  size: 32, 
                  className: roomInfo.stage === "night" ? "text-blue-400" : "text-yellow-400" 
                })}
                <DrawerTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  {roomInfo.stage === "night" ? "Night Phase" : "Day Phase"}
                </DrawerTitle>
              </motion.div>
              
              <DrawerDescription className="text-gray-300 text-lg">
                {currentPlayer?.role === "wolf" && roomInfo.stage === "night" && "Choose your target to eliminate"}
                {currentPlayer?.role === "seer" && roomInfo.stage === "night" && "Select a player to divine their true nature"}
                {currentPlayer?.role === "doctor" && roomInfo.stage === "night" && "Choose who to protect from harm"}
                {roomInfo.stage === "day" && "Vote to eliminate a suspected werewolf"}
              </DrawerDescription>

              {/* Player Info Card */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={`inline-flex items-center gap-3 mt-4 px-4 py-2 bg-gradient-to-r ${getRoleColor(currentPlayer?.role)} rounded-full`}
              >
                {React.createElement(getRoleIcon(currentPlayer?.role), { size: 20, className: "text-white" })}
                <span className="text-white font-semibold capitalize">
                  {currentPlayer?.role || "Villager"}
                </span>
              </motion.div>
            </DrawerHeader>

            <div className="p-6">
              {filteredPlayers.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 text-gray-400"
                >
                  <Users size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-xl font-semibold mb-2">No targets available</p>
                  <p>All eligible players have been eliminated or you cannot target anyone right now.</p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {filteredPlayers.map((player, index) => (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                        className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer overflow-hidden"
                      >
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                        
                        {/* Player Avatar */}
                        <div className="relative mb-4">
                          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full p-0.5 shadow-lg">
                            <div className="w-full h-full bg-gray-800 rounded-full flex items-center justify-center">
                              {player.profile ? (
                                <img 
                                  src={player.profile} 
                                  alt={player.name}
                                  className="w-full h-full object-cover rounded-full"
                                />
                              ) : (
                                <span className="text-white font-bold text-xl">
                                  {player.name?.charAt(0) || "?"}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Online indicator */}
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-gray-800">
                            <div className="w-full h-full bg-green-400 rounded-full animate-pulse" />
                          </div>
                        </div>

                        {/* Player Name */}
                        <h3 className="text-white font-bold text-lg text-center mb-4 group-hover:text-cyan-400 transition-colors duration-300">
                          {player.name}
                        </h3>

                        {/* Action Buttons */}
                        <div className="space-y-2 relative z-10">
                          {/* Wolf Kill Button */}
                          {currentPlayer?.role === "wolf" && roomInfo.stage === "night" && !roomInfo.wolf_killed && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handlePlayerAction(player, "kill")}
                              disabled={isLoading && selectedPlayer?.id === player.id}
                              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-red-500/25 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isLoading && selectedPlayer?.id === player.id ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Skull size={18} />
                                  <span>Eliminate</span>
                                </>
                              )}
                            </motion.button>
                          )}

                          {/* Seer See Button */}
                          {currentPlayer?.role === "seer" && roomInfo.stage === "night" && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handlePlayerAction(player, "see")}
                              disabled={isLoading && selectedPlayer?.id === player.id}
                              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-purple-500/25 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isLoading && selectedPlayer?.id === player.id ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Search size={18} />
                                  <span>Divine</span>
                                </>
                              )}
                            </motion.button>
                          )}

                          {/* Doctor Save Button */}
                          {currentPlayer?.role === "doctor" && roomInfo.stage === "night" && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handlePlayerAction(player, "save")}
                              disabled={isLoading && selectedPlayer?.id === player.id}
                              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-green-500/25 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isLoading && selectedPlayer?.id === player.id ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Heart size={18} />
                                  <span>Protect</span>
                                </>
                              )}
                            </motion.button>
                          )}

                          {/* Voting button for day */}
                          {roomInfo.stage === "day" && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handlePlayerAction(player, "vote")}
                              disabled={isLoading && selectedPlayer?.id === player.id}
                              className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-orange-500/25 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isLoading && selectedPlayer?.id === player.id ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Target size={18} />
                                  <span>Vote to Eliminate</span>
                                </>
                              )}
                            </motion.button>
                          )}
                        </div>

                        {/* Selection indicator */}
                        {selectedPlayer?.id === player.id && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-cyan-400/10 rounded-2xl border-2 border-cyan-400/50"
                          />
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <DrawerFooter className="border-t border-gray-700/50 pt-6">
              <DrawerClose asChild>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  id="close-drawer"
                  className="mx-auto px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-300 flex items-center gap-2"
                >
                  <X size={20} />
                  Cancel Action
                </motion.button>
              </DrawerClose>
            </DrawerFooter>
          </motion.div>
        </DrawerContent>
      </Drawer>

      {/* Enhanced Modal for results */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                {savedPlayer ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                      <Shield className="text-white" size={32} />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white mb-2">Target Protected!</h3>
                    <p className="text-gray-300 mb-6">
                      <span className="text-green-400 font-semibold">{savedPlayer.name}</span> is under divine protection
                    </p>
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className={`w-16 h-16 bg-gradient-to-r ${
                        playerToSeeRole?.role === "wolf" 
                          ? "from-red-500 to-red-700" 
                          : "from-blue-500 to-blue-700"
                      } rounded-full flex items-center justify-center mx-auto mb-4`}
                    >
                      {playerToSeeRole?.role === "wolf" ? (
                        <Skull className="text-white" size={32} />
                      ) : (
                        <CheckCircle className="text-white" size={32} />
                      )}
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white mb-2">Vision Revealed</h3>
                    <p className="text-gray-300 mb-6">
                      <span className={`font-semibold ${
                        playerToSeeRole?.role === "wolf" ? "text-red-400" : "text-blue-400"
                      }`}>
                        {playerToSeeRole?.name}
                      </span>{" "}
                      {playerToSeeRole?.role === "wolf" ? "is the werewolf!" : "is innocent"}
                    </p>
                  </>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setModalOpen(false)}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
                >
                  Continue Game
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}