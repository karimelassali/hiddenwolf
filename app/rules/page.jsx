"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    GiWolfHead,
    GiMagnifyingGlass,
    GiCrossedSwords,
    GiMoon,
    GiSun,
    GiTombstone,
    GiScrollUnfurled
} from "react-icons/gi";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RulesPage() {
    const router = useRouter();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="relative min-h-screen w-full bg-stone-950 text-stone-900 font-serif selection:bg-red-900/30 selection:text-red-900 overflow-x-hidden">

            {/* Background Layers */}
            <div className="fixed inset-0 bg-[url('/assets/images/background.png')] bg-cover bg-center opacity-30 grayscale contrast-125" />
            <div className="fixed inset-0 bg-stone-950/80" />
            <div className="fixed inset-0 bg-[url('/noise.png')] opacity-[0.15] mix-blend-overlay pointer-events-none" />

            {/* Content Container */}
            <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-20">

                {/* Navigation Back */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-8"
                >
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/")}
                        className="group flex items-center gap-2 text-stone-400 hover:text-stone-200 hover:bg-stone-800/50 transition-all duration-300 font-serif uppercase tracking-widest pl-0"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Back to Lobby
                    </Button>
                </motion.div>

                {/* The Scroll / Tome Content */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="relative bg-stone-200 min-h-[80vh] rounded-sm shadow-2xl overflow-hidden"
                    style={{
                        boxShadow: "0 0 50px -12px rgba(0, 0, 0, 0.9), inset 0 0 100px -20px rgba(0,0,0,0.3)"
                    }}
                >
                    {/* Paper Texture Overlay (CSS only, no external images) */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-multiply bg-amber-900" />
                    <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('/noise.png')]" />

                    {/* Ragged Edge / Old Book Styling */}
                    <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-stone-900/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-stone-900/10 to-transparent" />

                    <div className="relative p-8 md:p-16 space-y-12">

                        {/* Header */}
                        <motion.div variants={itemVariants} className="text-center space-y-4 border-b-2 border-stone-800/10 pb-12">
                            <GiScrollUnfurled className="w-16 h-16 mx-auto text-stone-800 opacity-80" />
                            <h1 className="text-4xl md:text-6xl font-black text-stone-900 tracking-tighter uppercase" style={{ fontFamily: 'Cinzel, serif' }}>
                                The Rules
                            </h1>
                            <p className="text-xl md:text-2xl text-stone-700 italic font-medium max-w-2xl mx-auto">
                                "Trust no one. The night is dark and full of terrors."
                            </p>
                        </motion.div>

                        {/* Section 1: The Premise */}
                        <motion.div variants={itemVariants} className="space-y-6">
                            <h2 className="text-2xl md:text-3xl font-bold text-stone-800 uppercase tracking-widest flex items-center gap-4">
                                <span className="w-8 h-[2px] bg-red-900/50" />
                                The Premise
                                <span className="w-8 h-[2px] bg-red-900/50" />
                            </h2>
                            <p className="text-lg md:text-xl leading-relaxed text-stone-800 font-medium">
                                Hidden Wolf is a game of deception, deduction, and survival.
                                Players are divided into two teams: the <span className="text-red-900 font-bold">Werewolves</span> and the <span className="text-stone-700 font-bold">Villagers</span>.
                                The Werewolves hide in plain sight, killing villagers at night. During the day, the Villagers must deduce who the beasts are and execute them.
                            </p>
                        </motion.div>

                        {/* Section 2: The Roles */}
                        <motion.div variants={itemVariants} className="space-y-8">
                            <h2 className="text-2xl md:text-3xl font-bold text-stone-800 uppercase tracking-widest flex items-center gap-4">
                                <span className="w-8 h-[2px] bg-red-900/50" />
                                The Roles
                                <span className="w-8 h-[2px] bg-red-900/50" />
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Werewolf Card */}
                                <div className="bg-stone-800/5 border border-stone-800/10 p-6 rounded-lg flex gap-4 transition-all hover:bg-stone-800/10">
                                    <div className="shrink-0 p-3 bg-red-900/10 rounded-full h-fit">
                                        <GiWolfHead className="w-8 h-8 text-red-900" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-red-900 mb-2 uppercase">The Werewolf</h3>
                                        <p className="text-stone-700 leading-relaxed font-medium">
                                            Wakes up at night to choose a victim. Must deceive the villagers during the day to survive.
                                        </p>
                                    </div>
                                </div>

                                {/* Villager Card */}
                                <div className="bg-stone-800/5 border border-stone-800/10 p-6 rounded-lg flex gap-4 transition-all hover:bg-stone-800/10">
                                    <div className="shrink-0 p-3 bg-stone-600/10 rounded-full h-fit">
                                        <GiCrossedSwords className="w-8 h-8 text-stone-700" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-stone-800 mb-2 uppercase">The Villager</h3>
                                        <p className="text-stone-700 leading-relaxed font-medium">
                                            Has no special abilities. Must use logic and intuition to find the wolves before it's too late.
                                        </p>
                                    </div>
                                </div>

                                {/* Seer Card */}
                                <div className="bg-stone-800/5 border border-stone-800/10 p-6 rounded-lg flex gap-4 transition-all hover:bg-stone-800/10">
                                    <div className="shrink-0 p-3 bg-indigo-900/10 rounded-full h-fit">
                                        <GiMagnifyingGlass className="w-8 h-8 text-indigo-900" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-indigo-900 mb-2 uppercase">The Seer</h3>
                                        <p className="text-stone-700 leading-relaxed font-medium">
                                            Wakes up at night to learn the true identity of one player. The village's best hope.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Section 3: The Cycle */}
                        <motion.div variants={itemVariants} className="space-y-8">
                            <h2 className="text-2xl md:text-3xl font-bold text-stone-800 uppercase tracking-widest flex items-center gap-4">
                                <span className="w-8 h-[2px] bg-red-900/50" />
                                The Cycle
                                <span className="w-8 h-[2px] bg-red-900/50" />
                            </h2>

                            <div className="space-y-6">
                                <div className="flex items-start gap-6">
                                    <GiMoon className="w-10 h-10 text-stone-600 shrink-0 mt-1" />
                                    <div>
                                        <h3 className="text-xl font-bold text-stone-900 mb-2">Night Phase</h3>
                                        <p className="text-stone-700 font-medium">
                                            The village sleeps. The Werewolves wake up to kill. The Seer wakes up to investigate. Silence reigns.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-6">
                                    <GiSun className="w-10 h-10 text-amber-700 shrink-0 mt-1" />
                                    <div>
                                        <h3 className="text-xl font-bold text-stone-900 mb-2">Day Phase</h3>
                                        <p className="text-stone-700 font-medium">
                                            The survivors wake up. The victim is revealed. Discussion begins. Who looks suspicious? Who is lying?
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-6">
                                    <GiTombstone className="w-10 h-10 text-stone-800 shrink-0 mt-1" />
                                    <div>
                                        <h3 className="text-xl font-bold text-stone-900 mb-2">The Vote</h3>
                                        <p className="text-stone-700 font-medium">
                                            The village votes to eliminate a suspect. The player with the most votes is executed and their role is revealed.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Section 4: Winning */}
                        <motion.div variants={itemVariants} className="space-y-6 pt-8 border-t-2 border-stone-800/10">
                            <h2 className="text-2xl md:text-3xl font-bold text-stone-800 uppercase tracking-widest flex items-center gap-4">
                                <span className="w-8 h-[2px] bg-red-900/50" />
                                Victory
                                <span className="w-8 h-[2px] bg-red-900/50" />
                            </h2>
                            <ul className="list-disc list-inside space-y-4 text-lg md:text-xl text-stone-800 font-medium pl-4">
                                <li>
                                    <span className="font-bold text-stone-900">Villagers Win:</span> When all Werewolves are eliminated.
                                </li>
                                <li>
                                    <span className="font-bold text-red-900">Werewolves Win:</span> When they equal or outnumber the Villagers.
                                </li>
                            </ul>
                        </motion.div>

                        {/* Footer Signature */}
                        <div className="pt-16 pb-8 text-center opacity-60">
                            <p className="font-serif italic text-stone-600">~ The Elder Council ~</p>
                        </div>

                    </div>
                </motion.div>
            </div>
        </div>
    );
}
