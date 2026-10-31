import { toast } from 'svelte-sonner';

const TOAST_ID = 'storage-failed';
const failingKeys = new Set<string>();

/** The page keeps working after a failed write, so the failure has to be shown */
export function saveToStorage(key: string, value: unknown) {
	if (typeof localStorage === 'undefined') return;

	try {
		localStorage.setItem(key, JSON.stringify(value));
		if (failingKeys.delete(key) && failingKeys.size === 0) toast.dismiss(TOAST_ID);
	} catch (error) {
		console.error(`[Nockr] Failed to save ${key}:`, error);
		failingKeys.add(key);
		toast.error('Your changes are not being saved', {
			id: TOAST_ID,
			description:
				'Your browser storage is full or blocked. Download a backup from Settings before you leave this page.',
			duration: Number.POSITIVE_INFINITY
		});
	}
}
