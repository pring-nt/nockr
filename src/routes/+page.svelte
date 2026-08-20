<script lang="ts">
    import { appStore } from '$lib/stores/appState';
    import { computeCGPA, computeUnitsEarned } from '$lib/logic/gpa';
    import { Plus, Target, GraduationCap, PenLine, Check, ChevronLeft, ChevronRight, LayoutGrid, Eye } from 'lucide-svelte';
    import { Button } from '$lib/components/ui/button/index.js';
    import { Card, CardContent } from '$lib/components/ui/card/index.js';
    import { Input } from '$lib/components/ui/input/index.js';
    import TermCard from '$lib/components/term/TermCard.svelte';
    import { tick } from 'svelte';

    // --- Academic Summary State ---
    let cgpa = $derived(computeCGPA($appStore.terms));
    let unitsEarned = $derived(computeUnitsEarned($appStore.terms));
    let totalProgramUnits = $derived($appStore.totalProgramUnits ?? 165);
    let remainingUnits = $derived(Math.max(0, totalProgramUnits - unitsEarned));
    let progressPercent = $derived(
        totalProgramUnits > 0 ? Math.min(100, Math.round((unitsEarned / totalProgramUnits) * 100)) : 0
    );

    let isEditingTotal = $state(false);
    let tempTotalUnits = $derived(totalProgramUnits);

    $effect(() => {
        if (activeTermId) {
            tick().then(() => {
                const activePill = document.getElementById(`term-pill-${activeTermId}`);
                if (activePill) {
                    activePill.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                        inline: 'center'
                    });
                }
            });
        }
    });

    function saveTotalUnits() {
        if (tempTotalUnits > 0) {
            appStore.update(state => ({ ...state, totalProgramUnits: tempTotalUnits }));
        }
        isEditingTotal = false;
    }

    // --- Term Navigation State ---
    let activeTermId = $state<string | null>($appStore.terms[0]?.id ?? null);
    let viewMode = $state<'focus' | 'grid'>('focus');

    // Auto-select first term if active one is deleted
    $effect(() => {
        if ($appStore.terms.length > 0 && !$appStore.terms.some(t => t.id === activeTermId)) {
            activeTermId = $appStore.terms[0].id;
        }
    });

    let activeTermIndex = $derived($appStore.terms.findIndex(t => t.id === activeTermId));
    let activeTerm = $derived($appStore.terms.find(t => t.id === activeTermId));

    function addTerm() {
        const newId = crypto.randomUUID();
        appStore.update(state => ({
            ...state,
            terms: [
                ...state.terms,
                {
                    id: newId,
                    name: `Term ${state.terms.length + 1}`,
                    courses: [],
                }
            ]
        }));
        activeTermId = newId; // Jump to the new term automatically
        viewMode = 'focus';
    }

    function deleteTerm(id: string) {
        appStore.update(state => ({
            ...state,
            terms: state.terms.filter(t => t.id !== id)
        }));
    }

    function renameTerm(id: string, name: string) {
        appStore.update(state => ({
            ...state,
            terms: state.terms.map(t => t.id === id ? { ...t, name } : t)
        }));
    }

    function prevTerm() {
        if (activeTermIndex > 0) activeTermId = $appStore.terms[activeTermIndex - 1].id;
    }

    function nextTerm() {
        if (activeTermIndex < $appStore.terms.length - 1) activeTermId = $appStore.terms[activeTermIndex + 1].id;
    }

    function handleWheelScroll(e: WheelEvent) {
        if (e.deltaY === 0) return;

        const container = e.currentTarget as HTMLElement;
        const scrollAmount = e.deltaY;

        container.scrollLeft += scrollAmount;

        e.preventDefault();
    }
</script>

<div class="min-h-screen pb-12">
    <!-- Header -->
    <header class="border-b border-border/40 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 bg-background/50 backdrop-blur-md z-10">
        <div class="flex items-center gap-2.5">
            <div class="p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <Target size={18} />
            </div>
            <span class="font-semibold text-lg tracking-tight gradient-text">Nockr</span>
        </div>
        <div class="flex items-center gap-2">
            <!-- Settings sheet button will go here -->
        </div>
    </header>

    <main class="max-w-3xl mx-auto px-4 py-6 space-y-6">

        <!-- ACADEMIC SUMMARY CARD -->
        <Card class="glass border-border/40">
            <CardContent class="p-5 sm:p-6 space-y-5">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 items-baseline">
                    <div class="space-y-1">
                        <span class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cumulative GPA</span>
                        <div class="text-4xl sm:text-5xl font-bold text-primary tracking-tight font-mono">
                            {cgpa !== null ? cgpa.toFixed(3) : '—'}
                        </div>
                    </div>
                    <div class="space-y-1 sm:border-l sm:border-border/30 sm:pl-4">
                        <span class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Earned Units</span>
                        <div class="text-2xl sm:text-3xl font-semibold text-foreground font-mono">{unitsEarned}</div>
                    </div>
                    <div class="space-y-1 sm:border-l sm:border-border/30 sm:pl-4">
                        <span class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Units Remaining</span>
                        <div class="text-2xl sm:text-3xl font-semibold text-foreground font-mono">{remainingUnits}</div>
                    </div>
                </div>

                <div class="pt-2 border-t border-border/30 space-y-2">
                    <div class="flex items-center justify-between text-xs">
                        <div class="flex items-center gap-1.5 text-muted-foreground">
                            <span>Degree Progress</span>
                            <span class="font-mono text-foreground font-medium">({progressPercent}%)</span>
                        </div>
                        {#if isEditingTotal}
                            <div class="flex items-center gap-1.5">
                                <span class="text-muted-foreground">Target:</span>
                                <Input type="number" bind:value={tempTotalUnits} class="h-7 w-16 text-xs font-mono text-center px-1 py-0 bg-background/50 border-primary/50 focus-visible:ring-1" min="1" autofocus />
                                <Button size="icon" variant="ghost" class="h-7 w-7 text-primary hover:bg-primary/10" onclick={saveTotalUnits}><Check size={14} /></Button>
                            </div>
                        {:else}
                            <div class="flex items-center gap-1.5">
                                <span class="text-muted-foreground">Target: <span class="font-mono text-foreground font-medium border-b border-dashed border-muted-foreground/50 px-0.5 pb-0.5">{totalProgramUnits}</span> units</span>
                                <Button variant="ghost" size="icon" onclick={() => isEditingTotal = true} class="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-md"><PenLine size={13} /></Button>
                            </div>
                        {/if}
                    </div>
                    <div class="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                        <div class="h-full bg-primary transition-all duration-500 ease-out" style="width: {progressPercent}%;"></div>
                    </div>
                </div>
            </CardContent>
        </Card>

        <!-- TERM NAVIGATION & LIST -->
        {#if $appStore.terms.length === 0}
            <!-- Empty State -->
            <div class="glass border-border/30 rounded-xl py-12 px-4 text-center space-y-3 mt-8">
                <div class="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
                    <GraduationCap size={20} />
                </div>
                <div>
                    <p class="font-medium text-foreground">No terms added yet</p>
                    <p class="text-xs text-muted-foreground mt-0.5">Add your first academic term to start tracking grades</p>
                </div>
                <Button onclick={addTerm} variant="default" size="sm" class="gap-2 mt-4"><Plus size={16} /> Add Term</Button>
            </div>
        {:else}
            <!-- Pill Navigation Header -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div
                        onwheel={handleWheelScroll}
                        class="flex items-center gap-2 overflow-x-auto pb-2 flex-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent"
                >
                    <!-- Inside your pill container -->
                    {#each $appStore.terms as term (term.id)}
                        <button
                                id="term-pill-{term.id}"
                                onclick={() => { activeTermId = String(term.id); viewMode = 'focus'; }}
                                class="px-4 py-1.5 rounded-full text-sm font-medium transition-all shrink-0
                                {activeTermId === term.id && viewMode === 'focus'
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'bg-muted/50 text-muted-foreground hover:bg-muted'}"
                        >
                            {term.name}
                        </button>
                    {/each}
                </div>

                <div class="flex items-center gap-1 bg-muted/30 rounded-lg p-1 shrink-0 self-start sm:self-auto border border-border/40">
                    <Button variant={viewMode === 'focus' ? 'secondary' : 'ghost'} size="sm" class="h-7 px-2.5" onclick={() => viewMode = 'focus'}>
                        <Eye size={14} class="mr-1.5" /> <span class="text-xs">Focus</span>
                    </Button>
                    <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" class="h-7 px-2.5" onclick={() => viewMode = 'grid'}>
                        <LayoutGrid size={14} class="mr-1.5" /> <span class="text-xs">All</span>
                    </Button>
                </div>
            </div>

            <!-- View Modes -->
            {#if viewMode === 'focus' && activeTerm}
                <div class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div class="flex items-center justify-between text-xs text-muted-foreground px-1">
                        <Button variant="ghost" size="sm" onclick={prevTerm} disabled={activeTermIndex <= 0} class="gap-1 h-7 px-2"><ChevronLeft size={14} /> Prev</Button>
                        <span class="font-medium">Term {activeTermIndex + 1} of {$appStore.terms.length}</span>
                        <Button variant="ghost" size="sm" onclick={nextTerm} disabled={activeTermIndex >= $appStore.terms.length - 1} class="gap-1 h-7 px-2">Next <ChevronRight size={14} /></Button>
                    </div>

                    <TermCard
                            term={activeTerm}
                            onDelete={() => deleteTerm(activeTerm.id)}
                            onRename={(name) => renameTerm(activeTerm.id, name)}
                    />
                </div>
            {:else}
                <div class="space-y-6 animate-in fade-in duration-300">
                    {#each $appStore.terms as term (term.id)}
                        <TermCard
                                {term}
                                onDelete={() => deleteTerm(term.id)}
                                onRename={(name) => renameTerm(term.id, name)}
                        />
                    {/each}
                </div>
            {/if}

            <!-- Global Add Term Button -->
            <Button onclick={addTerm} variant="ghost" class="w-full gap-2 glass border border-border/30 hover:bg-muted/30 text-foreground py-5 mt-4">
                <Plus size={16} />
                Add Another Term
            </Button>
        {/if}
    </main>
</div>