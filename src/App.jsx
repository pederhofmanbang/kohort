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
  }).then(function(r) {
    if (!r.ok) return r.text().then(function(t) { throw new Error("API " + r.status + ": " + t.substring(0, 200)); });
    return r.json();
  }).then(function(d) {
    if (d.error) throw new Error(d.error.message || d.error);
    var text = "";
    if (d.content) d.content.forEach(function(b) { if (b.type === "text") text += b.text; });
    if (!text) throw new Error("Tomt svar från API");
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


var PATIENTS = [{"a":64,"r":"intermediate_fav","g":"3+4=7","p":11.0,"t":"EBRT","o":"curative_good","d":"T2","dd":22,"h":62,"b":30.2,"e":76,"ht":1,"rt":1,"nf":1,"kd":1},{"a":57,"r":"intermediate_fav","g":"3+4=7","p":8.0,"t":"RALP","o":"curative_good","d":"T2","dd":7,"h":70,"b":31.2,"e":78,"ht":0,"rt":0,"nf":0,"kd":0},{"a":64,"r":"very_high_metastatic","g":"5+4=9","p":183.0,"t":"EBRT_ADT","o":"deceased_other","d":"T1","dd":27,"h":50,"b":22.3,"e":61,"ht":1,"rt":1,"nf":0,"kd":0},{"a":54,"r":"very_low","g":"3+3=6","p":3.8,"t":"active_surveillance","o":"stable_AS","d":"T1","dd":27,"h":47,"b":26.9,"e":68,"ht":1,"rt":1,"nf":0,"kd":0},{"a":58,"r":"high","g":"4+4=8","p":22.1,"t":"RALP_adj","o":"curative_side_effects","d":"T2","dd":22,"h":68,"b":32.0,"e":60,"ht":1,"rt":1,"nf":1,"kd":0},{"a":60,"r":"intermediate_unfav","g":"4+3=7","p":13.9,"t":"EBRT_ADT","o":"local_progression","d":"T2","dd":16,"h":51,"b":33.2,"e":59,"ht":0,"rt":0,"nf":0,"kd":0},{"a":57,"r":"very_low","g":"3+3=6","p":5.6,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":13,"h":61,"b":32.7,"e":42,"ht":1,"rt":0,"nf":0,"kd":0},{"a":60,"r":"high","g":"4+3=7","p":24.2,"t":"RALP_adj","o":"local_progression","d":"T2","dd":15,"h":55,"b":31.3,"e":84,"ht":0,"rt":0,"nf":0,"kd":0},{"a":53,"r":"low","g":"3+3=6","p":3.5,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":5,"h":58,"b":29.0,"e":84,"ht":1,"rt":0,"nf":1,"kd":0},{"a":52,"r":"high","g":"4+4=8","p":27.7,"t":"EBRT_ADT","o":"local_progression","d":"T2","dd":10,"h":59,"b":28.1,"e":110,"ht":1,"rt":0,"nf":0,"kd":0},{"a":58,"r":"high","g":"4+3=7","p":28.8,"t":"EBRT_ADT","o":"curative_good","d":"T2","dd":21,"h":57,"b":30.7,"e":79,"ht":1,"rt":1,"nf":1,"kd":0},{"a":58,"r":"low","g":"3+3=6","p":5.3,"t":"RALP","o":"biochemical_recurrence","d":"T2","dd":18,"h":63,"b":29.4,"e":77,"ht":0,"rt":1,"nf":0,"kd":0},{"a":50,"r":"intermediate_unfav","g":"3+4=7","p":8.7,"t":"EBRT_ADT","o":"curative_side_effects","d":"T2","dd":12,"h":46,"b":29.5,"e":44,"ht":0,"rt":0,"nf":0,"kd":0},{"a":54,"r":"intermediate_unfav","g":"4+3=7","p":17.9,"t":"RALP","o":"biochemical_recurrence","d":"T2","dd":8,"h":72,"b":29.0,"e":80,"ht":0,"rt":0,"nf":0,"kd":0},{"a":52,"r":"high","g":"4+3=7","p":30.5,"t":"EBRT_ADT","o":"curative_good","d":"T2","dd":8,"h":77,"b":29.9,"e":118,"ht":0,"rt":0,"nf":1,"kd":0},{"a":53,"r":"intermediate_unfav","g":"3+4=7","p":13.5,"t":"EBRT_ADT","o":"local_progression","d":"T1","dd":23,"h":49,"b":26.6,"e":53,"ht":0,"rt":0,"nf":0,"kd":0},{"a":62,"r":"intermediate_unfav","g":"4+3=7","p":6.5,"t":"EBRT_ADT","o":"curative_good","d":"T2","dd":24,"h":46,"b":31.3,"e":69,"ht":1,"rt":1,"nf":0,"kd":0},{"a":52,"r":"very_high_metastatic","g":"5+4=9","p":67.8,"t":"palliative","o":"partial_response","d":"T2","dd":17,"h":69,"b":28.6,"e":71,"ht":0,"rt":0,"nf":0,"kd":0},{"a":65,"r":"high","g":"4+4=8","p":30.6,"t":"EBRT_ADT","o":"local_progression","d":"T2","dd":20,"h":57,"b":29.3,"e":40,"ht":1,"rt":0,"nf":0,"kd":0},{"a":65,"r":"intermediate_fav","g":"3+4=7","p":6.3,"t":"EBRT","o":"curative_good","d":"T1","dd":34,"h":65,"b":26.2,"e":65,"ht":1,"rt":1,"nf":0,"kd":0},{"a":59,"r":"intermediate_fav","g":"3+4=7","p":5.9,"t":"EBRT","o":"curative_side_effects","d":"T2","dd":5,"h":66,"b":30.7,"e":72,"ht":1,"rt":0,"nf":0,"kd":0},{"a":61,"r":"low","g":"3+3=6","p":3.9,"t":"RALP","o":"biochemical_recurrence","d":"T2","dd":22,"h":68,"b":32.6,"e":59,"ht":1,"rt":0,"nf":0,"kd":0},{"a":57,"r":"intermediate_fav","g":"3+4=7","p":6.8,"t":"RALP","o":"curative_good","d":"T1","dd":39,"h":45,"b":30.1,"e":42,"ht":1,"rt":0,"nf":1,"kd":0},{"a":55,"r":"very_high_metastatic","g":"4+4=8","p":119.8,"t":"EBRT_ADT","o":"deceased_cancer","d":"T2","dd":15,"h":59,"b":24.4,"e":70,"ht":1,"rt":1,"nf":0,"kd":0},{"a":61,"r":"high","g":"4+3=7","p":11.4,"t":"RALP_adj","o":"local_progression","d":"T2","dd":23,"h":68,"b":26.3,"e":49,"ht":1,"rt":1,"nf":0,"kd":1},{"a":62,"r":"intermediate_unfav","g":"3+4=7","p":13.6,"t":"EBRT_ADT","o":"curative_good","d":"T2","dd":15,"h":67,"b":31.2,"e":43,"ht":0,"rt":0,"nf":1,"kd":0},{"a":52,"r":"high","g":"4+4=8","p":12.0,"t":"EBRT_ADT","o":"biochemical_recurrence","d":"T1","dd":33,"h":50,"b":24.3,"e":82,"ht":1,"rt":1,"nf":0,"kd":0},{"a":59,"r":"intermediate_fav","g":"3+4=7","p":8.8,"t":"EBRT","o":"biochemical_recurrence","d":"T2","dd":20,"h":71,"b":34.2,"e":66,"ht":1,"rt":0,"nf":0,"kd":0},{"a":55,"r":"very_high_metastatic","g":"5+4=9","p":164.8,"t":"ADT_only","o":"deceased_other","d":"T2","dd":9,"h":71,"b":28.8,"e":65,"ht":1,"rt":0,"nf":0,"kd":0},{"a":60,"r":"intermediate_fav","g":"3+4=7","p":11.7,"t":"EBRT","o":"biochemical_recurrence","d":"T2","dd":17,"h":55,"b":31.6,"e":80,"ht":1,"rt":0,"nf":0,"kd":1},{"a":53,"r":"very_low","g":"3+3=6","p":5.8,"t":"active_surveillance","o":"reclassified_to_treatment","d":"T2","dd":7,"h":63,"b":27.4,"e":93,"ht":1,"rt":0,"nf":0,"kd":0},{"a":53,"r":"intermediate_unfav","g":"4+3=7","p":11.5,"t":"EBRT_ADT","o":"biochemical_recurrence","d":"T2","dd":8,"h":64,"b":30.7,"e":64,"ht":1,"rt":1,"nf":0,"kd":0},{"a":61,"r":"intermediate_unfav","g":"4+3=7","p":14.2,"t":"RALP","o":"local_progression","d":"T2","dd":3,"h":53,"b":30.3,"e":97,"ht":1,"rt":1,"nf":0,"kd":0},{"a":53,"r":"intermediate_unfav","g":"4+3=7","p":8.1,"t":"RALP","o":"biochemical_recurrence","d":"T2","dd":2,"h":42,"b":29.9,"e":77,"ht":0,"rt":0,"nf":0,"kd":0},{"a":59,"r":"high","g":"4+4=8","p":16.2,"t":"EBRT_ADT","o":"local_progression","d":"T1","dd":37,"h":66,"b":24.1,"e":57,"ht":1,"rt":0,"nf":1,"kd":0},{"a":55,"r":"intermediate_fav","g":"3+4=7","p":6.2,"t":"EBRT","o":"curative_good","d":"T1","dd":21,"h":56,"b":20.8,"e":77,"ht":1,"rt":0,"nf":1,"kd":0},{"a":57,"r":"very_high_metastatic","g":"4+4=8","p":120.3,"t":"palliative","o":"progression","d":"T2","dd":12,"h":62,"b":36.1,"e":88,"ht":1,"rt":0,"nf":0,"kd":0},{"a":60,"r":"intermediate_unfav","g":"4+3=7","p":10.3,"t":"EBRT_ADT","o":"curative_side_effects","d":"T2","dd":19,"h":63,"b":30.1,"e":89,"ht":1,"rt":0,"nf":0,"kd":0},{"a":51,"r":"very_high_metastatic","g":"4+5=9","p":131.6,"t":"ADT_only","o":"deceased_cancer","d":"T2","dd":6,"h":61,"b":30.1,"e":73,"ht":0,"rt":0,"nf":0,"kd":0},{"a":65,"r":"low","g":"3+3=6","p":5.8,"t":"RALP","o":"curative_good","d":"T2","dd":8,"h":52,"b":24.7,"e":87,"ht":1,"rt":0,"nf":0,"kd":0},{"a":62,"r":"intermediate_fav","g":"3+4=7","p":7.2,"t":"RALP","o":"curative_good","d":"T2","dd":9,"h":58,"b":28.9,"e":67,"ht":1,"rt":0,"nf":0,"kd":0},{"a":63,"r":"low","g":"3+3=6","p":6.6,"t":"RALP","o":"biochemical_recurrence","d":"T2","dd":13,"h":57,"b":29.0,"e":99,"ht":0,"rt":0,"nf":0,"kd":0},{"a":52,"r":"intermediate_fav","g":"3+4=7","p":8.8,"t":"EBRT","o":"curative_good","d":"T2","dd":13,"h":55,"b":28.3,"e":81,"ht":1,"rt":0,"nf":0,"kd":0},{"a":64,"r":"intermediate_fav","g":"3+4=7","p":8.9,"t":"EBRT","o":"curative_good","d":"T2","dd":20,"h":58,"b":30.5,"e":77,"ht":1,"rt":0,"nf":0,"kd":0},{"a":59,"r":"low","g":"3+3=6","p":6.0,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":14,"h":66,"b":31.7,"e":49,"ht":1,"rt":0,"nf":0,"kd":1},{"a":51,"r":"high","g":"4+4=8","p":26.2,"t":"EBRT_ADT","o":"biochemical_recurrence","d":"T1","dd":16,"h":60,"b":29.2,"e":94,"ht":0,"rt":1,"nf":0,"kd":0},{"a":52,"r":"intermediate_unfav","g":"3+4=7","p":9.9,"t":"EBRT_ADT","o":"biochemical_recurrence","d":"T2","dd":9,"h":53,"b":24.2,"e":70,"ht":1,"rt":0,"nf":1,"kd":0},{"a":59,"r":"intermediate_unfav","g":"3+4=7","p":8.7,"t":"EBRT_ADT","o":"curative_side_effects","d":"T2","dd":22,"h":55,"b":31.8,"e":82,"ht":1,"rt":0,"nf":0,"kd":1},{"a":52,"r":"very_low","g":"3+3=6","p":5.5,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":8,"h":63,"b":25.5,"e":63,"ht":0,"rt":0,"nf":0,"kd":0},{"a":62,"r":"intermediate_fav","g":"3+4=7","p":7.2,"t":"EBRT","o":"curative_good","d":"T2","dd":14,"h":65,"b":26.4,"e":73,"ht":1,"rt":1,"nf":0,"kd":1},{"a":57,"r":"very_high_metastatic","g":"5+4=9","p":121.5,"t":"ADT_chemo","o":"deceased_other","d":"T2","dd":10,"h":66,"b":29.1,"e":77,"ht":1,"rt":0,"nf":0,"kd":0},{"a":59,"r":"intermediate_unfav","g":"3+4=7","p":13.1,"t":"RALP","o":"curative_side_effects","d":"T2","dd":17,"h":55,"b":31.7,"e":86,"ht":0,"rt":0,"nf":0,"kd":1},{"a":56,"r":"very_low","g":"3+3=6","p":2.7,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":14,"h":70,"b":29.4,"e":69,"ht":1,"rt":0,"nf":0,"kd":1},{"a":57,"r":"intermediate_unfav","g":"4+3=7","p":10.7,"t":"EBRT_ADT","o":"local_progression","d":"T2","dd":5,"h":54,"b":32.1,"e":77,"ht":0,"rt":0,"nf":0,"kd":0},{"a":54,"r":"low","g":"3+3=6","p":3.0,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":10,"h":61,"b":30.7,"e":69,"ht":1,"rt":1,"nf":1,"kd":0},{"a":60,"r":"intermediate_fav","g":"3+4=7","p":6.8,"t":"RALP","o":"curative_good","d":"T2","dd":15,"h":48,"b":29.6,"e":54,"ht":1,"rt":0,"nf":1,"kd":0},{"a":53,"r":"intermediate_unfav","g":"4+3=7","p":7.2,"t":"RALP","o":"curative_side_effects","d":"T1","dd":19,"h":53,"b":20.5,"e":70,"ht":0,"rt":1,"nf":0,"kd":0},{"a":62,"r":"high","g":"4+3=7","p":17.7,"t":"EBRT_ADT","o":"local_progression","d":"T2","dd":12,"h":64,"b":32.3,"e":90,"ht":1,"rt":0,"nf":0,"kd":1},{"a":65,"r":"low","g":"3+3=6","p":6.5,"t":"RALP","o":"biochemical_recurrence","d":"T2","dd":18,"h":68,"b":33.2,"e":90,"ht":1,"rt":0,"nf":1,"kd":0},{"a":61,"r":"intermediate_unfav","g":"3+4=7","p":8.0,"t":"RALP","o":"curative_side_effects","d":"T1","dd":24,"h":69,"b":24.4,"e":56,"ht":1,"rt":0,"nf":0,"kd":0},{"a":61,"r":"low","g":"3+3=6","p":6.3,"t":"RALP","o":"curative_good","d":"T2","dd":23,"h":51,"b":30.3,"e":86,"ht":1,"rt":0,"nf":0,"kd":0},{"a":59,"r":"very_low","g":"3+3=6","p":5.5,"t":"active_surveillance","o":"reclassified_to_treatment","d":"T2","dd":23,"h":51,"b":27.1,"e":75,"ht":1,"rt":1,"nf":0,"kd":0},{"a":61,"r":"very_low","g":"3+3=6","p":2.7,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":14,"h":51,"b":29.9,"e":64,"ht":1,"rt":0,"nf":0,"kd":0},{"a":53,"r":"high","g":"4+4=8","p":33.4,"t":"EBRT_ADT","o":"biochemical_recurrence","d":"T2","dd":15,"h":54,"b":31.7,"e":61,"ht":1,"rt":0,"nf":0,"kd":0},{"a":58,"r":"high","g":"4+3=7","p":13.4,"t":"RALP_adj","o":"local_progression","d":"T2","dd":13,"h":64,"b":32.8,"e":71,"ht":0,"rt":0,"nf":0,"kd":0},{"a":51,"r":"low","g":"3+3=6","p":6.8,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":8,"h":56,"b":27.4,"e":80,"ht":0,"rt":0,"nf":0,"kd":0},{"a":53,"r":"high","g":"4+3=7","p":37.8,"t":"RALP_adj","o":"biochemical_recurrence","d":"T2","dd":7,"h":72,"b":23.2,"e":55,"ht":0,"rt":0,"nf":0,"kd":0},{"a":57,"r":"intermediate_fav","g":"3+4=7","p":6.4,"t":"RALP","o":"curative_good","d":"T1","dd":31,"h":51,"b":29.9,"e":74,"ht":0,"rt":1,"nf":0,"kd":0},{"a":62,"r":"very_high_metastatic","g":"4+5=9","p":159.3,"t":"palliative","o":"deceased_cancer","d":"T2","dd":10,"h":76,"b":31.6,"e":85,"ht":1,"rt":0,"nf":0,"kd":0},{"a":56,"r":"low","g":"3+3=6","p":7.5,"t":"RALP","o":"biochemical_recurrence","d":"T2","dd":21,"h":71,"b":33.6,"e":52,"ht":0,"rt":0,"nf":0,"kd":0},{"a":52,"r":"very_low","g":"3+3=6","p":3.6,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":5,"h":50,"b":30.9,"e":42,"ht":0,"rt":1,"nf":0,"kd":0},{"a":55,"r":"very_high_metastatic","g":"4+5=9","p":192.6,"t":"EBRT_ADT","o":"deceased_cancer","d":"T1","dd":31,"h":53,"b":20,"e":76,"ht":1,"rt":1,"nf":0,"kd":0},{"a":52,"r":"intermediate_unfav","g":"4+3=7","p":7.6,"t":"EBRT_ADT","o":"curative_good","d":"T1","dd":32,"h":56,"b":31.2,"e":76,"ht":1,"rt":1,"nf":1,"kd":0},{"a":55,"r":"very_high_metastatic","g":"4+4=8","p":166.0,"t":"palliative","o":"deceased_other","d":"T1","dd":24,"h":53,"b":23.1,"e":74,"ht":1,"rt":1,"nf":0,"kd":0},{"a":50,"r":"intermediate_unfav","g":"3+4=7","p":10.6,"t":"EBRT_ADT","o":"local_progression","d":"T2","dd":8,"h":51,"b":27.9,"e":73,"ht":0,"rt":0,"nf":0,"kd":0},{"a":53,"r":"very_high_metastatic","g":"5+4=9","p":94.4,"t":"ADT_chemo","o":"deceased_cancer","d":"T2","dd":3,"h":62,"b":25.4,"e":66,"ht":0,"rt":0,"nf":0,"kd":0},{"a":60,"r":"intermediate_fav","g":"3+4=7","p":11.5,"t":"RALP","o":"curative_good","d":"T2","dd":5,"h":64,"b":30.0,"e":77,"ht":0,"rt":0,"nf":0,"kd":0},{"a":56,"r":"high","g":"4+4=8","p":29.0,"t":"RALP_adj","o":"curative_side_effects","d":"T2","dd":21,"h":56,"b":30.5,"e":64,"ht":1,"rt":0,"nf":0,"kd":0},{"a":56,"r":"high","g":"4+4=8","p":11.0,"t":"EBRT_ADT","o":"curative_good","d":"T2","dd":14,"h":65,"b":27.6,"e":74,"ht":1,"rt":0,"nf":0,"kd":0},{"a":58,"r":"high","g":"4+4=8","p":13.0,"t":"EBRT_ADT","o":"curative_side_effects","d":"T2","dd":19,"h":71,"b":31.0,"e":58,"ht":1,"rt":0,"nf":0,"kd":0},{"a":59,"r":"intermediate_unfav","g":"4+3=7","p":8.0,"t":"EBRT_ADT","o":"curative_good","d":"T2","dd":19,"h":45,"b":24.7,"e":80,"ht":1,"rt":1,"nf":1,"kd":0},{"a":51,"r":"intermediate_fav","g":"3+4=7","p":8.7,"t":"RALP","o":"curative_side_effects","d":"T2","dd":9,"h":54,"b":30.0,"e":77,"ht":1,"rt":0,"nf":0,"kd":0},{"a":52,"r":"intermediate_fav","g":"3+4=7","p":6.9,"t":"RALP","o":"curative_side_effects","d":"T2","dd":9,"h":56,"b":34.8,"e":97,"ht":0,"rt":0,"nf":1,"kd":0},{"a":58,"r":"very_high_metastatic","g":"4+4=8","p":125.2,"t":"ADT_chemo","o":"partial_response","d":"T2","dd":16,"h":68,"b":29.3,"e":64,"ht":0,"rt":0,"nf":0,"kd":0},{"a":65,"r":"very_high_metastatic","g":"5+4=9","p":159.7,"t":"ADT_chemo","o":"partial_response","d":"T2","dd":5,"h":54,"b":27.8,"e":82,"ht":1,"rt":0,"nf":1,"kd":0},{"a":52,"r":"very_low","g":"3+3=6","p":3.2,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":16,"h":54,"b":31.5,"e":93,"ht":1,"rt":0,"nf":0,"kd":0},{"a":55,"r":"intermediate_unfav","g":"3+4=7","p":10.3,"t":"RALP","o":"curative_side_effects","d":"T2","dd":4,"h":57,"b":31.5,"e":70,"ht":0,"rt":0,"nf":0,"kd":0},{"a":56,"r":"high","g":"4+3=7","p":30.9,"t":"EBRT_ADT","o":"curative_side_effects","d":"T2","dd":6,"h":61,"b":32.9,"e":82,"ht":1,"rt":1,"nf":0,"kd":0},{"a":57,"r":"low","g":"3+3=6","p":4.7,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":9,"h":50,"b":36.1,"e":81,"ht":0,"rt":1,"nf":0,"kd":0},{"a":51,"r":"high","g":"4+3=7","p":25.0,"t":"EBRT_ADT","o":"biochemical_recurrence","d":"T2","dd":12,"h":72,"b":27.5,"e":91,"ht":1,"rt":1,"nf":0,"kd":0},{"a":60,"r":"very_high_metastatic","g":"5+4=9","p":157.8,"t":"palliative","o":"deceased_cancer","d":"T2","dd":23,"h":58,"b":26.4,"e":79,"ht":1,"rt":0,"nf":1,"kd":1},{"a":52,"r":"low","g":"3+3=6","p":5.5,"t":"RALP","o":"curative_good","d":"T2","dd":2,"h":76,"b":33.6,"e":79,"ht":0,"rt":0,"nf":0,"kd":0},{"a":59,"r":"low","g":"3+3=6","p":3.5,"t":"active_surveillance","o":"reclassified_to_treatment","d":"T2","dd":15,"h":57,"b":29.3,"e":73,"ht":1,"rt":0,"nf":0,"kd":1},{"a":50,"r":"intermediate_fav","g":"3+4=7","p":5.6,"t":"RALP","o":"curative_side_effects","d":"T2","dd":8,"h":57,"b":30.4,"e":67,"ht":0,"rt":0,"nf":0,"kd":0},{"a":52,"r":"intermediate_fav","g":"3+4=7","p":9.3,"t":"RALP","o":"curative_good","d":"T2","dd":14,"h":57,"b":27.7,"e":72,"ht":1,"rt":0,"nf":0,"kd":0},{"a":60,"r":"intermediate_fav","g":"3+4=7","p":10.8,"t":"EBRT","o":"curative_side_effects","d":"T2","dd":24,"h":61,"b":32.1,"e":58,"ht":1,"rt":0,"nf":1,"kd":1},{"a":54,"r":"very_high_metastatic","g":"5+4=9","p":69.1,"t":"ADT_only","o":"partial_response","d":"T2","dd":3,"h":57,"b":32.5,"e":75,"ht":1,"rt":0,"nf":0,"kd":0},{"a":51,"r":"very_low","g":"3+3=6","p":4.9,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":2,"h":65,"b":28.0,"e":92,"ht":0,"rt":0,"nf":0,"kd":0},{"a":64,"r":"low","g":"3+3=6","p":4.0,"t":"RALP","o":"curative_good","d":"T2","dd":22,"h":51,"b":27.4,"e":78,"ht":1,"rt":1,"nf":0,"kd":1},{"a":54,"r":"high","g":"4+4=8","p":18.7,"t":"RALP_adj","o":"biochemical_recurrence","d":"T2","dd":2,"h":54,"b":32.0,"e":51,"ht":0,"rt":0,"nf":0,"kd":0}];

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
        <text style={{ fontSize: 12, fontWeight: 600, fill: "#0C447C" }} x="130" y="182" textAnchor="middle">Steg 1: Kohort</text>
        <text style={{ fontSize: 10, fill: "#185FA5" }} x="130" y="198" textAnchor="middle">Claude API, ~3 sek</text>

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
        <text style={{ fontSize: 10, fontWeight: 600, fill: "#0C447C" }} x="76" y="386">■ VÅR KOHORTDATA</text>
        <text style={{ fontSize: 9, fill: "#185FA5" }} x="76" y="400">Siffror från 100 patienter</text>

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

        <text style={{ fontSize: 10, fill: "#94a3b8" }} x="340" y="544" textAnchor="middle">Blått syns efter ~3 sek · Grönt efter ~8 sek · Lila efter ~11 sek · Diagram direkt</text>
        <text style={{ fontSize: 10, fill: "#94a3b8" }} x="340" y="562" textAnchor="middle">Du väljer källa: Kohort | PubMed | Båda + syntes</text>
      </svg>

      <div style={{ maxWidth: 700, margin: "16px auto", fontSize: 12, lineHeight: 1.7, color: "#334155" }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Datakällor</div>
        <div style={{ marginBottom: 8 }}><span style={{ color: "#2563eb", fontWeight: 600 }}>Kohortdata</span> — 100 syntetiska patienter baserade på svensk epidemiologi. Prostatacancer (C61) + insulinbehandlad diabetes (E10/E11). Inkluderar riskgrupper, behandlingar, PSA, HbA1c, komorbiditeter och utfall.</div>
        <div style={{ marginBottom: 8 }}><span style={{ color: "#059669", fontWeight: 600 }}>PubMed E-utilities</span> — Direkt sökning mot NCBI:s E-utilities API (eutils.ncbi.nlm.nih.gov). Svenska frågor översätts till engelska MeSH-termer. Abstracts hämtas i XML och sammanfattas på svenska av Claude.</div>
        <div style={{ marginBottom: 8 }}><span style={{ color: "#7c3aed", fontWeight: 600 }}>Sammanvägd bedömning</span> — Claude väger samman kohortanalys och PubMed-evidens till kliniska rekommendationer. Noterar om kohortfynd stämmer med publicerad forskning.</div>
        <div style={{ fontWeight: 600, marginTop: 12, marginBottom: 6 }}>Backend</div>
        <div>Vercel serverless functions: /api/chat (proxy till Anthropic Claude API) och /api/pubmed (E-utilities + Claude-sammanfattning). React + Vite frontend. Diagram beräknas lokalt — 15 dataset matchas mot nyckelord.</div>
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
  var copiedS = useState(false); var copied = copiedS[0]; var setCopied = copiedS[1];
  var tabS = useState("analys"); var tab = tabS[0]; var setTab = tabS[1];
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

  var TABS = [
    { k: "analys", l: "Analys", icon: "💬" },
    { k: "kohort", l: "Kohortdata", icon: "📊" },
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
            <Metric label="HbA1c ADT-effekt" value={"+" + d.labs_summary.hba1c_change_with_adt} sub="mmol/mol" color="#dc2626" />
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
        </div>
      )}

      {tab === "kohort" && <KohortDataTab />}
      {tab === "lathund" && <LathundTab />}

      <div style={{ padding: "4px 16px 8px", fontSize: 8, color: "#94a3b8", textAlign: "center", flexShrink: 0 }}>
        KCHD / SKR POC | Kohortdata = syntetisk | PubMed-evidens = riktig publicerad forskning | Mars 2026
      </div>
    </div>
  );
}
