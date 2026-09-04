<script lang="ts">
	import { appStore } from '$lib/stores/appState';
	import { calcAtGrade, generateGradeSteps, type GradeStepResult } from '$lib/logic/unitCalc';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import { cn } from '$lib/utils';
	import {
		Calculator,
		CircleCheck,
		CircleX,
		GraduationCap,
		Ban,
		Award,
		Target,
		Minus,
		Plus
	} from 'lucide-svelte';

	let { open = $bindable(false) }: { open: boolean } = $props();

	// Settings and program state
	let settings = $derived($appStore.universitySettings);
	let totalProgramUnits = $derived($appStore.totalProgramUnits ?? 165);

	// Calculate current CGPA & units earned
	let stats = $derived.by(() => {
		let earned = 0;
		let points = 0;

		for (const term of $appStore.terms ?? []) {
			for (const course of term.courses ?? []) {
				if (course.grade !== null && course.grade !== undefined && course.units > 0) {
					earned += course.units;
					points += course.units * course.grade;
				}
			}
		}

		const cgpa = earned > 0 ? points / earned : 0;
		return {
			cgpa: Math.round(cgpa * 1000) / 1000,
			unitsEarned: earned,
			remainingUnits: Math.max(0, totalProgramUnits - earned)
		};
	});

	// Honor Tiers available
	let honorTiers = $derived(settings?.latinHonorsTiers ?? []);

	// Target Mode: 'honor' or 'custom'
	let targetMode = $state<'honor' | 'custom'>('honor');
	let selectedHonorId = $state<string>('');
	let customTargetInput = $state<string>('');

	// Automatically default targetMode to 'custom' if no tiers exist
	$effect(() => {
		if (honorTiers.length === 0) {
			targetMode = 'custom';
		} else if (!selectedHonorId || !honorTiers.some((t) => t.id === selectedHonorId)) {
			selectedHonorId = honorTiers[0].id;
		}
	});

	let activeTier = $derived(honorTiers.find((t) => t.id === selectedHonorId) ?? honorTiers[0]);

	// Effective target CGPA based on mode
	let effectiveTargetCGPA = $derived.by<number | null>(() => {
		if (targetMode === 'custom') {
			const parsed = parseFloat(customTargetInput);
			return isNaN(parsed) || parsed < 0 ? null : parsed;
		}
		if (!activeTier || !settings) return null;
		return settings.gradeDirection === 'ascending' ? activeTier.lowerBound : activeTier.upperBound;
	});

	// Best grade available (e.g. 4.0 or 1.0)
	let bestGrade = $derived(
		settings?.gradeDirection === 'ascending' ? (settings?.gradeMax ?? 4) : (settings?.gradeMin ?? 1)
	);

	// Grade steps available for university
	let gradeSteps = $derived(settings ? generateGradeSteps(settings) : []);
	let selectedGradeStep = $state<number | null>(null);

	// Automatically default selected grade step to max grade (top grade)
	$effect(() => {
		if (
			gradeSteps.length > 0 &&
			(selectedGradeStep === null || !gradeSteps.includes(selectedGradeStep))
		) {
			selectedGradeStep = gradeSteps[0];
		}
	});

	// --- Grade Stepper & Input Logic ---
	let gradeIsFocused = $state(false);
	let gradeLiveValue = $state('');

	let gradeDisplay = $derived(
		gradeIsFocused ? gradeLiveValue : selectedGradeStep !== null ? selectedGradeStep.toFixed(2) : ''
	);

	function handleGradeFocus() {
		gradeLiveValue = selectedGradeStep !== null ? selectedGradeStep.toFixed(2) : '';
		gradeIsFocused = true;
	}

	function handleGradeBlur() {
		gradeIsFocused = false;
		const parsed = parseFloat(gradeLiveValue);
		if (!isNaN(parsed) && gradeSteps.length > 0) {
			selectedGradeStep = gradeSteps.reduce((prev, curr) =>
				Math.abs(curr - parsed) < Math.abs(prev - parsed) ? curr : prev
			);
		} else if (gradeSteps.length > 0) {
			selectedGradeStep = gradeSteps[0];
		}
	}

	function handleGradeInput(e: Event) {
		const target = e.target as HTMLInputElement;
		gradeLiveValue = target.value;
		const parsed = parseFloat(target.value);
		if (!isNaN(parsed)) {
			const match = gradeSteps.find((g) => Math.abs(g - parsed) < 0.001);
			if (match !== undefined) {
				selectedGradeStep = match;
			}
		}
	}

	function updateGradeStep(direction: 'up' | 'down') {
		if (selectedGradeStep === null || gradeSteps.length === 0) return;

		const sorted = [...gradeSteps].sort((a, b) => a - b);
		const currIdx = sorted.indexOf(selectedGradeStep);

		let nextIdx: number;
		if (direction === 'up') {
			nextIdx = Math.min(sorted.length - 1, (currIdx === -1 ? 0 : currIdx) + 1);
		} else {
			nextIdx = Math.max(0, (currIdx === -1 ? 0 : currIdx) - 1);
		}

		selectedGradeStep = sorted[nextIdx];
		gradeLiveValue = selectedGradeStep.toFixed(2);
	}

	function onGradeKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowUp') {
			e.preventDefault();
			updateGradeStep('up');
		}
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			updateGradeStep('down');
		}
	}

	// Calculation result for the currently selected grade step
	let selectedStepResult = $derived.by<GradeStepResult | null>(() => {
		if (effectiveTargetCGPA === null || selectedGradeStep === null || !settings) {
			return null;
		}
		return calcAtGrade(
			stats.cgpa,
			stats.unitsEarned,
			totalProgramUnits,
			effectiveTargetCGPA,
			selectedGradeStep,
			settings
		);
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="max-h-[90vh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto rounded-2xl p-4 sm:max-w-2xl sm:p-6"
	>
		<Dialog.Header class="space-y-1 pb-1">
			<div class="flex items-center gap-2 text-primary">
				<div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
					<Calculator class="size-4 text-primary" />
				</div>
				<Dialog.Title class="text-base font-bold tracking-tight sm:text-lg">
					Unit Runway Calculator
				</Dialog.Title>
			</div>
			<Dialog.Description class="text-xs text-muted-foreground">
				Calculate how many units of a specific grade you can afford before dropping below your
				target CGPA.
			</Dialog.Description>
		</Dialog.Header>

		<!-- Stat Overview Ribbon -->
		<div
			class="grid grid-cols-3 gap-1.5 rounded-xl border border-border/50 bg-muted/40 p-2.5 text-xs sm:gap-2 sm:p-3"
		>
			<div>
				<span class="block truncate text-[10px] font-medium text-muted-foreground sm:text-[11px]"
					>Current CGPA</span
				>
				<p class="text-sm font-bold text-foreground sm:text-base">{stats.cgpa.toFixed(3)}</p>
			</div>
			<div>
				<span class="block truncate text-[10px] font-medium text-muted-foreground sm:text-[11px]"
					>Units Completed</span
				>
				<p class="text-sm font-bold text-foreground sm:text-base">
					{stats.unitsEarned}
					<span class="text-[10px] font-normal text-muted-foreground sm:text-xs"
						>/ {totalProgramUnits}</span
					>
				</p>
			</div>
			<div>
				<span class="block truncate text-[10px] font-medium text-muted-foreground sm:text-[11px]"
					>Units Remaining</span
				>
				<p class="text-sm font-bold text-primary sm:text-base">{stats.remainingUnits}</p>
			</div>
		</div>

		{#if stats.remainingUnits <= 0}
			<div class="rounded-xl border border-primary/20 bg-primary/5 p-5 text-center">
				<GraduationCap class="mx-auto size-8 text-primary" />
				<h3 class="mt-2 text-sm font-bold text-foreground">Program Completed</h3>
				<p class="mt-1 text-xs text-muted-foreground">
					You have completed all {totalProgramUnits} program units with a final CGPA of
					<strong class="text-foreground">{stats.cgpa.toFixed(3)}</strong>.
				</p>
			</div>
		{:else}
			<!-- Target Threshold Config Section -->
			<div class="space-y-3 rounded-xl border border-border/60 bg-background p-3 sm:p-3.5">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<Label class="text-xs font-bold text-foreground">Target CGPA Threshold</Label>

					<!-- Segmented Control Mode Switch -->
					{#if honorTiers.length > 0}
						<div class="inline-flex rounded-lg bg-muted p-0.5 text-xs">
							<button
								type="button"
								onclick={() => (targetMode = 'honor')}
								class="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all sm:px-2.5 sm:text-[11px]
                                {targetMode === 'honor'
									? 'bg-background text-foreground shadow-xs'
									: 'text-muted-foreground hover:text-foreground'}"
							>
								<Award class="size-3" />
								<span>Honor Tier</span>
							</button>
							<button
								type="button"
								onclick={() => (targetMode = 'custom')}
								class="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all sm:px-2.5 sm:text-[11px]
                                {targetMode === 'custom'
									? 'bg-background text-foreground shadow-xs'
									: 'text-muted-foreground hover:text-foreground'}"
							>
								<Target class="size-3" />
								<span>Custom Target</span>
							</button>
						</div>
					{/if}
				</div>

				<!-- Target Selection Input -->
				{#if targetMode === 'honor' && honorTiers.length > 0}
					<Select.Root
						type="single"
						value={selectedHonorId}
						onValueChange={(v) => v && (selectedHonorId = v)}
					>
						<Select.Trigger class="w-full bg-background text-xs font-medium">
							{activeTier
								? `${activeTier.label} (${settings?.gradeDirection === 'ascending' ? `≥ ${activeTier.lowerBound}` : `≤ ${activeTier.upperBound}`})`
								: 'Select Honor Tier'}
						</Select.Trigger>
						<Select.Content>
							{#each honorTiers as tier (tier.id)}
								<Select.Item value={tier.id} label={tier.label}>
									<div class="flex w-full items-center justify-between gap-4">
										<span>{tier.label}</span>
										<span class="font-mono text-[11px] text-muted-foreground">
											{settings?.gradeDirection === 'ascending'
												? `≥ ${tier.lowerBound}`
												: `≤ ${tier.upperBound}`}
										</span>
									</div>
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				{:else}
					<div class="flex items-center gap-2">
						<Input
							type="number"
							step="0.001"
							placeholder="e.g. 3.500"
							bind:value={customTargetInput}
							class="h-9 font-mono text-xs"
						/>
						{#if effectiveTargetCGPA !== null}
							<Badge variant="secondary" class="shrink-0 font-mono text-xs">
								Target: {settings?.gradeDirection === 'ascending' ? '≥' : '≤'}
								{effectiveTargetCGPA.toFixed(3)}
							</Badge>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Grade Stepper Input & Outcome Card -->
			{#if effectiveTargetCGPA === null}
				<div
					class="rounded-xl border border-border bg-muted/50 p-4 text-center text-xs text-muted-foreground"
				>
					Please enter a valid target CGPA to compute your unit runway.
				</div>
			{:else}
				<div class="space-y-3 pt-1">
					<div class="flex flex-col justify-between gap-0.5 sm:flex-row sm:items-center">
						<Label class="text-xs font-bold text-foreground">Select Course Grade</Label>
						<span class="text-[11px] text-muted-foreground">
							Assumes <strong class="text-foreground">{bestGrade.toFixed(1)}</strong> for remaining units
						</span>
					</div>

					<!-- Direct Grade Stepper Input -->
					<div
						class={cn(
							'flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-2 transition-colors',
							gradeIsFocused && 'border-primary ring-1 ring-primary'
						)}
					>
						<button
							type="button"
							tabindex="-1"
							onclick={() => updateGradeStep('down')}
							class="flex size-7 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 sm:size-8"
							aria-label="Decrease grade"
						>
							<Minus class="size-4" />
						</button>

						<input
							class="w-full bg-transparent p-0 text-center font-mono text-sm font-bold text-foreground focus:outline-none"
							type="number"
							step={settings?.gradeStep ?? 0.25}
							placeholder="—"
							value={gradeDisplay}
							onfocus={handleGradeFocus}
							oninput={handleGradeInput}
							onblur={handleGradeBlur}
							onkeydown={onGradeKeydown}
						/>

						<button
							type="button"
							tabindex="-1"
							onclick={() => updateGradeStep('up')}
							class="flex size-7 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 sm:size-8"
							aria-label="Increase grade"
						>
							<Plus class="size-4" />
						</button>
					</div>

					<!-- Selected Grade Outcome Card -->
					{#if selectedGradeStep !== null && selectedStepResult}
						<div class="space-y-3 rounded-xl border border-border bg-card p-3.5 sm:p-4">
							<div class="flex items-center justify-between border-b border-border/50 pb-2">
								<span class="text-xs font-semibold text-muted-foreground">Tested Grade:</span>
								<span class="font-mono text-base font-bold text-foreground">
									{selectedGradeStep.toFixed(2)}
								</span>
							</div>

							<!-- Status Detail Box -->
							{#if selectedStepResult.status === 'already'}
								<div
									class="rounded-lg border border-primary/20 bg-primary/10 p-3 text-xs text-primary"
								>
									<div class="flex items-center gap-2 font-bold">
										<CircleCheck class="size-4 shrink-0 text-primary" />
										<span>Fully Safe Target</span>
									</div>
									<p class="mt-1 text-[11px] opacity-90">
										Taking <strong>all remaining {stats.remainingUnits} units</strong> at grade
										<strong>{selectedGradeStep.toFixed(2)}</strong>
										still qualifies with a projected CGPA of
										<strong class="font-mono">{selectedStepResult.projectedCGPA.toFixed(3)}</strong
										>.
									</p>
								</div>
							{:else if selectedStepResult.status === 'ok'}
								<div class="grid grid-cols-1 gap-2 pt-1 text-xs sm:grid-cols-2 sm:gap-3">
									<div class="rounded-lg border border-border/60 bg-muted/30 p-2.5">
										<span class="text-[11px] font-medium text-muted-foreground"
											>Max Allowed at {selectedGradeStep.toFixed(2)}</span
										>
										<div class="mt-0.5 flex items-baseline gap-1">
											<span class="font-mono text-xl font-bold text-foreground"
												>{selectedStepResult.maxUnits}</span
											>
											<span class="text-xs text-muted-foreground">units</span>
										</div>
									</div>

									<div class="rounded-lg border border-border/60 bg-muted/30 p-2.5">
										<span class="text-[11px] font-medium text-muted-foreground"
											>Remaining Required at {bestGrade.toFixed(1)}</span
										>
										<div class="mt-0.5 flex items-baseline gap-1">
											<span class="font-mono text-xl font-bold text-primary"
												>{selectedStepResult.remainingAtBest}</span
											>
											<span class="text-xs text-muted-foreground">units</span>
										</div>
									</div>
								</div>

								<div class="flex items-center justify-between pt-1 text-xs">
									<span class="text-muted-foreground">Projected Final CGPA:</span>
									<span class="font-mono font-bold text-foreground">
										{selectedStepResult.projectedCGPA.toFixed(3)}
									</span>
								</div>
							{:else if selectedStepResult.status === 'impossible'}
								<div
									class="rounded-lg border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground"
								>
									<div class="flex items-center gap-2 font-semibold text-foreground">
										<CircleX class="size-4 shrink-0" />
										<span>Unreachable Threshold</span>
									</div>
									<p class="mt-1 text-[11px]">
										Even if you score perfect <strong>{bestGrade.toFixed(1)}</strong> for all
										remaining units, your target CGPA of
										<strong>{effectiveTargetCGPA.toFixed(3)}</strong> cannot be reached.
									</p>
								</div>
							{:else if selectedStepResult.status === 'disqualified'}
								<div
									class="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
								>
									<div class="flex items-center gap-2 font-bold">
										<Ban class="size-4 shrink-0" />
										<span>University Policy Disqualification</span>
									</div>
									<p class="mt-1 text-[11px] opacity-90">
										Your university enforces a No-Fail Policy for Latin Honors. Taking a grade of <strong
											>{selectedGradeStep.toFixed(2)}</strong
										> automatically revokes honors eligibility.
									</p>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		{/if}
	</Dialog.Content>
</Dialog.Root>
