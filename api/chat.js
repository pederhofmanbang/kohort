// Vercel serverless function - proxar anrop till Anthropic API
// API-nyckeln läggs in som miljövariabel ANTHROPIC_API_KEY i Vercel
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    // Validera input — tillåt bara förväntade modeller och begränsa tokens
    var body = req.body || {};
    var allowedModels = ["claude-sonnet-4-20250514", "claude-haiku-4-5-20251001"];
    if (body.model && allowedModels.indexOf(body.model) < 0) {
      return res.status(400).json({ error: "Model not allowed: " + body.model });
    }
    if (body.max_tokens && body.max_tokens > 4096) {
      body.max_tokens = 4096;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
