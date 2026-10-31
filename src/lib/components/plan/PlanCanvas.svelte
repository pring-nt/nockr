<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { flip } from 'svelte/animate';
	import {
		dragHandleZone,
		SHADOW_ITEM_MARKER_PROPERTY_NAME,
		type DndEvent
	} from 'svelte-dnd-action';
	import { appStore } from '$lib/stores/appState';
	import { renumberTerms } from '$lib/logic/terms';
	import type { Term } from '$lib/schemas';
	import TermColumn from '$lib/components/plan/TermColumn.svelte';
	import TermReorderDialog from '$lib/components/term/TermReorderDialog.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeftRight, Plus } from 'lucide-svelte';
	import { smoothScroll, type SmoothScrollController } from '$lib/actions/smoothScroll';

	let scroller: SmoothScrollController | null = null;
	let localTerms = $state<Term[]>(untrack(() => [...$appStore.terms]));
	let isDragging = $state(false);
	let isReorderOpen = $state(false);

	$effect(() => {
		const terms = $appStore.terms;
		if (!isDragging) localTerms = [...terms];
	});

	function isShadowItem(term: Term): boolean {
		return Boolean((term as Record<string, unknown>)[SHADOW_ITEM_MARKER_PROPERTY_NAME]);
	}

	function handleConsider(e: CustomEvent<DndEvent<Term>>) {
		isDragging = true;
		localTerms = e.detail.items;
	}

	function handleFinalize(e: CustomEvent<DndEvent<Term>>) {
		isDragging = false;
		const order = e.detail.items.map((term) => term.id);
		localTerms = e.detail.items;
		appStore.update((state) => ({
			...state,
			terms: renumberTerms(
				[...state.terms].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
			)
		}));
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
		<div
			use:dragHandleZone={{
				items: localTerms,
				type: 'plan-term',
				flipDurationMs: 200,
				dropTargetStyle: {}
			}}
			onconsider={handleConsider}
			onfinalize={handleFinalize}
			class="flex h-full gap-3 sm:gap-4"
		>
			{#each localTerms as term (term.id)}
				<div animate:flip={{ duration: 200 }} class="h-full shrink-0">
					{#if isShadowItem(term)}
						<div
							class="pointer-events-none visible! h-full w-70 rounded-xl border-2 border-dashed border-primary/50 bg-primary/10"
						></div>
					{:else}
						<TermColumn {term} />
					{/if}
				</div>
			{/each}
		</div>

		<div class="flex h-full w-50 shrink-0 flex-col items-stretch gap-2">
			<Button
				variant="outline"
				onclick={addTerm}
				class="h-12 w-full gap-2 border-dashed text-muted-foreground hover:text-foreground"
			>
				<Plus size={16} /> Add Term
			</Button>

			{#if $appStore.terms.length > 1}
				<Button
					variant="ghost"
					onclick={() => (isReorderOpen = true)}
					class="h-9 w-full gap-2 text-xs text-muted-foreground hover:text-foreground"
				>
					<ArrowLeftRight size={14} /> Reorder Terms
				</Button>
			{/if}
		</div>
	</div>
</main>

<TermReorderDialog bind:open={isReorderOpen} />
