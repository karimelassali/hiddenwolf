import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { roomID, botCount } = await req.json();

        if (!roomID || !botCount) {
            return NextResponse.json({ error: 'Missing roomID or botCount' }, { status: 400 });
        }

        const bots = [];
        for (let i = 0; i < botCount; i++) {
            const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${faker.person.firstName()}`;

            bots.push({
                room_id: roomID,
                name: faker.person.firstName(),
                role: null,
                is_alive: true,
                voted_to: null,
                player_id: uuidv4(),
                is_human: false,
                profile: avatarUrl,
            })
        }

        const { error } = await supabase.from('players').insert(bots);
        if (error) {
            console.error('Error adding bots:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
