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

export const CustomThemeSchema = z.object({
	base: z.string().default('#191724'),
	surface: z.string().default('#1f1d2e'),
	overlay: z.string().default('#26233a'),
	mutedColor: z.string().default('#6e6a86'),
	subtle: z.string().default('#908caa'),
	text: z.string().default('#e0def4'),
	love: z.string().default('#eb6f92'),
	gold: z.string().default('#f6c177'),
	rose: z.string().default('#ebbcba'),
	pine: z.string().default('#31748f'),
	foam: z.string().default('#9ccfd8'),
	iris: z.string().default('#c4a7e7'),
	highlightLow: z.string().default('#21202e'),
	highlightMed: z.string().default('#403d52'),
	highlightHigh: z.string().default('#524f67')
});

export const ThemeSettingsSchema = z.object({
	active: ThemeNameSchema.default('rose-pine'),
	custom: CustomThemeSchema.optional()
});

export type ThemeName = z.infer<typeof ThemeNameSchema>;
export type CustomTheme = z.infer<typeof CustomThemeSchema>;
export type ThemeSettings = z.infer<typeof ThemeSettingsSchema>;
