import React from "react";

// NPÖ-kontraktsdata — extraherad från App.jsx
export var KONTRAKT = [
  {
    id: "gcc",
    namn: "GetCareContacts",
    version: "3.0",
    domain: "clinicalprocess:logistics:logistics",
    desc: "Alla vardkontakter: besok, dagkirurgi, rontgen, stralbehandling, telefonkontakter",
    variabler: [
      // Header (PatientSummaryHeaderType)
      { grupp: "Header", falt: "documentId", def: "Unikt dokument-ID", typ: "xs:string", status: "nytt", testdata: "gcc-2025-06-15-001" },
      { grupp: "Header", falt: "sourceSystemHSAId", def: "Kallsystem HSA-ID", typ: "HSAIdType", status: "nytt", testdata: "SE2321000016-A2G8" },
      { grupp: "Header", falt: "documentTime", def: "Dokumentationstidpunkt", typ: "TimeStampType", status: "nytt", testdata: "20250615T143200" },
      { grupp: "Header", falt: "patientId", def: "Personnummer (12 siffror)", typ: "PersonIdType", status: "nytt", testdata: "{ id: '194720415XXXX', type: '1.2.752.129.2.1.3.1' }" },
      { grupp: "Header", falt: "accountableHealthcareProfessional.healthcareProfessionalHSAId", def: "Ansvarig lakares HSA-ID", typ: "HSAIdType", status: "nytt", testdata: "SE2321000016-PRS001 (Dr Johansson)" },
      { grupp: "Header", falt: "accountableHealthcareProfessional.healthcareProfessionalName", def: "Ansvarigs namn", typ: "xs:string", status: "finns", testdata: "Dr Lars Johansson" },
      { grupp: "Header", falt: "accountableHealthcareProfessional.authorTime", def: "Tidpunkt for dokumentation", typ: "TimeStampType", status: "nytt", testdata: "20250615T150000" },
      { grupp: "Header", falt: "accountableHealthcareProfessional.healthcareProfessionalRoleCode", def: "Yrkesroll (kodad)", typ: "CVType", status: "nytt", testdata: "{ code: 'LK', displayName: 'Lakare' }" },
      { grupp: "Header", falt: "accountableHealthcareProfessional.healthcareProfessionalOrgUnit.orgUnitHSAId", def: "Organisationsenhet HSA-ID", typ: "HSAIdType", status: "nytt", testdata: "SE2321000016-1MG3 (Urologmott MSE)" },
      { grupp: "Header", falt: "accountableHealthcareProfessional.healthcareProfessionalOrgUnit.orgUnitName", def: "Enhetsnamn", typ: "xs:string", status: "finns", testdata: "Urologmottagningen, MSE" },
      { grupp: "Header", falt: "accountableHealthcareProfessional.healthcareProfessionalCareGiverHSAId", def: "Vardgivare HSA-ID", typ: "xs:string", status: "nytt", testdata: "SE2321000016-39KJ (Region Sormland)" },
      { grupp: "Header", falt: "legalAuthenticator.signatureTime", def: "Signeringstid", typ: "TimeStampType", status: "nytt", testdata: "20250615T153000" },
      { grupp: "Header", falt: "legalAuthenticator.legalAuthenticatorHSAId", def: "Signerares HSA-ID", typ: "HSAIdType", status: "nytt", testdata: "SE2321000016-PRS001" },
      { grupp: "Header", falt: "approvedForPatient", def: "Godkand for visning via 1177", typ: "xs:boolean", status: "nytt", testdata: "true" },
      { grupp: "Header", falt: "careContactId", def: "Vardkontakt-ID (lankar till andra kontrakt)", typ: "xs:string", status: "nytt", testdata: "VK-MSE-2025-06-15-4832" },
      { grupp: "Header", falt: "nullified", def: "Makulerad", typ: "xs:boolean", status: "nytt", testdata: "false" },
      // Body
      { grupp: "Body", falt: "careContactTimePeriod.start", def: "Kontaktstart", typ: "TimeStampType", status: "finns", testdata: "2025-06-15 (finns for alla 19 kontakter)" },
      { grupp: "Body", falt: "careContactTimePeriod.end", def: "Kontaktslut", typ: "TimeStampType", status: "nytt", testdata: "20250615T160000" },
      { grupp: "Body", falt: "careContactCode", def: "Kontakttyp (kodad)", typ: "CVType", status: "nytt", testdata: "{ code: '1', codeSystem: '1.2.752.129.5.3', displayName: 'Besok' }" },
      { grupp: "Body", falt: "careContactStatus", def: "Planerad/oplanerad (ej boolean)", typ: "CVType", status: "nytt", testdata: "{ code: '2', displayName: 'Genomford' }" },
      { grupp: "Body", falt: "careContactOrgUnit.orgUnitHSAId", def: "Enhetens HSA-ID", typ: "HSAIdType", status: "nytt", testdata: "SE2321000016-1MG3" },
      { grupp: "Body", falt: "careContactOrgUnit.orgUnitName", def: "Enhetsnamn", typ: "xs:string", status: "finns", testdata: "5 olika enheter: VC Strangnas, Urolog/Onkolog/Endokrin/Rontgen MSE" },
    ]
  },
  {
    id: "gd",
    namn: "GetDiagnosis",
    version: "2.0",
    domain: "clinicalprocess:healthcond:description",
    desc: "ICD-10-SE-kodade diagnoser kopplade till vardkontakter",
    variabler: [
      { grupp: "Header", falt: "documentId", def: "Unikt ID", typ: "xs:string", status: "nytt", testdata: "diag-C619-2024-04-18-001" },
      { grupp: "Header", falt: "sourceSystemHSAId", def: "Kallsystems HSA-ID", typ: "HSAIdType", status: "nytt", testdata: "SE2321000016-A2G8" },
      { grupp: "Header", falt: "careContactId", def: "Koppling till vardkontakt", typ: "xs:string", status: "nytt", testdata: "VK-MSE-2024-04-02-2381 (biopsibeskedsbesok)" },
      { grupp: "Header", falt: "(ovriga header-falt)", def: "Se GetCareContacts header", typ: "diverse", status: "nytt", testdata: "Samma struktur som ovan" },
      { grupp: "Body", falt: "diagnosisCode.code", def: "ICD-10-SE-kod", typ: "xs:string", status: "finns", testdata: "E10.9, E10.3A, E10.2, I10.9, E78.0, C61.9, N39.4, N48.4" },
      { grupp: "Body", falt: "diagnosisCode.codeSystem", def: "Kodverk OID", typ: "xs:string", status: "nytt", testdata: "1.2.752.116.1.1.1.3.2 (ICD-10-SE)" },
      { grupp: "Body", falt: "diagnosisCode.displayName", def: "Klartext", typ: "xs:string", status: "finns", testdata: "T.ex. 'Malign tumor i prostata'" },
      { grupp: "Body", falt: "diagnosisType", def: "Huvuddiagnos/bidiagnos", typ: "CVType", status: "nytt", testdata: "C61.9: { code: 'H', displayName: 'Huvuddiagnos' }. E10.9: { code: 'B', displayName: 'Bidiagnos' }" },
      { grupp: "Body", falt: "diagnosisTime", def: "Diagnosdatum", typ: "TimeStampType", status: "finns", testdata: "Alla 8 har datum (t.ex. 2024-04-18 for C61.9)" },
      { grupp: "Body", falt: "chronicDiagnosis", def: "Kronisk diagnos", typ: "xs:boolean", status: "nytt", testdata: "true for E10.x, I10.9, E78.0. false for C61.9, N39.4, N48.4" },
    ]
  },
  {
    id: "gcd",
    namn: "GetCareDocumentation",
    version: "3.0",
    domain: "clinicalprocess:healthcond:description",
    desc: "Kliniska anteckningar (fritext i DocBook-format)",
    variabler: [
      { grupp: "Header", falt: "documentId", def: "Unikt antecknings-ID", typ: "xs:string", status: "nytt", testdata: "doc-MSE-2025-06-15-001" },
      { grupp: "Header", falt: "documentTitle", def: "Dokumenttitel", typ: "xs:string", status: "finns", testdata: "T.ex. 'Uppfoljning 6 man efter stralbehandling'" },
      { grupp: "Header", falt: "documentTime", def: "Dokumentationstid", typ: "TimeStampType", status: "finns", testdata: "9 anteckningar 2023-09-15 till 2025-06-15 (saknar klockslag)" },
      { grupp: "Header", falt: "careContactId", def: "Koppling till vardkontakt", typ: "xs:string", status: "nytt", testdata: "VK-MSE-2025-06-15-4832" },
      { grupp: "Header", falt: "accountableHealthcareProfessional.*", def: "Forfattare (se header ovan)", typ: "diverse", status: "delvis", testdata: "Namn+titel finns. HSA-ID saknas." },
      { grupp: "Header", falt: "legalAuthenticator.signatureTime", def: "Signeringstidpunkt", typ: "TimeStampType", status: "nytt", testdata: "20250615T160000 (signerad samma dag)" },
      { grupp: "Header", falt: "approvedForPatient", def: "Synlig for patient via 1177", typ: "xs:boolean", status: "nytt", testdata: "true (alla 9 + nya signerade)" },
      { grupp: "Body", falt: "clinicalDocumentNoteCode", def: "Anteckningstyp (kodad)", typ: "CVType", status: "nytt", testdata: "Befintliga: { code: 'mot', displayName: 'Mottagningsanteckning' }. NYA: 'dag' (dagkirurgi), 'epi' (epikris), 'omv' (omvardnad)" },
      { grupp: "Body", falt: "clinicalDocumentNoteTitle", def: "Rubrik", typ: "xs:string", status: "finns", testdata: "Alla 9 har rubrik" },
      { grupp: "Body", falt: "clinicalDocumentNoteTime", def: "Anteckningstid", typ: "TimeStampType", status: "finns", testdata: "Alla har datum" },
      { grupp: "Body", falt: "clinicalDocumentNoteText", def: "Brodtext (DocBook XML)", typ: "xs:string", status: "finns", testdata: "9 detaljerade fritext-anteckningar" },
      { grupp: "Body (GAP)", falt: "NYTT: Biopsianteckning 2024-03-18", def: "Dagkirurgisk anteckning", typ: "fritext", status: "nytt", testdata: "Dagkirurgi. Transrektal UL-ledd prostatabiopsi. 12 syst + 3 riktade kolvar mot PI-RADS 4-lesion hoger mid. Antibiotika-profylax Ciprofloxacin 500 mg x 2 startad dagen fore. Komplikationsfri atgard. Pat stabil, hemgang. Information om att kontakta vid feber >38.5 eller blodning." },
      { grupp: "Body (GAP)", falt: "NYTT: Stralbehandling avslut 2024-11-08", def: "Avslutningsanteckning", typ: "fritext", status: "nytt", testdata: "Stralbehandling avslutad. 60 Gy / 20 fraktioner, VMAT mot prostata + vesiculae seminales. Behandling genomford utan avbrott. Akuta biverkningar: RTOG grad 1 tarmbesvar (losa avforingar 3-4/dag), grad 1 urinvagsbesvar (nokturi x3, urgency). Ingen hematuri. Blodsockerkontroll: inga speciella problem under stralningen, insulin oforandrat. Plan: PSA-kontroll om 6 veckor. Fortsatt ADT enl plan." },
      { grupp: "Body (GAP)", falt: "NYTT: Diabetesssk 2024-07-10", def: "Omvardnadsanteckning", typ: "fritext", status: "nytt", testdata: "Telefonuppfoljning diabetessjukskoterska. Erik rapporterar svangande blodsockervarden efter ADT-start. Libre visar TIR 48%, TAR (>10) 38%. Gatt igenom kolhydratrakning. Justerat NovoRapid-kvoter: frukost 1:8, lunch 1:9, middag 1:8. Paminnt om att kontakta vid P-glukos >20 upprepat. Aterbesok hos Dr Lindberg 2024-09-12." },
      { grupp: "Body (GAP)", falt: "NYTT: Epikris stralbehandling 2024-11-15", def: "Sammanfattning/epikris", typ: "fritext", status: "nytt", testdata: "Epikris - Stralbehandling prostatacancer. Diagnos: Prostatacancer cT2a N0 M0, Gleason 3+4=7, ISUP 2. Behandling: EBRT 60 Gy/20 fx (VMAT) 2024-10-14 till 2024-11-08 + leuprorelin 22.5 mg s.c. var 3:e man (start 2024-06-05, plan t.o.m. 2026-06). Komorbiditet: DM typ 1 med forsamrad kontroll under ADT (HbA1c 56->62 mmol/mol). Endokrinologisk samuppfoljning pagaende. Uppfoljning: PSA + testosteron var 6:e manad. Ansvarig: Dr Anna Akesson, Onkologmottagningen MSE." },
    ]
  },
  {
    id: "gmh",
    namn: "GetMedicationHistory",
    version: "2.1",
    domain: "clinicalprocess:activityprescription:actoutcome",
    desc: "Lakemedelsordinationer (ATC-kodade). Sedan dec 2025 kopplad till NLL.",
    variabler: [
      { grupp: "Header", falt: "documentId", def: "Ordinations-ID", typ: "xs:string", status: "nytt", testdata: "med-A10AE06-2019-001 (Tresiba)" },
      { grupp: "Header", falt: "sourceSystemHSAId", def: "Kallsystem", typ: "HSAIdType", status: "nytt", testdata: "SE2321000016-A2G8" },
      { grupp: "Header", falt: "careContactId", def: "Kopplad vardkontakt", typ: "xs:string", status: "nytt", testdata: "VK-MSE-2024-09-12-3201 (for dosandring)" },
      { grupp: "Body", falt: "atcCode", def: "ATC-klassificering", typ: "CVType", status: "finns", testdata: "9 lakemedel: A10AE06, A10AB05, C09AA02, C10AA05, C08CA01, L02AE02, L02BB01, G04BE03, A12AX" },
      { grupp: "Body", falt: "productName", def: "Varunamn/substansnamn", typ: "xs:string", status: "finns", testdata: "T.ex. 'Tresiba (insulin degludek)'" },
      { grupp: "Body", falt: "unstructuredDrugInformation", def: "Fritext-dosering", typ: "xs:string", status: "finns", testdata: "T.ex. '22 E subkutant till kvallen'" },
      { grupp: "Body", falt: "prescriptionTime", def: "Ordinationstidpunkt", typ: "TimeStampType", status: "finns", testdata: "Startdatum for alla 9" },
      { grupp: "Body", falt: "prescriptionPeriod", def: "Start- och slutdatum", typ: "TimePeriodType", status: "delvis", testdata: "Start finns. Slut bara for Bikalutamid." },
      { grupp: "Body", falt: "prescriberId (HSA-ID)", def: "Forskrivares HSA-ID", typ: "HSAIdType", status: "nytt", testdata: "SE2321000016-PRS003 (Dr Lindberg) for insulin, SE2321000016-PRS004 (Dr Akesson) for ADT" },
      { grupp: "Body", falt: "typeOfPrescription", def: "Ordinationstyp", typ: "CVType", status: "nytt", testdata: "{ code: 'once', displayName: 'Engangsdos' } for Bikalutamid. { code: 'continuous', displayName: 'Staende ordination' } for ovriga." },
      { grupp: "Body (GAP)", falt: "NYTT: Metformin", def: "Tillagd sept 2024", typ: "CVType", status: "nytt", testdata: "{ atc: 'A10BA02', namn: 'Metformin', dos: '500 mg x 2', start: '2024-09-12', forsk: 'Dr Lindberg' }" },
      { grupp: "Body (GAP)", falt: "NYTT: Atorvastatin dosandring", def: "Hojd dos okt 2024", typ: "CVType", status: "nytt", testdata: "{ atc: 'C10AA05', namn: 'Atorvastatin', dos: '40 mg x 1' (andrat fran 20 mg), start: '2024-09-12' }" },
    ]
  },
  {
    id: "gloo",
    namn: "GetLaboratoryOrderOutcome",
    version: "4.2",
    domain: "clinicalprocess:healthcond:actoutcome",
    desc: "Laboratorieresultat (NPU-kodade). Komplexa resultat stodjer PQ/CV/ST-varden.",
    variabler: [
      { grupp: "Header", falt: "documentId", def: "Resultat-ID", typ: "IIType", status: "nytt", testdata: "{ root: '1.2.752.129.2.1.2.1', extension: 'lab-MSE-2025-06-15-PSA' }" },
      { grupp: "Header", falt: "sourceSystemHSAId", def: "Labbsystem HSA-ID", typ: "HSAIdType", status: "nytt", testdata: "SE2321000016-LAB1" },
      { grupp: "Body", falt: "groupOfAnalyses.analysis.code", def: "NPU-kod", typ: "CVType", status: "finns", testdata: "12 unika NPU-koder (NPU08669 PSA, NPU27300 HbA1c, NPU08642 Testosteron m.fl.)" },
      { grupp: "Body", falt: "groupOfAnalyses.analysis.result.value (pq)", def: "Numeriskt resultat + enhet", typ: "PQType", status: "finns", testdata: "30+ varden med enhet och ref.intervall" },
      { grupp: "Body", falt: "groupOfAnalyses.analysis.result.reference", def: "Referensintervall", typ: "xs:string / interval", status: "finns", testdata: "T.ex. '<3.0', '60-105', '>60'" },
      { grupp: "Body", falt: "groupOfAnalyses.analysis.result.pathologicalFlag", def: "H/L-flagga", typ: "CVType", status: "finns", testdata: "Flaggade varden markerade (H eller L)" },
      { grupp: "Body", falt: "groupOfAnalyses.analysis.timestamp", def: "Provtagningstid", typ: "TimeStampType", status: "finns", testdata: "Datum finns for alla (klockslag saknas)" },
      { grupp: "Body", falt: "groupOfAnalyses.analysis.status", def: "Analysstatus (SNOMED CT)", typ: "CVType", status: "nytt", testdata: "{ code: '398166005', codeSystem: 'SNOMED CT', displayName: 'utford' }" },
      { grupp: "Body", falt: "groupOfAnalyses.analysis.method", def: "Analysmetod", typ: "CVType", status: "nytt", testdata: "PSA: immunokemisk. HbA1c: IFCC HPLC." },
      { grupp: "Body", falt: "specimen.material", def: "Provmaterial (SNOMED CT)", typ: "CVType", status: "nytt", testdata: "{ code: '119364003', displayName: 'Serum' } for S-prover. { code: '420135007', displayName: 'Helblod' } for B-prover." },
      { grupp: "Body", falt: "referral.requester", def: "Bestallarens HSA-ID", typ: "HSAIdType", status: "nytt", testdata: "SE2321000016-PRS001 (Dr Johansson) for PSA, SE2321000016-PRS003 (Dr Lindberg) for HbA1c" },
      { grupp: "Body", falt: "accredited", def: "Ackrediterad analys", typ: "xs:boolean", status: "nytt", testdata: "true (Klinisk kemi MSE ar SWEDAC-ackrediterat)" },
      { grupp: "Body (GAP)", falt: "NYTT: P-HDL-kolesterol", def: "Saknades i lipidpanel", typ: "PQType", status: "nytt", testdata: "2023-09-15: 1.1 mmol/L (ref >1.0). 2024-09-12: 0.9 mmol/L (L)" },
      { grupp: "Body (GAP)", falt: "NYTT: B-LPK (leukocyter)", def: "Relevant vid immunsuppression", typ: "PQType", status: "nytt", testdata: "2024-03-15: 7.2 x10^9/L (ref 3.5-8.8). 2024-09-12: 5.8 x10^9/L" },
      { grupp: "Body (GAP)", falt: "NYTT: B-TPK (trombocyter)", def: "Koagulationsstatus", typ: "PQType", status: "nytt", testdata: "2024-03-15: 238 x10^9/L (ref 145-348)" },
      { grupp: "Body (GAP)", falt: "NYTT: P-ALAT", def: "Leverfunktion (metformin, statin)", typ: "PQType", status: "nytt", testdata: "2024-03-15: 0.42 ukat/L (ref <0.76). 2024-09-12: 0.58 ukat/L. 2025-06-15: 0.51 ukat/L" },
      { grupp: "Body (GAP)", falt: "NYTT: P-Natrium", def: "Elektrolyter", typ: "PQType", status: "nytt", testdata: "2024-03-15: 140 mmol/L (ref 137-145)" },
      { grupp: "Body (GAP)", falt: "NYTT: P-Kalium", def: "Elektrolyter (ACE-hammare)", typ: "PQType", status: "nytt", testdata: "2024-03-15: 4.3 mmol/L (ref 3.5-4.6). 2024-09-12: 4.8 mmol/L (H)" },
    ]
  },
  {
    id: "gio",
    namn: "GetImagingOutcome",
    version: "1.0",
    domain: "clinicalprocess:healthcond:actoutcome",
    desc: "Bilddiagnostiksvar (rontgen, MR, DT, scintigrafi). Fritexter + ev. PDF.",
    variabler: [
      { grupp: "Header", falt: "documentId", def: "Svarets ID", typ: "xs:string", status: "nytt", testdata: "img-MSE-2024-02-26-001 (MR prostata)" },
      { grupp: "Header", falt: "careContactId", def: "Kopplad vardkontakt", typ: "xs:string", status: "nytt", testdata: "VK-MSE-2024-02-26-1892" },
      { grupp: "Body", falt: "imagingOutcomeBody.examinationTimePeriod", def: "Undersokningsdatum", typ: "TimePeriodType", status: "finns", testdata: "2 undersokningar: 2024-02-26 (MR), 2024-09-20 (DT)" },
      { grupp: "Body", falt: "imagingOutcomeBody.result (fritext)", def: "Fullstandigt rontgensvar", typ: "xs:string", status: "finns", testdata: "Kompletta svar for MR prostata + DT thorax-buk" },
      { grupp: "Body", falt: "accountableHealthcareProfessional.authorTime", def: "Dikteringstid", typ: "TimeStampType", status: "nytt", testdata: "20240226T154500 (MR), 20240920T110000 (DT)" },
      { grupp: "Body", falt: "accountableHealthcareProfessional.healthcareProfessionalHSAId", def: "Radiolog HSA-ID", typ: "HSAIdType", status: "nytt", testdata: "SE2321000016-PRS005 (Dr Eriksson), SE2321000016-PRS006 (Dr Magnusson)" },
      { grupp: "Body (GAP)", falt: "NYTT: DEXA-resultat 2024-06-20", def: "Bentathetsmatning", typ: "fritext", status: "nytt", testdata: "DEXA bentathetsmatning. Fragestallning: Osteoporosrisk, ADT-start. L1-L4: T-score -1.4, Z-score -0.8. Collum femoris: T-score -1.2, Z-score -0.5. Bedomning: Osteopeni. Rekommendation: Kalcium + D-vitamin, vikbarande traning. Kontroll om 2 ar." },
    ]
  },
  {
    id: "gro",
    namn: "GetReferralOutcome",
    version: "3.1",
    domain: "clinicalprocess:healthcond:actoutcome",
    desc: "Remissvar inkl. PAD-svar, konsultationssvar. Stodjer base64 PDF.",
    variabler: [
      { grupp: "Header", falt: "documentId", def: "Remisssvarets ID", typ: "xs:string", status: "nytt", testdata: "ref-PAT-2024-03-28-001 (PAD prostatabiopsi)" },
      { grupp: "Body", falt: "referralOutcomeBody (fritext)", def: "Svartext", typ: "xs:string", status: "finns", testdata: "Komplett PAD: 15 kolvar, Gleason 3+4=7, ISUP 2, 5/15 positiva" },
      { grupp: "Body", falt: "referralOutcomeBody (base64 PDF)", def: "PDF-bilaga", typ: "xs:base64Binary", status: "nytt", testdata: "(Simulerad: PAD-rapport som PDF)" },
      { grupp: "Body (GAP)", falt: "NYTT: Ogonbotten-remissvar 2023-11-10", def: "Retinopati-screening", typ: "fritext", status: "nytt", testdata: "Ogonbottenundersokning. Hoger oga: 2 st mikroaneurysm nasalt om fovea. Vanster oga: 1 st mikroaneurysm + 1 hemoragiflock. Bedomning: Lindrig icke-proliferativ diabetesretinopati bilat, oforandrad sedan 2022. Kontroll om 12 man." },
      { grupp: "Body (GAP)", falt: "NYTT: Onkologkonsultation-svar 2024-05-15", def: "Svar pa remiss fran urologi", typ: "fritext", status: "nytt", testdata: "Konsultationssvar. Tackar for remiss ang pat med prostatacancer, intermediate risk unfav. Planerar EBRT 60 Gy/20 fx + ADT 24 man. Beaktar DM typ 1 med suboptimal kontroll - endokrinologisk samuppfoljning tillstyrks starkt. Tidbokning stralplanering 2024-09-25 (guldmarkorinlaggning) foljt av start ca v42." },
    ]
  },
  {
    id: "gai",
    namn: "GetAlertInformation",
    version: "3.0",
    domain: "clinicalprocess:healthcond:description",
    desc: "Varningar: overkansligahet (4 subtyper), allvarlig sjukdom, behandlingsvarning, ostrukturerad.",
    variabler: [
      { grupp: "Header", falt: "documentId", def: "Varningens ID", typ: "xs:string", status: "nytt", testdata: "alert-001 (kodein), alert-002 (DM1)" },
      { grupp: "Body", falt: "typeOfAlertInformation", def: "Varningstyp (kodad)", typ: "CVType", status: "finns", testdata: "Overkansligahet + Allvarlig sjukdom" },
      { grupp: "Body - Overkansligahet", falt: "hypersensitivity.hypersensitivityAgent", def: "ATC-kodad substans", typ: "CVType", status: "finns", testdata: "{ code: 'N02AA59', displayName: 'Kodein' }" },
      { grupp: "Body - Overkansligahet", falt: "hypersensitivity.hypersensitivitySeverity", def: "Allvarlighetsgrad (kv_allvarlighetsgrad)", typ: "CVType", status: "nytt", testdata: "{ code: '3', codeSystem: '1.2.752.129.2.2.3.3', displayName: 'Besvarande' } (OBS: INTE Hog/Medel/Lag!)" },
      { grupp: "Body - Overkansligahet", falt: "hypersensitivity.hypersensitivityDegreeOfCertainty", def: "Visshetsgrad (kv_visshetsgrad)", typ: "CVType", status: "nytt", testdata: "{ code: '2', codeSystem: '1.2.752.129.2.2.3.11', displayName: 'Konstaterad' }" },
      { grupp: "Body - Overkansligahet", falt: "hypersensitivity.pharmaceuticalHypersensitivity", def: "Lakemedelsoverkansligahet", typ: "xs:boolean", status: "nytt", testdata: "true" },
      { grupp: "Body - Allvarlig sjukdom", falt: "seriousDisease.disease", def: "ICD-10-kodad sjukdom", typ: "CVType", status: "finns", testdata: "{ code: 'E10.9', displayName: 'Diabetes mellitus typ 1' }" },
      { grupp: "Body - Allvarlig sjukdom", falt: "seriousDisease.validityTimePeriod", def: "Giltighetsperiod", typ: "TimePeriodType", status: "finns", testdata: "start: 2000-03-12, end: (oppet)" },
      { grupp: "Body (GAP)", falt: "NYTT: treatmentCaveat (Behandlingsvarning)", def: "ADT + diabetes-interaktion", typ: "TreatmentCaveatType", status: "nytt", testdata: "{ type: 'Metabol risk', desc: 'Pagaende ADT (leuprorelin). OBS okad insulinresistens, monitorera HbA1c var 3:e manad. Undvik langvariga steroidkurer.' }" },
    ]
  },
  {
    id: "gvh",
    namn: "GetVaccinationHistory",
    version: "2.0",
    domain: "clinicalprocess:activityprescription:actoutcome",
    desc: "Vaccinationer med ATC-kod, batchnummer och administrerande enhet.",
    variabler: [
      { grupp: "Header", falt: "documentId", def: "Vaccinations-ID", typ: "xs:string", status: "nytt", testdata: "vacc-2024-10-01-001" },
      { grupp: "Body", falt: "vaccinationTime", def: "Vaccinationsdatum", typ: "TimeStampType", status: "finns", testdata: "4 vaccinationer: 2023-10-15 (2 st), 2024-10-01 (2 st)" },
      { grupp: "Body", falt: "atcCode", def: "ATC-kod", typ: "CVType", status: "finns", testdata: "J07BB02 (Influensa), J07AL01 (Pneumokock), J07BX03 (Covid-19)" },
      { grupp: "Body", falt: "productName", def: "Vaccinnamn", typ: "xs:string", status: "finns", testdata: "Vaxigrip Tetra, Pneumovax, Comirnaty" },
      { grupp: "Body", falt: "batchNumber", def: "Batchnummer", typ: "xs:string", status: "nytt", testdata: "KJ4829 (Vaxigrip), LM2847 (Pneumovax), FP8291 (Comirnaty)" },
      { grupp: "Body", falt: "administeringUnit.orgUnitHSAId", def: "Enhet HSA-ID", typ: "HSAIdType", status: "nytt", testdata: "SE2321000016-VC01 (VC Strangnas)" },
    ]
  },
  {
    id: "gfs",
    namn: "GetFunctionalStatus",
    version: "2.1",
    domain: "clinicalprocess:healthcond:description",
    desc: "Funktionstillstand: ICF-kodat, ADL, ECOG. Huvudsakligen kommunal omsorg men relevant for cancer.",
    variabler: [
      { grupp: "Body (NYTT)", falt: "observationCode", def: "Funktionskod", typ: "CVType", status: "nytt", testdata: "ECOG performance status: { code: 'ECOG-PS', displayName: 'ECOG performance status' }" },
      { grupp: "Body (NYTT)", falt: "observationValue", def: "Bedomningsvarde", typ: "xs:string", status: "nytt", testdata: "2024-04-02: '0' (Fullt aktiv). 2024-09-12: '1' (Begransad fysiskt kraftig aktivitet). 2025-06-15: '1'" },
      { grupp: "Body (NYTT)", falt: "observationTime", def: "Bedomningstid", typ: "TimeStampType", status: "nytt", testdata: "2024-04-02, 2024-09-12, 2025-06-15" },
    ]
  },
  {
    id: "gcp",
    namn: "GetCarePlans",
    version: "2.0",
    domain: "clinicalprocess:logistics:logistics",
    desc: "Vardplaner: Min vardplan (cancer), egenvardplan (diabetes). Strukturerad med giltighetsperiod.",
    variabler: [
      { grupp: "Body (NYTT)", falt: "carePlanType", def: "Typ av vardplan", typ: "CVType", status: "nytt", testdata: "{ code: 'MVP', displayName: 'Min vardplan' }" },
      { grupp: "Body (NYTT)", falt: "carePlanTitle", def: "Titel", typ: "xs:string", status: "nytt", testdata: "'Min vardplan - Prostatacancer med ADT'" },
      { grupp: "Body (NYTT)", falt: "carePlanText", def: "Innehall", typ: "xs:string", status: "nytt", testdata: "Mal: Fullfolja stralbehandling + 24 man ADT. Kontakter: urolog var 6 man (PSA), onkolog vid behov, endokrinolog var 3 man (HbA1c, metabol uppfoljning). Egenvard: blodsockermonitorering dagligen, fysisk aktivitet 30 min/dag, styrketraning 2-3 ggr/v. Kontaktuppgifter: Kontaktsjukskoterska onkologi 016-XXXXXX." },
      { grupp: "Body (NYTT)", falt: "validFrom", def: "Giltighet fran", typ: "DateTime", status: "nytt", testdata: "2024-04-10" },
      { grupp: "Body (NYTT)", falt: "validTo", def: "Giltighet till", typ: "DateTime", status: "nytt", testdata: "2026-06-30 (ADT-slut)" },
      { grupp: "Body (NYTT)", falt: "responsibleHsaId", def: "Ansvarig HSA-ID", typ: "HSAIdType", status: "nytt", testdata: "SE2321000016-PRS001 (Dr Johansson, urologi)" },
    ]
  },
  {
    id: "gra",
    namn: "GetRequestActivities",
    version: "2.0",
    domain: "crm:requeststatus",
    desc: "Remisstatusar: skickad, mottagen, besvarad. Sparar remissfloden.",
    variabler: [
      { grupp: "Body (NYTT)", falt: "SVF-remiss VC -> Urologi", def: "2024-01-22", typ: "status", status: "nytt", testdata: "Skickad 2024-01-22, Mottagen 2024-01-24, Tid bokad 2024-02-08. Ledtid: 12 dagar." },
      { grupp: "Body (NYTT)", falt: "Remiss Urologi -> Onkologi", def: "2024-04-10", typ: "status", status: "nytt", testdata: "Skickad 2024-04-10, Mottagen 2024-04-12, Besvarad 2024-05-15." },
      { grupp: "Body (NYTT)", falt: "Remiss Endokrin -> Dietist", def: "2024-09-12", typ: "status", status: "nytt", testdata: "Skickad 2024-09-12, Mottagen 2024-09-18. Ej annu genomford." },
      { grupp: "Body (NYTT)", falt: "Remiss Urologi -> Fysioterapi", def: "2025-06-15", typ: "status", status: "nytt", testdata: "Skickad 2025-06-15. Status: Vantande." },
    ]
  },
  {
    id: "gmmh",
    namn: "GetMaternityMedicalHistory",
    version: "2.0",
    domain: "clinicalprocess:healthcond:actoutcome",
    desc: "Modravard: graviditet, forlossning, eftervard.",
    variabler: [
      { grupp: "-", falt: "(alla variabler)", def: "Modravardsdokumentation", typ: "-", status: "ej-relevant", testdata: "Ej relevant - manlig patient." },
    ]
  },
  {
    id: "go",
    namn: "GetObservations",
    version: "1.0",
    domain: "clinicalprocess:healthcond:basic",
    desc: "Tillvaxtkurvor: langd, vikt, huvudomfang for barn.",
    variabler: [
      { grupp: "-", falt: "(alla variabler)", def: "Tillvaxtkurvor", typ: "-", status: "ej-relevant", testdata: "Ej relevant - vuxen patient (53 ar). Kontraktet ar for pediatriska tillvaxtdata." },
    ]
  },
];

export function StatusTag(props) {
  var s = props.status;
  if (s === "finns") return (<span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: 700, background: "#dcfce7", color: "#166534" }}>Befintlig</span>);
  if (s === "nytt") return (<span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: 700, background: "#dbeafe", color: "#1e40af" }}>Ny / Gap-fylld</span>);
  if (s === "delvis") return (<span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: 700, background: "#fef9c3", color: "#854d0e" }}>Delvis</span>);
  if (s === "ej-relevant") return (<span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: 700, background: "#f3f4f6", color: "#9ca3af" }}>Ej relevant</span>);
  return null;
}