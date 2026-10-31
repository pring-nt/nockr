import { writable } from 'svelte/store';
import { ShareConfigSchema, type ShareConfig } from '$lib/schemas';

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
			if (typeof localStorage !== 'undefined') {
				try {
					localStorage.setItem(SHARE_STORAGE_KEY, JSON.stringify(next));
				} catch (e) {
					console.error('[Nockr] Failed to save export settings:', e);
				}
			}
			return next;
		});
	}

	return { subscribe, update };
}

export const shareStore = createShareStore();
