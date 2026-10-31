<script lang="ts">
	import type { ShareRow } from '$lib/logic/share';

	let { rows, class: className = '' }: { rows: ShareRow[]; class?: string } = $props();
</script>

<div class="grid gap-1 text-[26px] leading-snug {className}">
	{#each rows as row (row.id)}
		<div class="flex justify-between gap-6 {row.isMuted ? 'opacity-75' : ''}">
			<span class="share-truncate min-w-0">{row.label}</span>
			{#if row.value}
				<span class="shrink-0">{row.value}</span>
			{/if}
		</div>
	{/each}
</div>
