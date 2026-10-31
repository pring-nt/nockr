import { toBlob } from 'html-to-image';
import type {
	Course,
	ShareLayoutOptions,
	ShareSubject,
	Term,
	UniversitySettings,
	ValueDisplay
} from '$lib/schemas';
import { computeCGPA, computeTGPA, computeUnitsEarned } from '$lib/logic/gpa';
import { getDeansListTier, getLatinHonorsTier, isNoFailDisqualified } from '$lib/logic/honors';

export interface ShareRow {
	id: string;
	label: string;
	value: string | null;
	isMuted?: boolean;
}

export interface ShareData {
	heading: string;
	gpaLabel: string;
	gpa: string | null;
	honor: string | null;
	honorEarned: boolean;
	courses: ShareRow[];
	stats: ShareRow[];
	cgpa: ShareRow | null;
	trend: number[];
}

const NOT_EARNED_MESSAGE = {
	term: 'Another term down :)',
	cumulative: 'Still climbing :)'
};

const THEME_TOKENS = [
	'--base',
	'--surface',
	'--overlay',
	'--muted-color',
	'--subtle',
	'--text',
	'--love',
	'--gold',
	'--rose',
	'--pine',
	'--foam',
	'--iris',
	'--highlight-low',
	'--highlight-med',
	'--highlight-high',
	'--background',
	'--foreground',
	'--card',
	'--card-foreground',
	'--primary',
	'--primary-foreground',
	'--secondary',
	'--secondary-foreground',
	'--muted',
	'--muted-foreground',
	'--accent',
	'--accent-foreground',
	'--destructive',
	'--destructive-foreground',
	'--border',
	'--input',
	'--ring'
] as const;

export function getThemeStyles(): Record<string, string> {
	if (typeof document === 'undefined') return {};
	const computed = getComputedStyle(document.documentElement);
	const styles: Record<string, string> = {};

	for (const token of THEME_TOKENS) {
		const val = computed.getPropertyValue(token).trim();
		if (val) styles[token] = val;
	}

	return styles;
}

export async function captureCanvas(el: HTMLElement): Promise<Blob> {
	await document.fonts.ready;

	const blob = await toBlob(el, { pixelRatio: 2 });
	if (!blob) throw new Error('Canvas capture returned nothing');
	return blob;
}

export function formatGpa(gpa: number | null, mode: ValueDisplay): string | null {
	if (gpa === null || mode === 'hidden') return null;
	return mode === 'masked' ? `${Math.floor(gpa)}.XXX` : gpa.toFixed(3);
}

export function formatCourseGrade(course: Course, mode: ValueDisplay): string | null {
	if (mode === 'hidden') return null;
	if (course.type === 'credited') return 'CR';
	if (course.type === 'non-academic') {
		if (course.result === 'pending') return null;
		return course.result === 'passed' ? 'P' : 'F';
	}
	if (course.grade === null) return null;
	return mode === 'masked' ? `${Math.floor(course.grade)}.XX` : course.grade.toFixed(2);
}

/** TGPA per term scaled to 0-1, where 1 is always the best term regardless of gradeDirection */
export function getTrend(terms: Term[], settings: UniversitySettings): number[] {
	const values = terms.map(computeTGPA).filter((tgpa) => tgpa !== null);
	if (values.length < 2) return [];

	const min = Math.min(...values);
	const span = Math.max(...values) - min;
	if (span === 0) return values.map(() => 0.5);

	return values.map((value) => {
		const scaled = (value - min) / span;
		return settings.gradeDirection === 'ascending' ? scaled : 1 - scaled;
	});
}

function resolveHonor(
	tier: { label: string } | null,
	subject: ShareSubject,
	options: ShareLayoutOptions
): string | null {
	if (!options.showHonors) return null;
	if (tier) return tier.label;
	return options.showNotEarnedMessage ? NOT_EARNED_MESSAGE[subject] : null;
}

export function buildShareData({
	terms,
	term,
	subject,
	settings,
	options,
	courseModes
}: {
	terms: Term[];
	term: Term | undefined;
	subject: ShareSubject;
	settings: UniversitySettings;
	options: ShareLayoutOptions;
	courseModes: Record<string, ValueDisplay>;
}): ShareData {
	const cgpa = computeCGPA(terms);

	if (subject === 'cumulative' || !term) {
		const tier = isNoFailDisqualified(terms, settings) ? null : getLatinHonorsTier(cgpa, settings);
		return {
			heading: 'Cumulative',
			gpaLabel: 'CGPA',
			gpa: formatGpa(cgpa, options.gpaDisplay),
			honor: resolveHonor(tier, 'cumulative', options),
			honorEarned: tier !== null,
			courses: [],
			stats: [
				{ id: 'units', label: 'Units earned', value: String(computeUnitsEarned(terms, settings)) },
				{ id: 'terms', label: 'Terms', value: String(terms.length) }
			],
			cgpa: null,
			trend: options.showTrend ? getTrend(terms, settings) : []
		};
	}

	const tgpa = computeTGPA(term);
	const tier = getDeansListTier(term, tgpa, settings);
	const courses = options.showCourses
		? term.courses.filter((course) => course.type === 'graded' || options.showNonAcademic)
		: [];

	return {
		heading: term.name,
		gpaLabel: 'TGPA',
		gpa: formatGpa(tgpa, options.gpaDisplay),
		honor: resolveHonor(tier, 'term', options),
		honorEarned: tier !== null,
		courses: courses.map((course) => ({
			id: course.id,
			label: course.name || 'Untitled Course',
			value: formatCourseGrade(course, courseModes[course.id] ?? options.gradeDisplay),
			isMuted: course.type !== 'graded'
		})),
		stats: [],
		cgpa: options.showCgpa
			? {
					id: 'cgpa',
					label: 'CGPA',
					// Hiding the TGPA shouldn't also blank a CGPA that was asked for
					value: formatGpa(cgpa, options.gpaDisplay === 'masked' ? 'masked' : 'full')
				}
			: null,
		trend: options.showTrend
			? getTrend(terms.slice(0, terms.findIndex((t) => t.id === term.id) + 1), settings)
			: []
	};
}
