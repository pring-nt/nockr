<script lang="ts">
	import { untrack } from 'svelte';
	import { flip } from 'svelte/animate';
	import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME, type DndEvent } from 'svelte-dnd-action';
	import { appStore } from '$lib/stores/appState';
	import {
		ChecklistItemSchema,
		type ChecklistFilter,
		type ChecklistItem,
		type ChecklistSort
	} from '$lib/schemas';
	import {
		getChecklistState,
		mergeChecklist,
		parseChecklistLines,
		placeChecklistItem,
		viewChecklist,
		type ChecklistDragItem
	} from '$lib/logic/checklist';
	import ChecklistRow from '$lib/components/plan/ChecklistRow.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import {
		ArrowUpDown,
		ChevronLeft,
		ChevronRight,
		ClipboardList,
		Info,
		Plus,
		RotateCcw
	} from 'lucide-svelte';
	import { cn } from '$lib/utils.js';

	const PASTE_PLACEHOLDER = 'CCPROG1, 3\nCCPROG2, 3\nGEPCOMM';

	const filterOptions: { value: ChecklistFilter; label: string }[] = [
		{ value: 'all', label: 'All' },
		{ value: 'todo', label: 'To do' },
		{ value: 'planned', label: 'Planned' },
		{ value: 'done', label: 'Done' }
	];

	const sortOptions: { value: ChecklistSort; label: string }[] = [
		{ value: 'custom', label: 'Default' },
		{ value: 'alphabetical', label: 'A–Z' },
		{ value: 'term', label: 'By term' }
	];

	let {
		embedded = false,
		onDragChange
	}: {
		embedded?: boolean;
		onDragChange?: (isDragging: boolean) => void;
	} = $props();

	let isOpen = $derived(embedded || ($appStore.ui?.checklistPanelOpen ?? true));
	let items = $derived($appStore.courseChecklist ?? []);
	let terms = $derived($appStore.terms);
	let settings = $derived($appStore.universitySettings);

	let states = $derived(
		new Map(items.map((item) => [item.id, getChecklistState(item, terms, settings)]))
	);
	let doneCount = $derived([...states.values()].filter((s) => s.status === 'done').length);

	let filter = $derived($appStore.ui.checklistFilter);
	let sort = $derived($appStore.ui.checklistSort);
	let visibleItems = $derived(viewChecklist(items, states, filter, sort));
	let isReorderable = $derived(filter === 'all' && sort === 'custom');

	let newItemLabel = $state('');
	let pasteText = $state('');
	let isPasteOpen = $state(false);
	let isResetOpen = $state(false);

	let pasted = $derived(parseChecklistLines(pasteText));

	function toDragItems(list: ChecklistItem[]): ChecklistDragItem[] {
		return list.map((item) => ({ ...item, fromChecklist: true }));
	}

	let dragItems = $state<ChecklistDragItem[]>(untrack(() => toDragItems(visibleItems)));
	let isDragging = $state(false);

	$effect(() => {
		const next = toDragItems(visibleItems);
		if (!isDragging) dragItems = next;
	});

	function isShadowItem(item: ChecklistDragItem): boolean {
		return Boolean((item as Record<string, unknown>)[SHADOW_ITEM_MARKER_PROPERTY_NAME]);
	}

	function handleConsider(e: CustomEvent<DndEvent<ChecklistDragItem>>) {
		isDragging = true;
		onDragChange?.(true);
		dragItems = e.detail.items;
	}

	function handleFinalize(e: CustomEvent<DndEvent<ChecklistDragItem>>) {
		isDragging = false;
		onDragChange?.(false);

		// A course dropped on a term leaves this list short, so only a drop back here is a reorder
		if (isReorderable && e.detail.items.length === items.length) {
			const order = e.detail.items.map((item) => item.id);
			appStore.update((state) => ({
				...state,
				courseChecklist: [...state.courseChecklist].sort(
					(a, b) => order.indexOf(a.id) - order.indexOf(b.id)
				)
			}));
		}
		dragItems = toDragItems(visibleItems);
	}

	function setView(changes: { checklistFilter?: ChecklistFilter; checklistSort?: ChecklistSort }) {
		appStore.update((state) => ({ ...state, ui: { ...state.ui, ...changes } }));
	}

	function togglePanel() {
		appStore.update((state) => ({
			...state,
			ui: {
				...state.ui,
				checklistPanelOpen: !state.ui.checklistPanelOpen
			}
		}));
	}

	function updateItem(id: string, changes: Partial<ChecklistItem>) {
		appStore.update((state) => ({
			...state,
			courseChecklist: state.courseChecklist.map((item) =>
				item.id === id ? { ...item, ...changes } : item
			)
		}));
	}

	function deleteItem(id: string) {
		appStore.update((state) => ({
			...state,
			courseChecklist: state.courseChecklist.filter((item) => item.id !== id)
		}));
	}

	function placeItem(item: ChecklistItem, termId: string) {
		appStore.update((state) => ({
			...state,
			terms: placeChecklistItem(state.terms, item, termId, state.universitySettings)
		}));
	}

	function addItem() {
		const label = newItemLabel.trim();
		if (!label) return;
		const item = ChecklistItemSchema.parse({ id: crypto.randomUUID(), label });
		appStore.update((state) => ({
			...state,
			courseChecklist: [...state.courseChecklist, item]
		}));
		newItemLabel = '';
	}

	function addPasted() {
		appStore.update((state) => ({
			...state,
			courseChecklist: mergeChecklist(state.courseChecklist, pasted)
		}));
		pasteText = '';
		isPasteOpen = false;
	}

	function resetChecklist() {
		appStore.resetChecklist();
		isResetOpen = false;
	}
</script>

<div class="relative flex h-full flex-col bg-background/20 backdrop-blur-md">
	<!-- Top Bar / Header -->
	<div class="flex h-14 items-center justify-between border-b border-border/40 px-3">
		{#if isOpen}
			<div class="flex items-center gap-1.5 overflow-hidden">
				<h2 class="truncate text-xs font-semibold tracking-wider text-muted-foreground uppercase">
					Checklist
				</h2>
				<span class="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
					{doneCount}/{items.length}
				</span>

				<!-- Note Trigger -->
				<Popover.Root>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="ghost"
								size="icon"
								class="h-6 w-6 text-muted-foreground hover:text-foreground"
								aria-label="Checklist info"
							>
								<Info size={13} />
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content side="bottom" align="start" class="w-68 p-3 text-xs leading-relaxed">
						<p class="font-semibold text-foreground">Your Curriculum</p>
						<p class="text-[11px] leading-normal text-muted-foreground">
							Drag a course onto a term to plan it. Checks update on their own from your grades, and
							you can tick off anything you took elsewhere. Courses marked * are not counted in your
							GPA. The default list is a general preset, so change it to match your program.
						</p>
					</Popover.Content>
				</Popover.Root>
			</div>

			<div class="flex items-center gap-1">
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="ghost"
								size="icon"
								class="h-7 w-7 text-muted-foreground hover:text-foreground"
								aria-label="Reset checklist"
								onclick={() => (isResetOpen = true)}
							>
								<RotateCcw size={13} />
							</Button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>Reset checklist</p>
					</Tooltip.Content>
				</Tooltip.Root>

				{#if !embedded}
					<Button
						variant="ghost"
						size="icon"
						class="h-7 w-7 shrink-0"
						aria-label="Collapse checklist"
						onclick={togglePanel}
					>
						<ChevronLeft size={16} />
					</Button>
				{/if}
			</div>
		{:else}
			<div class="flex w-full justify-center">
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="ghost"
								size="icon"
								class="h-8 w-8 text-muted-foreground hover:text-foreground"
								onclick={togglePanel}
								aria-label="Expand checklist"
							>
								<ChevronRight size={16} />
							</Button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content side="right">
						<p>Expand checklist</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</div>
		{/if}
	</div>

	{#if isOpen}
		<!-- Filter and Sort -->
		<div class="flex items-center gap-1 border-b border-border/40 px-3 py-1.5">
			<div class="flex min-w-0 flex-1 gap-0.5" role="group" aria-label="Filter checklist">
				{#each filterOptions as option (option.value)}
					<button
						type="button"
						aria-pressed={filter === option.value}
						onclick={() => setView({ checklistFilter: option.value })}
						class={cn(
							'rounded px-1.5 py-1 text-[10px] font-medium whitespace-nowrap transition-colors',
							filter === option.value
								? 'bg-primary/15 text-primary'
								: 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
						)}
					>
						{option.label}
					</button>
				{/each}
			</div>

			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Button
							{...props}
							variant="ghost"
							size="icon"
							class={cn(
								'h-6 w-6 shrink-0',
								sort === 'custom' ? 'text-muted-foreground' : 'text-primary'
							)}
							aria-label="Sort checklist"
						>
							<ArrowUpDown size={13} />
						</Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end" class="w-36">
					<DropdownMenu.Label>Sort by</DropdownMenu.Label>
					<DropdownMenu.RadioGroup
						value={sort}
						onValueChange={(value) => setView({ checklistSort: value as ChecklistSort })}
					>
						{#each sortOptions as option (option.value)}
							<DropdownMenu.RadioItem value={option.value}>{option.label}</DropdownMenu.RadioItem>
						{/each}
					</DropdownMenu.RadioGroup>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>

		<!-- Checklist Scroll Container -->
		<div
			use:dndzone={{
				items: dragItems,
				flipDurationMs: 150,
				dropFromOthersDisabled: true,
				dropTargetStyle: {},
				delayTouchStart: 300
			}}
			onconsider={handleConsider}
			onfinalize={handleFinalize}
			class="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-3 text-xs"
		>
			{#each dragItems as item (item.id)}
				<div animate:flip={{ duration: 150 }}>
					{#if isShadowItem(item)}
						<div
							class="pointer-events-none visible! h-9 w-full rounded-lg border-2 border-dashed border-primary/50 bg-primary/10 opacity-100!"
						></div>
					{:else}
						<ChecklistRow
							{item}
							{terms}
							state={states.get(item.id) ?? { status: 'open', termName: null, termIndex: null }}
							onToggle={() => updateItem(item.id, { completed: !item.completed })}
							onDelete={() => deleteItem(item.id)}
							onUpdate={(changes) => updateItem(item.id, changes)}
							onPlace={(termId) => placeItem(item, termId)}
						/>
					{/if}
				</div>
			{/each}
			{#if dragItems.length === 0 && items.length > 0}
				<p class="px-1 py-6 text-center text-[11px] text-muted-foreground">
					No courses here (・_・)
				</p>
			{/if}
		</div>

		<!-- Add Course Input -->
		<div class="border-t border-border/40 p-3">
			<form
				onsubmit={(e) => {
					e.preventDefault();
					addItem();
				}}
				class="flex gap-1.5"
			>
				<Input
					type="text"
					bind:value={newItemLabel}
					placeholder="Add a course..."
					class="h-8 bg-background/40 text-xs backdrop-blur-xs"
				/>
				<Button type="submit" size="sm" class="h-8 px-2.5" aria-label="Add course">
					<Plus size={14} />
				</Button>
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								type="button"
								variant="outline"
								size="sm"
								class="h-8 px-2.5"
								aria-label="Paste a list of courses"
								onclick={() => (isPasteOpen = true)}
							>
								<ClipboardList size={14} />
							</Button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>Paste a list</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</form>
		</div>
	{/if}
</div>

<Dialog.Root bind:open={isPasteOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Paste a course list</Dialog.Title>
			<Dialog.Description>
				One course per line, as a code or a code and units, like CCPROG1, 3. Courses already on your
				checklist get updated.
			</Dialog.Description>
		</Dialog.Header>

		<textarea
			bind:value={pasteText}
			rows="8"
			aria-label="Course list"
			placeholder={PASTE_PLACEHOLDER}
			class="w-full rounded-md border border-input bg-background/40 p-2 font-mono text-xs text-foreground focus:ring-1 focus:ring-ring focus:outline-none"
		></textarea>

		<Dialog.Footer>
			<Button variant="outline" onclick={() => (isPasteOpen = false)}>Cancel</Button>
			<Button onclick={addPasted} disabled={pasted.length === 0}>
				Add {pasted.length}
				{pasted.length === 1 ? 'course' : 'courses'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={isResetOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Reset your checklist?</Dialog.Title>
			<Dialog.Description>
				{settings.mode === 'dlsu'
					? 'This replaces your list with the default DLSU GE courses.'
					: 'This clears your list.'} Your terms and grades stay as they are, but courses you added and
				manual checks are removed.
			</Dialog.Description>
		</Dialog.Header>

		<Dialog.Footer>
			<Button variant="outline" onclick={() => (isResetOpen = false)}>Cancel</Button>
			<Button variant="destructive" onclick={resetChecklist}>Reset checklist</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
