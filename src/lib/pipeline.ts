import { PatientIntake, MedicalRecordData, AuditLogEntry } from '@/types';
import { extractParametersFromText } from './reportParser';
import { detectConflicts } from './conflictDetector';
import { generateClarificationQuestions } from './clarificationGenerator';
import { compareReports } from './longitudinalComparator';
import { generateClinicalSummary } from './summaryGenerator';

export interface ProcessPipelineInput {
  patient: PatientIntake;
  currentReportText: string;
  currentReportDate?: string;
  previousReportText?: string;
  previousReportDate?: string;
}

/**
 * MedLens End-to-End Clinical Processing Pipeline
 * Workflow: Input -> Extraction -> Validation -> Normalization -> Analysis -> Insight -> Human Review
 */
export function runMedLensPipeline(input: ProcessPipelineInput): MedicalRecordData {
  const {
    patient,
    currentReportText,
    currentReportDate = new Date().toISOString().split('T')[0],
    previousReportText = '',
    previousReportDate = ''
  } = input;

  const recordId = `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const nowTimestamp = new Date().toISOString();

  // 1. Extraction & Normalization for Current Report
  const currentParameters = extractParametersFromText(currentReportText, 'CURRENT_REPORT');

  // 2. Extraction & Normalization for Previous Report (if provided)
  const previousParameters = previousReportText.trim()
    ? extractParametersFromText(previousReportText, 'PREVIOUS_REPORT')
    : [];

  // 3. Longitudinal Comparison
  const longitudinalComparisons = previousParameters.length > 0
    ? compareReports(currentParameters, previousParameters, currentReportDate, previousReportDate)
    : [];

  // 4. Inconsistency & Conflict Detection
  const conflicts = detectConflicts(
    patient,
    currentParameters,
    previousParameters,
    previousReportText
  );

  // 5. Missing Information & Context-Aware Clarification Questions
  const clarificationQuestions = generateClarificationQuestions(
    patient,
    currentParameters
  );

  // 6. AI Summary Generation (with strict non-diagnostic guardrails)
  const summary = generateClinicalSummary(
    patient,
    currentParameters,
    conflicts,
    clarificationQuestions,
    longitudinalComparisons
  );

  // 7. Initialize Audit Trail
  const auditTrail: AuditLogEntry[] = [
    {
      id: `audit-init-${Date.now()}`,
      timestamp: nowTimestamp,
      author: 'SYSTEM_AI',
      action: 'EXTRACT',
      targetField: 'Entire Record',
      newValue: `Extracted ${currentParameters.length} parameters from Current Report${previousParameters.length > 0 ? ` and ${previousParameters.length} from Previous Report` : ''}.`,
      comment: 'Initial ingestion and extraction pipeline completed.'
    }
  ];

  return {
    id: recordId,
    patient,
    currentReportDate,
    previousReportDate,
    currentReportRawText: currentReportText,
    previousReportRawText: previousReportText,
    currentParameters,
    previousParameters,
    longitudinalComparisons,
    conflicts,
    clarificationQuestions,
    summary,
    auditTrail,
    isVerified: false
  };
}
