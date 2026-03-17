// Vercel serverless function — testprotokoll CRUD via Vercel KV (Redis)
// Kräver att KV-databas är kopplad i Vercel Dashboard → Storage

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function kvGet(key) {
  var res = await fetch(KV_URL + "/get/" + key, {
    headers: { Authorization: "Bearer " + KV_TOKEN }
  });
  var data = await res.json();
  return data.result ? JSON.parse(data.result) : null;
}

async function kvSet(key, value) {
  await fetch(KV_URL, {
    method: "POST",
    headers: { Authorization: "Bearer " + KV_TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify(["SET", key, JSON.stringify(value)])
  });
}

export default async function handler(req, res) {
  if (!KV_URL || !KV_TOKEN) {
    return res.status(500).json({ error: "KV-databas ej konfigurerad. Skapa en KV Store i Vercel Dashboard → Storage och koppla till projektet." });
  }

  var KEY = "kchd:testprotokoll";

  // GET — hämta alla poster
  if (req.method === "GET") {
    var entries = await kvGet(KEY) || [];
    return res.status(200).json({ entries: entries });
  }

  // POST — spara ny post
  if (req.method === "POST") {
    var entry = req.body;
    if (!entry || !entry.question) {
      return res.status(400).json({ error: "Saknar fråga" });
    }
    var entries = await kvGet(KEY) || [];
    var newEntry = {
      id: Date.now() + "-" + Math.random().toString(36).substring(2, 8),
      timestamp: new Date().toISOString(),
      question: entry.question,
      kohort: entry.kohort || "",
      pubmed: entry.pubmed || "",
      syntes: entry.syntes || "",
      mode: entry.mode || "",
      src: entry.src || "",
      depth: entry.depth || "",
      comment: "",
      rating: null
    };
    entries.unshift(newEntry);
    await kvSet(KEY, entries);
    return res.status(200).json({ ok: true, entry: newEntry });
  }

  // PATCH — uppdatera kommentar eller betyg
  if (req.method === "PATCH") {
    var update = req.body;
    if (!update || !update.id) {
      return res.status(400).json({ error: "Saknar id" });
    }
    var entries = await kvGet(KEY) || [];
    var found = false;
    entries = entries.map(function(e) {
      if (e.id === update.id) {
        found = true;
        if (update.comment !== undefined) e.comment = update.comment;
        if (update.rating !== undefined) e.rating = update.rating;
      }
      return e;
    });
    if (!found) return res.status(404).json({ error: "Post hittades inte" });
    await kvSet(KEY, entries);
    return res.status(200).json({ ok: true });
  }

  // DELETE — ta bort en post
  if (req.method === "DELETE") {
    var del = req.body;
    if (!del || !del.id) {
      return res.status(400).json({ error: "Saknar id" });
    }
    var entries = await kvGet(KEY) || [];
    entries = entries.filter(function(e) { return e.id !== del.id; });
    await kvSet(KEY, entries);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
