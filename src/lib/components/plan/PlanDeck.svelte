<script lang="ts">
	import { appStore } from '$lib/stores/appState';
	import { computeTermTotalUnits } from '$lib/logic/gpa';
	import { swipeDeck } from '$lib/actions/swipeDeck';
	import TermColumn from '$lib/components/plan/TermColumn.svelte';
	import TermReorderDialog from '$lib/components/term/TermReorderDialog.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeftRight, ChevronLeft, ChevronRight, Plus } from 'lucide-svelte';

	const SETTLE_MS = 220;
	const COMMIT_RATIO = 0.28;
	const COMMIT_VELOCITY = 0.5;
	const MAX_TILT_DEG = 10;

	let terms = $derived($appStore.terms);

	let activeId = $state<string | null>(null);
	let dx = $state(0);
	let isSettling = $state(false);
	let width = $state(0);
	let isReorderOpen = $state(false);

	let activeIndex = $derived(
		Math.max(
			0,
			terms.findIndex((term) => term.id === activeId)
		)
	);
	let peekTerm = $derived(dx > 0 ? terms[activeIndex - 1] : terms[activeIndex + 1]);
	let tilt = $derived(width > 0 ? (dx / width) * MAX_TILT_DEG : 0);

	function handleMove(next: number) {
		if (isSettling) return;
		const isAtEnd =
			(next > 0 && activeIndex === 0) || (next < 0 && activeIndex === terms.length - 1);
		dx = isAtEnd ? next * 0.3 : next;
	}

	function settle(to: number, onDone?: () => void) {
		isSettling = true;
		dx = to;
		window.setTimeout(() => {
			onDone?.();
			dx = 0;
			isSettling = false;
		}, SETTLE_MS);
	}

	function fling(direction: -1 | 1) {
		const target = terms[activeIndex + direction];
		if (!target || isSettling) return;
		settle(-direction * width * 1.4, () => (activeId = target.id));
	}

	function handleRelease(distance: number, velocity: number) {
		if (isSettling) return;
		const isCommitted =
			Math.abs(distance) > width * COMMIT_RATIO || Math.abs(velocity) > COMMIT_VELOCITY;
		const direction = distance < 0 ? 1 : -1;

		if (isCommitted && terms[activeIndex + direction]) fling(direction);
		else settle(0);
	}

	// A held course needs its target under the finger right away, so this flip does not animate
	function handleEdgeHold(direction: -1 | 1) {
		const target = terms[activeIndex + direction];
		if (target) activeId = target.id;
	}

	function addTerm() {
		const id = crypto.randomUUID();
		appStore.update((state) => ({
			...state,
			terms: [...state.terms, { id, name: `Term ${state.terms.length + 1}`, courses: [] }]
		}));
		activeId = id;
	}
</script>

<div class="flex min-h-0 flex-1 flex-col">
	<div class="flex h-11 shrink-0 items-center gap-1 px-3">
		<Button
			variant="ghost"
			size="icon"
			class="h-9 w-9 shrink-0"
			aria-label="Previous term"
			disabled={activeIndex === 0}
			onclick={() => fling(-1)}
		>
			<ChevronLeft size={18} />
		</Button>

		<p class="min-w-0 flex-1 truncate text-center text-xs text-muted-foreground">
			{#if terms.length > 0}
				{activeIndex + 1} of {terms.length}
			{:else}
				No terms yet
			{/if}
		</p>

		<Button
			variant="ghost"
			size="icon"
			class="h-9 w-9 shrink-0"
			aria-label="Next term"
			disabled={activeIndex >= terms.length - 1}
			onclick={() => fling(1)}
		>
			<ChevronRight size={18} />
		</Button>

		{#if terms.length > 1}
			<Button
				variant="ghost"
				size="icon"
				class="h-9 w-9 shrink-0 text-muted-foreground"
				aria-label="Reorder terms"
				onclick={() => (isReorderOpen = true)}
			>
				<ArrowLeftRight size={16} />
			</Button>
		{/if}

		<Button
			variant="ghost"
			size="icon"
			class="h-9 w-9 shrink-0 text-muted-foreground"
			aria-label="Add term"
			onclick={addTerm}
		>
			<Plus size={18} />
		</Button>
	</div>

	<div
		bind:clientWidth={width}
		use:swipeDeck={{ onMove: handleMove, onRelease: handleRelease, onEdgeHold: handleEdgeHold }}
		class="relative isolate min-h-0 flex-1 touch-pan-y overflow-hidden"
	>
		{#if peekTerm}
			<div
				aria-hidden="true"
				class="absolute inset-x-3 top-1 bottom-3 z-0 scale-[0.96] rounded-xl border border-border/50 bg-card p-3 motion-reduce:hidden"
			>
				<p class="truncate text-sm font-semibold text-foreground">{peekTerm.name}</p>
				<p class="mt-1 font-mono text-[11px] text-muted-foreground">
					{computeTermTotalUnits(peekTerm)} units
				</p>
			</div>
		{/if}

		<!-- Every term stays mounted so a held course can land on a neighbour; only one is on screen -->
		{#each terms as term, index (term.id)}
			<div
				inert={index !== activeIndex}
				class="absolute inset-x-3 top-1 bottom-3"
				style:z-index={index === activeIndex ? 10 : 0}
				style:transform={index === activeIndex
					? `translateX(${dx}px) rotate(${tilt}deg)`
					: `translateX(${index < activeIndex ? -130 : 130}%)`}
				style:transition={index === activeIndex && isSettling
					? `transform ${SETTLE_MS}ms ease-out`
					: 'none'}
			>
				<TermColumn {term} deck />
			</div>
		{/each}

		{#if terms.length === 0}
			<div class="flex h-full items-center justify-center">
				<Button variant="outline" class="gap-2 border-dashed" onclick={addTerm}>
					<Plus size={16} /> Add Term
				</Button>
			</div>
		{/if}
	</div>
</div>

<TermReorderDialog bind:open={isReorderOpen} />
