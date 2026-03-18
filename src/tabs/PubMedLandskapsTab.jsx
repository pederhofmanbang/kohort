import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { COLORS } from "../components/ChartVis.jsx";

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

export default PubMedLandskapsTab;
