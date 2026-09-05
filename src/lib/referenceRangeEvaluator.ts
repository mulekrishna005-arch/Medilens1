import { RangeStatus } from '@/types';

export interface ParsedRange {
  rawText: string;
  min?: number | null;
  max?: number | null;
  isSpecified: boolean;
}

export interface RangeEvaluationResult {
  status: RangeStatus;
  statusLabel: string;
  explanation: string;
  isCritical: boolean;
}

/**
 * Parses raw text from a source laboratory report into min and max bounds.
 * STRICT CLINICAL GUARDRAIL:
 * If the source report does NOT provide a reference range, `isSpecified` is false,
 * and min/max will NOT be set or fabricated.
 */
export function parseReferenceRange(rawRange?: string | null): ParsedRange {
  if (!rawRange || typeof rawRange !== 'string') {
    return {
      rawText: 'Not provided in report',
      min: null,
      max: null,
      isSpecified: false
    };
  }

  const cleaned = rawRange.trim();
  if (
    !cleaned ||
    cleaned.toLowerCase() === 'n/a' ||
    cleaned.toLowerCase() === 'none' ||
    cleaned.toLowerCase() === 'nil' ||
    cleaned === '-'
  ) {
    return {
      rawText: 'Not provided in report',
      min: null,
      max: null,
      isSpecified: false
    };
  }

  // Range pattern 1: Standard numeric dash "13.0 - 17.0" or "13.0-17.0" or "13 to 17"
  const rangeMatch = cleaned.match(/([\d.]+)\s*(?:-|–|—|to)\s*([\d.]+)/i);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    if (!isNaN(min) && !isNaN(max)) {
      return {
        rawText: cleaned,
        min,
        max,
        isSpecified: true
      };
    }
  }

  // Range pattern 2: Upper bound only "< 200" or "<= 200" or "Up to 200"
  const lessThanMatch = cleaned.match(/(?:<|<=|less than|up to)\s*([\d.]+)/i);
  if (lessThanMatch) {
    const max = parseFloat(lessThanMatch[1]);
    if (!isNaN(max)) {
      return {
        rawText: cleaned,
        min: 0,
        max,
        isSpecified: true
      };
    }
  }

  // Range pattern 3: Lower bound only "> 60" or ">= 60" or "greater than 60"
  const greaterThanMatch = cleaned.match(/(?:>|>=|greater than)\s*([\d.]+)/i);
  if (greaterThanMatch) {
    const min = parseFloat(greaterThanMatch[1]);
    if (!isNaN(min)) {
      return {
        rawText: cleaned,
        min,
        max: null,
        isSpecified: true
      };
    }
  }

  // Unparseable non-standard text provided in report (e.g. "Negative", "Non-Reactive")
  return {
    rawText: cleaned,
    min: null,
    max: null,
    isSpecified: true
  };
}

/**
 * Evaluates an observed numeric or qualitative test result against the SOURCE report's range.
 * Never invents or assumes standard textbook ranges when missing.
 */
export function evaluateReferenceRange(
  observedValue: number | string,
  range: ParsedRange,
  criticalLow?: number,
  criticalHigh?: number
): RangeEvaluationResult {
  // If the source report did not provide a reference range
  if (!range.isSpecified) {
    return {
      status: 'UNSPECIFIED',
      statusLabel: 'No Reference Range',
      explanation: 'No reference range provided in source document. Reference range not invented.',
      isCritical: false
    };
  }

  // Extract numeric observed value
  const numVal = typeof observedValue === 'number' 
    ? observedValue 
    : parseFloat(String(observedValue).replace(/[^0-9.-]/g, ''));

  // If the value is qualitative (e.g. "Negative", "Normal", "Trace")
  if (isNaN(numVal)) {
    const strVal = String(observedValue).toLowerCase().trim();
    const strRange = range.rawText.toLowerCase().trim();

    if (
      strVal.includes('negative') || 
      strVal.includes('non-reactive') || 
      strVal.includes('nil') || 
      strVal === 'normal'
    ) {
      return {
        status: 'NORMAL',
        statusLabel: 'Normal / Negative',
        explanation: `Qualitative result matches expected healthy baseline (${range.rawText}).`,
        isCritical: false
      };
    }

    if (
      strVal.includes('positive') || 
      strVal.includes('reactive') || 
      strVal.includes('abnormal')
    ) {
      return {
        status: 'HIGH',
        statusLabel: 'Abnormal / Positive',
        explanation: `Qualitative result deviates from reported reference baseline (${range.rawText}).`,
        isCritical: false
      };
    }

    return {
      status: 'UNSPECIFIED',
      statusLabel: 'Qualitative',
      explanation: `Reported qualitative result: "${observedValue}" (Reference: ${range.rawText}).`,
      isCritical: false
    };
  }

  // Check for Acute Critical / Panic Alarm thresholds
  const isCriticalLow = criticalLow !== undefined && numVal <= criticalLow;
  const isCriticalHigh = criticalHigh !== undefined && numVal >= criticalHigh;

  if (isCriticalLow) {
    return {
      status: 'CRITICAL',
      statusLabel: 'Critical Low',
      explanation: `Value (${numVal}) is in a clinically critical low alarm range requiring immediate physician review.`,
      isCritical: true
    };
  }

  if (isCriticalHigh) {
    return {
      status: 'CRITICAL',
      statusLabel: 'Critical High',
      explanation: `Value (${numVal}) is in a clinically critical high alarm range requiring immediate physician review.`,
      isCritical: true
    };
  }

  // Evaluate against parsed range bounds
  const hasMin = range.min !== null && range.min !== undefined;
  const hasMax = range.max !== null && range.max !== undefined;

  if (hasMin && hasMax) {
    if (numVal < range.min!) {
      return {
        status: 'LOW',
        statusLabel: 'Below Reference Range',
        explanation: `Value (${numVal}) is below the reported normal range of ${range.rawText}.`,
        isCritical: false
      };
    }
    if (numVal > range.max!) {
      return {
        status: 'HIGH',
        statusLabel: 'Above Reference Range',
        explanation: `Value (${numVal}) is above the reported normal range of ${range.rawText}.`,
        isCritical: false
      };
    }
    return {
      status: 'NORMAL',
      statusLabel: 'Within Reference Range',
      explanation: `Value (${numVal}) is within the reported normal range of ${range.rawText}.`,
      isCritical: false
    };
  }

  if (hasMax && !hasMin) {
    if (numVal > range.max!) {
      return {
        status: 'HIGH',
        statusLabel: 'Above Reference Range',
        explanation: `Value (${numVal}) exceeds the reported upper cutoff of ${range.rawText}.`,
        isCritical: false
      };
    }
    return {
      status: 'NORMAL',
      statusLabel: 'Within Reference Range',
      explanation: `Value (${numVal}) is within the reported cutoff of ${range.rawText}.`,
      isCritical: false
    };
  }

  if (hasMin && !hasMax) {
    if (numVal < range.min!) {
      return {
        status: 'LOW',
        statusLabel: 'Below Reference Range',
        explanation: `Value (${numVal}) is below the reported minimum target of ${range.rawText}.`,
        isCritical: false
      };
    }
    return {
      status: 'NORMAL',
      statusLabel: 'Within Reference Range',
      explanation: `Value (${numVal}) satisfies the reported target of ${range.rawText}.`,
      isCritical: false
    };
  }

  return {
    status: 'NORMAL',
    statusLabel: 'Reported Value',
    explanation: `Value reported as ${numVal} with range note: ${range.rawText}.`,
    isCritical: false
  };
}
