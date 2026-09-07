'use client';

import React from 'react';
import { Sparkles, ShieldAlert, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { AISummary } from '@/types';

interface PatientSummaryCardProps {
  summary: AISummary;
}

export function PatientSummaryCard({ summary }: PatientSummaryCardProps) {
  if (!summary) return null;

  return (
    <section aria-labelledby="patient-summary-heading" className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} style={{ color: 'var(--primary)' }} aria-hidden="true" />
          <h2 id="patient-summary-heading" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            3. Patient-Friendly Clinical Intelligence Summary
          </h2>
        </div>
        <span className="badge-prov prov-ai">
          Source: AI Synthesis (Non-Diagnostic)
        </span>
      </div>

      {/* Key Findings Bullet List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Key Findings Overview
        </h3>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {summary.keyFindings.map((finding, idx) => (
            <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: '1.45' }}>
              <CheckCircle2 size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
              <span>{finding}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Out-of-Range Highlights Grid */}
      {summary.outOfRangeHighlights.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertTriangle size={15} style={{ color: '#f59e0b' }} aria-hidden="true" />
            Values Outside Source Reference Ranges ({summary.outOfRangeHighlights.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {summary.outOfRangeHighlights.map((item, idx) => {
              const isCritical = item.status === 'CRITICAL';
              const isLow = item.status === 'LOW';

              return (
                <div 
                  key={idx}
                  style={{
                    background: 'var(--bg-surface)',
                    border: `1px solid ${isCritical ? '#ef4444' : isLow ? '#f59e0b' : '#f43f5e'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-heading)' }}>
                      {item.parameter}
                    </span>
                    <span className={`badge-status ${isCritical ? 'badge-critical' : isLow ? 'badge-low' : 'badge-high'}`}>
                      {item.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-heading)' }}>
                      {item.valueWithUnit}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      (Reported Range: {item.range})
                    </span>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginTop: '0.2rem' }}>
                    {item.plainExplanation}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* General Observations */}
      {summary.generalObservations.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Info size={14} style={{ color: '#60a5fa' }} aria-hidden="true" />
            Contextual Observations &amp; Reconciliations
          </h3>
          <div style={{ background: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {summary.generalObservations.map((obs, idx) => (
              <p key={idx} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                • {obs}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Strict Non-Diagnostic Guardrail Notice */}
      <aside 
        role="note"
        aria-label="Non-diagnostic safety disclaimer"
        style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.6rem'
        }}
      >
        <ShieldAlert size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
          {summary.disclaimer}
        </p>
      </aside>
    </section>
  );
}
