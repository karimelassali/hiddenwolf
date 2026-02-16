/**
 * Level System for Hidden Wolf
 * 
 * XP Formula:
 *   base_xp (50) + win_bonus (100) + role_bonus (10-20) + survival_bonus (30)
 * 
 * Level Thresholds:
 *   XP needed for level N = 100 × N × 1.2
 */

// --- XP Calculation ---

const ROLE_XP = {
    wolf: 20,
    doctor: 15,
    seer: 15,
    villager: 10,
};

export function calculateXpGain({ won, role, survived }) {
    let xp = 50; // base XP for playing
    if (won) xp += 100;
    xp += ROLE_XP[role] || 10;
    if (survived) xp += 30;
    return xp;
}

// --- Level Thresholds ---

/** Total XP needed to reach a given level (cumulative) */
export function getTotalXpForLevel(level) {
    if (level <= 1) return 0;
    let total = 0;
    for (let i = 2; i <= level; i++) {
        total += Math.floor(100 * i * 1.2);
    }
    return total;
}

/** XP needed to go from level N to level N+1 */
export function getXpForNextLevel(level) {
    return Math.floor(100 * (level + 1) * 1.2);
}

/** Derive the current level from total XP */
export function getLevelFromXp(totalXp) {
    let level = 1;
    while (getTotalXpForLevel(level + 1) <= totalXp) {
        level++;
    }
    return level;
}

/** Get detailed level progress info */
export function getLevelProgress(totalXp) {
    const level = getLevelFromXp(totalXp);
    const currentLevelXp = getTotalXpForLevel(level);
    const nextLevelXp = getTotalXpForLevel(level + 1);
    const xpIntoLevel = totalXp - currentLevelXp;
    const xpNeeded = nextLevelXp - currentLevelXp;
    const progress = xpNeeded > 0 ? Math.min((xpIntoLevel / xpNeeded) * 100, 100) : 100;

    return {
        level,
        totalXp,
        xpIntoLevel,
        xpNeeded,
        progress: Math.round(progress * 10) / 10,
        title: getLevelTitle(level),
    };
}

/** Flavor title for each level range */
export function getLevelTitle(level) {
    if (level >= 50) return "Mythic Wolf";
    if (level >= 40) return "Alpha";
    if (level >= 30) return "Hunter";
    if (level >= 20) return "Guardian";
    if (level >= 15) return "Tracker";
    if (level >= 10) return "Pathfinder";
    if (level >= 5) return "Villager";
    return "Pup";
}

/** Color for each level range (tailwind classes) */
export function getLevelColor(level) {
    if (level >= 50) return "text-red-400";
    if (level >= 40) return "text-yellow-400";
    if (level >= 30) return "text-purple-400";
    if (level >= 20) return "text-blue-400";
    if (level >= 15) return "text-cyan-400";
    if (level >= 10) return "text-emerald-400";
    if (level >= 5) return "text-green-400";
    return "text-slate-400";
}

export function getLevelBgColor(level) {
    if (level >= 50) return "bg-red-500/20 border-red-500/30";
    if (level >= 40) return "bg-yellow-500/20 border-yellow-500/30";
    if (level >= 30) return "bg-purple-500/20 border-purple-500/30";
    if (level >= 20) return "bg-blue-500/20 border-blue-500/30";
    if (level >= 15) return "bg-cyan-500/20 border-cyan-500/30";
    if (level >= 10) return "bg-emerald-500/20 border-emerald-500/30";
    if (level >= 5) return "bg-green-500/20 border-green-500/30";
    return "bg-slate-500/20 border-slate-500/30";
}
