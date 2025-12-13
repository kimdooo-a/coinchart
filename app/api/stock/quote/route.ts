
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    const apiKey = process.env.TWELVEDATA_API_KEY;

    if (!apiKey) {
        console.error('TWELVEDATA_API_KEY is not set');
        // Return a 500 but obscure the reason for security or just say config error
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        const res = await fetch(
            `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${apiKey}`,
            { next: { revalidate: 60 } } // Cache for 60 seconds
        );

        const data = await res.json();

        if (data.status === 'error') {
            // Pass through the error but maybe log it
            console.error('Twelve Data Error:', data.message);
            return NextResponse.json(data, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Stock Quote Proxy Error:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
