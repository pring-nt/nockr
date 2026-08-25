import type { ThemeName, ThemeSettings } from '$lib/schemas';

export interface ThemeMeta {
	name: ThemeName;
	label: string;
	isDark: boolean;
}

export const THEMES: ThemeMeta[] = [
	{ name: 'rose-pine', label: 'Rosé Pine', isDark: true },
	{ name: 'rose-pine-dawn', label: 'Rosé Pine Dawn', isDark: false },
	{ name: 'catppuccin-mocha', label: 'Catppuccin Mocha', isDark: true },
	{ name: 'catppuccin-latte', label: 'Catppuccin Latte', isDark: false },
	{ name: 'tokyo-night', label: 'Tokyo Night', isDark: true },
	{ name: 'tokyo-light', label: 'Tokyo Light', isDark: false },
	{ name: 'gruvbox-dark', label: 'Gruvbox Dark', isDark: true },
	{ name: 'gruvbox-light', label: 'Gruvbox Light', isDark: false },
	{ name: 'atom-one-dark', label: 'Atom One Dark', isDark: true },
	{ name: 'dracula', label: 'Dracula', isDark: true },
	{ name: 'nord', label: 'Nord', isDark: true },
	{ name: 'solarized-dark', label: 'Solarized Dark', isDark: true },
	{ name: 'solarized-light', label: 'Solarized Light', isDark: false },
	{ name: 'custom', label: 'Custom', isDark: true }
];

const CUSTOM_VAR_MAP: Record<keyof Required<NonNullable<ThemeSettings['custom']>>, string> = {
	base: '--custom-base',
	surface: '--custom-surface',
	overlay: '--custom-overlay',
	mutedColor: '--custom-muted-color',
	subtle: '--custom-subtle',
	text: '--custom-text',
	love: '--custom-love',
	gold: '--custom-gold',
	rose: '--custom-rose',
	pine: '--custom-pine',
	foam: '--custom-foam',
	iris: '--custom-iris',
	highlightLow: '--custom-highlight-low',
	highlightMed: '--custom-highlight-med',
	highlightHigh: '--custom-highlight-high'
};

/** Apply a theme to the document root */
export function applyTheme(settings: ThemeSettings): void {
	if (typeof document === 'undefined') return; // SSR guard

	const root = document.documentElement;
	root.setAttribute('data-theme', settings.active);

	// If custom theme, inject the user's CSS variables
	if (settings.active === 'custom' && settings.custom) {
		for (const [key, cssVar] of Object.entries(CUSTOM_VAR_MAP)) {
			const value = settings.custom[key as keyof typeof settings.custom];
			if (value) {
				root.style.setProperty(cssVar, value);
			}
		}
	} else {
		// Clear any previously set custom vars
		for (const cssVar of Object.values(CUSTOM_VAR_MAP)) {
			root.style.removeProperty(cssVar);
		}
	}
}
