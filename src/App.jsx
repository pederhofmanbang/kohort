import { useState, useRef, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { PATIENTS, COHORT, CHARTS_DB } from "./cohortData.js";

// ========== AI-GENERERADE VISUALISERINGAR (instruktion) ==========
var VIZ_INSTRUCTION = "\n\nVIKTIGT — VISUALISERINGAR:\n"
  + "Du har ALDRIG tillåtelse att skriva markdown-tabeller (|kolumn|) eller markdown-diagram i texten. "
  + "All tabulär eller grafisk data MÅSTE returneras som ett VIZ-block som renderas i en separat visualiseringspanel.\n\n"
  + "När användaren ber om en tabell, diagram, jämförelse, översikt eller liknande — eller när ditt svar naturligt skulle innehålla tabulär data — "
  + "returnera ett VIZ-block EFTER din löptext.\n"
  + "Format: <<<VIZ>>> { JSON } <<<END>>>\n\n"
  + "Stödda typer:\n"
  + '1. Tabell: {"vizType":"table","title":"Titel","columns":["Kol1","Kol2"],"rows":[["v1","v2"],["v3","v4"]]}\n'
  + '2. Stapeldiagram: {"vizType":"bar","title":"Titel","data":[{"name":"A","value":10},{"name":"B","value":20}]}\n'
  + '3. Cirkeldiagram: {"vizType":"pie","title":"Titel","data":[{"name":"A","value":60},{"name":"B","value":40}]}\n'
  + '4. Grupperat stapeldiagram: {"vizType":"grouped_bar","title":"Titel","categories":["A","B"],"series":[{"name":"S1","data":[10,20]},{"name":"S2","data":[15,25]}]}\n'
  + '5. Linjediagram: {"vizType":"line","title":"Titel","data":[{"name":"2020","value":10},{"name":"2021","value":15}]}\n\n'
  + "Skapa data baserat på kohorten. Du kan inkludera flera VIZ-block i samma svar.\n"
  + "VIKTIGT: VIZ-blocket ska innehålla giltig JSON. Inga kommentarer i JSON. Inga markdown-tabeller i löptexten.";

// PubMed-sökning bygger en MeSH-liknande query från användarens fråga
var PUBMED_KEYWORDS = {
  "hba1c": "HbA1c glycated hemoglobin",
  "adt": "androgen deprivation therapy",
  "hormon": "androgen deprivation therapy hormonal",
  "psa": "prostate-specific antigen PSA",
  "ralp": "robot-assisted laparoscopic prostatectomy",
  "strål": "radiotherapy radiation prostate",
  "operation": "prostatectomy surgical",
  "diabetes": "diabetes mellitus insulin",
  "metformin": "metformin prostate cancer",
  "hjärt": "cardiovascular prostate cancer",
  "kärl": "cardiovascular prostate cancer",
  "komorbid": "comorbidity prostate cancer diabetes",
  "njur": "renal function eGFR prostate cancer",
  "gleason": "Gleason score prostate cancer",
  "biokemisk": "biochemical recurrence prostate cancer",
  "recidiv": "recurrence prostate cancer",
  "utfall": "outcomes prostate cancer treatment",
  "risk": "risk stratification prostate cancer",
  "insulin": "insulin diabetes prostate cancer"
};

function buildPubmedQuery(question) {
  var q = question.toLowerCase();
  var matched = [];
  for (var kw in PUBMED_KEYWORDS) {
    if (q.indexOf(kw) >= 0) {
      matched.push(PUBMED_KEYWORDS[kw]);
    }
  }
  // Bygg strukturerad PubMed-query med AND/OR
  var base = "(prostate cancer) AND (diabetes)";
  if (matched.length > 0) {
    // Unika termer, undvik dubbletter
    var seen = {};
    var unique = [];
    matched.forEach(function(m) {
      if (!seen[m]) { seen[m] = true; unique.push("(" + m + ")"); }
    });
    base += " AND (" + unique.join(" OR ") + ")";
  }
  return base;
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
  return "Du är en klinisk rådgivare. Svara på svenska med åäö.\n\n"
    + "ANVÄNDARENS FRÅGA: " + (userQuestion || "") + "\n\n"
    + "Nedan finns två analyser — en baserad på lokal kohortdata och en på publicerad PubMed-evidens.\n\n"
    + "KOHORTANALYS:\n" + kohortText + "\n\n"
    + "PUBMED-EVIDENS:\n" + pubmedText + "\n\n"
    + "Besvara användarens fråga genom att väga samman dessa. Ge en sammanvägd klinisk bedömning med konkreta rekommendationer.\n"
    + "Notera om kohortfynden stämmer med eller avviker från publicerad forskning.\n"
    + "Skriv 4-8 meningar ren löptext. Ingen markdown. Inga taggar."
    + VIZ_INSTRUCTION;
}

// ========== DIAGRAMVAL ==========
function matchChart(question) {
  var q = question.toLowerCase();
  // Specifika termer FÖRST, generiska SIST
  var rules = [
    [["hba1c","hba"], "hba1c"],
    [["metformin"], "metformin"],
    [["gleason","isup"], "gleason"],
    [["njur","egfr","kreatinin"], "njurfunktion"],
    [["hjärt","kärl","kardio"], "hjart"],
    [["komorbid","samsjuklighet"], "komorbiditet"],
    [["ralp","prostatektomi","kirurgi"], "ralp_vs_stral"],
    [["strål","ebrt"], "ralp_vs_stral"],
    [["psa","psa-respons","tumörmarkör"], "psa"],
    [["adt","hormon","antiandrogen","metabol"], "hba1c"],
    [["recidiv","biokemisk"], "utfall"],
    [["riskgrupp"], "riskgrupp"],
    [["diabetes","typ 1","typ 2","dm","insulin"], "diabetes"],
    [["läkemedel","medicinering","farmak"], "lakemedel"],
    [["ålder","demographics"], "alder"],
    [["utfall","resultat","prognos"], "utfall"],
    [["behandling","terapi","operation"], "behandling"],
    [["risk"], "riskgrupp"],
    [["sammansättning","översikt"], "sammansattning"],
  ];
  for (var i = 0; i < rules.length; i++) {
    for (var j = 0; j < rules[i][0].length; j++) {
      if (q.indexOf(rules[i][0][j]) >= 0) return CHARTS_DB[rules[i][1]] || null;
    }
  }
  return CHARTS_DB["sammansattning"];
}

var EXAMPLES = [
  "Hur påverkas HbA1c hos patienter med ADT jämfört med utan?",
  "Vilken behandling ger bäst PSA-respons?",
  "Hur vanligt är hjärt-kärlsjukdom i kohorten?",
  "Beskriv kohortens sammansättning",
  "Vilka patienter har sämst diabeteskontroll?",
  "Jämför utfallen mellan RALP och strålbehandling",
  "Finns evidens för att metformin påverkar prostatacancer?",
  "Hur ser riskgruppsfördelningen ut?"
];

var COLORS = ["#2563eb","#059669","#d97706","#dc2626","#7c3aed","#0891b2","#be185d","#4f46e5","#15803d","#b45309"];

// ========== HELPERS ==========
function cleanMd(r) {
  if (!r) return "";
  return r.replace(/\*\*\*/g,"").replace(/\*\*([^*]+)\*\*/g,"$1").replace(/\*([^*]+)\*/g,"$1")
    .replace(/^#{1,4}\s*/gm,"").replace(/`([^`]+)`/g,"$1").replace(/\n{3,}/g,"\n\n").trim();
}

// ========== AI-GENERERADE VISUALISERINGAR (parser) ==========
function parseVizBlocks(text) {
  var vizzes = [];
  var clean = text;
  var re = /<<<VIZ>>>\s*([\s\S]*?)\s*<<<END>>>/g;
  var match;
  while ((match = re.exec(text)) !== null) {
    try {
      var parsed = JSON.parse(match[1]);
      if (parsed.vizType) {
        // Map vizType to chartType for compatibility with ChartVis
        if (parsed.vizType !== "table") {
          parsed.chartType = parsed.vizType;
        }
        vizzes.push(parsed);
      }
    } catch (e) {
      // Ogiltigt JSON — ignorera
    }
  }
  clean = clean.replace(/<<<VIZ>>>\s*[\s\S]*?\s*<<<END>>>/g, "").trim();
  return { text: clean, vizzes: vizzes };
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
    if (!text) throw new Error("Tomt svar från API");
    var parsed = parseVizBlocks(text);
    return { text: cleanMd(parsed.text), vizzes: parsed.vizzes };
  });
}

// Databasdriven kohortanalys — Claude söker i patientdatabasen via tool_use
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
    if (!text) throw new Error("Tomt svar från API");
    var parsed = parseVizBlocks(text);
    return { text: cleanMd(parsed.text), vizzes: parsed.vizzes, toolTrace: d.tool_trace || [] };
  });
}

// ========== TOOL TRACE (transparensvy) ==========
var TOOL_LABELS = {
  search_patients: { icon: "\u{1F50D}", label: "Sök patienter", color: "#2563eb" },
  get_statistics: { icon: "\u{1F4CA}", label: "Beräkna statistik", color: "#7c3aed" },
  count_patients: { icon: "#\uFE0F\u20E3", label: "Räkna patienter", color: "#059669" },
  cross_tabulate: { icon: "\u229E", label: "Korstabell", color: "#d97706" },
  get_time_series: { icon: "\u{1F4C8}", label: "Tidsserie", color: "#dc2626" },
  get_patient_time_series: { icon: "\u{1F464}", label: "Patientförlopp", color: "#0891b2" }
};

var FILTER_FIELD_LABELS = {
  a: "ålder", r: "riskgrupp", g: "Gleason", p: "PSA", t: "behandling", o: "utfall",
  d: "diabetestyp", dd: "diabetesduration", h: "HbA1c", b: "BMI", e: "eGFR",
  ht: "hypertoni", rt: "retinopati", nf: "nefropati", kd: "kardiovaskulär"
};

function formatToolInput(tool, input) {
  if (!input) return "";
  var parts = [];
  if (input.filters && Object.keys(input.filters).length > 0) {
    Object.keys(input.filters).forEach(function(k) {
      var label = FILTER_FIELD_LABELS[k] || k;
      var val = input.filters[k];
      if (typeof val === "object" && !Array.isArray(val)) {
        if (val.min !== undefined && val.max !== undefined) parts.push(label + " " + val.min + "\u2013" + val.max);
        else if (val.min !== undefined) parts.push(label + " \u2265" + val.min);
        else if (val.max !== undefined) parts.push(label + " \u2264" + val.max);
      } else if (Array.isArray(val)) {
        parts.push(label + " = " + val.join("/"));
      } else {
        parts.push(label + " = " + val);
      }
    });
  }
  if (input.field) parts.push("fält: " + (FILTER_FIELD_LABELS[input.field] || input.field));
  if (input.group_by) parts.push("grupperat per " + (FILTER_FIELD_LABELS[input.group_by] || input.group_by));
  if (input.measure) parts.push(input.measure.toUpperCase());
  if (input.field1 && input.field2) parts.push((FILTER_FIELD_LABELS[input.field1] || input.field1) + " \u00D7 " + (FILTER_FIELD_LABELS[input.field2] || input.field2));
  if (input.patient_ids) parts.push("patient " + input.patient_ids.join(", "));
  if (input.fields) parts.push("visa: " + input.fields.map(function(f){return FILTER_FIELD_LABELS[f]||f;}).join(", "));
  if (input.limit) parts.push("max " + input.limit);
  return parts.join(" \u00B7 ");
}

function formatToolResult(tool, result) {
  if (!result) return "";
  if (result.error) return "Fel: " + result.error;
  var parts = [];
  if (result.total_matches !== undefined) parts.push(result.total_matches + " tr\u00E4ffar, visar " + result.returned);
  if (result.count !== undefined) parts.push(result.count + " av " + result.total + " (" + result.percentage + "%)");
  if (result.type === "numeric") parts.push("medel " + result.mean + ", median " + result.median + ", min " + result.min + ", max " + result.max);
  if (result.type === "distribution") {
    var dist = result.distribution;
    var items = Object.keys(dist).sort(function(a,b){return dist[b]-dist[a];}).slice(0,5).map(function(k){return k + ": " + dist[k];});
    parts.push(items.join(", "));
  }
  if (result.type === "grouped_numeric" && result.groups) {
    var gk = Object.keys(result.groups).slice(0,4);
    gk.forEach(function(k) { parts.push(k + ": medel " + result.groups[k].mean + " (n=" + result.groups[k].n + ")"); });
    if (Object.keys(result.groups).length > 4) parts.push("+" + (Object.keys(result.groups).length - 4) + " till...");
  }
  if (result.timepoints && result.mean_values) {
    parts.push(result.timepoints.map(function(tp){return tp + ": " + result.mean_values[tp];}).join(" \u2192 "));
  }
  if (result.groups && result.timepoints && !result.mean_values) {
    var gKeys = Object.keys(result.groups).slice(0,3);
    gKeys.forEach(function(k) {
      var vals = result.groups[k].mean_values;
      parts.push(k + " (n=" + result.groups[k].n + "): " + result.timepoints.map(function(tp){return vals[tp];}).join(" \u2192 "));
    });
    if (Object.keys(result.groups).length > 3) parts.push("+" + (Object.keys(result.groups).length - 3) + " till...");
  }
  if (result.patients) parts.push(result.patients.length + " patientf\u00F6rlopp");
  if (result.table) parts.push(result.values_field1.length + " \u00D7 " + result.values_field2.length + " celler");
  return parts.join(" \u00B7 ") || JSON.stringify(result).substring(0, 100);
}

function ToolTracePanel(props) {
  var trace = props.trace || [];
  var openS = useState(false); var isOpen = openS[0]; var setOpen = openS[1];
  var detailS = useState(null); var detailIdx = detailS[0]; var setDetail = detailS[1];
  return (
    <div style={{ marginTop: 6, marginBottom: 4 }}>
      <button onClick={function(){if (trace.length > 0) { setOpen(!isOpen); if (isOpen) setDetail(null); }}} style={{
        display: "flex", alignItems: "center", gap: 6, padding: "5px 10px",
        background: isOpen ? "#f0f9ff" : "transparent", border: "1px solid " + (isOpen ? "#bae6fd" : "#e2e8f0"),
        borderRadius: 6, cursor: trace.length > 0 ? "pointer" : "default", fontSize: 10, color: "#0369a1", fontWeight: 500, width: "100%"
      }}>
        {trace.length > 0 && <span style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s", display: "inline-block", fontSize: 8 }}>{"\u25B6"}</span>}
        <span style={{ background: trace.length > 0 ? "#e0f2fe" : "#fef3c7", padding: "1px 6px", borderRadius: 3, fontSize: 9, fontWeight: 700, color: trace.length > 0 ? "#0c4a6e" : "#92400e" }}>{trace.length}</span>
        <span>{trace.length === 0 ? "inga databass\u00F6kningar (modellen svarade direkt)" : "databass\u00F6kningar utf\u00F6rda"}</span>
        {trace.length > 0 && <span style={{ marginLeft: "auto", fontSize: 9, color: "#94a3b8" }}>{isOpen ? "d\u00F6lj" : "visa transparens"}</span>}
      </button>
      {isOpen && (
        <div style={{ marginTop: 4, borderLeft: "2px solid #bae6fd", marginLeft: 6, paddingLeft: 8 }}>
          {trace.map(function(t, i) {
            var meta = TOOL_LABELS[t.tool] || { icon: "\u2699", label: t.tool, color: "#64748b" };
            var isExpanded = detailIdx === i;
            return (
              <div key={i} style={{ marginBottom: 4 }}>
                <button onClick={function(){setDetail(isExpanded ? null : i);}} style={{
                  display: "flex", alignItems: "flex-start", gap: 6, padding: "5px 8px", width: "100%",
                  background: isExpanded ? "#f8fafc" : "white", border: "1px solid #e2e8f0",
                  borderRadius: 5, cursor: "pointer", textAlign: "left"
                }}>
                  <span style={{ fontSize: 11, flexShrink: 0 }}>{meta.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, color: "white", background: meta.color,
                        padding: "1px 5px", borderRadius: 3, flexShrink: 0
                      }}>{meta.label}</span>
                      <span style={{ fontSize: 10, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {formatToolInput(t.tool, t.input)}
                      </span>
                    </div>
                    <div style={{ fontSize: 9, color: "#64748b", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: isExpanded ? "normal" : "nowrap" }}>
                      {"\u2192"} {formatToolResult(t.tool, t.result)}
                    </div>
                  </div>
                  <span style={{ fontSize: 9, color: "#94a3b8", flexShrink: 0, marginTop: 1 }}>{isExpanded ? "\u25BC" : "\u25B7"}</span>
                </button>
                {isExpanded && (
                  <div style={{ margin: "3px 0 3px 20px", padding: 8, background: "#f1f5f9", borderRadius: 4, fontSize: 9, fontFamily: "monospace", lineHeight: 1.5, maxHeight: 200, overflowY: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#334155" }}>
                    <div style={{ color: "#0369a1", marginBottom: 4, fontWeight: 600 }}>INPUT:</div>
                    {JSON.stringify(t.input, null, 2)}
                    <div style={{ color: "#0369a1", marginTop: 8, marginBottom: 4, fontWeight: 600 }}>RESULTAT:</div>
                    {JSON.stringify(t.result, null, 2)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ========== UI COMPONENTS ==========
function Paras(props) {
  var t = props.text || "";
  return t.split(/\n\n+/).map(function(p, i) {
    if (!p.trim()) return null;
    return <div key={i} style={{ marginBottom: 8 }}>{p.split(/\n/).map(function(l, j) {
      return <span key={j}>{l}{j < p.split(/\n/).length - 1 && <br />}</span>;
    })}</div>;
  });
}

var SECTION_STYLES = {
  kohort: { b: "#2563eb", bg: "#f7f9ff", l: "■ KOHORTDATABAS — sökning via tool_use (n=100)", lb: "#1e3a5f" },
  pubmed: { b: "#059669", bg: "#f4fdf9", l: "◆ PUBLICERAD EVIDENS (PubMed E-utilities)", lb: "#065f46" },
  syntes: { b: "#7c3aed", bg: "#faf5ff", l: "▶ SAMMANVÄGD BEDÖMNING", lb: "#6b21a8" }
};

function Section(props) {
  var s = SECTION_STYLES[props.type] || SECTION_STYLES.kohort;
  var isLoading = props.loading;
  var articles = props.articles || [];
  return (
    <div style={{ borderLeft: "3px solid " + s.b, background: s.bg, borderRadius: "0 8px 8px 0", padding: "8px 12px", marginBottom: 8, opacity: isLoading ? 0.6 : 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <div style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, background: s.lb, color: "white", fontSize: 9, fontWeight: 600 }}>{s.l}</div>
        {props.totalFound > 0 && <span style={{ fontSize: 9, color: "#64748b" }}>{props.totalFound} träffar på PubMed</span>}
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 1.65, color: "#1e293b" }}>
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#94a3b8", fontSize: 11 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid #e2e8f0", borderTopColor: s.b, animation: "spin 1s linear infinite" }} />
            {props.loadingText || "Laddar..."}
          </div>
        ) : (
          <Paras text={props.text} />
        )}
      </div>
      {articles.length > 0 && (
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid " + s.b + "30" }}>
          <div style={{ fontSize: 9, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>KÄLLOR:</div>
          {articles.map(function(a, i) {
            return (
              <div key={i} style={{ fontSize: 10, lineHeight: 1.4, marginBottom: 3 }}>
                <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: "#065f46", textDecoration: "none" }}>
                  {a.authors} ({a.year}) — {a.title}
                </a>
                <span style={{ color: "#94a3b8" }}> — {a.journal}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ChartVis(props) {
  var c = props.data; if (!c) return null;
  var type = c.chartType || "bar", data = c.data || [], title = c.title || "";
  if (type === "pie") return (
    <div style={{ padding: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", mb: 8, textAlign: "center" }}>{title}</div>
      <ResponsiveContainer width="100%" height={280}><PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={function(e) { return e.name + " (" + e.value + ")"; }} fontSize={11}>
          {data.map(function(d, i) { return <Cell key={i} fill={COLORS[i % COLORS.length]} />; })}</Pie><Tooltip />
      </PieChart></ResponsiveContainer>
    </div>);
  if (type === "grouped_bar" && c.series) {
    var gd = (c.categories || []).map(function(cat, i) { var r = { name: cat }; (c.series || []).forEach(function(s) { r[s.name] = s.data[i] || 0; }); return r; });
    return (
      <div style={{ padding: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", mb: 8, textAlign: "center" }}>{title}</div>
        <ResponsiveContainer width="100%" height={280}><BarChart data={gd}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" fontSize={10} /><YAxis fontSize={10} /><Tooltip /><Legend fontSize={10} />
          {(c.series || []).map(function(s, i) { return <Bar key={i} dataKey={s.name} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} />; })}
        </BarChart></ResponsiveContainer>
      </div>);
  }
  if (type === "line") return (
    <div style={{ padding: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", mb: 8, textAlign: "center" }}>{title}</div>
      <ResponsiveContainer width="100%" height={280}><LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" fontSize={10} /><YAxis fontSize={10} /><Tooltip />
        <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart></ResponsiveContainer>
    </div>);
  return (
    <div style={{ padding: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", mb: 8, textAlign: "center" }}>{title}</div>
      <ResponsiveContainer width="100%" height={280}><BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" fontSize={10} angle={data.length > 5 ? -30 : 0} textAnchor={data.length > 5 ? "end" : "middle"} height={data.length > 5 ? 60 : 30} />
        <YAxis fontSize={10} /><Tooltip />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>{data.map(function(d, i) { return <Cell key={i} fill={COLORS[i % COLORS.length]} />; })}</Bar>
      </BarChart></ResponsiveContainer>
    </div>);
}

function TableVis(props) {
  var t = props.data; if (!t) return null;
  var cols = t.columns || []; var rows = t.rows || []; var title = t.title || "";
  return (
    <div style={{ padding: 12 }}>
      {title && <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginBottom: 8, textAlign: "center" }}>{title}</div>}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr>{cols.map(function(c, i) {
              return <th key={i} style={{ padding: "6px 10px", borderBottom: "2px solid #e2e8f0", background: "#f8fafc", textAlign: "left", fontWeight: 600, color: "#334155", whiteSpace: "nowrap" }}>{c}</th>;
            })}</tr>
          </thead>
          <tbody>{rows.map(function(row, ri) {
            return <tr key={ri} style={{ background: ri % 2 === 0 ? "white" : "#f8fafc" }}>{(Array.isArray(row) ? row : []).map(function(cell, ci) {
              return <td key={ci} style={{ padding: "5px 10px", borderBottom: "1px solid #f1f5f9", color: "#475569" }}>{cell}</td>;
            })}</tr>;
          })}</tbody>
        </table>
      </div>
    </div>
  );
}

function Metric(props) {
  return (
    <div style={{ background: "white", borderRadius: 6, padding: "6px 10px", border: "1px solid #e2e8f0", flex: 1, minWidth: 100 }}>
      <div style={{ fontSize: 8, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.4 }}>{props.label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: props.color || "#1a365d" }}>{props.value}</div>
      {props.sub && <div style={{ fontSize: 8, color: "#94a3b8" }}>{props.sub}</div>}
    </div>
  );
}



// ========== KOHORTDATA TAB ==========
var FIELD_LABELS = {
  a: "Ålder", r: "Riskgrupp", g: "Gleason", p: "PSA vid diagnos",
  t: "Behandling", o: "Utfall", d: "Diabetestyp", dd: "Diabetesduration (år)",
  h: "HbA1c (mmol/mol)", b: "BMI", e: "eGFR",
  ht: "Hypertoni", rt: "Retinopati", nf: "Nefropati", kd: "Kardiovaskulär sjukdom"
};
var CATEGORICAL = ["r","g","t","o","d"];
var NUMERIC = ["a","p","dd","h","b","e"];
var BINARY = ["ht","rt","nf","kd"];

function groupBy(field) {
  var counts = {};
  PATIENTS.forEach(function(p) {
    var val = String(p[field]);
    counts[val] = (counts[val] || 0) + 1;
  });
  return Object.keys(counts).sort().map(function(k) { return { name: k, value: counts[k] }; });
}

function numericByGroup(numField, catField) {
  var groups = {};
  PATIENTS.forEach(function(p) {
    var g = String(p[catField]);
    if (!groups[g]) groups[g] = [];
    groups[g].push(p[numField]);
  });
  return Object.keys(groups).sort().map(function(k) {
    var vals = groups[k];
    var mean = vals.reduce(function(s,v){return s+v;}, 0) / vals.length;
    return { name: k, value: Math.round(mean * 10) / 10, n: vals.length };
  });
}

function numericHistogram(field) {
  var vals = PATIENTS.map(function(p) { return p[field]; });
  var min = Math.min.apply(null, vals);
  var max = Math.max.apply(null, vals);
  var range = max - min;
  var binCount = 8;
  var binSize = Math.ceil(range / binCount);
  var bins = {};
  vals.forEach(function(v) {
    var binStart = Math.floor((v - min) / binSize) * binSize + min;
    var label = Math.round(binStart) + "-" + Math.round(binStart + binSize);
    bins[label] = (bins[label] || 0) + 1;
  });
  return Object.keys(bins).map(function(k) { return { name: k, value: bins[k] }; });
}

function KohortDataTab() {
  var catFieldS = useState("t"); var catField = catFieldS[0]; var setCatField = catFieldS[1];
  var numFieldS = useState("h"); var numField = numFieldS[0]; var setNumField = numFieldS[1];
  var distFieldS = useState("a"); var distField = distFieldS[0]; var setDistField = distFieldS[1];

  var presetCharts = [
    { title: "Cancerriskgrupper", data: CHARTS_DB["riskgrupp"] },
    { title: "Behandlingsfördelning", data: CHARTS_DB["behandling"] },
    { title: "Behandlingsutfall", data: CHARTS_DB["utfall"] },
    { title: "Diabetestyp", data: CHARTS_DB["diabetes"] },
    { title: "Komorbiditeter", data: CHARTS_DB["komorbiditet"] },
    { title: "Åldersfördelning", data: CHARTS_DB["alder"] }
  ];

  var customGroupData = numericByGroup(numField, catField);
  var customDistData = CATEGORICAL.indexOf(distField) >= 0 || BINARY.indexOf(distField) >= 0
    ? groupBy(distField)
    : numericHistogram(distField);

  var selStyle = { padding: "4px 8px", borderRadius: 4, border: "1px solid #cbd5e1", fontSize: 11, background: "white", color: "#1e293b" };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 4 }}>Kohortöversikt — 100 syntetiska patienter</div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>Män 50–65 år med prostatacancer (C61) och insulinbehandlad diabetes (E10/E11)</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        {presetCharts.map(function(c, i) {
          return (
            <div key={i} style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#1e293b", marginBottom: 4, textAlign: "center" }}>{c.title}</div>
              <ChartVis data={c.data} />
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginBottom: 8, borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>Utforska datan själv</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#1e293b", marginBottom: 8 }}>Medelvärde per grupp</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, color: "#64748b" }}>Visa</span>
            <select value={numField} onChange={function(e){setNumField(e.target.value);}} style={selStyle}>
              {NUMERIC.map(function(f){return <option key={f} value={f}>{FIELD_LABELS[f]}</option>;})}
            </select>
            <span style={{ fontSize: 10, color: "#64748b" }}>per</span>
            <select value={catField} onChange={function(e){setCatField(e.target.value);}} style={selStyle}>
              {CATEGORICAL.map(function(f){return <option key={f} value={f}>{FIELD_LABELS[f]}</option>;})}
            </select>
          </div>
          <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 4 }}>Medel {FIELD_LABELS[numField]} per {FIELD_LABELS[catField].toLowerCase()}</div>
          <ChartVis data={{ chartType: "bar", title: "", data: customGroupData }} />
        </div>

        <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#1e293b", marginBottom: 8 }}>Fördelning</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "#64748b" }}>Visa fördelning av</span>
            <select value={distField} onChange={function(e){setDistField(e.target.value);}} style={selStyle}>
              {CATEGORICAL.concat(NUMERIC).concat(BINARY).map(function(f){return <option key={f} value={f}>{FIELD_LABELS[f]}</option>;})}
            </select>
          </div>
          <ChartVis data={{ chartType: CATEGORICAL.indexOf(distField) >= 0 ? "pie" : "bar", title: "", data: customDistData }} />
        </div>
      </div>
    </div>
  );
}

// ========== LATHUND TAB ==========
function LathundTab() {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
      <svg width="100%" viewBox="0 0 680 600" style={{ maxWidth: 700, margin: "0 auto", display: "block" }}>
        <text style={{ fontSize: 15, fontWeight: 600, fill: "var(--color-text-primary, #1e293b)" }} x="340" y="28" textAnchor="middle">Så fungerar kohortanalysverktyget</text>
        <text style={{ fontSize: 11, fill: "var(--color-text-secondary, #64748b)" }} x="340" y="46" textAnchor="middle">Vad som händer när du ställer en fråga</text>

        <rect x="200" y="64" width="280" height="40" rx="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.5"/>
        <text style={{ fontSize: 13, fontWeight: 600, fill: "#1e293b" }} x="340" y="88" textAnchor="middle">Din fråga</text>

        <line x1="340" y1="104" x2="340" y2="128" stroke="#94a3b8" strokeWidth="0.5"/>
        <path d="M340 128 L130 128 L130 156" fill="none" stroke="#2563eb" strokeWidth="1"/>
        <line x1="340" y1="128" x2="340" y2="156" stroke="#94a3b8" strokeWidth="1"/>
        <path d="M340 128 L550 128 L550 156" fill="none" stroke="#059669" strokeWidth="1"/>

        <rect x="40" y="160" width="180" height="52" rx="8" fill="#E6F1FB" stroke="#2563eb" strokeWidth="0.5"/>
        <text style={{ fontSize: 12, fontWeight: 600, fill: "#0C447C" }} x="130" y="182" textAnchor="middle">Steg 1: Kohortdatabas</text>
        <text style={{ fontSize: 10, fill: "#185FA5" }} x="130" y="198" textAnchor="middle">Claude tool_use, ~5 sek</text>

        <rect x="255" y="160" width="170" height="52" rx="8" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.5"/>
        <text style={{ fontSize: 12, fontWeight: 600, fill: "#334155" }} x="340" y="182" textAnchor="middle">Diagram</text>
        <text style={{ fontSize: 10, fill: "#64748b" }} x="340" y="198" textAnchor="middle">Lokalt, direkt</text>

        <rect x="460" y="160" width="180" height="52" rx="8" fill="#E1F5EE" stroke="#059669" strokeWidth="0.5"/>
        <text style={{ fontSize: 12, fontWeight: 600, fill: "#04342C" }} x="550" y="182" textAnchor="middle">Steg 2: PubMed</text>
        <text style={{ fontSize: 10, fill: "#0F6E56" }} x="550" y="198" textAnchor="middle">E-utilities, ~5 sek</text>

        <path d="M130 212 L130 268 L222 268" fill="none" stroke="#7c3aed" strokeWidth="1"/>
        <path d="M550 212 L550 268 L458 268" fill="none" stroke="#7c3aed" strokeWidth="1"/>

        <rect x="222" y="248" width="236" height="52" rx="8" fill="#FAF5FF" stroke="#7c3aed" strokeWidth="0.5"/>
        <text style={{ fontSize: 12, fontWeight: 600, fill: "#26215C" }} x="340" y="270" textAnchor="middle">Steg 3: Sammanvägd bedömning</text>
        <text style={{ fontSize: 10, fill: "#534AB7" }} x="340" y="286" textAnchor="middle">Claude API, ~3 sek</text>

        <line x1="340" y1="300" x2="340" y2="330" stroke="#94a3b8" strokeWidth="0.5"/>

        <rect x="40" y="334" width="600" height="250" rx="10" fill="none" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="4 3"/>
        <text style={{ fontSize: 10, fill: "#94a3b8" }} x="340" y="354" textAnchor="middle">Resultat som visas stegvis i gränssnittet</text>

        <rect x="60" y="370" width="270" height="40" rx="6" fill="#E6F1FB" stroke="#2563eb" strokeWidth="0.5"/>
        <rect x="60" y="370" width="4" height="40" fill="#2563eb"/>
        <text style={{ fontSize: 10, fontWeight: 600, fill: "#0C447C" }} x="76" y="386">■ KOHORTDATABAS (tool_use)</text>
        <text style={{ fontSize: 9, fill: "#185FA5" }} x="76" y="400">Claude söker i databasen via verktyg</text>

        <rect x="350" y="370" width="270" height="40" rx="6" fill="#E1F5EE" stroke="#059669" strokeWidth="0.5"/>
        <rect x="350" y="370" width="4" height="40" fill="#059669"/>
        <text style={{ fontSize: 10, fontWeight: 600, fill: "#04342C" }} x="366" y="386">◆ PUBLICERAD EVIDENS</text>
        <text style={{ fontSize: 9, fill: "#0F6E56" }} x="366" y="400">PubMed-artiklar + sammanfattning</text>

        <rect x="60" y="422" width="560" height="40" rx="6" fill="#FAF5FF" stroke="#7c3aed" strokeWidth="0.5"/>
        <rect x="60" y="422" width="4" height="40" fill="#7c3aed"/>
        <text style={{ fontSize: 10, fontWeight: 600, fill: "#26215C" }} x="76" y="438">▶ SAMMANVÄGD BEDÖMNING</text>
        <text style={{ fontSize: 9, fill: "#534AB7" }} x="76" y="452">Kohort + evidens → kliniska rekommendationer</text>

        <rect x="60" y="474" width="560" height="40" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.5"/>
        <rect x="60" y="474" width="4" height="40" fill="#94a3b8"/>
        <text style={{ fontSize: 10, fontWeight: 600, fill: "#334155" }} x="76" y="490">☰ DIAGRAM</text>
        <text style={{ fontSize: 9, fill: "#64748b" }} x="76" y="504">15 förberäknade diagramtyper, visas omedelbart</text>

        <text style={{ fontSize: 10, fill: "#94a3b8" }} x="340" y="544" textAnchor="middle">Blått syns efter ~5 sek (tool_use loop) · Grönt efter ~10 sek · Lila efter ~13 sek · Diagram direkt</text>
        <text style={{ fontSize: 10, fill: "#94a3b8" }} x="340" y="562" textAnchor="middle">Du väljer källa: Kohort | PubMed | Båda + syntes</text>
      </svg>

      <div style={{ maxWidth: 700, margin: "16px auto", fontSize: 12, lineHeight: 1.7, color: "#334155" }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Datakällor</div>
        <div style={{ marginBottom: 8 }}><span style={{ color: "#2563eb", fontWeight: 600 }}>Kohortdatabas</span> — 100 syntetiska patienter i en backend-databas. Claude söker via tool_use med verktygen search_patients, get_statistics, count_patients och cross_tabulate. Claude bestämmer själv vilka sökningar som behövs — ingen data skickas i prompten. Skalbart till valfri kohort-storlek.</div>
        <div style={{ marginBottom: 8 }}><span style={{ color: "#059669", fontWeight: 600 }}>PubMed E-utilities</span> — Direkt sökning mot NCBI:s E-utilities API (eutils.ncbi.nlm.nih.gov). Svenska frågor översätts till engelska MeSH-termer. Abstracts hämtas i XML och sammanfattas på svenska av Claude.</div>
        <div style={{ marginBottom: 8 }}><span style={{ color: "#7c3aed", fontWeight: 600 }}>Sammanvägd bedömning</span> — Claude väger samman kohortanalys och PubMed-evidens till kliniska rekommendationer. Noterar om kohortfynd stämmer med publicerad forskning.</div>
        <div style={{ fontWeight: 600, marginTop: 12, marginBottom: 6 }}>Backend</div>
        <div>Vercel serverless functions: /api/cohort-chat (Claude tool_use loop med patientdatabas), /api/chat (Claude API proxy), /api/pubmed (E-utilities + Claude-sammanfattning). React + Vite frontend. Diagram beräknas lokalt — 15 dataset matchas mot nyckelord.</div>
      </div>
    </div>
  );
}

// ========== PUBMED-LANDSKAP TAB ==========
var FALLBACK_LANDSCAPE = {"volume":[{"label":"Prostatacancer + diabetes (totalt)","count":3927},{"label":"Metformin + prostatacancer","count":892},{"label":"Kardiovaskulär risk + prostatacancer","count":734},{"label":"ADT + metabola effekter","count":612},{"label":"Insulinresistens + prostatacancer","count":487},{"label":"PSA + diabetes","count":356},{"label":"Prostatektomi + diabetes","count":298},{"label":"Strålbehandling + diabetes","count":187},{"label":"Gleason + diabetes","count":143},{"label":"Aktiv övervakning + diabetes","count":67}],"trend":[{"year":2012,"count":198},{"year":2013,"count":221},{"year":2014,"count":245},{"year":2015,"count":268},{"year":2016,"count":289},{"year":2017,"count":312},{"year":2018,"count":341},{"year":2019,"count":358},{"year":2020,"count":329},{"year":2021,"count":367},{"year":2022,"count":398},{"year":2023,"count":421},{"year":2024,"count":447},{"year":2025,"count":389},{"year":2026,"count":87}],"evidence":[{"label":"Översiktsartiklar","count":847},{"label":"Kohortstudier","count":623},{"label":"Meta-analyser","count":156},{"label":"Randomiserade studier (RCT)","count":134},{"label":"Systematiska översikter","count":112},{"label":"Fallrapporter","count":89}],"journals":[{"journal":"Prostate Cancer and Prostatic Diseases","count":28},{"journal":"The Journal of Urology","count":24},{"journal":"European Urology","count":19},{"journal":"Cancer Epidemiology, Biomarkers & Prevention","count":17},{"journal":"BJU International","count":15},{"journal":"The Prostate","count":14},{"journal":"Diabetologia","count":12},{"journal":"Urology","count":11},{"journal":"Cancer Causes & Control","count":10},{"journal":"Diabetes Care","count":9},{"journal":"PLOS ONE","count":8},{"journal":"Annals of Oncology","count":7},{"journal":"International Journal of Cancer","count":7},{"journal":"World Journal of Urology","count":6},{"journal":"Cancers (Basel)","count":6}],"meta":{"baseQuery":"prostatic neoplasms AND diabetes mellitus (MeSH)","fetchedAt":"2026-03-16","yearsRange":"2012-2026","note":"Siffror baserade på PubMed MeSH-sökningar mars 2026. Trend 2026 är ofullständigt år."}};

function PubMedLandskapsTab() {
  var dataS = useState(null); var data = dataS[0]; var setData = dataS[1];
  var loadingS = useState(false); var isLoading = loadingS[0]; var setIsLoading = loadingS[1];

  useEffect(function() {
    setIsLoading(true);
    fetch("/api/pubmed-landscape")
      .then(function(r) { return r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status)); })
      .then(function(d) { setData(d); setIsLoading(false); })
      .catch(function() { setData(FALLBACK_LANDSCAPE); setIsLoading(false); });
  }, []);


  if (isLoading || !data) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: 12 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #e2e8f0", borderTopColor: "#059669", animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />
        H\u00E4mtar PubMed-landskapsdata\u2026
      </div>
    </div>
  );

  var volumeData = (data.volume || []).map(function(v) { return { name: v.label, value: v.count }; });
  var trendData = (data.trend || []).map(function(t) { return { name: String(t.year), value: t.count }; });
  var evidenceData = (data.evidence || []).map(function(e) { return { name: e.label, value: e.count }; });
  var journalData = (data.journals || []).map(function(j) { return { name: j.journal, value: j.count }; });
  var totalArticles = data.volume && data.volume[0] ? data.volume[0].count : 0;

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 2 }}>PubMed-forskningslandskap</div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Kartläggning av publicerad forskning med koppling till kohorten (prostatacancer + diabetes)</div>
      <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 12 }}>Hämtat {data.meta && data.meta.fetchedAt ? new Date(data.meta.fetchedAt).toLocaleDateString("sv-SE") : ""} via PubMed E-utilities | Basquery: "{data.meta && data.meta.baseQuery}"</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>

        <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: 12, gridColumn: "1 / -1" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", marginBottom: 2 }}>Forskningsvolym per delämne</div>
          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 8 }}>Antal artiklar på PubMed för varje delämne kopplat till kohortens kliniska profil</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={volumeData} layout="vertical" margin={{ left: 200, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" fontSize={10} />
              <YAxis type="category" dataKey="name" fontSize={10} width={190} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {volumeData.map(function(d, i) { return <Cell key={i} fill={COLORS[i % COLORS.length]} />; })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", marginBottom: 2 }}>Publiceringstrend</div>
          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 8 }}>Artiklar per år ({data.meta && data.meta.yearsRange})</div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" fontSize={9} angle={-45} textAnchor="end" height={50} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#059669" strokeWidth={2} dot={{ r: 3, fill: "#059669" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", marginBottom: 2 }}>Evidensnivå</div>
          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 8 }}>Artikeltyper (av ~{totalArticles.toLocaleString()} totalt)</div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={evidenceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={function(e) { return e.name.split("(")[0].trim() + " (" + e.value + ")"; }} fontSize={9}>
                {evidenceData.map(function(d, i) { return <Cell key={i} fill={COLORS[i % COLORS.length]} />; })}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: 12, gridColumn: "1 / -1" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", marginBottom: 2 }}>Topp-tidskrifter</div>
          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 8 }}>De 15 tidskrifter som publicerar mest om prostatacancer + diabetes (baserat på 200 senaste artiklarna)</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={journalData} layout="vertical" margin={{ left: 250, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" fontSize={10} />
              <YAxis type="category" dataKey="name" fontSize={9} width={240} />
              <Tooltip />
              <Bar dataKey="value" fill="#059669" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}


// ========== NPÖ VARIABELLISTA TAB ==========
var KONTRAKT = [
  {
    id: "gcc",
    namn: "GetCareContacts",
    version: "3.0",
    domain: "clinicalprocess:logistics:logistics",
    desc: "Alla vardkontakter: besok, dagkirurgi, rontgen, stralbehandling, telefonkontakter",
    variabler: [
      // Header (PatientSummaryHeaderType)
      { grupp: "Header", falt: "documentId", def: "Unikt dokument-ID", typ: "xs:string", status: "nytt", testdata: "gcc-2025-06-15-001" },
      { grupp: "Header", falt: "sourceSystemHSAId", def: "Kallsystem HSA-ID", typ: "HSAIdType", status: "nytt", testdata: "SE2321000016-A2G8" },
      { grupp: "Header", falt: "documentTime", def: "Dokumentationstidpunkt", typ: "TimeStampType", status: "nytt", testdata: "20250615T143200" },
      { grupp: "Header", falt: "patientId", def: "Personnummer (12 siffror)", typ: "PersonIdType", status: "nytt", testdata: "{ id: '194720415XXXX', type: '1.2.752.129.2.1.3.1' }" },
      { grupp: "Header", falt: "accountableHealthcareProfessional.healthcareProfessionalHSAId", def: "Ansvarig lakares HSA-ID", typ: "HSAIdType", status: "nytt", testdata: "SE2321000016-PRS001 (Dr Johansson)" },
      { grupp: "Header", falt: "accountableHealthcareProfessional.healthcareProfessionalName", def: "Ansvarigs namn", typ: "xs:string", status: "finns", testdata: "Dr Lars Johansson" },
      { grupp: "Header", falt: "accountableHealthcareProfessional.authorTime", def: "Tidpunkt for dokumentation", typ: "TimeStampType", status: "nytt", testdata: "20250615T150000" },
      { grupp: "Header", falt: "accountableHealthcareProfessional.healthcareProfessionalRoleCode", def: "Yrkesroll (kodad)", typ: "CVType", status: "nytt", testdata: "{ code: 'LK', displayName: 'Lakare' }" },
      { grupp: "Header", falt: "accountableHealthcareProfessional.healthcareProfessionalOrgUnit.orgUnitHSAId", def: "Organisationsenhet HSA-ID", typ: "HSAIdType", status: "nytt", testdata: "SE2321000016-1MG3 (Urologmott MSE)" },
      { grupp: "Header", falt: "accountableHealthcareProfessional.healthcareProfessionalOrgUnit.orgUnitName", def: "Enhetsnamn", typ: "xs:string", status: "finns", testdata: "Urologmottagningen, MSE" },
      { grupp: "Header", falt: "accountableHealthcareProfessional.healthcareProfessionalCareGiverHSAId", def: "Vardgivare HSA-ID", typ: "xs:string", status: "nytt", testdata: "SE2321000016-39KJ (Region Sormland)" },
      { grupp: "Header", falt: "legalAuthenticator.signatureTime", def: "Signeringstid", typ: "TimeStampType", status: "nytt", testdata: "20250615T153000" },
      { grupp: "Header", falt: "legalAuthenticator.legalAuthenticatorHSAId", def: "Signerares HSA-ID", typ: "HSAIdType", status: "nytt", testdata: "SE2321000016-PRS001" },
      { grupp: "Header", falt: "approvedForPatient", def: "Godkand for visning via 1177", typ: "xs:boolean", status: "nytt", testdata: "true" },
      { grupp: "Header", falt: "careContactId", def: "Vardkontakt-ID (lankar till andra kontrakt)", typ: "xs:string", status: "nytt", testdata: "VK-MSE-2025-06-15-4832" },
      { grupp: "Header", falt: "nullified", def: "Makulerad", typ: "xs:boolean", status: "nytt", testdata: "false" },
      // Body
      { grupp: "Body", falt: "careContactTimePeriod.start", def: "Kontaktstart", typ: "TimeStampType", status: "finns", testdata: "2025-06-15 (finns for alla 19 kontakter)" },
      { grupp: "Body", falt: "careContactTimePeriod.end", def: "Kontaktslut", typ: "TimeStampType", status: "nytt", testdata: "20250615T160000" },
      { grupp: "Body", falt: "careContactCode", def: "Kontakttyp (kodad)", typ: "CVType", status: "nytt", testdata: "{ code: '1', codeSystem: '1.2.752.129.5.3', displayName: 'Besok' }" },
      { grupp: "Body", falt: "careContactStatus", def: "Planerad/oplanerad (ej boolean)", typ: "CVType", status: "nytt", testdata: "{ code: '2', displayName: 'Genomford' }" },
      { grupp: "Body", falt: "careContactOrgUnit.orgUnitHSAId", def: "Enhetens HSA-ID", typ: "HSAIdType", status: "nytt", testdata: "SE2321000016-1MG3" },
      { grupp: "Body", falt: "careContactOrgUnit.orgUnitName", def: "Enhetsnamn", typ: "xs:string", status: "finns", testdata: "5 olika enheter: VC Strangnas, Urolog/Onkolog/Endokrin/Rontgen MSE" },
    ]
  },
  {
    id: "gd",
    namn: "GetDiagnosis",
    version: "2.0",
    domain: "clinicalprocess:healthcond:description",
    desc: "ICD-10-SE-kodade diagnoser kopplade till vardkontakter",
    variabler: [
      { grupp: "Header", falt: "documentId", def: "Unikt ID", typ: "xs:string", status: "nytt", testdata: "diag-C619-2024-04-18-001" },
      { grupp: "Header", falt: "sourceSystemHSAId", def: "Kallsystems HSA-ID", typ: "HSAIdType", status: "nytt", testdata: "SE2321000016-A2G8" },
      { grupp: "Header", falt: "careContactId", def: "Koppling till vardkontakt", typ: "xs:string", status: "nytt", testdata: "VK-MSE-2024-04-02-2381 (biopsibeskedsbesok)" },
      { grupp: "Header", falt: "(ovriga header-falt)", def: "Se GetCareContacts header", typ: "diverse", status: "nytt", testdata: "Samma struktur som ovan" },
      { grupp: "Body", falt: "diagnosisCode.code", def: "ICD-10-SE-kod", typ: "xs:string", status: "finns", testdata: "E10.9, E10.3A, E10.2, I10.9, E78.0, C61.9, N39.4, N48.4" },
      { grupp: "Body", falt: "diagnosisCode.codeSystem", def: "Kodverk OID", typ: "xs:string", status: "nytt", testdata: "1.2.752.116.1.1.1.3.2 (ICD-10-SE)" },
      { grupp: "Body", falt: "diagnosisCode.displayName", def: "Klartext", typ: "xs:string", status: "finns", testdata: "T.ex. 'Malign tumor i prostata'" },
      { grupp: "Body", falt: "diagnosisType", def: "Huvuddiagnos/bidiagnos", typ: "CVType", status: "nytt", testdata: "C61.9: { code: 'H', displayName: 'Huvuddiagnos' }. E10.9: { code: 'B', displayName: 'Bidiagnos' }" },
      { grupp: "Body", falt: "diagnosisTime", def: "Diagnosdatum", typ: "TimeStampType", status: "finns", testdata: "Alla 8 har datum (t.ex. 2024-04-18 for C61.9)" },
      { grupp: "Body", falt: "chronicDiagnosis", def: "Kronisk diagnos", typ: "xs:boolean", status: "nytt", testdata: "true for E10.x, I10.9, E78.0. false for C61.9, N39.4, N48.4" },
    ]
  },
  {
    id: "gcd",
    namn: "GetCareDocumentation",
    version: "3.0",
    domain: "clinicalprocess:healthcond:description",
    desc: "Kliniska anteckningar (fritext i DocBook-format)",
    variabler: [
      { grupp: "Header", falt: "documentId", def: "Unikt antecknings-ID", typ: "xs:string", status: "nytt", testdata: "doc-MSE-2025-06-15-001" },
      { grupp: "Header", falt: "documentTitle", def: "Dokumenttitel", typ: "xs:string", status: "finns", testdata: "T.ex. 'Uppfoljning 6 man efter stralbehandling'" },
      { grupp: "Header", falt: "documentTime", def: "Dokumentationstid", typ: "TimeStampType", status: "finns", testdata: "9 anteckningar 2023-09-15 till 2025-06-15 (saknar klockslag)" },
      { grupp: "Header", falt: "careContactId", def: "Koppling till vardkontakt", typ: "xs:string", status: "nytt", testdata: "VK-MSE-2025-06-15-4832" },
      { grupp: "Header", falt: "accountableHealthcareProfessional.*", def: "Forfattare (se header ovan)", typ: "diverse", status: "delvis", testdata: "Namn+titel finns. HSA-ID saknas." },
      { grupp: "Header", falt: "legalAuthenticator.signatureTime", def: "Signeringstidpunkt", typ: "TimeStampType", status: "nytt", testdata: "20250615T160000 (signerad samma dag)" },
      { grupp: "Header", falt: "approvedForPatient", def: "Synlig for patient via 1177", typ: "xs:boolean", status: "nytt", testdata: "true (alla 9 + nya signerade)" },
      { grupp: "Body", falt: "clinicalDocumentNoteCode", def: "Anteckningstyp (kodad)", typ: "CVType", status: "nytt", testdata: "Befintliga: { code: 'mot', displayName: 'Mottagningsanteckning' }. NYA: 'dag' (dagkirurgi), 'epi' (epikris), 'omv' (omvardnad)" },
      { grupp: "Body", falt: "clinicalDocumentNoteTitle", def: "Rubrik", typ: "xs:string", status: "finns", testdata: "Alla 9 har rubrik" },
      { grupp: "Body", falt: "clinicalDocumentNoteTime", def: "Anteckningstid", typ: "TimeStampType", status: "finns", testdata: "Alla har datum" },
      { grupp: "Body", falt: "clinicalDocumentNoteText", def: "Brodtext (DocBook XML)", typ: "xs:string", status: "finns", testdata: "9 detaljerade fritext-anteckningar" },
      { grupp: "Body (GAP)", falt: "NYTT: Biopsianteckning 2024-03-18", def: "Dagkirurgisk anteckning", typ: "fritext", status: "nytt", testdata: "Dagkirurgi. Transrektal UL-ledd prostatabiopsi. 12 syst + 3 riktade kolvar mot PI-RADS 4-lesion hoger mid. Antibiotika-profylax Ciprofloxacin 500 mg x 2 startad dagen fore. Komplikationsfri atgard. Pat stabil, hemgang. Information om att kontakta vid feber >38.5 eller blodning." },
      { grupp: "Body (GAP)", falt: "NYTT: Stralbehandling avslut 2024-11-08", def: "Avslutningsanteckning", typ: "fritext", status: "nytt", testdata: "Stralbehandling avslutad. 60 Gy / 20 fraktioner, VMAT mot prostata + vesiculae seminales. Behandling genomford utan avbrott. Akuta biverkningar: RTOG grad 1 tarmbesvar (losa avforingar 3-4/dag), grad 1 urinvagsbesvar (nokturi x3, urgency). Ingen hematuri. Blodsockerkontroll: inga speciella problem under stralningen, insulin oforandrat. Plan: PSA-kontroll om 6 veckor. Fortsatt ADT enl plan." },
      { grupp: "Body (GAP)", falt: "NYTT: Diabetesssk 2024-07-10", def: "Omvardnadsanteckning", typ: "fritext", status: "nytt", testdata: "Telefonuppfoljning diabetessjukskoterska. Erik rapporterar svangande blodsockervarden efter ADT-start. Libre visar TIR 48%, TAR (>10) 38%. Gatt igenom kolhydratrakning. Justerat NovoRapid-kvoter: frukost 1:8, lunch 1:9, middag 1:8. Paminnt om att kontakta vid P-glukos >20 upprepat. Aterbesok hos Dr Lindberg 2024-09-12." },
      { grupp: "Body (GAP)", falt: "NYTT: Epikris stralbehandling 2024-11-15", def: "Sammanfattning/epikris", typ: "fritext", status: "nytt", testdata: "Epikris - Stralbehandling prostatacancer. Diagnos: Prostatacancer cT2a N0 M0, Gleason 3+4=7, ISUP 2. Behandling: EBRT 60 Gy/20 fx (VMAT) 2024-10-14 till 2024-11-08 + leuprorelin 22.5 mg s.c. var 3:e man (start 2024-06-05, plan t.o.m. 2026-06). Komorbiditet: DM typ 1 med forsamrad kontroll under ADT (HbA1c 56->62 mmol/mol). Endokrinologisk samuppfoljning pagaende. Uppfoljning: PSA + testosteron var 6:e manad. Ansvarig: Dr Anna Akesson, Onkologmottagningen MSE." },
    ]
  },
  {
    id: "gmh",
    namn: "GetMedicationHistory",
    version: "2.1",
    domain: "clinicalprocess:activityprescription:actoutcome",
    desc: "Lakemedelsordinationer (ATC-kodade). Sedan dec 2025 kopplad till NLL.",
    variabler: [
      { grupp: "Header", falt: "documentId", def: "Ordinations-ID", typ: "xs:string", status: "nytt", testdata: "med-A10AE06-2019-001 (Tresiba)" },
      { grupp: "Header", falt: "sourceSystemHSAId", def: "Kallsystem", typ: "HSAIdType", status: "nytt", testdata: "SE2321000016-A2G8" },
      { grupp: "Header", falt: "careContactId", def: "Kopplad vardkontakt", typ: "xs:string", status: "nytt", testdata: "VK-MSE-2024-09-12-3201 (for dosandring)" },
      { grupp: "Body", falt: "atcCode", def: "ATC-klassificering", typ: "CVType", status: "finns", testdata: "9 lakemedel: A10AE06, A10AB05, C09AA02, C10AA05, C08CA01, L02AE02, L02BB01, G04BE03, A12AX" },
      { grupp: "Body", falt: "productName", def: "Varunamn/substansnamn", typ: "xs:string", status: "finns", testdata: "T.ex. 'Tresiba (insulin degludek)'" },
      { grupp: "Body", falt: "unstructuredDrugInformation", def: "Fritext-dosering", typ: "xs:string", status: "finns", testdata: "T.ex. '22 E subkutant till kvallen'" },
      { grupp: "Body", falt: "prescriptionTime", def: "Ordinationstidpunkt", typ: "TimeStampType", status: "finns", testdata: "Startdatum for alla 9" },
      { grupp: "Body", falt: "prescriptionPeriod", def: "Start- och slutdatum", typ: "TimePeriodType", status: "delvis", testdata: "Start finns. Slut bara for Bikalutamid." },
      { grupp: "Body", falt: "prescriberId (HSA-ID)", def: "Forskrivares HSA-ID", typ: "HSAIdType", status: "nytt", testdata: "SE2321000016-PRS003 (Dr Lindberg) for insulin, SE2321000016-PRS004 (Dr Akesson) for ADT" },
      { grupp: "Body", falt: "typeOfPrescription", def: "Ordinationstyp", typ: "CVType", status: "nytt", testdata: "{ code: 'once', displayName: 'Engangsdos' } for Bikalutamid. { code: 'continuous', displayName: 'Staende ordination' } for ovriga." },
      { grupp: "Body (GAP)", falt: "NYTT: Metformin", def: "Tillagd sept 2024", typ: "CVType", status: "nytt", testdata: "{ atc: 'A10BA02', namn: 'Metformin', dos: '500 mg x 2', start: '2024-09-12', forsk: 'Dr Lindberg' }" },
      { grupp: "Body (GAP)", falt: "NYTT: Atorvastatin dosandring", def: "Hojd dos okt 2024", typ: "CVType", status: "nytt", testdata: "{ atc: 'C10AA05', namn: 'Atorvastatin', dos: '40 mg x 1' (andrat fran 20 mg), start: '2024-09-12' }" },
    ]
  },
  {
    id: "gloo",
    namn: "GetLaboratoryOrderOutcome",
    version: "4.2",
    domain: "clinicalprocess:healthcond:actoutcome",
    desc: "Laboratorieresultat (NPU-kodade). Komplexa resultat stodjer PQ/CV/ST-varden.",
    variabler: [
      { grupp: "Header", falt: "documentId", def: "Resultat-ID", typ: "IIType", status: "nytt", testdata: "{ root: '1.2.752.129.2.1.2.1', extension: 'lab-MSE-2025-06-15-PSA' }" },
      { grupp: "Header", falt: "sourceSystemHSAId", def: "Labbsystem HSA-ID", typ: "HSAIdType", status: "nytt", testdata: "SE2321000016-LAB1" },
      { grupp: "Body", falt: "groupOfAnalyses.analysis.code", def: "NPU-kod", typ: "CVType", status: "finns", testdata: "12 unika NPU-koder (NPU08669 PSA, NPU27300 HbA1c, NPU08642 Testosteron m.fl.)" },
      { grupp: "Body", falt: "groupOfAnalyses.analysis.result.value (pq)", def: "Numeriskt resultat + enhet", typ: "PQType", status: "finns", testdata: "30+ varden med enhet och ref.intervall" },
      { grupp: "Body", falt: "groupOfAnalyses.analysis.result.reference", def: "Referensintervall", typ: "xs:string / interval", status: "finns", testdata: "T.ex. '<3.0', '60-105', '>60'" },
      { grupp: "Body", falt: "groupOfAnalyses.analysis.result.pathologicalFlag", def: "H/L-flagga", typ: "CVType", status: "finns", testdata: "Flaggade varden markerade (H eller L)" },
      { grupp: "Body", falt: "groupOfAnalyses.analysis.timestamp", def: "Provtagningstid", typ: "TimeStampType", status: "finns", testdata: "Datum finns for alla (klockslag saknas)" },
      { grupp: "Body", falt: "groupOfAnalyses.analysis.status", def: "Analysstatus (SNOMED CT)", typ: "CVType", status: "nytt", testdata: "{ code: '398166005', codeSystem: 'SNOMED CT', displayName: 'utford' }" },
      { grupp: "Body", falt: "groupOfAnalyses.analysis.method", def: "Analysmetod", typ: "CVType", status: "nytt", testdata: "PSA: immunokemisk. HbA1c: IFCC HPLC." },
      { grupp: "Body", falt: "specimen.material", def: "Provmaterial (SNOMED CT)", typ: "CVType", status: "nytt", testdata: "{ code: '119364003', displayName: 'Serum' } for S-prover. { code: '420135007', displayName: 'Helblod' } for B-prover." },
      { grupp: "Body", falt: "referral.requester", def: "Bestallarens HSA-ID", typ: "HSAIdType", status: "nytt", testdata: "SE2321000016-PRS001 (Dr Johansson) for PSA, SE2321000016-PRS003 (Dr Lindberg) for HbA1c" },
      { grupp: "Body", falt: "accredited", def: "Ackrediterad analys", typ: "xs:boolean", status: "nytt", testdata: "true (Klinisk kemi MSE ar SWEDAC-ackrediterat)" },
      { grupp: "Body (GAP)", falt: "NYTT: P-HDL-kolesterol", def: "Saknades i lipidpanel", typ: "PQType", status: "nytt", testdata: "2023-09-15: 1.1 mmol/L (ref >1.0). 2024-09-12: 0.9 mmol/L (L)" },
      { grupp: "Body (GAP)", falt: "NYTT: B-LPK (leukocyter)", def: "Relevant vid immunsuppression", typ: "PQType", status: "nytt", testdata: "2024-03-15: 7.2 x10^9/L (ref 3.5-8.8). 2024-09-12: 5.8 x10^9/L" },
      { grupp: "Body (GAP)", falt: "NYTT: B-TPK (trombocyter)", def: "Koagulationsstatus", typ: "PQType", status: "nytt", testdata: "2024-03-15: 238 x10^9/L (ref 145-348)" },
      { grupp: "Body (GAP)", falt: "NYTT: P-ALAT", def: "Leverfunktion (metformin, statin)", typ: "PQType", status: "nytt", testdata: "2024-03-15: 0.42 ukat/L (ref <0.76). 2024-09-12: 0.58 ukat/L. 2025-06-15: 0.51 ukat/L" },
      { grupp: "Body (GAP)", falt: "NYTT: P-Natrium", def: "Elektrolyter", typ: "PQType", status: "nytt", testdata: "2024-03-15: 140 mmol/L (ref 137-145)" },
      { grupp: "Body (GAP)", falt: "NYTT: P-Kalium", def: "Elektrolyter (ACE-hammare)", typ: "PQType", status: "nytt", testdata: "2024-03-15: 4.3 mmol/L (ref 3.5-4.6). 2024-09-12: 4.8 mmol/L (H)" },
    ]
  },
  {
    id: "gio",
    namn: "GetImagingOutcome",
    version: "1.0",
    domain: "clinicalprocess:healthcond:actoutcome",
    desc: "Bilddiagnostiksvar (rontgen, MR, DT, scintigrafi). Fritexter + ev. PDF.",
    variabler: [
      { grupp: "Header", falt: "documentId", def: "Svarets ID", typ: "xs:string", status: "nytt", testdata: "img-MSE-2024-02-26-001 (MR prostata)" },
      { grupp: "Header", falt: "careContactId", def: "Kopplad vardkontakt", typ: "xs:string", status: "nytt", testdata: "VK-MSE-2024-02-26-1892" },
      { grupp: "Body", falt: "imagingOutcomeBody.examinationTimePeriod", def: "Undersokningsdatum", typ: "TimePeriodType", status: "finns", testdata: "2 undersokningar: 2024-02-26 (MR), 2024-09-20 (DT)" },
      { grupp: "Body", falt: "imagingOutcomeBody.result (fritext)", def: "Fullstandigt rontgensvar", typ: "xs:string", status: "finns", testdata: "Kompletta svar for MR prostata + DT thorax-buk" },
      { grupp: "Body", falt: "accountableHealthcareProfessional.authorTime", def: "Dikteringstid", typ: "TimeStampType", status: "nytt", testdata: "20240226T154500 (MR), 20240920T110000 (DT)" },
      { grupp: "Body", falt: "accountableHealthcareProfessional.healthcareProfessionalHSAId", def: "Radiolog HSA-ID", typ: "HSAIdType", status: "nytt", testdata: "SE2321000016-PRS005 (Dr Eriksson), SE2321000016-PRS006 (Dr Magnusson)" },
      { grupp: "Body (GAP)", falt: "NYTT: DEXA-resultat 2024-06-20", def: "Bentathetsmatning", typ: "fritext", status: "nytt", testdata: "DEXA bentathetsmatning. Fragestallning: Osteoporosrisk, ADT-start. L1-L4: T-score -1.4, Z-score -0.8. Collum femoris: T-score -1.2, Z-score -0.5. Bedomning: Osteopeni. Rekommendation: Kalcium + D-vitamin, vikbarande traning. Kontroll om 2 ar." },
    ]
  },
  {
    id: "gro",
    namn: "GetReferralOutcome",
    version: "3.1",
    domain: "clinicalprocess:healthcond:actoutcome",
    desc: "Remissvar inkl. PAD-svar, konsultationssvar. Stodjer base64 PDF.",
    variabler: [
      { grupp: "Header", falt: "documentId", def: "Remisssvarets ID", typ: "xs:string", status: "nytt", testdata: "ref-PAT-2024-03-28-001 (PAD prostatabiopsi)" },
      { grupp: "Body", falt: "referralOutcomeBody (fritext)", def: "Svartext", typ: "xs:string", status: "finns", testdata: "Komplett PAD: 15 kolvar, Gleason 3+4=7, ISUP 2, 5/15 positiva" },
      { grupp: "Body", falt: "referralOutcomeBody (base64 PDF)", def: "PDF-bilaga", typ: "xs:base64Binary", status: "nytt", testdata: "(Simulerad: PAD-rapport som PDF)" },
      { grupp: "Body (GAP)", falt: "NYTT: Ogonbotten-remissvar 2023-11-10", def: "Retinopati-screening", typ: "fritext", status: "nytt", testdata: "Ogonbottenundersokning. Hoger oga: 2 st mikroaneurysm nasalt om fovea. Vanster oga: 1 st mikroaneurysm + 1 hemoragiflock. Bedomning: Lindrig icke-proliferativ diabetesretinopati bilat, oforandrad sedan 2022. Kontroll om 12 man." },
      { grupp: "Body (GAP)", falt: "NYTT: Onkologkonsultation-svar 2024-05-15", def: "Svar pa remiss fran urologi", typ: "fritext", status: "nytt", testdata: "Konsultationssvar. Tackar for remiss ang pat med prostatacancer, intermediate risk unfav. Planerar EBRT 60 Gy/20 fx + ADT 24 man. Beaktar DM typ 1 med suboptimal kontroll - endokrinologisk samuppfoljning tillstyrks starkt. Tidbokning stralplanering 2024-09-25 (guldmarkorinlaggning) foljt av start ca v42." },
    ]
  },
  {
    id: "gai",
    namn: "GetAlertInformation",
    version: "3.0",
    domain: "clinicalprocess:healthcond:description",
    desc: "Varningar: overkansligahet (4 subtyper), allvarlig sjukdom, behandlingsvarning, ostrukturerad.",
    variabler: [
      { grupp: "Header", falt: "documentId", def: "Varningens ID", typ: "xs:string", status: "nytt", testdata: "alert-001 (kodein), alert-002 (DM1)" },
      { grupp: "Body", falt: "typeOfAlertInformation", def: "Varningstyp (kodad)", typ: "CVType", status: "finns", testdata: "Overkansligahet + Allvarlig sjukdom" },
      { grupp: "Body - Overkansligahet", falt: "hypersensitivity.hypersensitivityAgent", def: "ATC-kodad substans", typ: "CVType", status: "finns", testdata: "{ code: 'N02AA59', displayName: 'Kodein' }" },
      { grupp: "Body - Overkansligahet", falt: "hypersensitivity.hypersensitivitySeverity", def: "Allvarlighetsgrad (kv_allvarlighetsgrad)", typ: "CVType", status: "nytt", testdata: "{ code: '3', codeSystem: '1.2.752.129.2.2.3.3', displayName: 'Besvarande' } (OBS: INTE Hog/Medel/Lag!)" },
      { grupp: "Body - Overkansligahet", falt: "hypersensitivity.hypersensitivityDegreeOfCertainty", def: "Visshetsgrad (kv_visshetsgrad)", typ: "CVType", status: "nytt", testdata: "{ code: '2', codeSystem: '1.2.752.129.2.2.3.11', displayName: 'Konstaterad' }" },
      { grupp: "Body - Overkansligahet", falt: "hypersensitivity.pharmaceuticalHypersensitivity", def: "Lakemedelsoverkansligahet", typ: "xs:boolean", status: "nytt", testdata: "true" },
      { grupp: "Body - Allvarlig sjukdom", falt: "seriousDisease.disease", def: "ICD-10-kodad sjukdom", typ: "CVType", status: "finns", testdata: "{ code: 'E10.9', displayName: 'Diabetes mellitus typ 1' }" },
      { grupp: "Body - Allvarlig sjukdom", falt: "seriousDisease.validityTimePeriod", def: "Giltighetsperiod", typ: "TimePeriodType", status: "finns", testdata: "start: 2000-03-12, end: (oppet)" },
      { grupp: "Body (GAP)", falt: "NYTT: treatmentCaveat (Behandlingsvarning)", def: "ADT + diabetes-interaktion", typ: "TreatmentCaveatType", status: "nytt", testdata: "{ type: 'Metabol risk', desc: 'Pagaende ADT (leuprorelin). OBS okad insulinresistens, monitorera HbA1c var 3:e manad. Undvik langvariga steroidkurer.' }" },
    ]
  },
  {
    id: "gvh",
    namn: "GetVaccinationHistory",
    version: "2.0",
    domain: "clinicalprocess:activityprescription:actoutcome",
    desc: "Vaccinationer med ATC-kod, batchnummer och administrerande enhet.",
    variabler: [
      { grupp: "Header", falt: "documentId", def: "Vaccinations-ID", typ: "xs:string", status: "nytt", testdata: "vacc-2024-10-01-001" },
      { grupp: "Body", falt: "vaccinationTime", def: "Vaccinationsdatum", typ: "TimeStampType", status: "finns", testdata: "4 vaccinationer: 2023-10-15 (2 st), 2024-10-01 (2 st)" },
      { grupp: "Body", falt: "atcCode", def: "ATC-kod", typ: "CVType", status: "finns", testdata: "J07BB02 (Influensa), J07AL01 (Pneumokock), J07BX03 (Covid-19)" },
      { grupp: "Body", falt: "productName", def: "Vaccinnamn", typ: "xs:string", status: "finns", testdata: "Vaxigrip Tetra, Pneumovax, Comirnaty" },
      { grupp: "Body", falt: "batchNumber", def: "Batchnummer", typ: "xs:string", status: "nytt", testdata: "KJ4829 (Vaxigrip), LM2847 (Pneumovax), FP8291 (Comirnaty)" },
      { grupp: "Body", falt: "administeringUnit.orgUnitHSAId", def: "Enhet HSA-ID", typ: "HSAIdType", status: "nytt", testdata: "SE2321000016-VC01 (VC Strangnas)" },
    ]
  },
  {
    id: "gfs",
    namn: "GetFunctionalStatus",
    version: "2.1",
    domain: "clinicalprocess:healthcond:description",
    desc: "Funktionstillstand: ICF-kodat, ADL, ECOG. Huvudsakligen kommunal omsorg men relevant for cancer.",
    variabler: [
      { grupp: "Body (NYTT)", falt: "observationCode", def: "Funktionskod", typ: "CVType", status: "nytt", testdata: "ECOG performance status: { code: 'ECOG-PS', displayName: 'ECOG performance status' }" },
      { grupp: "Body (NYTT)", falt: "observationValue", def: "Bedomningsvarde", typ: "xs:string", status: "nytt", testdata: "2024-04-02: '0' (Fullt aktiv). 2024-09-12: '1' (Begransad fysiskt kraftig aktivitet). 2025-06-15: '1'" },
      { grupp: "Body (NYTT)", falt: "observationTime", def: "Bedomningstid", typ: "TimeStampType", status: "nytt", testdata: "2024-04-02, 2024-09-12, 2025-06-15" },
    ]
  },
  {
    id: "gcp",
    namn: "GetCarePlans",
    version: "2.0",
    domain: "clinicalprocess:logistics:logistics",
    desc: "Vardplaner: Min vardplan (cancer), egenvardplan (diabetes). Strukturerad med giltighetsperiod.",
    variabler: [
      { grupp: "Body (NYTT)", falt: "carePlanType", def: "Typ av vardplan", typ: "CVType", status: "nytt", testdata: "{ code: 'MVP', displayName: 'Min vardplan' }" },
      { grupp: "Body (NYTT)", falt: "carePlanTitle", def: "Titel", typ: "xs:string", status: "nytt", testdata: "'Min vardplan - Prostatacancer med ADT'" },
      { grupp: "Body (NYTT)", falt: "carePlanText", def: "Innehall", typ: "xs:string", status: "nytt", testdata: "Mal: Fullfolja stralbehandling + 24 man ADT. Kontakter: urolog var 6 man (PSA), onkolog vid behov, endokrinolog var 3 man (HbA1c, metabol uppfoljning). Egenvard: blodsockermonitorering dagligen, fysisk aktivitet 30 min/dag, styrketraning 2-3 ggr/v. Kontaktuppgifter: Kontaktsjukskoterska onkologi 016-XXXXXX." },
      { grupp: "Body (NYTT)", falt: "validFrom", def: "Giltighet fran", typ: "DateTime", status: "nytt", testdata: "2024-04-10" },
      { grupp: "Body (NYTT)", falt: "validTo", def: "Giltighet till", typ: "DateTime", status: "nytt", testdata: "2026-06-30 (ADT-slut)" },
      { grupp: "Body (NYTT)", falt: "responsibleHsaId", def: "Ansvarig HSA-ID", typ: "HSAIdType", status: "nytt", testdata: "SE2321000016-PRS001 (Dr Johansson, urologi)" },
    ]
  },
  {
    id: "gra",
    namn: "GetRequestActivities",
    version: "2.0",
    domain: "crm:requeststatus",
    desc: "Remisstatusar: skickad, mottagen, besvarad. Sparar remissfloden.",
    variabler: [
      { grupp: "Body (NYTT)", falt: "SVF-remiss VC -> Urologi", def: "2024-01-22", typ: "status", status: "nytt", testdata: "Skickad 2024-01-22, Mottagen 2024-01-24, Tid bokad 2024-02-08. Ledtid: 12 dagar." },
      { grupp: "Body (NYTT)", falt: "Remiss Urologi -> Onkologi", def: "2024-04-10", typ: "status", status: "nytt", testdata: "Skickad 2024-04-10, Mottagen 2024-04-12, Besvarad 2024-05-15." },
      { grupp: "Body (NYTT)", falt: "Remiss Endokrin -> Dietist", def: "2024-09-12", typ: "status", status: "nytt", testdata: "Skickad 2024-09-12, Mottagen 2024-09-18. Ej annu genomford." },
      { grupp: "Body (NYTT)", falt: "Remiss Urologi -> Fysioterapi", def: "2025-06-15", typ: "status", status: "nytt", testdata: "Skickad 2025-06-15. Status: Vantande." },
    ]
  },
  {
    id: "gmmh",
    namn: "GetMaternityMedicalHistory",
    version: "2.0",
    domain: "clinicalprocess:healthcond:actoutcome",
    desc: "Modravard: graviditet, forlossning, eftervard.",
    variabler: [
      { grupp: "-", falt: "(alla variabler)", def: "Modravardsdokumentation", typ: "-", status: "ej-relevant", testdata: "Ej relevant - manlig patient." },
    ]
  },
  {
    id: "go",
    namn: "GetObservations",
    version: "1.0",
    domain: "clinicalprocess:healthcond:basic",
    desc: "Tillvaxtkurvor: langd, vikt, huvudomfang for barn.",
    variabler: [
      { grupp: "-", falt: "(alla variabler)", def: "Tillvaxtkurvor", typ: "-", status: "ej-relevant", testdata: "Ej relevant - vuxen patient (53 ar). Kontraktet ar for pediatriska tillvaxtdata." },
    ]
  },
];

function StatusTag(props) {
  var s = props.status;
  if (s === "finns") return (<span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: 700, background: "#dcfce7", color: "#166534" }}>Befintlig</span>);
  if (s === "nytt") return (<span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: 700, background: "#dbeafe", color: "#1e40af" }}>Ny / Gap-fylld</span>);
  if (s === "delvis") return (<span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: 700, background: "#fef9c3", color: "#854d0e" }}>Delvis</span>);
  if (s === "ej-relevant") return (<span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: 700, background: "#f3f4f6", color: "#9ca3af" }}>Ej relevant</span>);
  return null;
}


function NPOTab() {
  var expState = useState(null);
  var expanded = expState[0];
  var setExpanded = expState[1];
  var filterState = useState("alla");
  var filter = filterState[0];
  var setFilter = filterState[1];

  var totFinns = 0, totNytt = 0, totDelvis = 0, totEjRel = 0;
  KONTRAKT.forEach(function(k) {
    k.variabler.forEach(function(v) {
      if (v.status === "finns") totFinns++;
      else if (v.status === "nytt") totNytt++;
      else if (v.status === "delvis") totDelvis++;
      else if (v.status === "ej-relevant") totEjRel++;
    });
  });

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "10px 16px", background: "white", borderBottom: "1px solid #e2e8f0", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>NPÖ-variabellista: Erik Testsson (P001)</div>
        <div style={{ fontSize: 10, color: "#64748b" }}>Alla 14 tjänstekontrakt med testdata — visar hur kohortens data mappar till NPÖ</div>
        <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
          <div style={{ padding: "3px 8px", borderRadius: 4, background: "#dcfce7", color: "#166534", fontSize: 10, fontWeight: 700 }}>Befintlig: {totFinns}</div>
          <div style={{ padding: "3px 8px", borderRadius: 4, background: "#dbeafe", color: "#1e40af", fontSize: 10, fontWeight: 700 }}>Gap-fylld: {totNytt}</div>
          <div style={{ padding: "3px 8px", borderRadius: 4, background: "#fef9c3", color: "#854d0e", fontSize: 10, fontWeight: 700 }}>Delvis: {totDelvis}</div>
          <div style={{ padding: "3px 8px", borderRadius: 4, background: "#f3f4f6", color: "#9ca3af", fontSize: 10, fontWeight: 700 }}>Ej relevant: {totEjRel}</div>
        </div>
        <div style={{ fontSize: 10, color: "#94a3b8" }}>Totalt {totFinns + totNytt + totDelvis + totEjRel} variabler</div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          {["alla", "nytt", "finns", "ej-relevant"].map(function(f) {
            return (
              <button key={f} onClick={function() { setFilter(f); }} style={{
                padding: "3px 8px", fontSize: 10, fontWeight: 600, borderRadius: 4, cursor: "pointer",
                border: filter === f ? "1px solid #1a365d" : "1px solid #d1d5db",
                background: filter === f ? "#1a365d" : "white",
                color: filter === f ? "white" : "#555"
              }}>{f === "alla" ? "Alla" : f === "nytt" ? "Bara nya" : f === "finns" ? "Befintliga" : "Ej rel."}</button>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px" }}>
        {KONTRAKT.map(function(k, ki) {
          var filtered = k.variabler.filter(function(v) {
            if (filter === "alla") return true;
            return v.status === filter;
          });
          if (filter !== "alla" && filtered.length === 0) return null;

          var nFinns = k.variabler.filter(function(v) { return v.status === "finns"; }).length;
          var nNytt = k.variabler.filter(function(v) { return v.status === "nytt"; }).length;
          var nEj = k.variabler.filter(function(v) { return v.status === "ej-relevant"; }).length;
          var isExp = expanded === ki;

          return (
            <div key={ki} style={{ marginBottom: 6, background: "white", borderRadius: 6, border: "1px solid #e2e8f0", overflow: "hidden", opacity: nEj === k.variabler.length ? 0.5 : 1 }}>
              <div onClick={function() { setExpanded(isExp ? null : ki); }}
                style={{ padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, background: isExp ? "#f8fafc" : "white" }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: "#1a365d", minWidth: 250 }}>{k.namn}</span>
                <span style={{ fontSize: 9, color: "#888", fontFamily: "monospace" }}>v{k.version}</span>
                {nFinns > 0 && <span style={{ padding: "1px 5px", borderRadius: 3, fontSize: 8, fontWeight: 600, background: "#dcfce7", color: "#166534" }}>{nFinns}</span>}
                {nNytt > 0 && <span style={{ padding: "1px 5px", borderRadius: 3, fontSize: 8, fontWeight: 600, background: "#dbeafe", color: "#1e40af" }}>{nNytt} ny</span>}
                {nEj > 0 && <span style={{ padding: "1px 5px", borderRadius: 3, fontSize: 8, fontWeight: 600, background: "#f3f4f6", color: "#9ca3af" }}>ej rel</span>}
                <span style={{ flex: 1, fontSize: 10, color: "#888", marginLeft: 8 }}>{k.desc}</span>
                <span style={{ fontSize: 14, color: "#aaa" }}>{isExp ? "\u25BE" : "\u25B8"}</span>
              </div>
              {isExp && (
                <div style={{ borderTop: "1px solid #e2e8f0" }}>
                  <div style={{ padding: "6px 12px", fontSize: 9, color: "#888", background: "#f8fafc" }}>Domain: {k.domain}</div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: "#f1f5f9" }}>
                        <th style={{ padding: "5px 8px", textAlign: "left", fontWeight: 700, color: "#1a365d", width: "8%" }}>Grupp</th>
                        <th style={{ padding: "5px 8px", textAlign: "left", fontWeight: 700, width: "22%" }}>Variabel</th>
                        <th style={{ padding: "5px 8px", textAlign: "left", fontWeight: 700, width: "14%" }}>Definition</th>
                        <th style={{ padding: "5px 8px", textAlign: "center", fontWeight: 700, width: "8%" }}>Status</th>
                        <th style={{ padding: "5px 8px", textAlign: "left", fontWeight: 700, width: "48%" }}>Testdata (Erik Testsson)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(function(v, vi) {
                        var isNew = v.status === "nytt";
                        var isGap = v.falt.indexOf("NYTT:") === 0;
                        return (
                          <tr key={vi} style={{ background: isGap ? "#eff6ff" : isNew ? "#f8fbff" : (vi % 2 ? "#fafbfc" : "white") }}>
                            <td style={{ padding: "4px 8px", borderTop: "1px solid #f1f5f9", fontSize: 9, color: "#888" }}>{v.grupp}</td>
                            <td style={{ padding: "4px 8px", borderTop: "1px solid #f1f5f9", fontFamily: "monospace", fontSize: 10, fontWeight: isGap ? 700 : 500, color: isGap ? "#1e40af" : "#334155" }}>{v.falt}</td>
                            <td style={{ padding: "4px 8px", borderTop: "1px solid #f1f5f9", fontSize: 10, color: "#555" }}>{v.def}</td>
                            <td style={{ padding: "4px 8px", borderTop: "1px solid #f1f5f9", textAlign: "center" }}><StatusTag status={v.status} /></td>
                            <td style={{ padding: "4px 8px", borderTop: "1px solid #f1f5f9", fontSize: 10, color: isNew ? "#1e40af" : "#334155", lineHeight: 1.4, maxWidth: 500, wordBreak: "break-word" }}>{v.testdata}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ========== TESTPROTOKOLL TAB ==========
function TestprotokollTab() {
  var dataS = useState(null); var data = dataS[0]; var setData = dataS[1];
  var loadingS = useState(false); var isLoading = loadingS[0]; var setIsLoading = loadingS[1];
  var errorS = useState(null); var error = errorS[0]; var setError = errorS[1];
  var searchS = useState(""); var search = searchS[0]; var setSearch = searchS[1];
  var editingS = useState(null); var editing = editingS[0]; var setEditing = editingS[1];
  var editTextS = useState(""); var editText = editTextS[0]; var setEditText = editTextS[1];

  function loadData() {
    setIsLoading(true);
    fetch("/api/protocol")
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.error) { setError(d.error); }
        else { setData(d.entries || []); }
        setIsLoading(false);
      })
      .catch(function(err) { setError(err.message); setIsLoading(false); });
  }

  useEffect(function() { loadData(); }, []);

  function saveComment(id) {
    fetch("/api/protocol", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: id, comment: editText })
    }).then(function() { setEditing(null); loadData(); });
  }

  function deleteEntry(id) {
    if (!confirm("Ta bort denna testpost?")) return;
    fetch("/api/protocol", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: id })
    }).then(function() { loadData(); });
  }

  if (isLoading && !data) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: 12 }}>Laddar testprotokoll…</div>
  );

  if (error) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#dc2626", marginBottom: 4 }}>Kunde inte ladda testprotokoll</div>
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>{error}</div>
        <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 12, lineHeight: 1.6, maxWidth: 400 }}>
          Testprotokollet kräver en Redis-databas (Upstash). Kontrollera att databasen är kopplad till projektet i Vercel Dashboard → Storage och att miljövariablerna finns. Redeploya sedan.
        </div>
        <button onClick={function(){ setError(null); loadData(); }} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #cbd5e1", background: "white", color: "#334155", fontSize: 11, cursor: "pointer" }}>Försök igen</button>
      </div>
    </div>
  );

  var entries = data || [];
  var filtered = search ? entries.filter(function(e) {
    var s = search.toLowerCase();
    return (e.question && e.question.toLowerCase().indexOf(s) >= 0) ||
           (e.kohort && e.kohort.toLowerCase().indexOf(s) >= 0) ||
           (e.pubmed && e.pubmed.toLowerCase().indexOf(s) >= 0) ||
           (e.syntes && e.syntes.toLowerCase().indexOf(s) >= 0) ||
           (e.comment && e.comment.toLowerCase().indexOf(s) >= 0);
  }) : entries;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "10px 16px", background: "white", borderBottom: "1px solid #e2e8f0", display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>Testprotokoll</div>
          <div style={{ fontSize: 10, color: "#64748b" }}>{entries.length} sparade tester{filtered.length !== entries.length ? " (" + filtered.length + " visas)" : ""}</div>
        </div>
        <input type="text" value={search} onChange={function(e){setSearch(e.target.value);}} placeholder="Sök i frågor, svar och kommentarer…"
          style={{ flex: 1, padding: "6px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 11, outline: "none", background: "white", maxWidth: 400 }} />
        <button onClick={loadData} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #cbd5e1", background: "white", color: "#334155", fontSize: 10, cursor: "pointer" }}>Uppdatera</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 12px" }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", color: "#94a3b8", padding: 40, fontSize: 12 }}>
            {entries.length === 0 ? "Inga tester sparade ännu. Ställ en fråga i Analys-fliken och klicka 'Spara till testprotokoll'." : "Inga resultat matchar sökningen."}
          </div>
        )}

        {filtered.map(function(e, i) {
          var ts = new Date(e.timestamp);
          var dateStr = ts.toLocaleDateString("sv-SE") + " " + ts.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
          var isEditing = editing === e.id;

          return (
            <div key={e.id} style={{ marginTop: 10, background: "white", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ padding: "8px 12px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, color: "#94a3b8", minWidth: 120 }}>{dateStr}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#1a365d", flex: 1 }}>{e.question}</span>
                {e.src && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 3, background: e.src === "kohort" ? "#E6F1FB" : e.src === "pubmed" ? "#E1F5EE" : "#FAF5FF", color: e.src === "kohort" ? "#0C447C" : e.src === "pubmed" ? "#04342C" : "#26215C" }}>{e.src}</span>}
                <button onClick={function(){deleteEntry(e.id);}} style={{ padding: "2px 8px", borderRadius: 4, border: "1px solid #fecaca", background: "white", color: "#dc2626", fontSize: 9, cursor: "pointer" }}>Ta bort</button>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <tbody>
                  {e.kohort && (
                    <tr>
                      <td style={{ padding: "6px 12px", width: 100, verticalAlign: "top", borderRight: "3px solid #2563eb", background: "#f7f9ff", fontWeight: 600, fontSize: 10, color: "#0C447C" }}>Kohort</td>
                      <td style={{ padding: "6px 12px", lineHeight: 1.5, color: "#334155" }}>{e.kohort.length > 300 ? e.kohort.substring(0, 300) + "…" : e.kohort}</td>
                    </tr>
                  )}
                  {e.pubmed && (
                    <tr>
                      <td style={{ padding: "6px 12px", width: 100, verticalAlign: "top", borderRight: "3px solid #059669", background: "#f4fdf9", fontWeight: 600, fontSize: 10, color: "#04342C" }}>PubMed</td>
                      <td style={{ padding: "6px 12px", lineHeight: 1.5, color: "#334155" }}>{e.pubmed.length > 300 ? e.pubmed.substring(0, 300) + "…" : e.pubmed}</td>
                    </tr>
                  )}
                  {e.syntes && (
                    <tr>
                      <td style={{ padding: "6px 12px", width: 100, verticalAlign: "top", borderRight: "3px solid #7c3aed", background: "#faf5ff", fontWeight: 600, fontSize: 10, color: "#26215C" }}>Syntes</td>
                      <td style={{ padding: "6px 12px", lineHeight: 1.5, color: "#334155" }}>{e.syntes.length > 300 ? e.syntes.substring(0, 300) + "…" : e.syntes}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ padding: "6px 12px", width: 100, verticalAlign: "top", borderRight: "3px solid #b45309", background: "#fffbeb", fontWeight: 600, fontSize: 10, color: "#92400e" }}>Kommentar</td>
                    <td style={{ padding: "6px 12px" }}>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <input type="text" value={editText} onChange={function(ev){setEditText(ev.target.value);}}
                            onKeyDown={function(ev){if(ev.key==="Enter")saveComment(e.id);}}
                            style={{ flex: 1, padding: "4px 8px", borderRadius: 4, border: "1px solid #cbd5e1", fontSize: 11, outline: "none" }} autoFocus />
                          <button onClick={function(){saveComment(e.id);}} style={{ padding: "4px 10px", borderRadius: 4, border: "none", background: "#059669", color: "white", fontSize: 10, cursor: "pointer" }}>Spara</button>
                          <button onClick={function(){setEditing(null);}} style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid #cbd5e1", background: "white", color: "#64748b", fontSize: 10, cursor: "pointer" }}>Avbryt</button>
                        </div>
                      ) : (
                        <div onClick={function(){setEditing(e.id);setEditText(e.comment||"");}} style={{ cursor: "pointer", minHeight: 20, color: e.comment ? "#334155" : "#cbd5e1", fontSize: 11, lineHeight: 1.5 }}>
                          {e.comment || "Klicka för att lägga till kommentar…"}
                        </div>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ========== MAIN APP ==========
export default function App() {
  var msgsS = useState([]); var msgs = msgsS[0]; var setMsgs = msgsS[1];
  var inputS = useState(""); var input = inputS[0]; var setInput = inputS[1];
  var loadS = useState(false); var loading = loadS[0]; var setLoading = loadS[1];
  var chartsS = useState([]); var charts = chartsS[0]; var setCharts = chartsS[1];
  var modeS = useState("text"); var mode = modeS[0]; var setMode = modeS[1];
  var srcS = useState("both"); var src = srcS[0]; var setSrc = srcS[1];
  var depthS = useState("snabb"); var depth = depthS[0]; var setDepth = depthS[1];
  var copiedS = useState(false); var copied = copiedS[0]; var setCopied = copiedS[1];
  var tabS = useState("analys"); var tab = tabS[0]; var setTab = tabS[1];
  var savedMsgsS = useState({}); var savedMsgs = savedMsgsS[0]; var setSavedMsgs = savedMsgsS[1];
  var endRef = useRef(null);
  var abortRef = useRef(null);
  var stepsS = useState({}); var steps = stepsS[0]; var setSteps = stepsS[1];

  useEffect(function() { if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" }); }, [msgs, steps]);

  function stop() { if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; } setLoading(false); }
  function clear() { stop(); setMsgs([]); setCharts([]); setSteps({}); }
  function doCopy() {
    var parts = [];
    msgs.forEach(function(m) { if (m.role === "user") parts.push("FRÅGA: " + m.content); });
    Object.keys(steps).forEach(function(k) {
      var s = steps[k];
      if (s.kohort) parts.push("KOHORTDATA:\n" + s.kohort);
      if (s.pubmed) parts.push("PUBMED-EVIDENS:\n" + s.pubmed);
      if (s.syntes) parts.push("SAMMANVÄGD BEDÖMNING:\n" + s.syntes);
      parts.push("---");
    });
    navigator.clipboard.writeText(parts.join("\n\n")).then(function() { setCopied(true); setTimeout(function(){setCopied(false);}, 2000); });
  }

  function saveToProtocol(msgIdx, question) {
    var s = steps[msgIdx];
    if (!s) return;
    setSavedMsgs(function(prev) { var n = Object.assign({}, prev); n[msgIdx] = "saving"; return n; });
    fetch("/api/protocol", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: question,
        kohort: s.kohort || "",
        pubmed: s.pubmed || "",
        syntes: s.syntes || "",
        mode: s.mode || "",
        src: s.src || "",
        depth: s.loading ? "" : "databas"
      })
    })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (d.ok) {
        setSavedMsgs(function(prev) { var n = Object.assign({}, prev); n[msgIdx] = "saved"; return n; });
      } else {
        setSavedMsgs(function(prev) { var n = Object.assign({}, prev); n[msgIdx] = "error"; return n; });
      }
    })
    .catch(function() {
      setSavedMsgs(function(prev) { var n = Object.assign({}, prev); n[msgIdx] = "error"; return n; });
    });
  }

  function send(text) {
    if (!text.trim() || loading) return;
    var q = text.trim();
    var currentMode = mode;
    var currentSrc = src;
    // depth inte längre relevant — Claude söker alltid all data via tool_use
    var userMsg = { role: "user", content: q };
    var newMsgs = msgs.concat([userMsg]);
    var msgIdx = newMsgs.length;
    setMsgs(newMsgs);
    setInput("");
    setLoading(true);

    var ctrl = new AbortController();
    abortRef.current = ctrl;

    // Diagram direkt (lokalt)
    var wantChart = (currentMode === "both" || currentMode === "viz");
    if (wantChart) {
      var chart = matchChart(q);
      if (chart) setCharts(function(prev) { return prev.concat([chart]); });
    }

    var wantKohort = (currentSrc === "kohort" || currentSrc === "both");
    var wantPubmed = (currentSrc === "pubmed" || currentSrc === "both");
    var wantSyntes = (currentSrc === "both");
    var firstLoading = wantKohort ? "kohort" : "pubmed";

    // Initiera steg-state ("both" visar båda som laddar parallellt)
    setSteps(function(prev) {
      var next = Object.assign({}, prev);
      next[msgIdx] = { kohort: null, pubmed: null, syntes: null, articles: null, totalFound: 0, mode: currentMode, src: currentSrc, loading: wantSyntes ? "both" : firstLoading };
      return next;
    });

    function done() { setLoading(false); }
    function fail(err) {
      var msg = err.name === "AbortError" ? "Avbruten." : "Fel: " + err.message;
      setSteps(function(prev) {
        var next = Object.assign({}, prev);
        var current = next[msgIdx] || {};
        next[msgIdx] = Object.assign({}, current, { loading: null });
        if (wantKohort && !current.kohort) next[msgIdx].kohort = msg;
        if (wantPubmed && !current.pubmed) next[msgIdx].pubmed = "PubMed-sökning misslyckades: " + msg;
        if (wantSyntes && current.kohort && current.pubmed && !current.syntes) next[msgIdx].syntes = "Sammanvägning misslyckades: " + msg;
        return next;
      });
      setLoading(false);
    }

    // ===== BARA KOHORT =====
    if (wantKohort && !wantPubmed) {
      kohortDbCall(q, wantChart, ctrl.signal).then(function(result) {
        if (result.vizzes && result.vizzes.length > 0) {
          setCharts(function(prev) { return prev.concat(result.vizzes); });
        }
        setSteps(function(prev) {
          var next = Object.assign({}, prev);
          next[msgIdx] = Object.assign({}, next[msgIdx], { kohort: result.text, toolTrace: result.toolTrace, loading: null });
          return next;
        });
        done();
      }).catch(fail);
      return;
    }

    // ===== BARA PUBMED =====
    if (wantPubmed && !wantKohort) {
      pubmedCall(q, ctrl.signal).then(function(pubmedResult) {
        setSteps(function(prev) {
          var next = Object.assign({}, prev);
          next[msgIdx] = Object.assign({}, next[msgIdx], {
            pubmed: pubmedResult.summary,
            articles: pubmedResult.articles,
            totalFound: pubmedResult.totalFound,
            loading: null
          });
          return next;
        });
        done();
      }).catch(fail);
      return;
    }

    // ===== BÅDA (kohort ∥ pubmed → syntes) =====
    var kohortPromise = kohortDbCall(q, wantChart, ctrl.signal).then(function(result) {
      if (result.vizzes && result.vizzes.length > 0) {
        setCharts(function(prev) { return prev.concat(result.vizzes); });
      }
      setSteps(function(prev) {
        var next = Object.assign({}, prev);
        next[msgIdx] = Object.assign({}, next[msgIdx], { kohort: result.text, toolTrace: result.toolTrace });
        return next;
      });
      return result;
    });

    var pubmedPromise = pubmedCall(q, ctrl.signal).then(function(pubmedResult) {
      setSteps(function(prev) {
        var next = Object.assign({}, prev);
        next[msgIdx] = Object.assign({}, next[msgIdx], {
          pubmed: pubmedResult.summary,
          articles: pubmedResult.articles,
          totalFound: pubmedResult.totalFound
        });
        return next;
      });
      return pubmedResult;
    });

    Promise.all([kohortPromise, pubmedPromise])
    .then(function(results) {
      var kohortResult = results[0];
      var pubmedResult = results[1];
      setSteps(function(prev) {
        var next = Object.assign({}, prev);
        next[msgIdx] = Object.assign({}, next[msgIdx], { loading: "syntes" });
        return next;
      });
      var syntesPrompt = buildSyntesPrompt(kohortResult.text, pubmedResult.summary, q);
      return apiCall(syntesPrompt, q, ctrl.signal);
    })
    .then(function(syntesResult) {
      if (syntesResult.vizzes && syntesResult.vizzes.length > 0) {
        setCharts(function(prev) { return prev.concat(syntesResult.vizzes); });
      }
      setSteps(function(prev) {
        var next = Object.assign({}, prev);
        next[msgIdx] = Object.assign({}, next[msgIdx], { syntes: syntesResult.text, loading: null });
        return next;
      });
      done();
    })
    .catch(fail);
  }

  // ========== RENDER ==========
  var d = COHORT; var dm = d.diabetes.type_distribution;

  function renderResponse(msgIdx, question) {
    var s = steps[msgIdx];
    if (!s) return null;
    var m = s.mode || "text";
    var saveStatus = savedMsgs[msgIdx];
    var isDone = !s.loading;

    var saveBtn = isDone ? (
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4, marginBottom: 4 }}>
        {saveStatus === "saved" ? (
          <span style={{ fontSize: 10, color: "#059669", fontWeight: 600 }}>Sparat i protokoll</span>
        ) : saveStatus === "saving" ? (
          <span style={{ fontSize: 10, color: "#94a3b8" }}>Sparar...</span>
        ) : saveStatus === "error" ? (
          <span style={{ fontSize: 10, color: "#dc2626" }}>Fel vid sparning — KV-databas konfigurerad?</span>
        ) : (
          <button onClick={function() { saveToProtocol(msgIdx, question); }} style={{
            padding: "3px 10px", borderRadius: 4, border: "1px solid #cbd5e1", background: "white",
            color: "#334155", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 4
          }}
          onMouseOver={function(e){e.currentTarget.style.borderColor="#059669";e.currentTarget.style.color="#059669";}}
          onMouseOut={function(e){e.currentTarget.style.borderColor="#cbd5e1";e.currentTarget.style.color="#334155";}}
          >Spara till testprotokoll</button>
        )}
      </div>
    ) : null;

    if (m === "viz") {
      var brief = s.syntes || s.kohort || "";
      if (brief && brief.length > 200) brief = brief.substring(0, 200) + "…";
      if (s.loading && !brief) {
        return (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic", padding: "4px 0" }}>Analyserar…</div>
          </div>
        );
      }
      return (
        <div style={{ marginBottom: 12 }}>
          {brief && <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5, padding: "4px 0", fontStyle: "italic" }}>{brief}</div>}
          {saveBtn}
        </div>
      );
    }

    var sc = s.src || "both";
    var showK = (sc === "kohort" || sc === "both");
    var showP = (sc === "pubmed" || sc === "both");
    var showS = (sc === "both");

    return (
      <div style={{ marginBottom: 12 }}>
        {showK && (s.kohort ? <Section type="kohort" text={s.kohort} /> : (s.loading === "kohort" || s.loading === "both") ? <Section type="kohort" loading={true} loadingText="S\u00F6ker i kohortdatabas via tool_use\u2026" /> : null)}
        {showK && s.toolTrace && <ToolTracePanel trace={s.toolTrace} />}
        {showP && (s.pubmed ? <Section type="pubmed" text={s.pubmed} articles={s.articles} totalFound={s.totalFound} /> : (s.loading === "pubmed" || s.loading === "both") ? <Section type="pubmed" loading={true} loadingText="S\u00F6ker PubMed (E-utilities)\u2026" /> : null)}
        {showS && (s.syntes ? <Section type="syntes" text={s.syntes} /> : s.loading === "syntes" ? <Section type="syntes" loading={true} loadingText="Genererar sammanv\u00E4gd bed\u00F6mning\u2026" /> : null)}
        {saveBtn}
      </div>
    );
  }

  var TABS = [
    { k: "analys", l: "Analys", icon: "💬" },
    { k: "kohort", l: "Kohortdata", icon: "📊" },
    { k: "landskap", l: "PubMed-landskap", icon: "🔬" },
    { k: "npo", l: "NPÖ-variabler", icon: "🔗" },
    { k: "protokoll", l: "Testprotokoll", icon: "📝" },
    { k: "lathund", l: "Lathund", icon: "📋" }
  ];

  return (
    <div style={{ fontFamily: "Segoe UI,system-ui,sans-serif", background: "#f0f2f5", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      <div style={{ background: "linear-gradient(135deg,#1a365d 0%,#2d5986 100%)", color: "white", padding: "10px 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Kohortanalys + Evidens</div>
          <div style={{ fontSize: 10, opacity: 0.6, borderLeft: "1px solid rgba(255,255,255,0.3)", paddingLeft: 8 }}>{d.n} patienter | Prostatacancer + Diabetes | KCHD POC</div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 5 }}>
            <span style={{ fontSize: 8, background: "#2563eb", padding: "2px 7px", borderRadius: 3 }}>Kohortdata (syntetisk)</span>
            <span style={{ fontSize: 8, background: "#059669", padding: "2px 7px", borderRadius: 3 }}>PubMed E-utilities</span>
            <span style={{ fontSize: 8, background: "#7c3aed", padding: "2px 7px", borderRadius: 3 }}>Sammanvägd bedömning</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 0, marginTop: 8 }}>
          {TABS.map(function(t) {
            var active = tab === t.k;
            return <button key={t.k} onClick={function(){setTab(t.k);}} style={{
              padding: "6px 16px", fontSize: 12, fontWeight: active ? 600 : 400, border: "none", cursor: "pointer",
              background: active ? "rgba(255,255,255,0.15)" : "transparent",
              color: active ? "white" : "rgba(255,255,255,0.6)",
              borderBottom: active ? "2px solid white" : "2px solid transparent",
              borderRadius: "4px 4px 0 0"
            }}>{t.l}</button>;
          })}
        </div>
      </div>

      {tab === "analys" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ padding: "6px 16px", display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
            <Metric label="Patienter" value={d.n} sub={"Ålder " + d.demographics.age_range + " år"} />
            <Metric label="DM typ 1/2" value={(dm.T1 || 0) + "/" + (dm.T2 || 0)} sub="15%/85%" />
            <Metric label="HbA1c baseline" value={d.diabetes.hba1c_baseline_mean} sub="mmol/mol" color="#b45309" />
            <Metric label="PSA diagnos" value={d.cancer.psa_at_diagnosis.median} sub="median µg/L" color="#dc2626" />
            <Metric label="HbA1c ADT-effekt" value={"+" + (Math.round((d.labs_summary.hba1c_mean_with_adt - d.labs_summary.hba1c_mean_without_adt) * 10) / 10)} sub="mmol/mol" color="#dc2626" />
          </div>

          <div style={{ flex: 1, display: "flex", gap: 10, padding: "0 16px 10px", minHeight: 0 }}>
            <div style={{ flex: 3, display: "flex", flexDirection: "column", minWidth: 0 }}>
              <div style={{ flex: 1, background: "white", borderRadius: 10, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ padding: "6px 12px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 14, alignItems: "center", background: "#fafbfc", flexShrink: 0 }}>
                  {[{ c: "#2563eb", t: "Blå = kohort" }, { c: "#059669", t: "Grön = PubMed" }, { c: "#7c3aed", t: "Lila = sammanvägd" }].map(function(l, i) {
                    return <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 7, height: 7, borderRadius: 2, background: l.c }} /><span style={{ fontSize: 9, color: "#64748b" }}>{l.t}</span></div>;
                  })}
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: 12, minHeight: 0 }}>
                  {msgs.length === 0 && (
                    <div>
                      <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 11, marginBottom: 10, marginTop: 4 }}>Ställ en fråga — svaret visas stegvis: kohort → PubMed → bedömning</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, justifyContent: "center" }}>
                        {EXAMPLES.map(function(q, i) {
                          return <button key={i} onClick={function(){send(q);}} style={{ padding: "6px 9px", borderRadius: 6, border: "1px solid #cbd5e1", background: "white", color: "#334155", fontSize: 10, cursor: "pointer", textAlign: "left", maxWidth: 260, lineHeight: 1.35 }}
                            onMouseOver={function(e){e.target.style.borderColor="#2563eb";e.target.style.background="#f8fafc";}}
                            onMouseOut={function(e){e.target.style.borderColor="#cbd5e1";e.target.style.background="white";}}
                          >{q}</button>;
                        })}
                      </div>
                    </div>
                  )}
                  {msgs.map(function(msg, i) {
                    if (msg.role === "user") {
                      var respIdx = i + 1;
                      return (
                        <div key={i}>
                          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                            <div style={{ maxWidth: "85%", padding: "8px 14px", borderRadius: "14px 14px 4px 14px", background: "#1a365d", color: "white", fontSize: 12.5, lineHeight: 1.5 }}>{msg.content}</div>
                          </div>
                          {steps[respIdx] && renderResponse(respIdx, msg.content)}
                        </div>
                      );
                    }
                    return null;
                  })}
                  {loading && !steps[msgs.length] && (
                    <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "8px 0", color: "#64748b", fontSize: 11 }}>
                      <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #e2e8f0", borderTopColor: "#2563eb", animation: "spin 1s linear infinite" }} />
                      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
                      Startar analys…
                    </div>
                  )}
                  <div ref={endRef} />
                </div>
                <div style={{ borderTop: "1px solid #e2e8f0", padding: 8, background: "#fafbfc", flexShrink: 0 }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                    <input type="text" value={input} onChange={function(e){setInput(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")send(input);}}
                      placeholder="Ställ en fråga — kohortanalys + PubMed-evidens…"
                      style={{ flex: 1, padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, outline: "none", background: "white" }} />
                    {!loading ? (
                      <button onClick={function(){send(input);}} disabled={!input.trim()} style={{ padding: "8px 14px", borderRadius: 6, background: !input.trim() ? "#94a3b8" : "#1a365d", color: "white", border: "none", fontSize: 12, fontWeight: 600, cursor: !input.trim() ? "not-allowed" : "pointer" }}>Skicka</button>
                    ) : (
                      <button onClick={stop} style={{ padding: "8px 14px", borderRadius: 6, background: "#dc2626", color: "white", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Stoppa</button>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, color: "#94a3b8" }}>Svarsformat:</span>
                    <div style={{ display: "flex", gap: 0, background: "#e2e8f0", borderRadius: 6, padding: 2 }}>
                      {[{ k: "text", l: "Bara text" }, { k: "both", l: "Text + diagram" }, { k: "viz", l: "Bara diagram" }].map(function(o) {
                        return <button key={o.k} onClick={function(){setMode(o.k);}} style={{ padding: "8px 14px", fontSize: 12, fontWeight: 600, borderRadius: 4, border: "none", cursor: "pointer", background: mode === o.k ? "#1a365d" : "transparent", color: mode === o.k ? "white" : "#64748b" }}>{o.l}</button>;
                      })}
                    </div>
                    <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 4 }}>Källa:</span>
                    <div style={{ display: "flex", gap: 0, background: "#e2e8f0", borderRadius: 6, padding: 2 }}>
                      {[
                        { k: "kohort", l: "Kohort", bg: "#2563eb" },
                        { k: "pubmed", l: "PubMed", bg: "#059669" },
                        { k: "both", l: "Båda + syntes", bg: "#7c3aed" }
                      ].map(function(o) {
                        var active = src === o.k;
                        return <button key={o.k} onClick={function(){setSrc(o.k);}} style={{ padding: "8px 14px", fontSize: 12, fontWeight: 600, borderRadius: 4, border: "none", cursor: "pointer", background: active ? o.bg : "transparent", color: active ? "white" : "#64748b" }}>{o.l}</button>;
                      })}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 4, padding: "4px 10px", background: "#f0fdf4", borderRadius: 6, border: "1px solid #bbf7d0" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                      <span style={{ fontSize: 10, color: "#15803d", fontWeight: 600 }}>DATABAS</span>
                      <span style={{ fontSize: 9, color: "#4ade80" }}>tool_use</span>
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                      <button onClick={doCopy} disabled={msgs.length === 0} style={{ padding: "6px 12px", borderRadius: 6, background: copied ? "#059669" : "white", color: copied ? "white" : msgs.length === 0 ? "#cbd5e1" : "#334155", border: "1px solid " + (copied ? "#059669" : "#cbd5e1"), fontSize: 11, fontWeight: 500, cursor: msgs.length === 0 ? "default" : "pointer" }}>{copied ? "Kopierat!" : "Kopiera"}</button>
                      <button onClick={clear} disabled={msgs.length === 0 && !loading} style={{ padding: "6px 12px", borderRadius: 6, background: "white", color: (msgs.length === 0 && !loading) ? "#cbd5e1" : "#dc2626", border: "1px solid " + ((msgs.length === 0 && !loading) ? "#e2e8f0" : "#fecaca"), fontSize: 11, fontWeight: 500, cursor: (msgs.length === 0 && !loading) ? "default" : "pointer" }}>Rensa chatt</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ flex: 2, display: "flex", flexDirection: "column", minWidth: 0 }}>
              <div style={{ flex: 1, background: "white", borderRadius: 10, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ padding: "6px 12px", borderBottom: "1px solid #f1f5f9", background: "#fafbfc", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#1e293b" }}>Visualisering</span>
                  {charts.length > 0 && <span style={{ fontSize: 9, color: "#94a3b8" }}>{charts.length} diagram</span>}
                </div>
                <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                  {mode === "text" && charts.length === 0 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", fontSize: 12, textAlign: "center", padding: 30 }}>
                      <div><div style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}>☰</div>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>Diagram är avstängt</div>
                        <div style={{ fontSize: 11, opacity: 0.7, lineHeight: 1.5 }}>Välj <strong>Text + diagram</strong> eller <strong>Bara diagram</strong></div></div>
                    </div>)}
                  {mode !== "text" && charts.length === 0 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", fontSize: 12, textAlign: "center", padding: 30 }}>
                      <div><div style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}>☰</div><div>Ställ en fråga så genereras ett diagram</div></div>
                    </div>)}
                  {charts.map(function(ch, i) { return <div key={i} style={{ borderBottom: i < charts.length - 1 ? "1px solid #f1f5f9" : "none" }}>{ch.vizType === "table" ? <TableVis data={ch} /> : <ChartVis data={ch} />}</div>; })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "kohort" && <KohortDataTab />}
      {tab === "landskap" && <PubMedLandskapsTab />}
      {tab === "npo" && <NPOTab />}
      {tab === "protokoll" && <TestprotokollTab />}
      {tab === "lathund" && <LathundTab />}

      <div style={{ padding: "4px 16px 8px", fontSize: 8, color: "#94a3b8", textAlign: "center", flexShrink: 0 }}>
        KCHD / SKR POC | Kohortdata = syntetisk | PubMed-evidens = riktig publicerad forskning | Mars 2026
      </div>
    </div>
  );
}
