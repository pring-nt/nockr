<script lang="ts">
	import { tick } from 'svelte';
	import { appStore } from '$lib/stores/appState';
	import TermColumn from '$lib/components/plan/TermColumn.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Plus } from 'lucide-svelte';

	let mainRef = $state<HTMLElement | null>(null);

	function handleWheelScroll(e: WheelEvent) {
		if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
		if (e.deltaY === 0) return;

		const container = e.currentTarget as HTMLElement;

		let target = e.target as HTMLElement | null;
		while (target && target !== container) {
			const style = window.getComputedStyle(target);
			const isScrollable =
				(style.overflowY === 'auto' || style.overflowY === 'scroll') &&
				target.scrollHeight > target.clientHeight;

			if (isScrollable) {
				const canScrollDown =
					e.deltaY > 0 && target.scrollTop + target.clientHeight < target.scrollHeight - 1;
				const canScrollUp = e.deltaY < 0 && target.scrollTop > 1;

				if (canScrollDown || canScrollUp) return;
			}
			target = target.parentElement;
		}
		const scrollAmount = e.deltaY;
		container.scrollLeft += scrollAmount;
		e.preventDefault();
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
	class="flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-auto overscroll-x-contain p-3 sm:snap-none sm:p-6"
>
	<div class="flex h-full items-start gap-3 sm:gap-4" style="width: max-content">
		{#each $appStore.terms as term (term.id)}
			<div class="snap-start">
				<TermColumn {term} />
			</div>
		{/each}

		<!-- Add New Term Column Trigger -->
		<div class="flex h-full w-50 shrink-0 snap-start items-start">
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
