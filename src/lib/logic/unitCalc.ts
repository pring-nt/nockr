import type { UniversitySettings, HonorTier } from '$lib/schemas';

export interface UnitCalcInput {
	currentCGPA: number;
	unitsEarned: number;
	totalProgramUnits: number;
	targetTier: HonorTier;
	settings: UniversitySettings;
}

export interface UnitCalcResult {
	/** Max units of the given grade before dropping out of the target tier */
	maxUnitsOfGrade: (gradeX: number) => number;
	/** Projected CGPA if all remaining units are the best possible grade */
	projectedBestCGPA: number;
	/** Projected CGPA if all remaining units are a specific grade */
	projectedCGPA: (gradeX: number) => number;
	remainingUnits: number;
}

export function computeUnitCalc(input: UnitCalcInput): UnitCalcResult {
	const { currentCGPA, unitsEarned, totalProgramUnits, targetTier, settings } = input;

	const remainingUnits = totalProgramUnits - unitsEarned;
	const currentQP = currentCGPA * unitsEarned;

	// Best possible grade depends on direction
	const bestGrade = settings.gradeDirection === 'ascending' ? settings.gradeMax : settings.gradeMin;

	function projectedCGPA(gradeX: number): number {
		const totalQP = currentQP + gradeX * remainingUnits;
		return totalQP / totalProgramUnits;
	}

	const projectedBestCGPA = projectedCGPA(bestGrade);

	function maxUnitsOfGrade(gradeX: number): number {
		// Solve for max n units of gradeX such that the resulting CGPA
		// still falls within the target tier bounds
		let max = 0;
		for (let n = 0; n <= remainingUnits; n += 1) {
			const qp = currentQP + n * gradeX + (remainingUnits - n) * bestGrade;
			const cgpa = qp / totalProgramUnits;
			const inTier = cgpa >= targetTier.lowerBound && cgpa <= targetTier.upperBound;
			if (inTier) max = n;
			else if (n > 0) break; // once we leave the tier, we won't come back
		}
		return max;
	}

	return {
		maxUnitsOfGrade,
		projectedBestCGPA,
		projectedCGPA,
		remainingUnits
	};
}
