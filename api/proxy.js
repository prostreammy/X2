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
        // This User-Agent is required by the new stream server
        const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36';
        const headers = { 'User-Agent': userAgent };

        const targetUrl = decodeURIComponent(url);
        const response = await fetch(targetUrl, { headers });

        if (!response.ok) {
            console.error(`Target server responded with status: ${response.status} ${response.statusText}`);
            return res.status(response.status).send(`Error from target server: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');

        // If it's the manifest (XML), we need to rewrite it
        if (contentType && contentType.includes('application/dash+xml')) {
            const manifestText = await response.text();
            const origin = new URL(targetUrl).origin;

            // Rewrite all relative URLs to go through our proxy
            // This regex finds <BaseURL>...</BaseURL> and prepends our proxy URL
            const modifiedManifest = manifestText.replace(
                /<BaseURL>(.*?)<\/BaseURL>/g,
                (match, p1) => {
                    // Ensure the path doesn't start with a slash to avoid double slashes
                    const relativePath = p1.startsWith('/') ? p1.substring(1) : p1;
                    const absolutePath = `${origin}/${relativePath}`;
                    const proxiedUrl = `/api/proxy?url=${encodeURIComponent(absolutePath)}`;
                    return `<BaseURL>${proxiedUrl}</BaseURL>`;
                }
            );

            res.setHeader('Content-Type', 'application/dash+xml');
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.send(modifiedManifest);
        }

        // For all other requests (like video/audio segments), just pipe the data
        res.setHeader('Content-Type', contentType);
        res.setHeader('Access-Control-Allow-Origin', '*');
        response.body.pipe(res);

    } catch (error) {
        console.error('Proxy function failed:', error);
        res.status(500).json({ message: 'Internal Server Error in proxy', details: error.message });
    }
}
