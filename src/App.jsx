import { useState, useRef, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

var COHORT = {"cohort_description": "100 män 50-65 år med prostatacancer (C61) + insulinbehandlad diabetes (E10/E11). Syntetisk data baserad på svensk epidemiologi.", "n": 100, "demographics": {"age_mean": 56.9, "age_range": "50-65", "age_distribution": {"60-64": 25, "55-59": 34, "50-54": 36, "65-69": 5}}, "cancer": {"risk_groups": {"intermediate_fav": 20, "very_high_metastatic": 15, "very_low": 10, "high": 20, "intermediate_unfav": 20, "low": 15}, "gleason_distribution": {"3+4=7": 29, "5+4=9": 8, "3+3=6": 25, "4+4=8": 15, "4+3=7": 20, "4+5=9": 3}, "psa_at_diagnosis": {"mean": 29.9, "median": 10.3, "range": "2.7-192.6"}}, "diabetes": {"type_distribution": {"T2": 85, "T1": 15}, "duration_mean": 15.0, "hba1c_baseline_mean": 59.2, "hba1c_baseline_range": "42-77"}, "treatments": {"distribution": {"EBRT": 10, "RALP": 26, "EBRT_ADT": 29, "active_surveillance": 16, "RALP_adj": 7, "palliative": 5, "ADT_only": 3, "ADT_chemo": 4}}, "outcomes": {"distribution": {"curative_good": 24, "deceased_other": 4, "stable_AS": 13, "curative_side_effects": 16, "local_progression": 12, "biochemical_recurrence": 17, "partial_response": 4, "deceased_cancer": 6, "reclassified_to_treatment": 3, "progression": 1}}, "labs_summary": {"psa_by_treatment": {"EBRT": {"baseline": 2.3, "nadir": 0.17, "latest": 0.36}, "RALP": {"baseline": 2.14, "nadir": 0.03, "latest": 0.21}, "EBRT_ADT": {"baseline": 13.6, "nadir": 0.03, "latest": 0.88}, "active_surveillance": {"baseline": 0.73, "nadir": 0.71, "latest": 5.44}, "RALP_adj": {"baseline": 10.47, "nadir": 0.03, "latest": 0.23}, "palliative": {"baseline": 62.77, "nadir": 6.4, "latest": 6.77}, "ADT_only": {"baseline": 48.49, "nadir": 0.01, "latest": 0.01}, "ADT_chemo": {"baseline": 69.08, "nadir": 0.0, "latest": 0.08}}, "hba1c_change_with_adt": 6.5, "hba1c_change_without_adt": 0.7}, "medications_summary": {"drug_frequency": {"A10BA02 Metformin": 85, "C10AA05 Atorvastatin": 70, "A12AX Kalcipos-D forte": 43, "C09AA02 Enalapril": 39, "L02BB01 Bikalutamid": 34, "A10AE04 Lantus (insulin glargin)": 31, "C09CA01 Losartan": 29, "B01AC06 Trombyl (ASA)": 25, "C08CA01 Amlodipin": 25, "A10AE05 Levemir (insulin detemir)": 24, "A10AE04 Toujeo (insulin glargin 300)": 24, "G04BE03 Sildenafil": 23, "A10AE06 Tresiba (insulin degludek)": 21, "L02AE02 Leuprorelin (Eligard)": 20, "A10AB04 Humalog (insulin lispro)": 14, "L02AE03 Goserelin (Zoladex)": 14, "A10AB06 Apidra (insulin glulisin)": 14, "A10AB05 Fiasp (insulin aspart)": 13, "A10AB05 NovoRapid (insulin aspart)": 13, "A10BK01 Jardiance (empagliflozin)": 11}}, "complications": {"comorbidity_counts": {"hypertoni": 65, "hyperkolesterolemi": 45, "retinopati": 28, "nefropati": 19, "neuropati": 16, "kardiovaskulart": 13, "overvikt_bmi30": 48}}};
var CHARTS_DB = {"riskgrupp": {"chartType": "bar", "title": "Fördelning av cancerriskgrupper (n=100)", "data": [{"name": "Intermediate Fav", "value": 20}, {"name": "High", "value": 20}, {"name": "Intermediate Unfav", "value": 20}, {"name": "Very High Metastatic", "value": 15}, {"name": "Low", "value": 15}, {"name": "Very Low", "value": 10}]}, "behandling": {"chartType": "bar", "title": "Behandlingsfördelning (n=100)", "data": [{"name": "EBRT ADT", "value": 29}, {"name": "RALP", "value": 26}, {"name": "ACTIVE SURVEILLANCE", "value": 16}, {"name": "EBRT", "value": 10}, {"name": "RALP ADJ", "value": 7}, {"name": "PALLIATIVE", "value": 5}, {"name": "ADT CHEMO", "value": 4}, {"name": "ADT ONLY", "value": 3}]}, "utfall": {"chartType": "bar", "title": "Behandlingsutfall (n=100)", "data": [{"name": "Curative Good", "value": 24}, {"name": "Biochemical Recurrence", "value": 17}, {"name": "Curative Side Effects", "value": 16}, {"name": "Stable As", "value": 13}, {"name": "Local Progression", "value": 12}, {"name": "Deceased Cancer", "value": 6}, {"name": "Deceased Other", "value": 4}, {"name": "Partial Response", "value": 4}, {"name": "Reclassified To Treatment", "value": 3}, {"name": "Progression", "value": 1}]}, "diabetes": {"chartType": "pie", "title": "Diabetestyp (n=100)", "data": [{"name": "Typ 2", "value": 85}, {"name": "Typ 1", "value": 15}]}, "hba1c": {"chartType": "bar", "title": "HbA1c-förändring: med vs utan ADT", "data": [{"name": "Med ADT", "value": 6.5}, {"name": "Utan ADT", "value": 0.7}]}, "psa": {"chartType": "grouped_bar", "title": "PSA-respons per behandling", "categories": ["EBRT", "RALP", "EBRT_ADT", "active_surveillance", "RALP_adj", "palliative", "ADT_only", "ADT_chemo"], "series": [{"name": "Baseline", "data": [2.3, 2.1, 13.6, 0.7, 10.5, 62.8, 48.5, 69.1]}, {"name": "Nadir", "data": [0.2, 0.0, 0.0, 0.7, 0.0, 6.4, 0.0, 0.0]}, {"name": "Senaste", "data": [0.4, 0.2, 0.9, 5.4, 0.2, 6.8, 0.0, 0.1]}]}, "komorbiditet": {"chartType": "bar", "title": "Komorbiditeter i kohorten (n=100)", "data": [{"name": "Hypertoni", "value": 65}, {"name": "Overvikt Bmi30", "value": 48}, {"name": "Hyperkolesterolemi", "value": 45}, {"name": "Retinopati", "value": 28}, {"name": "Nefropati", "value": 19}, {"name": "Neuropati", "value": 16}, {"name": "Kardiovaskulart", "value": 13}]}, "alder": {"chartType": "bar", "title": "Åldersfördelning vid cancerdiagnos", "data": [{"name": "50-54", "value": 36}, {"name": "55-59", "value": 34}, {"name": "60-64", "value": 25}, {"name": "65-69", "value": 5}]}, "lakemedel": {"chartType": "bar", "title": "Vanligaste läkemedel (topp 10)", "data": [{"name": "Metformin", "value": 85}, {"name": "Atorvastatin", "value": 70}, {"name": "Kalcipos-D forte", "value": 43}, {"name": "Enalapril", "value": 39}, {"name": "Bikalutamid", "value": 34}, {"name": "Lantus (insulin glargin)", "value": 31}, {"name": "Losartan", "value": 29}, {"name": "Trombyl (ASA)", "value": 25}, {"name": "Amlodipin", "value": 25}, {"name": "Levemir (insulin detemir)", "value": 24}]}, "gleason": {"chartType": "bar", "title": "Gleason-fördelning", "data": [{"name": "3+3=6", "value": 25}, {"name": "3+4=7", "value": 29}, {"name": "4+3=7", "value": 20}, {"name": "4+4=8", "value": 15}, {"name": "4+5=9", "value": 3}, {"name": "5+4=9", "value": 8}]}, "sammansattning": {"chartType": "bar", "title": "Fördelning av cancerriskgrupper (n=100)", "data": [{"name": "Intermediate Fav", "value": 20}, {"name": "High", "value": 20}, {"name": "Intermediate Unfav", "value": 20}, {"name": "Very High Metastatic", "value": 15}, {"name": "Low", "value": 15}, {"name": "Very Low", "value": 10}]}, "ralp_vs_stral": {"chartType": "grouped_bar", "title": "Utfall: RALP vs strålbehandling", "categories": ["Biochemical Recurrence", "Curative Good", "Curative Side Effects", "Deceased Cancer", "Deceased Other", "Local Progression"], "series": [{"name": "RALP", "data": [9, 11, 9, 0, 0, 4]}, {"name": "Strålbehandling", "data": [8, 13, 7, 2, 1, 8]}]}, "njurfunktion": {"chartType": "bar", "title": "Njurfunktion (eGFR) vid baseline", "data": [{"name": "eGFR <45", "value": 6}, {"name": "eGFR 45-59", "value": 13}, {"name": "eGFR 60-89", "value": 69}, {"name": "eGFR ≥90", "value": 12}]}, "metformin": {"chartType": "pie", "title": "Metforminanvändning", "data": [{"name": "Metformin (typ 2)", "value": 85}, {"name": "Utan metformin (typ 1)", "value": 15}]}, "hjart": {"chartType": "pie", "title": "Hjärt-kärlsjukdom i kohorten", "data": [{"name": "Utan hjärt-kärlsjukdom", "value": 87}, {"name": "Med hjärt-kärlsjukdom", "value": 13}]}};

// ========== PROMPTER (en per steg) ==========
var PROMPT_KOHORT = "Du är en klinisk dataanalytiker. Svara på svenska med åäö.\n\n"
  + "KOHORTDATA:\n" + JSON.stringify(COHORT) + "\n\n"
  + "Analysera kohortdatan baserat på användarens fråga. Ange specifika siffror: antal patienter, procent, medelvärden.\n"
  + "Skriv 4-8 meningar ren löptext. Ingen markdown (inga **, #, punktlistor). Inga taggar.";

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
  var terms = ["prostate cancer", "diabetes"];
  for (var kw in PUBMED_KEYWORDS) {
    if (q.indexOf(kw) >= 0) {
      terms.push(PUBMED_KEYWORDS[kw]);
      break; // ta bara det mest specifika
    }
  }
  return terms.join(" ");
}

function pubmedCall(question, signal) {
  var searchQuery = buildPubmedQuery(question);
  return fetch("/api/pubmed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: signal,
    body: JSON.stringify({ query: searchQuery, maxResults: 5 })
  }).then(function(r) { return r.json(); }).then(function(data) {
    return {
      summary: data.summary || "Inga resultat.",
      articles: data.articles || [],
      totalFound: data.totalFound || 0,
      searchQuery: data.searchQuery || searchQuery
    };
  });
}

function buildSyntesPrompt(kohortText, pubmedText) {
  return "Du är en klinisk rådgivare. Svara på svenska med åäö.\n\n"
    + "Nedan finns två analyser — en baserad på lokal kohortdata och en på publicerad PubMed-evidens.\n\n"
    + "KOHORTANALYS:\n" + kohortText + "\n\n"
    + "PUBMED-EVIDENS:\n" + pubmedText + "\n\n"
    + "Väg samman dessa. Ge en sammanvägd klinisk bedömning med konkreta rekommendationer.\n"
    + "Notera om kohortfynden stämmer med eller avviker från publicerad forskning.\n"
    + "Skriv 4-8 meningar ren löptext. Ingen markdown. Inga taggar.";
}

var PROMPT_KOHORT_SHORT = "Du är en klinisk dataanalytiker. Svara på svenska. Kort (2 meningar).\n"
  + "KOHORTDATA:\n" + JSON.stringify(COHORT) + "\nAnalysera kort:";

// ========== DIAGRAMVAL ==========
function matchChart(question) {
  var q = question.toLowerCase();
  var rules = [
    [["hba1c","hba","hormon","adt","metabol","insulin"], "hba1c"],
    [["psa","psa-respons","tumörmarkör"], "psa"],
    [["riskgrupp","risk"], "riskgrupp"],
    [["ralp","strål","operation","prostatektomi","kirurgi"], "ralp_vs_stral"],
    [["behandling","terapi"], "behandling"],
    [["utfall","resultat","recidiv","biokemisk","prognos"], "utfall"],
    [["diabetes","typ 1","typ 2","dm"], "diabetes"],
    [["sammansättning","översikt","beskriv","kohort"], "sammansattning"],
    [["komorbid","samsjuklighet"], "komorbiditet"],
    [["hjärt","kärl","kardio"], "hjart"],
    [["njur","egfr","kreatinin"], "njurfunktion"],
    [["ålder","år","demographics"], "alder"],
    [["läkemedel","medicinering","farmak"], "lakemedel"],
    [["metformin"], "metformin"],
    [["gleason","isup","grad"], "gleason"],
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

function apiCall(sysPrompt, userMsg, signal) {
  var body = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: sysPrompt,
    messages: [{ role: "user", content: userMsg }]
  };
  return fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: signal,
    body: JSON.stringify(body)
  }).then(function(r) { return r.json(); }).then(function(d) {
    var text = "";
    if (d.content) d.content.forEach(function(b) { if (b.type === "text") text += b.text; });
    return cleanMd(text);
  });
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
  kohort: { b: "#2563eb", bg: "#f7f9ff", l: "■ VÅR KOHORTDATA — syntetisk (n=100)", lb: "#1e3a5f" },
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

function Metric(props) {
  return (
    <div style={{ background: "white", borderRadius: 6, padding: "6px 10px", border: "1px solid #e2e8f0", flex: 1, minWidth: 100 }}>
      <div style={{ fontSize: 8, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.4 }}>{props.label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: props.color || "#1a365d" }}>{props.value}</div>
      {props.sub && <div style={{ fontSize: 8, color: "#94a3b8" }}>{props.sub}</div>}
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
  var copiedS = useState(false); var copied = copiedS[0]; var setCopied = copiedS[1];
  var endRef = useRef(null);
  var abortRef = useRef(null);

  // Progressiv svarsstatus per meddelande-index
  var stepsS = useState({}); var steps = stepsS[0]; var setSteps = stepsS[1];

  useEffect(function() { if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" }); }, [msgs, steps]);

  function stop() { if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; } setLoading(false); }
  function clear() { stop(); setMsgs([]); setCharts([]); setSteps({}); }
  function doCopy() {
    var parts = [];
    msgs.forEach(function(m) {
      if (m.role === "user") parts.push("FRÅGA: " + m.content);
    });
    Object.keys(steps).forEach(function(k) {
      var s = steps[k];
      if (s.kohort) parts.push("KOHORTDATA:\n" + s.kohort);
      if (s.pubmed) parts.push("PUBMED-EVIDENS:\n" + s.pubmed);
      if (s.syntes) parts.push("SAMMANVÄGD BEDÖMNING:\n" + s.syntes);
      parts.push("---");
    });
    navigator.clipboard.writeText(parts.join("\n\n")).then(function() { setCopied(true); setTimeout(function() { setCopied(false); }, 2000); });
  }

  function send(text) {
    if (!text.trim() || loading) return;
    var q = text.trim();
    var currentMode = mode;
    var currentSrc = src;
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

    // Initiera steg-state
    setSteps(function(prev) {
      var next = Object.assign({}, prev);
      next[msgIdx] = { kohort: null, pubmed: null, syntes: null, articles: null, totalFound: 0, mode: currentMode, src: currentSrc, loading: firstLoading };
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
      var kp = (currentMode === "viz") ? PROMPT_KOHORT_SHORT : PROMPT_KOHORT;
      apiCall(kp, q, ctrl.signal).then(function(kohortText) {
        setSteps(function(prev) {
          var next = Object.assign({}, prev);
          next[msgIdx] = Object.assign({}, next[msgIdx], { kohort: kohortText, loading: null });
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

    // ===== BÅDA (kohort → pubmed → syntes) =====
    var kohortPrompt = (currentMode === "viz") ? PROMPT_KOHORT_SHORT : PROMPT_KOHORT;
    apiCall(kohortPrompt, q, ctrl.signal)
    .then(function(kohortText) {
      setSteps(function(prev) {
        var next = Object.assign({}, prev);
        next[msgIdx] = Object.assign({}, next[msgIdx], { kohort: kohortText, loading: "pubmed" });
        return next;
      });
      return pubmedCall(q, ctrl.signal).then(function(pubmedResult) {
        setSteps(function(prev) {
          var next = Object.assign({}, prev);
          next[msgIdx] = Object.assign({}, next[msgIdx], {
            pubmed: pubmedResult.summary,
            articles: pubmedResult.articles,
            totalFound: pubmedResult.totalFound,
            loading: "syntes"
          });
          return next;
        });
        var syntesPrompt = buildSyntesPrompt(kohortText, pubmedResult.summary);
        return apiCall(syntesPrompt, q, ctrl.signal);
      });
    })
    .then(function(syntesText) {
      setSteps(function(prev) {
        var next = Object.assign({}, prev);
        next[msgIdx] = Object.assign({}, next[msgIdx], { syntes: syntesText, loading: null });
        return next;
      });
      done();
    })
    .catch(fail);
  }

  // ========== RENDER ==========
  var d = COHORT; var dm = d.diabetes.type_distribution;

  function renderResponse(msgIdx) {
    var s = steps[msgIdx];
    if (!s) return null;
    var m = s.mode || "text";

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
        </div>
      );
    }

    var sc = s.src || "both";
    var showK = (sc === "kohort" || sc === "both");
    var showP = (sc === "pubmed" || sc === "both");
    var showS = (sc === "both");

    return (
      <div style={{ marginBottom: 12 }}>
        {showK && (s.kohort ? <Section type="kohort" text={s.kohort} /> : s.loading === "kohort" ? <Section type="kohort" loading={true} loadingText="Analyserar kohortdata…" /> : null)}
        {showP && (s.pubmed ? <Section type="pubmed" text={s.pubmed} articles={s.articles} totalFound={s.totalFound} /> : s.loading === "pubmed" ? <Section type="pubmed" loading={true} loadingText="Söker PubMed (E-utilities)…" /> : null)}
        {showS && (s.syntes ? <Section type="syntes" text={s.syntes} /> : s.loading === "syntes" ? <Section type="syntes" loading={true} loadingText="Genererar sammanvägd bedömning…" /> : null)}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Segoe UI,system-ui,sans-serif", background: "#f0f2f5", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      <div style={{ background: "linear-gradient(135deg,#1a365d 0%,#2d5986 100%)", color: "white", padding: "10px 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Kohortanalys + Evidens</div>
          <div style={{ fontSize: 10, opacity: 0.6, borderLeft: "1px solid rgba(255,255,255,0.3)", paddingLeft: 8 }}>{d.n} patienter | Prostatacancer + Diabetes | KCHD POC</div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 5 }}>
            <span style={{ fontSize: 8, background: "#2563eb", padding: "2px 7px", borderRadius: 3 }}>Kohortdata (syntetisk)</span>
            <span style={{ fontSize: 8, background: "#059669", padding: "2px 7px", borderRadius: 3 }}>PubMed E-utilities (riktig evidens)</span>
            <span style={{ fontSize: 8, background: "#7c3aed", padding: "2px 7px", borderRadius: 3 }}>Sammanvägd bedömning</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "6px 16px", display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
        <Metric label="Patienter" value={d.n} sub={"Ålder " + d.demographics.age_range + " år"} />
        <Metric label="DM typ 1/2" value={(dm.T1 || 0) + "/" + (dm.T2 || 0)} sub="15%/85%" />
        <Metric label="HbA1c baseline" value={d.diabetes.hba1c_baseline_mean} sub="mmol/mol" color="#b45309" />
        <Metric label="PSA diagnos" value={d.cancer.psa_at_diagnosis.median} sub="median µg/L" color="#dc2626" />
        <Metric label="HbA1c ADT-effekt" value={"+" + d.labs_summary.hba1c_change_with_adt} sub="mmol/mol" color="#dc2626" />
      </div>

      <div style={{ flex: 1, display: "flex", gap: 10, padding: "0 16px 10px", minHeight: 0 }}>

        <div style={{ flex: 3, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ flex: 1, background: "white", borderRadius: 10, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden" }}>

            <div style={{ padding: "6px 12px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 14, alignItems: "center", background: "#fafbfc", flexShrink: 0 }}>
              {[{ c: "#2563eb", t: "Blå = kohort (syntetisk)" }, { c: "#059669", t: "Grön = PubMed (riktig)" }, { c: "#7c3aed", t: "Lila = sammanvägd" }].map(function(l, i) {
                return <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 7, height: 7, borderRadius: 2, background: l.c }} /><span style={{ fontSize: 9, color: "#64748b" }}>{l.t}</span></div>;
              })}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 12, minHeight: 0 }}>
              {msgs.length === 0 && (
                <div>
                  <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 11, marginBottom: 10, marginTop: 4 }}>Ställ en fråga — svaret visas stegvis: kohort (blå) → PubMed (grön) → bedömning (lila)</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, justifyContent: "center" }}>
                    {EXAMPLES.map(function(q, i) {
                      return <button key={i} onClick={function() { send(q); }} style={{ padding: "6px 9px", borderRadius: 6, border: "1px solid #cbd5e1", background: "white", color: "#334155", fontSize: 10, cursor: "pointer", textAlign: "left", maxWidth: 260, lineHeight: 1.35 }}
                        onMouseOver={function(e) { e.target.style.borderColor = "#2563eb"; e.target.style.background = "#f8fafc"; }}
                        onMouseOut={function(e) { e.target.style.borderColor = "#cbd5e1"; e.target.style.background = "white"; }}
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
                      {steps[respIdx] && renderResponse(respIdx)}
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
                <input type="text" value={input} onChange={function(e) { setInput(e.target.value); }} onKeyDown={function(e) { if (e.key === "Enter") send(input); }}
                  placeholder="Ställ en fråga — kohortanalys + PubMed-evidens…"
                  style={{ flex: 1, padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, outline: "none", background: "white" }} />
                {!loading ? (
                  <button onClick={function() { send(input); }} disabled={!input.trim()} style={{ padding: "8px 14px", borderRadius: 6, background: !input.trim() ? "#94a3b8" : "#1a365d", color: "white", border: "none", fontSize: 12, fontWeight: 600, cursor: !input.trim() ? "not-allowed" : "pointer" }}>Skicka</button>
                ) : (
                  <button onClick={stop} style={{ padding: "8px 14px", borderRadius: 6, background: "#dc2626", color: "white", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Stoppa</button>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, color: "#94a3b8" }}>Svarsformat:</span>
                <div style={{ display: "flex", gap: 0, background: "#e2e8f0", borderRadius: 6, padding: 2 }}>
                  {[{ k: "text", l: "Bara text" }, { k: "both", l: "Text + diagram" }, { k: "viz", l: "Bara diagram" }].map(function(o) {
                    return <button key={o.k} onClick={function() { setMode(o.k); }} style={{ padding: "8px 14px", fontSize: 12, fontWeight: 600, borderRadius: 4, border: "none", cursor: "pointer", background: mode === o.k ? "#1a365d" : "transparent", color: mode === o.k ? "white" : "#64748b" }}>{o.l}</button>;
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
                    return <button key={o.k} onClick={function() { setSrc(o.k); }} style={{ padding: "8px 14px", fontSize: 12, fontWeight: 600, borderRadius: 4, border: "none", cursor: "pointer", background: active ? o.bg : "transparent", color: active ? "white" : "#64748b" }}>{o.l}</button>;
                  })}
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
              {charts.map(function(ch, i) { return <div key={i} style={{ borderBottom: i < charts.length - 1 ? "1px solid #f1f5f9" : "none" }}><ChartVis data={ch} /></div>; })}
            </div>
          </div>
        </div>

      </div>

      <div style={{ padding: "4px 16px 8px", fontSize: 8, color: "#94a3b8", textAlign: "center", flexShrink: 0 }}>
        KCHD / SKR POC | Kohortdata = syntetisk | PubMed-evidens = riktig publicerad forskning | Mars 2026
      </div>
    </div>
  );
}
