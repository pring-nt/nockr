<script lang="ts">
	import { page } from '$app/state';
	import { goto, afterNavigate } from '$app/navigation';
	import type {
		ShareConfig,
		ShareFormat,
		ShareHighlight,
		ShareInk,
		ShareLayout,
		ShareLayoutOptions,
		ShareSubject,
		ValueDisplay
	} from '$lib/schemas';
	import { SHARE_CANVAS_WIDTH, SHARE_FORMAT_HEIGHTS } from '$lib/constants';
	import { isCourseFinished } from '$lib/logic/gpa';
	import { buildShareData, captureCanvas, getTrend } from '$lib/logic/share';
	import { appStore } from '$lib/stores/appState';
	import { THEMES } from '$lib/themes';
	import { shareStore } from '$lib/stores/shareState';
	import SegmentedControl from '$lib/components/share/SegmentedControl.svelte';
	import ShareCanvas from '$lib/components/share/ShareCanvas.svelte';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import {
		Download,
		Copy,
		LoaderCircle,
		ArrowLeft,
		Share2,
		ZoomIn,
		ZoomOut,
		RotateCcw
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	type Backdrop = 'dark' | 'light' | 'checker' | 'photo';

	const BACKDROPS: Record<Exclude<Backdrop, 'photo'>, string> = {
		dark: '#20242c',
		light: '#eef0f2',
		checker: 'repeating-conic-gradient(#d4d4d4 0 25%, #ffffff 0 50%) 0 0 / 20px 20px'
	};

	const layoutOptions: { label: string; value: ShareLayout }[] = [
		{ label: 'Stat stack', value: 'stat-stack' },
		{ label: 'Honors', value: 'honors-headline' },
		{ label: 'Scorecard', value: 'scorecard' }
	];
	const subjectOptions: { label: string; value: ShareSubject }[] = [
		{ label: 'This term', value: 'term' },
		{ label: 'Cumulative', value: 'cumulative' }
	];
	const displayOptions: { label: string; value: ValueDisplay }[] = [
		{ label: 'Full', value: 'full' },
		{ label: 'Masked', value: 'masked' },
		{ label: 'Hidden', value: 'hidden' }
	];
	const inkOptions: { label: string; value: ShareInk }[] = [
		{ label: 'White', value: 'white' },
		{ label: 'Black', value: 'black' },
		{ label: 'Theme', value: 'theme' }
	];
	const alignOptions: { label: string; value: ShareLayoutOptions['align'] }[] = [
		{ label: 'Left', value: 'left' },
		{ label: 'Centered', value: 'center' }
	];
	const highlightOptions: { label: string; value: ShareHighlight }[] = [
		{ label: 'None', value: 'none' },
		{ label: 'Accent', value: 'accent' },
		{ label: 'Gradient', value: 'gradient' }
	];
	const stickerThemes = THEMES.filter((theme) => theme.name !== 'custom');
	const formatOptions: { label: string; value: ShareFormat }[] = [
		{ label: 'Sticker', value: 'sticker' },
		{ label: '9:16', value: '9:16' },
		{ label: '3:4', value: '3:4' },
		{ label: '1:1', value: '1:1' }
	];
	const backgroundOptions: { label: string; value: ShareConfig['background'] }[] = [
		{ label: 'Transparent', value: 'transparent' },
		{ label: 'Theme', value: 'theme' }
	];
	const backdropOptions: { label: string; value: Backdrop }[] = [
		{ label: 'Dark', value: 'dark' },
		{ label: 'Light', value: 'light' },
		{ label: 'Checker', value: 'checker' },
		{ label: 'Photo', value: 'photo' }
	];

	let canvasEl = $state<HTMLElement | undefined>();
	let photoInputEl = $state<HTMLInputElement | undefined>();
	let isCapturing = $state(false);
	let canNativeShare = $state(false);

	$effect(() => {
		const probe = new File([], 'nockr.png', { type: 'image/png' });
		canNativeShare = navigator.canShare?.({ files: [probe] }) ?? false;
	});

	let config = $derived($shareStore);
	let options = $derived(config.layouts[config.layout]);
	let isTerm = $derived(config.subject === 'term');

	function setConfig(changes: Partial<ShareConfig>) {
		shareStore.update((state) => ({ ...state, ...changes }));
	}

	function setOptions(changes: Partial<ShareLayoutOptions>) {
		shareStore.update((state) => ({
			...state,
			layouts: { ...state.layouts, [state.layout]: { ...state.layouts[state.layout], ...changes } }
		}));
	}

	// Terms from app store
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

	let activeTermLabel = $derived(
		activeTerm
			? `${activeTerm.name}${activeTerm.id === latestTerm?.id ? ' (Latest)' : ''}`
			: 'Select Term'
	);

	// Per-course overrides are for one post, so they stay out of the saved settings
	let courseModes = $state<Record<string, ValueDisplay>>({});

	function setAllGrades(mode: ValueDisplay) {
		courseModes = {};
		setOptions({ gradeDisplay: mode });
	}

	let data = $derived(
		buildShareData({
			terms,
			term: activeTerm,
			subject: config.subject,
			settings: $appStore.universitySettings,
			options,
			courseModes
		})
	);

	let adjustableCourses = $derived(
		(activeTerm?.courses ?? []).filter((c) => c.type === 'graded' || options.showNonAcademic)
	);

	let canShowTrend = $derived(
		getTrend(
			isTerm && activeTerm ? terms.slice(0, terms.indexOf(activeTerm) + 1) : terms,
			$appStore.universitySettings
		).length > 0
	);

	let stickerThemeLabel = $derived(
		stickerThemes.find((theme) => theme.name === config.theme)?.label ?? 'Same as site'
	);

	let canvasHeight = $state(0);
	let dimensions = $derived({
		width: SHARE_CANVAS_WIDTH,
		height: config.format === 'sticker' ? canvasHeight : SHARE_FORMAT_HEIGHTS[config.format]
	});

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
		if (!containerWidth || !containerHeight || !dimensions.height) return 0.5;
		const availableW = Math.max(100, containerWidth - 48);
		const availableH = Math.max(100, containerHeight - 48);
		return Math.min(availableW / dimensions.width, availableH / dimensions.height);
	});

	// Final combined scale
	let effectiveScale = $derived(baseScale * userZoom);

	let backdrop = $state<Backdrop>('dark');
	let photoUrl = $state<string | null>(null);

	let backdropStyle = $derived(
		backdrop === 'photo' && photoUrl
			? `background: center / cover no-repeat url(${photoUrl});`
			: `background: ${BACKDROPS[backdrop === 'photo' ? 'dark' : backdrop]};`
	);

	function setBackdrop(value: Backdrop) {
		if (value === 'photo' && !photoUrl) {
			photoInputEl?.click();
			return;
		}
		backdrop = value;
	}

	function handlePhoto(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		if (photoUrl) URL.revokeObjectURL(photoUrl);
		photoUrl = URL.createObjectURL(file);
		backdrop = 'photo';
		input.value = '';
	}

	$effect(() => () => {
		if (photoUrl) URL.revokeObjectURL(photoUrl);
	});

	let fileName = $derived(
		`nockr-${isTerm && activeTerm ? activeTerm.name.toLowerCase().replace(/\s+/g, '-') : 'summary'}.png`
	);

	async function runCapture(action: (el: HTMLElement) => Promise<void>, failure: string) {
		if (!canvasEl) return;
		isCapturing = true;
		try {
			await action(canvasEl);
		} catch (err) {
			if (err instanceof DOMException && err.name === 'AbortError') return;
			console.error('Export failed:', err);
			toast.error(failure);
		} finally {
			isCapturing = false;
		}
	}

	function handleDownload() {
		return runCapture(async (el) => {
			const url = URL.createObjectURL(await captureCanvas(el));
			const a = document.createElement('a');
			a.href = url;
			a.download = fileName;
			a.click();
			URL.revokeObjectURL(url);
		}, 'Failed to save image');
	}

	function handleCopy() {
		return runCapture(async (el) => {
			// Safari only allows this when the blob is passed as a pending promise
			await navigator.clipboard.write([new ClipboardItem({ 'image/png': captureCanvas(el) })]);
			toast.success('Image copied to clipboard');
		}, 'Failed to copy image');
	}

	function handleShare() {
		return runCapture(async (el) => {
			const file = new File([await captureCanvas(el)], fileName, { type: 'image/png' });
			await navigator.share({ files: [file] });
		}, 'Failed to share image');
	}
</script>

<svelte:head>
	<title>Export Academic Card — Nockr</title>
</svelte:head>

{#snippet toggle(label: string, checked: boolean, onChange: (value: boolean) => void)}
	<div class="flex items-center justify-between gap-3">
		<span class="text-xs">{label}</span>
		<Switch {checked} onCheckedChange={onChange} aria-label={label} />
	</div>
{/snippet}

{#snippet sectionLabel(text: string)}
	<Label class="mb-2 block font-semibold text-(--subtle)">{text}</Label>
{/snippet}

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
				aria-label="Back"
				class="size-8 sm:size-9"
			>
				<ArrowLeft class="size-4 sm:size-5" />
			</Button>
			<div>
				<h1 class="text-xl font-bold tracking-tight sm:text-2xl">Export Academic Card</h1>
				<p class="hidden text-xs text-(--subtle) sm:block">
					Pick a layout, choose what to show, then add it to any photo.
				</p>
			</div>
		</div>

		<div class="flex items-center gap-2 sm:gap-3">
			{#if canNativeShare}
				<Button
					variant="ghost"
					onclick={handleShare}
					disabled={isCapturing}
					size="sm"
					aria-label="Share image"
					class="gap-1.5 border-none bg-(--highlight-low) text-(--text) hover:bg-(--highlight-med) sm:gap-2"
				>
					<Share2 class="size-4" />
					<span class="hidden sm:inline">Share</span>
				</Button>
			{/if}
			<Button
				variant="ghost"
				onclick={handleCopy}
				disabled={isCapturing}
				size="sm"
				aria-label="Copy image"
				class="gap-1.5 border-none bg-(--highlight-low) text-(--text) hover:bg-(--highlight-med) sm:gap-2"
			>
				{#if isCapturing}
					<LoaderCircle class="size-4 animate-spin" />
				{:else}
					<Copy class="size-4" />
				{/if}
				<span class="hidden sm:inline">Copy Image</span>
			</Button>
			<Button onclick={handleDownload} disabled={isCapturing} size="sm" class="gap-1.5 sm:gap-2">
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
			class="relative order-1 flex h-95 w-full flex-col overflow-hidden rounded-xl border border-border/50 sm:h-125 lg:sticky lg:top-6 lg:order-2 lg:col-span-8 lg:h-160"
			style={backdropStyle}
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
					class="relative m-auto shrink-0"
				>
					<div
						bind:clientHeight={canvasHeight}
						style="width: {dimensions.width}px; transform: scale({effectiveScale}); transform-origin: top left;"
						class="absolute top-0 left-0"
					>
						<ShareCanvas {config} {data} bind:canvasRef={canvasEl} />
					</div>
				</div>
			</div>

			<!-- Floating Zoom Toolbar Controls -->
			<div
				class="absolute right-3 bottom-3 z-10 flex items-center gap-1 rounded-lg border border-border/40 bg-(--surface)/90 p-1 text-(--text) shadow-md backdrop-blur-xs"
			>
				<Button
					variant="ghost"
					size="icon"
					class="size-7 border-none"
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
					class="size-7 border-none"
					onclick={zoomIn}
					disabled={userZoom >= 3}
					title="Zoom In"
				>
					<ZoomIn class="size-3.5" />
				</Button>

				<Button
					variant="ghost"
					size="icon"
					class="size-7 border-none"
					onclick={resetZoom}
					disabled={userZoom === 1}
					title="Fit to Container"
				>
					<RotateCcw class="size-3.5" />
				</Button>
			</div>
		</div>

		<!-- Controls Column -->
		<div class="order-2 space-y-5 text-xs lg:order-1 lg:col-span-4">
			<div class="space-y-3">
				<div>
					{@render sectionLabel('Layout')}
					<SegmentedControl
						label="Layout"
						options={layoutOptions}
						value={config.layout}
						onChange={(layout) => setConfig({ layout })}
					/>
				</div>

				<div>
					{@render sectionLabel('Share')}
					<SegmentedControl
						label="What to share"
						options={subjectOptions}
						value={config.subject}
						onChange={(subject) => setConfig({ subject })}
					/>
				</div>

				{#if isTerm && terms.length > 0}
					<Select.Root type="single" value={selectedTermId} onValueChange={setSelectTerm}>
						<Select.Trigger
							aria-label="Term"
							class="w-full border-none bg-(--highlight-low) text-xs shadow-none hover:bg-(--highlight-med)"
						>
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
				{/if}
			</div>

			<!-- What the current layout shows -->
			<div class="space-y-3 border-t border-border/50 pt-4">
				<Label class="block font-semibold text-(--subtle)">Show on this layout</Label>

				<div>
					<span class="mb-1.5 block text-xs">{isTerm ? 'Term GPA' : 'Cumulative GPA'}</span>
					<SegmentedControl
						label="GPA display"
						options={displayOptions}
						value={options.gpaDisplay}
						onChange={(gpaDisplay) => setOptions({ gpaDisplay })}
					/>
				</div>

				{@render toggle(isTerm ? "Dean's List" : 'Latin Honors', options.showHonors, (showHonors) =>
					setOptions({ showHonors })
				)}

				{#if options.showHonors && !data.honorEarned}
					{@render toggle(
						'Show a kind message instead',
						options.showNotEarnedMessage,
						(showNotEarnedMessage) => setOptions({ showNotEarnedMessage })
					)}
				{/if}

				{#if isTerm}
					{@render toggle('CGPA', options.showCgpa, (showCgpa) => setOptions({ showCgpa }))}
					{@render toggle('Courses', options.showCourses, (showCourses) =>
						setOptions({ showCourses })
					)}

					{#if options.showCourses}
						{@render toggle('Non-academic courses', options.showNonAcademic, (showNonAcademic) =>
							setOptions({ showNonAcademic })
						)}

						<div>
							<span class="mb-1.5 block text-xs">Course grades</span>
							<SegmentedControl
								label="Course grade display"
								options={displayOptions}
								value={options.gradeDisplay}
								onChange={setAllGrades}
							/>
						</div>

						{#if adjustableCourses.length > 0}
							<details class="group">
								<summary class="cursor-pointer text-xs text-(--subtle) hover:text-(--text)">
									Adjust each course
								</summary>
								<div class="mt-2 space-y-1.5">
									{#each adjustableCourses as course (course.id)}
										<div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-center gap-2">
											<span class="truncate text-xs">{course.name || 'Untitled Course'}</span>
											<SegmentedControl
												label="{course.name || 'Untitled Course'} grade display"
												options={displayOptions}
												value={courseModes[course.id] ?? options.gradeDisplay}
												onChange={(mode) => (courseModes[course.id] = mode)}
											/>
										</div>
									{/each}
								</div>
							</details>
						{/if}
					{/if}
				{/if}

				{#if canShowTrend}
					{@render toggle('Trend line', options.showTrend, (showTrend) =>
						setOptions({ showTrend })
					)}
				{:else}
					<div class="flex items-center justify-between gap-3">
						<span class="text-xs">Trend line</span>
						<span class="text-[11px] text-(--subtle)">Needs two graded terms</span>
					</div>
				{/if}
				{@render toggle('Watermark', config.showWatermark, (showWatermark) =>
					setConfig({ showWatermark })
				)}
			</div>

			<!-- Look of the exported image -->
			<div class="space-y-3 border-t border-border/50 pt-4">
				<div>
					{@render sectionLabel('Text color')}
					<SegmentedControl
						label="Text color"
						options={inkOptions}
						value={config.ink}
						onChange={(ink) => setConfig({ ink })}
					/>
				</div>

				<div>
					{@render sectionLabel('Highlight')}
					<SegmentedControl
						label="Highlight"
						options={highlightOptions}
						value={config.highlight}
						onChange={(highlight) => setConfig({ highlight })}
					/>
				</div>

				<div>
					{@render sectionLabel('Text alignment')}
					<SegmentedControl
						label="Text alignment"
						options={alignOptions}
						value={options.align}
						onChange={(align) => setOptions({ align })}
					/>
				</div>

				<div>
					{@render sectionLabel('Sticker theme')}
					<Select.Root
						type="single"
						value={config.theme}
						onValueChange={(theme) => setConfig({ theme: theme as ShareConfig['theme'] })}
					>
						<Select.Trigger
							aria-label="Sticker theme"
							class="w-full border-none bg-(--highlight-low) text-xs shadow-none hover:bg-(--highlight-med)"
						>
							{stickerThemeLabel}
						</Select.Trigger>
						<Select.Content class="max-h-72">
							<Select.Item value="site" label="Same as site">Same as site</Select.Item>
							{#each stickerThemes as theme (theme.name)}
								<Select.Item value={theme.name} label={theme.label}>{theme.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				{@render toggle('Text shadow', config.showShadow, (showShadow) =>
					setConfig({ showShadow })
				)}

				<div>
					{@render sectionLabel('Format')}
					<SegmentedControl
						label="Format"
						options={formatOptions}
						value={config.format}
						onChange={(format) => setConfig({ format })}
					/>
				</div>

				<div>
					{@render sectionLabel('Background')}
					<SegmentedControl
						label="Background"
						options={backgroundOptions}
						value={config.background}
						onChange={(background) => setConfig({ background })}
					/>
				</div>
			</div>

			<div class="border-t border-border/50 pt-4">
				{@render sectionLabel('Preview on')}
				<SegmentedControl
					label="Preview backdrop"
					options={backdropOptions}
					value={backdrop}
					onChange={setBackdrop}
				/>
				<input
					bind:this={photoInputEl}
					type="file"
					accept="image/*"
					class="hidden"
					onchange={handlePhoto}
				/>
				<p class="mt-2 text-[11px] text-(--subtle)">
					Preview only. Your photo stays on this device and is never part of the export.
				</p>
			</div>
		</div>
	</div>
</div>
