'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Clock, Calendar } from 'lucide-react';
import { LongitudinalComparisonItem } from '@/types';

interface LongitudinalComparisonViewProps {
  comparisons: LongitudinalComparisonItem[];
  currentDate?: string;
  previousDate?: string;
}

export function LongitudinalComparisonView({
  comparisons,
  currentDate = 'Current Report',
  previousDate = 'Previous Report'
}: LongitudinalComparisonViewProps) {
  if (!comparisons || comparisons.length === 0) return null;

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header with Dates */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={18} style={{ color: '#c084fc' }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            4. Longitudinal Trajectory & Report Comparison ({comparisons.length} Parameters)
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="badge-prov prov-previous" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Calendar size={12} /> Prior: {previousDate}
          </span>
          <span className="badge-prov prov-report" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Calendar size={12} /> Current: {currentDate}
          </span>
        </div>
      </div>

      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
        Quantitative comparison computed directly from extracted laboratory metrics, showing direction, numeric deltas, and shift in clinical reference status.
      </p>

      {/* Comparison Table */}
      <div className="table-wrapper">
        <table className="med-table">
          <thead>
            <tr>
              <th>Test Parameter</th>
              <th>Previous Result</th>
              <th>Current Result</th>
              <th>Absolute Delta</th>
              <th>% Shift</th>
              <th>Trend</th>
              <th>Clinical Trajectory Observation</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((item) => {
              const isIncrease = item.trend === 'INCREASED';
              const isDecrease = item.trend === 'DECREASED';
              const isStable = item.trend === 'STABLE';

              return (
                <tr key={item.parameterId}>
                  <td style={{ fontWeight: 700, color: 'var(--text-heading)' }}>
                    {item.canonicalName}
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {item.previousValue} {item.unit}
                      </span>
                      <span className={`badge-status ${item.previousStatus === 'NORMAL' ? 'badge-normal' : item.previousStatus === 'LOW' ? 'badge-low' : 'badge-high'}`} style={{ fontSize: '0.62rem' }}>
                        {item.previousStatus}
                      </span>
                    </div>
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-heading)' }}>
                        {item.currentValue} {item.unit}
                      </span>
                      <span className={`badge-status ${item.currentStatus === 'NORMAL' ? 'badge-normal' : item.currentStatus === 'LOW' ? 'badge-low' : 'badge-high'}`} style={{ fontSize: '0.62rem' }}>
                        {item.currentStatus}
                      </span>
                    </div>
                  </td>

                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    {item.numericDelta !== null && item.numericDelta !== undefined ? (
                      <span style={{ color: isIncrease ? '#fb7185' : isDecrease ? '#38bdf8' : 'var(--text-muted)' }}>
                        {item.numericDelta > 0 ? `+${item.numericDelta}` : item.numericDelta} {item.unit}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>

                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    {item.percentageChange !== null && item.percentageChange !== undefined ? (
                      <span style={{ fontWeight: 600, color: isIncrease ? '#fb7185' : isDecrease ? '#38bdf8' : 'var(--text-muted)' }}>
                        {item.percentageChange > 0 ? `+${item.percentageChange}%` : `${item.percentageChange}%`}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>

                  <td>
                    {isIncrease && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: '#fb7185', fontWeight: 700, fontSize: '0.8rem' }}>
                        <TrendingUp size={14} /> Increased
                      </span>
                    )}
                    {isDecrease && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: '#38bdf8', fontWeight: 700, fontSize: '0.8rem' }}>
                        <TrendingDown size={14} /> Decreased
                      </span>
                    )}
                    {isStable && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: '#34d399', fontWeight: 600, fontSize: '0.8rem' }}>
                        <Minus size={14} /> Stable
                      </span>
                    )}
                  </td>

                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {item.clinicalObservation}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
