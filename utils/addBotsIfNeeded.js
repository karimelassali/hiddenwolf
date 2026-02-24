export async function addBotsIfNeeded(roomID, botCount) {
    try {
        const response = await fetch('/api/add-bots', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ roomID, botCount }),
        });

        if (!response.ok) {
            const data = await response.json();
            console.error('Error adding bots:', data.error);
        }
    } catch (error) {
        console.error('Error calling add-bots API:', error);
    }
}
