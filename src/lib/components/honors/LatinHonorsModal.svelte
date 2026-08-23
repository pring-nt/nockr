<!-- src/lib/components/honors/LatinHonorsModal.svelte -->
<script lang="ts">
    import * as Dialog from '$lib/components/ui/dialog/index.js';
    import { Award, Sparkles, TriangleAlert, CircleCheck } from 'lucide-svelte';
    import { appStore } from '$lib/stores/appState';
    import { computeCGPA, computeUnitsEarned } from '$lib/logic/gpa';
    import { matchTier, isNoFailDisqualified } from '$lib/logic/honors';

    let { open = $bindable(false) }: { open: boolean } = $props();

    let terms = $derived($appStore.terms);
    let settings = $derived($appStore.universitySettings);
    let totalProgramUnits = $derived($appStore.totalProgramUnits);

    let cgpa = $derived(computeCGPA(terms));
    let unitsEarned = $derived(computeUnitsEarned(terms));
    let remainingUnits = $derived(Math.max(0, totalProgramUnits - unitsEarned));

    let bestGrade = $derived(
        settings.gradeDirection === 'ascending' ? settings.gradeMax : settings.gradeMin
    );

    let projectedCGPA = $derived.by(() => {
        if (totalProgramUnits <= 0) return null;
        const currentPoints = (cgpa ?? 0) * unitsEarned;
        const maxFuturePoints = remainingUnits * bestGrade;
        return (currentPoints + maxFuturePoints) / totalProgramUnits;
    });

    let currentTier = $derived(cgpa !== null ? matchTier(cgpa, settings.latinHonorsTiers) : null);
    let projectedTier = $derived(
        projectedCGPA !== null ? matchTier(projectedCGPA, settings.latinHonorsTiers) : null
    );
    let disqualified = $derived(isNoFailDisqualified(terms, settings));
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="sm:max-w-md">
        <Dialog.Header>
            <div class="flex items-center gap-2">
                <div class="rounded-lg bg-primary/10 p-2 text-primary">
                    <Award size={20} />
                </div>
                <div>
                    <Dialog.Title>{settings.latinHonorsLabel} Standing</Dialog.Title>
                    <Dialog.Description class="text-xs">
                        Based on {unitsEarned} earned units of {totalProgramUnits} total program units.
                    </Dialog.Description>
                </div>
            </div>
        </Dialog.Header>

        <div class="space-y-4 py-3">
            <!-- Current Standing Card -->
            <div class="relative overflow-hidden rounded-xl border border-border/60 bg-muted/30 p-4">
                <div class="text-xs font-medium text-muted-foreground">Current Standing</div>
                <div class="mt-1 flex items-baseline justify-between">
                    <span class="text-xl font-semibold gradient-text">
                        {currentTier ? currentTier.label : 'Not Qualified Yet'}
                    </span>
                    <span class="font-mono text-sm text-muted-foreground">
                        CGPA: <strong class="text-foreground">{cgpa !== null ? cgpa.toFixed(3) : 'N/A'}</strong>
                    </span>
                </div>

                {#if currentTier}
                    <div class="mt-2 flex items-center gap-1.5 text-xs text-accent">
                        <CircleCheck size={14} />
                        <span>Meets requirements for {currentTier.label}</span>
                    </div>
                {/if}
            </div>

            <!-- Projected Standing Card -->
            <div class="relative overflow-hidden rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div class="flex items-center gap-1.5 text-xs font-medium text-primary">
                    <Sparkles size={14} />
                    <span>Maximum Projected Standing</span>
                </div>
                <div class="mt-1 flex items-baseline justify-between">
                    <span class="text-lg font-semibold gradient-text">
                        {projectedTier ? projectedTier.label : 'None Projected'}
                    </span>
                    <span class="font-mono text-sm text-muted-foreground">
                        Max CGPA: <strong class="text-foreground">{projectedCGPA !== null ? projectedCGPA.toFixed(3) : 'N/A'}</strong>
                    </span>
                </div>
                <p class="mt-2 text-[11px] leading-tight text-muted-foreground">
                    Assumes all {remainingUnits} remaining units receive the top grade of <span class="font-mono text-foreground">{bestGrade.toFixed(1)}</span>.
                </p>
            </div>

            <!-- Disqualification Alert -->
            {#if disqualified}
                <div class="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                    <TriangleAlert size={16} class="mt-0.5 shrink-0" />
                    <div class="space-y-0.5">
                        <span class="font-semibold">No-Fail Policy Warning</span>
                        <p class="text-[11px] leading-tight opacity-90">
                            One or more graded courses match your university's failing grade ({settings.failingGrade}). This may disqualify you from {settings.latinHonorsLabel}. Check with your registrar.
                        </p>
                    </div>
                </div>
            {/if}
        </div>
    </Dialog.Content>
</Dialog.Root>