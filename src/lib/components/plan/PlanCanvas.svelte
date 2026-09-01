<script lang="ts">
	import { tick } from 'svelte';
	import { appStore } from '$lib/stores/appState';
	import TermColumn from '$lib/components/plan/TermColumn.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Plus } from 'lucide-svelte';

	let mainRef = $state<HTMLElement | null>(null);

	let targetScrollLeft = 0;
	let animationFrameId: number | null = null;
	let lastTime: number | null = null;

	function stepScroll(timestamp: number) {
		if (!mainRef) {
			animationFrameId = null;
			lastTime = null;
			return;
		}

		if (lastTime === null) lastTime = timestamp;
		const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
		lastTime = timestamp;

		const current = mainRef.scrollLeft;
		const diff = targetScrollLeft - current;

		if (Math.abs(diff) < 0.5) {
			mainRef.scrollLeft = targetScrollLeft;
			animationFrameId = null;
			lastTime = null;
			return;
		}

		const lerp = 1 - Math.exp(-20 * dt);
		mainRef.scrollLeft = current + diff * lerp;

		animationFrameId = requestAnimationFrame(stepScroll);
	}

	function handleWheelScroll(e: WheelEvent) {
		// Ignore native trackpad horizontal scrolls
		if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
		if (e.deltaY === 0) return;

		const container = e.currentTarget as HTMLElement;

		// Prevent horizontal panning if cursor is over any vertically scrollable container
		let target = e.target as HTMLElement | null;
		while (target && target !== container) {
			if (target.scrollHeight > target.clientHeight) {
				const overflowY = getComputedStyle(target).overflowY;
				if (overflowY === 'auto' || overflowY === 'scroll') {
					return;
				}
			}
			target = target.parentElement;
		}

		e.preventDefault();

		let delta = e.deltaY;
		if (e.deltaMode === 1) {
			delta *= 16;
		} else if (e.deltaMode === 2) {
			delta *= container.clientWidth;
		}

		if (animationFrameId === null) {
			targetScrollLeft = container.scrollLeft;
		}

		const maxScroll = container.scrollWidth - container.clientWidth;
		targetScrollLeft = Math.max(0, Math.min(maxScroll, targetScrollLeft + delta));

		if (animationFrameId === null) {
			lastTime = null;
			animationFrameId = requestAnimationFrame(stepScroll);
		}
	}

	async function addTerm() {
		const newId = crypto.randomUUID();
		appStore.update((state) => ({
			...state,
			terms: [
				...state.terms,
				{
					id: newId,
					name: `Term ${state.terms.length + 1}`,
					courses: []
				}
			]
		}));

		await tick();
		if (mainRef) {
			mainRef.scrollTo({
				left: mainRef.scrollWidth,
				behavior: 'smooth'
			});
		}
	}
</script>

<main
	bind:this={mainRef}
	onwheel={handleWheelScroll}
	class="flex-1 overflow-x-auto overflow-y-hidden overscroll-x-contain p-3 sm:p-6"
>
	<div class="flex h-full gap-3 sm:gap-4" style="width: max-content">
		{#each $appStore.terms as term (term.id)}
			<div class="h-full shrink-0">
				<TermColumn {term} />
			</div>
		{/each}

		<div class="flex h-full w-50 shrink-0 items-start">
			<Button
				variant="outline"
				onclick={addTerm}
				class="h-12 w-full gap-2 border-dashed text-muted-foreground hover:text-foreground"
			>
				<Plus size={16} /> Add Term
			</Button>
		</div>
	</div>
</main>
