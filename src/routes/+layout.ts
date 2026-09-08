import { browser, dev } from '$app/environment';
import { injectAnalytics } from '@vercel/analytics/sveltekit';

if (browser) {
	const isVercel = window.location.hostname.includes('vercel');

	if (isVercel) {
		injectAnalytics({ mode: dev ? 'development' : 'production' });
	}
}
