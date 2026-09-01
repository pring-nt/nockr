<script lang="ts">
    import { tick, untrack } from 'svelte';
    import { flip } from 'svelte/animate';
    import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME, type DndEvent } from 'svelte-dnd-action';
    import { appStore } from '$lib/stores/appState';
    import type { Term, Course } from '$lib/schemas';
    import { computeTGPA } from '$lib/logic/gpa';
    import CourseCard from '$lib/components/plan/CourseCard.svelte';
    import { Button } from '$lib/components/ui/button/index.js';
    import * as Tooltip from '$lib/components/ui/tooltip/index.js';
    import { Plus, Trash2, Share2 } from 'lucide-svelte';
    import { cn } from '$lib/utils.js';

    let { term }: { term: Term } = $props();

    let localCourses = $state<Course[]>(untrack(() => [...term.courses]));
    let isEditingTerm = $state(false);
    let termNameEdit = $state(untrack(() => term.name));
    let isHovered = $state(false);
    let isDndActive = $state(false);

    $effect(() => {
        if (!isDndActive) {
            localCourses = [...term.courses];
        }
        termNameEdit = term.name;
    });

    let tgpa = $derived(computeTGPA(term));
    let totalUnits = $derived(term.courses.reduce((acc, c) => acc + c.units, 0));

    function isShadowItem(item: Course): boolean {
        return Boolean((item as Record<string, unknown>)[SHADOW_ITEM_MARKER_PROPERTY_NAME]);
    }

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

    function handleConsider(e: CustomEvent<DndEvent<Course>>) {
        isDndActive = true;
        if (e.detail.info.trigger === 'draggedEntered') isHovered = true;
        else if (e.detail.info.trigger === 'draggedLeft') isHovered = false;

        localCourses = e.detail.items;
    }

    function handleFinalize(e: CustomEvent<DndEvent<Course>>) {
        isHovered = false;
        isDndActive = false;
        localCourses = e.detail.items;
        appStore.update((state) => ({
            ...state,
            terms: state.terms.map((t) => (t.id === term.id ? { ...t, courses: e.detail.items } : t))
        }));
    }
</script>

<div
        class={cn(
    'flex h-full w-70 shrink-0 flex-col rounded-xl border p-3 shadow-xs backdrop-blur-md transition-all duration-200',
    isHovered
      ? 'border-primary/60 bg-primary/10 ring-2 ring-primary/40 shadow-lg shadow-primary/5'
      : 'border-border/50 bg-background/25'
  )}
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
            <div animate:flip={{ duration: 200 }}>
                {#if isShadowItem(course)}
                    <div
                            class="h-18.5 w-full rounded-lg border-2 border-dashed border-primary/40 bg-primary/10 backdrop-blur-xs transition-all duration-150"
                    ></div>
                {:else}
                    <CourseCard {course} termId={term.id} />
                {/if}
            </div>
        {/each}
    </div>

    <!-- Inline Add Course Button -->
    <Button
            variant="outline"
            size="sm"
            class="mt-3 w-full gap-1.5 border-dashed bg-background/20 text-xs text-muted-foreground backdrop-blur-xs hover:bg-background/40 hover:text-foreground"
            onclick={() => addCourse(true)}
    >
        <Plus size={14} /> Add Course
    </Button>
</div>