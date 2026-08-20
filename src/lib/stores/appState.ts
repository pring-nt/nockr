import { writable } from 'svelte/store';
import { AppStateSchema, type AppState } from '$lib/schemas';
import { DLSU_PRESET, DEFAULT_GE_LIST } from '$lib/constants';

const STORAGE_KEY = 'nockr_state';

function getInitialState(): AppState {
	if (typeof localStorage === 'undefined') {
		// SSR guard — SvelteKit can run on server, localStorage won't exist there
		return buildFreshState();
	}

	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return buildFreshState();

	const parsed = AppStateSchema.safeParse(JSON.parse(raw));
	if (parsed.success) return parsed.data;

	// Data in localStorage is corrupted or outdated — fall back to fresh
	console.warn('[Nockr] Failed to parse saved state, resetting to defaults.');
	return buildFreshState();
}

function buildFreshState(): AppState {
	return AppStateSchema.parse({
		universitySettings: DLSU_PRESET,
		geChecklist: DEFAULT_GE_LIST.map((item) => ({
			...item,
			completed: false,
			isCustom: false
		}))
	});
}

function createAppStore() {
	const { subscribe, set, update } = writable<AppState>(getInitialState());

	function persist(state: AppState) {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		}
	}

	return {
		subscribe,

		update(fn: (state: AppState) => AppState) {
			update((state) => {
				const next = fn(state);
				persist(next);
				return next;
			});
		},

		reset() {
			const fresh = buildFreshState();
			persist(fresh);
			set(fresh);
		}
	};
}

export const appStore = createAppStore();
