// Frontend API-anropsfunktioner

var VIZ_INSTRUCTION = "\n\nVIKTIGT \u2014 VISUALISERINGAR:\n"
  + "Du har ALDRIG till\u00E5telse att skriva markdown-tabeller (|kolumn|) eller markdown-diagram i texten. "
  + "All tabul\u00E4r eller grafisk data M\u00C5STE returneras som ett VIZ-block som renderas i en separat visualiseringspanel.\n\n"
  + "N\u00E4r anv\u00E4ndaren ber om en tabell, diagram, j\u00E4mf\u00F6relse, \u00F6versikt eller liknande \u2014 eller n\u00E4r ditt svar naturligt skulle inneh\u00E5lla tabul\u00E4r data \u2014 "
  + "returnera ett VIZ-block EFTER din l\u00F6ptext.\n"
  + "Format: <<<VIZ>>> { JSON } <<<END>>>\n\n"
  + "St\u00F6dda typer:\n"
  + '1. Tabell: {"vizType":"table","title":"Titel","columns":["Kol1","Kol2"],"rows":[["v1","v2"],["v3","v4"]]}\n'
  + '2. Stapeldiagram: {"vizType":"bar","title":"Titel","data":[{"name":"A","value":10},{"name":"B","value":20}]}\n'
  + '3. Cirkeldiagram: {"vizType":"pie","title":"Titel","data":[{"name":"A","value":60},{"name":"B","value":40}]}\n'
  + '4. Grupperat stapeldiagram: {"vizType":"grouped_bar","title":"Titel","categories":["A","B"],"series":[{"name":"S1","data":[10,20]},{"name":"S2","data":[15,25]}]}\n'
  + '5. Linjediagram: {"vizType":"line","title":"Titel","data":[{"name":"2020","value":10},{"name":"2021","value":15}]}\n\n'
  + "Skapa data baserat p\u00E5 kohorten. Du kan inkludera flera VIZ-block i samma svar.\n"
  + "VIKTIGT: VIZ-blocket ska inneh\u00E5lla giltig JSON. Inga kommentarer i JSON. Inga markdown-tabeller i l\u00F6ptexten.";

var PUBMED_KEYWORDS = {
  "hba1c": "HbA1c glycated hemoglobin",
  "adt": "androgen deprivation therapy",
  "hormon": "androgen deprivation therapy hormonal",
  "psa": "prostate-specific antigen PSA",
  "ralp": "robot-assisted laparoscopic prostatectomy",
  "str\u00E5l": "radiotherapy radiation prostate",
  "operation": "prostatectomy surgical",
  "diabetes": "diabetes mellitus insulin",
  "metformin": "metformin prostate cancer",
  "hj\u00E4rt": "cardiovascular prostate cancer",
  "k\u00E4rl": "cardiovascular prostate cancer",
  "komorbid": "comorbidity prostate cancer diabetes",
  "njur": "renal function eGFR prostate cancer",
  "gleason": "Gleason score prostate cancer",
  "biokemisk": "biochemical recurrence prostate cancer",
  "recidiv": "recurrence prostate cancer",
  "utfall": "outcomes prostate cancer treatment",
  "risk": "risk stratification prostate cancer",
  "insulin": "insulin diabetes prostate cancer"
};

function cleanMd(r) {
  if (!r) return "";
  return r.replace(/\*\*\*/g,"").replace(/\*\*([^*]+)\*\*/g,"$1").replace(/\*([^*]+)\*/g,"$1")
    .replace(/^#{1,4}\s*/gm,"").replace(/`([^`]+)`/g,"$1").replace(/\n{3,}/g,"\n\n").trim();
}

function parseVizBlocks(text) {
  var vizzes = [];
  var re = /<<<VIZ>>>\s*([\s\S]*?)\s*<<<END>>>/g;
  var match;
  while ((match = re.exec(text)) !== null) {
    try {
      var parsed = JSON.parse(match[1]);
      if (parsed.vizType) {
        if (parsed.vizType !== "table") {
          parsed.chartType = parsed.vizType;
        }
        vizzes.push(parsed);
      }
    } catch (e) {
      // Ogiltigt JSON
    }
  }
  var clean = text.replace(/<<<VIZ>>>\s*[\s\S]*?\s*<<<END>>>/g, "").trim();
  return { text: clean, vizzes: vizzes };
}

function buildPubmedQuery(question) {
  var q = question.toLowerCase();
  var matched = [];
  for (var kw in PUBMED_KEYWORDS) {
    if (q.indexOf(kw) >= 0) {
      matched.push(PUBMED_KEYWORDS[kw]);
    }
  }
  var base = "(prostate cancer) AND (diabetes)";
  if (matched.length > 0) {
    var seen = {};
    var unique = [];
    matched.forEach(function(m) {
      if (!seen[m]) { seen[m] = true; unique.push("(" + m + ")"); }
    });
    base += " AND (" + unique.join(" OR ") + ")";
  }
  return base;
}

function apiCall(sysPrompt, userMsg, signal) {
  var body = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: sysPrompt,
    messages: [{ role: "user", content: userMsg }]
  };
  return fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: signal,
    body: JSON.stringify(body)
  }).then(function(r) {
    if (!r.ok) return r.text().then(function(t) { throw new Error("API " + r.status + ": " + t.substring(0, 200)); });
    return r.json();
  }).then(function(d) {
    if (d.error) throw new Error(d.error.message || d.error);
    var text = "";
    if (d.content) d.content.forEach(function(b) { if (b.type === "text") text += b.text; });
    if (!text) throw new Error("Tomt svar fr\u00E5n API");
    var parsed = parseVizBlocks(text);
    return { text: cleanMd(parsed.text), vizzes: parsed.vizzes };
  });
}

function kohortDbCall(userMsg, wantViz, signal) {
  var vizInstr = wantViz ? VIZ_INSTRUCTION : "";
  return fetch("/api/cohort-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: signal,
    body: JSON.stringify({ message: userMsg, vizInstruction: vizInstr })
  }).then(function(r) {
    if (!r.ok) return r.text().then(function(t) { throw new Error("API " + r.status + ": " + t.substring(0, 200)); });
    return r.json();
  }).then(function(d) {
    if (d.error) throw new Error(d.error.message || d.error);
    var text = "";
    if (d.content) d.content.forEach(function(b) { if (b.type === "text") text += b.text; });
    if (!text) throw new Error("Tomt svar fr\u00E5n API");
    var parsed = parseVizBlocks(text);
    return { text: cleanMd(parsed.text), vizzes: parsed.vizzes, toolTrace: d.tool_trace || [] };
  });
}

function pubmedCall(question, signal) {
  var searchQuery = buildPubmedQuery(question);
  return fetch("/api/pubmed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: signal,
    body: JSON.stringify({ query: searchQuery, maxResults: 8, userQuestion: question })
  }).then(function(r) {
    if (!r.ok) return r.text().then(function(t) { throw new Error("PubMed API " + r.status + ": " + t.substring(0, 200)); });
    return r.json();
  }).then(function(data) {
    if (data.error) throw new Error(data.error);
    return {
      summary: data.summary || "Inga artiklar hittades.",
      articles: data.articles || [],
      totalFound: data.totalFound || 0,
      searchQuery: data.searchQuery || searchQuery
    };
  });
}

function buildSyntesPrompt(kohortText, pubmedText, userQuestion) {
  return "Du \u00E4r en klinisk r\u00E5dgivare. Svara p\u00E5 svenska med \u00E5\u00E4\u00F6.\n\n"
    + "ANV\u00C4NDARENS FR\u00C5GA: " + (userQuestion || "") + "\n\n"
    + "Nedan finns tv\u00E5 analyser \u2014 en baserad p\u00E5 lokal kohortdata och en p\u00E5 publicerad PubMed-evidens.\n\n"
    + "KOHORTANALYS:\n" + kohortText + "\n\n"
    + "PUBMED-EVIDENS:\n" + pubmedText + "\n\n"
    + "Besvara anv\u00E4ndarens fr\u00E5ga genom att v\u00E4ga samman dessa. Ge en sammanv\u00E4gd klinisk bed\u00F6mning med konkreta rekommendationer.\n"
    + "Notera om kohortfynden st\u00E4mmer med eller avviker fr\u00E5n publicerad forskning.\n"
    + "Skriv 4-8 meningar ren l\u00F6ptext. Ingen markdown. Inga taggar."
    + VIZ_INSTRUCTION;
}

function matchChart(question, CHARTS_DB) {
  var q = question.toLowerCase();
  var rules = [
    [["hba1c","hba"], "hba1c"],
    [["metformin"], "metformin"],
    [["gleason","isup"], "gleason"],
    [["njur","egfr","kreatinin"], "njurfunktion"],
    [["hj\u00E4rt","k\u00E4rl","kardio"], "hjart"],
    [["komorbid","samsjuklighet"], "komorbiditet"],
    [["ralp","prostatektomi","kirurgi"], "ralp_vs_stral"],
    [["str\u00E5l","ebrt"], "ralp_vs_stral"],
    [["psa","psa-respons","tum\u00F6rmark\u00F6r"], "psa"],
    [["adt","hormon","antiandrogen","metabol"], "hba1c"],
    [["recidiv","biokemisk"], "utfall"],
    [["riskgrupp"], "riskgrupp"],
    [["diabetes","typ 1","typ 2","dm","insulin"], "diabetes"],
    [["l\u00E4kemedel","medicinering","farmak"], "lakemedel"],
    [["\u00E5lder","demographics"], "alder"],
    [["utfall","resultat","prognos"], "utfall"],
    [["behandling","terapi","operation"], "behandling"],
    [["risk"], "riskgrupp"],
    [["sammans\u00E4ttning","\u00F6versikt"], "sammansattning"],
  ];
  for (var i = 0; i < rules.length; i++) {
    for (var j = 0; j < rules[i][0].length; j++) {
      if (q.indexOf(rules[i][0][j]) >= 0) return CHARTS_DB[rules[i][1]] || null;
    }
  }
  return CHARTS_DB["sammansattning"];
}

export { VIZ_INSTRUCTION, apiCall, kohortDbCall, pubmedCall, buildSyntesPrompt, matchChart };
