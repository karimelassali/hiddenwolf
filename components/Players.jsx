export  function Players({fetched_players}) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center">
                
                {
                    fetched_players && fetched_players.map((player) => {
                        return (
                            <div key={player.id} className="m-4 flex border border-white justiffy-between items-center p-3 gap-5 rounded-lg">
                                <img className="w-10 h-10 rounded-full" src="https://picsum.photos/200/300" alt="player profile pic" />
                                <p className="text-center">{player.name}</p>
                            </div>
                        )
                    })
                }
        </div>
    </div>
    );
}