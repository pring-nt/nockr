<script lang="ts">
	import { MAX_COURSE_NAME } from '$lib/schemas';
	import type { Course, CourseResult, CourseType, Term } from '$lib/schemas';
	import { appStore } from '$lib/stores/appState';
	import { Minus, Plus } from 'lucide-svelte';
	import CourseMenu from './CourseMenu.svelte';
	import CourseResultControl from './CourseResultControl.svelte';
	import { cn } from '$lib/utils.js';

	let {
		course,
		moveTargets,
		onDelete,
		onUpdate,
		onTypeChange,
		onMove,
		onNavigate
	}: {
		course: Course;
		moveTargets: Term[];
		onDelete: () => void;
		onUpdate: (field: 'name' | 'units' | 'grade' | 'result', value: string | number | null) => void;
		onTypeChange: (type: CourseType) => void;
		onMove: (termId: string) => void;
		onNavigate: () => void;
	} = $props();

	let gradeMin = $derived($appStore.universitySettings.gradeMin);
	let gradeMax = $derived($appStore.universitySettings.gradeMax);
	let failingGrade = $derived($appStore.universitySettings.failingGrade);
	let gradeStep = $derived($appStore.universitySettings.gradeStep ?? 0.25);

	let minUnits = $derived(course.type === 'graded' ? 1 : 0);

	let isFailingGrade = $derived(
		course.grade !== null && failingGrade !== null && course.grade === failingGrade
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
			onUpdate('units', Math.max(minUnits, Math.min(12, val)));
		}
	}

	function handleUnitsBlur(e: Event) {
		const target = e.target as HTMLInputElement;
		const val = Math.trunc(parseFloat(target.value));
		const clamped = isNaN(val) ? course.units || minUnits : Math.max(minUnits, Math.min(12, val));
		onUpdate('units', clamped);
		target.value = String(clamped);
	}

	function updateUnits(delta: number) {
		const next = Math.max(minUnits, Math.min(12, (course.units || 0) + delta));
		onUpdate('units', next);
	}

	// --- Grade ---
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
			onUpdate('grade', Number(course.grade.toFixed(2)));
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
		onUpdate('grade', formatted);
		gradeLiveValue = formatted.toFixed(2);
	}

	// --- Keyboard Navigation ---
	function onNameKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			document.getElementById(`course-${course.id}-units`)?.focus();
		}
	}

	function onUnitsKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			if (course.type === 'credited') onNavigate();
			else document.getElementById(`course-${course.id}-grade`)?.focus();
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
		if (e.key === 'Enter') {
			e.preventDefault();
			onNavigate();
		}
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
			onUpdate('grade', null);
		}
	}
</script>

<div
	class="grid grid-cols-[1fr_1fr_32px] items-center gap-x-2 rounded-lg border border-(--highlight-med)/60 bg-(--overlay)/40 px-2.5 pt-2 pb-1 sm:grid-cols-[1fr_80px_100px_36px] sm:gap-2 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0"
>
	<!-- Course name -->
	<input
		id="course-{course.id}-name"
		class={cn(
			'col-span-2 col-start-1 row-start-1 sm:col-span-1',
			'w-full min-w-0 border-b border-transparent bg-transparent text-sm leading-tight font-medium text-foreground sm:border-border sm:leading-normal sm:font-normal',
			'truncate pb-0.5 transition-colors focus:border-primary focus:outline-none'
		)}
		value={course.name}
		maxlength={MAX_COURSE_NAME}
		placeholder="Course name"
		oninput={handleNameInput}
		onkeydown={onNameKeydown}
	/>

	<!-- Units Stepper -->
	<div
		class={cn(
			'col-start-1 row-start-2 sm:col-start-2 sm:row-start-1',
			'flex items-center justify-between border-b border-transparent sm:border-border',
			'pb-0.5 transition-colors focus-within:border-primary'
		)}
	>
		<button
			type="button"
			tabindex="-1"
			onclick={() => updateUnits(-1)}
			class="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-muted-foreground/50 transition-colors hover:bg-muted/50 hover:text-foreground sm:h-5 sm:w-5"
		>
			<Minus size={12} />
		</button>

		<input
			id="course-{course.id}-units"
			class="w-full bg-transparent p-0 text-center text-sm text-foreground focus:outline-none"
			type="number"
			min={minUnits}
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
			class="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-muted-foreground/50 transition-colors hover:bg-muted/50 hover:text-foreground sm:h-5 sm:w-5"
		>
			<Plus size={12} />
		</button>
	</div>

	<!-- Grade Stepper -->
	{#if course.type === 'graded'}
		<div
			class={cn(
				'col-start-2 row-start-2 sm:col-start-3 sm:row-start-1',
				'flex items-center justify-between border-b pb-0.5 transition-colors',
				isFailingGrade ? 'border-destructive' : 'border-transparent sm:border-border',
				!isFailingGrade && 'focus-within:border-primary'
			)}
		>
			<button
				type="button"
				tabindex="-1"
				onclick={() => updateGrade(-1)}
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-muted-foreground/50 transition-colors hover:bg-muted/50 hover:text-foreground sm:h-5 sm:w-5"
			>
				<Minus size={12} />
			</button>

			<input
				id="course-{course.id}-grade"
				class={cn(
					'w-full bg-transparent p-0 text-center text-sm focus:outline-none',
					isFailingGrade ? 'text-destructive' : 'text-foreground'
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
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-muted-foreground/50 transition-colors hover:bg-muted/50 hover:text-foreground sm:h-5 sm:w-5"
			>
				<Plus size={12} />
			</button>
		</div>
	{:else}
		<div class="col-start-2 row-start-2 sm:col-start-3 sm:row-start-1">
			<CourseResultControl
				{course}
				id="course-{course.id}-grade"
				onChange={(result: CourseResult) => onUpdate('result', result)}
				{onNavigate}
			/>
		</div>
	{/if}

	<CourseMenu
		type={course.type}
		triggerClass="col-start-3 row-start-1 -my-1.5 h-8 w-8 text-muted-foreground hover:text-foreground sm:col-start-4 sm:my-0 sm:h-7 sm:w-7"
		{moveTargets}
		{onTypeChange}
		{onMove}
		{onDelete}
	/>
</div>
