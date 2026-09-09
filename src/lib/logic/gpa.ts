import type { Term, Course, UniversitySettings } from '$lib/schemas';

export function gradedCourses(courses: Course[]): Course[] {
	return courses.filter((c) => c.grade !== null);
}

export function isPassingGrade(grade: number | null, settings?: UniversitySettings): boolean {
	if (grade === null) return false;
	if (!settings || settings.failingGrade === null) return grade > 0;

	return settings.gradeDirection === 'descending'
		? grade < settings.failingGrade
		: grade > settings.failingGrade;
}

export function computeTermAttemptedUnits(term: Term): number {
	return gradedCourses(term.courses).reduce((sum, c) => sum + c.units, 0);
}

export function computeAttemptedUnits(terms: Term[]): number {
	return terms.reduce((sum, t) => sum + computeTermAttemptedUnits(t), 0);
}

function qualityPoints(courses: Course[]): number {
	return gradedCourses(courses).reduce((sum, c) => sum + (c.grade as number) * c.units, 0);
}

export function computeTGPA(term: Term): number | null {
	const units = computeTermAttemptedUnits(term);
	if (units === 0) return null;
	return qualityPoints(term.courses) / units;
}

export function computeCGPA(terms: Term[]): number | null {
	const totalUnits = computeAttemptedUnits(terms);
	if (totalUnits === 0) return null;

	const totalQP = terms.reduce((sum, t) => sum + qualityPoints(t.courses), 0);
	return totalQP / totalUnits;
}

export function computeTermUnitsEarned(term: Term, settings?: UniversitySettings): number {
	return term.courses.reduce((sum, c) => {
		return isPassingGrade(c.grade, settings) ? sum + c.units : sum;
	}, 0);
}

export function computeUnitsEarned(terms: Term[], settings?: UniversitySettings): number {
	return terms.reduce((sum, t) => sum + computeTermUnitsEarned(t, settings), 0);
}
