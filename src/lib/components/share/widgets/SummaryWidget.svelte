<script lang="ts">
	import { appStore } from '$lib/stores/appState';
	import { computeCGPA, computeUnitsEarned } from '$lib/logic/gpa';
	import { matchTier } from '$lib/logic/honors';
	import { maskGpa as maskGpaFn } from '$lib/logic/share';
	import { Award } from 'lucide-svelte';

	let {
		maskGpa = false,
		showHonors = true
	}: {
		maskGpa?: boolean;
		showHonors?: boolean;
	} = $props();

	let cgpa = $derived(computeCGPA($appStore.terms));
	let unitsEarned = $derived(computeUnitsEarned($appStore.terms));
	let totalUnits = $derived($appStore.totalProgramUnits ?? 165);
	let remainingUnits = $derived(Math.max(0, totalUnits - unitsEarned));
	let progressPercent = $derived(
		totalUnits > 0 ? Math.min(100, Math.round((unitsEarned / totalUnits) * 100)) : 0
	);

	let formattedCgpa = $derived(cgpa === null ? '—' : maskGpa ? maskGpaFn(cgpa) : cgpa.toFixed(3));

	let latinTier = $derived(
		showHonors && $appStore.universitySettings.latinHonorsEnabled && cgpa !== null
			? matchTier(cgpa, $appStore.universitySettings.latinHonorsTiers)
			: null
	);
</script>

<div
	class="space-y-6 rounded-3xl border border-border/50 bg-card/90 p-8 shadow-lg backdrop-blur-md"
>
	<div class="grid grid-cols-3 items-start gap-4">
		<!-- Cumulative GPA Column -->
		<div class="min-w-0 space-y-2">
			<span class="block truncate text-xs font-bold tracking-wider text-muted-foreground uppercase">
				Cumulative GPA
			</span>
			<div
				class="gradient-text truncate font-mono text-5xl leading-none font-extrabold tracking-tight text-primary"
			>
				{formattedCgpa}
			</div>
			{#if latinTier}
				<div
					class="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-bold text-primary shadow-xs"
				>
					<Award size={14} class="shrink-0" />
					<span class="truncate">{latinTier.label}</span>
				</div>
			{/if}
		</div>

		<!-- Earned Units Column -->
		<div class="min-w-0 space-y-2 border-l border-border/40 pl-4">
			<span class="block truncate text-xs font-bold tracking-wider text-muted-foreground uppercase">
				Earned Units
			</span>
			<div class="gradient-text truncate font-mono text-4xl leading-none font-bold text-foreground">
				{unitsEarned}
			</div>
		</div>

		<!-- Units Remaining Column -->
		<div class="min-w-0 space-y-2 border-l border-border/40 pl-4">
			<span class="block truncate text-xs font-bold tracking-wider text-muted-foreground uppercase">
				Units Remaining
			</span>
			<div class="gradient-text truncate font-mono text-4xl leading-none font-bold text-foreground">
				{remainingUnits}
			</div>
		</div>
	</div>

	<!-- Progress Bar Row -->
	<div class="space-y-3 border-t border-border/40 pt-4">
		<div class="flex items-center justify-between text-sm font-semibold text-muted-foreground">
			<div class="flex items-center gap-1.5">
				<span>Degree Progress</span>
				<span class="font-mono font-extrabold text-foreground">({progressPercent}%)</span>
			</div>
			<span
				>Target: <span class="font-mono font-extrabold text-foreground">{totalUnits}</span> units</span
			>
		</div>

		<div class="h-3 w-full overflow-hidden rounded-full bg-muted/50">
			<div
				class="h-full bg-primary transition-all duration-500 ease-out"
				style="width: {progressPercent}%;"
			></div>
		</div>
	</div>
</div>
