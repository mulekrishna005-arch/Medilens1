'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { IntakeForm } from '@/components/IntakeForm';
import { ReportUploader } from '@/components/ReportUploader';
import { StructuredRecordView } from '@/components/StructuredRecordView';
import { LongitudinalComparisonView } from '@/components/LongitudinalComparisonView';
import { ConflictAlertBanner } from '@/components/ConflictAlertBanner';
import { ClarificationQuestionsCard } from '@/components/ClarificationQuestionsCard';
import { PatientSummaryCard } from '@/components/PatientSummaryCard';
import { HumanReviewModal } from '@/components/HumanReviewModal';
import { ExportModal } from '@/components/ExportModal';

import { PatientIntake, MedicalRecordData, LabParameter, DemoScenario } from '@/types';
import { DEMO_SCENARIOS } from '@/lib/demoScenarios';
import { runMedLensPipeline } from '@/lib/pipeline';
import { 
  FileSpreadsheet, 
  ArrowRight, 
  CheckCircle, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Workflow, 
  RotateCcw 
} from 'lucide-react';

export default function MedLensPage() {
  // 1. Initial State loaded from Scenario 1
  const defaultScenario = DEMO_SCENARIOS[0];

  const [activeScenarioId, setActiveScenarioId] = useState<string>(defaultScenario.id);
  const [intake, setIntake] = useState<PatientIntake>({
    ...defaultScenario.intake,
    id: `pt-${Date.now()}`,
    createdAt: new Date().toISOString()
  });

  const [currentReportText, setCurrentReportText] = useState(defaultScenario.currentReportText);
  const [currentReportDate, setCurrentReportDate] = useState(defaultScenario.currentReportDate);
  const [previousReportText, setPreviousReportText] = useState(defaultScenario.previousReportText || '');
  const [previousReportDate, setPreviousReportDate] = useState(defaultScenario.previousReportDate || '');

  const [record, setRecord] = useState<MedicalRecordData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingParameter, setEditingParameter] = useState<LabParameter | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'record' | 'summary' | 'longitudinal' | 'clarifications'>('record');

  // Load and execute initial pipeline on mount for immediate wow factor
  useEffect(() => {
    const initialPatient: PatientIntake = {
      ...defaultScenario.intake,
      id: `pt-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    executePipeline(initialPatient, defaultScenario.currentReportText, defaultScenario.currentReportDate, defaultScenario.previousReportText, defaultScenario.previousReportDate);
  }, []);

  // 2. Scenario Switching
  const handleSelectScenario = (scenario: DemoScenario) => {
    setActiveScenarioId(scenario.id);
    const newIntake: PatientIntake = {
      ...scenario.intake,
      id: `pt-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setIntake(newIntake);
    setCurrentReportText(scenario.currentReportText);
    setCurrentReportDate(scenario.currentReportDate);
    setPreviousReportText(scenario.previousReportText || '');
    setPreviousReportDate(scenario.previousReportDate || '');

    executePipeline(
      newIntake, 
      scenario.currentReportText, 
      scenario.currentReportDate, 
      scenario.previousReportText || '', 
      scenario.previousReportDate || ''
    );
  };

  // 3. Pipeline Execution
  const executePipeline = (
    currentIntake: PatientIntake = intake,
    cReport: string = currentReportText,
    cDate: string = currentReportDate,
    pReport: string = previousReportText,
    pDate: string = previousReportDate
  ) => {
    setIsProcessing(true);
    try {
      const processedRecord = runMedLensPipeline({
        patient: currentIntake,
        currentReportText: cReport,
        currentReportDate: cDate,
        previousReportText: pReport,
        previousReportDate: pDate
      });
      setRecord(processedRecord);
    } catch (err) {
      console.error('Failed to run MedLens pipeline:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Human Review & Field Edit
  const handleSaveParameterEdit = (updatedParam: LabParameter, comment: string) => {
    if (!record) return;

    const oldParam = record.currentParameters.find(p => p.id === updatedParam.id);
    const updatedParams = record.currentParameters.map(p => 
      p.id === updatedParam.id ? updatedParam : p
    );

    const auditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      author: 'CLINICIAN' as const,
      action: 'EDIT_VALUE' as const,
      targetField: updatedParam.canonicalName,
      oldValue: oldParam ? `${oldParam.observedValue} ${oldParam.unit}` : undefined,
      newValue: `${updatedParam.observedValue} ${updatedParam.unit}`,
      comment
    };

    setRecord({
      ...record,
      currentParameters: updatedParams,
      auditTrail: [auditEntry, ...record.auditTrail]
    });
  };

  // 5. Conflict Resolution
  const handleAcknowledgeConflict = (conflictId: string) => {
    if (!record) return;
    const updatedConflicts = record.conflicts.map(c => 
      c.id === conflictId ? { ...c, status: 'ACKNOWLEDGED' as const } : c
    );
    const auditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      author: 'CLINICIAN' as const,
      action: 'RESOLVE_CONFLICT' as const,
      targetField: `Conflict: ${conflictId}`,
      comment: 'Conflict acknowledged by clinician.'
    };
    setRecord({
      ...record,
      conflicts: updatedConflicts,
      auditTrail: [auditEntry, ...record.auditTrail]
    });
  };

  const handleResolveConflict = (conflictId: string, note: string) => {
    if (!record) return;
    const updatedConflicts = record.conflicts.map(c => 
      c.id === conflictId ? { ...c, status: 'RESOLVED' as const, resolutionNote: note } : c
    );
    const auditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      author: 'CLINICIAN' as const,
      action: 'RESOLVE_CONFLICT' as const,
      targetField: `Conflict: ${conflictId}`,
      comment: `Conflict resolved: ${note}`
    };
    setRecord({
      ...record,
      conflicts: updatedConflicts,
      auditTrail: [auditEntry, ...record.auditTrail]
    });
  };

  // 6. Clarification Question Answering
  const handleAnswerQuestion = (questionId: string, answer: string) => {
    if (!record) return;
    const updatedQuestions = record.clarificationQuestions.map(q => 
      q.id === questionId ? { ...q, answeredText: answer } : q
    );
    const auditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      author: 'PATIENT' as const,
      action: 'ANSWER_QUESTION' as const,
      targetField: `Question: ${questionId}`,
      newValue: answer,
      comment: 'Clarification answer provided.'
    };
    setRecord({
      ...record,
      clarificationQuestions: updatedQuestions,
      auditTrail: [auditEntry, ...record.auditTrail]
    });
  };

  // 7. Full Record Sign-Off & Verification
  const handleVerifyEntireRecord = () => {
    if (!record) return;
    const verifiedParams = record.currentParameters.map(p => ({ ...p, isHumanVerified: true }));
    const auditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      author: 'CLINICIAN' as const,
      action: 'VERIFY_RECORD' as const,
      targetField: 'Complete Medical Record',
      comment: 'Clinician officially reviewed and signed off on all extracted parameters.'
    };
    setRecord({
      ...record,
      isVerified: true,
      verifiedAt: new Date().toISOString(),
      verifiedBy: 'Dr. Clinician, MD',
      currentParameters: verifiedParams,
      auditTrail: [auditEntry, ...record.auditTrail]
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: '4rem' }}>
      {/* Top Application Header */}
      <Header 
        onSelectScenario={handleSelectScenario}
        activeScenarioId={activeScenarioId}
        isVerified={record?.isVerified}
      />

      {/* Hero / Pipeline Status Bar */}
      <div style={{ background: 'linear-gradient(180deg, rgba(6, 182, 212, 0.08) 0%, transparent 100%)', borderBottom: '1px solid var(--border-subtle)', padding: '1.25rem 0' }}>
        <div className="med-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge-prov prov-ai" style={{ fontSize: '0.72rem' }}>
                  Workflow: Input → Extraction → Validation → Normalization → Analysis → Insight → Review
                </span>
                <span className="badge-prov prov-intake" style={{ fontSize: '0.72rem' }}>
                  Patient: {intake.name} ({intake.age}y, {intake.sex})
                </span>
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '0.25rem' }}>
                Clinical Information Intelligence Dashboard
              </h2>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
                onClick={() => executePipeline()}
                disabled={isProcessing}
                title="Re-run pipeline analysis"
              >
                <RotateCcw size={14} /> Re-analyze
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                onClick={() => setIsExportOpen(true)}
                disabled={!record}
              >
                <FileSpreadsheet size={15} /> Export Health Summary
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <main className="med-container" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Row 1: Intake & Report Ingestion (Side-by-Side) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
          {/* 1. Patient Intake Form */}
          <IntakeForm intake={intake} onChange={setIntake} />

          {/* 2. Medical Report Processing & Upload */}
          <ReportUploader 
            currentReportText={currentReportText}
            onCurrentReportChange={setCurrentReportText}
            currentReportDate={currentReportDate}
            onCurrentReportDateChange={setCurrentReportDate}
            previousReportText={previousReportText}
            onPreviousReportChange={setPreviousReportText}
            previousReportDate={previousReportDate}
            onPreviousReportDateChange={setPreviousReportDate}
            onRunPipeline={() => executePipeline()}
            isProcessing={isProcessing}
          />
        </div>

        {/* Row 2: Conflict Alerts Banner (if any detected) */}
        {record && record.conflicts && record.conflicts.length > 0 && (
          <ConflictAlertBanner 
            conflicts={record.conflicts}
            onAcknowledgeConflict={handleAcknowledgeConflict}
            onResolveConflict={handleResolveConflict}
          />
        )}

        {/* Row 3: Result Tabs & Navigation */}
        {record && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
              <button 
                type="button"
                className={`btn ${activeTab === 'record' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1.1rem' }}
                onClick={() => setActiveTab('record')}
              >
                <Layers size={15} /> Structured Record ({record.currentParameters.length})
              </button>
              <button 
                type="button"
                className={`btn ${activeTab === 'summary' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1.1rem' }}
                onClick={() => setActiveTab('summary')}
              >
                <Sparkles size={15} /> AI Patient Summary
              </button>
              {record.longitudinalComparisons && record.longitudinalComparisons.length > 0 && (
                <button 
                  type="button"
                  className={`btn ${activeTab === 'longitudinal' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '0.85rem', padding: '0.5rem 1.1rem' }}
                  onClick={() => setActiveTab('longitudinal')}
                >
                  <Workflow size={15} /> Longitudinal Comparison ({record.longitudinalComparisons.length})
                </button>
              )}
              {record.clarificationQuestions && record.clarificationQuestions.length > 0 && (
                <button 
                  type="button"
                  className={`btn ${activeTab === 'clarifications' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '0.85rem', padding: '0.5rem 1.1rem' }}
                  onClick={() => setActiveTab('clarifications')}
                >
                  Clarification Inquiries ({record.clarificationQuestions.length})
                </button>
              )}
            </div>

            {/* Active Tab View */}
            {activeTab === 'record' && (
              <StructuredRecordView 
                record={record}
                onEditParameter={(p) => setEditingParameter(p)}
                onVerifyEntireRecord={handleVerifyEntireRecord}
                onOpenExportModal={() => setIsExportOpen(true)}
              />
            )}

            {activeTab === 'summary' && (
              <PatientSummaryCard summary={record.summary} />
            )}

            {activeTab === 'longitudinal' && record.longitudinalComparisons && (
              <LongitudinalComparisonView 
                comparisons={record.longitudinalComparisons}
                currentDate={record.currentReportDate}
                previousDate={record.previousReportDate}
              />
            )}

            {activeTab === 'clarifications' && (
              <ClarificationQuestionsCard 
                questions={record.clarificationQuestions}
                onAnswerQuestion={handleAnswerQuestion}
              />
            )}
          </div>
        )}
      </main>

      {/* Human Review Modal Dialog */}
      <HumanReviewModal 
        parameter={editingParameter}
        isOpen={Boolean(editingParameter)}
        onClose={() => setEditingParameter(null)}
        onSave={handleSaveParameterEdit}
      />

      {/* Export / Print Summary Modal */}
      <ExportModal 
        record={record}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
}
