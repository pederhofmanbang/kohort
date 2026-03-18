// Vercel serverless function — Claude tool_use loop för kohortfrågor
// Claude får verktyg för att söka i patientdatabasen istället för att få all data i prompten
// All data deriverad från kohort_100_patienter.json

import * as db from "./cohort-data.js";

// Verktyg som Claude kan anropa
var TOOLS = [
  {
    name: "search_patients",
    description: "Sök och filtrera individuella patienter i kohorten. Returnerar matchande patientposter. Filtrera på valfritt fält: ålder (a), riskgrupp (r), Gleason (g), PSA (p), ISUP-grad (isup), TNM (tnm), PI-RADS (pirads), biopsikolvar pos/tot (cores_pos/cores_total), behandling (t), utfall (o), diabetestyp (d), diabetesduration (dd), HbA1c (h), BMI (b), eGFR (e), hypertoni (ht), hyperkolesterolemi (hk), övervikt (ov), retinopati (rt), nefropati (nf), neuropati (np), kardiovaskulär sjukdom (kd), kommun (municipality), sjukhus (hospital).",
    input_schema: {
      type: "object",
      properties: {
        filters: {
          type: "object",
          description: "Filtreringskriterier. Nyckel = fältnamn. Värde = exakt match (string/number), array för 'any of', eller {min, max} för range.",
          additionalProperties: true
        },
        fields: {
          type: "array",
          items: { type: "string" },
          description: "Vilka fält att returnera per patient. Om tomt returneras alla fält."
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
    description: "Beräkna statistik för ett fält i kohorten. Numeriska fält: medelvärde, median, min, max, standardavvikelse. Kategoriska fält: frekvensfördelning. Kan grupperas efter annat fält.",
    input_schema: {
      type: "object",
      properties: {
        field: {
          type: "string",
          description: "Fältet att beräkna statistik för. Numeriska: a, p, dd, h, b, e, isup, pirads, cores_pos, cores_total. Kategoriska: r, g, t, o, d, tnm, municipality, hospital. Binära: ht, hk, ov, rt, nf, np, kd."
        },
        group_by: {
          type: "string",
          description: "Valfritt: gruppera statistiken efter detta fält."
        },
        filters: {
          type: "object",
          description: "Valfria filter innan beräkning.",
          additionalProperties: true
        }
      },
      required: ["field"]
    }
  },
  {
    name: "count_patients",
    description: "Räkna antal patienter som matchar givna kriterier. Returnerar antal, totalt och procent.",
    input_schema: {
      type: "object",
      properties: {
        filters: {
          type: "object",
          description: "Filtreringskriterier. Tomt = alla 100 patienter.",
          additionalProperties: true
        }
      },
      required: []
    }
  },
  {
    name: "cross_tabulate",
    description: "Korstabell av två fält. Visar antal patienter per kombination av två variabler.",
    input_schema: {
      type: "object",
      properties: {
        field1: { type: "string", description: "Första fältet (rader)." },
        field2: { type: "string", description: "Andra fältet (kolumner)." },
        filters: { type: "object", description: "Valfria filter.", additionalProperties: true }
      },
      required: ["field1", "field2"]
    }
  },
  {
    name: "get_time_series",
    description: "Hämta tidsserie-data (longitudinella mätningar) för PSA, HbA1c eller eGFR. Data deriverad från faktiska labbvärden i patientjournalerna. Returnerar medelvärden vid baseline, 3mo, 6mo, 12mo, 24mo relativt cancerdiagnos.",
    input_schema: {
      type: "object",
      properties: {
        measure: { type: "string", enum: ["psa", "hba1c", "egfr"], description: "Vilket mått." },
        group_by: { type: "string", description: "Valfritt: gruppera efter fält." },
        filters: { type: "object", description: "Valfria filter.", additionalProperties: true }
      },
      required: ["measure"]
    }
  },
  {
    name: "get_patient_time_series",
    description: "Hämta tidsserier för specifika individuella patienter (via ID-nummer 1-100).",
    input_schema: {
      type: "object",
      properties: {
        patient_ids: { type: "array", items: { type: "number" }, description: "Patient-ID:n (1-100)." },
        measures: { type: "array", items: { type: "string", enum: ["psa", "hba1c", "egfr"] }, description: "Vilka mått. Default: alla." }
      },
      required: ["patient_ids"]
    }
  },
  {
    name: "get_patient_detail",
    description: "Hämta fullständig detaljerad information för en patient — demographics, klinisk profil, antal diagnoser/läkemedel/labprover/vårdkontakter. Använd patient_id (t.ex. 'P001') eller numeriskt ID (1-100).",
    input_schema: {
      type: "object",
      properties: {
        patient_id: { type: "string", description: "Patient-ID (t.ex. 'P001' eller '1')." }
      },
      required: ["patient_id"]
    }
  },
  {
    name: "get_patient_diagnoses",
    description: "Hämta alla diagnoser (ICD-10) för en specifik patient. Visar diagnosdatum, ICD-kod, typ (H=huvud, B=bi), vårdgivare.",
    input_schema: {
      type: "object",
      properties: {
        patient_id: { type: "string", description: "Patient-ID (t.ex. 'P001')." }
      },
      required: ["patient_id"]
    }
  },
  {
    name: "get_patient_medications",
    description: "Hämta alla läkemedel (med ATC-koder, doseringar, förskrivare) för en specifik patient.",
    input_schema: {
      type: "object",
      properties: {
        patient_id: { type: "string", description: "Patient-ID (t.ex. 'P001')." }
      },
      required: ["patient_id"]
    }
  },
  {
    name: "get_patient_lab_results",
    description: "Hämta labbresultat för en specifik patient. Kan filtreras på analysnamn (t.ex. 'PSA', 'HbA1c', 'kreatinin').",
    input_schema: {
      type: "object",
      properties: {
        patient_id: { type: "string", description: "Patient-ID (t.ex. 'P001')." },
        lab_name: { type: "string", description: "Valfritt: filtrera på analysnamn (t.ex. 'PSA', 'HbA1c')." }
      },
      required: ["patient_id"]
    }
  },
  {
    name: "get_patient_care_documentation",
    description: "Hämta journalanteckningar/vårdsammanfattningar för en patient. Innehåller fritext från mottagningsbesök, vårdkontakter etc.",
    input_schema: {
      type: "object",
      properties: {
        patient_id: { type: "string", description: "Patient-ID (t.ex. 'P001')." }
      },
      required: ["patient_id"]
    }
  },
  {
    name: "get_patient_imaging",
    description: "Hämta bilddiagnostik-resultat (MR, CT, skelettscint) för en patient. Innehåller modalitet, remittent, utlåtande.",
    input_schema: {
      type: "object",
      properties: {
        patient_id: { type: "string", description: "Patient-ID (t.ex. 'P001')." }
      },
      required: ["patient_id"]
    }
  },
  {
    name: "get_patient_referrals",
    description: "Hämta PAD-svar, remisser och konsultationssvar för en patient.",
    input_schema: {
      type: "object",
      properties: {
        patient_id: { type: "string", description: "Patient-ID (t.ex. 'P001')." }
      },
      required: ["patient_id"]
    }
  },
  {
    name: "get_patient_care_contacts",
    description: "Hämta alla vårdkontakter (besök, telefonkontakter, dagkirurgi etc.) för en patient.",
    input_schema: {
      type: "object",
      properties: {
        patient_id: { type: "string", description: "Patient-ID (t.ex. 'P001')." }
      },
      required: ["patient_id"]
    }
  },
  {
    name: "get_patient_vaccinations",
    description: "Hämta vaccinationshistorik för en patient.",
    input_schema: {
      type: "object",
      properties: {
        patient_id: { type: "string", description: "Patient-ID (t.ex. 'P001')." }
      },
      required: ["patient_id"]
    }
  },
  {
    name: "get_patient_care_plans",
    description: "Hämta vårdplaner för en patient.",
    input_schema: {
      type: "object",
      properties: {
        patient_id: { type: "string", description: "Patient-ID (t.ex. 'P001')." }
      },
      required: ["patient_id"]
    }
  },
  {
    name: "get_patient_alerts",
    description: "Hämta varningar/uppmärksamhetsinformation för en patient (t.ex. allergier, allvarliga sjukdomar).",
    input_schema: {
      type: "object",
      properties: {
        patient_id: { type: "string", description: "Patient-ID (t.ex. 'P001')." }
      },
      required: ["patient_id"]
    }
  },
  {
    name: "search_medications",
    description: "Sök läkemedel i hela kohorten. Filtrera på ATC-kod (t.ex. 'A10BA' för metformin-gruppen) och/eller produktnamn. Kan kombineras med patientfilter.",
    input_schema: {
      type: "object",
      properties: {
        atc_code: { type: "string", description: "ATC-kod eller prefix (t.ex. 'A10BA02' eller 'L02')." },
        product_name: { type: "string", description: "Produktnamn att söka på (delvis matchning)." },
        filters: { type: "object", description: "Patientfilter (samma som search_patients).", additionalProperties: true }
      },
      required: []
    }
  },
  {
    name: "get_medication_statistics",
    description: "Hämta statistik över läkemedelsanvändning i kohorten: vanligaste läkemedlen, ATC-grupper. Kan filtreras på patientegenskaper.",
    input_schema: {
      type: "object",
      properties: {
        filters: { type: "object", description: "Patientfilter.", additionalProperties: true }
      },
      required: []
    }
  },
  {
    name: "search_diagnoses",
    description: "Sök diagnoser (ICD-10) i hela kohorten. Hitta alla patienter med en viss diagnoskod.",
    input_schema: {
      type: "object",
      properties: {
        icd_code: { type: "string", description: "ICD-10-kod eller prefix (t.ex. 'E11' för diabetes typ 2, 'I10' för hypertoni)." },
        filters: { type: "object", description: "Patientfilter.", additionalProperties: true }
      },
      required: []
    }
  },
  {
    name: "search_care_documentation",
    description: "Sök i journalanteckningar (fritext) i hela kohorten. Hitta patienter vars journaltext innehåller ett visst sökord.",
    input_schema: {
      type: "object",
      properties: {
        search_term: { type: "string", description: "Sökterm att leta efter i journaltexter." },
        filters: { type: "object", description: "Patientfilter.", additionalProperties: true }
      },
      required: ["search_term"]
    }
  },
  {
    name: "get_patient_functional_status",
    description: "Hämta funktionsstatus (WHO/ECOG performance status) för en enskild patient.",
    input_schema: {
      type: "object",
      properties: {
        patient_id: { type: "string", description: "Patient-ID, t.ex. 'P001'." }
      },
      required: ["patient_id"]
    }
  }
];

// Exekvera ett verktygsanrop
function executeTool(name, input) {
  try {
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
      case "get_patient_detail":
        return db.getPatientDetail(input.patient_id);
      case "get_patient_diagnoses":
        return db.getPatientDiagnoses(input.patient_id);
      case "get_patient_medications":
        return db.getPatientMedications(input.patient_id);
      case "get_patient_lab_results":
        return db.getPatientLabResults(input.patient_id, input.lab_name);
      case "get_patient_care_documentation":
        return db.getPatientCareDocumentation(input.patient_id);
      case "get_patient_imaging":
        return db.getPatientImaging(input.patient_id);
      case "get_patient_referrals":
        return db.getPatientReferrals(input.patient_id);
      case "get_patient_care_contacts":
        return db.getPatientCareContacts(input.patient_id);
      case "get_patient_vaccinations":
        return db.getPatientVaccinations(input.patient_id);
      case "get_patient_care_plans":
        return db.getPatientCarePlans(input.patient_id);
      case "get_patient_alerts":
        return db.getPatientAlerts(input.patient_id);
      case "get_patient_functional_status":
        return db.getPatientFunctionalStatus(input.patient_id);
      case "search_medications":
        return db.searchMedications(input.atc_code, input.product_name, input.filters);
      case "get_medication_statistics":
        return db.getMedicationStatistics(input.filters);
      case "search_diagnoses":
        return db.searchDiagnoses(input.icd_code, input.filters);
      case "search_care_documentation":
        return db.searchCareDocumentation(input.search_term, input.filters);
      default:
        return { error: "Unknown tool: " + name };
    }
  } catch (err) {
    return { error: "Tool execution failed: " + err.message };
  }
}

var SYSTEM_PROMPT = "Du är en klinisk dataanalytiker med tillgång till en patientkohort via databasverktyg.\n\n"
  + "KOHORT: 100 män 50-65 år med prostatacancer (C61) + insulinbehandlad diabetes (E10/E11). Syntetisk data baserad på svensk epidemiologi.\n\n"
  + "TILLGÄNGLIGA FÄLT (kompakt format):\n"
  + "- a: Ålder (50-65), r: Riskgrupp, g: Gleason, p: PSA vid diagnos\n"
  + "- isup: ISUP-grad (1-5), tnm: TNM-stadium, pirads: PI-RADS (1-5)\n"
  + "- cores_pos/cores_total: Positiva/totala biopsikolvar\n"
  + "- t: Behandling (EBRT, RALP, EBRT_ADT, active_surveillance, RALP_adj, palliative, ADT_only, ADT_chemo)\n"
  + "- o: Utfall (curative_good, curative_side_effects, biochemical_recurrence, local_progression, stable_AS, deceased_cancer, deceased_other, partial_response, reclassified_to_treatment, progression)\n"
  + "- d: Diabetestyp (T1, T2), dd: Diabetesduration (år), h: HbA1c (mmol/mol)\n"
  + "- b: BMI, e: eGFR (mL/min/1.73m²)\n"
  + "- ht: Hypertoni, hk: Hyperkolesterolemi, ov: Övervikt, rt: Retinopati, nf: Nefropati, np: Neuropati, kd: Kardiovaskulär sjukdom (alla 0/1)\n"
  + "- municipality: Kommun, hospital: Sjukhus\n\n"
  + "RIKDATA PER PATIENT (NPÖ-format):\n"
  + "Varje patient har fullständiga journaldata: diagnoser (ICD-10), läkemedel (ATC-koder + doseringar), labbresultat (med datum och värden), journalanteckningar (fritext), bilddiagnostik, PAD-svar, vårdkontakter, vaccinationer, vårdplaner, varningar.\n"
  + "Använd get_patient_detail för att se en patients profil. Använd get_patient_medications, get_patient_lab_results, get_patient_care_documentation etc. för detaljer.\n"
  + "Använd search_medications, search_diagnoses, search_care_documentation för att söka i hela kohorten.\n\n"
  + "TIDSSERIER (deriverade från faktiska labbvärden):\n"
  + "- psa_series: PSA-värden vid baseline, 3mo, 6mo, 12mo, 24mo relativt cancerdiagnos\n"
  + "- hba1c_series: HbA1c-värden vid samma tidpunkter\n"
  + "- egfr_series: eGFR-värden vid samma tidpunkter\n\n"
  + "INSTRUKTIONER:\n"
  + "1. Använd ALLTID verktygen för att hämta data. Gissa aldrig siffror.\n"
  + "2. Gör flera verktygsanrop om det behövs.\n"
  + "3. Svara på svenska med åäö.\n"
  + "4. Ange exakta siffror: antal, procent, medelvärden.\n"
  + "5. Skriv 4-10 meningar ren löptext. Ingen markdown (inga **, #, punktlistor). Inga taggar.\n"
  + "6. Om frågan gäller enskilda patienter, hämta detaljer med get_patient_detail etc.\n"
  + "7. För läkemedelsfrågor, använd search_medications eller get_medication_statistics.\n"
  + "8. För journaltextfrågor, använd search_care_documentation.";

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
    var maxIterations = 8;
    var finalText = "";
    var toolTrace = [];

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
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(25000)
      });

      if (!response.ok) {
        var errBody = await response.text();
        return res.status(response.status).json({ error: "Claude API " + response.status + ": " + errBody.substring(0, 200) });
      }

      var data = await response.json();

      if (data.error) {
        return res.status(500).json({ error: data.error.message || data.error });
      }

      var textParts = [];
      var toolUses = [];

      if (data.content) {
        data.content.forEach(function(block) {
          if (block.type === "text") textParts.push(block.text);
          if (block.type === "tool_use") toolUses.push(block);
        });
      }

      finalText += textParts.join("");

      if (data.stop_reason !== "tool_use" || toolUses.length === 0) {
        break;
      }

      messages.push({ role: "assistant", content: data.content });

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
