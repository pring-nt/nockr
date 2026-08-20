import type { ThemeName, ThemeSettings } from '$lib/schemas';

export interface ThemeMeta {
	name: ThemeName;
	label: string;
	isDark: boolean;
}

export const THEMES: ThemeMeta[] = [
	{ name: 'atom-one-dark', label: 'Atom One Dark', isDark: true },
	{ name: 'gruvbox-dark', label: 'Gruvbox Dark', isDark: true },
	{ name: 'gruvbox-light', label: 'Gruvbox Light', isDark: false },
	{ name: 'rose-pine', label: 'Rosé Pine', isDark: true },
	{ name: 'rose-pine-dawn', label: 'Rosé Pine Dawn', isDark: false },
	{ name: 'catppuccin-mocha', label: 'Catppuccin Mocha', isDark: true },
	{ name: 'catppuccin-latte', label: 'Catppuccin Latte', isDark: false },
	{ name: 'nord', label: 'Nord', isDark: true },
	{ name: 'dracula', label: 'Dracula', isDark: true },
	{ name: 'tokyo-night', label: 'Tokyo Night', isDark: true },
	{ name: 'tokyo-light', label: 'Tokyo Light', isDark: false },
	{ name: 'solarized-dark', label: 'Solarized Dark', isDark: true },
	{ name: 'solarized-light', label: 'Solarized Light', isDark: false },
	{ name: 'custom', label: 'Custom', isDark: true }
];

/** Apply a theme to the document root */
export function applyTheme(settings: ThemeSettings): void {
	if (typeof document === 'undefined') return; // SSR guard

	const root = document.documentElement;
	root.setAttribute('data-theme', settings.active);

	// If custom theme, inject the user's CSS variables
	if (settings.active === 'custom' && settings.custom) {
		const c = settings.custom;
		root.style.setProperty('--nockr-bg', c.background);
		root.style.setProperty('--nockr-surface', c.surface);
		root.style.setProperty('--nockr-primary', c.primary);
		root.style.setProperty('--nockr-text', c.text);
		root.style.setProperty('--nockr-accent', c.accent);
	} else {
		// Clear any previously set custom vars
		root.style.removeProperty('--nockr-bg');
		root.style.removeProperty('--nockr-surface');
		root.style.removeProperty('--nockr-primary');
		root.style.removeProperty('--nockr-text');
		root.style.removeProperty('--nockr-accent');
	}
}
