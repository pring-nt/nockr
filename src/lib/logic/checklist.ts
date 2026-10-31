import {
	ChecklistItemSchema,
	CourseSchema,
	type ChecklistItem,
	type Course,
	type Term,
	type UniversitySettings
} from '$lib/schemas';
import { DLSU_CHECKLIST } from '$lib/constants';
import { isCourseFinished, isCoursePassed } from './gpa';

export type ChecklistStatus = 'open' | 'planned' | 'failed' | 'done';

export interface ChecklistState {
	status: ChecklistStatus;
	termName: string | null;
}

export type ChecklistSeed = Pick<ChecklistItem, 'label' | 'units' | 'type'>;

export type ChecklistDragItem = ChecklistItem & { fromChecklist: true };

interface Placement {
	term: Term;
	course: Course;
}

function normalize(label: string): string {
	return label.trim().toLowerCase();
}

function findPlacements(terms: Term[], label: string): Placement[] {
	const target = normalize(label);
	if (!target) return [];

	return terms.flatMap((term) =>
		term.courses.filter((c) => normalize(c.name) === target).map((course) => ({ term, course }))
	);
}

export function getChecklistState(
	item: ChecklistItem,
	terms: Term[],
	settings: UniversitySettings
): ChecklistState {
	const placements = findPlacements(terms, item.label);

	const passed = placements.findLast((p) => isCoursePassed(p.course, settings));
	if (passed) return { status: 'done', termName: passed.term.name };
	if (item.completed) return { status: 'done', termName: null };

	const planned = placements.findLast((p) => !isCourseFinished(p.course));
	if (planned) return { status: 'planned', termName: planned.term.name };

	const failed = placements.at(-1);
	return failed
		? { status: 'failed', termName: failed.term.name }
		: { status: 'open', termName: null };
}

/**
 * Puts a checklist course into a term. The latest copy moves there with its grade, unless it
 * failed: that stays on record, so the course is added again as a retake.
 */
export function placeChecklistItem(
	terms: Term[],
	item: ChecklistItem,
	targetTermId: string,
	settings: UniversitySettings,
	index?: number
): Term[] {
	const latest = findPlacements(terms, item.label).at(-1);
	const isMove =
		latest && (!isCourseFinished(latest.course) || isCoursePassed(latest.course, settings));

	const course = isMove
		? latest.course
		: CourseSchema.parse({
				id: crypto.randomUUID(),
				name: item.label.trim(),
				units: item.units,
				type: item.type
			});

	return terms.map((term) => {
		const courses = term.courses.filter((c) => c.id !== course.id);
		if (term.id === targetTermId) {
			courses.splice(index ?? courses.length, 0, course);
			return { ...term, courses };
		}
		return courses.length === term.courses.length ? term : { ...term, courses };
	});
}

/** Adds new courses by label. Existing ones take the seed's units and type and stay in place. */
export function mergeChecklist(items: ChecklistItem[], seeds: ChecklistSeed[]): ChecklistItem[] {
	const merged = [...items];

	for (const seed of seeds) {
		const index = merged.findIndex((item) => normalize(item.label) === normalize(seed.label));
		if (index === -1) {
			merged.push(ChecklistItemSchema.parse({ ...seed, id: crypto.randomUUID() }));
		} else {
			merged[index] = { ...merged[index], units: seed.units, type: seed.type };
		}
	}

	return merged;
}

/** Reads one course per line as `CODE` or `CODE, units`. Tabs work too, for spreadsheet pastes. */
export function parseChecklistLines(text: string): ChecklistSeed[] {
	return text.split(/\r?\n/).flatMap((line): ChecklistSeed[] => {
		const [labelRaw, unitsRaw] = line.split(/[,\t]/);
		const label = labelRaw.trim();
		if (!label) return [];

		const parsed = parseInt(unitsRaw ?? '', 10);
		const units = isNaN(parsed) ? 3 : Math.max(0, Math.min(12, parsed));
		return [{ label, units, type: units === 0 ? 'non-academic' : 'graded' }];
	});
}

export function defaultChecklist(mode: UniversitySettings['mode']): ChecklistItem[] {
	if (mode !== 'dlsu') return [];
	return DLSU_CHECKLIST.map((item) => ChecklistItemSchema.parse(item));
}

/** Empty or still the stock list, so it is safe to swap when the university changes */
export function isUntouchedChecklist(items: ChecklistItem[]): boolean {
	if (items.length === 0) return true;
	if (items.length !== DLSU_CHECKLIST.length) return false;

	return items.every((item, index) => {
		const stock = DLSU_CHECKLIST[index];
		return item.id === stock.id && item.label === stock.label && !item.completed;
	});
}
