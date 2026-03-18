import { useState, useRef, useEffect } from "react";
import { PATIENTS, COHORT, CHARTS_DB } from "./cohortData.js";
import { ChartVis, TableVis, Metric, COLORS } from "./components/ChartVis.jsx";
import { Paras, Section, ToolTracePanel } from "./components/Section.jsx";
import { apiCall, kohortDbCall, pubmedCall, buildSyntesPrompt, matchChart } from "./api.js";
import KohortDataTab from "./tabs/KohortDataTab.jsx";
import LathundTab from "./tabs/LathundTab.jsx";
import PubMedLandskapsTab from "./tabs/PubMedLandskapsTab.jsx";
import NPOTab from "./tabs/NPOTab.jsx";
import TestprotokollTab from "./tabs/TestprotokollTab.jsx";

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
      var chart = matchChart(q, CHARTS_DB);
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
      if (brief && brief.length > 200) brief = brief.substring(0, 200) + "\u2026";
      if (s.loading && !brief) {
        return (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic", padding: "4px 0" }}>Analyserar\u2026</div>
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
    { k: "analys", l: "Analys", icon: "\uD83D\uDCAC" },
    { k: "kohort", l: "Kohortdata", icon: "\uD83D\uDCCA" },
    { k: "landskap", l: "PubMed-landskap", icon: "\uD83D\uDD2C" },
    { k: "npo", l: "NPÖ-variabler", icon: "\uD83D\uDD17" },
    { k: "protokoll", l: "Testprotokoll", icon: "\uD83D\uDCDD" },
    { k: "lathund", l: "Lathund", icon: "\uD83D\uDCCB" }
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
