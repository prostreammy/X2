// api/proxy.js  (Next.js API route example - works on Vercel too)
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) return new Response('Missing url', { status: 400 });

    try {
        const response = await fetch(decodeURIComponent(url), {
            method: request.method,  // Supports GET and HEAD
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://get.perfecttv.net/',
                'Origin': 'https://get.perfecttv.net',
            },
        });

        const headers = new Headers(response.headers);
        headers.set('Access-Control-Allow-Origin', '*');
        headers.delete('set-cookie'); // Avoid issues

        return new NextResponse(response.body, {
            status: response.status,
            headers,
        });
    } catch (e) {
        return new Response('Proxy error: ' + e.message, { status: 500 });
    }
}

// Important for streaming large files
export const config = {
    api: {
        responseLimit: false,
        bodyParser: false,
    },
};
