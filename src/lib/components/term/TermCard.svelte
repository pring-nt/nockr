<script lang="ts">
	import { MAX_TERM_NAME } from '$lib/schemas';
	import { CourseSchema, type CourseType, type Term } from '$lib/schemas';
	import { appStore } from '$lib/stores/appState';
	import {
		computeTGPA,
		computeTermAttemptedUnits,
		computeTermNonGpaUnits,
		computeTermTotalUnits,
		computeTermUnitsEarned,
		withCourseType
	} from '$lib/logic/gpa';
	import { moveCourse } from '$lib/logic/terms';
	import { getDeansListTier } from '$lib/logic/honors';
	import { Plus, GraduationCap } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardHeader, CardContent } from '$lib/components/ui/card/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import CourseRow from './CourseRow.svelte';
	import TermMenu from './TermMenu.svelte';
	import { tick } from 'svelte';

	let {
		term,
		onDelete,
		onRename
	}: {
		term: Term;
		onDelete: () => void;
		onRename: (name: string) => void;
	} = $props();

	let settings = $derived($appStore.universitySettings);
	let tgpa = $derived(computeTGPA(term));
	let totalUnits = $derived(computeTermTotalUnits(term));
	let nonGpaUnits = $derived(computeTermNonGpaUnits(term));
	let attemptedUnits = $derived(computeTermAttemptedUnits(term));
	let earnedUnits = $derived(computeTermUnitsEarned(term, settings));
	let deansListTier = $derived(getDeansListTier(term, tgpa, settings));
	let moveTargets = $derived($appStore.terms.filter((t) => t.id !== term.id));

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

	function addCourse(focusNew = false) {
		const newId = crypto.randomUUID();
		appStore.update((state) => ({
			...state,
			terms: state.terms.map((t) =>
				t.id === term.id
					? {
							...t,
							courses: [...t.courses, CourseSchema.parse({ id: newId })]
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
		appStore.update((state) => ({
			...state,
			terms: state.terms.map((t) =>
				t.id === term.id ? { ...t, courses: t.courses.filter((c) => c.id !== courseId) } : t
			)
		}));
	}

	function updateCourse(
		courseId: string,
		field: 'name' | 'units' | 'grade' | 'result',
		value: string | number | null
	) {
		appStore.update((state) => ({
			...state,
			terms: state.terms.map((t) =>
				t.id === term.id
					? {
							...t,
							courses: t.courses.map((c) => (c.id === courseId ? { ...c, [field]: value } : c))
						}
					: t
			)
		}));
	}

	function changeCourseType(courseId: string, type: CourseType) {
		appStore.update((state) => ({
			...state,
			terms: state.terms.map((t) =>
				t.id === term.id
					? {
							...t,
							courses: t.courses.map((c) => (c.id === courseId ? withCourseType(c, type) : c))
						}
					: t
			)
		}));
	}

	function moveCourseTo(courseId: string, targetTermId: string) {
		appStore.update((state) => ({
			...state,
			terms: moveCourse(state.terms, courseId, term.id, targetTermId)
		}));
	}

	function handleNavigate(courseId: string) {
		const idx = term.courses.findIndex((c) => c.id === courseId);
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

<Card class="glass gap-0 border-border/40 py-0 ring-0">
	<CardHeader class="p-3 pb-3 sm:p-6 sm:pb-3">
		<div class="flex items-start justify-between gap-3">
			<div class="min-w-0 flex-1">
				{#if isEditing}
					<input
						class="w-full border-b border-primary bg-transparent text-base font-semibold text-foreground focus:outline-none sm:text-lg"
						bind:value={editName}
						maxlength={MAX_TERM_NAME}
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
									class="block max-w-full cursor-pointer truncate text-left text-base font-semibold text-foreground transition-colors hover:text-primary sm:text-lg"
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

				<p class="mt-0.5 font-mono text-[11px] text-muted-foreground">
					{#if attemptedUnits > 0 && earnedUnits < attemptedUnits}
						<span class="text-destructive" title="{attemptedUnits - earnedUnits} units failed">
							{earnedUnits}/{totalUnits} earned
						</span>
					{:else}
						{totalUnits} {totalUnits === 1 ? 'unit' : 'units'}
					{/if}
					{#if nonGpaUnits > 0}
						<span title="Not counted in GPA or degree units">· +{nonGpaUnits} non-GPA</span>
					{/if}
				</p>

				{#if deansListTier}
					<p class="mt-1 flex items-center gap-1 text-[11px] font-semibold sm:text-xs">
						<GraduationCap size={13} class="shrink-0 text-primary" />
						<span class="gradient-text truncate">{deansListTier.label}</span>
					</p>
				{/if}
			</div>

			<div class="flex shrink-0 items-start gap-1">
				<div class="text-right">
					<p class="text-[10px] text-muted-foreground sm:text-xs">TGPA</p>
					<p class="gradient-text text-base font-bold text-primary sm:text-lg">
						{tgpa !== null ? tgpa.toFixed(3) : '—'}
					</p>
				</div>

				<TermMenu
					termId={term.id}
					termName={term.name}
					triggerClass="h-9 w-9 sm:h-8 sm:w-8"
					onRename={startEditing}
					{onDelete}
				/>
			</div>
		</div>
	</CardHeader>

	<CardContent class="space-y-3 p-3 pt-0 sm:space-y-2 sm:p-6 sm:pt-0">
		{#if term.courses.length > 0}
			<div
				class="mb-1 grid grid-cols-[1fr_1fr_32px] gap-x-2 px-2 sm:grid-cols-[1fr_80px_100px_36px] sm:gap-2 sm:px-1"
			>
				<p class="hidden text-[11px] text-muted-foreground sm:block sm:text-xs">Course</p>
				<p class="text-center text-[11px] text-muted-foreground sm:text-xs">Units</p>
				<p class="text-center text-[11px] text-muted-foreground sm:text-xs">Grade</p>
				<span></span>
			</div>
		{/if}

		{#each term.courses as course (course.id)}
			<CourseRow
				{course}
				{moveTargets}
				onDelete={() => deleteCourse(course.id)}
				onUpdate={(field, value) => updateCourse(course.id, field, value)}
				onTypeChange={(type) => changeCourseType(course.id, type)}
				onMove={(termId) => moveCourseTo(course.id, termId)}
				onNavigate={() => handleNavigate(course.id)}
			/>
		{/each}

		<Button
			onclick={() => addCourse(true)}
			variant="ghost"
			size="sm"
			class="mt-1 h-8 w-full gap-2 text-xs text-muted-foreground hover:text-foreground sm:h-9 sm:text-sm"
		>
			<Plus size={14} />
			Add Course
		</Button>
	</CardContent>
</Card>
