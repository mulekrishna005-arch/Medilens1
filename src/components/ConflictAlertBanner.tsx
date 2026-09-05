'use client';

import React from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import { ConflictAlert } from '@/types';

interface ConflictAlertBannerProps {
  conflicts: ConflictAlert[];
  onAcknowledgeConflict: (id: string) => void;
  onResolveConflict: (id: string, note: string) => void;
}

export function ConflictAlertBanner({
  conflicts,
  onAcknowledgeConflict,
  onResolveConflict
}: ConflictAlertBannerProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(conflicts[0]?.id || null);
  const [resolutionInput, setResolutionInput] = React.useState<Record<string, string>>({});

  if (!conflicts || conflicts.length === 0) return null;

  const pendingCount = conflicts.filter(c => c.status === 'PENDING').length;

  return (
    <div 
      className="glass-panel"
      style={{
        padding: '1.25rem',
        borderLeft: '4px solid #ef4444',
        background: 'rgba(239, 68, 68, 0.05)'
      }}
    >
      {/* Alert Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ 
            width: 32, 
            height: 32, 
            borderRadius: '50%', 
            background: 'rgba(239, 68, 68, 0.15)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#ef4444' 
          }}>
            <ShieldAlert size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f87171' }}>
              Potential Clinical Contradictions Detected ({conflicts.length})
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              MedLens flags discrepancies across data sources for clinician clarification rather than choosing which is correct.
            </p>
          </div>
        </div>

        <span className="badge-status badge-critical" style={{ fontSize: '0.72rem' }}>
          {pendingCount} Pending Clarification
        </span>
      </div>

      {/* List of Conflicts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {conflicts.map((conflict) => {
          const isExpanded = expandedId === conflict.id;
          const isPending = conflict.status === 'PENDING';

          return (
            <div 
              key={conflict.id}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                opacity: isPending ? 1 : 0.8
              }}
            >
              <div 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                onClick={() => setExpandedId(isExpanded ? null : conflict.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle 
                    size={16} 
                    style={{ color: conflict.severity === 'HIGH' ? '#ef4444' : '#f59e0b' }} 
                  />
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-heading)' }}>
                    {conflict.title}
                  </span>
                  <span 
                    className="badge-status"
                    style={{ 
                      fontSize: '0.65rem', 
                      background: isPending ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: isPending ? '#f87171' : '#34d399',
                      border: `1px solid ${isPending ? '#ef4444' : '#10b981'}`
                    }}
                  >
                    {conflict.status}
                  </span>
                </div>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>

              {/* Collapsible Detail */}
              {isExpanded && (
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                    {conflict.description}
                  </p>

                  {/* Side-by-Side Contradicting Sources */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                        Source A: {conflict.sourceA.source}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                        "{conflict.sourceA.detail}"
                      </div>
                    </div>

                    <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '0.75rem' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                        Source B: {conflict.sourceB.source}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                        "{conflict.sourceB.detail}"
                      </div>
                    </div>
                  </div>

                  {/* Resolution Note if resolved */}
                  {conflict.resolutionNote && (
                    <div style={{ fontSize: '0.78rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.1)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
                      <strong>Resolution:</strong> {conflict.resolutionNote}
                    </div>
                  )}

                  {/* Clinician Action Buttons */}
                  {isPending && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                      <input 
                        type="text"
                        className="form-input"
                        placeholder="Add clinician clarification note (e.g., patient confirmed past allergy)..."
                        style={{ flex: 1, minWidth: '220px', fontSize: '0.78rem', padding: '0.4rem 0.6rem' }}
                        value={resolutionInput[conflict.id] || ''}
                        onChange={(e) => setResolutionInput({ ...resolutionInput, [conflict.id]: e.target.value })}
                      />
                      <button 
                        type="button" 
                        className="btn btn-primary"
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
                        onClick={() => {
                          const note = resolutionInput[conflict.id] || 'Clinician reviewed and noted discrepancy for follow-up.';
                          onResolveConflict(conflict.id, note);
                        }}
                      >
                        <CheckCircle size={14} /> Resolve Conflict
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
                        onClick={() => onAcknowledgeConflict(conflict.id)}
                      >
                        Acknowledge
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
