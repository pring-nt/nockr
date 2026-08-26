<script lang="ts">
	import type { Term, ShareConfig, AspectRatio, GradeDisplayMode } from '$lib/schemas';
	import { captureCanvas, getCanvasDimensions } from '$lib/logic/share';
	import { appStore } from '$lib/stores/appState';
	import ShareCanvas from './ShareCanvas.svelte';
	import ThemePicker from '$lib/components/settings/ThemePicker.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import { Download, Copy, LoaderCircle } from 'lucide-svelte';

	let {
		open = $bindable(false),
		term: initialTerm
	}: {
		open?: boolean;
		term?: Term;
	} = $props();

	let canvasEl = $state<HTMLElement | undefined>();
	let isCapturing = $state(false);

	let terms = $derived($appStore.terms ?? []);
	let latestTerm = $derived(terms.length > 0 ? terms[terms.length - 1] : undefined);

	let selectedTermId = $state<string>('');
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

	$effect(() => {
		if (open) {
			if (initialTerm) {
				selectedTermId = initialTerm.id;
			} else if (latestTerm) {
				selectedTermId = latestTerm.id;
			}

			config.widgets.academicSummary = true;
			config.widgets.termHeader = true;
			config.widgets.courseList = true;
			config.widgets.deansListBadge = true;
			config.widgets.latinHonorsBadge = true;
		}
	});

	let dimensions = $derived(getCanvasDimensions(config.aspectRatio));
	let previewScale = $derived(Math.min(500 / dimensions.width, 480 / dimensions.height));

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

<Dialog.Root bind:open>
	<Dialog.Content
		class="max-h-[92vh] max-w-5xl overflow-y-auto border-border bg-(--surface) p-6 text-(--text) lg:max-w-6xl"
	>
		<Dialog.Header
			class="flex flex-row items-center justify-between border-b border-border/50 pb-4"
		>
			<div>
				<Dialog.Title class="text-xl font-bold">Export Academic Card</Dialog.Title>
				<Dialog.Description class="text-xs text-(--subtle)">
					Customize layout, active term, and privacy settings before export.
				</Dialog.Description>
			</div>
			<div class="flex items-center gap-2 pr-6">
				<ThemePicker />
			</div>
		</Dialog.Header>

		<div class="my-4 grid grid-cols-1 items-start gap-8 md:grid-cols-12">
			<!-- Controls Column -->
			<div class="space-y-5 text-xs md:col-span-5 lg:col-span-4">
				<!-- Term Selector -->
				{#if terms.length > 0}
					<div>
						<Label class="mb-2 block font-semibold text-(--subtle)">Active Term Context</Label>
						<Select.Root type="single" bind:value={selectedTermId}>
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

				<!-- Background Mode -->
				<div>
					<Label class="mb-2 block font-semibold text-(--subtle)">Background Style</Label>
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

				<!-- Widget Toggles -->
				<div class="space-y-3 border-t border-border pt-3">
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
				<div class="space-y-3 border-t border-border pt-3">
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
										variant={config.privacy.courseGradeDisplay === mode.value
											? 'default'
											: 'outline'}
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

			<!-- Live Canvas Preview Target -->
			<div
				class="relative flex h-130 w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-(--base)/60 p-6 md:col-span-7 lg:col-span-8"
			>
				<div
					style="width: {dimensions.width * previewScale}px; height: {dimensions.height *
						previewScale}px;"
					class="relative shrink-0 rounded-lg shadow-2xl transition-all duration-200"
				>
					<div
						style="width: {dimensions.width}px; height: {dimensions.height}px; transform: scale({previewScale}); transform-origin: top left;"
						class="absolute top-0 left-0"
					>
						<ShareCanvas {config} term={activeTerm} bind:canvasRef={canvasEl} />
					</div>
				</div>
			</div>
		</div>

		<Dialog.Footer class="gap-2 border-t border-border/50 pt-4 sm:gap-0">
			<Button variant="outline" onclick={handleCopy} disabled={isCapturing} class="gap-2">
				{#if isCapturing}
					<LoaderCircle class="size-4 animate-spin" />
				{:else}
					<Copy class="size-4" />
				{/if}
				Copy Image
			</Button>
			<Button
				onclick={handleDownload}
				disabled={isCapturing}
				class="gap-2 bg-(--iris) text-(--base) hover:bg-(--iris)/90"
			>
				{#if isCapturing}
					<LoaderCircle class="size-4 animate-spin" />
				{:else}
					<Download class="size-4" />
				{/if}
				Download PNG
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
