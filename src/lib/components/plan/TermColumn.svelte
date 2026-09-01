<script lang="ts">
    import { tick, untrack } from 'svelte';
    import { dndzone } from 'svelte-dnd-action';
    import { appStore } from '$lib/stores/appState';
    import type { Term, Course } from '$lib/schemas';
    import { computeTGPA } from '$lib/logic/gpa';
    import CourseCard from '$lib/components/plan/CourseCard.svelte';
    import { Button } from '$lib/components/ui/button/index.js';
    import * as Tooltip from '$lib/components/ui/tooltip/index.js';
    import { Plus, Trash2, Share2 } from 'lucide-svelte';

    let { term }: { term: Term } = $props();

    // Local DnD state using untrack to capture initial value safely in Svelte 5
    let localCourses = $state<Course[]>(untrack(() => [...term.courses]));
    let isEditingTerm = $state(false);
    let termNameEdit = $state(untrack(() => term.name));

    // Keep local states in sync when store updates
    $effect(() => {
        localCourses = [...term.courses];
        termNameEdit = term.name;
    });

    // Derived values using standard GPA utility
    let tgpa = $derived(computeTGPA(term));
    let totalUnits = $derived(term.courses.reduce((acc, c) => acc + c.units, 0));

    // --- Term Renaming ---
    function startEditing() {
        termNameEdit = term.name;
        isEditingTerm = true;
    }

    function commitRename() {
        if (termNameEdit.trim()) {
            appStore.update((state) => ({
                ...state,
                terms: state.terms.map((t) =>
                    t.id === term.id ? { ...t, name: termNameEdit.trim() } : t
                )
            }));
        }
        isEditingTerm = false;
    }

    function focusOnMount(node: HTMLElement) {
        node.focus();
    }

    // --- Term CRUD ---
    function deleteTerm() {
        appStore.update((state) => ({
            ...state,
            terms: state.terms.filter((t) => t.id !== term.id)
        }));
    }

    function addCourse(focusNew = true) {
        const newId = crypto.randomUUID();
        appStore.update((state) => ({
            ...state,
            terms: state.terms.map((t) =>
                t.id === term.id
                    ? {
                        ...t,
                        courses: [...t.courses, { id: newId, name: '', units: 3, grade: null }]
                    }
                    : t
            )
        }));

        if (focusNew) {
            tick().then(() => {
                document.getElementById(`plan-course-${newId}-name`)?.focus();
            });
        }
    }

    // --- DnD Handlers ---
    function handleConsider(e: CustomEvent<{ items: Course[] }>) {
        localCourses = e.detail.items;
    }

    function handleFinalize(e: CustomEvent<{ items: Course[] }>) {
        localCourses = e.detail.items;
        appStore.update((state) => ({
            ...state,
            terms: state.terms.map((t) => (t.id === term.id ? { ...t, courses: e.detail.items } : t))
        }));
    }
</script>

<div
        class="flex h-full w-70 shrink-0 flex-col rounded-xl border border-border/60 bg-muted/20 p-3 shadow-xs"
>
    <!-- Column Header -->
    <div class="mb-3 flex items-center justify-between border-b border-border/40 pb-2">
        <div class="flex min-w-0 flex-1 flex-col pr-1">
            {#if isEditingTerm}
                <input
                        class="min-w-0 border-b border-primary bg-transparent text-sm font-semibold text-foreground focus:outline-none"
                        bind:value={termNameEdit}
                        onblur={commitRename}
                        onkeydown={(e) => e.key === 'Enter' && commitRename()}
                        use:focusOnMount
                />
            {:else}
                <Tooltip.Root>
                    <Tooltip.Trigger>
                        {#snippet child({ props })}
                            <button
                                    {...props}
                                    class="cursor-pointer truncate text-left text-sm font-semibold text-foreground transition-colors hover:text-primary"
                                    ondblclick={startEditing}
                            >
                                {term.name}
                            </button>
                        {/snippet}
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                        <p>Double-click to rename</p>
                    </Tooltip.Content>
                </Tooltip.Root>
            {/if}

            <span class="text-[11px] text-muted-foreground">
            {#if tgpa !== null}
               TGPA: <strong class="text-foreground">{tgpa.toFixed(3)}</strong> ({totalUnits} u)
            {:else}
               Planned ({totalUnits} u)
            {/if}
         </span>
        </div>

        <div class="flex shrink-0 items-center gap-1">
            <Tooltip.Root>
                <Tooltip.Trigger>
                    {#snippet child({ props })}
                        <Button
                                {...props}
                                href="/export?termId={term.id}"
                                variant="ghost"
                                size="icon"
                                class="h-7 w-7 text-muted-foreground hover:text-foreground"
                        >
                            <Share2 size={13} />
                        </Button>
                    {/snippet}
                </Tooltip.Trigger>
                <Tooltip.Content>
                    <p>Export term card</p>
                </Tooltip.Content>
            </Tooltip.Root>

            <Tooltip.Root>
                <Tooltip.Trigger>
                    {#snippet child({ props })}
                        <Button
                                {...props}
                                variant="ghost"
                                size="icon"
                                onclick={deleteTerm}
                                class="h-7 w-7 text-muted-foreground hover:text-destructive"
                        >
                            <Trash2 size={13} />
                        </Button>
                    {/snippet}
                </Tooltip.Trigger>
                <Tooltip.Content>
                    <p>Delete term</p>
                </Tooltip.Content>
            </Tooltip.Root>
        </div>
    </div>

    <!-- Draggable Drop Zone -->
    <div
            use:dndzone={{ items: localCourses, flipDurationMs: 200, dropTargetStyle: {} }}
            onconsider={handleConsider}
            onfinalize={handleFinalize}
            class="min-h-30 flex-1 space-y-2 overflow-y-auto p-0.5"
    >
        {#each localCourses as course (course.id)}
            <CourseCard {course} termId={term.id} />
        {/each}
    </div>

    <!-- Inline Add Course Button -->
    <Button
            variant="outline"
            size="sm"
            class="mt-3 w-full gap-1.5 border-dashed text-xs text-muted-foreground hover:text-foreground"
            onclick={() => addCourse(true)}
    >
        <Plus size={14} /> Add Course
    </Button>
</div>