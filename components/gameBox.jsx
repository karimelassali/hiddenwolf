import { useState, useEffect } from "react";
import { RolesModal } from "@/components/ui/rolesModal";
import Image from "next/image";

export default function GameBox({ roomData, players, currentPlayerId }) {
  const [role_preview, setRole_preview] = useState(false);
  const [positions, setPositions] = useState({});

  const dayBackground = 'http://localhost:3000/assets/images/day.png';
  const nightBackground = 'http://localhost:3000/assets/images/night.png';

  // Initialize or update player positions
  useEffect(() => {
    const initialPositions = {};
    players.forEach(player => {
      if (!positions[player.id]) {
        // Start players at random positions in the bottom half
        initialPositions[player.id] = {
          x: Math.random() * 80, // 0-80% of container width
          y: 50 + Math.random() * 40 // 50-90% of container height (bottom half)
        };
      } else {
        initialPositions[player.id] = positions[player.id];
      }
    });
    setPositions(initialPositions);
  }, [players.length]);

  // Handle random movement during night
  useEffect(() => {
    if (roomData.stage !== 'night') return;

    const interval = setInterval(() => {
      setPositions(prevPositions => {
        const newPositions = {};
        players.forEach(player => {
          const currentPos = prevPositions[player.id] || { x: 50, y: 75 };
          
          // Small random movement (constrained to bottom half)
          newPositions[player.id] = {
            x: Math.max(0, Math.min(80, currentPos.x + (Math.random() * 6 - 3))),
            y: Math.max(50, Math.min(90, currentPos.y + (Math.random() * 4 - 2)))
          };
        });
        return newPositions;
      });
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [roomData.stage, players]);

  return (
    <section className="w-full  px-4 relative">
      <div
        style={{
          backgroundImage: `url(${roomData.stage === 'night' ? nightBackground : dayBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
        className="h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative overflow-hidden"
      >
        {/* Stage indicator - covers bottom half to constrain player movement */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 bottom-0 left-0 right-0 bg-opacity-0"></div>
        </div>


        {players.filter(player => player.is_alive).map(player => (
          <div
            key={player.id}
            className={`absolute transition-all duration-1000 ease-in-out rounded-lg h-20 p-2 shadow-md `}
            style={{
              left: `${positions[player.id]?.x || 50}%`,
              top: `${positions[player.id]?.y || 75}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <img
              src={player.profile}
              alt={player.name}
              width={100}
              height={100}
              className="w-20 h-20 rounded-full"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-center items-center">
        {role_preview && roomData.roles_assigned && players.find(player => player.player_id === currentPlayerId) && (
          <RolesModal role={players.find(player => player.player_id === currentPlayerId)?.role} />
        )}
        {roomData.roles_assigned && setTimeout(() => {
          setRole_preview(false);
        }, 5000)}
      </div>

    </section>
  );
}