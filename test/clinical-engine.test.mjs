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

    it('executes all preloaded clinical demo scenarios with full validation', async () => {
      const { DEMO_SCENARIOS } = await import('../src/lib/demoScenarios.ts');
      assert.equal(DEMO_SCENARIOS.length, 4);

      for (const scenario of DEMO_SCENARIOS) {
        const result = runMedLensPipeline({
          patient: scenario.intake,
          currentReportText: scenario.currentReportText,
          currentReportDate: scenario.currentReportDate,
          previousReportText: scenario.previousReportText,
          previousReportDate: scenario.previousReportDate
        });

        assert.ok(result.patient.name, `Patient name missing in scenario ${scenario.id}`);
        assert.ok(result.currentParameters.length > 0, `No parameters extracted in scenario ${scenario.id}`);
        assert.ok(result.summary.disclaimer.includes('NOT a medical diagnosis'));
        assert.ok(result.summary.keyFindings.length > 0);
        assert.ok(result.auditTrail.length > 0);
      }
    });
  });

  describe('8. Edge Cases & Qualitative Laboratory Evaluations', () => {
    it('evaluates qualitative results correctly (Negative, Positive, Qualitative)', () => {
      const unspecRange = parseReferenceRange('Negative');
      
      const negResult = evaluateReferenceRange('Negative', unspecRange);
      assert.equal(negResult.status, 'NORMAL');
      assert.equal(negResult.isCritical, false);

      const nonReactive = evaluateReferenceRange('Non-Reactive', unspecRange);
      assert.equal(nonReactive.status, 'NORMAL');

      const posResult = evaluateReferenceRange('Positive', unspecRange);
      assert.equal(posResult.status, 'HIGH');

      const traceResult = evaluateReferenceRange('Trace / Equivocal', unspecRange);
      assert.equal(traceResult.status, 'UNSPECIFIED');
    });

    it('evaluates single upper-bound and single lower-bound targets', () => {
      const upperRange = parseReferenceRange('< 200');
      const normalUpper = evaluateReferenceRange(150, upperRange);
      assert.equal(normalUpper.status, 'NORMAL');

      const highUpper = evaluateReferenceRange(240, upperRange);
      assert.equal(highUpper.status, 'HIGH');

      // Direct upper-bound only (hasMax && !hasMin)
      const maxOnlyRange = { rawText: '<= 100', min: null, max: 100, isSpecified: true };
      assert.equal(evaluateReferenceRange(120, maxOnlyRange).status, 'HIGH');
      assert.equal(evaluateReferenceRange(80, maxOnlyRange).status, 'NORMAL');

      const lowerRange = parseReferenceRange('>= 60');
      const normalLower = evaluateReferenceRange(85, lowerRange);
      assert.equal(normalLower.status, 'NORMAL');

      const lowLower = evaluateReferenceRange(42, lowerRange);
      assert.equal(lowLower.status, 'LOW');
    });

    it('filters out clinical metadata headers and deduplicates repeated lab tests', () => {
      const reportWithHeadersAndDups = `
        Department of Pathology & Laboratory Medicine
        Referred by Dr. Robert Vance
        Collected on 2026-08-10
        Page 1 of 2
        Hemoglobin   13.2   g/dL   12.0 - 16.0
        Hemoglobin   13.2   g/dL   12.0 - 16.0
      `;
      const params = extractParametersFromText(reportWithHeadersAndDups);
      assert.equal(params.length, 1);
      assert.equal(params[0].canonicalName, 'Hemoglobin');
    });

    it('evaluates qualitative longitudinal comparisons and stable trends', () => {
      const prevNumeric = [{
        id: 'p1', name: 'Potassium', canonicalName: 'Potassium', category: 'Electrolytes',
        observedValue: 4.2, unit: 'mEq/L', referenceRange: { rawText: '3.5 - 5.0', min: 3.5, max: 5.0, isSpecified: true },
        status: 'NORMAL', confidence: 'HIGH', sourceDocument: 'PREV'
      }];
      const currNumeric = [{
        id: 'c1', name: 'Potassium', canonicalName: 'Potassium', category: 'Electrolytes',
        observedValue: 4.22, unit: 'mEq/L', referenceRange: { rawText: '3.5 - 5.0', min: 3.5, max: 5.0, isSpecified: true },
        status: 'NORMAL', confidence: 'HIGH', sourceDocument: 'CURR'
      }];
      const numComp = compareReports(currNumeric, prevNumeric);
      assert.equal(numComp[0].trend, 'STABLE');

      // Qualitative stable
      const prevQual = [{
        id: 'q1', name: 'Hepatitis B Surface Antigen', canonicalName: 'Hepatitis B Surface Antigen', category: 'Serology',
        observedValue: 'Non-Reactive', unit: '', referenceRange: { rawText: 'Negative', isSpecified: false },
        status: 'NORMAL', confidence: 'HIGH', sourceDocument: 'PREV'
      }];
      const currQual = [{
        id: 'q2', name: 'Hepatitis B Surface Antigen', canonicalName: 'Hepatitis B Surface Antigen', category: 'Serology',
        observedValue: 'Non-Reactive', unit: '', referenceRange: { rawText: 'Negative', isSpecified: false },
        status: 'NORMAL', confidence: 'HIGH', sourceDocument: 'CURR'
      }];
      const qualComp = compareReports(currQual, prevQual);
      assert.equal(qualComp[0].trend, 'STABLE');
      assert.match(qualComp[0].clinicalObservation, /Unchanged qualitative result/);

      // Qualitative shifted
      currQual[0].observedValue = 'Reactive';
      const qualShift = compareReports(currQual, prevQual);
      assert.equal(qualShift[0].trend, 'NOT_APPLICABLE');
      assert.match(qualShift[0].clinicalObservation, /Shifted from/);
    });

    it('detects previous allergy note conflicts and acute platelet drops', () => {
      const patient = {
        name: 'Patient X',
        age: 60,
        sex: 'male',
        symptoms: [],
        existingConditions: [],
        allergies: [], // Claims no allergies
        currentMedications: []
      };

      const alerts = detectConflicts(patient, [], [], 'Patient had severe anaphylactic reaction to penicillin in 2022');
      const allergyAlert = alerts.find(a => a.id.startsWith('conflict-allergy-penicillin'));
      assert.ok(allergyAlert, 'Should detect penicillin allergy documentation discrepancy');

      // Acute platelet drop
      const prevPlt = [{
        id: 'p1', name: 'Platelets', canonicalName: 'Platelet Count', category: 'Hematology',
        observedValue: 300, unit: 'K/uL', referenceRange: { rawText: '150 - 450', min: 150, max: 450, isSpecified: true },
        status: 'NORMAL', confidence: 'HIGH', sourceDocument: 'PREV'
      }];
      const currPlt = [{
        id: 'c1', name: 'Platelets', canonicalName: 'Platelet Count', category: 'Hematology',
        observedValue: 80, unit: 'K/uL', referenceRange: { rawText: '150 - 450', min: 150, max: 450, isSpecified: true },
        status: 'LOW', confidence: 'HIGH', sourceDocument: 'CURR'
      }];
      const pltAlerts = detectConflicts(patient, currPlt, prevPlt);
      const acutePltAlert = pltAlerts.find(a => a.id === 'conflict-acute-platelet-drop');
      assert.ok(acutePltAlert, 'Should flag acute >60% drop in platelets');
    });

    it('covers clarification questions and summary generation edge conditions', () => {
      // Patient with no symptoms and thyroid test
      const patient = {
        name: 'Thyroid Patient',
        age: 38,
        sex: 'female',
        symptoms: [],
        existingConditions: [],
        allergies: [],
        currentMedications: [
          { name: 'Levothyroxine', dosage: '50mcg', frequency: 'Daily before breakfast' }
        ]
      };
      const tshParam = [{
        id: 't1', name: 'TSH', canonicalName: 'Thyroid Stimulating Hormone (TSH)', category: 'Endocrine',
        observedValue: 2.1, unit: 'uIU/mL', referenceRange: { rawText: '0.4 - 4.5', min: 0.4, max: 4.5, isSpecified: true },
        status: 'NORMAL', confidence: 'HIGH', sourceDocument: 'CURR'
      }];

      const questions = generateClarificationQuestions(patient, tshParam);
      const symptomReason = questions.find(q => q.id === 'q-symptom-reason');
      assert.ok(symptomReason, 'Should prompt for reason for test when symptoms are empty');
      const thyroidTiming = questions.find(q => q.id === 'q-thyroid-timing');
      assert.ok(thyroidTiming, 'Should prompt for thyroid medication timing');
      const otcQuestion = questions.find(q => q.id === 'q-otc-supplements');
      assert.ok(otcQuestion, 'Should prompt for OTC supplements when medications are fully specified');

      // Summary with all normal parameters and stable longitudinal comparison
      const normalSummary = generateClinicalSummary(patient, tshParam, [], [], [{
        parameterId: 't1', canonicalName: 'Thyroid Stimulating Hormone (TSH)', unit: 'uIU/mL',
        previousValue: 2.1, previousDate: '2026-01-01', previousStatus: 'NORMAL',
        currentValue: 2.1, currentDate: '2026-08-01', currentStatus: 'NORMAL',
        numericDelta: 0, percentageChange: 0, trend: 'STABLE', clinicalObservation: 'Stable'
      }]);
      assert.ok(normalSummary.keyFindings.some(k => k.includes('All extracted laboratory parameters fall within')));
      assert.ok(normalSummary.keyFindings.some(k => k.includes('remain generally stable')));

      // Summary with critical parameter
      const criticalParam = [{
        id: 'k1', name: 'Potassium', canonicalName: 'Potassium', category: 'Electrolytes',
        observedValue: 6.8, unit: 'mEq/L', referenceRange: { rawText: '3.5 - 5.0', min: 3.5, max: 5.0, isSpecified: true },
        status: 'CRITICAL', confidence: 'HIGH', sourceDocument: 'CURR'
      }];
      const criticalSummary = generateClinicalSummary(patient, criticalParam, [], [], []);
      assert.ok(criticalSummary.outOfRangeHighlights.some(h => h.plainExplanation.includes('CRITICAL ALERT')));
    });
  });

  describe('9. Comprehensive Branch Coverage for 100% Branch Metrics', () => {
    it('covers all optional and fallback branches in clarificationGenerator and conflictDetector', () => {
      // clarificationGenerator with undefined/null medications
      const qNullMeds = generateClarificationQuestions({
        name: 'No Meds Patient',
        age: 30,
        sex: 'male',
        symptoms: ['Headache'],
        existingConditions: [],
        allergies: [],
        currentMedications: undefined
      });
      assert.ok(qNullMeds.length > 0);

      // conflictDetector with undefined arrays
      const cNullArrays = detectConflicts(
        {
          name: 'Null Arrays Patient',
          age: 40,
          sex: 'female',
          symptoms: [],
          existingConditions: undefined,
          allergies: undefined,
          currentMedications: undefined
        },
        [],
        undefined,
        ''
      );
      assert.deepEqual(cNullArrays, []);

      // conflictDetector: patient has non-empty allergies ('None' or 'NKDA') and previous record has allergen
      const cAllergyWithDetail = detectConflicts(
        {
          name: 'NKDA Patient',
          age: 50,
          sex: 'male',
          symptoms: [],
          existingConditions: [],
          allergies: ['No Known Drug Allergies (NKDA)'],
          currentMedications: []
        },
        [],
        [],
        'History of severe rash to penicillin in 2018'
      );
      assert.ok(cAllergyWithDetail.length > 0);
      assert.equal(cAllergyWithDetail[0].sourceA.detail, 'No Known Drug Allergies (NKDA)');

      // conflictDetector: Penicillin med without dosage and without frequency
      const cPenicillinNoDose = detectConflicts(
        {
          name: 'Penicillin Patient',
          age: 45,
          sex: 'male',
          symptoms: [],
          existingConditions: [],
          allergies: ['Penicillin'],
          currentMedications: [{ name: 'Amoxicillin', dosage: '', frequency: '' }]
        },
        []
      );
      assert.ok(cPenicillinNoDose.length > 0);
      assert.equal(cPenicillinNoDose[0].sourceA.detail.trim(), 'Amoxicillin');

      // conflictDetector: Metformin with creatinine >= 1.5 and NO egfr
      const cMetforminCreatOnly = detectConflicts(
        {
          name: 'Metformin Patient',
          age: 70,
          sex: 'female',
          symptoms: [],
          existingConditions: ['Type 2 Diabetes'],
          allergies: [],
          currentMedications: [{ name: 'Metformin', dosage: '1000mg', frequency: 'Daily' }]
        },
        [{
          id: 'cr1', name: 'Creatinine', canonicalName: 'Serum Creatinine', category: 'Renal Function',
          observedValue: 2.1, unit: 'mg/dL', referenceRange: { rawText: '0.6 - 1.2', min: 0.6, max: 1.2, isSpecified: true },
          status: 'HIGH', confidence: 'HIGH', sourceDocument: 'CURR'
        }]
      );
      assert.ok(cMetforminCreatOnly.some(c => c.id === 'conflict-metformin-renal'));

      // conflictDetector: Metformin with BOTH elevated creatinine and reduced egfr
      const cMetforminBoth = detectConflicts(
        {
          name: 'Metformin Both Patient',
          age: 72,
          sex: 'female',
          symptoms: [],
          existingConditions: ['Type 2 Diabetes'],
          allergies: [],
          currentMedications: [{ name: 'Metformin', dosage: '1000mg', frequency: 'Daily' }]
        },
        [
          {
            id: 'cr2', name: 'Creatinine', canonicalName: 'Serum Creatinine', category: 'Renal Function',
            observedValue: 2.3, unit: 'mg/dL', referenceRange: { rawText: '0.6 - 1.2', min: 0.6, max: 1.2, isSpecified: true },
            status: 'HIGH', confidence: 'HIGH', sourceDocument: 'CURR'
          },
          {
            id: 'egfr2', name: 'eGFR', canonicalName: 'Estimated GFR (eGFR)', category: 'Renal Function',
            observedValue: 28, unit: 'mL/min', referenceRange: { rawText: '>= 60', min: 60, max: null, isSpecified: true },
            status: 'LOW', confidence: 'HIGH', sourceDocument: 'CURR'
          }
        ]
      );
      assert.ok(cMetforminBoth.some(c => c.id === 'conflict-metformin-renal'));

      // conflictDetector: Antihypertensive with NO dosage and empty existingConditions
      const cBpNoDoseNoConditions = detectConflicts(
        {
          name: 'BP Patient',
          age: 55,
          sex: 'male',
          symptoms: [],
          existingConditions: [],
          allergies: [],
          currentMedications: [{ name: 'Amlodipine', dosage: '', frequency: '' }]
        },
        []
      );
      const bpAlert = cBpNoDoseNoConditions.find(c => c.id === 'conflict-bp-med-condition');
      assert.ok(bpAlert);
      assert.equal(bpAlert.sourceA.detail.trim(), 'Amlodipine');
      assert.equal(bpAlert.sourceB.detail, 'Hypertension omitted');
    });

    it('covers zero-baseline trajectory, single report pipeline, and missing range parser branches', () => {
      // longitudinalComparator with prevNum === 0
      const prevZero = [{
        id: 'z1', name: 'Troponin I', canonicalName: 'Troponin I', category: 'Cardiac',
        observedValue: 0, unit: 'ng/mL', referenceRange: { rawText: '< 0.04', min: 0, max: 0.04, isSpecified: true },
        status: 'NORMAL', confidence: 'HIGH', sourceDocument: 'PREV'
      }];
      const currNonZero = [{
        id: 'z2', name: 'Troponin I', canonicalName: 'Troponin I', category: 'Cardiac',
        observedValue: 0.05, unit: 'ng/mL', referenceRange: { rawText: '< 0.04', min: 0, max: 0.04, isSpecified: true },
        status: 'HIGH', confidence: 'HIGH', sourceDocument: 'CURR'
      }];
      const zeroComp = compareReports(currNonZero, prevZero);
      assert.equal(zeroComp[0].trend, 'STABLE');
      assert.equal(zeroComp[0].percentageChange, null);

      // pipeline without previous report or dates
      const singleReportResult = runMedLensPipeline({
        patient: {
          name: 'Single Report Patient',
          age: 28,
          sex: 'female',
          symptoms: [],
          existingConditions: [],
          allergies: [],
          currentMedications: []
        },
        currentReportText: 'Hemoglobin 13.5 g/dL 12.0 - 16.0'
      });
      assert.equal(singleReportResult.currentParameters.length, 1);
      assert.equal(singleReportResult.previousParameters.length, 0);
      assert.equal(singleReportResult.longitudinalComparisons.length, 0);
      assert.ok(singleReportResult.currentReportDate);

      // referenceRangeEvaluator: parseReferenceRange with empty/whitespace or non-provided text
      const emptyParsed = parseReferenceRange('   ');
      assert.equal(emptyParsed.isSpecified, false);
      assert.equal(emptyParsed.rawText, 'Not provided in report');

      // reportParser: parameter line with no reference range at all, header with "test", short name, and long name
      const noRangeReport = `
        Blood Test Header
        Laboratory: test
        A 50 mg/dL
        Very Extremely Long Test Name With Way Too Many Words In It 100 mg/dL
        Hemoglobin 14.2 g/dL
      `;
      const noRangeParams = extractParametersFromText(noRangeReport);
      assert.equal(noRangeParams.length, 1);
      assert.equal(noRangeParams[0].referenceRange.rawText, 'Not provided in report');

      // summaryGenerator: HIGH and LOW status both with and without notes, and medications with mixed dosage/frequency
      const summaryWithNotes = generateClinicalSummary(
        {
          name: 'Summary Patient',
          age: 48,
          sex: 'male',
          symptoms: ['Fatigue'],
          existingConditions: [],
          allergies: [],
          currentMedications: [
            { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' },
            { name: 'Aspirin', dosage: '', frequency: '' },
            { name: 'Vitamin D', dosage: '1000 IU', frequency: '' }
          ]
        },
        [
          {
            id: 'g1', name: 'Fasting Blood Sugar', canonicalName: 'Fasting Blood Glucose', category: 'Metabolic',
            observedValue: 155, unit: 'mg/dL', referenceRange: { rawText: '70 - 99', min: 70, max: 99, isSpecified: true },
            status: 'HIGH', confidence: 'HIGH', sourceDocument: 'CURR', notes: 'Verified on secondary assay'
          },
          {
            id: 'g2', name: 'HbA1c', canonicalName: 'Glycated Hemoglobin (HbA1c)', category: 'Metabolic',
            observedValue: 8.5, unit: '%', referenceRange: { rawText: '< 5.7', min: 0, max: 5.7, isSpecified: true },
            status: 'HIGH', confidence: 'HIGH', sourceDocument: 'CURR', notes: ''
          },
          {
            id: 'h1', name: 'Hemoglobin', canonicalName: 'Hemoglobin', category: 'Hematology',
            observedValue: 9.0, unit: 'g/dL', referenceRange: { rawText: '12.0 - 16.0', min: 12, max: 16, isSpecified: true },
            status: 'LOW', confidence: 'HIGH', sourceDocument: 'CURR', notes: 'Microcytic morphology observed'
          },
          {
            id: 'h2', name: 'Hematocrit', canonicalName: 'Hematocrit', category: 'Hematology',
            observedValue: 28.0, unit: '%', referenceRange: { rawText: '36.0 - 46.0', min: 36, max: 46, isSpecified: true },
            status: 'LOW', confidence: 'HIGH', sourceDocument: 'CURR', notes: ''
          }
        ],
        [],
        [],
        []
      );
      assert.ok(summaryWithNotes.outOfRangeHighlights[0].plainExplanation.includes('Verified on secondary assay'));
      assert.ok(summaryWithNotes.outOfRangeHighlights[2].plainExplanation.includes('Microcytic morphology observed'));
    });
  });

  describe('10. Clinical Safety Invariants & Boundary Validations', () => {
    it('strictly guarantees no reference range invention across diverse unformatted reports', () => {
      const rawText = `
        Random Lab Test Alpha: 42 mg/dL
        Random Lab Test Beta: 99 U/L
      `;
      const extracted = extractParametersFromText(rawText);
      assert.equal(extracted.length, 2);
      for (const param of extracted) {
        assert.equal(param.referenceRange.isSpecified, false);
        assert.equal(param.status, 'UNSPECIFIED');
        assert.equal(param.referenceRange.rawText, 'Not provided in report');
      }
    });

    it('reliably detects drug allergy contradictions case-insensitively', () => {
      const conflicts = detectConflicts(
        {
          name: 'Case Test',
          age: 40,
          sex: 'female',
          symptoms: [],
          existingConditions: [],
          allergies: ['PENICILLIN'],
          currentMedications: [{ name: 'amoxicillin', dosage: '500mg', frequency: 'TID' }]
        },
        []
      );
      const allergyAlert = conflicts.find(c => c.id.startsWith('conflict-med-allergy'));
      assert.ok(allergyAlert);
      assert.equal(allergyAlert.severity, 'HIGH');
    });

    it('ensures longitudinal comparison never produces NaN or division-by-zero crashes', () => {
      const compZero = compareReports(
        [{
          id: 'z1', name: 'Zero Baseline', canonicalName: 'Zero Baseline', category: 'Other',
          observedValue: 0, unit: 'units', referenceRange: { rawText: '0 - 10', min: 0, max: 10, isSpecified: true },
          status: 'NORMAL', confidence: 'HIGH', sourceDocument: 'PREV'
        }],
        [{
          id: 'z2', name: 'Zero Baseline', canonicalName: 'Zero Baseline', category: 'Other',
          observedValue: 0, unit: 'units', referenceRange: { rawText: '0 - 10', min: 0, max: 10, isSpecified: true },
          status: 'NORMAL', confidence: 'HIGH', sourceDocument: 'CURR'
        }]
      );
      assert.equal(compZero.length, 1);
      assert.equal(compZero[0].trend, 'STABLE');
      assert.equal(compZero[0].percentageChange, null);
      assert.equal(compZero[0].numericDelta, 0);
    });

    it('verifies audit trail integrity and metadata completeness in end-to-end pipeline', () => {
      const result = runMedLensPipeline({
        patient: {
          name: 'Integrity Test Patient',
          age: 55,
          sex: 'male',
          symptoms: ['Chest tightness'],
          existingConditions: ['Hypertension'],
          allergies: [],
          currentMedications: [{ name: 'Amlodipine', dosage: '5mg', frequency: 'daily' }]
        },
        currentReportText: 'Troponin-I | 0.02 | ng/mL | < 0.04\nPotassium | 4.2 | mmol/L | 3.5 - 5.0'
      });
      assert.ok(result.id.startsWith('rec-'));
      assert.equal(result.isVerified, false);
      assert.ok(result.auditTrail.length > 0);
      assert.equal(result.auditTrail[0].action, 'EXTRACT');
      assert.ok(new Date(result.auditTrail[0].timestamp).getTime() > 0);
      assert.equal(result.auditTrail[0].author, 'SYSTEM_AI');
    });
  });
});
