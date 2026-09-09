import type { UniversitySettings, HonorTier } from '$lib/schemas';
import { isPassingGrade } from './gpa';

export type GradeStepResult =
	| {
			status: 'ok';
			maxUnits: number;
			remainingAtBest: number;
			projectedCGPA: number;
			isDisqualified?: boolean;
	  }
	| { status: 'already'; projectedCGPA: number; isDisqualified?: boolean }
	| { status: 'impossible'; isDisqualified?: boolean }
	| { status: 'disqualified'; isDisqualified?: boolean }
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
		let g = round(gradeMax);
		while (g >= gradeMin - 0.0001) {
			steps.push(round(g));
			g = round(g - gradeStep);
		}
	} else {
		let g = round(gradeMin);
		while (g <= gradeMax + 0.0001) {
			steps.push(round(g));
			g = round(g + gradeStep);
		}
	}

	if (
		failingGrade !== null &&
		failingGrade !== undefined &&
		!steps.some((s) => Math.abs(s - failingGrade) < 0.0001)
	) {
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
	settings: UniversitySettings,
	attemptedUnits: number = unitsEarned,
	hasFailingGrade: boolean = false,
	isHonorTarget: boolean = false
): GradeStepResult {
	const remaining = Math.max(0, totalUnits - unitsEarned);
	if (remaining <= 0) return { status: 'complete' };

	const isAscending = settings.gradeDirection === 'ascending';
	const bestGrade = isAscending ? settings.gradeMax : settings.gradeMin;

	// Determines if the grade being tested is a failing grade under university rules
	const isTestingFailing =
		!isPassingGrade(targetGrade, settings) ||
		(settings.failingGrade !== null &&
			settings.failingGrade !== undefined &&
			Math.abs(targetGrade - settings.failingGrade) < 0.0001);

	// Latin Honors No-Fail Policy Disqualification Check (flagged without stopping math)
	const isDisqualified = Boolean(
		isHonorTarget && settings.latinHonorsNoFailPolicy && (hasFailingGrade || isTestingFailing)
	);

	const currentPoints = cgpa * attemptedUnits;
	const finalTotalAttempted = attemptedUnits + remaining;

	const meetsTarget = (projected: number) =>
		isAscending ? projected >= targetCGPA - 0.0001 : projected <= targetCGPA + 0.0001;

	// 1. Check if overall target CGPA is mathematically achievable even with top grades
	const bestCaseCGPA = (currentPoints + remaining * bestGrade) / finalTotalAttempted;
	if (!meetsTarget(bestCaseCGPA)) {
		return { status: 'impossible', isDisqualified };
	}

	// 2. Check if all remaining units at targetGrade satisfies the target
	const targetAllCGPA = (currentPoints + remaining * targetGrade) / finalTotalAttempted;
	if (meetsTarget(targetAllCGPA)) {
		return { status: 'already', projectedCGPA: round3(targetAllCGPA), isDisqualified };
	}

	if (Math.abs(targetGrade - bestGrade) < 1e-8) {
		return { status: 'already', projectedCGPA: round3(targetAllCGPA), isDisqualified };
	}

	// 3. Solve for x units at targetGrade, (remaining - x) units at bestGrade
	const neededPoints = targetCGPA * finalTotalAttempted;
	const remainingPoints = neededPoints - currentPoints;
	const x = (remainingPoints - remaining * bestGrade) / (targetGrade - bestGrade);

	const maxUnits = Math.min(remaining, Math.max(0, Math.floor(x + 1e-8)));
	const remainingAtBest = remaining - maxUnits;
	const projectedCGPA = round3(
		(currentPoints + maxUnits * targetGrade + remainingAtBest * bestGrade) / finalTotalAttempted
	);

	return { status: 'ok', maxUnits, remainingAtBest, projectedCGPA, isDisqualified };
}

export function calcUnitTable(
	cgpa: number,
	unitsEarned: number,
	totalUnits: number,
	target: HonorTier | number,
	settings: UniversitySettings,
	attemptedUnits: number = unitsEarned,
	hasFailingGrade: boolean = false
): UnitCalcOutput {
	const remaining = Math.max(0, totalUnits - unitsEarned);
	const bestGrade = settings.gradeDirection === 'ascending' ? settings.gradeMax : settings.gradeMin;

	const isHonorTarget = typeof target !== 'number';
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
		isFailing:
			!isPassingGrade(grade, settings) ||
			(settings.failingGrade !== null &&
				settings.failingGrade !== undefined &&
				Math.abs(grade - settings.failingGrade) < 0.0001),
		result: calcAtGrade(
			cgpa,
			unitsEarned,
			totalUnits,
			targetCGPA,
			grade,
			settings,
			attemptedUnits,
			hasFailingGrade,
			isHonorTarget
		)
	}));

	return {
		targetLabel,
		targetCGPA,
		remaining,
		bestGrade,
		rows
	};
}
