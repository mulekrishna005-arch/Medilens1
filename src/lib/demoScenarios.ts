import { DemoScenario } from '@/types';

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'anemia-iron-deficiency',
    title: 'Anemia & Iron Deficiency Workup',
    subtitle: 'Microcytic anemia progression with longitudinal CBC and Ferritin',
    badge: 'Longitudinal Anemia',
    description: 'A 34-year-old female presenting with 3 months of worsening fatigue and cold intolerance. Demonstrates longitudinal CBC tracking showing declining hemoglobin and depleted ferritin.',
    intake: {
      name: 'Sarah Jenkins',
      age: 34,
      sex: 'female',
      symptoms: ['Persistent fatigue', 'Postural dizziness', 'Cold sensitivity', 'Brittle nails'],
      symptomNotes: 'Fatigue worsened over the past 6 weeks; struggling with regular daily walks.',
      existingConditions: ['Menorrhagia (heavy menstrual cycles)'],
      allergies: ['Sulfa antibiotics (Trimethoprim-Sulfamethoxazole)'],
      currentMedications: [
        { name: 'Daily Multivitamin', dosage: '1 tablet', frequency: 'Daily with food' }
      ],
      additionalNotes: 'Patient notes reduced dietary meat intake over the last 9 months.'
    },
    currentReportDate: '2026-08-14',
    currentReportText: `QUEST DIAGNOSTICS - CLINICAL PATHOLOGY REPORT
Patient: Sarah Jenkins | Age: 34 | Sex: Female
Collection Date: 2026-08-14 | Specimen: Whole Blood & Serum

COMPLETE BLOOD COUNT (CBC):
Hemoglobin                   9.4   g/dL        12.0 - 15.5
Hematocrit                  29.1   %           36.0 - 46.0
RBC Count                   3.78   million/µL  4.00 - 5.20
White Blood Cell Count      6,400  /µL         4,000 - 11,000
Platelet Count              380    x10³/µL     150 - 450
Mean Corpuscular Volume     71.5   fL          80.0 - 100.0

IRON & METABOLIC STUDIES:
Serum Ferritin               8.0   ng/mL       15.0 - 150.0
Serum Iron                  28.0   µg/dL       50.0 - 170.0
Total Iron Binding Capacity 465.0  µg/dL       250.0 - 400.0
`,
    previousReportDate: '2026-02-10',
    previousReportText: `QUEST DIAGNOSTICS - HISTORICAL LAB ARCHIVE
Patient: Sarah Jenkins | Date: 2026-02-10

COMPLETE BLOOD COUNT (CBC):
Hemoglobin                  11.2   g/dL        12.0 - 15.5
Hematocrit                  34.5   %           36.0 - 46.0
RBC Count                   4.15   million/µL  4.00 - 5.20
White Blood Cell Count      6,100  /µL         4,000 - 11,000
Platelet Count              340    x10³/µL     150 - 450
Mean Corpuscular Volume     79.0   fL          80.0 - 100.0
Serum Ferritin              24.0   ng/mL       15.0 - 150.0
`
  },
  {
    id: 'diabetes-renal-check',
    title: 'Type 2 Diabetes & Renal Function',
    subtitle: 'Glycemic control and declining filtration rate with drug alert',
    badge: 'Metabolic & Renal',
    description: 'A 58-year-old male with established Type 2 Diabetes. Demonstrates glycemic elevation, declining eGFR, and alerts on Metformin medication reassessment.',
    intake: {
      name: 'Robert Chen',
      age: 58,
      sex: 'male',
      symptoms: ['Increased thirst (polydipsia)', 'Nocturia (waking 2-3x to urinate)', 'Mild bilateral foot tingling'],
      symptomNotes: 'Tingling in toes noticed mostly at night.',
      existingConditions: ['Type 2 Diabetes Mellitus (Diagnosed 2021)', 'Essential Hypertension'],
      allergies: ['No known drug allergies (NKDA)'],
      currentMedications: [
        { name: 'Metformin', dosage: '1000 mg', frequency: 'Twice daily with meals' },
        { name: 'Lisinopril', dosage: '20 mg', frequency: 'Once daily in the morning' }
      ],
      additionalNotes: 'Missed scheduled 3-month follow-up visit due to work travel.'
    },
    currentReportDate: '2026-08-20',
    currentReportText: `METROPOLITAN HOSPITAL LABORATORY
Patient: Robert Chen | Age: 58 | Sex: Male
Collection Date: 2026-08-20

COMPREHENSIVE METABOLIC PANEL:
Fasting Blood Glucose       168.0  mg/dL       70.0 - 99.0
Glycated Hemoglobin (HbA1c)   8.4  %            4.0 - 5.6
Serum Creatinine              1.65 mg/dL        0.70 - 1.30
Estimated GFR (eGFR)         44.0  mL/min/1.73m² > 60.0
Blood Urea Nitrogen (BUN)    26.0  mg/dL        7.0 - 20.0
Serum Sodium                138.0  mmol/L      135.0 - 145.0
Serum Potassium               4.8  mmol/L        3.5 - 5.0
`,
    previousReportDate: '2026-01-15',
    previousReportText: `METROPOLITAN HOSPITAL LABORATORY
Patient: Robert Chen | Date: 2026-01-15

METABOLIC PROFILE:
Fasting Blood Glucose       134.0  mg/dL       70.0 - 99.0
Glycated Hemoglobin (HbA1c)   7.1  %            4.0 - 5.6
Serum Creatinine              1.10 mg/dL        0.70 - 1.30
Estimated GFR (eGFR)         68.0  mL/min/1.73m² > 60.0
Blood Urea Nitrogen (BUN)    16.0  mg/dL        7.0 - 20.0
`
  },
  {
    id: 'cardio-lipid-profile',
    title: 'Cardiovascular Risk & Lipid Workup',
    subtitle: 'Lipid panel and inflammatory markers under Statin therapy',
    badge: 'Cardiovascular Risk',
    description: 'A 52-year-old male evaluating cardiovascular risk parameters, elevated LDL, triglycerides, and systemic inflammatory marker hs-CRP.',
    intake: {
      name: 'Michael Torres',
      age: 52,
      sex: 'male',
      symptoms: ['Mild shortness of breath with vigorous stair climbing'],
      symptomNotes: 'No resting chest pain or palpitations.',
      existingConditions: ['Dyslipidemia', 'Family history of premature myocardial infarction (father at age 49)'],
      allergies: ['Latex'],
      currentMedications: [
        { name: 'Atorvastatin', dosage: '20 mg', frequency: 'Once daily at bedtime' }
      ],
      additionalNotes: 'Sedentary desk job, exercises occasionally on weekends.'
    },
    currentReportDate: '2026-07-28',
    currentReportText: `CARDIOVASCULAR HEALTH NETWORK LABS
Patient: Michael Torres | Age: 52 | Sex: Male
Collection Date: 2026-07-28

LIPID & CARDIAC BIOMARKER PANEL:
Total Cholesterol           238.0  mg/dL       < 200.0
LDL Cholesterol             154.0  mg/dL       < 100.0
HDL Cholesterol              37.0  mg/dL       > 40.0
Triglycerides               215.0  mg/dL       < 150.0
C-Reactive Protein (CRP)      3.6  mg/L        < 1.0
Fasting Blood Glucose       102.0  mg/dL       70.0 - 99.0
`,
    previousReportDate: '2025-11-10',
    previousReportText: `CARDIOVASCULAR HEALTH NETWORK LABS
Patient: Michael Torres | Date: 2025-11-10

LIPID PANEL:
Total Cholesterol           262.0  mg/dL       < 200.0
LDL Cholesterol             182.0  mg/dL       < 100.0
HDL Cholesterol              35.0  mg/dL       > 40.0
Triglycerides               240.0  mg/dL       < 150.0
`
  },
  {
    id: 'allergy-med-conflict',
    title: 'Allergy & Medication Discrepancy Case',
    subtitle: 'Active penicillin derivative intake with conflicting historical record',
    badge: 'Conflict Detection',
    description: 'Patient states "No known allergies" in intake and is currently taking Amoxicillin, but previous medical notes explicitly document a severe Penicillin allergy.',
    intake: {
      name: 'David Miller',
      age: 47,
      sex: 'male',
      symptoms: ['Sinus pressure', 'Productive cough for 10 days', 'Low-grade fever'],
      symptomNotes: 'Started 10 days ago after viral exposure.',
      existingConditions: ['Seasonal Allergic Rhinitis'],
      allergies: [], // Intentionally empty to trigger the documented contradiction!
      currentMedications: [
        { name: 'Amoxicillin-Clavulanate (Augmentin)', dosage: '875/125 mg', frequency: 'Twice daily for 7 days' },
        { name: 'Fluticasone nasal spray', dosage: '50 mcg', frequency: '1 spray per nostril daily' }
      ],
      additionalNotes: 'Prescribed Augmentin at an urgent care walk-in clinic 2 days ago.'
    },
    currentReportDate: '2026-08-30',
    currentReportText: `URGENT CARE RAPID LABS
Patient: David Miller | Age: 47 | Sex: Male
Collection Date: 2026-08-30

COMPLETE BLOOD COUNT:
White Blood Cell Count     12,600  /µL         4,000 - 11,000
Hemoglobin                   14.6  g/dL        13.5 - 17.5
Hematocrit                   43.2  %           38.8 - 50.0
Platelet Count              265    x10³/µL     150 - 450
C-Reactive Protein (CRP)     14.2  mg/L        < 5.0
`,
    previousReportDate: '2023-04-12',
    previousReportText: `ST. JUDE COMMUNITY HOSPITAL - HISTORICAL EMERGENCY ENCOUNTER
Patient: David Miller | Date: 2023-04-12
Clinical Encounter Notes:
Patient presented to ED with acute urticaria (hives) and facial angioedema 45 minutes following ingestion of Penicillin VK. Treated with Epinephrine IM, diphenhydramine, and dexamethasone.
Documented Allergy: PENICILLIN ALLERGY CONFIRMED (Anaphylactoid reaction). Patient counseled to avoid all beta-lactam antibiotics.
`
  }
];
