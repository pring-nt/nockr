<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { flip } from 'svelte/animate';
	import {
		dndzone,
		dragHandle,
		SHADOW_ITEM_MARKER_PROPERTY_NAME,
		type DndEvent
	} from 'svelte-dnd-action';
	import { appStore } from '$lib/stores/appState';
	import { placeChecklistItem, type ChecklistDragItem } from '$lib/logic/checklist';
	import { removeTerm } from '$lib/logic/terms';
	import { CourseSchema, type Term, type Course } from '$lib/schemas';
	import {
		computeTGPA,
		computeTermAttemptedUnits,
		computeTermNonGpaUnits,
		computeTermTotalUnits,
		computeTermUnitsEarned
	} from '$lib/logic/gpa';
	import CourseCard from '$lib/components/plan/CourseCard.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { GripVertical, Plus, Trash2, Share2 } from 'lucide-svelte';
	import { cn } from '$lib/utils.js';

	let { term }: { term: Term } = $props();

	let settings = $derived($appStore.universitySettings);
	let localCourses = $state<Course[]>(untrack(() => [...term.courses]));
	let isEditingTerm = $state(false);
	let termNameEdit = $state(untrack(() => term.name));
	let isHovered = $state(false);
	let isDndActive = $state(false);
	let isDragOrigin = false;
	let dropZoneRef = $state<HTMLElement | null>(null);

	$effect(() => {
		if (!isDndActive) {
			localCourses = [...term.courses];
		}
		termNameEdit = term.name;
	});

	let tgpa = $derived(computeTGPA(term));
	let totalUnits = $derived(computeTermTotalUnits(term));
	let nonGpaUnits = $derived(computeTermNonGpaUnits(term));
	let attemptedUnits = $derived(computeTermAttemptedUnits(term));
	let earnedUnits = $derived(computeTermUnitsEarned(term, settings));

	function isShadowItem(item: Course): boolean {
		return Boolean((item as Record<string, unknown>)[SHADOW_ITEM_MARKER_PROPERTY_NAME]);
	}

	function isChecklistItem(item: Course): boolean {
		return 'fromChecklist' in item;
	}

	function startEditing() {
		termNameEdit = term.name;
		isEditingTerm = true;
	}

	function commitRename() {
		if (termNameEdit.trim()) {
			appStore.update((state) => ({
				...state,
				terms: state.terms.map((t) => (t.id === term.id ? { ...t, name: termNameEdit.trim() } : t))
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
			terms: removeTerm(state.terms, term.id)
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
							courses: [...t.courses, CourseSchema.parse({ id: newId })]
						}
					: t
			)
		}));

		tick().then(() => {
			if (dropZoneRef) {
				dropZoneRef.scrollTop = dropZoneRef.scrollHeight;
			}
			if (focusNew) {
				const input =
					document.getElementById(`course-${newId}-name`) ??
					document.getElementById(`plan-course-${newId}-name`);
				input?.focus();
			}
		});
	}

	function handleConsider(e: CustomEvent<DndEvent<Course>>) {
		const { trigger } = e.detail.info;
		if (trigger === 'dragStarted') isDragOrigin = true;

		// Only the origin and landing columns get a finalize, so a drag passing over has to let go here
		isDndActive = trigger !== 'draggedLeft' || isDragOrigin;

		if (trigger === 'draggedEntered') isHovered = true;
		else if (trigger === 'draggedLeft') isHovered = false;

		localCourses = e.detail.items;
	}

	function handleFinalize(e: CustomEvent<DndEvent<Course>>) {
		isHovered = false;
		isDndActive = false;
		isDragOrigin = false;

		const dropIndex = e.detail.items.findIndex(isChecklistItem);
		if (dropIndex !== -1) {
			const dropped = e.detail.items[dropIndex] as unknown as ChecklistDragItem;
			localCourses = e.detail.items.filter((item) => !isChecklistItem(item));
			appStore.update((state) => ({
				...state,
				terms: placeChecklistItem(
					state.terms,
					dropped,
					term.id,
					state.universitySettings,
					dropIndex
				)
			}));
			return;
		}

		localCourses = e.detail.items;
		appStore.update((state) => ({
			...state,
			terms: state.terms.map((t) => (t.id === term.id ? { ...t, courses: e.detail.items } : t))
		}));
	}
</script>

<div
	class={cn(
		'flex h-full max-h-full w-70 shrink-0 flex-col rounded-xl border p-3 shadow-xs backdrop-blur-md transition-colors duration-150',
		isHovered
			? 'border-primary/60 bg-primary/10 shadow-lg ring-2 shadow-primary/5 ring-primary/40'
			: 'border-border/50 bg-background/40'
	)}
>
	<!-- Column Header -->
	<div class="mb-3 shrink-0 border-b border-border/40 pb-2.5">
		<div class="flex items-start justify-between gap-1">
			<div
				use:dragHandle
				aria-label="Drag to reorder {term.name}"
				class="mt-0.5 shrink-0 cursor-grab text-muted-foreground/40 transition-colors hover:text-muted-foreground active:cursor-grabbing"
			>
				<GripVertical size={14} />
			</div>

			<div class="min-w-0 flex-1">
				{#if isEditingTerm}
					<input
						class="w-full border-b border-primary bg-transparent text-sm font-semibold text-foreground focus:outline-none"
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
			</div>

			<div class="flex shrink-0 items-center gap-0.5">
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								href="/export?termId={term.id}"
								variant="ghost"
								size="icon"
								class="h-6 w-6 text-muted-foreground hover:text-foreground"
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
								class="h-6 w-6 text-muted-foreground hover:text-destructive"
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

		<!-- Prominent Stats Badges -->
		<div class="mt-2 flex items-center gap-1.5">
			{#if attemptedUnits > 0 && earnedUnits < attemptedUnits}
				<span
					class="inline-flex items-center rounded-md border border-destructive/30 bg-destructive/10 px-2 py-0.5 font-mono text-[11px] font-bold text-destructive"
					title="{attemptedUnits - earnedUnits} units failed in this term"
				>
					{earnedUnits}/{totalUnits} earned
				</span>
			{:else}
				<span
					class="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-bold text-primary"
				>
					{totalUnits}
					{totalUnits === 1 ? 'unit' : 'units'}
				</span>
			{/if}

			{#if nonGpaUnits > 0}
				<span
					class="inline-flex items-center rounded-md border border-border/50 bg-muted/60 px-2 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground"
					title="Not counted in GPA or degree units"
				>
					+{nonGpaUnits} non-GPA
				</span>
			{/if}

			{#if tgpa !== null}
				<span
					class="inline-flex items-center rounded-md border border-border/50 bg-muted/60 px-2 py-0.5 font-mono text-[11px] font-semibold text-foreground"
				>
					TGPA {tgpa.toFixed(3)}
				</span>
			{/if}
		</div>
	</div>

	<!-- Draggable Drop Zone -->
	<div
		bind:this={dropZoneRef}
		use:dndzone={{ items: localCourses, flipDurationMs: 200, dropTargetStyle: {} }}
		onconsider={handleConsider}
		onfinalize={handleFinalize}
		class="min-h-0 flex-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent space-y-2 overflow-y-auto p-0.5"
	>
		{#each localCourses as course (course.id)}
			<div animate:flip={{ duration: 200 }}>
				{#if isShadowItem(course)}
					<div
						class="pointer-events-none visible! h-18.5 w-full rounded-lg border-2 border-dashed border-primary/50 bg-primary/10 opacity-100! transition-colors duration-150"
						style="visibility: visible !important; opacity: 1 !important;"
					></div>
				{:else}
					<CourseCard {course} termId={term.id} {settings} onNavigate={() => addCourse(true)} />
				{/if}
			</div>
		{/each}
	</div>

	<!-- Inline Add Course Button -->
	<Button
		variant="outline"
		size="sm"
		class="mt-3 w-full shrink-0 gap-1.5 border-dashed bg-background/30 text-xs text-muted-foreground hover:bg-background/60 hover:text-foreground"
		onclick={() => addCourse(true)}
	>
		<Plus size={14} /> Add Course
	</Button>
</div>
