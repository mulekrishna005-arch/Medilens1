# MedLens — AI-Powered Clinical Information Intelligence & Patient Intake System

**MedLens** is an AI-powered clinical information intelligence web application designed to transform fragmented medical documents (patient history, prescriptions, laboratory reports, and previous records) into a structured, understandable, traceable, and human-reviewable patient record.

> **Safety Notice:** MedLens is an information-intelligence and organization system — **NOT** a diagnostic or treatment system. It does not provide definitive medical diagnoses, prescribe medications, or recommend dosage changes.

---

## 🌟 Key Capabilities & Architecture

MedLens implements an end-to-end clinical workflow:
`Input → Extraction → Validation → Normalization → Analysis → Insight → Human Review`

### 1. Patient Information Intake
- Captures demographics (Name/ID, Age, Biological Sex).
- Gathers chief symptoms and concerns with chronicity and onset notes.
- Documents existing medical conditions, known allergies, and current medications (drug name, dose, frequency).
- Granular attribution: All self-reported data is tagged with `Source: Patient Intake`.

### 2. Medical Report Processing & Ingestion
- Ingests laboratory reports via free-text pasting or file uploads (`.txt`, `.csv`, `.log`).
- Dual-document support: Supports analyzing a Current Laboratory Report and an optional Previous Report for longitudinal comparison.
- Extracts test names, observed values, measurement units, source reference ranges, test dates, and observations.

### 3. Medical Terminology Normalization
- Built-in clinical dictionary maps fragmented aliases and local shorthand to standardized canonical names:
  - `Hb` / `HGB` / `Hgb` → `Hemoglobin`
  - `WBC` / `TLC` / `Total Leukocyte Count` → `White Blood Cell Count`
  - `FBS` / `Fasting Blood Sugar` → `Fasting Blood Glucose`
  - `HbA1c` / `A1C` / `Glycated Hemoglobin` → `Glycated Hemoglobin (HbA1c)`
  - `Cr` / `Serum Creatinine` → `Serum Creatinine`
  - `eGFR` / `Estimated GFR` → `Estimated GFR (eGFR)`
- Automatic categorization into clinical panels (*Hematology, Metabolic, Renal, Liver, Lipids, Endocrine, Inflammatory*).

### 4. Strict Reference-Range Awareness
- Strictly uses reference intervals provided directly in the source report.
- **Anti-Hallucination Guardrail:** Never invents or assumes standard ranges if missing in the source document (flagged as `UNSPECIFIED` with a note).
- Color-coded classification: `LOW`, `NORMAL`, `HIGH`, `CRITICAL`, and `UNSPECIFIED`.
- Highlights acute panic alarm thresholds (e.g., severe electrolyte shifts or thrombocytopenia).

### 5. Inconsistency & Conflict Detection Engine
- Cross-references patient intake disclosures against lab reports and past clinical encounters.
- Detects allergy discrepancies (e.g. intake claims "No known allergies" while past records document Penicillin anaphylaxis).
- Flags medication contraindications (e.g. active Metformin therapy with elevated creatinine / declining eGFR).
- Surfaces conflicts side-by-side with clinician **Acknowledge** or **Resolve** action workflows.

### 6. Context-Aware Clarification Inquiries
- Generates 3–5 targeted questions to clarify missing timeline or physiological variables (e.g., fasting status for lipid/glucose panels, symptom onset chronology, thyroid medication timing).
- Strictly framed as clarification inquiries, **never medical advice**.
- Allows patients or clinicians to provide clarification details directly into the record.

### 7. Longitudinal Trajectory & Report Comparison
- Quantitatively compares prior and current laboratory reports parameter-by-parameter.
- Computes mathematical deltas, percentage changes, directional trend arrows (`↑`, `↓`, `→`), and clinical trajectory notes.

### 8. Human-in-the-Loop Review & Audit Trail
- Allows clinicians to review, edit, or correct any extracted field (name, value, unit, reference range).
- Displays exact source text snippet for complete provenance and traceability.
- "Mark as Human-Verified" attaches a verification badge and appends an entry to the immutable audit log.

### 9. Exportable Clinical Health Summary
- Generates a clean, clinical-grade summary report suitable for hospital charts or physician consults.
- Includes patient intake, laboratory findings, non-diagnostic AI summary, clinician signature block, and legal disclaimers.

### 10. Pre-Loaded Clinical Demonstration Cases
Four realistic clinical scenarios available via 1-click selection in the header:
1. **Anemia & Iron Deficiency Workup** (Sarah Jenkins, 34F) — Longitudinal CBC, declining Hb, depleted Ferritin.
2. **Type 2 Diabetes & Renal Check** (Robert Chen, 58M) — Glycemic elevation, declining eGFR, Metformin alert.
3. **Cardiovascular & Lipid Risk Workup** (Michael Torres, 52M) — Lipid profile, elevated LDL and hs-CRP.
4. **Allergy & Medication Discrepancy Case** (David Miller, 47M) — Penicillin allergy conflict with active Augmentin.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **Frontend**: React 19, TypeScript
- **Styling**: Vanilla CSS Design System (HSL tokens, glassmorphism, responsive data tables, dark/light clinical themes)
- **Icons**: [Lucide React](https://lucide.dev/)
- **API & Backend**: Next.js Server Endpoints (ensures API keys and credentials are 100% server-side)

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/mulekrishna005-arch/medlens1.git
cd medlens1
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## ⚖️ Ethical & Responsible AI Disclaimers

MedLens strictly complies with responsible AI guidelines:
1. **No Diagnosis:** Does not diagnose medical conditions.
2. **No Prescription:** Does not prescribe medications or recommend dosage modifications.
3. **Reference Range Integrity:** Does not invent reference intervals; adheres strictly to the source document.
4. **Human Verification:** All AI extractions and summaries require clinician review and verification.

---

## 👤 Author
- **GitHub**: [@mulekrishna005-arch](https://github.com/mulekrishna005-arch)
- **Email**: mulekrishnar005@gmail.com
