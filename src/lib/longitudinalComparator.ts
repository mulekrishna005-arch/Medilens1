import type { LabParameter, LongitudinalComparisonItem } from '@/types';

/**
 * Performs structured, quantitative comparison between extracted parameters
 * from a previous laboratory report and the current laboratory report.
 * 
 * STRICT PRINCIPLE: Comparison is computed mathematically from extracted
 * structured values, NOT hallucinated or loosely summarized.
 */
export function compareReports(
  currentParams: LabParameter[],
  previousParams: LabParameter[],
  currentDate: string = 'Current',
  previousDate: string = 'Previous'
): LongitudinalComparisonItem[] {
  const comparisons: LongitudinalComparisonItem[] = [];

  for (const current of currentParams) {
    // Find matching parameter in previous report by canonical name
    const prevMatch = previousParams.find(
      p => p.canonicalName.toLowerCase() === current.canonicalName.toLowerCase()
    );

    if (!prevMatch) continue;

    const currNum = typeof current.observedValue === 'number'
      ? current.observedValue
      : parseFloat(String(current.observedValue).replace(/[^0-9.-]/g, ''));

    const prevNum = typeof prevMatch.observedValue === 'number'
      ? prevMatch.observedValue
      : parseFloat(String(prevMatch.observedValue).replace(/[^0-9.-]/g, ''));

    const isBothNumeric = !isNaN(currNum) && !isNaN(prevNum);

    let numericDelta: number | null = null;
    let percentageChange: number | null = null;
    let trend: 'INCREASED' | 'DECREASED' | 'STABLE' | 'NOT_APPLICABLE' = 'NOT_APPLICABLE';
    let observation = '';

    if (isBothNumeric) {
      numericDelta = parseFloat((currNum - prevNum).toFixed(2));
      
      if (prevNum !== 0) {
        percentageChange = parseFloat((((currNum - prevNum) / Math.abs(prevNum)) * 100).toFixed(1));
      }

      const diff = currNum - prevNum;
      // Define a small threshold for stability (e.g. within 2% or 0.05 absolute)
      const absPercent = Math.abs(percentageChange || 0);

      if (absPercent < 2.0 && Math.abs(diff) < 0.1) {
        trend = 'STABLE';
        observation = `Remained stable (${prevNum} → ${currNum} ${current.unit})`;
      } else if (diff > 0) {
        trend = 'INCREASED';
        observation = `Increased by ${Math.abs(numericDelta)} ${current.unit} (+${percentageChange}%)`;
      } else {
        trend = 'DECREASED';
        observation = `Decreased by ${Math.abs(numericDelta)} ${current.unit} (${percentageChange}%)`;
      }

      // Add status transition context
      if (prevMatch.status !== current.status) {
        observation += ` — Status shifted from ${prevMatch.status} to ${current.status}`;
      }
    } else {
      // Qualitative comparison
      const currStr = String(current.observedValue).trim();
      const prevStr = String(prevMatch.observedValue).trim();
      
      if (currStr.toLowerCase() === prevStr.toLowerCase()) {
        trend = 'STABLE';
        observation = `Unchanged qualitative result: "${currStr}"`;
      } else {
        trend = 'NOT_APPLICABLE';
        observation = `Shifted from "${prevStr}" to "${currStr}"`;
      }
    }

    comparisons.push({
      parameterId: current.id,
      canonicalName: current.canonicalName,
      unit: current.unit || prevMatch.unit || '',
      previousValue: prevMatch.observedValue,
      previousDate: prevMatch.notes || previousDate,
      previousStatus: prevMatch.status,
      currentValue: current.observedValue,
      currentDate: current.notes || currentDate,
      currentStatus: current.status,
      numericDelta,
      percentageChange,
      trend,
      clinicalObservation: observation
    });
  }

  return comparisons;
}
