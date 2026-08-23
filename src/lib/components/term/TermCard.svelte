<script lang="ts">
    import type { Term } from '$lib/schemas';
    import { appStore } from '$lib/stores/appState';
    import { computeTGPA } from '$lib/logic/gpa';
    import { getDeansListTier } from '$lib/logic/honors';
    import { Plus, Trash2 } from 'lucide-svelte';
    import { Button } from '$lib/components/ui/button/index.js';
    import { Badge } from '$lib/components/ui/badge/index.js';
    import { Card, CardHeader, CardContent } from '$lib/components/ui/card/index.js';
    import CourseRow from './CourseRow.svelte';
    import { tick } from 'svelte';

    let { term, onDelete, onRename }: {
        term: Term;
        onDelete: () => void;
        onRename: (name: string) => void;
    } = $props();

    let tgpa = $derived(computeTGPA(term));
    let deansListTier = $derived(
        getDeansListTier(term, tgpa, $appStore.universitySettings)
    );

    let isEditing = $state(false);
    let editName = $state('');

    function startEditing() {
        editName = term.name;
        isEditing = true;
    }

    function commitRename() {
        if (editName.trim()) onRename(editName.trim());
        isEditing = false;
    }

    // --- Course CRUD ---
    function addCourse(focusNew = false) {
        const newId = crypto.randomUUID();
        appStore.update(state => ({
            ...state,
            terms: state.terms.map(t =>
                t.id === term.id
                    ? {
                        ...t,
                        courses: [
                            ...t.courses,
                            { id: newId, name: '', units: 3, grade: null }
                        ]
                    }
                    : t
            )
        }));
        if (focusNew) {
            tick().then(() => {
                document.getElementById(`course-${newId}-name`)?.focus();
            });
        }
    }

    function deleteCourse(courseId: string) {
        appStore.update(state => ({
            ...state,
            terms: state.terms.map(t =>
                t.id === term.id
                    ? { ...t, courses: t.courses.filter(c => c.id !== courseId) }
                    : t
            )
        }));
    }

    function updateCourse(
        courseId: string,
        field: 'name' | 'units' | 'grade',
        value: string | number | null
    ) {
        appStore.update(state => ({
            ...state,
            terms: state.terms.map(t =>
                t.id === term.id
                    ? {
                        ...t,
                        courses: t.courses.map(c =>
                            c.id === courseId ? { ...c, [field]: value } : c
                        )
                    }
                    : t
            )
        }));
    }

    // --- Keyboard Navigation (cross-row) ---
    function handleNavigate(courseId: string) {
        const idx = term.courses.findIndex(c => c.id === courseId);
        if (idx === -1) return;

        if (idx < term.courses.length - 1) {
            const nextId = term.courses[idx + 1].id;
            document.getElementById(`course-${nextId}-name`)?.focus();
        } else {
            addCourse(true);
        }
    }

    function focusOnMount(node: HTMLElement) {
        node.focus();
    }
</script>

<Card>
    <!-- Responsive padding: p-3 on mobile, p-6 on desktop -->
    <CardHeader class="p-3 sm:p-6 pb-3 sm:pb-3">
        <div class="flex items-center justify-between gap-2">
            <!-- Term name + Dean's List badge -->
            <div class="flex items-center gap-2 flex-1 min-w-0">
                {#if isEditing}
                    <input
                            class="bg-transparent border-b border-primary text-foreground font-semibold
                               text-base sm:text-lg focus:outline-none flex-1 min-w-0"
                            bind:value={editName}
                            onblur={commitRename}
                            onkeydown={e => e.key === 'Enter' && commitRename()}
                            use:focusOnMount
                    />
                {:else}
                    <button
                            class="text-base sm:text-lg font-semibold text-foreground hover:text-primary
                               transition-colors text-left truncate"
                            ondblclick={startEditing}
                            title="Double-click to rename"
                    >
                        {term.name}
                    </button>
                {/if}

                {#if $appStore.ui?.showDeansListBadge && deansListTier}
                    <Badge variant="secondary" class="shrink-0 text-[10px] sm:text-xs px-1.5 py-0.5">
                        {deansListTier.label}
                    </Badge>
                {/if}
            </div>

            <!-- TGPA + delete -->
            <div class="flex items-center gap-2 sm:gap-3 shrink-0">
                <div class="text-right">
                    <p class="text-[10px] sm:text-xs text-muted-foreground">TGPA</p>
                    <p class="text-base sm:text-lg font-bold text-primary gradient-text">
                        {tgpa !== null ? tgpa.toFixed(3) : '—'}
                    </p>
                </div>
                <Button
                        variant="ghost"
                        size="icon"
                        onclick={onDelete}
                        class="text-muted-foreground hover:text-destructive h-7 w-7 sm:h-8 sm:w-8"
                >
                    <Trash2 size={16} />
                </Button>
            </div>
        </div>
    </CardHeader>

    <CardContent class="p-3 sm:p-6 pt-0 sm:pt-0 space-y-2">
        <!-- Column headers matching mobile grid -->
        {#if term.courses.length > 0}
            <div class="grid grid-cols-[1fr_60px_72px_28px] sm:grid-cols-[1fr_80px_100px_36px] gap-1.5 sm:gap-2 px-0.5 sm:px-1 mb-1">
                <p class="text-[11px] sm:text-xs text-muted-foreground">Course</p>
                <p class="text-[11px] sm:text-xs text-muted-foreground text-center">Units</p>
                <p class="text-[11px] sm:text-xs text-muted-foreground text-center">Grade</p>
                <span></span>
            </div>
        {/if}

        <!-- Course rows -->
        {#each term.courses as course (course.id)}
            <CourseRow
                    {course}
                    onDelete={() => deleteCourse(course.id)}
                    onUpdate={(field, value) => updateCourse(course.id, field, value)}
                    onNavigate={() => handleNavigate(course.id)}
            />
        {/each}

        <!-- Add course button -->
        <Button
                onclick={() => addCourse(true)}
                variant="ghost"
                size="sm"
                class="w-full gap-2 text-muted-foreground hover:text-foreground mt-1 text-xs sm:text-sm h-8 sm:h-9"
        >
            <Plus size={14} />
            Add Course
        </Button>
    </CardContent>
</Card>