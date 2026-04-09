export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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
      const clean = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
      try {
        const parsed = JSON.parse(clean);
        return res.status(200).json({ parsed: parsed });
      } catch(e) {
        return res.status(200).json({ raw: raw, parseError: e.message });
      }
    }
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Request failed', detail: error.message });
  }
}
