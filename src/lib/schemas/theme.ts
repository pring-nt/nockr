import { z } from 'zod';

export const ThemeNameSchema = z.enum([
	'atom-one-dark',
	'gruvbox-dark',
	'rose-pine',
	'catppuccin-mocha',
	'nord',
	'dracula',
	'tokyo-night',
	'solarized-dark',
	'custom'
]);

export const ThemeSettingsSchema = z.object({
	active: ThemeNameSchema.default('atom-one-dark'),
	mode: z.enum(['light', 'dark']).default('dark'),
	custom: z
		.object({
			background: z.string(),
			surface: z.string(),
			primary: z.string(),
			text: z.string(),
			accent: z.string()
		})
		.optional()
});

export type ThemeName = z.infer<typeof ThemeNameSchema>;
export type ThemeSettings = z.infer<typeof ThemeSettingsSchema>;
