import { useState } from "react";

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
  kohort: { b: "#2563eb", bg: "#f7f9ff", l: "\u25A0 KOHORTDATABAS \u2014 s\u00F6kning via tool_use (n=100)", lb: "#1e3a5f" },
  pubmed: { b: "#059669", bg: "#f4fdf9", l: "\u25C6 PUBLICERAD EVIDENS (PubMed E-utilities)", lb: "#065f46" },
  syntes: { b: "#7c3aed", bg: "#faf5ff", l: "\u25B6 SAMMANV\u00C4GD BED\u00D6MNING", lb: "#6b21a8" }
};

function Section(props) {
  var s = SECTION_STYLES[props.type] || SECTION_STYLES.kohort;
  var isLoading = props.loading;
  var articles = props.articles || [];
  return (
    <div style={{ borderLeft: "3px solid " + s.b, background: s.bg, borderRadius: "0 8px 8px 0", padding: "8px 12px", marginBottom: 8, opacity: isLoading ? 0.6 : 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <div style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, background: s.lb, color: "white", fontSize: 9, fontWeight: 600 }}>{s.l}</div>
        {props.totalFound > 0 && <span style={{ fontSize: 9, color: "#64748b" }}>{props.totalFound} tr\u00E4ffar p\u00E5 PubMed</span>}
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
          <div style={{ fontSize: 9, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>K\u00C4LLOR:</div>
          {articles.map(function(a, i) {
            return (
              <div key={i} style={{ fontSize: 10, lineHeight: 1.4, marginBottom: 3 }}>
                <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: "#065f46", textDecoration: "none" }}>
                  {a.authors} ({a.year}) \u2014 {a.title}
                </a>
                <span style={{ color: "#94a3b8" }}> \u2014 {a.journal}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ========== TOOL TRACE (transparensvy) ==========
var TOOL_LABELS = {
  search_patients: { icon: "\u{1F50D}", label: "S\u00F6k patienter", color: "#2563eb" },
  get_statistics: { icon: "\u{1F4CA}", label: "Ber\u00E4kna statistik", color: "#7c3aed" },
  count_patients: { icon: "#\uFE0F\u20E3", label: "R\u00E4kna patienter", color: "#059669" },
  cross_tabulate: { icon: "\u229E", label: "Korstabell", color: "#d97706" },
  get_time_series: { icon: "\u{1F4C8}", label: "Tidsserie", color: "#dc2626" },
  get_patient_time_series: { icon: "\u{1F464}", label: "Patientf\u00F6rlopp", color: "#0891b2" }
};

var FILTER_FIELD_LABELS = {
  a: "\u00E5lder", r: "riskgrupp", g: "Gleason", p: "PSA", t: "behandling", o: "utfall",
  d: "diabetestyp", dd: "diabetesduration", h: "HbA1c", b: "BMI", e: "eGFR",
  ht: "hypertoni", rt: "retinopati", nf: "nefropati", kd: "kardiovaskul\u00E4r"
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
  if (input.field) parts.push("f\u00E4lt: " + (FILTER_FIELD_LABELS[input.field] || input.field));
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

export { Paras, Section, ToolTracePanel };
