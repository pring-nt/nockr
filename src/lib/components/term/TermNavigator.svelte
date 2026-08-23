<script lang="ts">
    import { appStore } from '$lib/stores/appState';
    import { Plus, GraduationCap, ChevronLeft, ChevronRight, LayoutGrid, Eye } from 'lucide-svelte';
    import { Button } from '$lib/components/ui/button/index.js';
    import TermCard from '$lib/components/term/TermCard.svelte';
    import { tick } from 'svelte';
    import { fly } from 'svelte/transition';

    // View State
    let activeTermId = $state<string | null>($appStore.terms[0]?.id ?? null);
    let viewMode = $state<'focus' | 'grid'>('focus');

    // Scroll active pill into view when it changes
    $effect(() => {
        if (!activeTermId) return;
        tick().then(() => {
            document.getElementById(`term-pill-${activeTermId}`)?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center',
            });
        });
    });

    let activeTermIndex = $derived($appStore.terms.findIndex(t => t.id === activeTermId));
    let activeTerm = $derived($appStore.terms.find(t => t.id === activeTermId));

    // Term CRUD
    function addTerm() {
        const newId = crypto.randomUUID();
        appStore.update(state => ({
            ...state,
            terms: [
                ...state.terms,
                { id: newId, name: `Term ${state.terms.length + 1}`, courses: [] },
            ],
        }));
        activeTermId = newId;
    }

    function deleteTerm(id: string) {
        const terms = $appStore.terms;
        const idx = terms.findIndex(t => t.id === id);

        // Proactively move focus BEFORE the array changes
        if (activeTermId === id) {
            if (idx > 0) {
                // Go to the previous term
                activeTermId = terms[idx - 1].id;
            } else if (idx < terms.length - 1) {
                // Was first term, go to the one that will become first
                activeTermId = terms[idx + 1].id;
            } else {
                // Last term standing, will be empty
                activeTermId = null;
            }
        }

        appStore.update(state => ({
            ...state,
            terms: state.terms.filter(t => t.id !== id),
        }));
    }

    function renameTerm(id: string, name: string) {
        appStore.update(state => ({
            ...state,
            terms: state.terms.map(t => (t.id === id ? { ...t, name } : t)),
        }));
    }

    // Navigation
    function prevTerm() {
        if (activeTermIndex > 0) activeTermId = $appStore.terms[activeTermIndex - 1].id;
    }

    function nextTerm() {
        if (activeTermIndex < $appStore.terms.length - 1)
            activeTermId = $appStore.terms[activeTermIndex + 1].id;
    }

    // Switch to grid and scroll to the currently active term's card
    function switchToGrid() {
        viewMode = 'grid';
        tick().then(() => {
            if (activeTermId) {
                document.getElementById(`term-card-${activeTermId}`)?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
            }
        });
    }

    function handleWheelScroll(e: WheelEvent) {
        if (e.deltaY === 0) return;

        const container = e.currentTarget as HTMLElement;
        const scrollAmount = e.deltaY;

        container.scrollLeft += scrollAmount;

        e.preventDefault();
    }
</script>

{#if $appStore.terms.length === 0}
    <!-- Empty State -->
    <div class="glass border-border/30 rounded-xl py-12 px-4 text-center space-y-3 mt-8">
        <div class="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
            <GraduationCap size={20} />
        </div>
        <div>
            <p class="font-medium text-foreground">No terms added yet</p>
            <p class="text-xs text-muted-foreground mt-0.5">
                Add your first academic term to start tracking grades
            </p>
        </div>
        <Button onclick={addTerm} variant="default" size="sm" class="gap-2 mt-4">
            <Plus size={16} /> Add Term
        </Button>
    </div>
{:else}
    <!-- Pill Nav + View Toggle -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div
                onwheel={handleWheelScroll}
                class="flex items-center gap-2 overflow-x-auto pb-2 flex-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent"
        >
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
            <Button
                    variant={viewMode === 'focus' ? 'secondary' : 'ghost'}
                    size="sm"
                    class="h-7 px-2.5"
                    onclick={() => viewMode = 'focus'}
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

    <!-- Focus View — {#key} forces remount on term change, triggering the fly transition -->
    {#if viewMode === 'focus' && activeTerm}
        <div class="space-y-4">
            <div class="flex items-center justify-between text-xs text-muted-foreground px-1">
                <Button
                        variant="ghost" size="sm"
                        onclick={prevTerm}
                        disabled={activeTermIndex <= 0}
                        class="gap-1 h-7 px-2"
                >
                    <ChevronLeft size={14} /> Prev
                </Button>
                <span class="font-medium">
                    Term {activeTermIndex + 1} of {$appStore.terms.length}
                </span>
                <Button
                        variant="ghost" size="sm"
                        onclick={nextTerm}
                        disabled={activeTermIndex >= $appStore.terms.length - 1}
                        class="gap-1 h-7 px-2"
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
                            onRename={name => renameTerm(term.id, name)}
                    />
                </div>
            {/key}
        </div>

        <!-- Grid View — each card gets an id so switchToGrid() can scroll to the active one -->
    {:else if viewMode === 'grid'}
        <div class="space-y-6 animate-in fade-in duration-300">
            {#each $appStore.terms as term (term.id)}
                <div id="term-card-{term.id}">
                    <TermCard
                            {term}
                            onDelete={() => deleteTerm(term.id)}
                            onRename={name => renameTerm(term.id, name)}
                    />
                </div>
            {/each}
        </div>
    {/if}

    <!-- Add Term -->
    <Button
            onclick={addTerm}
            variant="ghost"
            class="w-full gap-2 glass border border-border/30 hover:bg-muted/30 text-foreground py-5 mt-4"
    >
        <Plus size={16} />
        Add Another Term
    </Button>
{/if}