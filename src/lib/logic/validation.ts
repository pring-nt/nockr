import { DLSU_PRESET } from '$lib/constants';
import type { AppState, Term, UniversitySettings } from '$lib/schemas';

const MAX_GRADE_STEPS = 1000;

/** Grade steps are generated in a loop, so a scale that fails this can hang the page */
export function getSettingsProblem(settings: UniversitySettings): string | null {
	const { gradeMin, gradeMax, gradeStep, deansListMinUnits } = settings;

	if (!(gradeMin < gradeMax)) return 'Max Grade has to be above Min Grade.';
	if (!(gradeStep > 0)) return 'Grade Step has to be above 0.';
	if ((gradeMax - gradeMin) / gradeStep > MAX_GRADE_STEPS) {
		return 'Grade Step is too small for this scale.';
	}
	if (deansListMinUnits < 0) return "Min Term Units can't be negative.";
	return null;
}

function uniqueIds<T extends { id: string }>(items: T[], seen: Set<string>): T[] {
	return items.map((item) => {
		const id = item.id && !seen.has(item.id) ? item.id : crypto.randomUUID();
		seen.add(id);
		return id === item.id ? item : { ...item, id };
	});
}

function repairSettings(settings: UniversitySettings): UniversitySettings {
	const repaired = {
		...settings,
		deansListTiers: uniqueIds(settings.deansListTiers, new Set()),
		latinHonorsTiers: uniqueIds(settings.latinHonorsTiers, new Set())
	};
	if (!getSettingsProblem(repaired)) return repaired;

	const { gradeMin, gradeMax } = repaired.gradeMin < repaired.gradeMax ? repaired : DLSU_PRESET;
	return {
		...repaired,
		gradeMin,
		gradeMax,
		gradeStep: (gradeMax - gradeMin) / 8,
		deansListMinUnits: Math.max(0, repaired.deansListMinUnits)
	};
}

/**
 * Fixes what schemas can't see. Lists are keyed by id, so a repeated id would crash rendering on
 * every load, and a bad grade scale would hang it.
 */
export function repairState(state: AppState): AppState {
	const seen = new Set<string>();

	return {
		...state,
		terms: uniqueIds(state.terms, seen).map((term) => ({
			...term,
			courses: uniqueIds(term.courses, seen)
		})),
		courseChecklist: uniqueIds(state.courseChecklist, new Set()),
		universitySettings: repairSettings(state.universitySettings),
		customSettingsCache: state.customSettingsCache && repairSettings(state.customSettingsCache)
	};
}

/** For backups only: saved grades can sit outside a scale that the user has since changed */
export function clearInvalidGrades(
	terms: Term[],
	settings: UniversitySettings
): { terms: Term[]; cleared: number } {
	const { gradeMin, gradeMax, failingGrade } = settings;
	const isValid = (grade: number) =>
		(grade >= gradeMin && grade <= gradeMax) || grade === failingGrade;

	let cleared = 0;
	const cleaned = terms.map((term) => ({
		...term,
		courses: term.courses.map((course) => {
			if (course.grade === null || isValid(course.grade)) return course;
			cleared += 1;
			return { ...course, grade: null };
		})
	}));

	return { terms: cleaned, cleared };
}
