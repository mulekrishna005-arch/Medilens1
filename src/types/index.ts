export type BiologicalSex = 'male' | 'female' | 'other' | 'unspecified';

export type RangeStatus = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL' | 'UNSPECIFIED';

export type ProvenanceSource = 
  | 'USER_INTAKE'
  | 'CURRENT_REPORT'
  | 'PREVIOUS_REPORT'
  | 'AI_SYNTHESIS'
  | 'HUMAN_VERIFIED';

export type TestCategory = 
  | 'Hematology'
  | 'Metabolic & Electrolytes'
  | 'Renal Function'
  | 'Liver Function'
  | 'Lipid Profile'
  | 'Endocrine & Thyroid'
  | 'Inflammatory & Cardiac'
  | 'Urinalysis'
  | 'Other';

export interface PatientIntake {
  id: string;
  name: string;
  age: number | string;
  sex: BiologicalSex;
  symptoms: string[];
  symptomNotes?: string;
  existingConditions: string[];
  allergies: string[];
  currentMedications: {
    name: string;
    dosage?: string;
    frequency?: string;
  }[];
  additionalNotes?: string;
  createdAt: string;
}

export interface LabParameter {
  id: string;
  name: string;                // Raw test name as printed in report (e.g., "Hb")
  canonicalName: string;       // Normalized medical name (e.g., "Hemoglobin")
  observedValue: number | string;
  unit: string;
  referenceRange: {
    rawText: string;           // Verbatim reference range from report (e.g., "13.0 - 17.0")
    min?: number | null;
    max?: number | null;
    isSpecified: boolean;      // MUST NOT invent if false
  };
  status: RangeStatus;
  category: TestCategory;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  sourceTextSnippet?: string;  // Traceability anchor from the original document
  sourceDocument: 'CURRENT_REPORT' | 'PREVIOUS_REPORT';
  isHumanVerified?: boolean;
  notes?: string;
}

export interface ConflictAlert {
  id: string;
  title: string;
  severity: 'HIGH' | 'MEDIUM' | 'INFO';
  description: string;
  sourceA: {
    source: string;
    detail: string;
  };
  sourceB: {
    source: string;
    detail: string;
  };
  status: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED';
  resolutionNote?: string;
}

export interface ClarificationQuestion {
  id: string;
  category: 'symptoms' | 'medications' | 'lifestyle' | 'test_preparation';
  question: string;
  rationale: string;
  answeredText?: string;
}

export interface LongitudinalComparisonItem {
  parameterId: string;
  canonicalName: string;
  unit: string;
  previousValue: number | string;
  previousDate?: string;
  previousStatus: RangeStatus;
  currentValue: number | string;
  currentDate?: string;
  currentStatus: RangeStatus;
  numericDelta?: number | null;
  percentageChange?: number | null;
  trend: 'INCREASED' | 'DECREASED' | 'STABLE' | 'NOT_APPLICABLE';
  clinicalObservation: string;
}

export interface AISummary {
  keyFindings: string[];
  outOfRangeHighlights: {
    parameter: string;
    valueWithUnit: string;
    range: string;
    status: RangeStatus;
    plainExplanation: string;
  }[];
  generalObservations: string[];
  disclaimer: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  author: 'SYSTEM_AI' | 'CLINICIAN' | 'PATIENT';
  action: 'EXTRACT' | 'EDIT_VALUE' | 'RESOLVE_CONFLICT' | 'ANSWER_QUESTION' | 'VERIFY_RECORD';
  targetField: string;
  oldValue?: string;
  newValue?: string;
  comment?: string;
}

export interface MedicalRecordData {
  id: string;
  patient: PatientIntake;
  currentReportDate?: string;
  previousReportDate?: string;
  currentReportRawText?: string;
  previousReportRawText?: string;
  currentParameters: LabParameter[];
  previousParameters?: LabParameter[];
  longitudinalComparisons?: LongitudinalComparisonItem[];
  conflicts: ConflictAlert[];
  clarificationQuestions: ClarificationQuestion[];
  summary: AISummary;
  auditTrail: AuditLogEntry[];
  isVerified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface DemoScenario {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  intake: Omit<PatientIntake, 'id' | 'createdAt'>;
  currentReportDate: string;
  currentReportText: string;
  previousReportDate?: string;
  previousReportText?: string;
}
