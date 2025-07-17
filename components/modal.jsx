export function Modal({prop,onClose,usage,votingData,onCloseModal}){
    return (
        <>
        {
            usage === 'voting' && (
                <div className="fixed z-50 inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                    {
                        votingData && votingData.map(vote=>{
                            <div key={vote.id} className="bg-white rounded-md p-4">
                                <p className="text-lg">{vote.voted_name} voted for {vote.voter_name}</p>
                                <button className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-md" onClick={onCloseModal}>Close</button>
                            </div>
                        })
                    }
                </div>
            )
        }
        <div className="fixed z-50 inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white rounded-md p-4">
                <p className="text-lg">{prop}</p>
                <button className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-md" onClick={onCloseModal}>Close</button>
            </div>
        </div>

       </>
    )
}


