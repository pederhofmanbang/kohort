// Vercel serverless function — PubMed-landskapsdata
const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

function addKey(params) {
  if (process.env.NCBI_API_KEY) params.set("api_key", process.env.NCBI_API_KEY);
  return params;
}

async function searchCount(query) {
  var params = addKey(new URLSearchParams({
    db: "pubmed", term: query, rettype: "count", retmode: "json"
  }));
  var res = await fetch(EUTILS + "/esearch.fcgi?" + params);
  var data = await res.json();
  return parseInt(data?.esearchresult?.count || "0");
}

async function searchCountByYear(query, year) {
  var params = addKey(new URLSearchParams({
    db: "pubmed", term: query,
    rettype: "count", retmode: "json",
    datetype: "pdat",
    mindate: String(year),
    maxdate: String(year)
  }));
  var res = await fetch(EUTILS + "/esearch.fcgi?" + params);
  var data = await res.json();
  return parseInt(data?.esearchresult?.count || "0");
}

async function searchIds(query, max) {
  var params = addKey(new URLSearchParams({
    db: "pubmed", term: query, retmax: String(max || 200),
    sort: "relevance", retmode: "json"
  }));
  var res = await fetch(EUTILS + "/esearch.fcgi?" + params);
  var data = await res.json();
  return data?.esearchresult?.idlist || [];
}

async function fetchSummaries(pmids) {
  if (!pmids.length) return [];
  var params = addKey(new URLSearchParams({
    db: "pubmed", id: pmids.join(","), retmode: "json"
  }));
  var res = await fetch(EUTILS + "/esummary.fcgi?" + params);
  var data = await res.json();
  var result = data?.result || {};
  return pmids.map(function(id) { return result[id] || null; }).filter(Boolean);
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // ===== 1. FORSKNINGSVOLYM — PubMed-optimerade söksträngar =====
    var topics = [
      { label: "Prostatacancer + diabetes", q: '"prostatic neoplasms"[MeSH] AND "diabetes mellitus"[MeSH]' },
      { label: "Metformin + prostatacancer", q: 'metformin[MeSH] AND "prostatic neoplasms"[MeSH]' },
      { label: "ADT + metabola effekter", q: '"androgen antagonists"[MeSH] AND (diabetes OR "metabolic syndrome" OR hyperglycemia)' },
      { label: "Kardiovaskulär + prostatacancer", q: '"prostatic neoplasms"[MeSH] AND "cardiovascular diseases"[MeSH] AND diabetes' },
      { label: "Insulinresistens + prostatacancer", q: '"insulin resistance"[MeSH] AND "prostatic neoplasms"[MeSH]' },
      { label: "Prostatektomi + diabetes", q: '"prostatectomy"[MeSH] AND "diabetes mellitus"[MeSH]' },
      { label: "Strålbehandling + diabetes", q: '"radiotherapy"[MeSH] AND "prostatic neoplasms"[MeSH] AND diabetes' },
      { label: "PSA + diabetes", q: '"prostate-specific antigen"[MeSH] AND "diabetes mellitus"[MeSH]' },
      { label: "Aktiv övervakning + prostatacancer", q: '"watchful waiting"[MeSH] AND "prostatic neoplasms"[MeSH] AND diabetes' },
      { label: "Gleason + diabetes", q: '"Neoplasm Grading"[MeSH] AND "prostatic neoplasms"[MeSH] AND diabetes' }
    ];

    var volumePromises = topics.map(function(t) {
      return searchCount(t.q).then(function(c) { return { label: t.label, count: c }; });
    });

    // ===== 2. PUBLICERINGSTREND — MeSH-baserad sökning per år =====
    var baseQ = '"prostatic neoplasms"[MeSH] AND "diabetes mellitus"[MeSH]';
    var currentYear = new Date().getFullYear();
    var years = [];
    for (var y = currentYear - 14; y <= currentYear; y++) years.push(y);

    var trendPromises = years.map(function(yr) {
      return searchCountByYear(baseQ, yr).then(function(c) { return { year: yr, count: c }; });
    });

    // ===== 3. EVIDENSNIVÅ — publication type filters =====
    var evidenceTypes = [
      { label: "Randomiserade studier (RCT)", q: baseQ + ' AND "randomized controlled trial"[pt]' },
      { label: "Systematiska översikter", q: baseQ + ' AND "systematic review"[pt]' },
      { label: "Meta-analyser", q: baseQ + ' AND "meta-analysis"[pt]' },
      { label: "Kohortstudier", q: baseQ + ' AND "observational study"[pt]' },
      { label: "Fallrapporter", q: baseQ + ' AND "case reports"[pt]' },
      { label: "Översiktsartiklar", q: baseQ + ' AND "review"[pt]' }
    ];

    var evidencePromises = evidenceTypes.map(function(e) {
      return searchCount(e.q).then(function(c) { return { label: e.label, count: c }; });
    });

    // ===== 4. TOPP-TIDSKRIFTER =====
    var journalPromise = searchIds(baseQ, 200).then(function(ids) {
      if (!ids.length) return [];
      var batches = [];
      for (var i = 0; i < ids.length; i += 100) batches.push(ids.slice(i, i + 100));
      return Promise.all(batches.map(fetchSummaries)).then(function(results) {
        var all = results.flat();
        var journals = {};
        all.forEach(function(a) {
          var j = a.fulljournalname || a.source || "Unknown";
          journals[j] = (journals[j] || 0) + 1;
        });
        return Object.entries(journals)
          .sort(function(a, b) { return b[1] - a[1]; })
          .slice(0, 15)
          .map(function(e) { return { journal: e[0], count: e[1] }; });
      });
    });

    var results = await Promise.all([
      Promise.all(volumePromises),
      Promise.all(trendPromises),
      Promise.all(evidencePromises),
      journalPromise
    ]);

    return res.status(200).json({
      volume: results[0].sort(function(a, b) { return b.count - a.count; }),
      trend: results[1].sort(function(a, b) { return a.year - b.year; }),
      evidence: results[2].filter(function(e) { return e.count > 0; }).sort(function(a, b) { return b.count - a.count; }),
      journals: results[3],
      meta: {
        baseQuery: baseQ,
        fetchedAt: new Date().toISOString(),
        yearsRange: years[0] + "-" + years[years.length - 1]
      }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
