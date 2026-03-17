// Frontend data module — allt deriverat från kohort_100_patienter.json
// Ingen hårdkodad data

import RAW from "../data/kohort_100_patienter.json";

// ========== COMPACT PATIENTS (for charts + AI prompts) ==========

var PATIENTS = RAW.map(function(raw, i) {
  var cp = raw.clinical_profile;
  var co = cp.comorbidities;
  return {
    a: raw.demographics.age_at_cancer_diagnosis,
    r: cp.cancer_risk_group,
    g: cp.cancer_details.gleason,
    p: cp.cancer_details.psa_at_dx,
    t: cp.primary_treatment,
    o: cp.treatment_outcome,
    d: cp.diabetes_type,
    dd: cp.dm_duration_years,
    h: cp.hba1c_baseline,
    b: co.bmi,
    e: co.egfr_baseline,
    ht: co.hypertoni ? 1 : 0,
    hk: co.hyperkolesterolemi ? 1 : 0,
    ov: co.overvikt ? 1 : 0,
    rt: co.retinopati ? 1 : 0,
    nf: co.nefropati ? 1 : 0,
    np: co.neuropati ? 1 : 0,
    kd: co.kardiovaskulart ? 1 : 0
  };
});

// ========== DERIVE COHORT STATISTICS ==========

function computeCohort() {
  var n = PATIENTS.length;

  // Age
  var ages = PATIENTS.map(function(p) { return p.a; });
  var ageMean = Math.round(ages.reduce(function(s, v) { return s + v; }, 0) / n * 10) / 10;
  var ageMin = Math.min.apply(null, ages);
  var ageMax = Math.max.apply(null, ages);
  var ageDist = {};
  ages.forEach(function(a) {
    var bucket;
    if (a < 55) bucket = "50-54";
    else if (a < 60) bucket = "55-59";
    else if (a < 65) bucket = "60-64";
    else bucket = "65-69";
    ageDist[bucket] = (ageDist[bucket] || 0) + 1;
  });

  // Risk groups
  var riskGroups = {};
  PATIENTS.forEach(function(p) { riskGroups[p.r] = (riskGroups[p.r] || 0) + 1; });

  // Gleason
  var gleasonDist = {};
  PATIENTS.forEach(function(p) { gleasonDist[p.g] = (gleasonDist[p.g] || 0) + 1; });

  // PSA at diagnosis
  var psas = PATIENTS.map(function(p) { return p.p; });
  psas.sort(function(a, b) { return a - b; });
  var psaMean = Math.round(psas.reduce(function(s, v) { return s + v; }, 0) / n * 10) / 10;
  var psaMedian = Math.round(psas[Math.floor(n / 2)] * 10) / 10;

  // Diabetes
  var diabDist = {};
  PATIENTS.forEach(function(p) { diabDist[p.d] = (diabDist[p.d] || 0) + 1; });
  var ddVals = PATIENTS.map(function(p) { return p.dd; });
  var ddMean = Math.round(ddVals.reduce(function(s, v) { return s + v; }, 0) / n * 10) / 10;
  var hba1cVals = PATIENTS.map(function(p) { return p.h; });
  var hba1cMean = Math.round(hba1cVals.reduce(function(s, v) { return s + v; }, 0) / n * 10) / 10;

  // Treatments
  var treatDist = {};
  PATIENTS.forEach(function(p) { treatDist[p.t] = (treatDist[p.t] || 0) + 1; });

  // Outcomes
  var outDist = {};
  PATIENTS.forEach(function(p) { outDist[p.o] = (outDist[p.o] || 0) + 1; });

  // Medications — count from full JSON
  var drugCounts = {};
  RAW.forEach(function(raw) {
    raw.GetMedicationHistory.forEach(function(m) {
      var key = m.atcCode + " " + m.productName;
      drugCounts[key] = (drugCounts[key] || 0) + 1;
    });
  });

  // Comorbidities
  var comorbCounts = {
    hypertoni: PATIENTS.filter(function(p) { return p.ht; }).length,
    hyperkolesterolemi: PATIENTS.filter(function(p) { return p.hk; }).length,
    overvikt_bmi30: PATIENTS.filter(function(p) { return p.b >= 30; }).length,
    retinopati: PATIENTS.filter(function(p) { return p.rt; }).length,
    nefropati: PATIENTS.filter(function(p) { return p.nf; }).length,
    neuropati: PATIENTS.filter(function(p) { return p.np; }).length,
    kardiovaskulart: PATIENTS.filter(function(p) { return p.kd; }).length
  };

  // HbA1c change with/without ADT
  var adtTreatments = ["EBRT_ADT", "ADT_only", "ADT_chemo"];
  var withAdt = PATIENTS.filter(function(p) { return adtTreatments.indexOf(p.t) >= 0; });
  var withoutAdt = PATIENTS.filter(function(p) { return adtTreatments.indexOf(p.t) < 0; });
  var hba1cWithAdt = withAdt.length > 0 ? Math.round(withAdt.reduce(function(s, p) { return s + p.h; }, 0) / withAdt.length * 10) / 10 : 0;
  var hba1cWithoutAdt = withoutAdt.length > 0 ? Math.round(withoutAdt.reduce(function(s, p) { return s + p.h; }, 0) / withoutAdt.length * 10) / 10 : 0;

  // PSA by treatment — compute from full JSON lab data
  var psaByTreat = {};
  RAW.forEach(function(raw) {
    var t = raw.clinical_profile.primary_treatment;
    if (!psaByTreat[t]) psaByTreat[t] = { baseline: [], latest: [] };
    psaByTreat[t].baseline.push(raw.clinical_profile.cancer_details.psa_at_dx);
    var psaLabs = raw.GetLaboratoryOrderOutcome.filter(function(l) { return l.displayName === "S-PSA"; });
    if (psaLabs.length > 0) {
      psaLabs.sort(function(a, b) { return new Date(b.observationTime) - new Date(a.observationTime); });
      psaByTreat[t].latest.push(parseFloat(psaLabs[0].value));
    }
  });
  var psaSummary = {};
  Object.keys(psaByTreat).forEach(function(t) {
    var d = psaByTreat[t];
    var bMean = d.baseline.length > 0 ? Math.round(d.baseline.reduce(function(s, v) { return s + v; }, 0) / d.baseline.length * 100) / 100 : 0;
    var lMean = d.latest.length > 0 ? Math.round(d.latest.reduce(function(s, v) { return s + v; }, 0) / d.latest.length * 100) / 100 : 0;
    psaSummary[t] = { baseline: bMean, latest: lMean };
  });

  return {
    cohort_description: "100 män 50-65 år med prostatacancer (C61) + insulinbehandlad diabetes (E10/E11). Syntetisk data baserad på svensk epidemiologi.",
    n: n,
    demographics: { age_mean: ageMean, age_range: ageMin + "-" + ageMax, age_distribution: ageDist },
    cancer: { risk_groups: riskGroups, gleason_distribution: gleasonDist, psa_at_diagnosis: { mean: psaMean, median: psaMedian, range: psas[0] + "-" + psas[n - 1] } },
    diabetes: { type_distribution: diabDist, duration_mean: ddMean, hba1c_baseline_mean: hba1cMean, hba1c_baseline_range: Math.min.apply(null, hba1cVals) + "-" + Math.max.apply(null, hba1cVals) },
    treatments: { distribution: treatDist },
    outcomes: { distribution: outDist },
    labs_summary: { psa_by_treatment: psaSummary, hba1c_mean_with_adt: hba1cWithAdt, hba1c_mean_without_adt: hba1cWithoutAdt },
    medications_summary: { drug_frequency: drugCounts },
    complications: { comorbidity_counts: comorbCounts }
  };
}

// ========== DERIVE CHARTS_DB ==========

function sortedEntries(obj) {
  return Object.keys(obj).sort(function(a, b) { return obj[b] - obj[a]; }).map(function(k) {
    return { name: k, value: obj[k] };
  });
}

function computeChartsDB(cohort) {
  var riskLabels = {
    intermediate_fav: "Intermediate Fav", high: "High", intermediate_unfav: "Intermediate Unfav",
    very_high_metastatic: "Very High Metastatic", low: "Low", very_low: "Very Low"
  };
  var treatLabels = {
    EBRT_ADT: "EBRT ADT", RALP: "RALP", active_surveillance: "ACTIVE SURVEILLANCE",
    EBRT: "EBRT", RALP_adj: "RALP ADJ", palliative: "PALLIATIVE",
    ADT_chemo: "ADT CHEMO", ADT_only: "ADT ONLY"
  };
  var outLabels = {
    curative_good: "Curative Good", biochemical_recurrence: "Biochemical Recurrence",
    curative_side_effects: "Curative Side Effects", stable_AS: "Stable As",
    local_progression: "Local Progression", deceased_cancer: "Deceased Cancer",
    deceased_other: "Deceased Other", partial_response: "Partial Response",
    reclassified_to_treatment: "Reclassified To Treatment", progression: "Progression"
  };

  function mapLabels(dist, labels) {
    return Object.keys(dist).sort(function(a, b) { return dist[b] - dist[a]; }).map(function(k) {
      return { name: labels[k] || k, value: dist[k] };
    });
  }

  var riskData = mapLabels(cohort.cancer.risk_groups, riskLabels);
  var treatData = mapLabels(cohort.treatments.distribution, treatLabels);
  var outData = mapLabels(cohort.outcomes.distribution, outLabels);
  var ageDist = cohort.demographics.age_distribution;
  var ageData = ["50-54", "55-59", "60-64", "65-69"].filter(function(k) { return ageDist[k]; }).map(function(k) { return { name: k, value: ageDist[k] }; });

  var gleasonData = Object.keys(cohort.cancer.gleason_distribution).sort().map(function(k) {
    return { name: k, value: cohort.cancer.gleason_distribution[k] };
  });

  var dm = cohort.diabetes.type_distribution;
  var diabData = [
    { name: "Typ 2", value: dm.T2 || 0 },
    { name: "Typ 1", value: dm.T1 || 0 }
  ];

  var comData = sortedEntries(cohort.complications.comorbidity_counts).map(function(d) {
    var labels = { hypertoni: "Hypertoni", overvikt_bmi30: "Övervikt BMI≥30", hyperkolesterolemi: "Hyperkolesterolemi", retinopati: "Retinopati", nefropati: "Nefropati", neuropati: "Neuropati", kardiovaskulart: "Kardiovaskulärt" };
    return { name: labels[d.name] || d.name, value: d.value };
  });

  // Top medications
  var drugFreq = cohort.medications_summary.drug_frequency;
  var topDrugs = Object.keys(drugFreq).sort(function(a, b) { return drugFreq[b] - drugFreq[a]; }).slice(0, 10).map(function(k) {
    var parts = k.split(" ");
    var name = parts.slice(1).join(" ");
    return { name: name, value: drugFreq[k] };
  });

  // eGFR distribution
  var egfrBins = { "eGFR <45": 0, "eGFR 45-59": 0, "eGFR 60-89": 0, "eGFR ≥90": 0 };
  PATIENTS.forEach(function(p) {
    if (p.e < 45) egfrBins["eGFR <45"]++;
    else if (p.e < 60) egfrBins["eGFR 45-59"]++;
    else if (p.e < 90) egfrBins["eGFR 60-89"]++;
    else egfrBins["eGFR ≥90"]++;
  });
  var njurData = Object.keys(egfrBins).map(function(k) { return { name: k, value: egfrBins[k] }; });

  // RALP vs strålbehandling
  var ralpOut = {};
  var stralOut = {};
  PATIENTS.forEach(function(p) {
    if (p.t === "RALP" || p.t === "RALP_adj") {
      ralpOut[p.o] = (ralpOut[p.o] || 0) + 1;
    } else if (p.t === "EBRT" || p.t === "EBRT_ADT") {
      stralOut[p.o] = (stralOut[p.o] || 0) + 1;
    }
  });
  var allOutcomes = {};
  Object.keys(ralpOut).forEach(function(k) { allOutcomes[k] = true; });
  Object.keys(stralOut).forEach(function(k) { allOutcomes[k] = true; });
  var outcomeKeys = Object.keys(allOutcomes).sort();
  var ralpVsStral = {
    chartType: "grouped_bar",
    title: "Utfall: RALP vs strålbehandling",
    categories: outcomeKeys.map(function(k) { return outLabels[k] || k; }),
    series: [
      { name: "RALP", data: outcomeKeys.map(function(k) { return ralpOut[k] || 0; }) },
      { name: "Strålbehandling", data: outcomeKeys.map(function(k) { return stralOut[k] || 0; }) }
    ]
  };

  // Metformin
  var metCount = PATIENTS.filter(function(p) { return p.d === "T2"; }).length;
  var noMetCount = PATIENTS.filter(function(p) { return p.d === "T1"; }).length;

  return {
    riskgrupp: { chartType: "bar", title: "Fördelning av cancerriskgrupper (n=" + cohort.n + ")", data: riskData },
    behandling: { chartType: "bar", title: "Behandlingsfördelning (n=" + cohort.n + ")", data: treatData },
    utfall: { chartType: "bar", title: "Behandlingsutfall (n=" + cohort.n + ")", data: outData },
    diabetes: { chartType: "pie", title: "Diabetestyp (n=" + cohort.n + ")", data: diabData },
    hba1c: { chartType: "bar", title: "Medel-HbA1c: med vs utan ADT", data: [{ name: "Med ADT", value: cohort.labs_summary.hba1c_mean_with_adt }, { name: "Utan ADT", value: cohort.labs_summary.hba1c_mean_without_adt }] },
    komorbiditet: { chartType: "bar", title: "Komorbiditeter i kohorten (n=" + cohort.n + ")", data: comData },
    alder: { chartType: "bar", title: "Åldersfördelning vid cancerdiagnos", data: ageData },
    lakemedel: { chartType: "bar", title: "Vanligaste läkemedel (topp 10)", data: topDrugs },
    gleason: { chartType: "bar", title: "Gleason-fördelning", data: gleasonData },
    sammansattning: { chartType: "bar", title: "Fördelning av cancerriskgrupper (n=" + cohort.n + ")", data: riskData },
    ralp_vs_stral: ralpVsStral,
    njurfunktion: { chartType: "bar", title: "Njurfunktion (eGFR) vid baseline", data: njurData },
    metformin: { chartType: "pie", title: "Metforminanvändning", data: [{ name: "Metformin (typ 2)", value: metCount }, { name: "Utan metformin (typ 1)", value: noMetCount }] },
    hjart: { chartType: "pie", title: "Hjärt-kärlsjukdom i kohorten", data: [{ name: "Utan hjärt-kärlsjukdom", value: cohort.n - cohort.complications.comorbidity_counts.kardiovaskulart }, { name: "Med hjärt-kärlsjukdom", value: cohort.complications.comorbidity_counts.kardiovaskulart }] }
  };
}

var COHORT = computeCohort();
var CHARTS_DB = computeChartsDB(COHORT);

export { PATIENTS, COHORT, CHARTS_DB, RAW };
