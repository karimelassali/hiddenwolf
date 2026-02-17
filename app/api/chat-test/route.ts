import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { message } = await req.json();

        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
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

        // Using a standard model supported by NVIDIA NIM. 
        // You might want to change 'meta/llama-3.1-405b-instruct' to another supported model if needed.
        const model = 'meta/llama-3.1-405b-instruct';

        const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: message }],
                temperature: 0.5,
                top_p: 1,
                max_tokens: 1024,
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
        const reply = data.choices[0]?.message?.content || 'No response from AI';

        return NextResponse.json({ reply });

    } catch (error) {
        console.error('Error processing chat request:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
