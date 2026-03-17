// Vercel serverless function — Claude tool_use loop för kohortfrågor
// Claude får verktyg för att söka i patientdatabasen istället för att få all data i prompten

import * as db from "./cohort-data.js";

// Verktyg som Claude kan anropa
var TOOLS = [
  {
    name: "search_patients",
    description: "Sök och filtrera individuella patienter i kohorten. Returnerar matchande patientposter. Använd detta för att hitta specifika patienter eller granska individuella fall. Filtrera på valfritt fält: ålder (a), riskgrupp (r), Gleason (g), PSA (p), behandling (t), utfall (o), diabetestyp (d), diabetesduration (dd), HbA1c (h), BMI (b), eGFR (e), hypertoni (ht), retinopati (rt), nefropati (nf), kardiovaskulär sjukdom (kd).",
    input_schema: {
      type: "object",
      properties: {
        filters: {
          type: "object",
          description: "Filtreringskriterier. Nyckel = fältnamn (a, r, g, p, t, o, d, dd, h, b, e, ht, rt, nf, kd). Värde = exakt match (string/number), array för 'any of' (t.ex. [\"RALP\",\"EBRT\"]), eller {min, max} för range (t.ex. {\"min\":60,\"max\":65} för ålder 60-65).",
          additionalProperties: true
        },
        fields: {
          type: "array",
          items: { type: "string" },
          description: "Vilka fält att returnera per patient. Om tomt returneras alla fält. Exempel: [\"a\",\"t\",\"o\",\"h\"] för ålder, behandling, utfall, HbA1c."
        },
        limit: {
          type: "number",
          description: "Max antal patienter att returnera (default 20, max 100)."
        }
      },
      required: []
    }
  },
  {
    name: "get_statistics",
    description: "Beräkna statistik för ett fält i kohorten. För numeriska fält (ålder, PSA, HbA1c, BMI, eGFR, diabetesduration): medelvärde, median, min, max, standardavvikelse. För kategoriska fält (riskgrupp, Gleason, behandling, utfall, diabetestyp): frekvensfördelning. Kan grupperas efter ett annat fält för jämförelser (t.ex. HbA1c grupperat efter behandling).",
    input_schema: {
      type: "object",
      properties: {
        field: {
          type: "string",
          description: "Fältet att beräkna statistik för. Numeriska: a (ålder), p (PSA), dd (diabetesduration), h (HbA1c), b (BMI), e (eGFR). Kategoriska: r (riskgrupp), g (Gleason), t (behandling), o (utfall), d (diabetestyp). Binära: ht, rt, nf, kd."
        },
        group_by: {
          type: "string",
          description: "Valfritt: gruppera statistiken efter detta fält. T.ex. field='h' + group_by='t' ger medel-HbA1c per behandling."
        },
        filters: {
          type: "object",
          description: "Valfria filter att applicera innan beräkning. Samma format som search_patients.",
          additionalProperties: true
        }
      },
      required: ["field"]
    }
  },
  {
    name: "count_patients",
    description: "Räkna antal patienter som matchar givna kriterier. Returnerar antal, totalt och procent. Använd detta för snabba 'hur många'-frågor.",
    input_schema: {
      type: "object",
      properties: {
        filters: {
          type: "object",
          description: "Filtreringskriterier. Samma format som search_patients. Tomt = alla 100 patienter.",
          additionalProperties: true
        }
      },
      required: []
    }
  },
  {
    name: "cross_tabulate",
    description: "Korstabell av två fält. Visar antal patienter per kombination av två variabler. Perfekt för att analysera samband, t.ex. behandling × utfall, riskgrupp × behandling, diabetestyp × utfall.",
    input_schema: {
      type: "object",
      properties: {
        field1: {
          type: "string",
          description: "Första fältet (rader i tabellen). T.ex. 't' för behandling."
        },
        field2: {
          type: "string",
          description: "Andra fältet (kolumner i tabellen). T.ex. 'o' för utfall."
        },
        filters: {
          type: "object",
          description: "Valfria filter.",
          additionalProperties: true
        }
      },
      required: ["field1", "field2"]
    }
  },
  {
    name: "get_time_series",
    description: "Hämta tidsserie-data (longitudinella mätningar) för PSA, HbA1c eller eGFR. Returnerar medelvärden per tidpunkt, eventuellt grupperat per behandling/utfall/riskgrupp. PSA-tidpunkter: baseline, 3mo, 6mo, 12mo, 24mo. HbA1c/eGFR-tidpunkter: baseline, 6mo, 12mo, 24mo. Perfekt för frågor om 'hur utvecklas PSA efter behandling' eller 'hur påverkas HbA1c av ADT över tid'.",
    input_schema: {
      type: "object",
      properties: {
        measure: {
          type: "string",
          enum: ["psa", "hba1c", "egfr"],
          description: "Vilket mått att hämta tidsserie för: 'psa' (PSA ng/mL), 'hba1c' (HbA1c mmol/mol), 'egfr' (eGFR mL/min/1.73m²)."
        },
        group_by: {
          type: "string",
          description: "Valfritt: gruppera efter detta fält för jämförelser. T.ex. 't' för att se PSA-utveckling per behandling, 'o' per utfall, 'd' per diabetestyp."
        },
        filters: {
          type: "object",
          description: "Valfria filter. Samma format som search_patients.",
          additionalProperties: true
        }
      },
      required: ["measure"]
    }
  },
  {
    name: "get_patient_time_series",
    description: "Hämta detaljerade tidsserier för specifika individuella patienter (via patient-ID). Använd detta efter search_patients för att granska enskilda patienters förlopp i detalj.",
    input_schema: {
      type: "object",
      properties: {
        patient_ids: {
          type: "array",
          items: { type: "number" },
          description: "Lista med patient-ID:n att hämta tidsserier för."
        },
        measures: {
          type: "array",
          items: { type: "string", enum: ["psa", "hba1c", "egfr"] },
          description: "Vilka mått att inkludera. Default: alla tre."
        }
      },
      required: ["patient_ids"]
    }
  }
];

// Exekvera ett verktygsanrop
function executeTool(name, input) {
  switch (name) {
    case "search_patients":
      return db.searchPatients(input.filters, input.fields, Math.min(input.limit || 20, 100));
    case "get_statistics":
      return db.getStatistics(input.field, input.group_by, input.filters);
    case "count_patients":
      return db.countPatients(input.filters);
    case "cross_tabulate":
      return db.crossTabulate(input.field1, input.field2, input.filters);
    case "get_time_series":
      return db.getTimeSeries(input.measure, input.group_by, input.filters);
    case "get_patient_time_series":
      return db.getPatientTimeSeries(input.patient_ids, input.measures);
    default:
      return { error: "Unknown tool: " + name };
  }
}

var SYSTEM_PROMPT = "Du är en klinisk dataanalytiker med tillgång till en patientkohort via databasverktyg.\n\n"
  + "KOHORT: 100 män 50-65 år med prostatacancer (C61) + insulinbehandlad diabetes (E10/E11). Syntetisk data baserad på svensk epidemiologi.\n\n"
  + "TILLGÄNGLIGA FÄLT:\n"
  + "- a: Ålder (50-65 år)\n"
  + "- r: Riskgrupp (very_low, low, intermediate_fav, intermediate_unfav, high, very_high_metastatic)\n"
  + "- g: Gleason (3+3=6, 3+4=7, 4+3=7, 4+4=8, 4+5=9, 5+4=9)\n"
  + "- p: PSA vid diagnos (ng/mL)\n"
  + "- t: Behandling (EBRT, RALP, EBRT_ADT, active_surveillance, RALP_adj, palliative, ADT_only, ADT_chemo)\n"
  + "- o: Utfall (curative_good, curative_side_effects, biochemical_recurrence, local_progression, stable_AS, deceased_cancer, deceased_other, partial_response, reclassified_to_treatment, progression)\n"
  + "- d: Diabetestyp (T1, T2)\n"
  + "- dd: Diabetesduration (år)\n"
  + "- h: HbA1c (mmol/mol)\n"
  + "- b: BMI\n"
  + "- e: eGFR (mL/min/1.73m²)\n"
  + "- ht: Hypertoni (0/1)\n"
  + "- rt: Retinopati (0/1)\n"
  + "- nf: Nefropati (0/1)\n"
  + "- kd: Kardiovaskulär sjukdom (0/1)\n\n"
  + "LONGITUDINELLA TIDSSERIER (per patient):\n"
  + "- psa_series: PSA-värden vid baseline, 3mo, 6mo, 12mo, 24mo\n"
  + "- hba1c_series: HbA1c-värden vid baseline, 6mo, 12mo, 24mo\n"
  + "- egfr_series: eGFR-värden vid baseline, 6mo, 12mo, 24mo\n"
  + "Använd get_time_series för aggregerade trender och get_patient_time_series för individuella förlopp.\n\n"
  + "INSTRUKTIONER:\n"
  + "1. Använd ALLTID verktygen för att hämta data. Gissa aldrig siffror.\n"
  + "2. Gör flera verktygsanrop om det behövs för att svara fullständigt.\n"
  + "3. Svara på svenska med åäö.\n"
  + "4. Ange exakta siffror: antal, procent, medelvärden.\n"
  + "5. Skriv 4-10 meningar ren löptext. Ingen markdown (inga **, #, punktlistor). Inga taggar.\n"
  + "6. Om frågan gäller enskilda patienter, använd search_patients och nämn relevanta detaljer.\n"
  + "7. För tidsseriefrågor (utveckling över tid, trender, förlopp), använd get_time_series. Gruppera gärna per behandling eller utfall för jämförelser.";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  var userMessage = req.body.message;
  var vizInstruction = req.body.vizInstruction || "";
  if (!userMessage) {
    return res.status(400).json({ error: "Missing message" });
  }

  var systemPrompt = SYSTEM_PROMPT + vizInstruction;
  var messages = [{ role: "user", content: userMessage }];

  try {
    // Tool use loop — max 5 iterationer
    var maxIterations = 5;
    var finalText = "";
    var toolTrace = []; // Spåra alla verktygsanrop för transparens

    for (var i = 0; i < maxIterations; i++) {
      var body = {
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: systemPrompt,
        tools: TOOLS,
        messages: messages
      };

      var response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify(body)
      });

      var data = await response.json();

      if (data.error) {
        return res.status(500).json({ error: data.error.message || data.error });
      }

      // Samla text och tool_use blocks
      var textParts = [];
      var toolUses = [];

      if (data.content) {
        data.content.forEach(function(block) {
          if (block.type === "text") textParts.push(block.text);
          if (block.type === "tool_use") toolUses.push(block);
        });
      }

      finalText += textParts.join("");

      // Om inga tool_use, eller stop_reason !== "tool_use", är vi klara
      if (data.stop_reason !== "tool_use" || toolUses.length === 0) {
        break;
      }

      // Lägg till assistantens svar i meddelandehistoriken
      messages.push({ role: "assistant", content: data.content });

      // Exekvera alla verktygsanrop, spara trace, skicka resultat
      var toolResults = toolUses.map(function(tu) {
        var result = executeTool(tu.name, tu.input);
        toolTrace.push({
          tool: tu.name,
          input: tu.input,
          result: result
        });
        return {
          type: "tool_result",
          tool_use_id: tu.id,
          content: JSON.stringify(result)
        };
      });

      messages.push({ role: "user", content: toolResults });
    }

    res.status(200).json({
      content: [{ type: "text", text: finalText }],
      tool_trace: toolTrace
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
