<script lang="ts">
    import type { Course } from '$lib/schemas';
    import { appStore } from '$lib/stores/appState';
    import { Trash2, Minus, Plus, GripVertical } from 'lucide-svelte';
    import { Button } from '$lib/components/ui/button/index.js';
    import * as Tooltip from '$lib/components/ui/tooltip/index.js';
    import { cn } from '$lib/utils.js';

    let {
        course,
        termId
    }: {
        course: Course;
        termId: string;
    } = $props();

    let gradeMin = $derived($appStore.universitySettings.gradeMin);
    let gradeMax = $derived($appStore.universitySettings.gradeMax);
    let failingGrade = $derived($appStore.universitySettings.failingGrade);
    let gradeStep = $derived($appStore.universitySettings.gradeStep ?? 0.25);

    let isFailingGrade = $derived(
        course.grade !== null && failingGrade !== null && course.grade === failingGrade
    );

    function updateField(field: 'name' | 'units' | 'grade', value: string | number | null) {
        appStore.update((state) => ({
            ...state,
            terms: state.terms.map((t) => {
                if (t.id !== termId) return t;
                return {
                    ...t,
                    courses: t.courses.map((c) => (c.id === course.id ? { ...c, [field]: value } : c))
                };
            })
        }));
    }

    function deleteCourse() {
        appStore.update((state) => ({
            ...state,
            terms: state.terms.map((t) => {
                if (t.id !== termId) return t;
                return {
                    ...t,
                    courses: t.courses.filter((c) => c.id !== course.id)
                };
            })
        }));
    }

    function handleNameInput(e: Event) {
        const target = e.target as HTMLInputElement;
        updateField('name', target.value);
    }

    function handleUnitsInput(e: Event) {
        const target = e.target as HTMLInputElement;
        const val = Math.trunc(parseFloat(target.value));
        if (!isNaN(val)) {
            updateField('units', Math.max(1, Math.min(12, val)));
        }
    }

    function handleUnitsBlur(e: Event) {
        const target = e.target as HTMLInputElement;
        const val = Math.trunc(parseFloat(target.value));
        const clamped = isNaN(val) ? course.units || 1 : Math.max(1, Math.min(12, val));
        updateField('units', clamped);
        target.value = String(clamped);
    }

    function updateUnits(delta: number) {
        const next = Math.max(1, Math.min(12, (course.units || 0) + delta));
        updateField('units', next);
    }

    let gradeIsFocused = $state(false);
    let gradeLiveValue = $state('');

    let gradeDisplay = $derived(
        gradeIsFocused ? gradeLiveValue : course.grade !== null ? course.grade.toFixed(2) : ''
    );

    function handleGradeFocus() {
        gradeLiveValue = course.grade !== null ? course.grade.toFixed(2) : '';
        gradeIsFocused = true;
    }

    function handleGradeBlur() {
        gradeIsFocused = false;
        if (course.grade !== null) {
            updateField('grade', Number(course.grade.toFixed(2)));
        }
    }

    function handleGradeInput(e: Event) {
        const target = e.target as HTMLInputElement;
        gradeLiveValue = target.value;
        if (target.value === '') {
            updateField('grade', null);
            return;
        }
        const num = parseFloat(target.value);
        if (!isNaN(num)) updateField('grade', num);
    }

    function updateGrade(delta: number) {
        const step = gradeStep;
        let next: number;
        if (course.grade === null) {
            next = delta > 0 ? Math.min(gradeMax, gradeMin + step) : gradeMin;
        } else {
            const inverseStep = 1 / step;
            next = Math.round((course.grade + delta * step) * inverseStep) / inverseStep;
            next = Math.max(gradeMin, Math.min(gradeMax, next));
        }
        const formatted = Number(next.toFixed(2));
        updateField('grade', formatted);
        gradeLiveValue = formatted.toFixed(2);
    }

    function onNameKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById(`plan-course-${course.id}-units`)?.focus();
        }
    }

    function onUnitsKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById(`plan-course-${course.id}-grade`)?.focus();
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            updateUnits(1);
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            updateUnits(-1);
        }
    }

    function onGradeKeydown(e: KeyboardEvent) {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            updateGrade(1);
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            updateGrade(-1);
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            updateField('grade', null);
        }
    }
</script>

<div
        class={cn(
    'group relative flex flex-col gap-2 rounded-lg border p-2.5 shadow-2xs transition-all duration-200 backdrop-blur-xs',
    course.grade === null
      ? 'border-border/80 bg-card/90 text-card-foreground shadow-xs hover:border-primary/50'
      : 'border-border/40 bg-muted/30 text-muted-foreground hover:border-border/70'
  )}
>
    <!-- Top Row: Grip + Course Name + Delete -->
    <div class="flex items-center gap-1.5">
        <GripVertical
                size={14}
                class="shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground"
        />

        <input
                id="plan-course-{course.id}-name"
                class={cn(
        'w-full border-b border-transparent bg-transparent text-sm transition-colors focus:outline-none',
        'placeholder:text-muted-foreground/50',
        course.grade === null
          ? 'font-semibold text-foreground hover:border-border focus:border-primary'
          : 'font-medium text-muted-foreground hover:border-border/60 focus:border-primary',
        course.grade !== null && 'focus:text-foreground'
      )}
                value={course.name}
                placeholder="Course name"
                oninput={handleNameInput}
                onkeydown={onNameKeydown}
        />

        <Tooltip.Root>
            <Tooltip.Trigger>
                {#snippet child({ props })}
                    <Button
                            {...props}
                            variant="ghost"
                            size="icon"
                            onclick={deleteCourse}
                            class="h-6 w-6 shrink-0 text-muted-foreground/50 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    >
                        <Trash2 size={13} />
                    </Button>
                {/snippet}
            </Tooltip.Trigger>
            <Tooltip.Content>
                <p>Delete course</p>
            </Tooltip.Content>
        </Tooltip.Root>
    </div>

    <!-- Bottom Row: Units & Grade Steppers -->
    <div class="grid grid-cols-2 gap-2 text-xs">
        <!-- Units Stepper -->
        <div class="flex flex-col gap-0.5">
            <span class="text-[10px] text-muted-foreground">Units</span>
            <div
                    class={cn(
          'flex items-center justify-between border-b border-border/60',
          'pb-0.5 transition-colors focus-within:border-primary'
        )}
            >
                <button
                        type="button"
                        tabindex="-1"
                        onclick={() => updateUnits(-1)}
                        class="flex h-4 w-4 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                    <Minus size={11} />
                </button>

                <input
                        id="plan-course-{course.id}-units"
                        class={cn(
            'w-full bg-transparent p-0 text-center text-xs focus:outline-none',
            course.grade === null ? 'font-medium text-foreground' : 'text-muted-foreground'
          )}
                        type="number"
                        min="1"
                        max="12"
                        step="1"
                        value={course.units}
                        oninput={handleUnitsInput}
                        onblur={handleUnitsBlur}
                        onkeydown={onUnitsKeydown}
                />

                <button
                        type="button"
                        tabindex="-1"
                        onclick={() => updateUnits(1)}
                        class="flex h-4 w-4 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                    <Plus size={11} />
                </button>
            </div>
        </div>

        <!-- Grade Stepper -->
        <div class="flex flex-col gap-0.5">
            <span class="text-[10px] text-muted-foreground">Grade</span>
            <div
                    class={cn(
          'flex items-center justify-between border-b pb-0.5 transition-colors',
          isFailingGrade ? 'border-destructive' : 'border-border/60',
          !isFailingGrade && 'focus-within:border-primary'
        )}
            >
                <button
                        type="button"
                        tabindex="-1"
                        onclick={() => updateGrade(-1)}
                        class="flex h-4 w-4 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                    <Minus size={11} />
                </button>

                <input
                        id="plan-course-{course.id}-grade"
                        class={cn(
            'w-full bg-transparent p-0 text-center text-xs font-mono focus:outline-none',
            isFailingGrade
              ? 'font-semibold text-destructive'
              : course.grade !== null
                ? 'font-medium text-foreground'
                : 'text-muted-foreground/60'
          )}
                        type="number"
                        min={gradeMin}
                        max={gradeMax}
                        step={gradeStep}
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
                        onclick={() => updateGrade(1)}
                        class="flex h-4 w-4 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                    <Plus size={11} />
                </button>
            </div>
        </div>
    </div>
</div>