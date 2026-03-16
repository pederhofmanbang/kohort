// Vercel serverless function - söker PubMed E-utilities direkt
// Steg 1: esearch - hitta artiklar (PMIDs)
// Steg 2: efetch - hämta abstracts
// Steg 3: Claude - sammanfatta på svenska

const EUTILS_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query, maxResults = 5 } = req.body;
  if (!query) {
    return res.status(400).json({ error: "Missing query" });
  }

  try {
    // ===== STEG 1: Sök PubMed (esearch) =====
    const searchParams = new URLSearchParams({
      db: "pubmed",
      term: query,
      retmax: String(maxResults),
      sort: "relevance",
      retmode: "json"
    });
    // Lägg till API-nyckel om den finns (ger högre rate limit)
    if (process.env.NCBI_API_KEY) {
      searchParams.set("api_key", process.env.NCBI_API_KEY);
    }

    const searchRes = await fetch(`${EUTILS_BASE}/esearch.fcgi?${searchParams}`);
    const searchData = await searchRes.json();

    const pmids = searchData?.esearchresult?.idlist || [];
    if (pmids.length === 0) {
      return res.status(200).json({
        articles: [],
        summary: "Inga artiklar hittades på PubMed för denna sökning.",
        searchQuery: query,
        totalFound: 0
      });
    }

    const totalFound = parseInt(searchData?.esearchresult?.count || "0");

    // ===== STEG 2: Hämta abstracts (efetch) =====
    const fetchParams = new URLSearchParams({
      db: "pubmed",
      id: pmids.join(","),
      retmode: "xml",
      rettype: "abstract"
    });
    if (process.env.NCBI_API_KEY) {
      fetchParams.set("api_key", process.env.NCBI_API_KEY);
    }

    const fetchRes = await fetch(`${EUTILS_BASE}/efetch.fcgi?${fetchParams}`);
    const xmlText = await fetchRes.text();

    // Parsa XML till artikeldata (enkel regex-parser för PubMed XML)
    const articles = parseArticles(xmlText, pmids);

    // ===== STEG 3: Sammanfatta med Claude =====
    const apiKey = process.env.ANTHROPIC_API_KEY;
    let summary = "";

    // Fallback-sammanfattning (används om Claude misslyckas)
    const fallbackSummary = articles.map(function(a) {
      return a.authors + " (" + a.year + ") publicerade i " + a.journal + " en studie om " + a.title.substring(0, 100);
    }).join(". ") + ".";

    if (apiKey && articles.length > 0) {
      try {
        const articlesText = articles.map(function(a, i) {
          return (i + 1) + ". " + a.title + " (" + a.authors + ", " + a.journal + " " + a.year + ")\n"
            + (a.abstract || "Inget abstract tillgängligt.");
        }).join("\n\n");

        const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1024,
            system: "Du är en medicinsk forskare. Svara på svenska med åäö.\n\n"
              + "Sammanfatta de viktigaste fynden från artiklarna nedan. "
              + "Citera varje studie med författare och årtal. "
              + "Skriv 4-8 meningar ren löptext. Ingen markdown.",
            messages: [{ role: "user", content: articlesText }]
          })
        });

        const claudeData = await claudeRes.json();
        if (claudeData.content) {
          claudeData.content.forEach(function(b) {
            if (b.type === "text") summary += b.text;
          });
        }
        // Om Claude returnerade tomt, logga felet och använd fallback
        if (!summary) {
          console.error("Claude returned empty summary. Response:", JSON.stringify(claudeData).substring(0, 500));
          summary = fallbackSummary;
        }
      } catch (claudeError) {
        console.error("Claude summarization failed:", claudeError.message);
        summary = fallbackSummary;
      }
    } else if (articles.length > 0) {
      summary = fallbackSummary;
    }

    return res.status(200).json({
      articles: articles,
      summary: summary,
      searchQuery: query,
      totalFound: totalFound,
      pmids: pmids
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// ===== XML-parser för PubMed-artiklar =====
function parseArticles(xml, pmids) {
  var articles = [];

  // Dela upp i enskilda artiklar
  var articleChunks = xml.split("<PubmedArticle>");

  for (var i = 1; i < articleChunks.length; i++) {
    var chunk = articleChunks[i];

    var title = extractTag(chunk, "ArticleTitle") || "Utan titel";
    var abstractText = extractAllAbstract(chunk);
    var journal = extractTag(chunk, "Title") || extractTag(chunk, "ISOAbbreviation") || "";
    var year = extractTag(chunk, "Year") || "";
    var pmid = extractTag(chunk, "PMID") || (pmids[i - 1] || "");

    // Hämta författare
    var authors = [];
    var authorMatches = chunk.match(/<Author[^>]*>[\s\S]*?<\/Author>/g) || [];
    for (var j = 0; j < Math.min(authorMatches.length, 3); j++) {
      var lastName = extractTag(authorMatches[j], "LastName");
      var initials = extractTag(authorMatches[j], "Initials");
      if (lastName) authors.push(lastName + " " + (initials || ""));
    }
    if (authorMatches.length > 3) authors.push("et al.");
    var authorStr = authors.join(", ") || "Okänd författare";

    // DOI
    var doi = "";
    var doiMatch = chunk.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/);
    if (doiMatch) doi = doiMatch[1];

    articles.push({
      pmid: pmid,
      title: cleanXml(title),
      authors: authorStr,
      journal: cleanXml(journal),
      year: year,
      abstract: cleanXml(abstractText),
      doi: doi,
      url: "https://pubmed.ncbi.nlm.nih.gov/" + pmid + "/"
    });
  }

  return articles;
}

function extractTag(text, tagName) {
  var regex = new RegExp("<" + tagName + "[^>]*>([\\s\\S]*?)<\\/" + tagName + ">");
  var match = text.match(regex);
  return match ? match[1].trim() : "";
}

function extractAllAbstract(chunk) {
  // PubMed abstracts kan ha flera <AbstractText> med Label-attribut
  var parts = [];
  var regex = /<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g;
  var match;
  while ((match = regex.exec(chunk)) !== null) {
    var label = "";
    var labelMatch = match[0].match(/Label="([^"]+)"/);
    if (labelMatch) label = labelMatch[1] + ": ";
    parts.push(label + match[1].trim());
  }
  return parts.join(" ") || "";
}

function cleanXml(text) {
  return text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}
