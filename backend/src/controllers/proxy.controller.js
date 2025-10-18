export const proxyImage = async (req, res, next) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Validate URL is from our S3 bucket
    if (!url.includes('stashu-app-files.s3.') && !url.includes('cloudfront.net')) {
      return res.status(403).json({ error: 'Invalid image URL' });
    }

    // Fetch the image using native fetch (Node 18+)
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch image' });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Set CORS headers (comprehensive for image loading)
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Expose-Headers', 'Content-Type, Content-Length');
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=31536000');

    res.send(buffer);
  } catch (error) {
    next(error);
  }
};
