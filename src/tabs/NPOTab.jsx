import { useState } from "react";
import { KONTRAKT, StatusTag } from "../npoKontrakt.jsx";

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

export default NPOTab;
