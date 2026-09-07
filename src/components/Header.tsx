'use client';

import React from 'react';
import { Activity, ShieldAlert, Sparkles, Sun, Moon, FileCheck, Stethoscope } from 'lucide-react';
import { DEMO_SCENARIOS } from '@/lib/demoScenarios';
import { DemoScenario } from '@/types';

interface HeaderProps {
  onSelectScenario: (scenario: DemoScenario) => void;
  activeScenarioId?: string;
  isVerified?: boolean;
}

export function Header({ onSelectScenario, activeScenarioId, isVerified }: HeaderProps) {
  const [theme, setTheme] = React.useState<'dark' | 'light'>('dark');

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <header className="med-header">
      <div className="med-container header-inner">
        {/* Brand Section */}
        <div 
          className="brand-badge" 
          role="button"
          tabIndex={0}
          aria-label="MedLens Clinical Intelligence Home - Scroll to top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        >
          <div className="brand-icon-box">
            <Activity size={24} strokeWidth={2.5} aria-hidden="true" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                Med<span className="gradient-teal">Lens</span>
              </h1>
              <span className="badge-prov prov-ai" style={{ fontSize: '0.65rem' }}>
                <Sparkles size={11} aria-hidden="true" /> Clinical Intelligence
              </span>
              {isVerified && (
                <span className="badge-prov prov-verified" style={{ fontSize: '0.65rem' }}>
                  <FileCheck size={11} aria-hidden="true" /> Verified Record
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '-2px' }}>
              Structured • Traceable • Range-Aware • Human-Reviewable
            </p>
          </div>
        </div>

        {/* Quick Demo Scenarios Selector (1-Click Instant Evaluation) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Stethoscope size={16} aria-hidden="true" style={{ color: 'var(--primary)' }} />
            <label htmlFor="demo-scenarios-select" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Demo Cases:
            </label>
          </div>
          <select 
            id="demo-scenarios-select"
            className="form-select"
            style={{ width: 'auto', minWidth: '220px', padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
            value={activeScenarioId || ''}
            onChange={(e) => {
              const selected = DEMO_SCENARIOS.find(s => s.id === e.target.value);
              if (selected) onSelectScenario(selected);
            }}
          >
            <option value="" disabled>Select Clinical Scenario...</option>
            {DEMO_SCENARIOS.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.badge}: {scenario.title}
              </option>
            ))}
          </select>

          {/* Dark / Light Mode Toggle */}
          <button 
            type="button" 
            className="btn btn-outline"
            style={{ padding: '0.45rem 0.75rem' }}
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Safety Notice Bar */}
      <aside 
        role="note"
        aria-label="Clinical safety notice"
        style={{ 
          background: 'rgba(239, 68, 68, 0.08)', 
          borderTop: '1px solid rgba(239, 68, 68, 0.15)',
          borderBottom: '1px solid rgba(239, 68, 68, 0.15)',
          padding: '0.35rem 0',
          fontSize: '0.72rem',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          marginTop: '0.75rem'
        }}
      >
        <div className="med-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={14} style={{ color: '#ef4444', flexShrink: 0 }} aria-hidden="true" />
          <span>
            <strong>Informational System:</strong> MedLens organizes and standardizes clinical documents. It does not diagnose, prescribe, or replace professional medical consultations.
          </span>
        </div>
      </aside>
    </header>
  );
}
