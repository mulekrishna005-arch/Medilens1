'use client';

import React from 'react';
import { Download, Printer, X, ShieldCheck } from 'lucide-react';
import { MedicalRecordData } from '@/types';

interface ExportModalProps {
  record: MedicalRecordData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ExportModal({ record, isOpen, onClose }: ExportModalProps) {
  if (!isOpen || !record) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '840px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Controls (Hidden in Print) */}
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Exportable Clinical Health Summary
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Standardized summary suitable for clinical chart archiving or physician consultation.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button type="button" className="btn btn-primary" onClick={handlePrint}>
              <Printer size={15} /> Print / Save as PDF
            </button>
            <button type="button" className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* The Printable Clinical Summary Sheet */}
        <div 
          id="printable-summary" 
          style={{
            background: 'white',
            color: '#111827',
            padding: '2rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            fontFamily: 'system-ui, sans-serif'
          }}
        >
          {/* Document Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0891b2', paddingBottom: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0891b2', margin: 0 }}>
                MedLens Clinical Information Summary
              </h1>
              <p style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: '0.2rem' }}>
                Structured Patient Health Record & Diagnostic Laboratory Analysis
              </p>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#4b5563' }}>
              <div><strong>Record ID:</strong> {record.id}</div>
              <div><strong>Generated Date:</strong> {new Date().toLocaleDateString()}</div>
              {record.isVerified && (
                <div style={{ color: '#059669', fontWeight: 700, marginTop: '0.2rem' }}>
                  ✓ Clinician-Verified Record
                </div>
              )}
            </div>
          </div>

          {/* Patient Demographics Box */}
          <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '6px', border: '1px solid #e5e7eb', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', fontSize: '0.82rem' }}>
            <div><strong style={{ color: '#4b5563' }}>Patient Name:</strong> {record.patient.name}</div>
            <div><strong style={{ color: '#4b5563' }}>Age:</strong> {record.patient.age} years</div>
            <div><strong style={{ color: '#4b5563' }}>Biological Sex:</strong> {record.patient.sex}</div>
            <div><strong style={{ color: '#4b5563' }}>Report Date:</strong> {record.currentReportDate || 'Current'}</div>
          </div>

          {/* Clinical Intake Disclosures */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.82rem' }}>
            <div style={{ border: '1px solid #e5e7eb', padding: '0.75rem', borderRadius: '6px' }}>
              <strong style={{ color: '#0891b2', display: 'block', marginBottom: '0.35rem' }}>Reported Symptoms & Concerns:</strong>
              <p>{record.patient.symptoms.length ? record.patient.symptoms.join(', ') : 'None reported'}</p>
              {record.patient.symptomNotes && (
                <p style={{ fontStyle: 'italic', fontSize: '0.75rem', marginTop: '0.25rem', color: '#6b7280' }}>
                  Note: {record.patient.symptomNotes}
                </p>
              )}
            </div>

            <div style={{ border: '1px solid #e5e7eb', padding: '0.75rem', borderRadius: '6px' }}>
              <strong style={{ color: '#0891b2', display: 'block', marginBottom: '0.35rem' }}>Active Medications:</strong>
              {record.patient.currentMedications.length ? (
                <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                  {record.patient.currentMedications.map((m, i) => (
                    <li key={i}>{m.name} {m.dosage} {m.frequency}</li>
                  ))}
                </ul>
              ) : (
                <p>No active medications documented</p>
              )}
            </div>

            <div style={{ border: '1px solid #e5e7eb', padding: '0.75rem', borderRadius: '6px' }}>
              <strong style={{ color: '#dc2626', display: 'block', marginBottom: '0.35rem' }}>Known Allergies:</strong>
              <p>{record.patient.allergies.length ? record.patient.allergies.join(', ') : 'No known drug allergies reported'}</p>
            </div>

            <div style={{ border: '1px solid #e5e7eb', padding: '0.75rem', borderRadius: '6px' }}>
              <strong style={{ color: '#0891b2', display: 'block', marginBottom: '0.35rem' }}>Documented Conditions:</strong>
              <p>{record.patient.existingConditions.length ? record.patient.existingConditions.join(', ') : 'No chronic conditions listed'}</p>
            </div>
          </div>

          {/* Laboratory Findings Table */}
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.25rem' }}>
              Laboratory Findings (Strict Source Reference Ranges)
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px', border: '1px solid #e5e7eb' }}>Investigation</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #e5e7eb' }}>Observed Result</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #e5e7eb' }}>Reference Interval</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #e5e7eb' }}>Status</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #e5e7eb' }}>Verification</th>
                </tr>
              </thead>
              <tbody>
                {record.currentParameters.map((p) => (
                  <tr key={p.id} style={{ background: p.status === 'CRITICAL' ? '#fef2f2' : p.status === 'LOW' ? '#fffbeb' : p.status === 'HIGH' ? '#fff1f2' : 'white' }}>
                    <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb', fontWeight: 600 }}>{p.canonicalName}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb', fontFamily: 'monospace', fontWeight: 700 }}>{p.observedValue} {p.unit}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb', color: '#4b5563' }}>{p.referenceRange.rawText}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb', fontWeight: 700 }}>{p.status}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb', fontSize: '0.72rem' }}>
                      {p.isHumanVerified ? '✓ Verified' : 'AI-Extracted'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* AI Clinical Summary */}
          {record.summary && (
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
              <strong style={{ color: '#0891b2', display: 'block', marginBottom: '0.35rem' }}>
                Key Findings Synthesis (Non-Diagnostic):
              </strong>
              <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                {record.summary.keyFindings.map((f, i) => (
                  <li key={i} style={{ marginBottom: '0.2rem' }}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Sign-off Seal & Disclaimer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: '1rem', marginTop: '1rem', fontSize: '0.72rem', color: '#6b7280' }}>
            <div style={{ maxWidth: '65%' }}>
              <strong>Notice:</strong> MedLens is an information organization tool. It is not a diagnostic system. Always consult a qualified healthcare provider.
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ borderBottom: '1px solid #9ca3af', width: '180px', marginBottom: '4px' }}></div>
              <div>Reviewing Clinician Signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
