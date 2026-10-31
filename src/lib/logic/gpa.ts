import type { Term, Course, CourseType, UniversitySettings } from '$lib/schemas';

export function gradedCourses(courses: Course[]): Course[] {
	return courses.filter((c) => c.type === 'graded' && c.grade !== null);
}

export function isPassingGrade(grade: number | null, settings?: UniversitySettings): boolean {
	if (grade === null) return false;
	if (!settings || settings.failingGrade === null) return grade > 0;

	return settings.gradeDirection === 'descending'
		? grade < settings.failingGrade
		: grade > settings.failingGrade;
}

/** Whether a course has a final outcome, rather than being planned or currently registered */
export function isCourseFinished(course: Course): boolean {
	if (course.type === 'graded') return course.grade !== null;
	return course.type === 'credited' || course.result !== 'pending';
}

/** Graded courses need at least 1 unit, so returning to 'graded' lifts a 0-unit course */
export function withCourseType(course: Course, type: CourseType): Course {
	return { ...course, type, units: type === 'graded' ? Math.max(1, course.units) : course.units };
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

/** All GPA-bearing units in a term, including courses that have no grade yet */
export function computeTermTotalUnits(term: Term): number {
	return term.courses.reduce((sum, c) => (c.type === 'graded' ? sum + c.units : sum), 0);
}

export function computeTermUnitsEarned(term: Term, settings?: UniversitySettings): number {
	return gradedCourses(term.courses).reduce((sum, c) => {
		return isPassingGrade(c.grade, settings) ? sum + c.units : sum;
	}, 0);
}

export function computeUnitsEarned(terms: Term[], settings?: UniversitySettings): number {
	return terms.reduce((sum, t) => sum + computeTermUnitsEarned(t, settings), 0);
}

/** Units from credited and passed non-academic courses, which sit outside the program total */
export function computeTermNonGpaUnits(term: Term): number {
	return term.courses.reduce((sum, c) => {
		const counts = c.type === 'credited' || (c.type === 'non-academic' && c.result === 'passed');
		return counts ? sum + c.units : sum;
	}, 0);
}

export function computeNonGpaUnits(terms: Term[]): number {
	return terms.reduce((sum, t) => sum + computeTermNonGpaUnits(t), 0);
}
