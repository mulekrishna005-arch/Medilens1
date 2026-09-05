import type { PatientIntake, LabParameter, ConflictAlert } from '@/types';

/**
 * Cross-analyzes patient intake disclosures, current laboratory reports,
 * and previous records to surface clinical discrepancies and potential contradictions.
 * 
 * STRICT PRINCIPLE: MedLens FLAGS conflicts for human review;
 * it DOES NOT decide which piece of information is correct.
 */
export function detectConflicts(
  patient: PatientIntake,
  currentParams: LabParameter[],
  previousParams: LabParameter[] = [],
  rawPreviousText: string = ''
): ConflictAlert[] {
  const conflicts: ConflictAlert[] = [];

  const allergiesStr = (patient.allergies || []).join(' ').toLowerCase();
  const rawPrevLower = rawPreviousText.toLowerCase();
  const conditionsStr = (patient.existingConditions || []).join(' ').toLowerCase();

  // 1. ALLERGY DISCREPANCY: Patient reports "No Allergies" or empty, but previous records or notes document allergies
  const claimsNoAllergies = 
    patient.allergies.length === 0 || 
    allergiesStr.includes('none') || 
    allergiesStr.includes('nkda') || 
    allergiesStr.includes('no known');

  const allergenKeywords = ['penicillin', 'amoxicillin', 'sulfa', 'aspirin', 'nsaid', 'iodine', 'latex', 'peanuts'];
  for (const allergen of allergenKeywords) {
    if (claimsNoAllergies && rawPrevLower.includes(allergen)) {
      conflicts.push({
        id: `conflict-allergy-${allergen}`,
        title: `Allergy Documentation Discrepancy: ${allergen.toUpperCase()}`,
        severity: 'HIGH',
        description: `Patient intake indicates no known drug allergies, but previous medical notes reference an allergy or adverse reaction to "${allergen}".`,
        sourceA: {
          source: 'Patient Intake Form',
          detail: patient.allergies.length ? patient.allergies.join(', ') : 'No known drug allergies reported'
        },
        sourceB: {
          source: 'Previous Medical History / Report',
          detail: `Documented reference to "${allergen}" in historical clinical record`
        },
        status: 'PENDING'
      });
      break; // one primary allergy flag is sufficient
    }
  }

  // 2. ACTIVE MEDICATION VS KNOWN ALLERGY CONTRAINDICATION
  for (const med of patient.currentMedications || []) {
    const medLower = med.name.toLowerCase();
    
    // Penicillin family check
    if (
      (medLower.includes('amoxicillin') || medLower.includes('augmentin') || medLower.includes('penicillin') || medLower.includes('ampicillin')) &&
      allergiesStr.includes('penicillin')
    ) {
      conflicts.push({
        id: `conflict-med-allergy-${med.name}`,
        title: `Critical Medication-Allergy Warning: ${med.name}`,
        severity: 'HIGH',
        description: `Patient is reported as currently taking "${med.name}", which belongs to the penicillin class, but "Penicillin" is recorded in their allergy profile.`,
        sourceA: {
          source: 'Current Medications',
          detail: `${med.name} ${med.dosage || ''} ${med.frequency || ''}`
        },
        sourceB: {
          source: 'Reported Allergies',
          detail: 'Penicillin allergy documented'
        },
        status: 'PENDING'
      });
    }
  }

  // 3. MEDICATION CONTRAINDICATION WITH OBSERVED LAB MARKERS (e.g. Metformin with Renal Impairment)
  const isTakingMetformin = (patient.currentMedications || []).some(m => 
    m.name.toLowerCase().includes('metformin') || m.name.toLowerCase().includes('glucophage')
  );

  const creatinineParam = currentParams.find(p => p.canonicalName === 'Serum Creatinine');
  const egfrParam = currentParams.find(p => p.canonicalName === 'Estimated GFR (eGFR)');

  const creatVal = creatinineParam ? parseFloat(String(creatinineParam.observedValue)) : null;
  const egfrVal = egfrParam ? parseFloat(String(egfrParam.observedValue)) : null;

  if (isTakingMetformin && ((creatVal && creatVal >= 1.5) || (egfrVal && egfrVal < 45))) {
    conflicts.push({
      id: 'conflict-metformin-renal',
      title: 'Potential Medication & Renal Marker Discrepancy',
      severity: 'HIGH',
      description: `Patient is prescribed Metformin, but current laboratory results indicate reduced renal function (Creatinine ${creatVal || 'N/A'}, eGFR ${egfrVal || 'N/A'}). Guidelines typically advise dosage reassessment when renal clearance declines.`,
      sourceA: {
        source: 'Current Medications',
        detail: 'Metformin recorded in active medication list'
      },
      sourceB: {
        source: 'Current Laboratory Report',
        detail: `Renal parameters: ${creatVal ? `Creatinine: ${creatVal} mg/dL` : ''} ${egfrVal ? `eGFR: ${egfrVal} mL/min` : ''}`
      },
      status: 'PENDING'
    });
  }

  // 4. SUBJECTIVE CONDITION DISCREPANCY: Patient denies diabetes, but lab reports elevated HbA1c
  const hba1cParam = currentParams.find(p => p.canonicalName === 'Glycated Hemoglobin (HbA1c)');
  if (hba1cParam) {
    const a1cVal = parseFloat(String(hba1cParam.observedValue));
    const mentionsDiabetes = conditionsStr.includes('diabetes') || conditionsStr.includes('diabetic') || conditionsStr.includes('t2d');
    
    if (a1cVal >= 6.5 && !mentionsDiabetes) {
      conflicts.push({
        id: 'conflict-undiagnosed-hba1c',
        title: 'Diagnostic History vs. Laboratory Marker Divergence',
        severity: 'MEDIUM',
        description: `Current HbA1c is ${a1cVal}%, which is in the standard range where glycemic control is evaluated, but no history of Diabetes or prediabetes was declared in the patient intake.`,
        sourceA: {
          source: 'Patient Intake Conditions',
          detail: patient.existingConditions.length ? patient.existingConditions.join(', ') : 'No chronic endocrine conditions listed'
        },
        sourceB: {
          source: 'Current Laboratory Report',
          detail: `HbA1c: ${a1cVal}% (Reference: ${hba1cParam.referenceRange.rawText})`
        },
        status: 'PENDING'
      });
    }
  }

  // 5. MEDICATION DISCREPANCY: Antihypertensive taken, but Hypertension not listed in conditions
  const bloodPressureMeds = ['amlodipine', 'lisinopril', 'losartan', 'metoprolol', 'atenolol', 'hydrochlorothiazide'];
  const takingBpMed = (patient.currentMedications || []).find(m => 
    bloodPressureMeds.some(bp => m.name.toLowerCase().includes(bp))
  );
  const mentionsHypertension = conditionsStr.includes('hypertension') || conditionsStr.includes('high blood pressure') || conditionsStr.includes('htn');

  if (takingBpMed && !mentionsHypertension) {
    conflicts.push({
      id: 'conflict-bp-med-condition',
      title: 'Medication Purpose vs Documented Conditions',
      severity: 'INFO',
      description: `Patient is taking "${takingBpMed.name}", a blood pressure medication, but hypertension is not listed under existing medical conditions.`,
      sourceA: {
        source: 'Current Medications',
        detail: `${takingBpMed.name} ${takingBpMed.dosage || ''}`
      },
      sourceB: {
        source: 'Existing Conditions',
        detail: patient.existingConditions.length ? patient.existingConditions.join(', ') : 'Hypertension omitted'
      },
      status: 'PENDING'
    });
  }

  // 6. ACUTE TRAJECTORY DISCREPANCY: Significant acute shift in critical hematology parameters
  if (previousParams && previousParams.length > 0) {
    for (const prev of previousParams) {
      const curr = currentParams.find(p => p.canonicalName.toLowerCase() === prev.canonicalName.toLowerCase());
      if (curr && typeof curr.observedValue === 'number' && typeof prev.observedValue === 'number' && prev.observedValue > 0) {
        if (prev.canonicalName === 'Platelet Count' && (prev.observedValue - curr.observedValue) / prev.observedValue >= 0.6) {
          conflicts.push({
            id: 'conflict-acute-platelet-drop',
            title: 'Acute Platelet Count Decline',
            severity: 'HIGH',
            description: `Platelet count dropped significantly from ${prev.observedValue} ${prev.unit} to ${curr.observedValue} ${curr.unit}. Sudden downward trajectory warrants clinical review for acute thrombocytopenia.`,
            sourceA: { source: 'Previous Report', detail: `${prev.canonicalName}: ${prev.observedValue} ${prev.unit}` },
            sourceB: { source: 'Current Report', detail: `${curr.canonicalName}: ${curr.observedValue} ${curr.unit}` },
            status: 'PENDING'
          });
        }
      }
    }
  }

  return conflicts;
}
