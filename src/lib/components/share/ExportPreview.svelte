<script lang="ts">
	import type { ShareConfig } from '$lib/schemas';
	import {
		PREVIEW_BACKDROPS,
		SHARE_CANVAS_WIDTH,
		SHARE_FORMAT_HEIGHTS,
		type PreviewBackdrop
	} from '$lib/constants';
	import type { ShareData, SharePhoto } from '$lib/logic/share';
	import { Button } from '$lib/components/ui/button';
	import { Maximize, RotateCcw, ZoomIn, ZoomOut } from 'lucide-svelte';
	import ShareCanvas from './ShareCanvas.svelte';
	import SharePreviewViewer from './SharePreviewViewer.svelte';

	let {
		config,
		data,
		photo,
		backdrop,
		canvasEl = $bindable()
	}: {
		config: ShareConfig;
		data: ShareData;
		photo: SharePhoto | null;
		backdrop: PreviewBackdrop;
		canvasEl?: HTMLElement;
	} = $props();

	let isViewerOpen = $state(false);

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
</script>

<!-- Live Canvas Preview Target -->
<div
	class="sticky top-2 z-20 order-1 flex h-72 w-full shrink-0 flex-col overflow-hidden rounded-xl border border-border/50 shadow-lg sm:h-125 lg:top-6 lg:z-auto lg:order-2 lg:col-span-8 lg:h-160 lg:shadow-none"
	style="background: {PREVIEW_BACKDROPS[backdrop]};"
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
				<ShareCanvas {config} {data} {photo} bind:canvasRef={canvasEl} />
			</div>
		</div>
	</div>

	<!-- The preview is too small to inspect on a phone, so a tap anywhere opens it full screen -->
	<button
		type="button"
		aria-label="Open full screen preview"
		onclick={() => (isViewerOpen = true)}
		class="absolute inset-0 z-10 flex items-end justify-end p-2 sm:hidden"
	>
		<span class="rounded-md bg-(--surface)/90 p-1.5 text-(--text) shadow-md">
			<Maximize class="size-4" />
		</span>
	</button>

	<!-- Floating Zoom Toolbar Controls -->
	<div
		class="absolute right-3 bottom-3 z-10 hidden items-center gap-1 rounded-lg border border-border/40 bg-(--surface)/90 p-1 text-(--text) shadow-md backdrop-blur-xs sm:flex"
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

		<Button
			variant="ghost"
			size="icon"
			class="size-7 border-none"
			onclick={() => (isViewerOpen = true)}
			title="Full Screen"
		>
			<Maximize class="size-3.5" />
		</Button>
	</div>
</div>

<SharePreviewViewer
	bind:open={isViewerOpen}
	{config}
	{data}
	{photo}
	width={dimensions.width}
	height={dimensions.height}
	backdrop={PREVIEW_BACKDROPS[backdrop]}
/>
