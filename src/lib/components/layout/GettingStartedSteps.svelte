<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Check, FileSpreadsheet, Plus } from 'lucide-svelte';
	import { appStore } from '$lib/stores/appState';
	import { isProgramUnitsSet, isValidProgramUnits } from '$lib/logic/unitCalc';
	import { cn } from '$lib/utils.js';
	import type { UniversityMode } from '$lib/schemas';

	let { onClose, onImport }: { onClose: () => void; onImport: () => void } = $props();

	const schools: { mode: UniversityMode; label: string; name: string }[] = [
		{ mode: 'dlsu', label: 'DLSU', name: 'De La Salle University' },
		{ mode: 'up', label: 'UP', name: 'University of the Philippines' },
		{ mode: 'ust', label: 'UST', name: 'University of Santo Tomas' },
		{ mode: 'admu', label: 'ADMU', name: 'Ateneo de Manila University' },
		{ mode: 'custom', label: 'Custom', name: 'Use your own grading rules' }
	];
	const stepCount = 3;

	let step = $state(1);
	let units = $state<number | null>(
		isProgramUnitsSet($appStore) ? $appStore.totalProgramUnits : null
	);

	let mode = $derived($appStore.universitySettings.mode);
	let termCount = $derived($appStore.terms.length);

	function saveUnits() {
		if (!isValidProgramUnits(units)) return;
		appStore.setProgramUnits(units);
		step = 3;
	}

	function addFirstTerm() {
		appStore.update((state) => ({
			...state,
			terms: [{ id: crypto.randomUUID(), name: 'Term 1', courses: [] }]
		}));
		onClose();
		goto(resolve('/'));
	}
</script>

<Dialog.Header class="space-y-3 text-left">
	<div class="flex gap-1.5 pr-8" aria-hidden="true">
		{#each { length: stepCount }, i (i)}
			<span class={cn('h-1 flex-1 rounded-full', i < step ? 'bg-primary' : 'bg-muted/60')}></span>
		{/each}
	</div>

	<div class="space-y-1">
		<Dialog.Title class="text-lg font-bold sm:text-xl">
			{#if step === 1}
				Which school are you from?
			{:else if step === 2}
				How many units is your program?
			{:else}
				Add your grades
			{/if}
		</Dialog.Title>
		<Dialog.Description class="text-xs text-muted-foreground">
			Step {step} of {stepCount}.
			{#if step === 1}
				This sets your grading scale and honors rules.
			{:else if step === 2}
				Your curriculum or flowchart will have the total.
			{:else}
				Your TGPA and CGPA update as you type.
			{/if}
		</Dialog.Description>
	</div>
</Dialog.Header>

<div class="mt-3 flex-1 space-y-2 overflow-y-auto px-1 py-1">
	{#if step === 1}
		{#each schools as school (school.mode)}
			<button
				type="button"
				aria-pressed={mode === school.mode}
				onclick={() => appStore.selectUniversity(school.mode)}
				class={cn(
					'flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none',
					mode === school.mode
						? 'border-primary/50 bg-primary/10'
						: 'border-muted-foreground/20 bg-muted/50 hover:bg-muted/80'
				)}
			>
				<span class="w-14 shrink-0 text-sm font-semibold text-foreground">{school.label}</span>
				<span class="flex-1 text-xs text-muted-foreground">{school.name}</span>
				{#if mode === school.mode}
					<Check size={16} class="shrink-0 text-primary" />
				{/if}
			</button>
		{/each}

		{#if mode === 'custom'}
			<p class="pt-1 text-[11px] leading-relaxed text-muted-foreground">
				You can set your scale and honors tiers in the University section of Settings.
			</p>
		{/if}
	{:else if step === 2}
		<div class="flex items-center gap-2">
			<Input
				type="number"
				min="1"
				bind:value={units}
				placeholder="e.g. 165"
				aria-label="Total program units"
				class="h-10 w-32 border-muted-foreground/30 bg-background/50 text-center font-mono"
				onkeydown={(e) => e.key === 'Enter' && saveUnits()}
			/>
			<span class="text-sm text-muted-foreground">units</span>
		</div>
		<p class="text-[11px] leading-relaxed text-muted-foreground">
			This drives your units remaining, your best possible honors, and Unit Runway. It's different
			for every program, so we can't fill it in for you.
		</p>
		<button
			type="button"
			onclick={() => (step = 3)}
			class="cursor-pointer text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
		>
			I'm not sure yet
		</button>
	{:else}
		{#if mode === 'dlsu'}
			<button
				type="button"
				onclick={onImport}
				class="flex w-full cursor-pointer gap-3 rounded-lg border border-primary/30 bg-primary/10 p-3 text-left transition-colors hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
			>
				<FileSpreadsheet size={16} class="mt-0.5 shrink-0 text-primary" />
				<span class="space-y-0.5">
					<span class="block text-sm font-semibold text-foreground">Import from ArchersHub</span>
					<span class="block text-xs leading-relaxed text-muted-foreground">
						Brings in your grade history and fills your checklist. Core courses only, so add
						electives and minors yourself.
					</span>
				</span>
			</button>
		{/if}

		{#if termCount === 0}
			<button
				type="button"
				onclick={addFirstTerm}
				class="flex w-full cursor-pointer gap-3 rounded-lg border border-muted-foreground/20 bg-muted/50 p-3 text-left transition-colors hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
			>
				<Plus size={16} class="mt-0.5 shrink-0 text-primary" />
				<span class="space-y-0.5">
					<span class="block text-sm font-semibold text-foreground">Add my first term</span>
					<span class="block text-xs leading-relaxed text-muted-foreground">
						Enter your courses, units, and grades. Courses with no grade yet stay out of your GPA.
					</span>
				</span>
			</button>
		{:else}
			<p class="text-xs text-muted-foreground">
				You have {termCount}
				{termCount === 1 ? 'term' : 'terms'} saved already.
			</p>
		{/if}

		<p class="pt-1 text-[11px] leading-relaxed text-muted-foreground">
			Your data stays in this browser, so keep a backup from Settings before clearing site data or
			switching devices.
		</p>
	{/if}
</div>

<Dialog.Footer class="mt-3 flex-row justify-between sm:justify-between">
	{#if step > 1}
		<Button variant="ghost" size="sm" onclick={() => (step -= 1)}>Back</Button>
	{:else}
		<span></span>
	{/if}

	{#if step === 1}
		<Button size="sm" onclick={() => (step = 2)}>Next</Button>
	{:else if step === 2}
		<Button size="sm" disabled={!isValidProgramUnits(units)} onclick={saveUnits}>Next</Button>
	{:else}
		<Button size="sm" onclick={onClose}>Done</Button>
	{/if}
</Dialog.Footer>
