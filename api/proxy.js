// api/proxy.js
export default async function handler(req, res) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ message: 'URL query parameter is required' });
    }

    try {
        const response = await fetch(url);

        // Check if the request was successful
        if (!response.ok) {
            // Forward the error status and message
            return res.status(response.status).send(await response.text());
        }

        // Get content type from the original response
        const contentType = response.headers.get('content-type');

        // Set headers for the proxy response
        res.setHeader('Content-Type', contentType);
        // This is the magic header that solves CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

        // Send the response body
        response.body.pipe(res);

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
