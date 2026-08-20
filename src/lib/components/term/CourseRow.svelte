<script lang="ts">
    import type { Course } from '$lib/schemas';
    import { appStore } from '$lib/stores/appState';
    import { Trash2, Minus, Plus } from 'lucide-svelte';
    import { Button } from '$lib/components/ui/button/index.js';

    let { course, onDelete, onUpdate }: {
        course: Course;
        onDelete: () => void;
        onUpdate: (field: 'name' | 'units' | 'grade', value: string | number | null) => void;
    } = $props();

    let gradeMin = $derived($appStore.universitySettings.gradeMin);
    let gradeMax = $derived($appStore.universitySettings.gradeMax);
    let failingGrade = $derived($appStore.universitySettings.failingGrade);

    let isFailingGrade = $derived(
        course.grade !== null &&
        failingGrade !== null &&
        course.grade === failingGrade
    );

    function handleNameChange(e: Event) {
        const input = e.target as HTMLInputElement;
        onUpdate('name', input.value);
    }

    function handleUnitsChange(e: Event) {
        const input = e.target as HTMLInputElement;
        const val = parseInt(input.value);
        onUpdate('units', isNaN(val) ? 1 : val);
    }

    function handleGradeInput(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.value === '') {
            onUpdate('grade', null);
            return;
        }
        const num = parseFloat(input.value);
        if (!isNaN(num)) onUpdate('grade', num);
    }

    function updateUnits(delta: number) {
        const current = course.units || 0;
        const next = Math.max(1, Math.min(12, current + delta));
        onUpdate('units', next);
    }

    function updateGrade(delta: number) {
        const step = 0.5;
        if (course.grade === null) {
            // When ungraded: '+' sets to first step above min, '-' sets to gradeMin
            const initial = delta > 0 ? Math.min(gradeMax, gradeMin + step) : gradeMin;
            onUpdate('grade', initial);
            return;
        }

        let next = course.grade + delta * step;
        // Snap cleanly to nearest 0.5 increment
        next = Math.round(next * 2) / 2;
        next = Math.max(gradeMin, Math.min(gradeMax, next));

        onUpdate('grade', next);
    }
</script>

<div class="grid grid-cols-[1fr_80px_100px_36px] gap-2 items-center">
    <!-- Course name -->
    <input
            class="bg-transparent border-b border-border text-sm text-foreground focus:outline-none focus:border-primary transition-colors truncate pb-0.5"
            value={course.name}
            placeholder="Course name"
            onchange={handleNameChange}
    />

    <!-- Custom Units Stepper -->
    <div class="flex items-center justify-between border-b border-border focus-within:border-primary transition-colors pb-0.5">
        <button
                type="button"
                tabindex="-1"
                onclick={() => updateUnits(-1)}
                class="h-5 w-5 flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 rounded transition-colors"
        >
            <Minus size={12} />
        </button>

        <input
                class="bg-transparent text-sm text-foreground text-center focus:outline-none w-full p-0"
                type="number"
                min="1"
                max="12"
                value={course.units}
                onchange={handleUnitsChange}
        />

        <button
                type="button"
                tabindex="-1"
                onclick={() => updateUnits(1)}
                class="h-5 w-5 flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 rounded transition-colors"
        >
            <Plus size={12} />
        </button>
    </div>

    <!-- Custom Grade Stepper (0.5 increments) -->
    <div class="flex items-center justify-between border-b transition-colors pb-0.5 {isFailingGrade ? 'border-destructive' : 'border-border focus-within:border-primary'}">
        <button
                type="button"
                tabindex="-1"
                onclick={() => updateGrade(-1)}
                class="h-5 w-5 flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 rounded transition-colors"
        >
            <Minus size={12} />
        </button>

        <input
                class="bg-transparent text-sm text-center focus:outline-none w-full p-0 {isFailingGrade ? 'text-destructive' : 'text-foreground'}"
                type="number"
                min={gradeMin}
                max={gradeMax}
                step="0.5"
                placeholder="—"
                value={course.grade ?? ''}
                oninput={handleGradeInput}
        />

        <button
                type="button"
                tabindex="-1"
                onclick={() => updateGrade(1)}
                class="h-5 w-5 flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 rounded transition-colors"
        >
            <Plus size={12} />
        </button>
    </div>

    <!-- Delete -->
    <Button
            variant="ghost"
            size="icon"
            onclick={onDelete}
            class="text-muted-foreground hover:text-destructive h-7 w-7"
    >
        <Trash2 size={14} />
    </Button>
</div>