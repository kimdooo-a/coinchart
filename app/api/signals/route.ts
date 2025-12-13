
import { NextResponse } from 'next/server';
import { scanMarket } from '@/lib/signal_engine';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const signals = await scanMarket();
        return NextResponse.json({ signals });
    } catch (error) {
        console.error('Signal Scan Error:', error);
        return NextResponse.json({ signals: [] }, { status: 500 });
    }
}
