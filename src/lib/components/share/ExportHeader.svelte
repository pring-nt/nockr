<script lang="ts">
	import { captureCanvas } from '$lib/logic/share';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, Copy, Download, LoaderCircle, Share2 } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let {
		backHref,
		fileName,
		canvasEl
	}: {
		backHref: string;
		fileName: string;
		canvasEl: HTMLElement | undefined;
	} = $props();

	let isCapturing = $state(false);
	let canNativeShare = $state(false);

	$effect(() => {
		const probe = new File([], 'nockr.png', { type: 'image/png' });
		canNativeShare = navigator.canShare?.({ files: [probe] }) ?? false;
	});

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

<header
	class="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-4 sm:mb-8 sm:pb-6"
>
	<div class="flex items-center gap-3 sm:gap-4">
		<Button href={backHref} variant="ghost" size="icon" aria-label="Back" class="size-8 sm:size-9">
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
