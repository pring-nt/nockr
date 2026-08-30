<script lang="ts">
	import { page } from '$app/state';
	import { goto, afterNavigate } from '$app/navigation';
	import type { ShareConfig, AspectRatio, GradeDisplayMode } from '$lib/schemas';
	import { captureCanvas, getCanvasDimensions } from '$lib/logic/share';
	import { appStore } from '$lib/stores/appState';
	import ShareCanvas from '$lib/components/share/ShareCanvas.svelte';
	import ThemePicker from '$lib/components/settings/ThemePicker.svelte';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import {
		Download,
		Copy,
		LoaderCircle,
		ArrowLeft,
		ZoomIn,
		ZoomOut,
		RotateCcw
	} from 'lucide-svelte';

	let canvasEl = $state<HTMLElement | undefined>();
	let isCapturing = $state(false);

	// Terms from app store
	let terms = $derived($appStore.terms ?? []);
	let latestTerm = $derived(terms.length > 0 ? terms[terms.length - 1] : undefined);

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

	let activeTermLabel = $derived(
		activeTerm
			? `${activeTerm.name}${activeTerm.id === latestTerm?.id ? ' (Latest)' : ''}`
			: 'Select Term'
	);

	let config = $state<ShareConfig & { showWatermark: boolean }>({
		widgets: {
			academicSummary: true,
			termHeader: true,
			courseList: true,
			deansListBadge: true,
			latinHonorsBadge: true
		},
		privacy: {
			maskGPA: false,
			courseGradeDisplay: 'full'
		},
		aspectRatio: '3:4',
		background: 'theme',
		showWatermark: true
	});

	let dimensions = $derived(getCanvasDimensions(config.aspectRatio));

	// Dynamic viewport container measurement
	let containerWidth = $state(0);
	let containerHeight = $state(0);

	// User Zoom Control State (1 = Fit to view)
	let userZoom = $state(1);

	function zoomIn() {
		userZoom = Math.min(3, +(userZoom + 0.25).toFixed(2));
	}

	function zoomOut() {
		userZoom = Math.max(0.5, +(userZoom - 0.25).toFixed(2));
	}

	function resetZoom() {
		userZoom = 1;
	}

	// Base scale to fit container bounds
	let baseScale = $derived.by(() => {
		if (!containerWidth || !containerHeight) return 0.5;
		const availableW = Math.max(100, containerWidth - 48);
		const availableH = Math.max(100, containerHeight - 48);
		return Math.min(availableW / dimensions.width, availableH / dimensions.height);
	});

	// Final combined scale
	let effectiveScale = $derived(baseScale * userZoom);

	async function handleDownload() {
		if (!canvasEl) return;
		isCapturing = true;
		try {
			const dataUrl = await captureCanvas(canvasEl, config);
			const a = document.createElement('a');
			a.href = dataUrl;
			a.download = `nockr-${activeTerm ? activeTerm.name.toLowerCase().replace(/\s+/g, '-') : 'summary'}.png`;
			a.click();
		} catch (err) {
			console.error('Export failed:', err);
		} finally {
			isCapturing = false;
		}
	}

	async function handleCopy() {
		if (!canvasEl) return;
		isCapturing = true;
		try {
			const dataUrl = await captureCanvas(canvasEl, config);
			const blob = await (await fetch(dataUrl)).blob();
			await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
		} catch (err) {
			console.error('Copy to clipboard failed:', err);
		} finally {
			isCapturing = false;
		}
	}

	const aspectRatios: AspectRatio[] = ['9:16', '3:4', '2:3', '1:1', '4:3', '16:9'];
	const backgroundOptions = ['solid', 'theme', 'transparent'] as const;
	const gradeDisplayModes: { label: string; value: GradeDisplayMode }[] = [
		{ label: 'Full', value: 'full' },
		{ label: 'Masked', value: 'masked' },
		{ label: 'Hidden', value: 'hidden' }
	];
</script>

<svelte:head>
	<title>Export Academic Card — Nockr</title>
</svelte:head>

<div class="container mx-auto min-h-screen max-w-7xl px-4 py-6 text-(--text) sm:py-8">
	<!-- Header Navigation -->
	<header
		class="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-4 sm:mb-8 sm:pb-6"
	>
		<div class="flex items-center gap-3 sm:gap-4">
			<Button
				href={selectedTermId ? `/?termId=${selectedTermId}` : '/'}
				variant="ghost"
				size="icon"
				class="size-8 rounded-full sm:size-9"
			>
				<ArrowLeft class="size-4 sm:size-5" />
			</Button>
			<div>
				<h1 class="text-xl font-bold tracking-tight sm:text-2xl">Export Academic Card</h1>
				<p class="hidden text-xs text-(--subtle) sm:block">
					Customize layout, active term, and privacy settings before exporting or copying.
				</p>
			</div>
		</div>

		<div class="flex items-center gap-2 sm:gap-3">
			<Button
				variant="outline"
				onclick={handleCopy}
				disabled={isCapturing}
				size="sm"
				class="gap-1.5 sm:gap-2"
			>
				{#if isCapturing}
					<LoaderCircle class="size-4 animate-spin" />
				{:else}
					<Copy class="size-4" />
				{/if}
				<span class="hidden sm:inline">Copy Image</span>
			</Button>
			<Button
				onclick={handleDownload}
				disabled={isCapturing}
				size="sm"
				class="gap-1.5 bg-(--iris) text-(--base) hover:bg-(--iris)/90 sm:gap-2"
			>
				{#if isCapturing}
					<LoaderCircle class="size-4 animate-spin" />
				{:else}
					<Download class="size-4" />
				{/if}
				<span>Download PNG</span>
			</Button>
		</div>
	</header>

	<div class="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-12">
		<!-- Live Canvas Preview Target -->
		<div
			class="relative order-1 flex h-95 w-full flex-col overflow-hidden rounded-2xl border border-border bg-(--base)/60 sm:h-125 lg:sticky lg:top-6 lg:order-2 lg:col-span-8 lg:h-160"
		>
			<!-- Scrollable Viewport -->
			<div
				bind:clientWidth={containerWidth}
				bind:clientHeight={containerHeight}
				class="flex h-full w-full flex-1 overflow-auto p-6 sm:p-8"
			>
				<div
					style="width: {dimensions.width * effectiveScale}px; height: {dimensions.height *
						effectiveScale}px;"
					class="relative m-auto shrink-0 rounded-lg shadow-2xl transition-all duration-150"
				>
					<div
						style="width: {dimensions.width}px; height: {dimensions.height}px; transform: scale({effectiveScale}); transform-origin: top left;"
						class="absolute top-0 left-0"
					>
						<ShareCanvas {config} term={activeTerm} bind:canvasRef={canvasEl} />
					</div>
				</div>
			</div>

			<!-- Floating Zoom Toolbar Controls -->
			<div
				class="absolute right-3 bottom-3 z-10 flex items-center gap-1 rounded-lg border border-border/60 bg-(--surface)/90 p-1 shadow-md backdrop-blur-xs"
			>
				<Button
					variant="ghost"
					size="icon"
					class="size-7"
					onclick={zoomOut}
					disabled={userZoom <= 0.5}
					title="Zoom Out"
				>
					<ZoomOut class="size-3.5" />
				</Button>

				<button
					onclick={resetZoom}
					class="px-1.5 font-mono text-[11px] font-medium transition-colors hover:text-(--iris)"
					title="Reset Zoom"
				>
					{Math.round(userZoom * 100)}%
				</button>

				<Button
					variant="ghost"
					size="icon"
					class="size-7"
					onclick={zoomIn}
					disabled={userZoom >= 3}
					title="Zoom In"
				>
					<ZoomIn class="size-3.5" />
				</Button>

				{#if userZoom !== 1}
					<Button
						variant="ghost"
						size="icon"
						class="size-7"
						onclick={resetZoom}
						title="Fit to Container"
					>
						<RotateCcw class="size-3.5" />
					</Button>
				{/if}
			</div>
		</div>

		<!-- Controls Column -->
		<div class="order-2 space-y-5 text-xs lg:order-1 lg:col-span-4">
			<!-- Active Term Context Selector -->
			{#if terms.length > 0}
				<div>
					<Label class="mb-2 block font-semibold text-(--subtle)">Active Term Context</Label>
					<Select.Root type="single" value={selectedTermId} onValueChange={setSelectTerm}>
						<Select.Trigger class="w-full border-border bg-(--highlight-low) text-xs">
							{activeTermLabel}
						</Select.Trigger>
						<Select.Content>
							{#each terms as t (t.id)}
								<Select.Item
									value={t.id}
									label={`${t.name}${t.id === latestTerm?.id ? ' (Latest)' : ''}`}
								>
									{t.name}
									{t.id === latestTerm?.id ? '(Latest)' : ''}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			{/if}

			<!-- Aspect Ratio Selector -->
			<div>
				<Label class="mb-2 block font-semibold text-(--subtle)">Aspect Ratio</Label>
				<div class="grid grid-cols-3 gap-1.5">
					{#each aspectRatios as ratio (ratio)}
						<Button
							type="button"
							variant={config.aspectRatio === ratio ? 'default' : 'outline'}
							size="sm"
							onclick={() => (config.aspectRatio = ratio)}
							class="h-8 px-1 text-xs font-medium transition-all
               {config.aspectRatio === ratio
								? 'border-(--iris) bg-(--iris) font-bold text-(--base) hover:bg-(--iris)/90'
								: 'border-border bg-(--highlight-low) text-(--subtle) hover:text-(--text)'}"
						>
							{ratio}
						</Button>
					{/each}
				</div>
			</div>

			<!-- Background & Theme Controls -->
			<div class="space-y-3 border-t border-border pt-4">
				<div class="flex items-center justify-between">
					<Label class="font-semibold text-(--subtle)">Site Theme</Label>
					<ThemePicker />
				</div>

				<div>
					<Label class="mb-2 block font-semibold text-(--subtle)">Card Background</Label>
					<div class="grid grid-cols-3 gap-1.5">
						{#each backgroundOptions as bg (bg)}
							<Button
								type="button"
								variant={config.background === bg ? 'default' : 'outline'}
								size="sm"
								onclick={() => (config.background = bg)}
								class="h-8 truncate px-1 text-[11px] font-medium capitalize transition-all
               {config.background === bg
									? 'border-(--iris) bg-(--iris) font-bold text-(--base) hover:bg-(--iris)/90'
									: 'border-border bg-(--highlight-low) text-(--subtle) hover:text-(--text)'}"
							>
								{bg}
							</Button>
						{/each}
					</div>
				</div>
			</div>

			<!-- Widget Toggles -->
			<div class="space-y-3 border-t border-border pt-4">
				<Label class="block font-semibold text-(--subtle)">Included Widgets</Label>

				<div class="flex items-center justify-between">
					<span class="text-xs">Academic Summary</span>
					<Switch bind:checked={config.widgets.academicSummary} />
				</div>

				<div class="flex items-center justify-between">
					<span class="text-xs">Latin Honors Badge</span>
					<Switch bind:checked={config.widgets.latinHonorsBadge} />
				</div>

				{#if activeTerm}
					<div class="flex items-center justify-between">
						<span class="text-xs">Term Header</span>
						<Switch bind:checked={config.widgets.termHeader} />
					</div>

					<div class="flex items-center justify-between">
						<span class="text-xs">Course List</span>
						<Switch bind:checked={config.widgets.courseList} />
					</div>

					<div class="flex items-center justify-between">
						<span class="text-xs">Dean's List Badge</span>
						<Switch bind:checked={config.widgets.deansListBadge} />
					</div>
				{/if}

				<div class="flex items-center justify-between border-t border-border/50 pt-2">
					<span class="text-xs">Watermark</span>
					<Switch bind:checked={config.showWatermark} />
				</div>
			</div>

			<!-- Privacy Settings -->
			<div class="space-y-3 border-t border-border pt-4">
				<Label class="block font-semibold text-(--subtle)">Privacy</Label>

				<div class="flex items-center justify-between">
					<span class="text-xs">Mask Overall GPA (X.XX)</span>
					<Switch bind:checked={config.privacy.maskGPA} />
				</div>

				{#if activeTerm}
					<div>
						<span class="mb-1.5 block text-xs text-(--text)">Course Grades</span>
						<div class="grid grid-cols-3 gap-1.5">
							{#each gradeDisplayModes as mode (mode.value)}
								<Button
									type="button"
									variant={config.privacy.courseGradeDisplay === mode.value ? 'default' : 'outline'}
									size="sm"
									onclick={() => (config.privacy.courseGradeDisplay = mode.value)}
									class="h-8 px-1 text-[11px] font-medium transition-all
                   {config.privacy.courseGradeDisplay === mode.value
										? 'border-(--iris) bg-(--iris) font-bold text-(--base) hover:bg-(--iris)/90'
										: 'border-border bg-(--highlight-low) text-(--subtle) hover:text-(--text)'}"
								>
									{mode.label}
								</Button>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
