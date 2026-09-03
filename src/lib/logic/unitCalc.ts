import type { UniversitySettings, HonorTier } from '$lib/schemas';

export type GradeStepResult =
	| { status: 'ok'; maxUnits: number; remainingAtBest: number; projectedCGPA: number }
	| { status: 'already'; projectedCGPA: number }
	| { status: 'impossible' }
	| { status: 'disqualified' }
	| { status: 'complete' };

export type GradeStepRow = {
	grade: number;
	isFailing: boolean;
	result: GradeStepResult;
};

export type UnitCalcOutput = {
	targetLabel?: string;
	targetCGPA: number;
	remaining: number;
	bestGrade: number;
	rows: GradeStepRow[];
};

function round3(n: number): number {
	return Math.round(n * 1000) / 1000;
}

/**
 * Generates all valid grade steps from best grade to worst grade (inclusive).
 * Appends the failing grade as the final step if present.
 */
export function generateGradeSteps(settings: UniversitySettings): number[] {
	const { gradeMin, gradeMax, gradeStep = 0.5, gradeDirection, failingGrade } = settings;

	const decimals = String(gradeStep).split('.')[1]?.length ?? 2;
	const round = (n: number) => parseFloat(n.toFixed(decimals));

	const steps: number[] = [];

	if (gradeDirection === 'ascending') {
		// Best = gradeMax (e.g. 4.0), worst = gradeMin (e.g. 0.0)
		let g = round(gradeMax);
		while (g >= gradeMin - 0.0001) {
			steps.push(round(g));
			g = round(g - gradeStep);
		}
	} else {
		// Best = gradeMin (e.g. 1.0), worst = gradeMax (e.g. 5.0)
		let g = round(gradeMin);
		while (g <= gradeMax + 0.0001) {
			steps.push(round(g));
			g = round(g + gradeStep);
		}
	}

	// Append failing grade if it exists and isn't already in the steps
	if (failingGrade !== null && !steps.some((s) => Math.abs(s - failingGrade) < 0.0001)) {
		steps.push(failingGrade);
	}

	return steps;
}

export function calcAtGrade(
	cgpa: number,
	unitsEarned: number,
	totalUnits: number,
	targetCGPA: number,
	targetGrade: number,
	settings: UniversitySettings
): GradeStepResult {
	const remaining = totalUnits - unitsEarned;
	if (remaining <= 0) return { status: 'complete' };

	const isAscending = settings.gradeDirection === 'ascending';
	const bestGrade = isAscending ? settings.gradeMax : settings.gradeMin;

	const isFailing =
		settings.failingGrade !== null && Math.abs(targetGrade - settings.failingGrade) < 0.0001;

	if (isFailing && settings.latinHonorsNoFailPolicy) {
		return { status: 'disqualified' };
	}

	const currentPoints = cgpa * unitsEarned;

	const meetsTarget = (projected: number) =>
		isAscending ? projected >= targetCGPA - 0.0001 : projected <= targetCGPA + 0.0001;

	// 1. Check best-case scenario (all remaining units at bestGrade)
	const bestCaseCGPA = (currentPoints + remaining * bestGrade) / totalUnits;
	if (!meetsTarget(bestCaseCGPA)) {
		return { status: 'impossible' };
	}

	// 2. Check all-target scenario (all remaining units at targetGrade)
	const targetAllCGPA = (currentPoints + remaining * targetGrade) / totalUnits;
	if (meetsTarget(targetAllCGPA)) {
		return { status: 'already', projectedCGPA: round3(targetAllCGPA) };
	}

	// 3. Solve for x units at targetGrade, (remaining - x) units at bestGrade
	const neededPoints = targetCGPA * totalUnits;
	const remainingPoints = neededPoints - currentPoints;
	const x = (remainingPoints - remaining * bestGrade) / (targetGrade - bestGrade);

	// Use epsilon tolerance to avoid floating-point rounding bugs (e.g. 11.99999 -> 11)
	const maxUnits = Math.min(remaining, Math.max(0, Math.floor(x + 1e-8)));
	const remainingAtBest = remaining - maxUnits;
	const projectedCGPA = round3(
		(currentPoints + maxUnits * targetGrade + remainingAtBest * bestGrade) / totalUnits
	);

	return { status: 'ok', maxUnits, remainingAtBest, projectedCGPA };
}

export function calcUnitTable(
	cgpa: number,
	unitsEarned: number,
	totalUnits: number,
	target: HonorTier | number,
	settings: UniversitySettings
): UnitCalcOutput {
	const remaining = totalUnits - unitsEarned;
	const bestGrade = settings.gradeDirection === 'ascending' ? settings.gradeMax : settings.gradeMin;

	const targetCGPA =
		typeof target === 'number'
			? target
			: settings.gradeDirection === 'ascending'
				? target.lowerBound
				: target.upperBound;

	const targetLabel = typeof target === 'number' ? undefined : target.label;
	const steps = generateGradeSteps(settings);

	const rows: GradeStepRow[] = steps.map((grade) => ({
		grade,
		isFailing: settings.failingGrade !== null && Math.abs(grade - settings.failingGrade) < 0.0001,
		result: calcAtGrade(cgpa, unitsEarned, totalUnits, targetCGPA, grade, settings)
	}));

	return {
		targetLabel,
		targetCGPA,
		remaining,
		bestGrade,
		rows
	};
}
