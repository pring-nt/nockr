// src/lib/stores/appState.ts
import { writable } from 'svelte/store';
import { AppStateSchema, type AppState } from '$lib/schemas';
import { DLSU_PRESET, DEFAULT_GE_LIST } from '$lib/constants';

const STORAGE_KEY = 'nockr_state';

interface UnvalidatedCourse {
	id?: unknown;
	name?: unknown;
	units?: unknown;
	grade?: unknown;
}

interface UnvalidatedTerm {
	id?: unknown;
	name?: unknown;
	courses?: unknown;
}

function buildFreshState(): AppState {
	return AppStateSchema.parse({
		universitySettings: DLSU_PRESET,
		customSettingsCache: undefined,
		geChecklist: DEFAULT_GE_LIST.map((item) => ({
			...item,
			completed: false,
			isCustom: false
		})),
		terms: []
	});
}

function getInitialState(): AppState {
	if (typeof localStorage === 'undefined') {
		return buildFreshState();
	}

	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return buildFreshState();

		const json = JSON.parse(raw);
		const parsed = AppStateSchema.safeParse(json);

		// 1. Direct validation pass
		if (parsed.success) {
			return parsed.data;
		}

		console.warn(
			'[Nockr] Saved state schema mismatch, running field-level recovery:',
			parsed.error.issues
		);

		// Fallback Recovery: Reconstruct user terms and courses safely
		const rawTerms = Array.isArray(json?.terms) ? (json.terms as UnvalidatedTerm[]) : [];
		const recoveredTerms = rawTerms.map((term) => {
			const rawCourses = Array.isArray(term?.courses) ? (term.courses as UnvalidatedCourse[]) : [];
			return {
				id: typeof term?.id === 'string' ? term.id : crypto.randomUUID(),
				name: typeof term?.name === 'string' ? term.name : 'Untitled Term',
				courses: rawCourses.map((c) => ({
					id: typeof c?.id === 'string' ? c.id : crypto.randomUUID(),
					name: typeof c?.name === 'string' ? c.name : '',
					units: typeof c?.units === 'number' ? c.units : 3,
					grade: typeof c?.grade === 'number' ? c.grade : null
				}))
			};
		});

		const recoveryCandidate = {
			...json,
			terms: recoveredTerms,
			universitySettings: json?.universitySettings ?? DLSU_PRESET,
			customSettingsCache: json?.customSettingsCache ?? undefined,
			geChecklist: Array.isArray(json?.geChecklist)
				? json.geChecklist
				: DEFAULT_GE_LIST.map((item) => ({ ...item, completed: false, isCustom: false }))
		};

		const secondAttempt = AppStateSchema.safeParse(recoveryCandidate);
		if (secondAttempt.success) {
			return secondAttempt.data;
		}

		// Final safeguard merge
		const fresh = buildFreshState();
		return {
			...fresh,
			terms: recoveredTerms,
			customSettingsCache: json?.customSettingsCache
		};
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

		resetGEChecklist() {
			store.update((state) => {
				const next: AppState = {
					...state,
					geChecklist: DEFAULT_GE_LIST.map((item) => ({
						...item,
						completed: false,
						isCustom: false
					}))
				};
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
