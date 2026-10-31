import { writable } from 'svelte/store';
import { ShareConfigSchema, type ShareConfig, type ShareLayoutOptions } from '$lib/schemas';
import { saveToStorage } from './persist';

const SHARE_STORAGE_KEY = 'nockr_share';

const DEFAULT_CONFIG: ShareConfig = ShareConfigSchema.parse({});

function getInitialConfig(): ShareConfig {
	if (typeof localStorage === 'undefined') return DEFAULT_CONFIG;

	try {
		const raw = localStorage.getItem(SHARE_STORAGE_KEY);
		if (raw) {
			const result = ShareConfigSchema.safeParse(JSON.parse(raw));
			if (result.success) return result.data;
		}
	} catch (e) {
		console.warn('[Nockr] Failed to load export settings:', e);
	}

	return DEFAULT_CONFIG;
}

function createShareStore() {
	const { subscribe, update: internalUpdate } = writable<ShareConfig>(getInitialConfig());

	function update(fn: (state: ShareConfig) => ShareConfig) {
		internalUpdate((current) => {
			const next = fn(current);
			saveToStorage(SHARE_STORAGE_KEY, next);
			return next;
		});
	}

	function setConfig(changes: Partial<ShareConfig>) {
		update((state) => ({ ...state, ...changes }));
	}

	function setOptions(changes: Partial<ShareLayoutOptions>) {
		update((state) => ({
			...state,
			layouts: { ...state.layouts, [state.layout]: { ...state.layouts[state.layout], ...changes } }
		}));
	}

	return { subscribe, update, setConfig, setOptions };
}

export const shareStore = createShareStore();
