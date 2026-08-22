import { writable } from 'svelte/store';
import { AppStateSchema, type AppState } from '$lib/schemas';
import { DLSU_PRESET, DEFAULT_GE_LIST } from '$lib/constants';

const STORAGE_KEY = 'nockr_state';

function buildFreshState(): AppState {
	return AppStateSchema.parse({
		theme: {
			active: 'rose-pine'
		},
		universitySettings: DLSU_PRESET,
		geChecklist: DEFAULT_GE_LIST.map((item) => ({
			...item,
			completed: false,
			isCustom: false
		}))
	});
}

function getInitialState(): AppState {
	if (typeof localStorage === 'undefined') {
		return buildFreshState();
	}

	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return buildFreshState();

		const parsed = AppStateSchema.safeParse(JSON.parse(raw));
		if (parsed.success) return parsed.data;

		console.warn('[Nockr] Saved state schema mismatch, resetting to defaults.');
	} catch (error) {
		console.warn('[Nockr] Failed to read state from localStorage:', error);
	}

	return buildFreshState();
}

function createAppStore() {
	const store = writable<AppState>(getInitialState());

	function persist(state: AppState) {
		if (typeof localStorage !== 'undefined') {
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
			} catch (error) {
				console.error('[Nockr] Failed to persist state:', error);
			}
		}
	}

	return {
		subscribe: store.subscribe,

		set(value: AppState) {
			persist(value);
			store.set(value);
		},

		update(fn: (state: AppState) => AppState) {
			store.update((state) => {
				const next = fn(state);
				persist(next);
				return next;
			});
		},

		reset() {
			const fresh = buildFreshState();
			persist(fresh);
			store.set(fresh);
		}
	};
}

export const appStore = createAppStore();
