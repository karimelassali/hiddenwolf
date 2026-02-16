"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { HowlSound } from "@/utils/sounds";

const ROLES = ["wolf", "seer", "doctor", "villager"];
const STAGES = ["day", "night", "ended"];

const ROLE_STYLE = {
    wolf: { emoji: "🐺", bg: "#dc2626", glow: "rgba(220,38,38,0.3)" },
    seer: { emoji: "🔮", bg: "#9333ea", glow: "rgba(147,51,234,0.3)" },
    doctor: { emoji: "💊", bg: "#059669", glow: "rgba(5,150,105,0.3)" },
    villager: { emoji: "🏘️", bg: "#2563eb", glow: "rgba(37,99,235,0.3)" },
};

const STAGE_STYLE = {
    day: { emoji: "☀️", bg: "#d97706" },
    night: { emoji: "🌙", bg: "#4f46e5" },
    ended: { emoji: "🏁", bg: "#64748b" },
};

/* ─── tiny reusable components ─── */

function Chip({ active, onClick, children, color }) {
    return (
        <button
            onClick={onClick}
            style={active ? { background: color, boxShadow: `0 0 12px ${color}44` } : {}}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide transition-all duration-150
        ${active
                    ? "text-white border border-white/20"
                    : "bg-white/[0.04] text-white/50 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white/80"
                }`}
        >
            {children}
        </button>
    );
}

function TinyBtn({ onClick, children, color = "white" }) {
    return (
        <button
            onClick={onClick}
            className="px-2.5 py-1.5 rounded-md text-[10px] font-bold tracking-wide transition-all duration-150
        bg-white/[0.04] text-white/60 border border-white/[0.06]
        hover:bg-white/[0.1] hover:text-white hover:border-white/[0.12]
        active:scale-95"
        >
            {children}
        </button>
    );
}

function Divider({ label }) {
    return (
        <div className="flex items-center gap-2 pt-1">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 whitespace-nowrap">
                {label}
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
        </div>
    );
}

/* ─── main component ─── */

export default function CheatMenu({
    roomData,
    players,
    currentPlayer,
    setShowDeathEffect,
    setIsRoleModalOpen,
    setWinner,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [tab, setTab] = useState("player"); // player | world | tools

    if (process.env.NODE_ENV !== "development") return null;
    if (!roomData || !currentPlayer) return null;

    /* ─── handlers ─── */

    const updatePlayer = async (id, data) => {
        await supabase.from("players").update(data).eq("id", id);
    };

    const updateRoom = async (data) => {
        await supabase.from("rooms").update(data).eq("id", roomData.id);
    };

    const changeMyRole = async (role) => {
        await updatePlayer(currentPlayer.id, { role });
        toast.success(`You → ${ROLE_STYLE[role].emoji} ${role}`, { icon: "🎭" });
    };

    const changeBotRole = async (id, role) => {
        await updatePlayer(id, { role });
        toast.success(`Bot → ${role}`, { icon: "🤖" });
    };

    const toggleField = async (id, field, val) => {
        await updatePlayer(id, { [field]: !val });
        toast.success(`${field}: ${!val}`, { icon: "⚡" });
    };

    const setStage = async (stage) => {
        await updateRoom({ stage });
        toast.success(`Phase → ${stage}`, { icon: STAGE_STYLE[stage].emoji });
    };

    const setRound = async (delta) => {
        const r = Math.max(0, (roomData.round || 0) + delta);
        await updateRoom({ round: r });
        toast.success(`Round → ${r}`, { icon: "🔄" });
    };

    const killPlayer = async (id) => {
        await updatePlayer(id, { is_alive: false, dying_method: "cheat" });
        toast.success("Eliminated", { icon: "💀" });
    };

    const reviveAll = async () => {
        for (const p of players) await updatePlayer(p.id, { is_alive: true, dying_method: null });
        toast.success("All revived", { icon: "✨" });
    };

    const resetAll = async () => {
        for (const p of players)
            await updatePlayer(p.id, { is_action_done: false, voted_to: null, is_saved: false });
        toast.success("Actions reset", { icon: "🔄" });
    };

    const forceWin = async (team) => {
        const alive = players.filter((p) => p.is_alive);
        setWinner({
            team: team === "wolves" ? "Wolves" : "Villagers",
            name: `DEV: ${team} win`,
            role: team === "wolves" ? "wolf" : "villager",
            players: alive.filter((p) => (team === "wolves" ? p.role === "wolf" : p.role !== "wolf")),
            enemy: players.filter((p) => (team === "wolves" ? p.role !== "wolf" : p.role === "wolf")),
        });
        await updateRoom({ stage: "ended" });
        toast.success(`${team} win!`, { icon: "🏆" });
    };

    const alive = players.filter((p) => p.is_alive);
    const bots = players.filter((p) => !p.is_human);

    /* ─── tab content ─── */

    const renderPlayer = () => (
        <div className="space-y-3">
            <Divider label="Your Role" />
            <div className="flex flex-wrap gap-1.5">
                {ROLES.map((r) => (
                    <Chip key={r} active={currentPlayer.role === r} onClick={() => changeMyRole(r)} color={ROLE_STYLE[r].bg}>
                        {ROLE_STYLE[r].emoji} {r}
                    </Chip>
                ))}
            </div>

            <Divider label="Your Flags" />
            <div className="flex flex-wrap gap-1.5">
                {[
                    { field: "is_alive", val: currentPlayer.is_alive, on: "Alive ✅", off: "Dead 💀" },
                    { field: "is_saved", val: currentPlayer.is_saved, on: "Saved 🛡️", off: "Unsaved" },
                    { field: "is_action_done", val: currentPlayer.is_action_done, on: "Done ✔", off: "Pending ⏳" },
                ].map(({ field, val, on, off }) => (
                    <Chip key={field} active={val} onClick={() => toggleField(currentPlayer.id, field, val)} color="#6366f1">
                        {val ? on : off}
                    </Chip>
                ))}
            </div>

            {bots.length > 0 && (
                <>
                    <Divider label={`Bots (${bots.length})`} />
                    <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1 custom-scroll">
                        {bots.map((bot) => (
                            <div key={bot.id} className="flex items-center gap-2 py-1">
                                <img src={bot.profile} alt="" className="w-5 h-5 rounded-full border border-white/10 flex-shrink-0" />
                                <span className="text-[10px] text-white/50 truncate flex-1">{bot.name}</span>
                                <select
                                    value={bot.role || ""}
                                    onChange={(e) => changeBotRole(bot.id, e.target.value)}
                                    className="bg-white/[0.04] border border-white/[0.08] rounded text-[10px] text-white/70 pl-1.5 pr-5 py-0.5 outline-none focus:border-amber-500/50 cursor-pointer appearance-none"
                                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' fill='white' viewBox='0 0 16 16'%3E%3Cpath d='M8 12L2 6h12z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 4px center" }}
                                >
                                    {ROLES.map((r) => (
                                        <option key={r} value={r}>{ROLE_STYLE[r].emoji} {r}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );

    const renderWorld = () => (
        <div className="space-y-3">
            <Divider label="Phase" />
            <div className="flex gap-1.5">
                {STAGES.map((s) => (
                    <Chip key={s} active={roomData.stage === s} onClick={() => setStage(s)} color={STAGE_STYLE[s].bg}>
                        {STAGE_STYLE[s].emoji} {s}
                    </Chip>
                ))}
            </div>

            <Divider label="Round" />
            <div className="flex items-center gap-2">
                <TinyBtn onClick={() => setRound(-1)}>−</TinyBtn>
                <span className="text-sm font-black text-white/90 tabular-nums min-w-[20px] text-center">
                    {roomData.round || 0}
                </span>
                <TinyBtn onClick={() => setRound(1)}>+</TinyBtn>
            </div>

            <Divider label="Kill Player" />
            <div className="flex flex-wrap gap-1">
                {alive
                    .filter((p) => p.id !== currentPlayer.id)
                    .map((p) => (
                        <button
                            key={p.id}
                            onClick={() => killPlayer(p.id)}
                            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold
                bg-red-500/[0.08] text-red-400/80 border border-red-500/[0.1]
                hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30
                active:scale-95 transition-all"
                        >
                            💀 {p.name}
                        </button>
                    ))}
                {alive.filter((p) => p.id !== currentPlayer.id).length === 0 && (
                    <span className="text-[10px] text-white/20 italic">No targets</span>
                )}
            </div>

            <Divider label="Bulk" />
            <div className="flex flex-wrap gap-1.5">
                <TinyBtn onClick={reviveAll}>✨ Revive All</TinyBtn>
                <TinyBtn onClick={resetAll}>🔄 Reset Actions</TinyBtn>
            </div>
        </div>
    );

    const renderTools = () => (
        <div className="space-y-3">
            <Divider label="Force Win" />
            <div className="flex gap-1.5">
                <TinyBtn onClick={() => forceWin("villagers")}>🏘️ Villagers Win</TinyBtn>
                <TinyBtn onClick={() => forceWin("wolves")}>🐺 Wolves Win</TinyBtn>
            </div>

            <Divider label="Trigger Effects" />
            <div className="flex flex-wrap gap-1.5">
                <TinyBtn onClick={() => { setIsRoleModalOpen(true); toast.success("Role reveal", { icon: "🎭" }); }}>
                    🎭 Role Reveal
                </TinyBtn>
                <TinyBtn onClick={() => { setShowDeathEffect(true); setTimeout(() => setShowDeathEffect(false), 5000); toast.success("Death FX", { icon: "💀" }); }}>
                    💀 Death Effect
                </TinyBtn>
                <TinyBtn onClick={() => { HowlSound(); toast.success("Howl", { icon: "🐺" }); }}>
                    🔊 Play Howl
                </TinyBtn>
            </div>

            <Divider label="Room Info" />
            <div className="text-[10px] font-mono text-white/30 space-y-0.5 bg-white/[0.02] rounded-lg p-2 border border-white/[0.04]">
                <p>id: <span className="text-white/50">{roomData.id}</span></p>
                <p>code: <span className="text-white/50">{roomData.code}</span></p>
                <p>host: <span className="text-white/50">{roomData.host_id?.slice(0, 12)}…</span></p>
                <p>roles_assigned: <span className="text-white/50">{String(roomData.roles_assigned)}</span></p>
                <p>wolf_killed: <span className="text-white/50">{String(roomData.wolf_killed)}</span></p>
            </div>
        </div>
    );

    const TABS = [
        { id: "player", label: "Player", icon: "👤" },
        { id: "world", label: "World", icon: "🌍" },
        { id: "tools", label: "Tools", icon: "🧰" },
    ];

    return (
        <>
            {/* ─── Floating Toggle ─── */}
            <motion.button
                onClick={() => setIsOpen((v) => !v)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className={`fixed z-[9999] w-10 h-10 rounded-xl flex items-center justify-center text-sm
          transition-all duration-300 shadow-lg
          ${isOpen
                        ? "bottom-6 left-6 bg-white/10 backdrop-blur-md border border-white/10 text-white/60 hover:text-white"
                        : "bottom-6 left-6 bg-gradient-to-br from-amber-500 to-orange-600 text-white border border-white/20 shadow-orange-500/25 hover:shadow-orange-500/40"
                    }`}
                title="Dev Cheats"
            >
                {isOpen ? "✕" : "🛠️"}
            </motion.button>

            {/* ─── Panel ─── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.96 }}
                        transition={{ type: "spring", damping: 28, stiffness: 380 }}
                        className="fixed z-[9998] bottom-[72px] left-6 w-[300px] max-h-[60vh] flex flex-col
              rounded-2xl overflow-hidden
              bg-[#0d1117]/95 backdrop-blur-2xl
              border border-white/[0.06]
              shadow-[0_24px_80px_-12px_rgba(0,0,0,0.9)]"
                    >
                        {/* Header bar */}
                        <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-white/[0.06] bg-white/[0.02] flex-shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
                            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-white/50">
                                Dev Cheats
                            </span>
                            <div className="ml-auto flex items-center gap-1.5 text-[9px] font-mono text-white/20">
                                <span className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                                    {roomData.stage}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                                    R{roomData.round || 0}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400/60">
                                    {alive.length}/{players.length}
                                </span>
                            </div>
                        </div>

                        {/* Tab bar */}
                        <div className="flex border-b border-white/[0.06] flex-shrink-0">
                            {TABS.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTab(t.id)}
                                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-all
                    ${tab === t.id
                                            ? "text-white/90 bg-white/[0.04] border-b-2 border-amber-500"
                                            : "text-white/25 hover:text-white/50 hover:bg-white/[0.02] border-b-2 border-transparent"
                                        }`}
                                >
                                    {t.icon} {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab content */}
                        <div className="flex-1 overflow-y-auto p-3 custom-scroll min-h-0">
                            {tab === "player" && renderPlayer()}
                            {tab === "world" && renderWorld()}
                            {tab === "tools" && renderTools()}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
        .custom-scroll::-webkit-scrollbar { width: 3px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}</style>
        </>
    );
}
