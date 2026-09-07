'use client';

import React from 'react';
import { 
  FlaskConical, 
  Search, 
  Filter, 
  Edit3, 
  CheckCircle2, 
  ShieldCheck, 
  FileCheck,
  Download,
  Clock
} from 'lucide-react';
import { MedicalRecordData, LabParameter, TestCategory } from '@/types';

interface StructuredRecordViewProps {
  record: MedicalRecordData;
  onEditParameter: (param: LabParameter) => void;
  onVerifyEntireRecord: () => void;
  onOpenExportModal: () => void;
}

export function StructuredRecordView({
  record,
  onEditParameter,
  onVerifyEntireRecord,
  onOpenExportModal
}: StructuredRecordViewProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterAbnormalOnly, setFilterAbnormalOnly] = React.useState(false);

  // Compute metrics
  const totalParams = record.currentParameters.length;
  const abnormalParams = record.currentParameters.filter(p => p.status === 'LOW' || p.status === 'HIGH' || p.status === 'CRITICAL');
  const criticalParams = record.currentParameters.filter(p => p.status === 'CRITICAL');
  const verifiedParams = record.currentParameters.filter(p => p.isHumanVerified);

  // Categories list
  const categories: TestCategory[] = [
    'Hematology',
    'Metabolic & Electrolytes',
    'Renal Function',
    'Liver Function',
    'Lipid Profile',
    'Endocrine & Thyroid',
    'Inflammatory & Cardiac',
    'Other'
  ];

  // Filtered parameters
  const filteredParameters = record.currentParameters.filter((param) => {
    // Search query filter
    const matchesSearch = 
      param.canonicalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      param.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      param.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Category filter
    if (selectedCategory !== 'ALL' && param.category !== selectedCategory) {
      return false;
    }

    // Abnormal only filter
    if (filterAbnormalOnly && param.status === 'NORMAL') {
      return false;
    }

    return true;
  });

  return (
    <section aria-labelledby="structured-record-heading" className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Action Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <FlaskConical size={22} style={{ color: 'var(--primary)' }} aria-hidden="true" />
          <div>
            <h2 id="structured-record-heading" style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              Structured Clinical Laboratory Record
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Normalized parameters, strictly bounded to source reference intervals with granular provenance.
            </p>
          </div>
        </div>

        {/* Global Record Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {record.isVerified ? (
            <span className="badge-prov prov-verified" style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}>
              <ShieldCheck size={16} aria-hidden="true" /> Record Human-Verified ({record.verifiedBy || 'Clinician'})
            </span>
          ) : (
            <button 
              type="button" 
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
              onClick={onVerifyEntireRecord}
              aria-label="Sign off and verify entire clinical record"
            >
              <FileCheck size={16} style={{ color: '#10b981' }} aria-hidden="true" />
              Sign Off &amp; Verify Record
            </button>
          )}

          <button 
            type="button" 
            className="btn btn-primary"
            style={{ padding: '0.5rem 1.1rem', fontSize: '0.8rem' }}
            onClick={onOpenExportModal}
            aria-label="Export or print clinical health record summary"
          >
            <Download size={15} aria-hidden="true" />
            Export / Print Record
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-title">Extracted Tests</span>
          <span className="kpi-value">{totalParams}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Source: {record.currentReportDate || 'Current Report'}
          </span>
        </div>

        <div className="kpi-card" style={{ borderColor: abnormalParams.length > 0 ? 'rgba(245, 158, 11, 0.4)' : undefined }}>
          <span className="kpi-title">Out of Reference Range</span>
          <span className="kpi-value" style={{ color: abnormalParams.length > 0 ? '#fbbf24' : '#34d399' }}>
            {abnormalParams.length}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Strictly source range bounded
          </span>
        </div>

        <div className="kpi-card" style={{ borderColor: criticalParams.length > 0 ? 'rgba(239, 68, 68, 0.4)' : undefined }}>
          <span className="kpi-title">Critical Panic Alarms</span>
          <span className="kpi-value" style={{ color: criticalParams.length > 0 ? '#f87171' : '#94a3b8' }}>
            {criticalParams.length}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Requires immediate review
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-title">Human Verification</span>
          <span className="kpi-value" style={{ color: verifiedParams.length === totalParams && totalParams > 0 ? '#34d399' : '#38bdf8' }}>
            {verifiedParams.length} / {totalParams}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Fields signed off by clinician
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <label htmlFor="search-lab-tests" className="sr-only">Search laboratory tests</label>
          <Search size={15} aria-hidden="true" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            id="search-lab-tests"
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.2rem', fontSize: '0.8rem' }}
            placeholder="Search laboratory test name, acronym, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label htmlFor="filter-panel-category" className="sr-only">Filter by Clinical Panel</label>
          <Filter size={15} aria-hidden="true" style={{ color: 'var(--text-muted)' }} />
          <select 
            id="filter-panel-category"
            className="form-select"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem', width: 'auto' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="ALL">All Clinical Panels ({record.currentParameters.length})</option>
            {categories.map((cat) => {
              const count = record.currentParameters.filter(p => p.category === cat).length;
              if (count === 0) return null;
              return (
                <option key={cat} value={cat}>
                  {cat} ({count})
                </option>
              );
            })}
          </select>
        </div>

        {/* Abnormal Only Toggle */}
        <label htmlFor="filter-abnormal-only" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          <input 
            id="filter-abnormal-only"
            type="checkbox"
            checked={filterAbnormalOnly}
            onChange={(e) => setFilterAbnormalOnly(e.target.checked)}
            style={{ accentColor: '#f59e0b' }}
          />
          <span>Show Out-of-Range Only</span>
        </label>
      </div>

      {/* Main Extracted Parameters Table */}
      <div className="table-wrapper">
        <table className="med-table" aria-label="Structured Clinical Laboratory Parameters">
          <caption className="sr-only">
            Extracted Clinical Laboratory Parameters with source reference ranges, confidence indicators, and review actions.
          </caption>
          <thead>
            <tr>
              <th scope="col">Investigation / Parameter</th>
              <th scope="col">Observed Result</th>
              <th scope="col">Source Reference Range</th>
              <th scope="col">Status</th>
              <th scope="col">Category Panel</th>
              <th scope="col">Provenance &amp; Confidence</th>
              <th scope="col">Human Review</th>
            </tr>
          </thead>
          <tbody>
            {filteredParameters.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No laboratory parameters matched your current filter criteria.
                </td>
              </tr>
            ) : (
              filteredParameters.map((param) => {
                const isCritical = param.status === 'CRITICAL';
                const isHigh = param.status === 'HIGH';
                const isLow = param.status === 'LOW';
                const isNormal = param.status === 'NORMAL';

                return (
                  <tr key={param.id}>
                    {/* Test Name with Synonyms as Row Header */}
                    <th scope="row" style={{ textAlign: 'left', fontWeight: 'normal', padding: '0.75rem' }}>
                      <div>
                        <span style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '0.9rem' }}>
                          {param.canonicalName}
                        </span>
                        {param.name.toLowerCase() !== param.canonicalName.toLowerCase() && (
                          <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Reported as: &ldquo;{param.name}&rdquo;
                          </span>
                        )}
                      </div>
                    </th>

                    {/* Observed Result with Unit */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                        <span style={{ 
                          fontFamily: 'var(--font-mono)', 
                          fontSize: '1rem', 
                          fontWeight: 800,
                          color: isCritical ? '#f87171' : isHigh ? '#fb7185' : isLow ? '#fbbf24' : 'var(--text-heading)'
                        }}>
                          {param.observedValue}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {param.unit}
                        </span>
                      </div>
                    </td>

                    {/* Reference Range (STRICT: Never invented) */}
                    <td>
                      {param.referenceRange.isSpecified ? (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {param.referenceRange.rawText}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Not provided in source report
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td>
                      <span className={`badge-status ${
                        isCritical ? 'badge-critical' : 
                        isHigh ? 'badge-high' : 
                        isLow ? 'badge-low' : 
                        isNormal ? 'badge-normal' : 
                        'badge-unspecified'
                      }`}>
                        {param.status}
                      </span>
                    </td>

                    {/* Category Panel */}
                    <td>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {param.category}
                      </span>
                    </td>

                    {/* Provenance Tag & Confidence */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span className="badge-prov prov-report" style={{ width: 'fit-content' }}>
                          Source: Current Report
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          Confidence: {param.confidence}
                        </span>
                      </div>
                    </td>

                    {/* Human Review Action Button */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button 
                          type="button" 
                          className="btn btn-outline"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                          onClick={() => onEditParameter(param)}
                          title={`Review or edit ${param.canonicalName}`}
                          aria-label={`Review or edit ${param.canonicalName}, observed value ${param.observedValue} ${param.unit}, status ${param.status}`}
                        >
                          <Edit3 size={13} aria-hidden="true" />
                          {param.isHumanVerified ? 'Verified' : 'Review'}
                        </button>
                        {param.isHumanVerified && (
                          <span title="Verified by clinician" aria-label="Verified by clinician" style={{ display: 'inline-flex', alignItems: 'center' }}>
                            <CheckCircle2 size={16} style={{ color: '#10b981' }} aria-hidden="true" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Audit History Log Footer */}
      {record.auditTrail && record.auditTrail.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={14} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Record Audit Trail ({record.auditTrail.length} Events)
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '140px', overflowY: 'auto' }}>
            {record.auditTrail.map((entry) => (
              <div 
                key={entry.id} 
                style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--text-secondary)', 
                  background: 'var(--bg-input)', 
                  padding: '0.35rem 0.65rem', 
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>
                  <strong>[{entry.action}]</strong> {entry.targetField} — {entry.comment || entry.newValue}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} by {entry.author}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
