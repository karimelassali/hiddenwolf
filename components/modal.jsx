import { X, Users, Coins, Trophy, Zap, Crown, Star } from "lucide-react";
import { useEffect, useState } from "react";

export function Modal({ prop, onClose, usage, votingData, onCloseModal }) {
  const [confetti, setConfetti] = useState([]);
  const [showContent, setShowContent] = useState(false);

  // Create confetti particles
  useEffect(() => {
    if (usage === 'coins') {
      const particles = [];
      for (let i = 0; i < 50; i++) {
        particles.push({
          id: i,
          x: Math.random() * 100,
          y: -10,
          rotation: Math.random() * 360,
          color: ['#FFD700', '#FFA500', '#FF6B35', '#F7931E', '#FFE135'][Math.floor(Math.random() * 5)],
          size: Math.random() * 8 + 4,
          speedX: (Math.random() - 0.5) * 2,
          speedY: Math.random() * 3 + 2,
          life: 100
        });
      }
      setConfetti(particles);
      
      // Animate confetti
      const animateConfetti = () => {
        setConfetti(prev => prev.map(particle => ({
          ...particle,
          x: particle.x + particle.speedX,
          y: particle.y + particle.speedY,
          rotation: particle.rotation + 5,
          life: particle.life - 1
        })).filter(particle => particle.life > 0 && particle.y < 110));
      };
      
      const interval = setInterval(animateConfetti, 50);
      return () => clearInterval(interval);
    }
  }, [usage]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onCloseModal();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCloseModal]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onCloseModal();
  };

  // Prevent body scroll and show content with delay
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    setTimeout(() => setShowContent(true), 100);
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const getModalConfig = () => {
    switch (usage) {
      case 'voting':
        return {
          title: 'VOTING RESULTS',
          subtitle: 'Community Voice',
          icon: <Crown className="w-8 h-8" />,
          gradient: 'from-purple-600 via-purple-500 to-indigo-600',
          glowColor: 'shadow-purple-500/50',
          borderGlow: 'shadow-[0_0_20px_rgba(147,51,234,0.5)]',
          accentColor: 'text-purple-300',
          bgPattern: 'bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900'
        };
      case 'coins':
        return {
          title: 'Free Coins!',
          subtitle: '',
          icon: <Coins className="w-8 h-8" />,
          gradient: 'from-violet-500 via-purple-500 to-violet-600',
          glowColor: 'shadow-purple-500/50',
          borderGlow: '',
          accentColor: 'text-yellow-300',
          bgPattern: 'bg-gradient-to-br from-slate-900 via-violet-900/20 to-slate-900'
        };
      default:
        return {
          title: 'NOTIFICATION',
          subtitle: 'System Alert',
          icon: <Zap className="w-8 h-8" />,
          gradient: 'from-cyan-500 via-blue-500 to-cyan-600',
          glowColor: 'shadow-cyan-500/50',
          borderGlow: 'shadow-[0_0_20px_rgba(6,182,212,0.5)]',
          accentColor: 'text-cyan-300',
          bgPattern: 'bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900'
        };
    }
  };

  const config = getModalConfig();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={handleBackdropClick}
    >
      {/* Confetti */}
      {usage === 'coins' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {confetti.map(particle => (
            <div
              key={particle.id}
              className="absolute rounded-full opacity-90"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                backgroundColor: particle.color,
                transform: `rotate(${particle.rotation}deg)`,
                boxShadow: `0 0 6px ${particle.color}`,
              }}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <div className={`
        relative w-full max-w-lg max-h-[85vh] 
        ${config.bgPattern}
        border border-gray-700/50 ${config.borderGlow}
        rounded-2xl overflow-hidden
        transform transition-all duration-500 ease-out
        ${showContent ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
      `}>
        
        {/* Animated border */}
        <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient} rounded-2xl opacity-20 animate-pulse`} />
        
        {/* Header */}
        <div className="relative">
          <div className={`bg-gradient-to-r ${config.gradient} p-1 rounded-t-2xl`}>
            <div className="bg-slate-900/90 rounded-t-xl p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${config.gradient} ${config.glowColor} shadow-2xl animate-pulse`}>
                  <div className="text-white">
                    {config.icon}
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-wider">{config.title}</h2>
                  <p className={`text-sm ${config.accentColor} font-medium tracking-wide`}>
                    {config.subtitle}
                  </p>
                </div>
              </div>
              {/* <button
                onClick={onCloseModal}
                className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all duration-200 hover:scale-110 border border-red-500/30"
              >
                <X className="w-6 h-6" />
              </button> */}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative p-6 max-h-[50vh] overflow-y-auto custom-scrollbar">
          {usage === 'voting' && votingData ? (
            <div className="space-y-3">
              {votingData.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 flex items-center justify-center">
                    <Users className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-400 text-lg">No votes cast yet</p>
                </div>
              ) : (
                votingData.map((vote, index) => (
                  <div
                    key={vote.id}
                    className={`
                      p-4 rounded-xl bg-gradient-to-r from-slate-800/50 to-slate-700/50 
                      border border-purple-500/20 hover:border-purple-400/40
                      transform transition-all duration-300 hover:scale-[1.02]
                      animate-in slide-in-from-left duration-300
                    `}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-white text-lg shadow-lg">
                          {vote.voted_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <Trophy className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white text-lg">
                          {vote.voted_name || 'Unknown Player'}
                        </p>
                        <p className="text-purple-300 text-sm">
                          voted for <span className="text-yellow-400 font-semibold">{vote.voter_name || 'Unknown'}</span>
                        </p>
                      </div>
                      <Star className="w-6 h-6 text-yellow-400 animate-pulse" />
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div
               className={`inline-block p-4 rounded-2xl bg-gradient-to-r ${config.gradient} ${config.glowColor} shadow-2xl mb-6 `}>
                {config.icon}
              </div>
              <p className="text-2xl text-white font-semibold  leading-relaxed mb-2">{prop}</p>
              {/* {usage === 'coins' && (
                <p className="text-yellow-400 font-bold text-lg animate-pulse">🎉 REWARD EARNED! 🎉</p>
              )} */}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative p-6 pt-4 bg-slate-900/60 border-t border-gray-700/50">
          <div className="flex justify-center gap-4">
            <button
              onClick={onCloseModal}
              className={`
                px-8 py-3 font-bold text-white rounded-xl
                bg-gradient-to-r ${config.gradient}
                hover:shadow-2xl ${config.glowColor}
                transform transition-all duration-200 
                hover:scale-105 active:scale-95
                border border-white/20
                tracking-wide text-lg
              `}
            >
              {usage === 'coins' ? 'COLLECT REWARD' : 'CONTINUE'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #8b5cf6, #06b6d4);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(45deg, #a78bfa, #22d3ee);
        }
      `}</style>
    </div>
  );
}