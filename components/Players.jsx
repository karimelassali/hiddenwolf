import Image from "next/image";
import { FaCrown } from "react-icons/fa";
import { X } from "lucide-react";
import { BorderBeam } from "@/components/magicui/border-beam";

export function Players({ fetched_players, room_host_id, isHost, onKick }) {
    return (
        <div className="flex-1 flex flex-col items-center justify-start w-full max-w-5xl mx-auto z-10">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-4 sm:gap-6 p-4 w-full">
                {fetched_players && fetched_players.map((player) => {
                    const isPlayerHost = player.player_id === room_host_id;
                    return (
                        <div
                            key={player.id}
                            className="relative group flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 bg-stone-950/80 backdrop-blur-md border border-stone-800 rounded-lg shadow-2xl hover:border-red-900/50 transition-all duration-500 w-full sm:w-48 aspect-square sm:aspect-auto"
                        >
                            {/* Host Crown */}
                            {isPlayerHost && (
                                <div className="absolute -top-4 sm:-top-6 animate-bounce drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                                    <FaCrown className="text-amber-500 text-2xl sm:text-3xl" />
                                </div>
                            )}

                            {/* Kick Button (Only for Host, cannot kick self) */}
                            {isHost && !isPlayerHost && (
                                <button
                                    onClick={() => onKick && onKick(player.player_id)}
                                    className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 p-1 sm:p-1.5 bg-stone-900 border border-red-900/50 text-red-700 rounded-full hover:bg-red-900 hover:text-white transition-all duration-300 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shadow-lg z-20"
                                    title="Exile Soul"
                                >
                                    <X size={12} className="sm:hidden" />
                                    <X size={14} className="hidden sm:block" />
                                </button>
                            )}

                            {/* Profile Image with Glow */}
                            <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 ${isPlayerHost ? 'bg-gradient-to-b from-amber-600 to-transparent' : 'bg-stone-800'}`}>
                                <Image
                                    className="w-full h-full object-cover rounded-full border-2 border-stone-900 grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
                                    width={100}
                                    height={100}
                                    src={player.profile}
                                    alt={player.name}
                                />
                                {isPlayerHost && <BorderBeam size={80} duration={10} colorFrom="#b45309" colorTo="#f59e0b" />}
                            </div>

                            {/* Player Name */}
                            <p className="text-sm sm:text-lg font-serif font-bold text-stone-300 group-hover:text-red-100 transition-colors text-center truncate w-full px-1">
                                {player.name}
                            </p>

                            {/* Decorative Line */}
                            <div className="w-6 sm:w-8 h-px bg-stone-700 group-hover:bg-red-900/50 transition-colors hidden sm:block" />
                        </div>
                    )
                })}
            </div>
        </div>
    );
}