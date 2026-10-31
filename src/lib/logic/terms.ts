import type { Term } from '$lib/schemas';

const AUTO_NAME = /^Term \d+$/;

/** Keeps `Term N` names in step with position. Terms with any other name keep it. */
export function renumberTerms(terms: Term[]): Term[] {
	return terms.map((term, index) => {
		const name = `Term ${index + 1}`;
		return AUTO_NAME.test(term.name) && term.name !== name ? { ...term, name } : term;
	});
}

export function moveTerm(terms: Term[], from: number, to: number): Term[] {
	const next = [...terms];
	const [term] = next.splice(from, 1);
	next.splice(to, 0, term);
	return renumberTerms(next);
}

export function moveCourse(
	terms: Term[],
	courseId: string,
	fromTermId: string,
	toTermId: string
): Term[] {
	const course = terms.find((t) => t.id === fromTermId)?.courses.find((c) => c.id === courseId);
	if (!course) return terms;

	return terms.map((term) => {
		if (term.id === fromTermId) {
			return { ...term, courses: term.courses.filter((c) => c.id !== courseId) };
		}
		return term.id === toTermId ? { ...term, courses: [...term.courses, course] } : term;
	});
}

export function removeTerm(terms: Term[], id: string): Term[] {
	return renumberTerms(terms.filter((t) => t.id !== id));
}
