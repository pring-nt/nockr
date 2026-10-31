import { z } from 'zod';
import {
	MAX_COURSE_UNITS,
	MAX_IMPORT_BYTES,
	TermSchema,
	type Course,
	type CourseResult,
	type CourseType,
	type Term
} from '$lib/schemas';
import type { ChecklistSeed } from './checklist';

export type ImportResult =
	| { status: 'ok'; terms: Term[]; checklist: ChecklistSeed[]; skipped: number }
	| { status: 'empty'; message: string }
	| { status: 'error'; message: string };

interface RawRow {
	term: string;
	courseCode: string;
	credits: number;
	grade: number | null;
	status: string;
	type: CourseType;
	result: CourseResult;
	enrolled: boolean;
}

const PLANNED_STATUS = 'yet to register';
const MAX_ARCHERSHUB_GRADE = 4;
const INCLUDE_STATUSES = ['passed', 'failed', 'registered', 'credited', PLANNED_STATUS];

const STATUS_RESULTS: Record<string, CourseResult> = {
	passed: 'passed',
	failed: 'failed',
	credited: 'passed',
	registered: 'pending'
};

function parseGrade(raw: string): number | null {
	const cleaned = raw.trim().replace(/^'+/, '').replace(/'+$/, '');
	if (!cleaned || cleaned === '-') return null;
	const num = parseFloat(cleaned);
	return isNaN(num) ? null : num;
}

function extractTrimesterNumber(termName: string): number {
	const match = termName.match(/\d+/);
	return match ? parseInt(match[0], 10) : 999;
}

function classifyCourse(
	courseCode: string,
	credits: number,
	grade: number | null,
	status: string
): CourseType {
	if (status === 'credited') return 'credited';

	// 0-credit courses (SAS, LASARE, NSTP orientations) and pass/fail courses with no
	// numeric grade (PASSED, E) carry no GPA weight. LCLS (Lasallian Studies 1/2/3) and
	// NSTP have credits but are not counted toward GPA per DLSU policy
	if (credits === 0 || courseCode.startsWith('LCLS') || courseCode.startsWith('NSTP')) {
		return 'non-academic';
	}
	return status === 'passed' && grade === null ? 'non-academic' : 'graded';
}

/** A wrong table should lose the odd row, never reach the store with values schemas reject */
function isUsableRow(row: RawRow): boolean {
	const hasValidGrade = row.grade === null || (row.grade >= 0 && row.grade <= MAX_ARCHERSHUB_GRADE);
	return (
		Boolean(row.courseCode) && hasValidGrade && row.credits >= 0 && row.credits <= MAX_COURSE_UNITS
	);
}

function parseHTMLTable(html: string): RawRow[] {
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, 'text/html');
	const rows = Array.from(doc.querySelectorAll('table tr'));

	// Column order:
	// [0] Session | [1] Term | [2] College/School Code (course code) |
	// [3] Course (full name) | [4] Type | [5] Credits | [6] INC |
	// [7] Grades | [8] Status
	return rows.slice(1).flatMap((row) => {
		const cells = Array.from(row.querySelectorAll('td')).map((td) => td.textContent?.trim() ?? '');

		if (cells.length < 9) return [];

		const [sessionRaw, term, courseCodeRaw, , , creditsRaw, , gradesRaw, statusRaw] = cells;

		const status = statusRaw.trim().toLowerCase();
		if (!INCLUDE_STATUSES.includes(status)) return [];

		// Session is '-' for curriculum placeholders, so only real enrollments have an
		// academic year here. Credited courses were never enrolled in, and planned ones are kept
		// for the checklist
		const session = sessionRaw.trim().replace(/^'+/, '').replace(/'+$/, '');
		const enrolled = Boolean(session) && session !== '-';
		if (!enrolled && status !== 'credited' && status !== PLANNED_STATUS) return [];

		const credits = parseFloat(creditsRaw);
		if (isNaN(credits)) return [];

		const courseCode = courseCodeRaw.trim();
		const parsedGrade = parseGrade(gradesRaw);
		const grade = status === 'failed' ? (parsedGrade ?? 0) : parsedGrade;
		const type = classifyCourse(courseCode, credits, grade, status);

		return [
			{
				term: term.trim(),
				courseCode,
				credits: Math.round(credits),
				grade,
				status,
				type,
				result: type === 'graded' ? 'pending' : STATUS_RESULTS[status],
				enrolled
			}
		];
	});
}

function deduplicateRows(rows: RawRow[]): RawRow[] {
	const seen = new Map<string, RawRow>();
	const rank = (row: RawRow) => (row.enrolled ? 2 : 0) + (row.grade !== null ? 1 : 0);

	for (const row of rows) {
		const key = `${row.term}::${row.courseCode}`;
		const existing = seen.get(key);

		if (!existing || rank(row) > rank(existing)) {
			seen.set(key, row);
		}
	}

	return Array.from(seen.values());
}

function toCourse(row: RawRow): Course {
	return {
		id: crypto.randomUUID(),
		name: row.courseCode,
		units: row.credits,
		grade: row.grade,
		type: row.type,
		result: row.result
	};
}

/** The rest of the curriculum, once per course code even when the export repeats a row */
function toChecklistSeeds(rows: RawRow[]): ChecklistSeed[] {
	const planned = rows.filter((r) => r.status === PLANNED_STATUS);
	const seen = new Map(planned.map((r) => [r.courseCode, r]));

	return Array.from(seen.values()).map((r) => ({
		label: r.courseCode,
		units: r.credits,
		type: r.type
	}));
}

export async function parseGradeExport(file: File): Promise<ImportResult> {
	if (file.size > MAX_IMPORT_BYTES) {
		return { status: 'error', message: 'That file is too large to be a grade export.' };
	}

	try {
		const html = await file.text();

		if (!html.trim().startsWith('<') || !/<table[\s>]/i.test(html)) {
			return {
				status: 'error',
				message: 'File does not appear to be a valid ArchersHub grade export.'
			};
		}

		const allRows = parseHTMLTable(html);
		const raw = allRows.filter(isUsableRow);
		const skipped = allRows.length - raw.length;
		const rows = deduplicateRows(raw.filter((r) => r.status !== PLANNED_STATUS));

		if (rows.length === 0) {
			return {
				status: 'empty',
				message: 'No courses found. Make sure you exported from Core Courses.'
			};
		}

		// Separate completed (passed & failed) courses from registered courses
		const completedRows = rows.filter((r) => r.status !== 'registered');
		const registeredRows = rows.filter((r) => r.status === 'registered');

		// Group completed courses by original term name
		const termMap = new Map<string, RawRow[]>();
		for (const row of completedRows) {
			if (!termMap.has(row.term)) termMap.set(row.term, []);
			termMap.get(row.term)!.push(row);
		}

		// Sort and label completed terms
		const terms: Term[] = Array.from(termMap.entries())
			.sort(([a], [b]) => extractTrimesterNumber(a) - extractTrimesterNumber(b))
			.map(([, termRows], index) => ({
				id: crypto.randomUUID(),
				name: `Term ${index + 1}`,
				courses: termRows.map(toCourse)
			}));

		// Append registered courses in their own sequential term with blank (null) grades
		if (registeredRows.length > 0) {
			terms.push({
				id: crypto.randomUUID(),
				name: `Term ${terms.length + 1}`,
				courses: registeredRows.map(toCourse)
			});
		}

		const parsedTerms = z.array(TermSchema).safeParse(terms);
		if (!parsedTerms.success) {
			return { status: 'error', message: 'Some courses in that file could not be read.' };
		}

		return { status: 'ok', terms: parsedTerms.data, checklist: toChecklistSeeds(raw), skipped };
	} catch (err) {
		console.error('[Nockr] Failed to read grade export:', err);
		return { status: 'error', message: 'That file could not be read.' };
	}
}
