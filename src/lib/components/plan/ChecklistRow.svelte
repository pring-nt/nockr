<script lang="ts">
	import { untrack } from 'svelte';
	import type { ChecklistItem, CourseType, Term } from '$lib/schemas';
	import type { ChecklistState } from '$lib/logic/checklist';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import {
		CalendarPlus,
		CircleX,
		EllipsisVertical,
		Pencil,
		Square,
		SquareCheck,
		Trash2
	} from 'lucide-svelte';
	import { cn } from '$lib/utils.js';

	let {
		item,
		state: itemState,
		terms,
		onToggle,
		onDelete,
		onUpdate,
		onPlace
	}: {
		item: ChecklistItem;
		state: ChecklistState;
		terms: Term[];
		onToggle: () => void;
		onDelete: () => void;
		onUpdate: (changes: Partial<ChecklistItem>) => void;
		onPlace: (termId: string) => void;
	} = $props();

	let isEditing = $state(false);
	let editLabel = $state(untrack(() => item.label));
	let editUnits = $state(untrack(() => item.units));

	let isDone = $derived(itemState.status === 'done');
	let minUnits = $derived(item.type === 'graded' ? 1 : 0);

	let statusLabel = $derived(
		itemState.status === 'failed' ? `Failed in ${itemState.termName}` : itemState.termName
	);

	function startEditing() {
		editLabel = item.label;
		editUnits = item.units;
		isEditing = true;
	}

	function commitEdit() {
		const label = editLabel.trim();
		if (label) {
			onUpdate({ label, units: Math.max(minUnits, Math.min(12, Math.trunc(editUnits) || 0)) });
		}
		isEditing = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			commitEdit();
		} else if (e.key === 'Escape') {
			isEditing = false;
		}
	}

	function handleBlur(e: FocusEvent) {
		const next = e.relatedTarget as Node | null;
		if (!(e.currentTarget as HTMLElement).contains(next)) commitEdit();
	}

	function focusOnMount(node: HTMLInputElement) {
		node.focus();
		node.select();
	}
</script>

<div
	class={cn(
		'group flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors md:gap-2 md:px-2.5 md:py-2 md:text-xs',
		isEditing ? 'cursor-auto' : 'cursor-grab active:cursor-grabbing',
		isDone && 'border-primary/30 bg-primary/5 text-foreground',
		itemState.status === 'failed' && 'border-destructive/30 bg-destructive/5 text-foreground',
		itemState.status === 'planned' && 'border-border/70 bg-card text-foreground',
		itemState.status === 'open' &&
			'border-border/50 bg-card text-muted-foreground hover:text-foreground'
	)}
>
	{#if isEditing}
		<div class="flex min-w-0 flex-1 items-center gap-2" onfocusout={handleBlur}>
			<input
				aria-label="Course name"
				class="min-w-0 flex-1 border-b border-primary bg-transparent text-xs font-medium text-foreground focus:outline-none"
				bind:value={editLabel}
				onkeydown={handleKeydown}
				use:focusOnMount
			/>
			<input
				aria-label="Units"
				type="number"
				min={minUnits}
				max="12"
				class="w-8 border-b border-primary bg-transparent text-center font-mono text-xs text-foreground focus:outline-none"
				bind:value={editUnits}
				onkeydown={handleKeydown}
			/>
		</div>
	{:else}
		<button
			type="button"
			onclick={onToggle}
			aria-label={isDone ? 'Mark as not done' : 'Mark as done'}
			aria-pressed={isDone}
			class="shrink-0"
		>
			{#if isDone}
				<SquareCheck size={16} class="text-primary" />
			{:else if itemState.status === 'failed'}
				<CircleX size={16} class="text-destructive" />
			{:else}
				<Square size={16} class="text-muted-foreground/60" />
			{/if}
		</button>

		<div class="min-w-0 flex-1" role="presentation" ondblclick={startEditing}>
			<p class={cn('truncate leading-snug font-medium', isDone && 'line-through opacity-80')}>
				{item.label}
			</p>
			{#if statusLabel}
				<p
					class={cn(
						'mt-0.5 truncate text-[11px] md:text-[10px]',
						itemState.status === 'failed' ? 'text-destructive' : 'text-muted-foreground'
					)}
				>
					{statusLabel}
				</p>
			{/if}
		</div>

		<span
			class="shrink-0 font-mono text-xs text-muted-foreground md:text-[10px]"
			title="{item.units} {item.units === 1 ? 'unit' : 'units'}"
		>
			{item.units}{item.type === 'graded' ? '' : '*'}
		</span>

		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="ghost"
						size="icon"
						class="h-8 w-8 shrink-0 text-muted-foreground/60 hover:text-foreground md:h-6 md:w-6"
						aria-label="Options for {item.label}"
					>
						<EllipsisVertical size={13} />
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>

			<DropdownMenu.Content align="start" class="w-52">
				{#if terms.length > 0}
					<DropdownMenu.Sub>
						<DropdownMenu.SubTrigger>
							<CalendarPlus size={14} />
							Add to term
						</DropdownMenu.SubTrigger>
						<DropdownMenu.SubContent class="max-h-64 overflow-y-auto">
							{#each terms as term (term.id)}
								<DropdownMenu.Item onclick={() => onPlace(term.id)}>{term.name}</DropdownMenu.Item>
							{/each}
						</DropdownMenu.SubContent>
					</DropdownMenu.Sub>
				{/if}

				<DropdownMenu.Item onclick={startEditing}>
					<Pencil size={14} />
					Edit
				</DropdownMenu.Item>

				<DropdownMenu.Separator />

				<DropdownMenu.Label>Course type</DropdownMenu.Label>
				<DropdownMenu.RadioGroup
					value={item.type}
					onValueChange={(value) => {
						const type = value as CourseType;
						onUpdate({ type, units: type === 'graded' ? Math.max(1, item.units) : item.units });
					}}
				>
					<DropdownMenu.RadioItem value="graded">Graded</DropdownMenu.RadioItem>
					<DropdownMenu.RadioItem value="non-academic">Non-academic</DropdownMenu.RadioItem>
					<DropdownMenu.RadioItem value="credited">Credited</DropdownMenu.RadioItem>
				</DropdownMenu.RadioGroup>

				<DropdownMenu.Separator />

				<DropdownMenu.Item variant="destructive" onclick={onDelete}>
					<Trash2 size={14} />
					Remove from checklist
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	{/if}
</div>
