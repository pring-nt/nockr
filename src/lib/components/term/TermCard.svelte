<!-- src/lib/components/term/TermCard.svelte -->
<script lang="ts">
	import type { Term } from '$lib/schemas';
	import { appStore } from '$lib/stores/appState';
	import { computeTGPA } from '$lib/logic/gpa';
	import { getDeansListTier } from '$lib/logic/honors';
	import { Plus, Trash2, GraduationCap } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardHeader, CardContent } from '$lib/components/ui/card/index.js';
	import CourseRow from './CourseRow.svelte';
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

	let tgpa = $derived(computeTGPA(term));
	let deansListTier = $derived(getDeansListTier(term, tgpa, $appStore.universitySettings));

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
		field: 'name' | 'units' | 'grade',
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

	// --- Keyboard Navigation (cross-row) ---
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

<Card class="glass border-border/40">
	<CardHeader class="p-3 pb-3 sm:p-6 sm:pb-3">
		<div class="flex items-center justify-between gap-2">
			<!-- Term name + Gradient Dean's List Badge -->
			<div class="flex min-w-0 flex-1 items-center gap-2">
				{#if isEditing}
					<input
						class="min-w-0 flex-1 border-b border-primary bg-transparent
                               text-base font-semibold text-foreground focus:outline-none sm:text-lg"
						bind:value={editName}
						onblur={commitRename}
						onkeydown={(e) => e.key === 'Enter' && commitRename()}
						use:focusOnMount
					/>
				{:else}
					<button
						class="cursor-pointer truncate text-left text-base font-semibold
                               text-foreground transition-colors hover:text-primary sm:text-lg"
						ondblclick={startEditing}
						title="Double-click to rename"
					>
						{term.name}
					</button>
				{/if}

				{#if deansListTier}
					<span
						class="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/35 bg-linear-to-r from-primary/20 via-primary/10 to-accent/20 px-2.5 py-0.5 text-[10px] font-semibold shadow-xs ring-1 ring-primary/20 transition-all hover:scale-105 sm:text-xs"
					>
						<GraduationCap size={13} class="shrink-0 text-primary" />
						<span class="gradient-text font-bold">{deansListTier.label}</span>
					</span>
				{/if}
			</div>

			<!-- TGPA + delete -->
			<div class="flex shrink-0 items-center gap-2 sm:gap-3">
				<div class="text-right">
					<p class="text-[10px] text-muted-foreground sm:text-xs">TGPA</p>
					<p class="gradient-text text-base font-bold text-primary sm:text-lg">
						{tgpa !== null ? tgpa.toFixed(3) : '—'}
					</p>
				</div>
				<Button
					variant="ghost"
					size="icon"
					onclick={onDelete}
					class="h-7 w-7 text-muted-foreground hover:text-destructive sm:h-8 sm:w-8"
				>
					<Trash2 size={16} />
				</Button>
			</div>
		</div>
	</CardHeader>

	<CardContent class="space-y-2 p-3 pt-0 sm:p-6 sm:pt-0">
		{#if term.courses.length > 0}
			<div
				class="mb-1 grid grid-cols-[1fr_60px_72px_28px] gap-1.5 px-0.5 sm:grid-cols-[1fr_80px_100px_36px] sm:gap-2 sm:px-1"
			>
				<p class="text-[11px] text-muted-foreground sm:text-xs">Course</p>
				<p class="text-center text-[11px] text-muted-foreground sm:text-xs">Units</p>
				<p class="text-center text-[11px] text-muted-foreground sm:text-xs">Grade</p>
				<span></span>
			</div>
		{/if}

		{#each term.courses as course (course.id)}
			<CourseRow
				{course}
				onDelete={() => deleteCourse(course.id)}
				onUpdate={(field, value) => updateCourse(course.id, field, value)}
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
