import { PatientIntake, LabParameter, ClarificationQuestion } from '@/types';

/**
 * Generates 3 to 5 targeted, context-aware clarification questions
 * based on missing, incomplete, or ambiguous patient information.
 * 
 * STRICT CLINICAL GUARDRAIL:
 * All questions are strictly informational inquiries to clarify history,
 * NEVER medical advice or diagnostic speculation.
 */
export function generateClarificationQuestions(
  patient: PatientIntake,
  parameters: LabParameter[] = []
): ClarificationQuestion[] {
  const questions: ClarificationQuestion[] = [];

  // 1. Symptom Context & Chronology (Onset, frequency, progression)
  if (patient.symptoms && patient.symptoms.length > 0) {
    const primarySymptom = patient.symptoms[0];
    questions.push({
      id: 'q-symptom-onset',
      category: 'symptoms',
      question: `Regarding the reported symptom of "${primarySymptom}": Approximately when did this first begin, and has its severity changed over time?`,
      rationale: 'Establishing symptom onset and trajectory provides critical timeline context for the reviewing physician.'
    });

    if (patient.symptoms.length > 1) {
      questions.push({
        id: 'q-symptom-frequency',
        category: 'symptoms',
        question: `Do symptoms like "${patient.symptoms[1]}" occur continuously throughout the day, or do they happen in episodes triggered by specific activities or times?`,
        rationale: 'Clarifying episodic vs. continuous nature aids clinical differentiation.'
      });
    }
  } else {
    questions.push({
      id: 'q-symptom-reason',
      category: 'symptoms',
      question: 'What was the primary reason or clinical concern that prompted having this laboratory test completed today?',
      rationale: 'Captures the underlying clinical reason for testing when no specific symptoms were listed.'
    });
  }

  // 2. Fasting / Test Preparation Status for Metabolic & Lipid Tests
  const hasFastingTest = parameters.some(p => 
    p.canonicalName.includes('Fasting') || 
    p.canonicalName.includes('Lipid') || 
    p.canonicalName.includes('Cholesterol') ||
    p.canonicalName.includes('Triglycerides')
  );

  if (hasFastingTest) {
    questions.push({
      id: 'q-fasting-status',
      category: 'test_preparation',
      question: 'Were you fasting (no food or drinks other than water for 8 to 12 hours) prior to having your blood drawn for this test?',
      rationale: 'Fasting status significantly alters the physiological interpretation of glucose and lipid panel results.'
    });
  }

  // 3. Medication Dosage & Adherence Clarity
  const medsWithoutDose = (patient.currentMedications || []).filter(m => !m.dosage || !m.frequency);
  if (medsWithoutDose.length > 0) {
    const medName = medsWithoutDose[0].name;
    questions.push({
      id: 'q-med-adherence',
      category: 'medications',
      question: `For "${medName}": What exact strength (e.g., in mg) and daily schedule (e.g., once daily with breakfast) were you prescribed?`,
      rationale: 'Accurate medication reconciliation requires precise dosage and frequency documentation.'
    });
  } else if (patient.currentMedications && patient.currentMedications.length > 0) {
    questions.push({
      id: 'q-otc-supplements',
      category: 'medications',
      question: 'Are you taking any over-the-counter supplements, vitamins (such as Biotin or Iron), or herbal remedies that were not listed above?',
      rationale: 'Certain common supplements (e.g., high-dose Biotin) can directly interfere with laboratory immunoassay measurements like TSH or Troponin.'
    });
  }

  // 4. Thyroid or Hormone Timing check
  const hasTsh = parameters.some(p => p.canonicalName.includes('Thyroid'));
  if (hasTsh && questions.length < 5) {
    questions.push({
      id: 'q-thyroid-timing',
      category: 'test_preparation',
      question: 'If you take thyroid hormone medication (such as levothyroxine), was your morning dose taken before or after this blood draw?',
      rationale: 'Thyroid hormone ingestion prior to blood collection temporarily spikes circulating levels and alters interpretation.'
    });
  }

  // Cap at 4 most relevant questions
  return questions.slice(0, 4);
}
