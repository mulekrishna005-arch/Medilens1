'use client';

import React from 'react';
import { Edit3, CheckCircle, X, ShieldCheck, AlertCircle } from 'lucide-react';
import { LabParameter, RangeStatus } from '@/types';
import { parseReferenceRange, evaluateReferenceRange } from '@/lib/referenceRangeEvaluator';

interface HumanReviewModalProps {
  parameter: LabParameter | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedParam: LabParameter, comment: string) => void;
}

export function HumanReviewModal({
  parameter,
  isOpen,
  onClose,
  onSave
}: HumanReviewModalProps) {
  if (!isOpen || !parameter) return null;

  const [name, setName] = React.useState(parameter.canonicalName);
  const [value, setValue] = React.useState(String(parameter.observedValue));
  const [unit, setUnit] = React.useState(parameter.unit);
  const [rawRange, setRawRange] = React.useState(parameter.referenceRange.rawText);
  const [comment, setComment] = React.useState('Clinician manual review & parameter verification');
  const [markVerified, setMarkVerified] = React.useState(true);

  const handleSave = () => {
    const parsedRange = parseReferenceRange(rawRange);
    const parsedVal = parseFloat(value);
    const numericObserved = isNaN(parsedVal) ? value : parsedVal;
    const evaluation = evaluateReferenceRange(numericObserved, parsedRange);

    const updated: LabParameter = {
      ...parameter,
      canonicalName: name,
      observedValue: numericObserved,
      unit,
      referenceRange: parsedRange,
      status: evaluation.status,
      confidence: 'HIGH',
      isHumanVerified: markVerified
    };

    onSave(updated, comment);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Edit3 size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Human Verification & Field Editing
            </h3>
          </div>
          <button type="button" className="btn btn-outline" style={{ padding: '0.35rem' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{
          background: 'rgba(234, 179, 8, 0.08)',
          border: '1px solid rgba(234, 179, 8, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem',
          fontSize: '0.78rem',
          color: '#fbbf24',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <ShieldCheck size={16} style={{ flexShrink: 0 }} />
          <span>
            Human-in-the-loop validation ensures AI-extracted metrics are verified before becoming part of the permanent clinical record.
          </span>
        </div>

        {/* Source Anchor Snippet */}
        {parameter.sourceTextSnippet && (
          <div style={{ background: 'var(--bg-input)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Source Report Excerpt:
            </span>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
              "{parameter.sourceTextSnippet}"
            </p>
          </div>
        )}

        {/* Form Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Parameter Canonical Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Observed Value</label>
            <input 
              type="text" 
              className="form-input" 
              value={value} 
              onChange={(e) => setValue(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Measurement Unit</label>
            <input 
              type="text" 
              className="form-input" 
              value={unit} 
              onChange={(e) => setUnit(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Reported Reference Range</label>
            <input 
              type="text" 
              className="form-input" 
              value={rawRange} 
              onChange={(e) => setRawRange(e.target.value)} 
              placeholder="e.g. 13.0 - 17.0 (or leave blank)"
            />
          </div>
        </div>

        {/* Audit Comment */}
        <div className="form-group">
          <label className="form-label">Audit Log Comment / Reason for Edit</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g., Corrected OCR misread digit from source PDF..."
            value={comment} 
            onChange={(e) => setComment(e.target.value)} 
          />
        </div>

        {/* Verification Checkbox */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
          <input 
            type="checkbox" 
            checked={markVerified} 
            onChange={(e) => setMarkVerified(e.target.checked)} 
            style={{ width: 16, height: 16, accentColor: 'var(--primary)' }}
          />
          <span>Mark this laboratory parameter as Human-Verified</span>
        </label>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            <CheckCircle size={15} /> Save & Record Audit Entry
          </button>
        </div>
      </div>
    </div>
  );
}
