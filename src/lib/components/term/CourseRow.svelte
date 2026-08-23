<script lang="ts">
    import type { Course } from '$lib/schemas';
    import { appStore } from '$lib/stores/appState';
    import { Trash2, Minus, Plus } from 'lucide-svelte';
    import { Button } from '$lib/components/ui/button/index.js';
    import { cn } from '$lib/utils.js';

    let { course, onDelete, onUpdate, onNavigate }: {
        course: Course;
        onDelete: () => void;
        onUpdate: (field: 'name' | 'units' | 'grade', value: string | number | null) => void;
        onNavigate: () => void;
    } = $props();

    let gradeMin = $derived($appStore.universitySettings.gradeMin);
    let gradeMax = $derived($appStore.universitySettings.gradeMax);
    let failingGrade = $derived($appStore.universitySettings.failingGrade);

    let isFailingGrade = $derived(
        course.grade !== null &&
        failingGrade !== null &&
        course.grade === failingGrade
    );

    // --- Name ---
    function handleNameInput(e: Event) {
        const target = e.target as HTMLInputElement;
        onUpdate('name', target.value);
    }

    // --- Units ---
    function handleUnitsInput(e: Event) {
        const target = e.target as HTMLInputElement;
        const val = Math.trunc(parseFloat(target.value));
        if (!isNaN(val)) {
            onUpdate('units', Math.max(1, Math.min(12, val)));
        }
    }

    function handleUnitsBlur(e: Event) {
        const target = e.target as HTMLInputElement;
        const val = Math.trunc(parseFloat(target.value));
        const clamped = isNaN(val) ? (course.units || 1) : Math.max(1, Math.min(12, val));
        onUpdate('units', clamped);
        target.value = String(clamped);
    }

    function updateUnits(delta: number) {
        const next = Math.max(1, Math.min(12, (course.units || 0) + delta));
        onUpdate('units', next);
    }

    // --- Grade ---
    let gradeIsFocused = $state(false);
    let gradeLiveValue = $state('');

    let gradeDisplay = $derived(
        gradeIsFocused
            ? gradeLiveValue
            : course.grade !== null ? course.grade.toFixed(1) : ''
    );

    function handleGradeFocus() {
        gradeLiveValue = course.grade !== null ? course.grade.toFixed(1) : '';
        gradeIsFocused = true;
    }

    function handleGradeBlur() {
        gradeIsFocused = false;
        if (course.grade !== null) {
            onUpdate('grade', Number(course.grade.toFixed(1)));
        }
    }

    function handleGradeInput(e: Event) {
        const target = e.target as HTMLInputElement;
        gradeLiveValue = target.value;
        if (target.value === '') {
            onUpdate('grade', null);
            return;
        }
        const num = parseFloat(target.value);
        if (!isNaN(num)) onUpdate('grade', num);
    }

    function updateGrade(delta: number) {
        const step = 0.5;
        let next: number;
        if (course.grade === null) {
            next = delta > 0 ? Math.min(gradeMax, gradeMin + step) : gradeMin;
        } else {
            next = Math.round((course.grade + delta * step) * 2) / 2;
            next = Math.max(gradeMin, Math.min(gradeMax, next));
        }
        const formatted = Number(next.toFixed(1));
        onUpdate('grade', formatted);
        gradeLiveValue = formatted.toFixed(1); // Keeps focused input visually synced immediately
    }

    // --- Keyboard Navigation ---
    function onNameKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById(`course-${course.id}-units`)?.focus();
        }
    }

    function onUnitsKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter')     { e.preventDefault(); document.getElementById(`course-${course.id}-grade`)?.focus(); }
        if (e.key === 'ArrowUp')   { e.preventDefault(); updateUnits(1); }
        if (e.key === 'ArrowDown') { e.preventDefault(); updateUnits(-1); }
    }

    function onGradeKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter')     { e.preventDefault(); onNavigate(); }
        if (e.key === 'ArrowUp')   { e.preventDefault(); updateGrade(1); }
        if (e.key === 'ArrowDown') { e.preventDefault(); updateGrade(-1); }
        if (e.key === 'Escape')    { e.preventDefault(); onUpdate('grade', null); }
    }
</script>

<div class="grid grid-cols-[1fr_60px_72px_28px] sm:grid-cols-[1fr_80px_100px_36px] gap-1.5 sm:gap-2 items-center">
    <!-- Course name -->
    <input
            id="course-{course.id}-name"
            class={cn(
            "bg-transparent border-b border-border text-sm text-foreground",
            "focus:outline-none focus:border-primary transition-colors truncate pb-0.5"
        )}
            value={course.name}
            placeholder="Course name"
            oninput={handleNameInput}
            onkeydown={onNameKeydown}
    />

    <!-- Units Stepper -->
    <div class={cn(
        "flex items-center justify-between border-b border-border",
        "focus-within:border-primary transition-colors pb-0.5"
    )}>
        <button
                type="button"
                tabindex="-1"
                onclick={() => updateUnits(-1)}
                class="h-5 w-5 flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 rounded transition-colors"
        >
            <Minus size={12} />
        </button>
        <input
                id="course-{course.id}-units"
                class="bg-transparent text-sm text-foreground text-center focus:outline-none w-full p-0"
                type="number" min="1" max="12" step="1"
                value={course.units}
                oninput={handleUnitsInput}
                onblur={handleUnitsBlur}
                onkeydown={onUnitsKeydown}
        />
        <button type="button" tabindex="-1" onclick={() => updateUnits(1)}
                class="h-5 w-5 flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 rounded transition-colors">
            <Plus size={12} />
        </button>
    </div>

    <!-- Grade Stepper -->
    <div class={cn(
        "flex items-center justify-between border-b transition-colors pb-0.5",
        isFailingGrade ? "border-destructive" : "border-border",
        !isFailingGrade && "focus-within:border-primary"
    )}>
        <button
                type="button"
                tabindex="-1"
                onclick={() => updateGrade(-1)}
                class="h-5 w-5 flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 rounded transition-colors"
        >
            <Minus size={12} />
        </button>
        <input
                id="course-{course.id}-grade"
                class={cn(
                "bg-transparent text-sm text-center focus:outline-none w-full p-0",
                isFailingGrade ? "text-destructive" : "text-foreground"
            )}
                type="number" min={gradeMin} max={gradeMax} step="0.5"
                placeholder="—"
                value={gradeDisplay}
                onfocus={handleGradeFocus}
                oninput={handleGradeInput}
                onblur={handleGradeBlur}
                onkeydown={onGradeKeydown}
        />
        <button type="button" tabindex="-1" onclick={() => updateGrade(1)}
                class="h-5 w-5 flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 rounded transition-colors">
            <Plus size={12} />
        </button>
    </div>

    <!-- Delete -->
    <Button variant="ghost" size="icon" onclick={onDelete} class="text-muted-foreground hover:text-destructive h-7 w-7">
        <Trash2 size={14} />
    </Button>
</div>