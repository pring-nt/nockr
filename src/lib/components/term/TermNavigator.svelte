<script lang="ts">
	import { appStore } from '$lib/stores/appState';
	import { Plus, GraduationCap, ChevronLeft, ChevronRight, LayoutGrid, Eye } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import TermCard from '$lib/components/term/TermCard.svelte';
	import { tick } from 'svelte';
	import { fly } from 'svelte/transition';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	let viewMode = $derived($appStore.ui?.cardViewMode ?? 'focus');
	let pillsNavRef = $state<HTMLElement | null>(null);

	let targetScrollLeft = 0;
	let animationFrameId: number | null = null;
	let lastTime: number | null = null;

	function setViewMode(mode: 'focus' | 'grid') {
		appStore.update((state) => ({
			...state,
			ui: {
				...state.ui,
				cardViewMode: mode
			}
		}));
	}

	// Active term derived directly from SvelteKit's reactive page.url
	let activeTermId = $derived.by(() => {
		const terms = $appStore.terms;
		if (terms.length === 0) return null;

		const urlTermId = page.url.searchParams.get('termId');
		if (urlTermId && terms.some((t) => t.id === urlTermId)) {
			return urlTermId;
		}

		return terms[0].id;
	});

	let activeTermIndex = $derived($appStore.terms.findIndex((t) => t.id === activeTermId));
	let activeTerm = $derived($appStore.terms.find((t) => t.id === activeTermId));

	// Update URL parameter via SvelteKit router without full page reloads
	function setTerm(id: string | null) {
		const target = id ? `?termId=${id}` : page.url.pathname;
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(target, { replaceState: true, noScroll: true, keepFocus: true });
	}

	// Track initial load to prevent browser scroll restoration conflicts
	let isInitialLoad = $state(true);

	// Scroll active item into view when term or view mode changes
	$effect(() => {
		const id = activeTermId;
		const mode = viewMode;
		const hasExplicitUrlTermId = Boolean(page.url.searchParams.get('termId'));

		if (!id) return;

		// In grid mode, do not auto-scroll unless a termId parameter is explicitly in the URL
		if (mode === 'grid' && !hasExplicitUrlTermId) {
			isInitialLoad = false;
			return;
		}

		const scrollBehavior = isInitialLoad ? 'auto' : 'smooth';

		tick().then(() => {
			setTimeout(
				() => {
					const targetId = mode === 'grid' ? `term-card-${id}` : `term-pill-${id}`;
					const element = document.getElementById(targetId);

					if (element) {
						element.scrollIntoView({
							behavior: scrollBehavior,
							block: mode === 'grid' ? 'start' : 'nearest',
							inline: 'center'
						});
					}
					isInitialLoad = false;
				},
				isInitialLoad ? 100 : 50
			);
		});
	});

	// Term CRUD
	function addTerm() {
		const newId = crypto.randomUUID();
		appStore.update((state) => ({
			...state,
			terms: [...state.terms, { id: newId, name: `Term ${state.terms.length + 1}`, courses: [] }]
		}));
		setTerm(newId);
	}

	function deleteTerm(id: string) {
		const terms = $appStore.terms;
		const idx = terms.findIndex((t) => t.id === id);

		if (activeTermId === id) {
			if (idx > 0) {
				setTerm(terms[idx - 1].id);
			} else if (idx < terms.length - 1) {
				setTerm(terms[idx + 1].id);
			} else {
				setTerm(null);
			}
		}

		appStore.update((state) => ({
			...state,
			terms: state.terms.filter((t) => t.id !== id)
		}));
	}

	function renameTerm(id: string, name: string) {
		appStore.update((state) => ({
			...state,
			terms: state.terms.map((t) => (t.id === id ? { ...t, name } : t))
		}));
	}

	// Navigation
	function prevTerm() {
		if (activeTermIndex > 0) {
			setTerm($appStore.terms[activeTermIndex - 1].id);
		}
	}

	function nextTerm() {
		if (activeTermIndex < $appStore.terms.length - 1) {
			setTerm($appStore.terms[activeTermIndex + 1].id);
		}
	}

	function switchToGrid() {
		setViewMode('grid');
	}

	function stepScroll(timestamp: number) {
		if (!pillsNavRef) {
			animationFrameId = null;
			lastTime = null;
			return;
		}

		if (lastTime === null) lastTime = timestamp;
		const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
		lastTime = timestamp;

		const current = pillsNavRef.scrollLeft;
		const diff = targetScrollLeft - current;

		if (Math.abs(diff) < 0.5) {
			pillsNavRef.scrollLeft = targetScrollLeft;
			animationFrameId = null;
			lastTime = null;
			return;
		}

		const lerp = 1 - Math.exp(-20 * dt);
		pillsNavRef.scrollLeft = current + diff * lerp;

		animationFrameId = requestAnimationFrame(stepScroll);
	}

	function handleWheelScroll(e: WheelEvent) {
		if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
		if (e.deltaY === 0) return;

		const container = e.currentTarget as HTMLElement;

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
</script>

{#if $appStore.terms.length === 0}
	<!-- Empty State -->
	<div class="glass mt-8 space-y-3 rounded-xl border-border/30 px-4 py-12 text-center">
		<div
			class="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary"
		>
			<GraduationCap size={20} />
		</div>
		<div>
			<p class="font-medium text-foreground">No terms added yet</p>
			<p class="mt-0.5 text-xs text-muted-foreground">
				Add your first academic term to start tracking grades
			</p>
		</div>
		<Button onclick={addTerm} variant="default" size="sm" class="mt-4 gap-2">
			<Plus size={16} /> Add Term
		</Button>
	</div>
{:else}
	<!-- Pill Nav + View Toggle -->
	<div class="flex flex-col justify-between gap-4 pt-2 sm:flex-row sm:items-center">
		<div
			bind:this={pillsNavRef}
			onwheel={handleWheelScroll}
			class="-mx-4 flex flex-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent items-center gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
		>
			{#each $appStore.terms as term (term.id)}
				<button
					id="term-pill-{term.id}"
					onclick={() => {
						setTerm(String(term.id));
						setViewMode('focus');
					}}
					class="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all
                  {activeTermId === term.id && viewMode === 'focus'
						? 'bg-primary text-primary-foreground shadow-sm'
						: 'bg-muted/50 text-muted-foreground hover:bg-muted'}"
				>
					{term.name}
				</button>
			{/each}
		</div>

		<div
			class="flex shrink-0 items-center gap-1 self-start rounded-lg border border-border/40 bg-muted/30 p-1 sm:self-auto"
		>
			<Button
				variant={viewMode === 'focus' ? 'secondary' : 'ghost'}
				size="sm"
				class="h-7 px-2.5"
				onclick={() => setViewMode('focus')}
			>
				<Eye size={14} class="mr-1.5" />
				<span class="text-xs">Focus</span>
			</Button>
			<Button
				variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
				size="sm"
				class="h-7 px-2.5"
				onclick={switchToGrid}
			>
				<LayoutGrid size={14} class="mr-1.5" />
				<span class="text-xs">All</span>
			</Button>
		</div>
	</div>

	<!-- Focus View -->
	{#if viewMode === 'focus' && activeTerm}
		<div class="space-y-4">
			<div class="flex items-center justify-between px-1 text-xs text-muted-foreground">
				<Button
					variant="ghost"
					size="sm"
					onclick={prevTerm}
					disabled={activeTermIndex <= 0}
					class="h-7 gap-1 px-2"
				>
					<ChevronLeft size={14} /> Prev
				</Button>
				<span class="font-medium">
					Term {activeTermIndex + 1} of {$appStore.terms.length}
				</span>
				<Button
					variant="ghost"
					size="sm"
					onclick={nextTerm}
					disabled={activeTermIndex >= $appStore.terms.length - 1}
					class="h-7 gap-1 px-2"
				>
					Next <ChevronRight size={14} />
				</Button>
			</div>

			{#key activeTermId}
				{@const term = activeTerm}
				<div in:fly={{ y: 10, duration: 200, opacity: 0 }}>
					<TermCard
						{term}
						onDelete={() => deleteTerm(term.id)}
						onRename={(name) => renameTerm(term.id, name)}
					/>
				</div>
			{/key}
		</div>

		<!-- Grid View -->
	{:else if viewMode === 'grid'}
		<div class="animate-in space-y-6 duration-300 fade-in">
			{#each $appStore.terms as term (term.id)}
				<div id="term-card-{term.id}" class="scroll-mt-20">
					<TermCard
						{term}
						onDelete={() => deleteTerm(term.id)}
						onRename={(name) => renameTerm(term.id, name)}
					/>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Add Term -->
	<Button
		onclick={addTerm}
		variant="ghost"
		class="glass mt-4 w-full gap-2 border border-border/30 py-5 text-foreground hover:bg-muted/30"
	>
		<Plus size={16} />
		Add Another Term
	</Button>
{/if}
