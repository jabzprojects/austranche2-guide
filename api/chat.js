const APP_TOKEN = '47a88f17e3a9dd663c22a8f33b168bb77bffd8dd9c164c34';
const MAX_MESSAGES = 20;
const MAX_BODY_CHARS = 8000;

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate secret token
  const token = req.headers['x-app-token'];
  if (!token || token !== APP_TOKEN) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  // Validate body size
  const bodyStr = JSON.stringify(req.body);
  if (bodyStr.length > MAX_BODY_CHARS) {
    return res.status(400).json({ error: 'Request too large' });
  }

  // Validate message count
  const messages = req.body && req.body.messages;
  if (!Array.isArray(messages) || messages.length > MAX_MESSAGES) {
    return res.status(400).json({ error: 'Too many messages' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();

    if (data.content && data.content[0] && data.content[0].text) {
      const raw = data.content[0].text;
      const clean = raw
        .replace(/^\s*```json\s*/i, '')
        .replace(/^\s*```\s*/i, '')
        .replace(/\s*```\s*$/i, '')
        .trim();
      try {
        const parsed = JSON.parse(clean);
        return res.status(200).json({ parsed });
      } catch(e) {
        return res.status(200).json({ raw });
      }
    }

    return res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Request failed', detail: error.message });
  }
}
