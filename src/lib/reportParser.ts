import type { LabParameter } from '@/types';
import { normalizeTestName } from './medicalDictionary';
import { parseReferenceRange, evaluateReferenceRange } from './referenceRangeEvaluator';

/**
 * Extracts laboratory parameters from raw text reports using robust regex heuristics.
 * Handles tabular structures, column-delimited formats, and key-value styles.
 */
export function extractParametersFromText(
  rawText: string,
  sourceDoc: 'CURRENT_REPORT' | 'PREVIOUS_REPORT' = 'CURRENT_REPORT'
): LabParameter[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/);
  const parameters: LabParameter[] = [];
  const seenCanonicalNames = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.length < 3) continue;

    // Skip generic headers and disclaimers
    const lowerLine = line.toLowerCase();
    if (
      lowerLine.startsWith('patient name') ||
      lowerLine.startsWith('lab report') ||
      lowerLine.startsWith('test name') ||
      lowerLine.startsWith('investigation') ||
      lowerLine.startsWith('department of') ||
      lowerLine.startsWith('collected on') ||
      lowerLine.startsWith('referred by') ||
      lowerLine.startsWith('page ')
    ) {
      continue;
    }

    // Extraction Pattern A: Tabular format:
    // [Test Name]  [Value]  [Optional Unit]  [Optional Reference Range]
    // Example: "Hemoglobin   10.2   g/dL   13.0 - 17.0"
    // Example: "Fasting Blood Sugar: 142 mg/dL (70 - 99)"
    // Example: "HbA1c 8.2 % (4.0-5.6)"
    // Example: "Serum Creatinine  1.6  mg/dL  0.7-1.3"

    let rawName = '';
    let rawValue = '';
    let rawUnit = '';
    let rawRange = '';

    if (line.includes('|')) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 2) {
        rawName = parts[0];
        rawValue = parts[1];
        rawUnit = parts[2] || '';
        rawRange = parts[3] || '';
      }
    } else {
      // Try colon format: "Test Name: Value Unit (Ref Range)"
      const colonMatch = line.match(/^([^:0-9]+):\s*([0-9.,]+|[a-zA-Z]+)\s*([a-zA-Z/%³²µu/]+)?(?:\s*[\(\[]?([^()\[\]\n]+)[\)\]]?)?/i);

      // Try multi-space column format: "Test Name    Value   Unit   Range"
      const columnMatch = line.match(/^([a-zA-Z0-9\s/().+-]+?)\s{2,}([0-9.,]+|[a-zA-Z]+)(?:\s+([a-zA-Z/%³²µu/]+))?(?:\s+(.+))?$/);

      // Try loose regex if neither matches
      const looseMatch = line.match(/^([a-zA-Z\s/()+-]+?)\s+([0-9.,]+)\s*([a-zA-Z/%³²µu/]+)?(?:\s+(.+))?$/);

      const match = colonMatch || columnMatch || looseMatch;
      if (match) {
        rawName = match[1]?.trim();
        rawValue = match[2]?.trim();
        rawUnit = match[3]?.trim() || '';
        rawRange = match[4]?.trim() || '';
      }
    }

    if (rawName && rawValue) {
      // Validate that rawName looks like a clinical test
      if (!rawName || rawName.length < 2 || rawName.split(' ').length > 6) continue;
      if (!rawValue || rawValue.toLowerCase() === 'test') continue;

      // Filter out phone numbers, dates, IDs
      if (rawName.toLowerCase().includes('phone') || rawName.toLowerCase().includes('date')) continue;

      const { canonicalName, category, plainDescription, criticalLow, criticalHigh } = normalizeTestName(rawName);

      // Avoid duplicate entries in the same report pass
      if (seenCanonicalNames.has(canonicalName.toLowerCase())) {
        continue;
      }
      seenCanonicalNames.add(canonicalName.toLowerCase());

      // Parse numerical observed value if possible
      const cleanNumStr = rawValue.replace(/,/g, '');
      const parsedNum = parseFloat(cleanNumStr);
      const observedValue = isNaN(parsedNum) ? rawValue : parsedNum;

      // Parse reference range (STRICT: does not invent if missing)
      const parsedRange = parseReferenceRange(rawRange);
      const evaluation = evaluateReferenceRange(observedValue, parsedRange, criticalLow, criticalHigh);

      parameters.push({
        id: `param-${parameters.length + 1}-${Date.now().toString(36)}`,
        name: rawName,
        canonicalName,
        observedValue,
        unit: rawUnit,
        referenceRange: parsedRange,
        status: evaluation.status,
        category,
        confidence: parsedRange.isSpecified ? 'HIGH' : 'MEDIUM',
        sourceTextSnippet: line,
        sourceDocument: sourceDoc,
        notes: plainDescription
      });
    }
  }

  return parameters;
}
