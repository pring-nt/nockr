import type { Term, HonorTier, UniversitySettings } from '$lib/schemas';

/** Find the matching honor tier for a given GPA, or null if none match */
export function matchTier(gpa: number, tiers: HonorTier[]): HonorTier | null {
	const roundedGpa = Math.round(gpa * 1000) / 1000;
	return tiers.find((t) => roundedGpa >= t.lowerBound && roundedGpa <= t.upperBound) ?? null;
}

/** Check if student is disqualified from Latin Honors via no-fail policy */
export function isNoFailDisqualified(terms: Term[], settings: UniversitySettings): boolean {
	if (!settings.latinHonorsNoFailPolicy) return false;
	if (settings.failingGrade === null) return false;

	return terms.some((term) => term.courses.some((c) => c.grade === settings.failingGrade));
}

/** Agnostic Dean's List check for a single term */
export function getDeansListTier(
	term: Term, // <-- Now taking the full term
	tgpa: number | null,
	settings: UniversitySettings
): HonorTier | null {
	if (!settings.deansListEnabled || tgpa === null) return null;

	const gradedCourses = term.courses.filter((c) => c.grade !== null);

	// 1. Check Unit Requirements
	const earnedUnits = gradedCourses.reduce((sum, c) => sum + c.units, 0);
	if (earnedUnits < settings.deansListMinUnits) return null;

	// 2. Check for Disqualifying Grades
	if (settings.deansListMinCourseGrade !== null) {
		const threshold = settings.deansListMinCourseGrade;
		const hasDisqualifyingGrade = gradedCourses.some((c) => {
			const grade = c.grade as number;
			// Ascending (DLSU): Disqualified if grade is LOWER than threshold (e.g., < 2.0)
			if (settings.gradeDirection === 'ascending') {
				return grade < threshold;
			}
			// Descending (UP): Disqualified if grade is HIGHER than threshold (e.g., > 3.0)
			else {
				return grade > threshold;
			}
		});

		if (hasDisqualifyingGrade) return null;
	}

	// 3. Match GPA Tier
	return matchTier(tgpa, settings.deansListTiers);
}

/** Latin Honors tier for current CGPA */
export function getLatinHonorsTier(
	cgpa: number | null,
	settings: UniversitySettings
): HonorTier | null {
	if (!settings.latinHonorsEnabled) return null;
	if (cgpa === null) return null;
	return matchTier(cgpa, settings.latinHonorsTiers);
}
