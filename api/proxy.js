// api/proxy.js
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { url } = req.query;
    if (!url) {
        return res.status(400).json({ message: 'URL query parameter is required' });
    }

    try {
        const targetUrl = decodeURIComponent(url);

        // This User-Agent is required by the stream server
        const headers = {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'
        };

        const response = await fetch(targetUrl, { headers });

        if (!response.ok) {
            console.error(`Target server responded with status: ${response.status} ${response.statusText} for URL: ${targetUrl}`);
            return res.status(response.status).send(`Error from target server: ${response.statusText}`);
        }

        // Get content type and other relevant headers from the original response
        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');

        // Set headers for the proxy response
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }
        if (contentLength) {
            res.setHeader('Content-Length', contentLength);
        }
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

        // Send the response body directly
        response.body.pipe(res);

    } catch (error) {
        console.error('Proxy function failed:', error);
        res.status(500).json({ message: 'Internal Server Error in proxy', details: error.message });
    }
}
