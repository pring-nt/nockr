<script lang="ts">
	import { appStore } from '$lib/stores/appState';
	import { tween } from '$lib/motion';
	import ChecklistPanel from '$lib/components/plan/ChecklistPanel.svelte';
	import { ChevronUp } from 'lucide-svelte';
	import { cn } from '$lib/utils.js';

	let isOpen = $state(false);
	let isDragging = $state(false);

	// Anime can't convert to dvh, so this resolves the 55dvh height to pixels when it toggles
	let height = $derived(
		isOpen && !isDragging ? `${Math.round(window.innerHeight * 0.55)}px` : '0px'
	);
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

	<div use:tween={{ styles: { height } }} class="overflow-hidden" style="height: 0px">
		<ChecklistPanel
			embedded
			onDragChange={(dragging) => (isDragging = dragging)}
			onPlace={() => (isOpen = false)}
		/>
	</div>
</div>
