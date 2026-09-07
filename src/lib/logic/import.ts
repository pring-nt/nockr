import type { Term, Course } from '$lib/schemas';

export type ImportResult =
	| { status: 'ok'; terms: Term[] }
	| { status: 'empty'; message: string }
	| { status: 'error'; message: string };

interface RawRow {
	term: string;
	courseCode: string;
	credits: number;
	grade: number;
	status: string;
}

const INCLUDE_STATUSES = ['passed'];

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

		const [sessionRaw, term, courseCode, , , creditsRaw, , gradesRaw, statusRaw] = cells;

		// Session is '-' for all curriculum placeholders — only real
		// enrollments have an actual academic year in this column
		const session = sessionRaw.trim().replace(/^'+/, '').replace(/'+$/, '');
		if (!session || session === '-') return [];

		const status = statusRaw.trim().toLowerCase();
		const credits = parseFloat(creditsRaw);

		// Only completed graded courses
		if (!INCLUDE_STATUSES.includes(status)) return [];

		// Skip 0-credit courses (SAS, LASARE, NSTP orientations)
		if (isNaN(credits) || credits === 0) return [];

		// LCLS (Lasallian Studies 1/2/3) have 1 credit but are not
		// counted toward GPA per DLSU policy
		if (courseCode.trim().startsWith('LCLS')) return [];

		const grade = parseGrade(gradesRaw);

		// Skip pass/fail courses with no numeric grade (PASSED, E, INC etc.)
		if (grade === null) return [];

		return [
			{
				term: term.trim(),
				courseCode: courseCode.trim(),
				credits: Math.round(credits),
				grade,
				status
			}
		];
	});
}

function deduplicateRows(rows: RawRow[]): RawRow[] {
	const seen = new Map<string, RawRow>();

	for (const row of rows) {
		const key = `${row.term}::${row.courseCode}`;
		const existing = seen.get(key);

		if (!existing) {
			seen.set(key, row);
		} else if (existing.grade === null && row.grade !== null) {
			seen.set(key, row);
		}
	}

	return Array.from(seen.values());
}

export async function parseGradeExport(file: File): Promise<ImportResult> {
	try {
		const html = await file.text();

		if (!html.trim().toLowerCase().startsWith('<')) {
			return {
				status: 'error',
				message: 'File does not appear to be a valid Archers.Hub grade export.'
			};
		}

		const raw = parseHTMLTable(html);
		const rows = deduplicateRows(raw);

		if (rows.length === 0) {
			return {
				status: 'empty',
				message: 'No graded courses found. Make sure you exported from Core Courses.'
			};
		}

		// Group by original term name for sorting purposes only
		const termMap = new Map<string, RawRow[]>();
		for (const row of rows) {
			if (!termMap.has(row.term)) termMap.set(row.term, []);
			termMap.get(row.term)!.push(row);
		}

		// Sort by trimester number extracted from the original name,
		// then rename sequentially to 'Term 1', 'Term 2', etc.
		const terms: Term[] = Array.from(termMap.entries())
			.sort(([a], [b]) => extractTrimesterNumber(a) - extractTrimesterNumber(b))
			.map(([, termRows], index) => ({
				id: crypto.randomUUID(),
				name: `Term ${index + 1}`,
				courses: termRows.map((r): Course => ({
					id: crypto.randomUUID(),
					name: r.courseCode,
					units: r.credits,
					grade: r.grade
				}))
			}));

		return { status: 'ok', terms };
	} catch (err) {
		return {
			status: 'error',
			message: `Failed to parse file: ${String(err)}`
		};
	}
}
