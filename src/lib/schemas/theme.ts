import { z } from 'zod';
import { hexColor } from './limits';

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
	'dlsu-green-dark',
	'dlsu-green-light',
	'admu-blue-dark',
	'admu-blue-light',
	'up-maroon-dark',
	'up-maroon-light',
	'ust-yellow-dark',
	'ust-yellow-light',
	'custom'
]);

export const CustomThemeSchema = z.object({
	base: hexColor('#191724'),
	surface: hexColor('#1f1d2e'),
	overlay: hexColor('#26233a'),
	mutedColor: hexColor('#6e6a86'),
	subtle: hexColor('#908caa'),
	text: hexColor('#e0def4'),
	love: hexColor('#eb6f92'),
	gold: hexColor('#f6c177'),
	rose: hexColor('#ebbcba'),
	pine: hexColor('#31748f'),
	foam: hexColor('#9ccfd8'),
	iris: hexColor('#c4a7e7'),
	highlightLow: hexColor('#21202e'),
	highlightMed: hexColor('#403d52'),
	highlightHigh: hexColor('#524f67')
});

export const ThemeSettingsSchema = z.object({
	active: ThemeNameSchema.default('rose-pine'),
	custom: CustomThemeSchema.optional()
});

export type ThemeName = z.infer<typeof ThemeNameSchema>;
export type CustomTheme = z.infer<typeof CustomThemeSchema>;
export type ThemeSettings = z.infer<typeof ThemeSettingsSchema>;
