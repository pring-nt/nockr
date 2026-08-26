import { toPng } from 'html-to-image';
import type { ShareConfig, AspectRatio, GradeDisplayMode } from '$lib/schemas';
import { ASPECT_RATIO_DIMENSIONS } from '$lib/constants';

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

export async function captureCanvas(el: HTMLElement, config: ShareConfig): Promise<string> {
	if (typeof document !== 'undefined') {
		await document.fonts.ready;
	}

	let backgroundColor: string | undefined;

	if (config.background === 'solid' && typeof document !== 'undefined') {
		backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--base').trim();
	} else if (config.background === 'transparent') {
		backgroundColor = undefined;
	}

	return toPng(el, {
		pixelRatio: 2,
		...(backgroundColor !== undefined && { backgroundColor })
	});
}

export function getCanvasDimensions(ratio: AspectRatio): { width: number; height: number } {
	return ASPECT_RATIO_DIMENSIONS[ratio];
}

export function maskGpa(gpa: number): string {
	return `${Math.floor(gpa)}.XX`;
}

export function maskGrade(grade: number | null, mode: GradeDisplayMode): string | null {
	if (grade === null) return null;

	switch (mode) {
		case 'full':
			return grade.toFixed(2);
		case 'masked':
			return `${Math.floor(grade)}.XX`;
		case 'hidden':
			return null;
	}
}
