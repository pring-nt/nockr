<script lang="ts">
	import type { Term } from '$lib/schemas';
	import { appStore } from '$lib/stores/appState';
	import { computeTGPA } from '$lib/logic/gpa';
	import { getDeansListTier } from '$lib/logic/honors';
	import { maskGpa as maskGpaFn } from '$lib/logic/share';
	import { GraduationCap } from 'lucide-svelte';

	let {
		term,
		maskGpa = false,
		showDeansListBadge = true
	}: {
		term?: Term;
		maskGpa?: boolean;
		showDeansListBadge?: boolean;
	} = $props();

	let tgpa = $derived(term ? computeTGPA(term) : null);
	let totalUnits = $derived(term ? term.courses.reduce((acc, c) => acc + (c.units || 0), 0) : 0);

	let formattedTgpa = $derived(tgpa === null ? '—' : maskGpa ? maskGpaFn(tgpa) : tgpa.toFixed(3));

	let deansListTier = $derived(
		showDeansListBadge && term && tgpa !== null
			? getDeansListTier(term, tgpa, $appStore.universitySettings)
			: null
	);
</script>

{#if term}
	<div class="rounded-3xl border border-border/50 bg-card/90 p-7 shadow-lg backdrop-blur-md">
		<div class="flex items-start justify-between gap-4">
			<div class="flex min-w-0 flex-1 flex-col gap-1">
				<p class="text-xs font-bold tracking-wider text-muted-foreground uppercase">Term</p>
				<div class="flex min-w-0 items-center gap-3">
					<h3 class="truncate text-3xl font-black text-foreground">{term.name}</h3>
					<span
						class="inline-flex shrink-0 items-center rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 font-mono text-xs font-bold text-primary"
					>
						{totalUnits}
						{totalUnits === 1 ? 'unit' : 'units'}
					</span>
				</div>
			</div>

			<div class="shrink-0 text-right">
				<p class="text-xs font-bold tracking-wider text-muted-foreground uppercase">TGPA</p>
				<p class="gradient-text font-mono text-4xl leading-tight font-black text-primary">
					{formattedTgpa}
				</p>
			</div>
		</div>

		{#if deansListTier}
			<div
				class="mt-5 flex items-center gap-3.5 rounded-2xl border border-primary/40 bg-linear-to-r from-primary/25 via-primary/10 to-accent/20 p-4 shadow-md ring-1 ring-primary/30"
			>
				<div
					class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary ring-1 ring-primary/40"
				>
					<GraduationCap class="size-6 text-primary" />
				</div>
				<div class="flex min-w-0 flex-1 flex-col">
					<span class="text-[10px] font-bold tracking-widest text-primary/80 uppercase">
						Academic Honor
					</span>
					<span class="gradient-text text-lg leading-tight font-black tracking-tight">
						{deansListTier.label}
					</span>
				</div>
			</div>
		{/if}
	</div>
{/if}
