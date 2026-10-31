import { z } from 'zod';

export const MAX_ID = 100;
export const MAX_COURSE_NAME = 100;
export const MAX_TERM_NAME = 60;
export const MAX_LABEL = 60;
export const MAX_PROGRAM_UNITS = 999;
export const MAX_COURSE_UNITS = 12;

export const MAX_CHECKLIST_PASTE_LINES = 300;
export const MAX_CHECKLIST_PASTE_CHARS = 20_000;
export const MAX_HEX_COLOR = 9;

export const MAX_BACKUP_BYTES = 2 * 1024 * 1024;
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_THEME_BYTES = 100 * 1024;

const HEX_COLOR = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

export function isHexColor(value: string): boolean {
	return HEX_COLOR.test(value);
}

/** Trims rather than rejects, so one long name can't fail a whole saved state */
export function boundedText(max: number) {
	return z.string().transform((text) => text.slice(0, max));
}

export function hexColor(fallback: string) {
	return z.string().regex(HEX_COLOR).catch(fallback);
}
