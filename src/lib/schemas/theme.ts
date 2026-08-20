import { z } from 'zod';

export const ThemeNameSchema = z.enum([
	'atom-one-dark',
	'gruvbox-dark',
	'gruvbox-light',
	'rose-pine',
	'rose-pine-dawn',
	'catppuccin-mocha',
	'catppuccin-latte',
	'nord',
	'dracula',
	'tokyo-night',
	'tokyo-light',
	'solarized-dark',
	'solarized-light',
	'custom'
]);

export const ThemeSettingsSchema = z.object({
	active: ThemeNameSchema.default('atom-one-dark'),
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
