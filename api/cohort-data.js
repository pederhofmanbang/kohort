// Kohort-databas: all patientdata deriverad från kohort_100_patienter.json
// Ingen hårdkodad data — allt beräknas från källfilen

import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

var __dirname = dirname(fileURLToPath(import.meta.url));
var RAW = JSON.parse(readFileSync(join(__dirname, "../data/kohort_100_patienter.json"), "utf-8"));

// ========== TRANSFORMATION: JSON → compact patient records ==========

function findCancerDiagnosisDate(raw) {
  for (var i = 0; i < raw.GetDiagnosis.length; i++) {
    if (raw.GetDiagnosis[i].code.indexOf("C61") === 0) {
      return raw.GetDiagnosis[i].diagnosisTime;
    }
  }
  return null;
}

var DAY_MS = 86400000;

function extractLabSeries(raw, displayName, diagDateStr) {
  if (!diagDateStr) return {};
  var diagDate = new Date(diagDateStr);
  var labs = raw.GetLaboratoryOrderOutcome.filter(function(l) {
    return l.displayName === displayName;
  });
  labs.sort(function(a, b) {
    return new Date(a.observationTime) - new Date(b.observationTime);
  });

  var targets = { baseline: 0, "3mo": 91, "6mo": 182, "12mo": 365, "24mo": 730 };
  var series = {};

  Object.keys(targets).forEach(function(key) {
    var targetMs = diagDate.getTime() + targets[key] * DAY_MS;
    var closest = null;
    var closestDiff = Infinity;
    labs.forEach(function(l) {
      var diff = Math.abs(new Date(l.observationTime).getTime() - targetMs);
      if (diff < closestDiff) {
        closestDiff = diff;
        closest = l;
      }
    });
    if (closest && closestDiff < 120 * DAY_MS) {
      series[key] = Math.round(parseFloat(closest.value) * 100) / 100;
    }
  });
  return series;
}

// Build compact patient records from full JSON
var PATIENTS = RAW.map(function(raw, i) {
  var cp = raw.clinical_profile;
  var co = cp.comorbidities;
  var diagDate = findCancerDiagnosisDate(raw);

  return {
    id: i + 1,
    patient_id: raw.patient_id,
    namn: raw.demographics.namn,
    a: raw.demographics.age_at_cancer_diagnosis,
    sex: raw.demographics.sex,
    municipality: raw.demographics.municipality,
    hospital: raw.demographics.hospital,
    r: cp.cancer_risk_group,
    g: cp.cancer_details.gleason,
    isup: cp.cancer_details.isup,
    tnm: cp.cancer_details.tnm,
    p: cp.cancer_details.psa_at_dx,
    pirads: cp.cancer_details.pirads,
    cores_pos: cp.cancer_details.cores_pos,
    cores_total: cp.cancer_details.cores_total,
    t: cp.primary_treatment,
    o: cp.treatment_outcome,
    d: cp.diabetes_type,
    d_icd: cp.diabetes_type_icd,
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
    kd: co.kardiovaskulart ? 1 : 0,
    psa_series: extractLabSeries(raw, "S-PSA", diagDate),
    hba1c_series: extractLabSeries(raw, "B-HbA1c (IFCC)", diagDate),
    egfr_series: extractLabSeries(raw, "eGFR (CKD-EPI)", diagDate)
  };
});

// ========== FULL PATIENT DATA (for rich queries) ==========
var FULL_PATIENTS = RAW;

var FIELD_LABELS = {
  a: "Ålder (år)", r: "Riskgrupp", g: "Gleason", p: "PSA vid diagnos (ng/mL)",
  isup: "ISUP-grad", tnm: "TNM-stadium", pirads: "PI-RADS",
  cores_pos: "Positiva biopsikolvar", cores_total: "Totala biopsikolvar",
  t: "Behandling", o: "Utfall", d: "Diabetestyp", d_icd: "Diabetes ICD-kod",
  dd: "Diabetesduration (år)",
  h: "HbA1c baseline (mmol/mol)", b: "BMI", e: "eGFR baseline (mL/min/1.73m²)",
  ht: "Hypertoni (0/1)", hk: "Hyperkolesterolemi (0/1)", ov: "Övervikt BMI≥30 (0/1)",
  rt: "Retinopati (0/1)", nf: "Nefropati (0/1)", np: "Neuropati (0/1)",
  kd: "Kardiovaskulär sjukdom (0/1)",
  psa_series: "PSA-tidsserie", hba1c_series: "HbA1c-tidsserie", egfr_series: "eGFR-tidsserie"
};

var CATEGORICAL = ["r", "g", "t", "o", "d", "tnm", "municipality", "hospital"];
var NUMERIC = ["a", "p", "dd", "h", "b", "e", "isup", "pirads", "cores_pos", "cores_total"];
var BINARY = ["ht", "hk", "ov", "rt", "nf", "np", "kd"];
var TIME_SERIES = ["psa_series", "hba1c_series", "egfr_series"];

// ========== QUERY ENGINE ==========

function applyFilters(patients, filters) {
  if (!filters || Object.keys(filters).length === 0) return patients;
  return patients.filter(function(p) {
    return Object.keys(filters).every(function(field) {
      var cond = filters[field];
      var val = p[field];
      if (cond === undefined || cond === null) return true;
      if (typeof cond === "string" || typeof cond === "number") return String(val) === String(cond);
      if (Array.isArray(cond)) return cond.map(String).indexOf(String(val)) >= 0;
      if (typeof cond === "object" && (cond.min !== undefined || cond.max !== undefined)) {
        var num = Number(val);
        if (cond.min !== undefined && num < cond.min) return false;
        if (cond.max !== undefined && num > cond.max) return false;
        return true;
      }
      return String(val) === String(cond);
    });
  });
}

function searchPatients(filters, fields, limit) {
  var results = applyFilters(PATIENTS, filters);
  var lim = limit || 20;
  var limited = results.slice(0, lim);
  var output = limited.map(function(p) {
    if (fields && fields.length > 0) {
      var obj = { id: p.id, patient_id: p.patient_id };
      fields.forEach(function(f) { obj[f] = p[f]; });
      return obj;
    }
    return p;
  });
  return { total_matches: results.length, returned: output.length, patients: output };
}

function getStatistics(field, groupBy, filters) {
  var data = applyFilters(PATIENTS, filters);
  if (CATEGORICAL.indexOf(field) >= 0 || BINARY.indexOf(field) >= 0) {
    var counts = {};
    data.forEach(function(p) {
      var k = String(p[field]);
      counts[k] = (counts[k] || 0) + 1;
    });
    return { field: field, label: FIELD_LABELS[field] || field, type: "distribution", n: data.length, distribution: counts };
  }
  if (NUMERIC.indexOf(field) >= 0) {
    if (groupBy) {
      var groups = {};
      data.forEach(function(p) {
        var g = String(p[groupBy]);
        if (!groups[g]) groups[g] = [];
        groups[g].push(p[field]);
      });
      var grouped = {};
      Object.keys(groups).forEach(function(g) {
        var vals = groups[g];
        vals.sort(function(a, b) { return a - b; });
        var sum = vals.reduce(function(s, v) { return s + v; }, 0);
        grouped[g] = {
          n: vals.length,
          mean: Math.round(sum / vals.length * 10) / 10,
          median: vals[Math.floor(vals.length / 2)],
          min: vals[0],
          max: vals[vals.length - 1]
        };
      });
      return { field: field, label: FIELD_LABELS[field] || field, group_by: groupBy, group_label: FIELD_LABELS[groupBy] || groupBy, type: "grouped_numeric", groups: grouped };
    }
    var vals = data.map(function(p) { return p[field]; });
    vals.sort(function(a, b) { return a - b; });
    var sum = vals.reduce(function(s, v) { return s + v; }, 0);
    return {
      field: field, label: FIELD_LABELS[field] || field, type: "numeric", n: vals.length,
      mean: Math.round(sum / vals.length * 10) / 10,
      median: vals[Math.floor(vals.length / 2)],
      min: vals[0], max: vals[vals.length - 1],
      std: Math.round(Math.sqrt(vals.reduce(function(s, v) { return s + Math.pow(v - sum / vals.length, 2); }, 0) / vals.length) * 10) / 10
    };
  }
  return { error: "Unknown field: " + field };
}

function countPatients(filters) {
  var data = applyFilters(PATIENTS, filters);
  return { count: data.length, total: PATIENTS.length, percentage: Math.round(data.length / PATIENTS.length * 1000) / 10 };
}

function crossTabulate(field1, field2, filters) {
  var data = applyFilters(PATIENTS, filters);
  var table = {};
  var vals1 = {};
  var vals2 = {};
  data.forEach(function(p) {
    var v1 = String(p[field1]);
    var v2 = String(p[field2]);
    vals1[v1] = true;
    vals2[v2] = true;
    if (!table[v1]) table[v1] = {};
    table[v1][v2] = (table[v1][v2] || 0) + 1;
  });
  return {
    field1: field1, label1: FIELD_LABELS[field1] || field1,
    field2: field2, label2: FIELD_LABELS[field2] || field2,
    n: data.length,
    values_field1: Object.keys(vals1).sort(),
    values_field2: Object.keys(vals2).sort(),
    table: table
  };
}

// ========== TIME SERIES QUERIES ==========

function getTimeSeries(measure, groupBy, filters) {
  var seriesField;
  if (measure === "psa") seriesField = "psa_series";
  else if (measure === "hba1c") seriesField = "hba1c_series";
  else if (measure === "egfr") seriesField = "egfr_series";
  else return { error: "Unknown measure: " + measure + ". Use 'psa', 'hba1c', or 'egfr'." };

  var data = applyFilters(PATIENTS, filters);
  if (data.length === 0) return { measure: measure, n: 0, error: "No patients match filters" };

  var timepoints = ["baseline", "3mo", "6mo", "12mo", "24mo"];

  if (!groupBy) {
    var means = {};
    var counts = {};
    timepoints.forEach(function(tp) {
      var vals = data.map(function(p) { return p[seriesField] && p[seriesField][tp]; }).filter(function(v) { return v !== undefined && v !== null; });
      if (vals.length > 0) {
        var s = vals.reduce(function(a, b) { return a + b; }, 0);
        means[tp] = Math.round(s / vals.length * 100) / 100;
        counts[tp] = vals.length;
      }
    });
    return { measure: measure, series_field: seriesField, n: data.length, timepoints: Object.keys(means), mean_values: means, patient_counts: counts };
  }

  var groups = {};
  data.forEach(function(p) {
    var g = String(p[groupBy]);
    if (!groups[g]) groups[g] = [];
    groups[g].push(p);
  });

  var grouped = {};
  Object.keys(groups).forEach(function(g) {
    var pts = groups[g];
    var means = {};
    timepoints.forEach(function(tp) {
      var vals = pts.map(function(p) { return p[seriesField] && p[seriesField][tp]; }).filter(function(v) { return v !== undefined && v !== null; });
      if (vals.length > 0) {
        var s = vals.reduce(function(a, b) { return a + b; }, 0);
        means[tp] = Math.round(s / vals.length * 100) / 100;
      }
    });
    grouped[g] = { n: pts.length, mean_values: means };
  });

  return { measure: measure, series_field: seriesField, group_by: groupBy, group_label: FIELD_LABELS[groupBy] || groupBy, n: data.length, timepoints: timepoints, groups: grouped };
}

function getPatientTimeSeries(patientIds, measures) {
  var results = [];
  var measList = measures || ["psa", "hba1c", "egfr"];
  var fieldMap = { psa: "psa_series", hba1c: "hba1c_series", egfr: "egfr_series" };

  patientIds.forEach(function(id) {
    var p = PATIENTS.find(function(pt) { return pt.id === id; });
    if (!p) return;
    var entry = { id: p.id, patient_id: p.patient_id, namn: p.namn, age: p.a, treatment: p.t, outcome: p.o, diabetes: p.d };
    measList.forEach(function(m) {
      var f = fieldMap[m];
      if (f && p[f]) entry[m] = p[f];
    });
    results.push(entry);
  });
  return { patients: results, measures: measList };
}

// ========== RICH DATA QUERIES (from full JSON) ==========

function findFullPatient(patientId) {
  var raw = FULL_PATIENTS.find(function(p) { return p.patient_id === patientId; });
  if (!raw) {
    // Stöd numeriskt ID (1-100) och format som "P1", "p001" etc.
    var num = parseInt(String(patientId).replace(/^[Pp]0*/, ""));
    if (!isNaN(num) && num >= 1 && num <= FULL_PATIENTS.length) {
      raw = FULL_PATIENTS[num - 1];
    }
  }
  return raw || null;
}

function getPatientDetail(patientId) {
  var raw = findFullPatient(patientId);
  if (!raw) return { error: "Patient not found: " + patientId };
  return {
    patient_id: raw.patient_id,
    demographics: raw.demographics,
    clinical_profile: raw.clinical_profile,
    diagnosis_count: raw.GetDiagnosis.length,
    medication_count: raw.GetMedicationHistory.length,
    lab_count: raw.GetLaboratoryOrderOutcome.length,
    care_doc_count: raw.GetCareDocumentation.length,
    imaging_count: raw.GetImagingOutcome.length,
    referral_count: raw.GetReferralOutcome.length,
    alert_count: raw.GetAlertInformation.length,
    care_contact_count: raw.GetCareContacts.length,
    vaccination_count: raw.GetVaccinationHistory.length,
    functional_status_count: raw.GetFunctionalStatus.length,
    care_plan_count: raw.GetCarePlans.length,
    request_activity_count: raw.GetRequestActivities.length
  };
}

function getPatientDiagnoses(patientId) {
  var raw = findFullPatient(patientId);
  if (!raw) return { error: "Patient not found: " + patientId };
  return { patient_id: raw.patient_id, namn: raw.demographics.namn, diagnoses: raw.GetDiagnosis };
}

function getPatientMedications(patientId) {
  var raw = findFullPatient(patientId);
  if (!raw) return { error: "Patient not found: " + patientId };
  return { patient_id: raw.patient_id, namn: raw.demographics.namn, medications: raw.GetMedicationHistory };
}

function getPatientLabResults(patientId, labName) {
  var raw = findFullPatient(patientId);
  if (!raw) return { error: "Patient not found: " + patientId };
  var labs = raw.GetLaboratoryOrderOutcome;
  if (labName) {
    var lower = labName.toLowerCase();
    labs = labs.filter(function(l) { return l.displayName.toLowerCase().indexOf(lower) >= 0; });
  }
  return { patient_id: raw.patient_id, namn: raw.demographics.namn, total: labs.length, lab_results: labs };
}

function getPatientCareDocumentation(patientId) {
  var raw = findFullPatient(patientId);
  if (!raw) return { error: "Patient not found: " + patientId };
  return { patient_id: raw.patient_id, namn: raw.demographics.namn, documents: raw.GetCareDocumentation };
}

function getPatientImaging(patientId) {
  var raw = findFullPatient(patientId);
  if (!raw) return { error: "Patient not found: " + patientId };
  return { patient_id: raw.patient_id, namn: raw.demographics.namn, imaging: raw.GetImagingOutcome };
}

function getPatientReferrals(patientId) {
  var raw = findFullPatient(patientId);
  if (!raw) return { error: "Patient not found: " + patientId };
  return { patient_id: raw.patient_id, namn: raw.demographics.namn, referrals: raw.GetReferralOutcome };
}

function getPatientCareContacts(patientId) {
  var raw = findFullPatient(patientId);
  if (!raw) return { error: "Patient not found: " + patientId };
  return { patient_id: raw.patient_id, namn: raw.demographics.namn, care_contacts: raw.GetCareContacts };
}

function getPatientVaccinations(patientId) {
  var raw = findFullPatient(patientId);
  if (!raw) return { error: "Patient not found: " + patientId };
  return { patient_id: raw.patient_id, namn: raw.demographics.namn, vaccinations: raw.GetVaccinationHistory };
}

function getPatientCarePlans(patientId) {
  var raw = findFullPatient(patientId);
  if (!raw) return { error: "Patient not found: " + patientId };
  return { patient_id: raw.patient_id, namn: raw.demographics.namn, care_plans: raw.GetCarePlans };
}

function getPatientAlerts(patientId) {
  var raw = findFullPatient(patientId);
  if (!raw) return { error: "Patient not found: " + patientId };
  return { patient_id: raw.patient_id, namn: raw.demographics.namn, alerts: raw.GetAlertInformation };
}

function getPatientFunctionalStatus(patientId) {
  var raw = findFullPatient(patientId);
  if (!raw) return { error: "Patient not found: " + patientId };
  return { patient_id: raw.patient_id, namn: raw.demographics.namn, functional_status: raw.GetFunctionalStatus };
}

// ========== AGGREGATE QUERIES ON RICH DATA ==========

function searchMedications(atcCode, productName, filters) {
  var data = applyFilters(PATIENTS, filters);
  var matchingIds = new Set(data.map(function(p) { return p.patient_id; }));
  var results = [];

  FULL_PATIENTS.forEach(function(raw) {
    if (!matchingIds.has(raw.patient_id)) return;
    var meds = raw.GetMedicationHistory.filter(function(m) {
      var matchAtc = !atcCode || m.atcCode.indexOf(atcCode) === 0;
      var matchName = !productName || m.productName.toLowerCase().indexOf(productName.toLowerCase()) >= 0;
      return matchAtc && matchName;
    });
    if (meds.length > 0) {
      results.push({
        patient_id: raw.patient_id,
        namn: raw.demographics.namn,
        medications: meds
      });
    }
  });

  return { total_patients_with_match: results.length, total_searched: matchingIds.size, results: results };
}

function getMedicationStatistics(filters) {
  var data = applyFilters(PATIENTS, filters);
  var matchingIds = new Set(data.map(function(p) { return p.patient_id; }));
  var drugCounts = {};
  var atcCounts = {};

  FULL_PATIENTS.forEach(function(raw) {
    if (!matchingIds.has(raw.patient_id)) return;
    raw.GetMedicationHistory.forEach(function(m) {
      var key = m.atcCode + " " + m.productName;
      drugCounts[key] = (drugCounts[key] || 0) + 1;
      var atcGroup = m.atcCode.substring(0, 5);
      atcCounts[atcGroup] = (atcCounts[atcGroup] || 0) + 1;
    });
  });

  var sorted = Object.keys(drugCounts).sort(function(a, b) { return drugCounts[b] - drugCounts[a]; });
  var topDrugs = sorted.slice(0, 30).map(function(k) { return { drug: k, count: drugCounts[k] }; });

  return { n_patients: matchingIds.size, top_drugs: topDrugs, atc_groups: atcCounts };
}

function searchDiagnoses(icdCode, filters) {
  var data = applyFilters(PATIENTS, filters);
  var matchingIds = new Set(data.map(function(p) { return p.patient_id; }));
  var results = [];

  FULL_PATIENTS.forEach(function(raw) {
    if (!matchingIds.has(raw.patient_id)) return;
    var diags = raw.GetDiagnosis.filter(function(d) {
      return !icdCode || d.code.indexOf(icdCode) === 0;
    });
    if (diags.length > 0) {
      results.push({
        patient_id: raw.patient_id,
        namn: raw.demographics.namn,
        diagnoses: diags
      });
    }
  });

  return { total_patients_with_match: results.length, total_searched: matchingIds.size, results: results };
}

function searchCareDocumentation(searchTerm, filters) {
  var data = applyFilters(PATIENTS, filters);
  var matchingIds = new Set(data.map(function(p) { return p.patient_id; }));
  var results = [];
  var lower = searchTerm ? searchTerm.toLowerCase() : "";

  FULL_PATIENTS.forEach(function(raw) {
    if (!matchingIds.has(raw.patient_id)) return;
    var docs = raw.GetCareDocumentation.filter(function(d) {
      if (!searchTerm) return true;
      return (d.text && d.text.toLowerCase().indexOf(lower) >= 0) ||
             (d.documentTitle && d.documentTitle.toLowerCase().indexOf(lower) >= 0);
    });
    if (docs.length > 0) {
      results.push({
        patient_id: raw.patient_id,
        namn: raw.demographics.namn,
        documents: docs
      });
    }
  });

  return { total_patients_with_match: results.length, total_searched: matchingIds.size, results: results.slice(0, 20) };
}

// Export for use in cohort-chat.js
export {
  PATIENTS,
  FULL_PATIENTS,
  RAW,
  FIELD_LABELS,
  CATEGORICAL,
  NUMERIC,
  BINARY,
  TIME_SERIES,
  searchPatients,
  getStatistics,
  countPatients,
  crossTabulate,
  getTimeSeries,
  getPatientTimeSeries,
  getPatientDetail,
  getPatientDiagnoses,
  getPatientMedications,
  getPatientLabResults,
  getPatientCareDocumentation,
  getPatientImaging,
  getPatientReferrals,
  getPatientCareContacts,
  getPatientVaccinations,
  getPatientCarePlans,
  getPatientAlerts,
  getPatientFunctionalStatus,
  searchMedications,
  getMedicationStatistics,
  searchDiagnoses,
  searchCareDocumentation
};
