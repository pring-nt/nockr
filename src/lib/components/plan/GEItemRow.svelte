<script lang="ts">
	import { untrack } from 'svelte';
	import type { GEItem } from '$lib/schemas';
	import { SquareCheck, Square, Trash2, Pencil } from 'lucide-svelte';
	import { cn } from '$lib/utils.js';

	let {
		item,
		isAutoCompleted = false,
		onToggle,
		onDelete,
		onUpdateLabel
	}: {
		item: GEItem;
		isAutoCompleted?: boolean;
		onToggle: () => void;
		onDelete: () => void;
		onUpdateLabel: (newLabel: string) => void;
	} = $props();

	let isEditing = $state(false);
	let editLabel = $state(untrack(() => item.label));

	let isChecked = $derived(item.completed || isAutoCompleted);

	function startEditing() {
		editLabel = item.label;
		isEditing = true;
	}

	function commitEdit() {
		if (editLabel.trim() && editLabel.trim() !== item.label) {
			onUpdateLabel(editLabel.trim());
		}
		isEditing = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			commitEdit();
		} else if (e.key === 'Escape') {
			editLabel = item.label;
			isEditing = false;
		}
	}

	function focusOnMount(node: HTMLInputElement) {
		node.focus();
	}
</script>

<div
	class={cn(
		'group flex items-center justify-between gap-2.5 rounded-lg border px-3 py-2.5 text-xs transition-colors',
		isChecked
			? 'border-primary/30 bg-primary/5 text-foreground'
			: 'border-border/50 bg-card text-muted-foreground hover:text-foreground'
	)}
>
	{#if isEditing}
		<input
			class="min-w-0 flex-1 border-b border-primary bg-transparent text-xs font-medium text-foreground focus:outline-none"
			bind:value={editLabel}
			onblur={commitEdit}
			onkeydown={handleKeydown}
			use:focusOnMount
		/>
	{:else}
		<button
			type="button"
			onclick={onToggle}
			ondblclick={startEditing}
			class="flex min-w-0 flex-1 items-center gap-2.5 truncate text-left"
		>
			{#if isChecked}
				<SquareCheck size={16} class="shrink-0 text-primary" />
			{:else}
				<Square size={16} class="shrink-0 text-muted-foreground/60" />
			{/if}
			<span class={cn('truncate font-medium', isChecked && 'line-through opacity-80')}>
				{item.label}
			</span>
		</button>

		<div
			class="flex shrink-0 items-center gap-2.5 opacity-0 transition-opacity group-hover:opacity-100"
		>
			<button
				type="button"
				onclick={startEditing}
				class="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
				title="Edit label"
			>
				<Pencil size={13} />
			</button>
			<button
				type="button"
				onclick={onDelete}
				class="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
				title="Delete GE"
			>
				<Trash2 size={13} />
			</button>
		</div>
	{/if}
</div>
