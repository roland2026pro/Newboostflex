export default async function handler(req, res) {
  // Ambil URL backend dari environment variable
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return res.status(500).json({ error: 'Backend URL not configured' });
  }

  // Ambil path setelah /api/proxy (misal /api/proxy/telegram -> path = /telegram)
  const path = req.url.replace(/^\/api\/proxy/, '');
  const targetUrl = ${backendUrl}/api${path};

  // Siapkan opsi untuk fetch
  const options = {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      // Forward Authorization jika ada (opsional)
      ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {})
    }
  };

  // Untuk method yang memiliki body, sertakan body
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    options.body = JSON.stringify(req.body);
  }

  try {
    const response = await fetch(targetUrl, options);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch from backend' });
  }
}
