import type { PatientIntake, LabParameter, ConflictAlert, ClarificationQuestion, AISummary, LongitudinalComparisonItem } from '@/types';

/**
 * Synthesizes a structured, patient-friendly clinical intelligence summary.
 * 
 * STRICT AI SAFETY GUARDRAILS:
 * 1. Explains what parameters evaluate in plain language without making a definitive medical diagnosis.
 * 2. Never prescribes treatments or recommends medication dosage changes.
 * 3. Clearly points out values outside reported reference ranges and potential discrepancies.
 * 4. Communicates uncertainty and explicitly prompts physician consultation.
 */
export function generateClinicalSummary(
  patient: PatientIntake,
  parameters: LabParameter[],
  conflicts: ConflictAlert[] = [],
  questions: ClarificationQuestion[] = [],
  longitudinal: LongitudinalComparisonItem[] = []
): AISummary {
  const outOfRange = parameters.filter(p => p.status === 'LOW' || p.status === 'HIGH' || p.status === 'CRITICAL');

  // Key findings bullet points
  const keyFindings: string[] = [];

  keyFindings.push(
    `Processed clinical intake for ${patient.name} (${patient.age}y, ${patient.sex}). Report contains ${parameters.length} extracted laboratory parameters.`
  );

  if (outOfRange.length === 0) {
    keyFindings.push(
      'All extracted laboratory parameters fall within their respective reported normal reference intervals.'
    );
  } else {
    keyFindings.push(
      `${outOfRange.length} parameter${outOfRange.length > 1 ? 's are' : ' is'} outside the source report's reference ranges (${outOfRange.map(p => `${p.canonicalName}: ${p.observedValue} ${p.unit} [${p.status}]`).join(', ')}).`
    );
  }

  if (longitudinal.length > 0) {
    const changed = longitudinal.filter(l => l.trend !== 'STABLE' && l.trend !== 'NOT_APPLICABLE');
    if (changed.length > 0) {
      keyFindings.push(
        `Longitudinal comparison against prior records demonstrates notable shifts in ${changed.length} test parameter${changed.length > 1 ? 's' : ''}.`
      );
    } else {
      keyFindings.push(
        'Longitudinal comparison indicates parameters remain generally stable relative to previous testing.'
      );
    }
  }

  if (conflicts.length > 0) {
    keyFindings.push(
      `Attention: Identified ${conflicts.length} potential clinical discrepancy or conflict requiring clinician clarification before final record verification.`
    );
  }

  // Out of range highlights with plain patient-friendly translations
  const outOfRangeHighlights = outOfRange.map(param => {
    let plainExplanation = '';

    if (param.status === 'LOW') {
      plainExplanation = `Reported value (${param.observedValue} ${param.unit}) is lower than the reference interval (${param.referenceRange.rawText}). ${param.notes || ''}`;
    } else if (param.status === 'HIGH') {
      plainExplanation = `Reported value (${param.observedValue} ${param.unit}) is higher than the reference interval (${param.referenceRange.rawText}). ${param.notes || ''}`;
    } else if (param.status === 'CRITICAL') {
      plainExplanation = `CRITICAL ALERT: Reported value (${param.observedValue} ${param.unit}) significantly deviates from expected physiological norms. Prompt physician evaluation is strongly advised.`;
    }

    return {
      parameter: param.canonicalName,
      valueWithUnit: `${param.observedValue} ${param.unit}`.trim(),
      range: param.referenceRange.rawText,
      status: param.status,
      plainExplanation
    };
  });

  // General observations
  const generalObservations: string[] = [];

  if (patient.symptoms && patient.symptoms.length > 0) {
    generalObservations.push(
      `Reported primary symptoms include: ${patient.symptoms.join(', ')}. ${patient.symptomNotes ? `("${patient.symptomNotes}")` : ''}`
    );
  }

  if (patient.currentMedications && patient.currentMedications.length > 0) {
    generalObservations.push(
      `Documented current medications: ${patient.currentMedications.map(m => `${m.name} ${m.dosage || ''} ${m.frequency || ''}`.trim()).join(', ')}.`
    );
  }

  if (questions.length > 0) {
    generalObservations.push(
      `Generated ${questions.length} context-aware clarification questions to help resolve missing clinical context before your consultation.`
    );
  }

  return {
    keyFindings,
    outOfRangeHighlights,
    generalObservations,
    disclaimer: 'MEDLENS CLINICAL INFORMATION NOTICE: This AI-generated summary organizes and translates laboratory and patient data for informational and preparation purposes only. It is NOT a medical diagnosis, clinical prognosis, or treatment prescription. Reference ranges are strictly derived from the source laboratory documentation and are not independently invented. Always review these results directly with a qualified, licensed healthcare professional.'
  };
}
