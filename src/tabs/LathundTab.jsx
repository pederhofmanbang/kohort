import React from "react";

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

export default LathundTab;
