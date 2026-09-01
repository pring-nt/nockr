<script lang="ts">
    import type { GEItem } from '$lib/schemas';
    import { SquareCheck, Square, Trash2, Pencil } from 'lucide-svelte';
    import { cn } from '$lib/utils.js';

    let {
        item,
        onToggle,
        onDelete,
        onUpdateLabel
    }: {
        item: GEItem;
        onToggle: () => void;
        onDelete: () => void;
        onUpdateLabel: (newLabel: string) => void;
    } = $props();

    let isEditing = $state(false);
    let editLabel = $state(item.label);

    function startEditing() {
        editLabel = item.label;
        isEditing = true;
    }

    function commitEdit() {
        if (editLabel.trim()) {
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
    'group flex items-center justify-between gap-1.5 rounded-md border p-2 text-xs transition-colors',
    item.completed
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
                onclick={onToggle}
                class="flex min-w-0 flex-1 items-center gap-2 truncate text-left"
        >
            {#if item.completed}
                <SquareCheck size={14} class="shrink-0 text-primary" />
            {:else}
                <Square size={14} class="shrink-0 text-muted-foreground/60" />
            {/if}
            <span class={cn('truncate', item.completed && 'line-through opacity-80')}>
        {item.label}
      </span>
        </button>

        <div class="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
                    onclick={startEditing}
                    class="text-muted-foreground hover:text-foreground"
                    title="Edit label"
            >
                <Pencil size={12} />
            </button>
            <button
                    onclick={onDelete}
                    class="text-muted-foreground hover:text-destructive"
                    title="Delete GE"
            >
                <Trash2 size={12} />
            </button>
        </div>
    {/if}
</div>