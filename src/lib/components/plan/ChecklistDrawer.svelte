<script lang="ts">
	import { appStore } from '$lib/stores/appState';
	import ChecklistPanel from '$lib/components/plan/ChecklistPanel.svelte';
	import { ChevronUp } from 'lucide-svelte';
	import { cn } from '$lib/utils.js';

	let isOpen = $state(false);
	let isDragging = $state(false);
</script>

<!-- Not a modal sheet: a course dragged out of here has to reach the term cards behind it -->
<div class="relative z-30 shrink-0 border-t border-border/40 bg-card">
	<button
		type="button"
		aria-expanded={isOpen}
		onclick={() => (isOpen = !isOpen)}
		class="flex h-11 w-full items-center justify-between px-4 text-xs font-medium text-foreground"
	>
		<span>Checklist ({$appStore.courseChecklist.length})</span>
		<ChevronUp size={16} class={cn('transition-transform', isOpen && 'rotate-180')} />
	</button>

	<div
		class={cn(
			'overflow-hidden transition-[height] duration-200 motion-reduce:transition-none',
			isOpen && !isDragging ? 'h-[55dvh]' : 'h-0'
		)}
	>
		<ChecklistPanel embedded onDragChange={(dragging) => (isDragging = dragging)} />
	</div>
</div>
