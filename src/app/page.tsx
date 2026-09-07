'use client';

import React, { useState, useCallback, useMemo } from 'react';
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
  Sparkles, 
  Layers, 
  Workflow, 
  RotateCcw 
} from 'lucide-react';

export default function MedLensPage() {
  // 1. Initial State loaded from Scenario 1
  const defaultScenario = DEMO_SCENARIOS[0];

  const [activeScenarioId, setActiveScenarioId] = useState<string>(defaultScenario.id);
  const [intake, setIntake] = useState<PatientIntake>(() => ({
    ...defaultScenario.intake,
    id: `pt-${defaultScenario.id}`,
    createdAt: '2026-09-05T10:00:00.000Z'
  }));

  const [currentReportText, setCurrentReportText] = useState(defaultScenario.currentReportText);
  const [currentReportDate, setCurrentReportDate] = useState(defaultScenario.currentReportDate);
  const [previousReportText, setPreviousReportText] = useState(defaultScenario.previousReportText || '');
  const [previousReportDate, setPreviousReportDate] = useState(defaultScenario.previousReportDate || '');

  // Pre-seed record on initial render via pure lazy initializer
  const [record, setRecord] = useState<MedicalRecordData>(() => {
    const initialPatient: PatientIntake = {
      ...defaultScenario.intake,
      id: `pt-${defaultScenario.id}`,
      createdAt: '2026-09-05T10:00:00.000Z'
    };
    return runMedLensPipeline({
      patient: initialPatient,
      currentReportText: defaultScenario.currentReportText,
      currentReportDate: defaultScenario.currentReportDate,
      previousReportText: defaultScenario.previousReportText || '',
      previousReportDate: defaultScenario.previousReportDate || ''
    });
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [editingParameter, setEditingParameter] = useState<LabParameter | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'record' | 'summary' | 'longitudinal' | 'clarifications'>('record');
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('MedLens Clinical Intelligence ready.');

  const availableTabs = useMemo(() => {
    const tabs: ('record' | 'summary' | 'longitudinal' | 'clarifications')[] = ['record', 'summary'];
    if (record?.longitudinalComparisons && record.longitudinalComparisons.length > 0) tabs.push('longitudinal');
    if (record?.clarificationQuestions && record.clarificationQuestions.length > 0) tabs.push('clarifications');
    return tabs;
  }, [record]);

  const handleTabKeyDown = (e: React.KeyboardEvent, currentTab: typeof activeTab) => {
    const idx = availableTabs.indexOf(currentTab);
    if (idx === -1) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextTab = availableTabs[(idx + 1) % availableTabs.length];
      setActiveTab(nextTab);
      document.getElementById(`tab-${nextTab}`)?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevTab = availableTabs[(idx - 1 + availableTabs.length) % availableTabs.length];
      setActiveTab(prevTab);
      document.getElementById(`tab-${prevTab}`)?.focus();
    }
  };

  // Pipeline Execution engine
  const executePipeline = useCallback((
    currentIntake: PatientIntake,
    cReport: string,
    cDate: string,
    pReport: string = '',
    pDate: string = ''
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
      setLiveAnnouncement(`Analysis complete. Extracted ${processedRecord.currentParameters.length} parameters with ${processedRecord.conflicts.length} conflict alerts.`);
    } catch (err) {
      console.error('Failed to run MedLens pipeline:', err);
      setLiveAnnouncement('Error running clinical analysis pipeline.');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Zero-argument helper to re-run pipeline with current state values
  const handleReanalyze = useCallback(() => {
    executePipeline(
      intake,
      currentReportText,
      currentReportDate,
      previousReportText,
      previousReportDate
    );
  }, [executePipeline, intake, currentReportText, currentReportDate, previousReportText, previousReportDate]);

  // 2. Scenario Switching
  const handleSelectScenario = (scenario: DemoScenario) => {
    setActiveScenarioId(scenario.id);
    const newIntake: PatientIntake = {
      ...scenario.intake,
      id: `pt-${scenario.id}`,
      createdAt: new Date().toISOString()
    };
    setIntake(newIntake);
    setCurrentReportText(scenario.currentReportText);
    setCurrentReportDate(scenario.currentReportDate);
    setPreviousReportText(scenario.previousReportText || '');
    setPreviousReportDate(scenario.previousReportDate || '');
    setLiveAnnouncement(`Loaded scenario: ${scenario.title}`);

    executePipeline(
      newIntake, 
      scenario.currentReportText, 
      scenario.currentReportDate, 
      scenario.previousReportText || '', 
      scenario.previousReportDate || ''
    );
  };

  // Audit log entry creator helper
  const createAuditEntry = (
    action: MedicalRecordData['auditTrail'][0]['action'],
    targetField: string,
    comment: string,
    author: 'CLINICIAN' | 'PATIENT' = 'CLINICIAN',
    extra?: { oldValue?: string; newValue?: string }
  ) => ({
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    author,
    action,
    targetField,
    comment,
    ...extra
  });

  // 4. Human Review & Field Edit
  const handleSaveParameterEdit = (updatedParam: LabParameter, comment: string) => {
    if (!record) return;

    const oldParam = record.currentParameters.find(p => p.id === updatedParam.id);
    const updatedParams = record.currentParameters.map(p => 
      p.id === updatedParam.id ? updatedParam : p
    );

    const auditEntry = createAuditEntry(
      'EDIT_VALUE',
      updatedParam.canonicalName,
      comment,
      'CLINICIAN',
      {
        oldValue: oldParam ? `${oldParam.observedValue} ${oldParam.unit}` : undefined,
        newValue: `${updatedParam.observedValue} ${updatedParam.unit}`
      }
    );

    setRecord({
      ...record,
      currentParameters: updatedParams,
      auditTrail: [auditEntry, ...record.auditTrail]
    });
    setLiveAnnouncement(`Updated parameter: ${updatedParam.canonicalName}`);
  };

  // 5. Conflict Resolution
  const handleAcknowledgeConflict = (conflictId: string) => {
    if (!record) return;
    const updatedConflicts = record.conflicts.map(c => 
      c.id === conflictId ? { ...c, status: 'ACKNOWLEDGED' as const } : c
    );
    const auditEntry = createAuditEntry('RESOLVE_CONFLICT', `Conflict: ${conflictId}`, 'Conflict acknowledged by clinician.');
    setRecord({
      ...record,
      conflicts: updatedConflicts,
      auditTrail: [auditEntry, ...record.auditTrail]
    });
    setLiveAnnouncement('Clinical conflict acknowledged.');
  };

  const handleResolveConflict = (conflictId: string, note: string) => {
    if (!record) return;
    const updatedConflicts = record.conflicts.map(c => 
      c.id === conflictId ? { ...c, status: 'RESOLVED' as const, resolutionNote: note } : c
    );
    const auditEntry = createAuditEntry('RESOLVE_CONFLICT', `Conflict: ${conflictId}`, `Conflict resolved: ${note}`);
    setRecord({
      ...record,
      conflicts: updatedConflicts,
      auditTrail: [auditEntry, ...record.auditTrail]
    });
    setLiveAnnouncement('Clinical conflict marked as resolved.');
  };

  // 6. Clarification Question Answering
  const handleAnswerQuestion = (questionId: string, answer: string) => {
    if (!record) return;
    const updatedQuestions = record.clarificationQuestions.map(q => 
      q.id === questionId ? { ...q, answeredText: answer } : q
    );
    const auditEntry = createAuditEntry('ANSWER_QUESTION', `Question: ${questionId}`, 'Clarification answer provided.', 'PATIENT', { newValue: answer });
    setRecord({
      ...record,
      clarificationQuestions: updatedQuestions,
      auditTrail: [auditEntry, ...record.auditTrail]
    });
    setLiveAnnouncement('Clarification answer recorded.');
  };

  // 7. Full Record Sign-Off & Verification
  const handleVerifyEntireRecord = () => {
    if (!record) return;
    const verifiedParams = record.currentParameters.map(p => ({ ...p, isHumanVerified: true }));
    const auditEntry = createAuditEntry('VERIFY_RECORD', 'Complete Medical Record', 'Clinician officially reviewed and signed off on all extracted parameters.');
    setRecord({
      ...record,
      isVerified: true,
      verifiedAt: new Date().toISOString(),
      verifiedBy: 'Dr. Clinician, MD',
      currentParameters: verifiedParams,
      auditTrail: [auditEntry, ...record.auditTrail]
    });
    setLiveAnnouncement('Medical record officially verified and signed off.');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: '4rem' }}>
      {/* Accessible Skip to Content Link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Screen Reader Live Region for Pipeline Status and Interactive Actions */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {isProcessing ? 'Processing clinical intelligence pipeline...' : liveAnnouncement}
      </div>

      {/* Top Application Header */}
      <Header 
        onSelectScenario={handleSelectScenario}
        activeScenarioId={activeScenarioId}
        isVerified={record?.isVerified}
      />

      {/* Hero / Pipeline Status Bar */}
      <section 
        aria-label="Clinical Intelligence Pipeline Summary"
        style={{ background: 'linear-gradient(180deg, rgba(6, 182, 212, 0.08) 0%, transparent 100%)', borderBottom: '1px solid var(--border-subtle)', padding: '1.25rem 0' }}
      >
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
                onClick={handleReanalyze}
                disabled={isProcessing}
                title="Re-run pipeline analysis"
                aria-label="Re-analyze current clinical documents"
              >
                <RotateCcw size={14} aria-hidden="true" /> Re-analyze
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                onClick={() => setIsExportOpen(true)}
                disabled={!record}
                aria-label="Export clinical health summary"
              >
                <FileSpreadsheet size={15} aria-hidden="true" /> Export Health Summary
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid Content Landmark */}
      <main id="main-content" tabIndex={-1} className="med-container" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', outline: 'none' }}>
        
        {/* Row 1: Intake & Report Ingestion (Side-by-Side) */}
        <section aria-label="Patient Intake and Medical Report Inputs" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
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
            onRunPipeline={handleReanalyze}
            isProcessing={isProcessing}
          />
        </section>

        {/* Row 2: Conflict Alerts Banner (if any detected) */}
        {record && record.conflicts && record.conflicts.length > 0 && (
          <section aria-label="Clinical Conflict Alerts">
            <ConflictAlertBanner 
              conflicts={record.conflicts}
              onAcknowledgeConflict={handleAcknowledgeConflict}
              onResolveConflict={handleResolveConflict}
            />
          </section>
        )}

        {/* Row 3: Result Tabs & Navigation */}
        {record && (
          <section aria-label="Structured Clinical Findings" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div 
              role="tablist" 
              aria-label="Clinical Findings Views"
              style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}
            >
              {[
                { id: 'record', label: `Structured Record (${record.currentParameters.length})`, icon: <Layers size={15} aria-hidden="true" />, show: true },
                { id: 'summary', label: 'AI Patient Summary', icon: <Sparkles size={15} aria-hidden="true" />, show: true },
                { id: 'longitudinal', label: `Longitudinal Comparison (${record.longitudinalComparisons?.length || 0})`, icon: <Workflow size={15} aria-hidden="true" />, show: Boolean(record.longitudinalComparisons && record.longitudinalComparisons.length > 0) },
                { id: 'clarifications', label: `Clarification Inquiries (${record.clarificationQuestions?.length || 0})`, show: Boolean(record.clarificationQuestions && record.clarificationQuestions.length > 0) },
              ].filter(t => t.show).map(tab => (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  type="button"
                  className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '0.85rem', padding: '0.5rem 1.1rem' }}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  onKeyDown={(e) => handleTabKeyDown(e, tab.id as typeof activeTab)}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Active Tab View Panels */}
            {activeTab === 'record' && (
              <div id="panel-record" role="tabpanel" aria-labelledby="tab-record">
                <StructuredRecordView 
                  record={record}
                  onEditParameter={(p) => setEditingParameter(p)}
                  onVerifyEntireRecord={handleVerifyEntireRecord}
                  onOpenExportModal={() => setIsExportOpen(true)}
                />
              </div>
            )}

            {activeTab === 'summary' && (
              <div id="panel-summary" role="tabpanel" aria-labelledby="tab-summary">
                <PatientSummaryCard summary={record.summary} />
              </div>
            )}

            {activeTab === 'longitudinal' && record.longitudinalComparisons && (
              <div id="panel-longitudinal" role="tabpanel" aria-labelledby="tab-longitudinal">
                <LongitudinalComparisonView 
                  comparisons={record.longitudinalComparisons}
                  currentDate={record.currentReportDate}
                  previousDate={record.previousReportDate}
                />
              </div>
            )}

            {activeTab === 'clarifications' && (
              <div id="panel-clarifications" role="tabpanel" aria-labelledby="tab-clarifications">
                <ClarificationQuestionsCard 
                  questions={record.clarificationQuestions}
                  onAnswerQuestion={handleAnswerQuestion}
                />
              </div>
            )}
          </section>
        )}
      </main>

      {/* Accessible Footer Landmark */}
      <footer 
        role="contentinfo"
        aria-label="MedLens System and Accessibility Information"
        style={{
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          padding: '2rem 0',
          marginTop: '3rem',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}
      >
        <div className="med-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '0.9rem' }}>
                MedLens — AI-Powered Clinical Information Intelligence
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Structured • Traceable • Reference-Range Aware • Human-Reviewable
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', flexWrap: 'wrap' }}>
              <span className="badge-prov prov-verified" style={{ fontSize: '0.7rem' }}>
                WCAG 2.1 AA/AAA Accessible
              </span>
              <span>Screen Reader Optimized</span>
              <span>Full Keyboard Navigation</span>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <p>
              <strong>Safety Notice:</strong> MedLens is an information organization tool. It is not a diagnostic system and does not replace qualified healthcare providers.
            </p>
            <p>
              Navigation: <kbd style={{ padding: '0.15rem 0.35rem', background: 'var(--bg-input)', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>Tab</kbd> to focus, <kbd style={{ padding: '0.15rem 0.35rem', background: 'var(--bg-input)', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>←</kbd> / <kbd style={{ padding: '0.15rem 0.35rem', background: 'var(--bg-input)', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>→</kbd> to switch tabs, <kbd style={{ padding: '0.15rem 0.35rem', background: 'var(--bg-input)', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>Esc</kbd> to close dialogs.
            </p>
          </div>
        </div>
      </footer>

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
