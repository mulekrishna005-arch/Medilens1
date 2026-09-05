'use client';

import React from 'react';
import { HelpCircle, Check, MessageSquare } from 'lucide-react';
import { ClarificationQuestion } from '@/types';

interface ClarificationQuestionsCardProps {
  questions: ClarificationQuestion[];
  onAnswerQuestion: (id: string, answer: string) => void;
}

export function ClarificationQuestionsCard({
  questions,
  onAnswerQuestion
}: ClarificationQuestionsCardProps) {
  const [answers, setAnswers] = React.useState<Record<string, string>>({});

  if (!questions || questions.length === 0) return null;

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <HelpCircle size={18} style={{ color: '#818cf8' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
            Context-Aware Clarification Questions ({questions.length})
          </h3>
        </div>
        <span className="badge-prov prov-ai" style={{ fontSize: '0.7rem' }}>
          Source: AI Inconsistency Engine
        </span>
      </div>

      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
        These questions are framed as informational inquiries to clarify missing history and fasting/timing variables, <strong>not medical advice</strong>.
      </p>

      {/* List of Questions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {questions.map((q, idx) => {
          const currentAnswer = answers[q.id] || q.answeredText || '';
          const isAnswered = Boolean(q.answeredText);

          return (
            <div 
              key={q.id}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ 
                  width: 22, 
                  height: 22, 
                  borderRadius: '50%', 
                  background: 'rgba(99, 102, 241, 0.15)', 
                  color: '#818cf8',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  {idx + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-heading)' }}>
                    {q.question}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Rationale: {q.rationale}
                  </p>
                </div>
              </div>

              {/* Interactive Answer Box */}
              {isAnswered ? (
                <div style={{ 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  border: '1px solid rgba(16, 185, 129, 0.25)', 
                  borderRadius: 'var(--radius-sm)', 
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.8rem',
                  color: '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Check size={14} />
                  <span><strong>Answered:</strong> {q.answeredText}</span>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="Provide clarification details (e.g. Yes, fasted for 10 hours)..."
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
                    value={currentAnswer}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && currentAnswer.trim()) {
                        e.preventDefault();
                        onAnswerQuestion(q.id, currentAnswer.trim());
                      }
                    }}
                  />
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
                    disabled={!currentAnswer.trim()}
                    onClick={() => onAnswerQuestion(q.id, currentAnswer.trim())}
                  >
                    <MessageSquare size={13} /> Save
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
