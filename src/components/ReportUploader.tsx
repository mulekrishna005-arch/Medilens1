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

  // File upload reader for plain text or simulated PDF/OCR ingestion
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'current' | 'previous') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        if (target === 'current') {
          onCurrentReportChange(content);
        } else {
          onPreviousReportChange(content);
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header and Input Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={18} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>2. Medical & Laboratory Reports</h2>
        </div>

        {/* Tab Toggle for Current vs Previous Report */}
        <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: '0.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <button 
            type="button" 
            className={`btn ${activeTab === 'current' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }}
            onClick={() => setActiveTab('current')}
          >
            Current Report *
          </button>
          <button 
            type="button" 
            className={`btn ${activeTab === 'previous' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }}
            onClick={() => setActiveTab('previous')}
          >
            Previous Report (Optional) {previousReportText.trim() && '•'}
          </button>
        </div>
      </div>

      {/* Tab 1: Current Medical Report */}
      {activeTab === 'current' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge-prov prov-report">Source: Current Laboratory Document</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {currentReportText.length} characters
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Report Date:</span>
                <input 
                  type="date" 
                  className="form-input" 
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: 'auto' }}
                  value={currentReportDate}
                  onChange={(e) => onCurrentReportDateChange(e.target.value)}
                />
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                accept=".txt,.csv,.log,.json" 
                style={{ display: 'none' }}
                onChange={(e) => handleFileUpload(e, 'current')}
              />
              <button 
                type="button" 
                className="btn btn-outline" 
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp size={14} /> Upload File
              </button>
              {currentReportText && (
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                  onClick={() => onCurrentReportChange('')}
                  title="Clear report text"
                >
                  <RotateCcw size={13} />
                </button>
              )}
            </div>
          </div>

          <textarea 
            className="form-textarea" 
            placeholder="Paste current clinical or laboratory report text here (including parameter names, values, units, and reference ranges)..."
            rows={7}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', lineHeight: '1.45' }}
            value={currentReportText}
            onChange={(e) => onCurrentReportChange(e.target.value)}
          />

          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            Tip: MedLens accurately parses tabular values, column gaps, units, and range boundaries. If a reference range is omitted in the source, MedLens preserves safety by leaving it unspecified.
          </p>
        </div>
      )}

      {/* Tab 2: Previous Report (Optional) */}
      {activeTab === 'previous' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge-prov prov-previous">Source: Prior Report (Longitudinal History)</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {previousReportText.length} characters
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Prior Date:</span>
                <input 
                  type="date" 
                  className="form-input" 
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: 'auto' }}
                  value={previousReportDate}
                  onChange={(e) => onPreviousReportDateChange(e.target.value)}
                />
              </div>

              <button 
                type="button" 
                className="btn btn-outline" 
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp size={14} /> Upload File
              </button>
              {previousReportText && (
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                  onClick={() => onPreviousReportChange('')}
                  title="Clear previous report"
                >
                  <RotateCcw size={13} />
                </button>
              )}
            </div>
          </div>

          <textarea 
            className="form-textarea" 
            placeholder="Optionally paste a previous laboratory report here to generate automated longitudinal trend arrows (↑ / ↓), percentage shifts, and conflict analysis..."
            rows={7}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', lineHeight: '1.45' }}
            value={previousReportText}
            onChange={(e) => onPreviousReportChange(e.target.value)}
          />

          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Providing a previous report enables feature #10 (Longitudinal Comparison) and deep conflict cross-checks.
          </p>
        </div>
      )}

      {/* Primary Pipeline Action Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
        <button 
          type="button" 
          className="btn btn-primary"
          style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}
          disabled={!currentReportText.trim() || isProcessing}
          onClick={onRunPipeline}
        >
          {isProcessing ? (
            <>
              <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Processing Pipeline...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Process & Analyze Record
            </>
          )}
        </button>
      </div>
    </div>
  );
}
