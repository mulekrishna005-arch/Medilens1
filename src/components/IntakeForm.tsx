'use client';

import React from 'react';
import { User, Plus, Trash2, HeartPulse, AlertCircle, Pill, FileText } from 'lucide-react';
import { PatientIntake, BiologicalSex } from '@/types';

interface IntakeFormProps {
  intake: PatientIntake;
  onChange: (updated: PatientIntake) => void;
}

export function IntakeForm({ intake, onChange }: IntakeFormProps) {
  // Helpers to update individual intake fields
  const updateField = <K extends keyof PatientIntake>(field: K, value: PatientIntake[K]) => {
    onChange({ ...intake, [field]: value });
  };

  // Symptom handling
  const [symptomInput, setSymptomInput] = React.useState('');
  const addSymptom = () => {
    if (symptomInput.trim() && !intake.symptoms.includes(symptomInput.trim())) {
      updateField('symptoms', [...intake.symptoms, symptomInput.trim()]);
      setSymptomInput('');
    }
  };
  const removeSymptom = (idx: number) => {
    updateField('symptoms', intake.symptoms.filter((_, i) => i !== idx));
  };

  // Condition handling
  const [conditionInput, setConditionInput] = React.useState('');
  const addCondition = () => {
    if (conditionInput.trim() && !intake.existingConditions.includes(conditionInput.trim())) {
      updateField('existingConditions', [...intake.existingConditions, conditionInput.trim()]);
      setConditionInput('');
    }
  };
  const removeCondition = (idx: number) => {
    updateField('existingConditions', intake.existingConditions.filter((_, i) => i !== idx));
  };

  // Allergy handling
  const [allergyInput, setAllergyInput] = React.useState('');
  const addAllergy = () => {
    if (allergyInput.trim() && !intake.allergies.includes(allergyInput.trim())) {
      updateField('allergies', [...intake.allergies, allergyInput.trim()]);
      setAllergyInput('');
    }
  };
  const removeAllergy = (idx: number) => {
    updateField('allergies', intake.allergies.filter((_, i) => i !== idx));
  };

  // Medication handling
  const addMedication = () => {
    updateField('currentMedications', [
      ...intake.currentMedications,
      { name: '', dosage: '', frequency: '' }
    ]);
  };
  const updateMedication = (index: number, key: 'name' | 'dosage' | 'frequency', val: string) => {
    const updatedMeds = [...intake.currentMedications];
    updatedMeds[index] = { ...updatedMeds[index], [key]: val };
    updateField('currentMedications', updatedMeds);
  };
  const removeMedication = (index: number) => {
    updateField('currentMedications', intake.currentMedications.filter((_, i) => i !== index));
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header with Provenance Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={18} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>1. Patient Information Intake</h2>
        </div>
        <span className="badge-prov prov-intake" title="All information in this card is self-reported by the patient">
          Source: Patient Intake
        </span>
      </div>

      {/* Demographics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="patient-name">Patient Name / Identifier *</label>
          <input 
            id="patient-name"
            type="text"
            className="form-input"
            placeholder="e.g., Sarah Jenkins"
            value={intake.name}
            onChange={(e) => updateField('name', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="patient-age">Age (Years) *</label>
          <input 
            id="patient-age"
            type="number"
            className="form-input"
            placeholder="e.g., 34"
            value={intake.age || ''}
            onChange={(e) => updateField('age', e.target.value ? parseInt(e.target.value) : '')}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="patient-sex">Biological Sex *</label>
          <select 
            id="patient-sex"
            className="form-select"
            value={intake.sex}
            onChange={(e) => updateField('sex', e.target.value as BiologicalSex)}
          >
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
            <option value="unspecified">Unspecified</option>
          </select>
        </div>
      </div>

      {/* Symptoms & Chief Concerns */}
      <div className="form-group">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <HeartPulse size={14} style={{ color: '#f43f5e' }} /> Symptoms & Chief Concerns
          </label>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Press Enter to add</span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text"
            className="form-input"
            placeholder="e.g., Persistent fatigue, cold sensitivity..."
            value={symptomInput}
            onChange={(e) => setSymptomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSymptom();
              }
            }}
          />
          <button type="button" className="btn btn-secondary" onClick={addSymptom}>
            <Plus size={16} /> Add
          </button>
        </div>

        {intake.symptoms.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
            {intake.symptoms.map((symptom, i) => (
              <span 
                key={i} 
                className="badge-prov prov-intake"
                style={{ padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {symptom}
                <Trash2 
                  size={12} 
                  style={{ cursor: 'pointer', opacity: 0.7 }} 
                  onClick={() => removeSymptom(i)} 
                />
              </span>
            ))}
          </div>
        )}

        <input 
          type="text"
          className="form-input"
          placeholder="Optional symptom progression notes (e.g., worsened over 6 weeks)..."
          style={{ fontSize: '0.8rem', marginTop: '0.35rem' }}
          value={intake.symptomNotes || ''}
          onChange={(e) => updateField('symptomNotes', e.target.value)}
        />
      </div>

      {/* Conditions & Known Allergies Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {/* Existing Medical Conditions */}
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <FileText size={14} style={{ color: 'var(--primary)' }} /> Existing Medical Conditions
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text"
              className="form-input"
              placeholder="e.g., Menorrhagia, Hypertension..."
              value={conditionInput}
              onChange={(e) => setConditionInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCondition();
                }
              }}
            />
            <button type="button" className="btn btn-secondary" onClick={addCondition}>
              <Plus size={16} />
            </button>
          </div>
          {intake.existingConditions.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
              {intake.existingConditions.map((cond, i) => (
                <span key={i} className="badge-prov prov-intake" style={{ padding: '0.25rem 0.5rem' }}>
                  {cond}
                  <Trash2 size={11} style={{ cursor: 'pointer', marginLeft: '0.35rem' }} onClick={() => removeCondition(i)} />
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Known Allergies */}
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <AlertCircle size={14} style={{ color: '#f59e0b' }} /> Known Allergies
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text"
              className="form-input"
              placeholder="e.g., Penicillin, Sulfa, Latex (or leave blank if none)..."
              value={allergyInput}
              onChange={(e) => setAllergyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addAllergy();
                }
              }}
            />
            <button type="button" className="btn btn-secondary" onClick={addAllergy}>
              <Plus size={16} />
            </button>
          </div>
          {intake.allergies.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
              {intake.allergies.map((allergy, i) => (
                <span key={i} className="badge-prov prov-intake" style={{ padding: '0.25rem 0.5rem', borderColor: '#f59e0b', color: '#fbbf24' }}>
                  {allergy}
                  <Trash2 size={11} style={{ cursor: 'pointer', marginLeft: '0.35rem' }} onClick={() => removeAllergy(i)} />
                </span>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.25rem' }}>
              No drug/food allergies specified in intake form.
            </span>
          )}
        </div>
      </div>

      {/* Current Medications */}
      <div className="form-group">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Pill size={14} style={{ color: '#818cf8' }} /> Current Medications & Supplements
          </label>
          <button type="button" className="btn btn-outline" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }} onClick={addMedication}>
            <Plus size={14} /> Add Medication
          </button>
        </div>

        {intake.currentMedications.length === 0 ? (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No current active medications reported.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {intake.currentMedications.map((med, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '2fr 1fr 1.5fr auto', 
                  gap: '0.5rem', 
                  alignItems: 'center',
                  background: 'var(--bg-input)',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Medication name (e.g. Metformin)" 
                  value={med.name} 
                  onChange={(e) => updateMedication(idx, 'name', e.target.value)} 
                />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Dose (e.g. 1000 mg)" 
                  value={med.dosage || ''} 
                  onChange={(e) => updateMedication(idx, 'dosage', e.target.value)} 
                />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Frequency (e.g. Twice daily)" 
                  value={med.frequency || ''} 
                  onChange={(e) => updateMedication(idx, 'frequency', e.target.value)} 
                />
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ padding: '0.45rem', color: '#f43f5e' }} 
                  onClick={() => removeMedication(idx)}
                  title="Remove medication"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Additional Notes */}
      <div className="form-group">
        <label className="form-label" htmlFor="patient-notes">Additional Patient Notes & Dietary/Lifestyle Context</label>
        <textarea 
          id="patient-notes"
          className="form-textarea"
          placeholder="Any additional lifestyle context (e.g., vegetarian diet, recent travel, family history)..."
          rows={2}
          value={intake.additionalNotes || ''}
          onChange={(e) => updateField('additionalNotes', e.target.value)}
        />
      </div>
    </div>
  );
}
