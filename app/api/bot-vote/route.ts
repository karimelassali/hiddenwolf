import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { role, players, context } = await req.json();

        if (!role || !players || !Array.isArray(players) || players.length === 0) {
            return NextResponse.json(
                { error: 'role and players[] are required' },
                { status: 400 }
            );
        }

        const apiKey = process.env.NVIDIA_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'NVIDIA API key not configured' },
                { status: 500 }
            );
        }

        const model = 'meta/llama-3.1-405b-instruct';
        const playerList = players.join(', ');

        let systemPrompt = `You are playing a social deduction game (Werewolf/Mafia). You are a ${role}.
The alive players are: ${playerList}.

Your task: Choose ONE player to vote to eliminate. You MUST pick from the list above.

Rules based on your role:
- If you are a WOLF: Do NOT vote for yourself. Try to blend in — vote for a villager who seems like an easy target. NEVER vote for a fellow wolf.
- If you are a SEER: If you have intel on who is the wolf, vote for them. Otherwise deduce logically.
- If you are a DOCTOR: Vote for someone you find suspicious based on behavior.
- If you are a VILLAGER: Vote based on gut feeling and group dynamics.

${context ? `Additional Context: ${context}` : ''}

RESPOND WITH ONLY THE EXACT PLAYER NAME. Nothing else. No quotes, no explanation, just the name exactly as it appears in the list.`;

        const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: systemPrompt }],
                temperature: 0.5,
                top_p: 1,
                max_tokens: 32,
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('NVIDIA API Error (bot-vote):', response.status, errorData);
            return NextResponse.json(
                { error: `NVIDIA API Error: ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        let target = data.choices[0]?.message?.content || '';
        target = target.replace(/^["']|["']$/g, '').trim();

        // Validate: must be one of the provided player names
        const match = players.find(
            (p: string) => p.toLowerCase() === target.toLowerCase()
        );

        if (match) {
            return NextResponse.json({ target: match });
        } else {
            // Fuzzy fallback: find closest match
            const fuzzy = players.find(
                (p: string) => target.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(target.toLowerCase())
            );
            return NextResponse.json({ target: fuzzy || null });
        }

    } catch (error) {
        console.error('Error in bot-vote:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
