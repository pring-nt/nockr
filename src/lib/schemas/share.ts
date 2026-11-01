// src/lib/schemas/share.ts
import { z } from 'zod';
import { ThemeNameSchema } from './theme';

export const STICKER_MIN_SIZE = 50;
export const STICKER_MAX_SIZE = 110;

export const ShareLayoutSchema = z.enum(['stat-stack', 'honors-headline', 'scorecard']);

export const ShareSubjectSchema = z.enum(['term', 'cumulative']);

export const ShareFormatSchema = z.enum([
	'sticker', // Cropped to its content
	'9:16', // 1080 × 1920 — Story
	'3:4', // 1080 × 1440 — Portrait
	'1:1' // 1080 × 1080 — Square
]);

export const ShareInkSchema = z.enum(['white', 'black', 'theme']);

export const ShareTextWeightSchema = z.enum(['light', 'regular', 'medium', 'bold']);

export const ShareHighlightSchema = z.enum(['none', 'accent', 'gradient']);

export const ShareThemeSchema = z.enum(['site', ...ThemeNameSchema.options]);

export const ValueDisplaySchema = z.enum([
	'full', // 3.750
	'masked', // 3.XXX
	'hidden'
]);

export const ShareMessageSchema = z.enum([
	'another-term',
	'still-climbing',
	'one-step',
	'progress',
	'onward'
]);

export const ShareLayoutOptionsSchema = z.object({
	align: z.enum(['left', 'center']).default('center'),
	gpaDisplay: ValueDisplaySchema.default('full'),
	gradeDisplay: ValueDisplaySchema.default('full'),
	showHonors: z.boolean().default(true),
	showNotEarnedMessage: z.boolean().default(false),
	notEarnedMessage: ShareMessageSchema.default('another-term'),
	showCourses: z.boolean().default(true),
	showNonAcademic: z.boolean().default(false),
	showTrend: z.boolean().default(false),
	showCgpa: z.boolean().default(false)
});

export const ShareConfigSchema = z.object({
	layout: ShareLayoutSchema.default('stat-stack'),
	subject: ShareSubjectSchema.default('term'),
	format: ShareFormatSchema.default('sticker'),
	ink: ShareInkSchema.default('white'),
	highlight: ShareHighlightSchema.default('accent'),
	textWeight: ShareTextWeightSchema.default('regular'),
	theme: ShareThemeSchema.default('site'),
	shadowStrength: z.number().min(0).max(100).default(50),
	// Only fixed formats have room to place it. 0 and 100 are the canvas edges, 50 is centered
	stickerX: z.number().min(0).max(100).default(50).catch(50),
	stickerY: z.number().min(0).max(100).default(50).catch(50),
	stickerSize: z.number().min(STICKER_MIN_SIZE).max(STICKER_MAX_SIZE).default(100).catch(100),
	background: z.enum(['transparent', 'theme', 'photo']).default('transparent'),
	showWatermark: z.boolean().default(true),
	layouts: z
		.object({
			'stat-stack': ShareLayoutOptionsSchema.prefault({}),
			'honors-headline': ShareLayoutOptionsSchema.prefault({ showCourses: false }),
			scorecard: ShareLayoutOptionsSchema.prefault({ align: 'left' })
		})
		.prefault({})
});

export type ShareConfig = z.infer<typeof ShareConfigSchema>;
export type ShareLayout = z.infer<typeof ShareLayoutSchema>;
export type ShareLayoutOptions = z.infer<typeof ShareLayoutOptionsSchema>;
export type ShareSubject = z.infer<typeof ShareSubjectSchema>;
export type ShareFormat = z.infer<typeof ShareFormatSchema>;
export type ShareInk = z.infer<typeof ShareInkSchema>;
export type ShareMessage = z.infer<typeof ShareMessageSchema>;
export type ShareHighlight = z.infer<typeof ShareHighlightSchema>;
export type ShareTextWeight = z.infer<typeof ShareTextWeightSchema>;
export type ValueDisplay = z.infer<typeof ValueDisplaySchema>;
