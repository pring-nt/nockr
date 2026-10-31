<script lang="ts">
	import { page } from '$app/state';
	import { goto, afterNavigate } from '$app/navigation';
	import type { ValueDisplay } from '$lib/schemas';
	import type { PreviewBackdrop } from '$lib/constants';
	import { isCourseFinished } from '$lib/logic/gpa';
	import { buildShareData, type SharePhoto } from '$lib/logic/share';
	import { appStore } from '$lib/stores/appState';
	import { shareStore } from '$lib/stores/shareState';
	import ExportContentControls from '$lib/components/share/ExportContentControls.svelte';
	import ExportHeader from '$lib/components/share/ExportHeader.svelte';
	import ExportPreview from '$lib/components/share/ExportPreview.svelte';
	import ExportStyleControls from '$lib/components/share/ExportStyleControls.svelte';

	let canvasEl = $state<HTMLElement | undefined>();
	let backdrop = $state<PreviewBackdrop>('dark');

	// Held in memory only, so a photo is never saved with the settings
	let photo = $state<SharePhoto | null>(null);

	// Per-course overrides are for one post, so they stay out of the saved settings
	let courseModes = $state<Record<string, ValueDisplay>>({});

	let config = $derived($shareStore);
	let terms = $derived($appStore.terms ?? []);

	// Latest term with all course grades encoded (fallback to last term if none match)
	let latestTerm = $derived.by(() => {
		if (terms.length === 0) return undefined;
		const latestCompleted = terms.findLast(
			(t) => t.courses.length > 0 && t.courses.every((c) => isCourseFinished(c))
		);
		return latestCompleted ?? terms[terms.length - 1];
	});

	// Track termId from the previous page URL
	let previousTermId = $state<string | null>(null);

	afterNavigate((navigation) => {
		if (navigation.from) {
			const fromTermId = navigation.from.url.searchParams.get('termId');
			if (fromTermId) {
				previousTermId = fromTermId;
			}
		}
	});

	// Selected term derived from current URL -> previous page URL -> latest term fallback
	let selectedTermId = $derived.by(() => {
		const urlTermId = page.url.searchParams.get('termId');
		if (urlTermId && terms.some((t) => t.id === urlTermId)) {
			return urlTermId;
		}
		if (previousTermId && terms.some((t) => t.id === previousTermId)) {
			return previousTermId;
		}
		return latestTerm?.id ?? '';
	});

	function setSelectTerm(id: string) {
		if (!id) return;
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(`?termId=${id}`, { replaceState: true, noScroll: true, keepFocus: true });
	}

	let activeTerm = $derived(terms.find((t) => t.id === selectedTermId) ?? latestTerm);

	let data = $derived(
		buildShareData({
			terms,
			term: activeTerm,
			subject: config.subject,
			settings: $appStore.universitySettings,
			options: config.layouts[config.layout],
			courseModes
		})
	);

	let fileName = $derived(
		`nockr-${config.subject === 'term' && activeTerm ? activeTerm.name.toLowerCase().replace(/\s+/g, '-') : 'summary'}.png`
	);

	$effect(() => () => {
		if (photo) URL.revokeObjectURL(photo.url);
	});
</script>

<svelte:head>
	<title>Export Academic Card — Nockr</title>
</svelte:head>

<div class="container mx-auto min-h-screen max-w-7xl px-4 py-6 text-(--text) sm:py-8">
	<ExportHeader
		backHref={selectedTermId ? `/?termId=${selectedTermId}` : '/'}
		{fileName}
		{canvasEl}
	/>

	<div class="flex flex-col gap-6 sm:gap-8 lg:grid lg:grid-cols-12">
		<ExportPreview {config} {data} {photo} {backdrop} bind:canvasEl />

		<div class="order-2 space-y-5 text-xs lg:order-1 lg:col-span-4">
			<ExportContentControls
				{data}
				{activeTerm}
				{latestTerm}
				{selectedTermId}
				bind:courseModes
				onSelectTerm={setSelectTerm}
			/>
			<ExportStyleControls bind:photo bind:backdrop />
		</div>
	</div>
</div>
