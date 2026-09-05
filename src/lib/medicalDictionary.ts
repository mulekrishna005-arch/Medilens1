import type { TestCategory } from '@/types';

interface TermMapping {
  canonical: string;
  aliases: string[];
  category: TestCategory;
  defaultUnit: string;
  plainDescription: string;
  criticalLow?: number;
  criticalHigh?: number;
}

export const MEDICAL_DICTIONARY: Record<string, TermMapping> = {
  hemoglobin: {
    canonical: 'Hemoglobin',
    aliases: ['hb', 'hgb', 'hemoglobin', 'haemoglobin', 'total hemoglobin'],
    category: 'Hematology',
    defaultUnit: 'g/dL',
    plainDescription: 'Protein in red blood cells that carries oxygen throughout your body.',
    criticalLow: 6.5,
    criticalHigh: 20.0
  },
  wbc: {
    canonical: 'White Blood Cell Count',
    aliases: ['wbc', 'tlc', 'white blood cell count', 'total leukocyte count', 'total leucocyte count', 'white blood count'],
    category: 'Hematology',
    defaultUnit: '/µL',
    plainDescription: 'Cells of the immune system that defend against infection and inflammation.',
    criticalLow: 2000,
    criticalHigh: 30000
  },
  rbc: {
    canonical: 'Red Blood Cell Count',
    aliases: ['rbc', 'red blood cell count', 'erythrocyte count', 'total rbc'],
    category: 'Hematology',
    defaultUnit: 'million/µL',
    plainDescription: 'Oxygen-carrying cells that circulate in your bloodstream.'
  },
  platelets: {
    canonical: 'Platelet Count',
    aliases: ['platelets', 'plt', 'platelet count', 'thrombocytes'],
    category: 'Hematology',
    defaultUnit: 'x10³/µL',
    plainDescription: 'Cell fragments essential for normal blood clotting and wound repair.',
    criticalLow: 20000,
    criticalHigh: 1000000
  },
  hematocrit: {
    canonical: 'Hematocrit',
    aliases: ['hematocrit', 'hct', 'pcv', 'packed cell volume'],
    category: 'Hematology',
    defaultUnit: '%',
    plainDescription: 'The proportion of red blood cells to total blood volume.'
  },
  mcv: {
    canonical: 'Mean Corpuscular Volume (MCV)',
    aliases: ['mcv', 'mean corpuscular volume', 'mean cell volume'],
    category: 'Hematology',
    defaultUnit: 'fL',
    plainDescription: 'Average size of individual red blood cells, helpful when evaluating anemia.'
  },
  ferritin: {
    canonical: 'Serum Ferritin',
    aliases: ['ferritin', 'serum ferritin', 's. ferritin'],
    category: 'Hematology',
    defaultUnit: 'ng/mL',
    plainDescription: 'Cellular protein that stores iron for your body to use later.'
  },
  serum_iron: {
    canonical: 'Serum Iron',
    aliases: ['serum iron', 'iron', 's. iron', 'fe'],
    category: 'Hematology',
    defaultUnit: 'µg/dL',
    plainDescription: 'Amount of circulating iron currently bound to transferrin in your blood.'
  },
  tibc: {
    canonical: 'Total Iron Binding Capacity (TIBC)',
    aliases: ['tibc', 'total iron binding capacity'],
    category: 'Hematology',
    defaultUnit: 'µg/dL',
    plainDescription: 'Capacity of your blood proteins to bind and transport iron.'
  },
  glucose_fasting: {
    canonical: 'Fasting Blood Glucose',
    aliases: ['fasting blood sugar', 'fbs', 'fasting blood glucose', 'fasting plasma glucose', 'fasting glucose', 'glucose fasting'],
    category: 'Metabolic & Electrolytes',
    defaultUnit: 'mg/dL',
    plainDescription: 'Blood sugar level measured after an overnight fast (minimum 8 hours).',
    criticalLow: 45,
    criticalHigh: 400
  },
  glucose_postprandial: {
    canonical: 'Postprandial Blood Glucose',
    aliases: ['postprandial blood sugar', 'ppbs', 'post prandial blood glucose', '2hr pp glucose'],
    category: 'Metabolic & Electrolytes',
    defaultUnit: 'mg/dL',
    plainDescription: 'Blood sugar measured approximately 2 hours after a meal.'
  },
  hba1c: {
    canonical: 'Glycated Hemoglobin (HbA1c)',
    aliases: ['hba1c', 'a1c', 'glycated hemoglobin', 'glycohemoglobin', 'hemoglobin a1c'],
    category: 'Metabolic & Electrolytes',
    defaultUnit: '%',
    plainDescription: 'Reflects your average blood sugar levels over the past 2 to 3 months.',
    criticalHigh: 13.0
  },
  creatinine: {
    canonical: 'Serum Creatinine',
    aliases: ['creatinine', 'serum creatinine', 's. creatinine', 'cr', 's. creat'],
    category: 'Renal Function',
    defaultUnit: 'mg/dL',
    plainDescription: 'Normal waste product of muscle metabolism filtered out by healthy kidneys.',
    criticalHigh: 6.0
  },
  egfr: {
    canonical: 'Estimated GFR (eGFR)',
    aliases: ['egfr', 'estimated gfr', 'glomerular filtration rate', 'gfr'],
    category: 'Renal Function',
    defaultUnit: 'mL/min/1.73m²',
    plainDescription: 'Calculated indicator of how efficiently your kidneys are filtering blood.',
    criticalLow: 15
  },
  bun: {
    canonical: 'Blood Urea Nitrogen (BUN)',
    aliases: ['bun', 'blood urea nitrogen', 'urea nitrogen'],
    category: 'Renal Function',
    defaultUnit: 'mg/dL',
    plainDescription: 'Measure of nitrogen waste from protein digestion processed by liver and kidneys.'
  },
  urea: {
    canonical: 'Serum Urea',
    aliases: ['urea', 'serum urea', 's. urea'],
    category: 'Renal Function',
    defaultUnit: 'mg/dL',
    plainDescription: 'Waste product formed from protein breakdown, excreted by the kidneys.'
  },
  sodium: {
    canonical: 'Serum Sodium',
    aliases: ['sodium', 'na', 'na+', 'serum sodium', 's. sodium'],
    category: 'Metabolic & Electrolytes',
    defaultUnit: 'mmol/L',
    plainDescription: 'Major electrolyte essential for maintaining fluid balance and nerve transmission.',
    criticalLow: 120,
    criticalHigh: 160
  },
  potassium: {
    canonical: 'Serum Potassium',
    aliases: ['potassium', 'k', 'k+', 'serum potassium', 's. potassium'],
    category: 'Metabolic & Electrolytes',
    defaultUnit: 'mmol/L',
    plainDescription: 'Electrolyte vital for cellular function, nerve signals, and heart rhythm.',
    criticalLow: 2.8,
    criticalHigh: 6.2
  },
  calcium: {
    canonical: 'Serum Calcium',
    aliases: ['calcium', 'ca', 'ca++', 'serum calcium', 'total calcium'],
    category: 'Metabolic & Electrolytes',
    defaultUnit: 'mg/dL',
    plainDescription: 'Mineral essential for bones, muscle contractions, and blood clotting.',
    criticalLow: 6.5,
    criticalHigh: 13.0
  },
  alt: {
    canonical: 'Alanine Aminotransferase (ALT/SGPT)',
    aliases: ['alt', 'sgpt', 'alanine aminotransferase', 'alanine transaminase'],
    category: 'Liver Function',
    defaultUnit: 'U/L',
    plainDescription: 'Enzyme primarily found in liver cells; elevated when liver tissue experiences stress.'
  },
  ast: {
    canonical: 'Aspartate Aminotransferase (AST/SGOT)',
    aliases: ['ast', 'sgot', 'aspartate aminotransferase', 'aspartate transaminase'],
    category: 'Liver Function',
    defaultUnit: 'U/L',
    plainDescription: 'Enzyme present in liver and heart muscle cells.'
  },
  bilirubin_total: {
    canonical: 'Total Bilirubin',
    aliases: ['total bilirubin', 't. bilirubin', 'bilirubin total', 's. bilirubin'],
    category: 'Liver Function',
    defaultUnit: 'mg/dL',
    plainDescription: 'Yellow pigment formed during normal breakdown of red blood cells.'
  },
  cholesterol_total: {
    canonical: 'Total Cholesterol',
    aliases: ['total cholesterol', 'cholesterol total', 'cholesterol'],
    category: 'Lipid Profile',
    defaultUnit: 'mg/dL',
    plainDescription: 'Total amount of circulating cholesterol molecules in your blood.'
  },
  hdl: {
    canonical: 'HDL Cholesterol (Good)',
    aliases: ['hdl', 'hdl-c', 'hdl cholesterol', 'high density lipoprotein'],
    category: 'Lipid Profile',
    defaultUnit: 'mg/dL',
    plainDescription: 'High-density lipoprotein that helps carry cholesterol away from arterial walls.'
  },
  ldl: {
    canonical: 'LDL Cholesterol (Direct/Calc)',
    aliases: ['ldl', 'ldl-c', 'ldl cholesterol', 'low density lipoprotein'],
    category: 'Lipid Profile',
    defaultUnit: 'mg/dL',
    plainDescription: 'Low-density lipoprotein that can contribute to arterial plaque accumulation.'
  },
  triglycerides: {
    canonical: 'Triglycerides',
    aliases: ['triglycerides', 'tg', 'serum triglycerides'],
    category: 'Lipid Profile',
    defaultUnit: 'mg/dL',
    plainDescription: 'Most common type of fat in your body, derived from calories and fats consumed.'
  },
  tsh: {
    canonical: 'Thyroid Stimulating Hormone (TSH)',
    aliases: ['tsh', 'thyroid stimulating hormone', 'thyrotropin'],
    category: 'Endocrine & Thyroid',
    defaultUnit: 'µIU/mL',
    plainDescription: 'Pituitary hormone regulating how actively your thyroid gland produces hormones.'
  },
  crp: {
    canonical: 'C-Reactive Protein (CRP)',
    aliases: ['crp', 'c-reactive protein', 'c reactive protein', 'hs-crp'],
    category: 'Inflammatory & Cardiac',
    defaultUnit: 'mg/L',
    plainDescription: 'Protein synthesized by the liver that rises in response to systemic inflammation.'
  },
  esr: {
    canonical: 'Erythrocyte Sedimentation Rate (ESR)',
    aliases: ['esr', 'erythrocyte sedimentation rate', 'sed rate'],
    category: 'Inflammatory & Cardiac',
    defaultUnit: 'mm/hr',
    plainDescription: 'General clinical indicator of inflammatory activity in the body.'
  },
  vitamin_d: {
    canonical: 'Vitamin D (25-Hydroxy)',
    aliases: ['vitamin d', '25-oh vitamin d', 'vit d', '25-hydroxy vitamin d'],
    category: 'Other',
    defaultUnit: 'ng/mL',
    plainDescription: 'Fat-soluble vitamin essential for bone mineralization and immune modulation.'
  },
  vitamin_b12: {
    canonical: 'Vitamin B12',
    aliases: ['vitamin b12', 'vit b12', 'cobalamin', 'b12'],
    category: 'Other',
    defaultUnit: 'pg/mL',
    plainDescription: 'Nutrient necessary for red blood cell synthesis and neurological nerve health.'
  }
};

/**
 * Normalizes a raw laboratory test name into its standardized canonical name,
 * matching category, and plain English explanation.
 */
export function normalizeTestName(rawName: string): {
  canonicalName: string;
  category: TestCategory;
  plainDescription: string;
  criticalLow?: number;
  criticalHigh?: number;
} {
  const cleaned = rawName.toLowerCase().replace(/[^a-z0-9\s/+-]/g, '').trim();

  // 1. Direct exact alias match
  for (const entry of Object.values(MEDICAL_DICTIONARY)) {
    if (entry.aliases.some(alias => alias === cleaned)) {
      return {
        canonicalName: entry.canonical,
        category: entry.category,
        plainDescription: entry.plainDescription,
        criticalLow: entry.criticalLow,
        criticalHigh: entry.criticalHigh
      };
    }
  }

  // 2. Substring or keyword match (enforce word boundaries for short abbreviations like 'k' or 'ca')
  for (const entry of Object.values(MEDICAL_DICTIONARY)) {
    if (entry.aliases.some(alias => {
      if (alias.length <= 2) {
        const escaped = alias.replace(/[+]/g, '\\+');
        const regex = new RegExp(`(?:^|\\s)${escaped}(?:$|\\s)`, 'i');
        return regex.test(cleaned);
      }
      return cleaned.includes(alias) || alias.includes(cleaned);
    })) {
      return {
        canonicalName: entry.canonical,
        category: entry.category,
        plainDescription: entry.plainDescription,
        criticalLow: entry.criticalLow,
        criticalHigh: entry.criticalHigh
      };
    }
  }

  // 3. Fallback: Title case raw name, category Other
  const fallbackCanonical = rawName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return {
    canonicalName: fallbackCanonical,
    category: 'Other',
    plainDescription: 'Clinical laboratory parameter documented in the medical report.'
  };
}
