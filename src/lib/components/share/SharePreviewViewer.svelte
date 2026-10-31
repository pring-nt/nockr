<script lang="ts">
	import type { ShareConfig } from '$lib/schemas';
	import type { ShareData, SharePhoto } from '$lib/logic/share';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Minus, Plus, X } from 'lucide-svelte';
	import ShareCanvas from './ShareCanvas.svelte';

	const MAX_ZOOM = 5;
	const BUTTON_STEP = 1.5;
	const DOUBLE_TAP_ZOOM = 2.5;
	const DOUBLE_TAP_MS = 300;
	const MARGIN = 16;

	let {
		open = $bindable(false),
		config,
		data,
		photo,
		width,
		height,
		backdrop
	}: {
		open?: boolean;
		config: ShareConfig;
		data: ShareData;
		photo: SharePhoto | null;
		width: number;
		height: number;
		backdrop: string;
	} = $props();

	let stageEl = $state<HTMLElement | undefined>();
	let stageWidth = $state(0);
	let stageHeight = $state(0);
	let zoom = $state(1);
	let x = $state(0);
	let y = $state(0);

	// Read only inside gesture handlers, so nothing needs to react to it
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const pointers = new Map<number, { x: number; y: number }>();
	let pinchDistance = 0;
	let pinchCenter = { x: 0, y: 0 };
	let lastTapAt = 0;

	let fit = $derived(
		stageWidth && height
			? Math.min((stageWidth - MARGIN * 2) / width, (stageHeight - MARGIN * 2) / height)
			: 1
	);

	$effect(() => {
		if (open) {
			zoom = 1;
			x = 0;
			y = 0;
			pointers.clear();
		}
	});

	function panTo(nextX: number, nextY: number) {
		const limitX = Math.max(0, (width * fit * zoom - stageWidth) / 2 + MARGIN);
		const limitY = Math.max(0, (height * fit * zoom - stageHeight) / 2 + MARGIN);
		x = Math.min(limitX, Math.max(-limitX, nextX));
		y = Math.min(limitY, Math.max(-limitY, nextY));
	}

	/** Zooms around a point given relative to the stage center, so that point stays put */
	function zoomAt(next: number, pointX = 0, pointY = 0) {
		const target = Math.min(MAX_ZOOM, Math.max(1, next));
		const ratio = target / zoom;
		zoom = target;
		panTo(pointX - (pointX - x) * ratio, pointY - (pointY - y) * ratio);
	}

	function fromCenter(clientX: number, clientY: number) {
		const rect = stageEl?.getBoundingClientRect();
		if (!rect) return { x: 0, y: 0 };
		return { x: clientX - rect.left - rect.width / 2, y: clientY - rect.top - rect.height / 2 };
	}

	function readPinch() {
		const [a, b] = [...pointers.values()];
		return {
			distance: Math.hypot(a.x - b.x, a.y - b.y),
			center: fromCenter((a.x + b.x) / 2, (a.y + b.y) / 2)
		};
	}

	function handlePointerDown(e: PointerEvent) {
		stageEl?.setPointerCapture(e.pointerId);
		pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

		if (pointers.size === 2) {
			({ distance: pinchDistance, center: pinchCenter } = readPinch());
			return;
		}

		if (e.timeStamp - lastTapAt < DOUBLE_TAP_MS) {
			const point = fromCenter(e.clientX, e.clientY);
			zoomAt(zoom > 1 ? 1 : DOUBLE_TAP_ZOOM, point.x, point.y);
			lastTapAt = 0;
		} else {
			lastTapAt = e.timeStamp;
		}
	}

	function handlePointerMove(e: PointerEvent) {
		const previous = pointers.get(e.pointerId);
		if (!previous) return;
		pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

		if (pointers.size === 1) {
			panTo(x + e.clientX - previous.x, y + e.clientY - previous.y);
		} else if (pointers.size === 2) {
			const { distance, center } = readPinch();
			zoomAt((zoom * distance) / pinchDistance, center.x, center.y);
			panTo(x + center.x - pinchCenter.x, y + center.y - pinchCenter.y);
			pinchDistance = distance;
			pinchCenter = center;
		}
	}

	function handlePointerUp(e: PointerEvent) {
		pointers.delete(e.pointerId);
	}

	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		const point = fromCenter(e.clientX, e.clientY);
		zoomAt(zoom * Math.exp(-e.deltaY * 0.002), point.x, point.y);
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		showCloseButton={false}
		class="top-0 left-0 h-dvh w-screen max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none border-0 p-0 sm:max-w-none"
	>
		<Dialog.Title class="sr-only">Full screen preview</Dialog.Title>
		<Dialog.Description class="sr-only">
			Pinch or scroll to zoom, and drag to move around.
		</Dialog.Description>

		<div
			bind:this={stageEl}
			bind:clientWidth={stageWidth}
			bind:clientHeight={stageHeight}
			role="application"
			aria-label="Zoomable preview"
			class="relative flex size-full touch-none items-center justify-center overflow-hidden {zoom >
			1
				? 'cursor-grab active:cursor-grabbing'
				: ''}"
			style="background: {backdrop};"
			onpointerdown={handlePointerDown}
			onpointermove={handlePointerMove}
			onpointerup={handlePointerUp}
			onpointercancel={handlePointerUp}
			onwheel={handleWheel}
		>
			<div
				class="shrink-0"
				style="width: {width}px; height: {height}px; transform: translate({x}px, {y}px) scale({fit *
					zoom});"
			>
				<ShareCanvas {config} {data} {photo} />
			</div>
		</div>

		<div
			class="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-border/40 bg-(--surface)/90 p-1 text-(--text) shadow-md"
		>
			<Button
				variant="ghost"
				size="icon"
				class="size-9"
				aria-label="Zoom out"
				disabled={zoom <= 1}
				onclick={() => zoomAt(zoom / BUTTON_STEP)}
			>
				<Minus class="size-4" />
			</Button>
			<span class="w-12 text-center font-mono text-[11px]">{Math.round(zoom * 100)}%</span>
			<Button
				variant="ghost"
				size="icon"
				class="size-9"
				aria-label="Zoom in"
				disabled={zoom >= MAX_ZOOM}
				onclick={() => zoomAt(zoom * BUTTON_STEP)}
			>
				<Plus class="size-4" />
			</Button>
		</div>

		<!-- The stage can be any photo, so this needs its own surface to stay visible -->
		<Button
			variant="ghost"
			size="icon"
			class="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3 size-9 bg-(--surface)/90 text-(--text) shadow-md hover:bg-(--surface)"
			aria-label="Close full screen preview"
			onclick={() => (open = false)}
		>
			<X class="size-4" />
		</Button>
	</Dialog.Content>
</Dialog.Root>
