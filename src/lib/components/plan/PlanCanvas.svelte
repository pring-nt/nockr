<script lang="ts">
	import { tick } from 'svelte';
	import { appStore } from '$lib/stores/appState';
	import TermColumn from '$lib/components/plan/TermColumn.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Plus } from 'lucide-svelte';
	import { smoothScroll, type SmoothScrollController } from '$lib/actions/smoothScroll';

	let scroller: SmoothScrollController | null = null;

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
		requestAnimationFrame(() => {
			scroller?.scrollTo(Infinity);
		});
	}
</script>

<main
	use:smoothScroll={(c) => (scroller = c)}
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
