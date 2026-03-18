import { useState, useEffect } from "react";

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

export default TestprotokollTab;
