import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// MedLens Clinical Intelligence Modules
import { extractParametersFromText } from '../src/lib/reportParser.ts';
import { parseReferenceRange, evaluateReferenceRange } from '../src/lib/referenceRangeEvaluator.ts';
import { normalizeTestName } from '../src/lib/medicalDictionary.ts';
import { detectConflicts } from '../src/lib/conflictDetector.ts';
import { compareReports } from '../src/lib/longitudinalComparator.ts';
import { generateClarificationQuestions } from '../src/lib/clarificationGenerator.ts';
import { generateClinicalSummary } from '../src/lib/summaryGenerator.ts';
import { runMedLensPipeline } from '../src/lib/pipeline.ts';

describe('MedLens Clinical Intelligence Engine', () => {

  describe('1. Medical Terminology Normalization & Category Mapping', () => {
    it('normalizes common lab synonyms to canonical names and categories', () => {
      const hgb = normalizeTestName('HGB');
      assert.equal(hgb.canonicalName, 'Hemoglobin');
      assert.equal(hgb.category, 'Hematology');

      const fbs = normalizeTestName('Fasting Blood Sugar');
      assert.equal(fbs.canonicalName, 'Fasting Blood Glucose');
      assert.equal(fbs.category, 'Metabolic & Electrolytes');

      const egfr = normalizeTestName('eGFR');
      assert.equal(egfr.canonicalName, 'Estimated GFR (eGFR)');
      assert.equal(egfr.category, 'Renal Function');
    });

    it('handles unknown or uncataloged lab tests safely without crashing or hallucinating', () => {
      const customTest = normalizeTestName('Custom Biomarker XYZ-99');
      assert.equal(customTest.canonicalName, 'Custom Biomarker Xyz-99');
      assert.equal(customTest.category, 'Other');
    });
  });

  describe('2. Laboratory Report Extraction (reportParser)', () => {
    it('extracts parameters from pipe-delimited tabular format', () => {
      const report = `
        Hemoglobin | 8.8 | g/dL | 12.0 - 16.0
        Platelets | 310 | K/uL | 150 - 450
        Ferritin | 6 | ng/mL | 15 - 150
      `;
      const params = extractParametersFromText(report, 'CURRENT_REPORT');
      assert.equal(params.length, 3);
      assert.equal(params[0].canonicalName, 'Hemoglobin');
      assert.equal(params[0].observedValue, 8.8);
      assert.equal(params[0].unit, 'g/dL');
      assert.equal(params[0].status, 'LOW');
      assert.equal(params[0].sourceDocument, 'CURRENT_REPORT');
    });

    it('extracts parameters from colon-delimited or key-value format', () => {
      const report = `
        Total Cholesterol: 242 mg/dL (Reference: < 200)
        Triglycerides: 280 mg/dL (Reference: < 150)
      `;
      const params = extractParametersFromText(report, 'CURRENT_REPORT');
      assert.equal(params.length, 2);
      assert.equal(params[0].canonicalName, 'Total Cholesterol');
      assert.equal(params[0].observedValue, 242);
      assert.equal(params[0].status, 'HIGH');
    });

    it('extracts whitespace-aligned column format', () => {
      const report = `
        WBC        11.4   K/uL    4.0 - 10.5
        Creatinine 1.25   mg/dL   0.6 - 1.2
      `;
      const params = extractParametersFromText(report, 'CURRENT_REPORT');
      assert.equal(params.length, 2);
      assert.equal(params[0].canonicalName, 'White Blood Cell Count');
      assert.equal(params[0].observedValue, 11.4);
      assert.equal(params[0].status, 'HIGH');
    });

    it('handles empty or blank reports gracefully', () => {
      assert.deepEqual(extractParametersFromText(''), []);
      assert.deepEqual(extractParametersFromText('   \n  \n  '), []);
    });
  });

  describe('3. Reference Range Parsing & Strict Non-Invention Rule', () => {
    it('parses two-bound ranges (min - max)', () => {
      const parsed = parseReferenceRange('13.5 - 17.5');
      assert.equal(parsed.isSpecified, true);
      assert.equal(parsed.min, 13.5);
      assert.equal(parsed.max, 17.5);
    });

    it('parses upper-bound inequalities (< or <=)', () => {
      const parsed = parseReferenceRange('< 200');
      assert.equal(parsed.isSpecified, true);
      assert.equal(parsed.min, 0);
      assert.equal(parsed.max, 200);
    });

    it('parses lower-bound inequalities (> or >=)', () => {
      const parsed = parseReferenceRange('>= 60');
      assert.equal(parsed.isSpecified, true);
      assert.equal(parsed.min, 60);
      assert.equal(parsed.max, null);
    });

    it('STRICT GUARDRAIL: Marks missing ranges as UNSPECIFIED and does NOT invent ranges', () => {
      const unspec1 = parseReferenceRange('');
      assert.equal(unspec1.isSpecified, false);

      const unspec2 = parseReferenceRange('Not Established');
      assert.equal(unspec2.isSpecified, false);

      const evaluation = evaluateReferenceRange(42, unspec2);
      assert.equal(evaluation.status, 'UNSPECIFIED');
      assert.equal(evaluation.statusLabel, 'No Reference Range');
      assert.match(evaluation.explanation, /No reference range/i);
    });

    it('flags normal, low, high, and critical lab values correctly', () => {
      const normalRange = parseReferenceRange('70 - 99');
      assert.equal(evaluateReferenceRange(85, normalRange).status, 'NORMAL');
      assert.equal(evaluateReferenceRange(55, normalRange).status, 'LOW');
      assert.equal(evaluateReferenceRange(140, normalRange).status, 'HIGH');

      // Critical Potassium elevation (> 6.0)
      const kRange = parseReferenceRange('3.5 - 5.1');
      const kCritical = evaluateReferenceRange(6.4, kRange, undefined, 6.0);
      assert.equal(kCritical.status, 'CRITICAL');
      assert.equal(kCritical.isCritical, true);

      // Critical Platelet depletion (< 20)
      const pltRange = parseReferenceRange('150 - 450');
      const pltCritical = evaluateReferenceRange(14, pltRange, 20, undefined);
      assert.equal(pltCritical.status, 'CRITICAL');
      assert.equal(pltCritical.isCritical, true);
    });
  });

  describe('4. Clinical Conflict & Safety Detection', () => {
    it('detects severe allergy vs prescribed medication conflicts', () => {
      const patient = {
        name: 'John Doe',
        age: 45,
        sex: 'male',
        symptoms: ['Cough'],
        existingConditions: ['Hypertension'],
        allergies: ['Penicillin', 'Amoxicillin'],
        currentMedications: [
          { name: 'Amoxicillin-Clavulanate', dosage: '875mg', frequency: 'Twice daily' }
        ]
      };

      const alerts = detectConflicts(patient, []);
      const allergyAlert = alerts.find(a => a.id.startsWith('conflict-med-allergy'));
      assert.ok(allergyAlert, 'Should detect penicillin allergy conflict');
      assert.equal(allergyAlert.severity, 'HIGH');
      assert.match(allergyAlert.description, /Penicillin/i);
    });

    it('detects medication vs omitted condition discrepancy (Blood pressure medication without hypertension)', () => {
      const patient = {
        name: 'Jane Smith',
        age: 52,
        sex: 'female',
        symptoms: ['Fatigue'],
        existingConditions: ['Asthma'],
        allergies: [],
        currentMedications: [
          { name: 'Amlodipine', dosage: '5mg', frequency: 'Daily' }
        ]
      };

      const alerts = detectConflicts(patient, []);
      const conditionAlert = alerts.find(a => a.id === 'conflict-bp-med-condition');
      assert.ok(conditionAlert, 'Should detect BP med without hypertension documented');
      assert.equal(conditionAlert.severity, 'INFO');
    });

    it('detects medication vs lab value safety conflicts (Metformin in renal impairment)', () => {
      const patient = {
        name: 'Robert Taylor',
        age: 68,
        sex: 'male',
        symptoms: ['Fatigue'],
        existingConditions: ['Type 2 Diabetes'],
        allergies: [],
        currentMedications: [
          { name: 'Metformin', dosage: '1000mg', frequency: 'Twice daily' }
        ]
      };

      const params = [
        {
          id: '1',
          name: 'eGFR',
          canonicalName: 'Estimated GFR (eGFR)',
          category: 'Renal Function',
          observedValue: 24,
          unit: 'mL/min/1.73m2',
          referenceRange: { rawText: '> 60', min: 60, max: null, isSpecified: true },
          status: 'LOW',
          confidence: 'HIGH',
          sourceDocument: 'CURRENT_REPORT'
        }
      ];

      const alerts = detectConflicts(patient, params);
      const labAlert = alerts.find(a => a.id === 'conflict-metformin-renal');
      assert.ok(labAlert, 'Should detect Metformin contraindication in low eGFR');
      assert.equal(labAlert.severity, 'HIGH');
    });

    it('detects undiagnosed elevated HbA1c', () => {
      const patient = {
        name: 'Carlos Ruiz',
        age: 50,
        sex: 'male',
        symptoms: ['Increased thirst'],
        existingConditions: [], // no diabetes mentioned
        allergies: [],
        currentMedications: []
      };

      const params = [
        {
          id: '1',
          name: 'HbA1c',
          canonicalName: 'Glycated Hemoglobin (HbA1c)',
          category: 'Metabolic & Electrolytes',
          observedValue: 8.8,
          unit: '%',
          referenceRange: { rawText: '< 5.7', min: 0, max: 5.7, isSpecified: true },
          status: 'HIGH',
          confidence: 'HIGH',
          sourceDocument: 'CURRENT_REPORT'
        }
      ];

      const alerts = detectConflicts(patient, params);
      const a1cAlert = alerts.find(a => a.id === 'conflict-undiagnosed-hba1c');
      assert.ok(a1cAlert, 'Should detect undiagnosed elevated HbA1c');
      assert.equal(a1cAlert.severity, 'MEDIUM');
    });
  });

  describe('5. Longitudinal Trajectory Comparison', () => {
    it('computes exact mathematical delta and percentage shift across report intervals', () => {
      const prevParams = [
        {
          id: 'p1',
          name: 'Hemoglobin',
          canonicalName: 'Hemoglobin',
          category: 'Hematology',
          observedValue: 12.5,
          unit: 'g/dL',
          referenceRange: { rawText: '12.0 - 16.0', min: 12, max: 16, isSpecified: true },
          status: 'NORMAL',
          confidence: 'HIGH',
          sourceDocument: 'PREVIOUS_REPORT'
        }
      ];

      const currParams = [
        {
          id: 'c1',
          name: 'Hemoglobin',
          canonicalName: 'Hemoglobin',
          category: 'Hematology',
          observedValue: 8.8,
          unit: 'g/dL',
          referenceRange: { rawText: '12.0 - 16.0', min: 12, max: 16, isSpecified: true },
          status: 'LOW',
          confidence: 'HIGH',
          sourceDocument: 'CURRENT_REPORT'
        }
      ];

      const comparison = compareReports(currParams, prevParams, '2026-08-14', '2026-02-10');
      assert.equal(comparison.length, 1);

      const hgbComp = comparison[0];
      assert.equal(hgbComp.canonicalName, 'Hemoglobin');
      assert.equal(hgbComp.previousValue, 12.5);
      assert.equal(hgbComp.currentValue, 8.8);
      assert.equal(hgbComp.numericDelta, -3.7);
      assert.equal(hgbComp.percentageChange, -29.6);
      assert.equal(hgbComp.trend, 'DECREASED');
    });
  });

  describe('6. Non-Diagnostic Clarification Questions & AI Summary', () => {
    it('generates targeted, non-prescriptive clarification inquiries for missing history', () => {
      const patient = {
        name: 'Mark Miller',
        age: 40,
        sex: 'male',
        symptoms: ['Dizziness'],
        existingConditions: [],
        allergies: [],
        currentMedications: [
          { name: 'Lisinopril', dosage: '', frequency: '' } // missing dosage and frequency
        ]
      };

      const questions = generateClarificationQuestions(patient, []);
      assert.ok(questions.length >= 2, 'Should generate targeted inquiries');

      const medQuestion = questions.find(q => q.category === 'medications');
      assert.ok(medQuestion, 'Should prompt for missing medication dosage or schedule');
    });

    it('generates clinical summary adhering to strict non-diagnostic guardrails and disclaimers', () => {
      const patient = {
        name: 'Sarah Jenkins',
        age: 34,
        sex: 'female',
        symptoms: ['Fatigue'],
        existingConditions: [],
        allergies: [],
        currentMedications: []
      };

      const params = [
        {
          id: '1',
          name: 'Hemoglobin',
          canonicalName: 'Hemoglobin',
          category: 'Hematology',
          observedValue: 8.8,
          unit: 'g/dL',
          referenceRange: { rawText: '12.0 - 16.0', min: 12, max: 16, isSpecified: true },
          status: 'LOW',
          confidence: 'HIGH',
          sourceDocument: 'CURRENT_REPORT'
        }
      ];

      const summary = generateClinicalSummary(patient, params, [], [], []);
      assert.ok(summary.disclaimer, 'Must include clinical disclaimer');
      assert.match(summary.disclaimer, /NOT a medical diagnosis/i);
      assert.match(summary.disclaimer, /healthcare professional/i);
      assert.ok(summary.keyFindings.length > 0, 'Must identify out of range findings');
    });
  });

  describe('7. End-to-End MedLens Pipeline Integration', () => {
    it('executes full pipeline from raw intake & reports to structured record with audit log', () => {
      const result = runMedLensPipeline({
        patient: {
          name: 'Alex Rivera',
          age: 42,
          sex: 'male',
          symptoms: ['Polyuria', 'Polydipsia'],
          existingConditions: ['Hypertension'],
          allergies: ['Sulfa'],
          currentMedications: [
            { name: 'Amlodipine', dosage: '5mg', frequency: 'Daily' }
          ]
        },
        currentReportText: `
          Fasting Glucose | 168 | mg/dL | 70 - 99
          HbA1c | 8.2 | % | < 5.7
          eGFR | 78 | mL/min/1.73m2 | >= 60
        `,
        currentReportDate: '2026-09-01',
        previousReportText: `
          Fasting Glucose | 118 | mg/dL | 70 - 99
          HbA1c | 6.4 | % | < 5.7
        `,
        previousReportDate: '2026-03-01'
      });

      assert.equal(result.patient.name, 'Alex Rivera');
      assert.equal(result.currentParameters.length, 3);
      assert.ok(result.longitudinalComparisons.length >= 2, 'Should compare glucose and HbA1c');
      assert.ok(result.summary, 'Should synthesize AI summary');
      assert.ok(result.auditTrail.length > 0, 'Should generate immutable audit log entries');

      const glucoseParam = result.currentParameters.find(p => p.canonicalName === 'Fasting Blood Glucose');
      assert.ok(glucoseParam);
      assert.equal(glucoseParam.status, 'HIGH');
      assert.equal(glucoseParam.observedValue, 168);
    });
  });
});
