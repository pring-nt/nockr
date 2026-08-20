import type { Term, HonorTier, UniversitySettings } from '$lib/schemas';

/** Find the matching honor tier for a given GPA, or null if none match */
export function matchTier(gpa: number, tiers: HonorTier[]): HonorTier | null {
	return tiers.find((t) => gpa >= t.lowerBound && gpa <= t.upperBound) ?? null;
}

/** Check if student is disqualified from Latin Honors via no-fail policy */
export function isNoFailDisqualified(terms: Term[], settings: UniversitySettings): boolean {
	if (!settings.latinHonorsNoFailPolicy) return false;
	if (settings.failingGrade === null) return false;

	return terms.some((term) => term.courses.some((c) => c.grade === settings.failingGrade));
}

/** Dean's List tier for a single term's TGPA */
export function getDeansListTier(
	tgpa: number | null,
	settings: UniversitySettings
): HonorTier | null {
	if (!settings.deansListEnabled) return null;
	if (tgpa === null) return null;
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
