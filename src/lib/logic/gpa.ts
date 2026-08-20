import type { Term, Course } from '$lib/schemas';

export function gradedCourses(courses: Course[]): Course[] {
	return courses.filter((c) => c.grade !== null);
}

function qualityPoints(courses: Course[]): number {
	return gradedCourses(courses).reduce((sum, c) => sum + (c.grade as number) * c.units, 0);
}

function earnedUnits(courses: Course[]): number {
	return gradedCourses(courses).reduce((sum, c) => sum + c.units, 0);
}

export function computeTGPA(term: Term): number | null {
	const units = earnedUnits(term.courses);
	if (units === 0) return null;
	return qualityPoints(term.courses) / units;
}

export function computeCGPA(terms: Term[]): number | null {
	const totalUnits = terms.reduce((sum, t) => sum + earnedUnits(t.courses), 0);
	if (totalUnits === 0) return null;

	const totalQP = terms.reduce((sum, t) => sum + qualityPoints(t.courses), 0);
	return totalQP / totalUnits;
}

export function computeUnitsEarned(terms: Term[]): number {
	return terms.reduce((sum, t) => sum + earnedUnits(t.courses), 0);
}
