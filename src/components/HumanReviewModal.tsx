'use client';

import React, { useState } from 'react';
import { Edit3, CheckCircle, X, ShieldCheck } from 'lucide-react';
import { LabParameter } from '@/types';
import { parseReferenceRange, evaluateReferenceRange } from '@/lib/referenceRangeEvaluator';
import { useModalFocusTrap } from './useModalFocusTrap';

interface HumanReviewModalProps {
  parameter: LabParameter | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedParam: LabParameter, comment: string) => void;
}

interface HumanReviewContentProps {
  parameter: LabParameter;
  onClose: () => void;
  onSave: (updatedParam: LabParameter, comment: string) => void;
}

function HumanReviewModalContent({
  parameter,
  onClose,
  onSave
}: HumanReviewContentProps) {
  const [name, setName] = useState(parameter.canonicalName);
  const [value, setValue] = useState(String(parameter.observedValue));
  const [unit, setUnit] = useState(parameter.unit);
  const [rawRange, setRawRange] = useState(parameter.referenceRange.rawText);
  const [comment, setComment] = useState('Clinician manual review & parameter verification');
  const [markVerified, setMarkVerified] = useState(true);

  const modalRef = React.useRef<HTMLDivElement>(null);
  useModalFocusTrap(modalRef, true, onClose);

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
    <div 
      className="modal-overlay" 
      onClick={onClose}
      role="presentation"
    >
      <div 
        ref={modalRef}
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="human-review-title"
        aria-describedby="human-review-desc"
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Edit3 size={20} style={{ color: 'var(--primary)' }} aria-hidden="true" />
            <h3 id="human-review-title" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Human Verification &amp; Field Editing
            </h3>
          </div>
          <button 
            type="button" 
            className="btn btn-outline" 
            style={{ padding: '0.35rem' }} 
            onClick={onClose}
            aria-label="Close human verification dialog"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div 
          id="human-review-desc"
          style={{
            background: 'rgba(234, 179, 8, 0.08)',
            border: '1px solid rgba(234, 179, 8, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem',
            fontSize: '0.78rem',
            color: '#fbbf24',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <ShieldCheck size={16} style={{ flexShrink: 0 }} aria-hidden="true" />
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
              &ldquo;{parameter.sourceTextSnippet}&rdquo;
            </p>
          </div>
        )}

        {/* Form Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="review-param-name">Parameter Canonical Name</label>
            <input 
              id="review-param-name"
              type="text" 
              className="form-input" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="review-observed-val">Observed Value</label>
            <input 
              id="review-observed-val"
              type="text" 
              className="form-input" 
              value={value} 
              onChange={(e) => setValue(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="review-param-unit">Measurement Unit</label>
            <input 
              id="review-param-unit"
              type="text" 
              className="form-input" 
              value={unit} 
              onChange={(e) => setUnit(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="review-ref-range">Reported Reference Range</label>
            <input 
              id="review-ref-range"
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
          <label className="form-label" htmlFor="review-audit-comment">Audit Log Comment / Reason for Edit</label>
          <input 
            id="review-audit-comment"
            type="text" 
            className="form-input" 
            placeholder="e.g., Corrected OCR misread digit from source PDF..."
            value={comment} 
            onChange={(e) => setComment(e.target.value)} 
          />
        </div>

        {/* Verification Checkbox */}
        <label 
          htmlFor="review-mark-verified"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}
        >
          <input 
            id="review-mark-verified"
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
            <CheckCircle size={15} aria-hidden="true" /> Save &amp; Record Audit Entry
          </button>
        </div>
      </div>
    </div>
  );
}

export function HumanReviewModal({
  parameter,
  isOpen,
  onClose,
  onSave
}: HumanReviewModalProps) {
  if (!isOpen || !parameter) return null;

  return (
    <HumanReviewModalContent 
      parameter={parameter}
      onClose={onClose}
      onSave={onSave}
    />
  );
}
