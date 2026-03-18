import { useState } from "react";
import { PATIENTS, CHARTS_DB } from "../cohortData.js";
import { ChartVis } from "../components/ChartVis.jsx";

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

export default KohortDataTab;
