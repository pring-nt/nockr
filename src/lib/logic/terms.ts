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

export function removeTerm(terms: Term[], id: string): Term[] {
	return renumberTerms(terms.filter((t) => t.id !== id));
}
