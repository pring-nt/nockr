import { writable } from 'svelte/store';
import { ThemeSettingsSchema, type ThemeSettings } from '$lib/schemas';

const THEME_STORAGE_KEY = 'nockr_theme';
const LEGACY_STORAGE_KEY = 'nockr_state';

const DEFAULT_THEME: ThemeSettings = ThemeSettingsSchema.parse({});

function getInitialTheme(): ThemeSettings {
	if (typeof localStorage === 'undefined') return DEFAULT_THEME;

	try {
		// 1. Primary check: Dedicated theme key
		const raw = localStorage.getItem(THEME_STORAGE_KEY);
		if (raw) {
			const parsed = JSON.parse(raw);
			const result = ThemeSettingsSchema.safeParse(parsed);
			if (result.success) return result.data;
		}

		// 2. Legacy Migration Fallback: Read theme from nockr_state
		const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
		if (legacyRaw) {
			const parsed = JSON.parse(legacyRaw);
			if (parsed?.theme) {
				const result = ThemeSettingsSchema.safeParse(parsed.theme);
				if (result.success) {
					localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(result.data));
					return result.data;
				}
			}
		}
	} catch (e) {
		console.warn('[Nockr] Failed to load theme state:', e);
	}

	return DEFAULT_THEME;
}

function createThemeStore() {
	const store = writable<ThemeSettings>(getInitialTheme());

	const { subscribe, set: internalSet, update: internalUpdate } = store;

	// Multi-tab sync for theme changes
	if (typeof window !== 'undefined') {
		window.addEventListener('storage', (e) => {
			if (e.key !== THEME_STORAGE_KEY) return;

			if (e.newValue === null) {
				internalSet(DEFAULT_THEME);
				return;
			}

			try {
				const json = JSON.parse(e.newValue);
				const parsed = ThemeSettingsSchema.safeParse(json);
				if (parsed.success) {
					internalSet(parsed.data);
				}
			} catch (error) {
				console.error('[Nockr] Multi-tab theme sync parse failure:', error);
			}
		});
	}

	function set(value: ThemeSettings) {
		if (typeof localStorage !== 'undefined') {
			try {
				localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(value));
			} catch (e) {
				console.error('[Nockr] Failed to save theme state:', e);
			}
		}
		internalSet(value);
	}

	function update(fn: (state: ThemeSettings) => ThemeSettings) {
		internalUpdate((current) => {
			const next = fn(current);
			if (typeof localStorage !== 'undefined') {
				try {
					localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(next));
				} catch (e) {
					console.error('[Nockr] Failed to save theme state:', e);
				}
			}
			return next;
		});
	}

	return {
		subscribe,
		set,
		update
	};
}

export const themeStore = createThemeStore();
