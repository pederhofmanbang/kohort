// Vercel serverless function — hämtar PubMed-landskapsdata
// Alla anrop parallella för snabbhet

const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

async function searchCount(query, extra) {
  var params = new URLSearchParams({
    db: "pubmed", term: query, rettype: "count", retmode: "json"
  });
  if (extra) Object.entries(extra).forEach(function(e) { params.set(e[0], e[1]); });
  if (process.env.NCBI_API_KEY) params.set("api_key", process.env.NCBI_API_KEY);
  var res = await fetch(EUTILS + "/esearch.fcgi?" + params);
  var data = await res.json();
  return parseInt(data?.esearchresult?.count || "0");
}

async function searchIds(query, max) {
  var params = new URLSearchParams({
    db: "pubmed", term: query, retmax: String(max || 100), sort: "relevance", retmode: "json"
  });
  if (process.env.NCBI_API_KEY) params.set("api_key", process.env.NCBI_API_KEY);
  var res = await fetch(EUTILS + "/esearch.fcgi?" + params);
  var data = await res.json();
  return data?.esearchresult?.idlist || [];
}

async function fetchSummaries(pmids) {
  if (!pmids.length) return [];
  var params = new URLSearchParams({
    db: "pubmed", id: pmids.join(","), retmode: "json"
  });
  if (process.env.NCBI_API_KEY) params.set("api_key", process.env.NCBI_API_KEY);
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
    var baseQuery = "prostate cancer diabetes";

    // ===== 1. FORSKNINGSVOLYM PER DELÄMNE (parallella count-sökningar) =====
    var topics = [
      { label: "Prostatacancer + diabetes (totalt)", query: "prostate cancer diabetes" },
      { label: "ADT + metabola effekter", query: "androgen deprivation therapy metabolic diabetes HbA1c" },
      { label: "Metformin + prostatacancer", query: "metformin prostate cancer" },
      { label: "Kardiovaskulär risk + prostatacancer", query: "cardiovascular risk prostate cancer diabetes" },
      { label: "RALP/prostatektomi + diabetes", query: "prostatectomy diabetes outcomes" },
      { label: "PSA-monitorering + diabetes", query: "PSA monitoring diabetes prostate" },
      { label: "Njurfunktion + cancerbehandling", query: "renal function cancer treatment diabetes" },
      { label: "Strålbehandling + diabetes", query: "radiotherapy prostate cancer diabetes" },
      { label: "Aktiv övervakning + diabetes", query: "active surveillance prostate cancer diabetes" },
      { label: "Insulinresistens + cancer", query: "insulin resistance prostate cancer" }
    ];

    var volumePromises = topics.map(function(t) {
      return searchCount(t.query).then(function(c) { return { label: t.label, count: c }; });
    });

    // ===== 2. PUBLICERINGSTREND (artiklar per år, senaste 15 åren) =====
    var currentYear = new Date().getFullYear();
    var years = [];
    for (var y = currentYear - 14; y <= currentYear; y++) years.push(y);

    var trendPromises = years.map(function(yr) {
      return searchCount(baseQuery, {
        mindate: yr + "/01/01",
        maxdate: yr + "/12/31",
        datetype: "pdat"
      }).then(function(c) { return { year: yr, count: c }; });
    });

    // ===== 3. EVIDENSNIVÅ (artikeltyper) =====
    var evidenceTypes = [
      { label: "Randomiserade studier (RCT)", query: baseQuery + " AND Randomized Controlled Trial[pt]" },
      { label: "Systematiska översikter", query: baseQuery + " AND Systematic Review[pt]" },
      { label: "Meta-analyser", query: baseQuery + " AND Meta-Analysis[pt]" },
      { label: "Kohortstudier", query: baseQuery + " AND Observational Study[pt]" },
      { label: "Fallrapporter", query: baseQuery + " AND Case Reports[pt]" },
      { label: "Översiktsartiklar", query: baseQuery + " AND Review[pt]" }
    ];

    var evidencePromises = evidenceTypes.map(function(e) {
      return searchCount(e.query).then(function(c) { return { label: e.label, count: c }; });
    });

    // ===== 4. TOPP-TIDSKRIFTER (hämta 200 artiklar, räkna tidskrifter) =====
    var journalPromise = searchIds(baseQuery, 200).then(function(ids) {
      if (!ids.length) return [];
      // Split into batches of 100
      var batches = [];
      for (var i = 0; i < ids.length; i += 100) {
        batches.push(ids.slice(i, i + 100));
      }
      return Promise.all(batches.map(fetchSummaries)).then(function(results) {
        var all = results.flat();
        var journals = {};
        all.forEach(function(a) {
          var j = a.fulljournalname || a.source || "Okänd";
          journals[j] = (journals[j] || 0) + 1;
        });
        return Object.entries(journals)
          .sort(function(a, b) { return b[1] - a[1]; })
          .slice(0, 15)
          .map(function(e) { return { journal: e[0], count: e[1] }; });
      });
    });

    // Kör allt parallellt
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
        baseQuery: baseQuery,
        fetchedAt: new Date().toISOString(),
        yearsRange: years[0] + "-" + years[years.length - 1]
      }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
