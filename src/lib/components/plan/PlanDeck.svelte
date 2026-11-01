<script lang="ts">
	import { animate, cubicBezier } from 'animejs';
	import { appStore } from '$lib/stores/appState';
	import { isMotionReduced } from '$lib/motion';
	import { swipeDeck } from '$lib/actions/swipeDeck';
	import TermColumn from '$lib/components/plan/TermColumn.svelte';
	import TermReorderDialog from '$lib/components/term/TermReorderDialog.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeftRight, ChevronLeft, ChevronRight, Plus } from 'lucide-svelte';

	const SETTLE_MS = 220;
	const POP_MS = 320;
	const POP_EASE = cubicBezier(0.34, 1.56, 0.64, 1);
	const COMMIT_RATIO = 0.28;
	const COMMIT_VELOCITY = 0.5;
	const MAX_TILT_DEG = 10;
	const REVEAL_SCALE = 0.92;

	let terms = $derived($appStore.terms);

	let activeId = $state<string | null>(null);
	let dx = $state(0);
	let revealDirection = $state<-1 | 0 | 1>(0);
	let isSettling = $state(false);
	let revealScale = $state(REVEAL_SCALE);
	let width = $state(0);
	let isReorderOpen = $state(false);

	let activeIndex = $derived(
		Math.max(
			0,
			terms.findIndex((term) => term.id === activeId)
		)
	);
	let revealIndex = $derived(revealDirection === 0 ? -1 : activeIndex + revealDirection);
	let revealTerm = $derived(terms[revealIndex]);
	let tilt = $derived(width > 0 ? (dx / width) * MAX_TILT_DEG : 0);
	// Fully visible by the point where letting go would commit the swipe
	let labelOpacity = $derived(width > 0 ? Math.min(1, Math.abs(dx) / (width * COMMIT_RATIO)) : 0);

	function handleMove(next: number) {
		if (isSettling) return;
		const isAtEnd =
			(next > 0 && activeIndex === 0) || (next < 0 && activeIndex === terms.length - 1);
		revealDirection = next < 0 ? 1 : -1;
		dx = isAtEnd ? next * 0.3 : next;
	}

	function reset() {
		dx = 0;
		revealDirection = 0;
		revealScale = REVEAL_SCALE;
		isSettling = false;
	}

	function settle(to: number, onCommit?: () => void) {
		if (isMotionReduced()) {
			onCommit?.();
			reset();
			return;
		}

		isSettling = true;
		const pose = { dx, scale: REVEAL_SCALE };

		animate(pose, {
			dx: { to, duration: SETTLE_MS, ease: 'outCubic' },
			scale: { to: onCommit ? 1 : REVEAL_SCALE, duration: POP_MS, ease: POP_EASE },
			onUpdate: () => {
				dx = pose.dx;
				revealScale = pose.scale;
			},
			onComplete: () => {
				onCommit?.();
				reset();
			}
		});
	}

	function fling(direction: -1 | 1) {
		const target = terms[activeIndex + direction];
		if (!target || isSettling) return;
		revealDirection = direction;
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
		<!-- Every term stays mounted so a held course can land on a neighbour and a swipe can reveal
		     the real next card; the rest wait off screen -->
		{#each terms as term, index (term.id)}
			<div
				inert={index !== activeIndex}
				class="absolute inset-x-3 top-1 bottom-3"
				style:z-index={index === activeIndex ? 10 : 0}
				style:transform={index === activeIndex
					? `translateX(${dx}px) rotate(${tilt}deg)`
					: index === revealIndex
						? `scale(${revealScale})`
						: `translateX(${index < activeIndex ? -130 : 130}%)`}
			>
				<TermColumn {term} deck />
			</div>
		{/each}

		{#if revealTerm && !isSettling}
			<div
				aria-hidden="true"
				class="pointer-events-none absolute top-1/2 z-20 flex max-w-[60%] -translate-y-1/2 items-center gap-1 rounded-sm border border-border bg-popover px-2 py-1 text-xs font-medium text-popover-foreground shadow-md"
				class:right-3={revealDirection === 1}
				class:left-3={revealDirection === -1}
				style:opacity={labelOpacity}
			>
				{#if revealDirection === -1}
					<ChevronLeft size={14} class="shrink-0" />
				{/if}
				<span class="truncate">{revealTerm.name}</span>
				{#if revealDirection === 1}
					<ChevronRight size={14} class="shrink-0" />
				{/if}
			</div>
		{/if}

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
