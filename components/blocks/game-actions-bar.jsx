export default function GameActionsBar({roomId,roomInfo,playerInfo}) {
    return (
        <div className="flex items-center justify-between gap-5 bg-purple-600 p-5">
            {playerInfo && (
                playerInfo['role'] === 'wolf' ? (
                    <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Kill player
                    </button>
                ) : playerInfo['role'] === 'doctor' ? (
                    <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Save player
                    </button>
                ) : playerInfo['role'] === 'seer' ? (
                    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        See player
                    </button>
                ) : playerInfo['role'] === 'villager' ? (
                    <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Do nothing
                    </button>
                ) : (
                    <></>
                )
            )}
            

        </div>
    )
}
