"use client";

import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";
import {
    GiWolfHead,
    GiCrossedSwords,
    GiMagnifyingGlass,
    GiBleedingEye,
    GiMoon,
    GiVillage,
    GiHealthPotion,
    GiGlobe
} from "react-icons/gi";
import { useRef, useState, useEffect } from "react";

const translations = {
    en: {
        title: "Hidden Wolf",
        subtitle: "Can you survive the night?",
        cta: "Play Now",
        join: "Join the Village • No Download Required",
        scroll: "Scroll",
        nightPhase: "The Night Phase",
        nightTitle: "Deceive or Deduce",
        nightDesc: "Every night, the wolves choose a victim. Every day, the village votes to execute a suspect. If you're a villager, trust no one. If you're a wolf, lie like your life depends on it—because it does.",
        chooseFate: "Choose Your Fate",
        footerTitle: "The Hunt Begins",
        privacy: "Privacy",
        terms: "Terms",
        discord: "Discord",
        roles: {
            villager: { title: "The Villager", desc: "No special powers. Just your wits and your vote. Find the wolves before you become dinner." },
            werewolf: { title: "The Werewolf", desc: "Kill at night. Blend in during the day. Sabotage the village from within." },
            seer: { title: "The Seer", desc: "The village's best hope. Each night, you can learn the true identity of one player." },
            doctor: { title: "The Doctor", desc: "Heal the wounded. Each night, choose one player to save from the wolves' attack." }
        }
    },
    ar: {
        title: "الذئب الخفي",
        subtitle: "هل يمكنك النجاة في هذه الليلة؟",
        cta: "العب الآن",
        join: "انضم إلى القرية • لا حاجة للتحميل",
        scroll: "تمرير",
        nightPhase: "مرحلة الليل",
        nightTitle: "خادع أو استنتج",
        nightDesc: "كل ليلة، يختار الذئاب ضحية. كل يوم، تصوت القرية لإعدام مشتبه به. إذا كنت قرويًا، لا تثق بأحد. إذا كنت ذئبًا، اكذب وكأن حياتك تعتمد على ذلك - لأنها كذلك.",
        chooseFate: "اختر مصيرك",
        footerTitle: "بدأ الصيد",
        privacy: "الخصوصية",
        terms: "الشروط",
        discord: "ديسكورد",
        roles: {
            villager: { title: "القروي", desc: "لا قوى خاصة. فقط ذكاؤك وصوتك. اعثر على الذئاب قبل أن تصبح عشاءً." },
            werewolf: { title: "المستذئب", desc: "اقتل في الليل. اندمج في النهار. خرب القرية من الداخل." },
            seer: { title: "الرائي", desc: "أمل القرية الأفضل. كل ليلة، يمكنك معرفة الهوية الحقيقية للاعب واحد." },
            doctor: { title: "الطبيب", desc: "عالج الجرحى. كل ليلة، اختر لاعبًا واحدًا لإنقاذه من هجوم الذئاب." }
        }
    }
};

export default function LandingPage() {
    const targetRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end start"],
    });

    const [lang, setLang] = useState("en");

    useEffect(() => {
        const savedLang = localStorage.getItem("hiddenwolf_lang");
        if (savedLang) setLang(savedLang);
    }, []);

    const toggleLang = () => {
        const newLang = lang === "en" ? "ar" : "en";
        setLang(newLang);
        localStorage.setItem("hiddenwolf_lang", newLang);
    };

    const t = translations[lang];
    const isAr = lang === "ar";
    const dir = isAr ? "rtl" : "ltr";

    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);
    const y = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

    const fadeInUp = {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    return (
        <div dir={dir} className={`relative w-full min-h-screen bg-stone-950 font-serif text-stone-200 overflow-x-hidden selection:bg-red-900/40 selection:text-red-100 ${isAr ? 'font-sans' : ''}`}>

            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('/assets/images/background1.avif')] bg-cover bg-center opacity-20 grayscale-[50%] contrast-125" />
                <div className="absolute inset-0 bg-gradient-to-b from-stone-950/80 via-stone-900/60 to-stone-950" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.06] mix-blend-overlay" />
            </div>

            {/* Language Toggle */}
            <div className="fixed top-6 right-6 z-50">
                <Button
                    variant="outline"
                    onClick={toggleLang}
                    className="bg-stone-900/50 backdrop-blur border-stone-700 text-stone-300 hover:bg-stone-800 hover:text-white uppercase tracking-wider text-xs gap-2"
                >
                    <GiGlobe /> {lang === "en" ? "العربية" : "English"}
                </Button>
            </div>

            {/* HERO SECTION */}
            <div ref={targetRef} className="relative z-10 h-screen flex flex-col items-center justify-center px-4 text-center">
                <motion.div
                    style={{ opacity, scale, y }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                    className="space-y-8 max-w-4xl"
                >
                    <div className="relative inline-block mb-4">
                        <motion.div
                            animate={{
                                dropShadow: ["0 0 15px rgba(220,38,38,0.2)", "0 0 30px rgba(220,38,38,0.5)", "0 0 15px rgba(220,38,38,0.2)"]
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <GiWolfHead className="w-24 h-24 md:w-32 md:h-32 mx-auto text-red-900/90" />
                        </motion.div>
                    </div>

                    <h1 className={`text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter uppercase leading-none bg-gradient-to-b from-stone-200 to-stone-600 bg-clip-text text-transparent ${isAr ? 'font-sans' : ''}`} style={{ fontFamily: isAr ? 'inherit' : 'Cinzel, serif' }}>
                        {t.title}
                    </h1>

                    <p className="text-xl md:text-2xl text-stone-400 font-medium italic max-w-2xl mx-auto leading-relaxed">
                        "{t.subtitle}"
                    </p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="pt-8"
                    >
                        <SignInButton mode="modal">
                            <Button
                                size="lg"
                                className="group relative bg-red-900 hover:bg-red-950 text-stone-100 border border-red-800/40 px-10 py-8 text-xl tracking-widest uppercase overflow-hidden transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_40px_rgba(220,38,38,0.4)]"
                            >
                                <span className="relative z-10 flex items-center gap-3">
                                    {t.cta} {isAr ? <GiCrossedSwords className="rotate-180" /> : <GiCrossedSwords />}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-red-800 to-red-950 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </Button>
                        </SignInButton>
                        <p className="mt-6 text-xs text-stone-600 font-mono uppercase tracking-[0.2em] animate-pulse">
                            {t.join}
                        </p>
                    </motion.div>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    animate={{ y: [0, 10, 0], opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 text-stone-500 flex flex-col items-center gap-2"
                >
                    <span className="text-[10px] uppercase tracking-widest">{t.scroll}</span>
                    <div className="w-px h-12 bg-gradient-to-b from-stone-500 to-transparent" />
                </motion.div>
            </div>

            {/* FEATURES SECTION - SCROLL REVEAL */}
            <div className="relative z-10 max-w-6xl mx-auto px-6 pb-32">
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center mb-40"
                >
                    <motion.div variants={fadeInUp} className="space-y-6">
                        <div className="inline-flex items-center gap-2 text-red-500/80 font-mono text-sm uppercase tracking-wider">
                            <GiMoon className="w-5 h-5" />
                            <span>{t.nightPhase}</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-stone-100 to-stone-500 bg-clip-text text-transparent">
                            {t.nightTitle}
                        </h2>
                        <p className="text-lg text-stone-400 leading-relaxed font-sans">
                            {t.nightDesc}
                        </p>
                    </motion.div>

                    <motion.div
                        variants={fadeInUp}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-red-500/10 blur-[100px] rounded-full" />

                        {/* Cards Visual */}
                        <div className="relative bg-stone-900/50 border border-stone-800 p-8 rounded-xl backdrop-blur-sm transform rotate-2 hover:rotate-0 transition-transform duration-500">
                            <div className="flex items-center justify-between border-b border-stone-800 pb-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-red-900/20 flex items-center justify-center">
                                        <GiWolfHead className="text-red-500" />
                                    </div>
                                    <span className="font-bold text-red-500">{t.roles.werewolf.title}</span>
                                </div>
                            </div>
                            <p className="text-stone-300 italic font-medium text-sm">
                                "{isAr ? 'رأيت الأحمر يدخل منزل الخباز الليلة الماضية. إنه بالتأكيد الذئب.' : "I saw Red enter the baker's house last night. He's definitely the wolf."}"
                            </p>
                        </div>
                        <div className={`relative mt-[-20px] ${isAr ? 'mr-[20px]' : 'ml-[20px]'} bg-stone-900/50 border border-stone-800 p-8 rounded-xl backdrop-blur-sm transform -rotate-1 hover:rotate-0 transition-transform duration-500 z-10`}>
                            <div className="flex items-center justify-between border-b border-stone-800 pb-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-900/20 flex items-center justify-center">
                                        <GiVillage className="text-blue-500" />
                                    </div>
                                    <span className="font-bold text-blue-500">{t.roles.villager.title}</span>
                                </div>
                            </div>
                            <p className="text-stone-300 italic font-medium text-sm">
                                "{isAr ? 'هذا بالضبط ما سيقوله الذئب. سأصوت ضد الأحمر.' : "That's exactly what a wolf would say. I'm voting Red."}"
                            </p>
                        </div>
                    </motion.div>
                </motion.div>

                {/* ROLES CAROUSEL */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="space-y-12"
                >
                    <div className="text-center space-y-4">
                        <h2 className="text-3xl md:text-4xl font-bold text-stone-200">{t.chooseFate}</h2>
                        <div className="w-20 h-1 bg-red-900/50 mx-auto rounded-full" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <RoleCard
                            icon={GiCrossedSwords}
                            color="text-amber-500"
                            bg="bg-amber-500/10"
                            border="border-amber-500/20"
                            title={t.roles.villager.title}
                            desc={t.roles.villager.desc}
                        />
                        <RoleCard
                            icon={GiBleedingEye}
                            color="text-red-500"
                            bg="bg-red-500/10"
                            border="border-red-500/20"
                            title={t.roles.werewolf.title}
                            desc={t.roles.werewolf.desc}
                        />
                        <RoleCard
                            icon={GiMagnifyingGlass}
                            color="text-indigo-400"
                            bg="bg-indigo-500/10"
                            border="border-indigo-500/20"
                            title={t.roles.seer.title}
                            desc={t.roles.seer.desc}
                        />
                        <RoleCard
                            icon={GiHealthPotion}
                            color="text-emerald-400"
                            bg="bg-emerald-500/10"
                            border="border-emerald-500/20"
                            title={t.roles.doctor.title}
                            desc={t.roles.doctor.desc}
                        />
                    </div>
                </motion.div>
            </div>

            {/* FOOTER CTA */}
            <div className="relative pt-24 pb-12 border-t border-stone-900 bg-black/40">
                <div className="relative z-10 max-w-6xl mx-auto px-6 text-center space-y-12">

                    <div className="space-y-6">
                        <GiWolfHead className="w-16 h-16 mx-auto text-stone-600 opacity-60" />
                        <h2 className="text-4xl md:text-5xl font-black text-stone-800 uppercase tracking-tighter">
                            {t.footerTitle}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-stone-500 text-sm border-t border-stone-900/50 pt-12">
                        <div className="space-y-4">
                            <h4 className="text-stone-300 font-bold uppercase tracking-widest text-xs">Game</h4>
                            <ul className="space-y-2">
                                <li className="hover:text-stone-300 cursor-pointer transition-colors">How to Play</li>
                                <li className="hover:text-stone-300 cursor-pointer transition-colors">Roles</li>
                                <li className="hover:text-stone-300 cursor-pointer transition-colors">Rankings</li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-stone-300 font-bold uppercase tracking-widest text-xs">Community</h4>
                            <ul className="space-y-2">
                                <li className="hover:text-stone-300 cursor-pointer transition-colors">{t.discord}</li>
                                <li className="hover:text-stone-300 cursor-pointer transition-colors">Twitter</li>
                                <li className="hover:text-stone-300 cursor-pointer transition-colors">GitHub</li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-stone-300 font-bold uppercase tracking-widest text-xs">Legal</h4>
                            <ul className="space-y-2">
                                <li className="hover:text-stone-300 cursor-pointer transition-colors">{t.privacy}</li>
                                <li className="hover:text-stone-300 cursor-pointer transition-colors">{t.terms}</li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-12 text-stone-700 text-xs font-mono uppercase tracking-widest">
                        © 2024 Hidden Wolf. All rights reserved.
                    </div>
                </div>
            </div>

        </div>
    );
}

function RoleCard({ icon: Icon, title, desc, color, bg, border }) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
            }}
            className={`group relative p-8 rounded-2xl ${bg} border ${border} hover:bg-opacity-20 transition-all duration-300 h-full flex flex-col`}
        >
            <div className={`mb-6 p-4 rounded-xl bg-black/20 w-fit ${color}`}>
                <Icon className="w-8 h-8" />
            </div>
            <h3 className={`text-xl font-bold mb-3 ${color} uppercase tracking-wide`}>{title}</h3>
            <p className="text-stone-400 font-sans leading-relaxed text-sm flex-grow">
                {desc}
            </p>
        </motion.div>
    );
}
