<script lang="ts">
    import { appStore } from '$lib/stores/appState';
    import { computeCGPA, computeUnitsEarned } from '$lib/logic/gpa';
    import { PenLine, Check } from 'lucide-svelte';
    import { Button } from '$lib/components/ui/button/index.js';
    import { Card, CardContent } from '$lib/components/ui/card/index.js';
    import { Input } from '$lib/components/ui/input/index.js';

    let cgpa = $derived(computeCGPA($appStore.terms));
    let unitsEarned = $derived(computeUnitsEarned($appStore.terms));
    let totalProgramUnits = $derived($appStore.totalProgramUnits ?? 165);
    let remainingUnits = $derived(Math.max(0, totalProgramUnits - unitsEarned));
    let progressPercent = $derived(
        totalProgramUnits > 0
            ? Math.min(100, Math.round((unitsEarned / totalProgramUnits) * 100))
            : 0
    );

    let isEditingTotal = $state(false);
    let tempTotalUnits = $state(165);

    function startEditing() {
        tempTotalUnits = totalProgramUnits;
        isEditingTotal = true;
    }

    function saveTotalUnits() {
        if (tempTotalUnits > 0) {
            appStore.update(state => ({ ...state, totalProgramUnits: tempTotalUnits }));
        }
        isEditingTotal = false;
    }
</script>

<Card class="glass border-border/40">
    <CardContent class="p-5 sm:p-6 space-y-5">
        <!-- Stats row -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 items-baseline">
            <div class="space-y-1">
                <span class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Cumulative GPA
                </span>
                <div class="text-4xl sm:text-5xl font-bold text-primary tracking-tight font-mono">
                    {cgpa !== null ? cgpa.toFixed(3) : '—'}
                </div>
            </div>

            <div class="space-y-1 sm:border-l sm:border-border/30 sm:pl-4">
                <span class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Earned Units
                </span>
                <div class="text-2xl sm:text-3xl font-semibold text-foreground font-mono">
                    {unitsEarned}
                </div>
            </div>

            <div class="space-y-1 sm:border-l sm:border-border/30 sm:pl-4">
                <span class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Units Remaining
                </span>
                <div class="text-2xl sm:text-3xl font-semibold text-foreground font-mono">
                    {remainingUnits}
                </div>
            </div>
        </div>

        <!-- Progress bar row -->
        <div class="pt-2 border-t border-border/30 space-y-2">
            <div class="flex items-center justify-between text-xs">
                <div class="flex items-center gap-1.5 text-muted-foreground">
                    <span>Degree Progress</span>
                    <span class="font-mono text-foreground font-medium">({progressPercent}%)</span>
                </div>

                {#if isEditingTotal}
                    <div class="flex items-center gap-1.5">
                        <span class="text-muted-foreground">Target:</span>
                        <Input
                                type="number"
                                bind:value={tempTotalUnits}
                                class="h-7 w-16 text-xs font-mono text-center px-1 py-0 bg-background/50 border-primary/50 focus-visible:ring-1"
                                min="1"
                                onkeydown={e => e.key === 'Enter' && saveTotalUnits()}
                                onblur={saveTotalUnits}
                        />
                        <Button
                                size="icon"
                                variant="ghost"
                                class="h-7 w-7 text-primary hover:bg-primary/10"
                                onclick={saveTotalUnits}
                        >
                            <Check size={14} />
                        </Button>
                    </div>
                {:else}
                    <div class="flex items-center gap-1.5">
                        <span class="text-muted-foreground">
                            Target:
                            <span class="font-mono text-foreground font-medium border-b border-dashed border-muted-foreground/50 px-0.5 pb-0.5">
                                {totalProgramUnits}
                            </span>
                            units
                        </span>
                        <Button
                                variant="ghost"
                                size="icon"
                                onclick={startEditing}
                                class="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-md"
                        >
                            <PenLine size={13} />
                        </Button>
                    </div>
                {/if}
            </div>

            <div class="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                <div
                        class="h-full bg-primary transition-all duration-500 ease-out"
                        style="width: {progressPercent}%;"
                ></div>
            </div>
        </div>
    </CardContent>
</Card>