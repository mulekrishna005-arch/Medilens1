'use client';

import React from 'react';
import { FileUp, FileText, Calendar, Clock, RotateCcw, Sparkles } from 'lucide-react';

interface ReportUploaderProps {
  currentReportText: string;
  onCurrentReportChange: (text: string) => void;
  currentReportDate: string;
  onCurrentReportDateChange: (date: string) => void;
  previousReportText: string;
  onPreviousReportChange: (text: string) => void;
  previousReportDate: string;
  onPreviousReportDateChange: (date: string) => void;
  onRunPipeline: () => void;
  isProcessing: boolean;
}

export function ReportUploader({
  currentReportText,
  onCurrentReportChange,
  currentReportDate,
  onCurrentReportDateChange,
  previousReportText,
  onPreviousReportChange,
  previousReportDate,
  onPreviousReportDateChange,
  onRunPipeline,
  isProcessing
}: ReportUploaderProps) {
  const [activeTab, setActiveTab] = React.useState<'current' | 'previous'>('current');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'current' | 'previous') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        if (target === 'current') onCurrentReportChange(content);
        else onPreviousReportChange(content);
      }
    };
    reader.readAsText(file);
  };

  const isCurrent = activeTab === 'current';
  const text = isCurrent ? currentReportText : previousReportText;
  const onTextChange = isCurrent ? onCurrentReportChange : onPreviousReportChange;
  const date = isCurrent ? currentReportDate : previousReportDate;
  const onDateChange = isCurrent ? onCurrentReportDateChange : onPreviousReportDateChange;

  return (
    <section aria-labelledby="report-uploader-heading" className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header and Input Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={18} style={{ color: 'var(--primary)' }} aria-hidden="true" />
          <h2 id="report-uploader-heading" style={{ fontSize: '1.1rem', fontWeight: 700 }}>2. Medical &amp; Laboratory Reports</h2>
        </div>

        {/* Tab Toggle for Current vs Previous Report */}
        <div 
          role="tablist"
          aria-label="Medical Report Ingestion Type"
          style={{ display: 'flex', background: 'var(--bg-surface)', padding: '0.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}
        >
          <button 
            id="tab-current-report"
            role="tab"
            aria-selected={isCurrent}
            aria-controls="panel-current-report"
            tabIndex={isCurrent ? 0 : -1}
            type="button" 
            className={`btn ${isCurrent ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }}
            onClick={() => setActiveTab('current')}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                setActiveTab('previous');
                document.getElementById('tab-previous-report')?.focus();
              }
            }}
          >
            Current Report *
          </button>
          <button 
            id="tab-previous-report"
            role="tab"
            aria-selected={!isCurrent}
            aria-controls="panel-previous-report"
            tabIndex={!isCurrent ? 0 : -1}
            type="button" 
            className={`btn ${!isCurrent ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }}
            onClick={() => setActiveTab('previous')}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                setActiveTab('current');
                document.getElementById('tab-current-report')?.focus();
              }
            }}
          >
            Previous Report (Optional) {previousReportText.trim() && '•'}
          </button>
        </div>
      </div>

      {/* Unified Tab Panel Content */}
      <div 
        id={isCurrent ? 'panel-current-report' : 'panel-previous-report'}
        role="tabpanel"
        aria-labelledby={isCurrent ? 'tab-current-report' : 'tab-previous-report'}
        style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className={`badge-prov ${isCurrent ? 'prov-report' : 'prov-previous'}`}>
              {isCurrent ? 'Source: Current Laboratory Document' : 'Source: Prior Report (Longitudinal History)'}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {text.length} characters
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {isCurrent ? <Calendar size={14} aria-hidden="true" style={{ color: 'var(--text-muted)' }} /> : <Clock size={14} aria-hidden="true" style={{ color: 'var(--text-muted)' }} />}
              <label htmlFor={isCurrent ? 'current-report-date-input' : 'previous-report-date-input'} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {isCurrent ? 'Report Date:' : 'Prior Date:'}
              </label>
              <input 
                id={isCurrent ? 'current-report-date-input' : 'previous-report-date-input'}
                type="date" 
                className="form-input" 
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: 'auto' }}
                value={date}
                onChange={(e) => onDateChange(e.target.value)}
              />
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              accept=".txt,.csv,.log,.json" 
              style={{ display: 'none' }}
              aria-label="Upload medical report file"
              onChange={(e) => handleFileUpload(e, activeTab)}
            />
            <button 
              type="button" 
              className="btn btn-outline" 
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              onClick={() => fileInputRef.current?.click()}
              aria-label={isCurrent ? 'Upload report file' : 'Upload previous report file'}
            >
              <FileUp size={14} aria-hidden="true" /> Upload File
            </button>
            {text && (
              <button 
                type="button" 
                className="btn btn-outline" 
                style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                onClick={() => onTextChange('')}
                title={isCurrent ? 'Clear report text' : 'Clear previous report'}
                aria-label={isCurrent ? 'Clear current report text' : 'Clear previous report text'}
              >
                <RotateCcw size={13} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <label htmlFor={isCurrent ? 'current-report-textarea' : 'previous-report-textarea'} className="sr-only">
          {isCurrent ? 'Current clinical or laboratory report text' : 'Previous laboratory report text'}
        </label>
        <textarea 
          id={isCurrent ? 'current-report-textarea' : 'previous-report-textarea'}
          className="form-textarea" 
          placeholder={isCurrent 
            ? 'Paste current clinical or laboratory report text here (including parameter names, values, units, and reference ranges)...'
            : 'Optionally paste a previous laboratory report here to generate automated longitudinal trend arrows (↑ / ↓), percentage shifts, and conflict analysis...'
          }
          rows={7}
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', lineHeight: '1.45' }}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
        />

        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          {isCurrent
            ? 'Tip: MedLens accurately parses tabular values, column gaps, units, and range boundaries. If a reference range is omitted in the source, MedLens preserves safety by leaving it unspecified.'
            : 'Providing a previous report enables feature #10 (Longitudinal Comparison) and deep conflict cross-checks.'
          }
        </p>
      </div>

      {/* Primary Pipeline Action Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
        <button 
          type="button" 
          className="btn btn-primary"
          style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}
          disabled={!currentReportText.trim() || isProcessing}
          onClick={onRunPipeline}
          aria-label="Process and analyze medical record"
          aria-busy={isProcessing}
        >
          {isProcessing ? (
            <>
              <div 
                role="presentation" 
                aria-hidden="true"
                style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} 
              />
              Processing Pipeline...
            </>
          ) : (
            <>
              <Sparkles size={18} aria-hidden="true" />
              Process &amp; Analyze Record
            </>
          )}
        </button>
      </div>
    </section>
  );
}
