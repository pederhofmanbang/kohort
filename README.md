# KCHD Kohortanalys + Evidens

POC-verktyg för analys av syntetisk vårdkohort (100 patienter med prostatacancer + insulinbehandlad diabetes) kombinerat med PubMed-evidens.

**KCHD / SKR — Kompetenscentrum Hälsodata**

## Funktioner

- AI-driven kohortanalys med specifika siffror
- PubMed-sökning efter publicerad evidens
- Sammanvägd klinisk bedömning
- 15 förberäknade diagramtyper
- Progressiv rendering (3 steg visas vartefter)

## Deploy till Vercel

1. Pusha till GitHub
2. Importera repot i [vercel.com](https://vercel.com)
3. Lägg till miljövariabel: `ANTHROPIC_API_KEY` = din Anthropic API-nyckel
4. Deploy

## Lokal utveckling

```bash
npm install
npm run dev
```

Skapa `.env.local` med:
```
ANTHROPIC_API_KEY=din-nyckel-här
```

## Tech stack

- React 18 + Vite
- Recharts (diagram)
- Anthropic Claude API (via serverless proxy)
- PubMed via web_search
