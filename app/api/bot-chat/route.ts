import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { role, targetName, context } = await req.json();

        if (!role || !targetName) {
            return NextResponse.json(
                { error: 'Role and targetName are required' },
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

        // Construct a specific prompt for the bot
        let systemPrompt = `You are playing a social deduction game (like Werewolf/Mafia). You are a ${role}. 
    Your goal is to win with your team. 
    You are about to vote for a player named ${targetName}.
    Write a brief, casual chat message (max 20 words) to the group explaining why you are voting for them or deflecting suspicion. 
    Do NOT reveal your role unless you are a villager claiming to be good. 
    If you are a wolf, pretend to be a villager.
    If you are a seer, valid hints are allowed but be vague.
    Tone: effectively casual, maybe a bit accusatory or defensive depending on context. 
    Return ONLY the message content, no quotes.`;

        if (context) {
            systemPrompt += `\nAdditional Context: ${context}`;
        }

        const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: systemPrompt }],
                temperature: 0.7, // Slightly higher for creativity
                top_p: 1,
                max_tokens: 64, // Keep it short
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('NVIDIA API Error:', response.status, errorData);
            return NextResponse.json(
                { error: `NVIDIA API Error: ${response.status}`, details: errorData },
                { status: response.status }
            );
        }

        const data = await response.json();
        let reply = data.choices[0]?.message?.content || '';

        // Clean up quotes if present
        reply = reply.replace(/^["']|["']$/g, '').trim();

        return NextResponse.json({ reply });

    } catch (error) {
        console.error('Error processing bot chat request:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
