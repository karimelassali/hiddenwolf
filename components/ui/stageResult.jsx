import Image from "next/image";

export default function StageResult({ result, players, status }) {
  return (
    <div className="flex  fixed w-full h-full bottom-0 left-0 bg-red-800 justify-center flex-col items-center gap-4">
      <h2 className="text-4xl font-bold">
        Wolf Killed
      </h2>
      <Image
        src={`/assets/images/wolf.png`}
        alt={result}
        width={200}
        height={200}
      />
      <ul className="flex flex-col gap-2">
        {status ? result : "You died by the wolf"}
          {
            players.filter(p => !p.is_alive ).map((player) => (
              <li className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary" />
                {player.name}
              </li>
            ))
          }
      </ul>
    </div>
  );
}
